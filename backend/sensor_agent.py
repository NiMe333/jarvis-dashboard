#!/usr/bin/env python3
"""Read-only, token-protected hardware metrics endpoint for a Proxmox host."""

import hmac
import json
import os
import re
import shutil
import socket
import subprocess
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def env(name, default=""):
    return os.environ.get(name, default).strip()


TOKEN = env("SENSOR_AGENT_TOKEN")
ALLOWED_IPS = {value.strip() for value in env("SENSOR_AGENT_ALLOWED_IPS").split(",") if value.strip()}
NODE_NAME = env("SENSOR_AGENT_NODE_NAME")
HOST = env("SENSOR_AGENT_HOST", "0.0.0.0")
PORT = int(env("SENSOR_AGENT_PORT", "3100"))
CACHE_SECONDS = 3
CACHE = None
CACHE_LOCK = threading.Lock()

if len(TOKEN) < 32:
    raise RuntimeError("SENSOR_AGENT_TOKEN must contain at least 32 characters")
if not ALLOWED_IPS:
    raise RuntimeError("SENSOR_AGENT_ALLOWED_IPS is required")
if not NODE_NAME:
    raise RuntimeError("SENSOR_AGENT_NODE_NAME is required")


def read_text(path):
    try:
        return Path(path).read_text().strip()
    except (OSError, UnicodeDecodeError):
        return None


def number(value):
    try:
        return float(str(value).strip().lstrip("<>"))
    except (TypeError, ValueError):
        return None


def nullable_number(value):
    return value if value is not None and value == value else None


def command_json(arguments, timeout):
    try:
        result = subprocess.run(arguments, capture_output=True, text=True, timeout=timeout, check=False)
        return json.loads(result.stdout) if result.stdout else None
    except (OSError, subprocess.TimeoutExpired, json.JSONDecodeError):
        return None


def executable(name, locations=()):
    return shutil.which(name) or next((path for path in locations if Path(path).is_file()), None)


def sensors():
    chips = command_json(["sensors", "-j"], 3)
    cpu_temperatures, temperatures, cpu_temperature, fan_rpm = [], [], None, None
    if not isinstance(chips, dict):
        return {"available": False, "cpuTemperature": None, "cpuTemperatures": [], "temperatures": [], "fanRpm": None}
    for chip_name, chip in chips.items():
        lower_name = chip_name.lower()
        for label, values in (chip or {}).items():
            if not isinstance(values, dict):
                continue
            temperature = next((number(value) for key, value in values.items() if re.fullmatch(r"temp\d+_input", key)), None)
            if temperature is not None and lower_name.startswith("coretemp-"):
                reading = {"label": label.upper(), "temperature": temperature}
                cpu_temperatures.append(reading)
                if label.lower() == "package id 0":
                    cpu_temperature = temperature
            elif temperature is not None and lower_name.startswith(("ftsteutates-", "pch_skylake-")):
                temperatures.append({"sensor": lower_name.split("-")[0], "channel": label, "temperature": temperature})
            rpm = next((number(value) for key, value in values.items() if re.fullmatch(r"fan\d+_input", key)), None)
            if fan_rpm is None and rpm is not None and rpm > 0:
                fan_rpm = rpm
    return {
        "available": True,
        "cpuTemperature": cpu_temperature if cpu_temperature is not None else (cpu_temperatures[0]["temperature"] if cpu_temperatures else None),
        "cpuTemperatures": cpu_temperatures,
        "temperatures": temperatures,
        "fanRpm": fan_rpm,
    }


def smart_metrics():
    smartctl = executable("smartctl", ("/usr/sbin/smartctl", "/usr/bin/smartctl"))
    metrics = {}
    if not smartctl:
        return metrics
    devices = [path.name for path in Path("/sys/block").iterdir() if re.fullmatch(r"(?:sd[a-z]+|nvme\d+n\d+)", path.name)][:8]
    for device in devices:
        payload = command_json([smartctl, "-j", "-a", f"/dev/{device}"], 5)
        if not isinstance(payload, dict):
            continue
        temperature = number((payload.get("temperature") or {}).get("current"))
        if temperature is None:
            for item in ((payload.get("ata_smart_attributes") or {}).get("table") or []):
                if re.search(r"temperature|airflow_temperature", str(item.get("name", "")), re.I):
                    temperature = number((item.get("raw") or {}).get("value"))
                    break
        smart_health = (payload.get("smart_status") or {}).get("passed")
        smart_health = smart_health if isinstance(smart_health, bool) else None
        model = payload.get("model_name") if isinstance(payload.get("model_name"), str) else None
        metrics[f"/dev/{device}"] = {"temperature": temperature, "smartHealth": smart_health, "model": model}
    return metrics


def block_disks():
    lsblk = executable("lsblk", ("/usr/bin/lsblk", "/bin/lsblk"))
    payload = command_json([lsblk, "--json", "--bytes", "--output", "NAME,PATH,TYPE,SIZE,MODEL,MOUNTPOINTS"], 4) if lsblk else None
    return (payload or {}).get("blockdevices") if isinstance(payload, dict) else []


def descendants(device):
    yield device
    for child in device.get("children") or []:
        yield from descendants(child)


def disk_for_mount(disks, mount_point):
    for disk in disks:
        for item in descendants(disk):
            if mount_point in (item.get("mountpoints") or []):
                return disk
    return None


def filesystem_usage(mount_point, label):
    try:
        usage = shutil.disk_usage(mount_point)
        used_percent = usage.used / usage.total * 100 if usage.total else None
        return {
            "label": label,
            "used": usage.used,
            "total": usage.total,
            "free": usage.free,
            "percent": used_percent,
        }
    except OSError:
        return None


def lvm_thin_pool_usage():
    lvs = executable("lvs", ("/usr/sbin/lvs", "/sbin/lvs"))
    payload = command_json([lvs, "--reportformat", "json", "--units", "b", "--nosuffix", "-o", "lv_name,lv_size,data_percent,lv_attr"], 4) if lvs else None
    reports = (payload or {}).get("report") if isinstance(payload, dict) else []
    logical_volumes = reports[0].get("lv") if reports and isinstance(reports[0], dict) else []
    if not isinstance(logical_volumes, list):
        return None
    pool = next((item for item in logical_volumes if item.get("lv_name") == "data" and str(item.get("lv_attr", "")).startswith("t")), None)
    if not pool:
        pool = next((item for item in logical_volumes if str(item.get("lv_attr", "")).startswith("t")), None)
    if not pool:
        return None
    total = number(pool.get("lv_size"))
    percent = number(pool.get("data_percent"))
    if total is None or percent is None:
        return None
    total_bytes = int(total)
    used = total_bytes * percent / 100
    return {
        "label": "PROXMOX LVM THIN POOL",
        "used": used,
        "total": total_bytes,
        "free": max(0, total_bytes - used),
        "percent": percent,
    }


def proxmox_system_usage():
    root = filesystem_usage("/", "ROOT FILESYSTEM")
    pool = lvm_thin_pool_usage()
    if not root or not pool:
        return pool or root
    total = root["total"] + pool["total"]
    used = root["used"] + pool["used"]
    return {
        "label": "PROXMOX ROOT + THIN POOL",
        "used": used,
        "total": total,
        "free": root["free"] + pool["free"],
        "percent": used / total * 100 if total else None,
    }


def storage_devices():
    disks = block_disks()
    smart = smart_metrics()
    system_disk = disk_for_mount(disks, "/")
    data_disk = disk_for_mount(disks, "/mnt/storage")
    definitions = [
        ("system", "SYSTEM SSD", system_disk, "/ + local-lvm", proxmox_system_usage()),
        ("data", "DATA SSD", data_disk, "/mnt/storage", filesystem_usage("/mnt/storage", "MOUNTED FILESYSTEM")),
    ]
    result = []
    for role, name, disk, mount_point, usage in definitions:
        if not isinstance(disk, dict):
            continue
        device = disk.get("path")
        smart_data = smart.get(device, {})
        physical_total = number(disk.get("size"))
        result.append({
            "id": role,
            "role": role,
            "name": name,
            "device": device,
            "model": smart_data.get("model") or disk.get("model") or None,
            "physicalTotal": physical_total,
            "mountPoint": mount_point,
            "usage": usage,
            "temperature": smart_data.get("temperature"),
            "smartHealth": smart_data.get("smartHealth"),
        })
    return result


def cpu_usage():
    def sample():
        fields = (read_text("/proc/stat") or "").splitlines()[0].split()[1:]
        values = [number(value) or 0 for value in fields]
        return sum(values), (values[3] if len(values) > 3 else 0) + (values[4] if len(values) > 4 else 0)
    first_total, first_idle = sample()
    time.sleep(0.25)
    second_total, second_idle = sample()
    total = second_total - first_total
    return max(0, min(100, (1 - (second_idle - first_idle) / total) * 100)) if total > 0 else None


def memory():
    values = {}
    for line in (read_text("/proc/meminfo") or "").splitlines():
        match = re.match(r"^(MemTotal|MemAvailable):\s+(\d+)", line)
        if match:
            values[match.group(1)] = int(match.group(2)) * 1024
    total, available = values.get("MemTotal"), values.get("MemAvailable")
    return {"total": total, "available": available, "used": total - available if total is not None and available is not None else None}


def root_storage():
    try:
        usage = shutil.disk_usage("/")
        return {"total": usage.total, "used": usage.used, "free": usage.free, "filesystem": None}
    except OSError:
        return None


def rapl_power():
    roots = [path for path in Path("/sys/class/powercap").glob("intel-rapl:*") if path.is_dir() and re.fullmatch(r"intel-rapl:\d+", path.name)]
    first = [(path, number(read_text(path / "energy_uj")), number(read_text(path / "max_energy_range_uj"))) for path in roots]
    if not first:
        return None
    start = time.monotonic()
    time.sleep(0.15)
    delta, readable = 0, 0
    for path, energy, maximum in first:
        next_energy = number(read_text(path / "energy_uj"))
        if energy is None or next_energy is None:
            continue
        value = next_energy - energy if next_energy >= energy else (maximum or 0) - energy + next_energy
        if value >= 0:
            delta, readable = delta + value, readable + 1
    elapsed = time.monotonic() - start
    return delta / 1_000_000 / elapsed if readable and elapsed > 0 else None


def process_count():
    try:
        return sum(1 for path in Path("/proc").iterdir() if path.name.isdigit())
    except OSError:
        return None


def collect():
    local_host = socket.gethostname().split(".")[0]
    if local_host != NODE_NAME.split(".")[0] or not Path("/etc/pve").is_dir():
        return unavailable()
    sensor_data = sensors()
    storage_devices_data = storage_devices()
    legacy_ssd = next((disk for disk in storage_devices_data if disk["role"] == "data"), storage_devices_data[0] if storage_devices_data else {})
    return {
        "available": True,
        "cpuTemperature": sensor_data["cpuTemperature"],
        "ssdTemperature": legacy_ssd.get("temperature"),
        "ssdSmartHealth": legacy_ssd.get("smartHealth"),
        "ssdDevice": legacy_ssd.get("device"),
        "ssdModel": legacy_ssd.get("model"),
        "fanRpm": sensor_data["fanRpm"],
        "powerWatts": rapl_power(),
        "processCount": process_count(),
        "network": None,
        "cpuUsage": cpu_usage(),
        "memory": memory(),
        "storage": root_storage(),
        "storageDevices": storage_devices_data,
        "temperatures": sensor_data["temperatures"],
        "cpuTemperatures": sensor_data["cpuTemperatures"],
        "sensorsAvailable": sensor_data["available"],
        "identity": {"hostname": local_host, "uptimeSeconds": number((read_text("/proc/uptime") or "").split(" ")[0]), "kernelVersion": read_text("/proc/sys/kernel/osrelease")},
    }


def unavailable():
    return {"available": False, "cpuTemperature": None, "ssdTemperature": None, "ssdSmartHealth": None, "ssdDevice": None, "ssdModel": None, "fanRpm": None, "powerWatts": None, "processCount": None, "network": None, "cpuUsage": None, "memory": {"total": None, "used": None, "available": None}, "storage": None, "storageDevices": [], "temperatures": [], "cpuTemperatures": [], "sensorsAvailable": False, "identity": None}


def metrics():
    global CACHE
    with CACHE_LOCK:
        if CACHE and time.monotonic() - CACHE[0] < CACHE_SECONDS:
            return CACHE[1]
        value = collect()
        CACHE = (time.monotonic(), value)
        return value


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path != "/metrics":
            self.send_error(404)
            return
        authorized = hmac.compare_digest(self.headers.get("Authorization", ""), f"Bearer {TOKEN}")
        if self.client_address[0] not in ALLOWED_IPS or not authorized:
            self.send_error(403)
            return
        body = json.dumps(metrics()).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, _format, *_args):
        pass


if __name__ == "__main__":
    print(f"JARVIS sensor agent listening on http://{HOST}:{PORT}", flush=True)
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
