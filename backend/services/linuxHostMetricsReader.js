import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import os from "node:os";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function readText(path) {
  try {
    return (await readFile(path, "utf8")).trim();
  } catch {
    return null;
  }
}

async function listDirectories(path) {
  try {
    return (await readdir(path, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() || entry.isSymbolicLink())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

function finiteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeTemperature(value) {
  const number = finiteNumber(value);
  if (number === null) return null;
  return number > 1000 ? number / 1000 : number;
}

async function readLmSensors() {
  let stdout = "";
  try {
    ({ stdout } = await execFileAsync("sensors", ["-j"], {
      timeout: 3_000,
      maxBuffer: 512 * 1024,
    }));
  } catch {
    return {
      available: false,
      cpuTemperature: null,
      cpuTemperatures: [],
      temperatures: [],
      fanRpm: null,
    };
  }

  try {
    const chips = JSON.parse(stdout);
    const cpuTemperatures = [];
    const temperatures = [];
    let cpuTemperature = null;
    let fanRpm = null;

    for (const [chipName, chip] of Object.entries(chips)) {
      const isCoreTemp = chipName.toLowerCase().startsWith("coretemp-");
      const isFujitsu = chipName.toLowerCase().startsWith("ftsteutates-");
      const isPch = chipName.toLowerCase().startsWith("pch_skylake-");
      for (const [label, values] of Object.entries(chip ?? {})) {
        if (!values || typeof values !== "object") continue;
        const temperature = normalizeTemperature(Object.entries(values)
          .find(([key]) => /^temp\d+_input$/.test(key))?.[1]);
        if (temperature !== null && isCoreTemp) {
          const reading = { label: label.toUpperCase(), temperature };
          cpuTemperatures.push(reading);
          if (label.toLowerCase() === "package id 0") cpuTemperature = temperature;
        } else if (temperature !== null && isFujitsu) {
          temperatures.push({ sensor: "ftsteutates", channel: label, temperature });
        } else if (temperature !== null && isPch) {
          temperatures.push({ sensor: "pch_skylake", channel: label, temperature });
        }

        const rpm = finiteNumber(Object.entries(values)
          .find(([key]) => /^fan\d+_input$/.test(key))?.[1]);
        // The tested ftsteutates channels return FAULT/0. Zero is unavailable,
        // never a valid fan speed.
        if (rpm !== null && rpm > 0 && fanRpm === null) fanRpm = rpm;
      }
    }

    return {
      available: true,
      cpuTemperature: cpuTemperature ?? cpuTemperatures[0]?.temperature ?? null,
      cpuTemperatures,
      temperatures,
      fanRpm,
    };
  } catch {
    return {
      available: false,
      cpuTemperature: null,
      cpuTemperatures: [],
      temperatures: [],
      fanRpm: null,
    };
  }
}

async function readCpuTemperature() {
  const zones = await listDirectories("/sys/class/thermal");
  const candidates = [];

  for (const zone of zones.filter((name) => name.startsWith("thermal_zone"))) {
    const type = (await readText(`/sys/class/thermal/${zone}/type`))?.toLowerCase() ?? "";
    const temperature = normalizeTemperature(await readText(`/sys/class/thermal/${zone}/temp`));
    if (temperature !== null) candidates.push({ type, temperature });
  }

  const preferred = candidates.find(({ type }) => /x86_pkg_temp|cpu|coretemp|package/.test(type));
  if (preferred) return preferred.temperature;

  const hwmons = await listDirectories("/sys/class/hwmon");
  for (const hwmon of hwmons) {
    const root = `/sys/class/hwmon/${hwmon}`;
    const name = (await readText(`${root}/name`))?.toLowerCase() ?? "";
    if (!/coretemp|k10temp|zenpower|cpu/.test(name)) continue;

    const entries = await listFileNames(root);
    for (const entry of entries.filter((item) => /^temp\d+_input$/.test(item))) {
      const temperature = normalizeTemperature(await readText(`${root}/${entry}`));
      if (temperature !== null) return temperature;
    }
  }

  return candidates[0]?.temperature ?? null;
}

async function readCpuTemperatures() {
  const readings = [];
  for (const hwmon of await listDirectories("/sys/class/hwmon")) {
    const root = `/sys/class/hwmon/${hwmon}`;
    const name = (await readText(`${root}/name`))?.toLowerCase() ?? "";
    if (!/coretemp|k10temp|zenpower|cpu/.test(name)) continue;
    for (const entry of (await listFileNames(root)).filter((item) => /^temp\d+_input$/.test(item))) {
      const index = entry.match(/^temp(\d+)_input$/)?.[1];
      const temperature = normalizeTemperature(await readText(`${root}/${entry}`));
      if (temperature === null || !index) continue;
      const label = await readText(`${root}/temp${index}_label`);
      readings.push({ label: label?.toUpperCase() ?? `CPU SENSOR ${index}`, temperature });
    }
  }
  return readings;
}

async function readAdditionalTemperatures() {
  const readings = [];
  for (const hwmon of await listDirectories("/sys/class/hwmon")) {
    const root = `/sys/class/hwmon/${hwmon}`;
    const name = (await readText(`${root}/name`))?.toLowerCase() ?? "";
    if (!name || /coretemp|k10temp|zenpower|cpu/.test(name)) continue;
    for (const entry of (await listFileNames(root)).filter((item) => /^temp\d+_input$/.test(item))) {
      const temperature = normalizeTemperature(await readText(`${root}/${entry}`));
      if (temperature !== null) readings.push({ sensor: name, channel: entry.replace("_input", ""), temperature });
    }
  }
  return readings;
}

async function readCpuUsage() {
  const sample = async () => {
    const line = (await readText("/proc/stat"))?.split("\n").find((entry) => entry.startsWith("cpu "));
    const values = line?.trim().split(/\s+/).slice(1).map(Number) ?? [];
    const idle = (values[3] ?? 0) + (values[4] ?? 0);
    const total = values.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
    return { idle, total };
  };
  const first = await sample();
  await wait(250);
  const second = await sample();
  const total = second.total - first.total;
  const idle = second.idle - first.idle;
  return total > 0 ? Math.max(0, Math.min(100, (1 - idle / total) * 100)) : null;
}

async function readMemory() {
  const values = {};
  for (const line of (await readText("/proc/meminfo"))?.split("\n") ?? []) {
    const match = line.match(/^(MemTotal|MemAvailable|MemFree|Buffers|Cached):\s+(\d+)/);
    if (match) values[match[1]] = Number(match[2]) * 1024;
  }
  const total = finiteNumber(values.MemTotal);
  const available = finiteNumber(values.MemAvailable);
  return { total, available, used: total === null || available === null ? null : Math.max(0, total - available) };
}

async function readRootStorage() {
  try {
    const { stdout } = await execFileAsync("df", ["-P", "-k", "/"], { timeout: 2_000 });
    const fields = stdout.trim().split("\n").at(-1)?.trim().split(/\s+/) ?? [];
    const total = Number(fields[1]) * 1024;
    const used = Number(fields[2]) * 1024;
    const free = Number(fields[3]) * 1024;
    return [total, used, free].every(Number.isFinite) ? { total, used, free, filesystem: fields[0] } : null;
  } catch { return null; }
}

async function readSystemIdentity() {
  const [hostname, uptime, kernel] = await Promise.all([
    readText("/etc/hostname"), readText("/proc/uptime"), readText("/proc/sys/kernel/osrelease"),
  ]);
  return { hostname: hostname || os.hostname(), uptimeSeconds: finiteNumber(uptime?.split(/\s+/)[0]), kernelVersion: kernel };
}

async function listFileNames(path) {
  try {
    return await readdir(path);
  } catch {
    return [];
  }
}

async function readFanRpm() {
  const hwmons = await listDirectories("/sys/class/hwmon");
  for (const hwmon of hwmons) {
    const root = `/sys/class/hwmon/${hwmon}`;
    const entries = await listFileNames(root);
    for (const entry of entries.filter((item) => /^fan\d+_input$/.test(item))) {
      const rpm = finiteNumber(await readText(`${root}/${entry}`));
      if (rpm !== null && rpm > 0) return rpm;
    }
  }
  return null;
}

async function readRaplPowerWatts() {
  const domains = await listDirectories("/sys/class/powercap");
  const roots = domains
    .filter((name) => /^intel-rapl:\d+$/.test(name))
    .map((name) => `/sys/class/powercap/${name}`);
  if (roots.length === 0) return null;

  const first = await Promise.all(roots.map(async (root) => ({
    root,
    energy: finiteNumber(await readText(`${root}/energy_uj`)),
    maximum: finiteNumber(await readText(`${root}/max_energy_range_uj`)),
  })));
  const start = process.hrtime.bigint();
  await wait(150);
  const elapsedSeconds = Number(process.hrtime.bigint() - start) / 1_000_000_000;
  const second = await Promise.all(first.map(({ root }) =>
    readText(`${root}/energy_uj`).then(finiteNumber)));

  let energyDelta = 0;
  let readableDomains = 0;
  first.forEach(({ energy, maximum }, index) => {
    const next = second[index];
    if (energy === null || next === null) return;
    const delta = next >= energy ? next - energy : (maximum ?? 0) - energy + next;
    if (delta >= 0) {
      energyDelta += delta;
      readableDomains += 1;
    }
  });

  return readableDomains > 0 && elapsedSeconds > 0
    ? energyDelta / 1_000_000 / elapsedSeconds
    : null;
}

function smartTemperature(payload) {
  const direct = finiteNumber(payload?.temperature?.current);
  if (direct !== null) return direct;

  const table = payload?.ata_smart_attributes?.table;
  if (!Array.isArray(table)) return null;
  const attribute = table.find((entry) =>
    /temperature|airflow_temperature/i.test(entry?.name ?? ""));
  return finiteNumber(attribute?.raw?.value);
}

async function locateSmartctl() {
  const candidates = ["/usr/sbin/smartctl", "/usr/bin/smartctl"];
  return candidates.find(existsSync) ?? "smartctl";
}

async function readSsdMetrics() {
  const devices = (await listDirectories("/sys/block"))
    .filter((name) => /^(sd[a-z]+|nvme\d+n\d+)$/.test(name))
    .slice(0, 8);
  if (devices.length === 0) return { temperature: null, smartHealth: null, device: null, model: null };

  const smartctl = await locateSmartctl();
  for (const device of devices) {
    let stdout = "";
    try {
      ({ stdout } = await execFileAsync(smartctl, ["-j", "-a", `/dev/${device}`], {
        timeout: 5_000,
        maxBuffer: 2 * 1024 * 1024,
      }));
    } catch (error) {
      // smartctl uses a status bitmask and can return useful JSON even when a
      // health bit is set. Missing binaries and permission errors have no JSON.
      stdout = typeof error?.stdout === "string" ? error.stdout : "";
    }

    try {
      if (!stdout) continue;
      const payload = JSON.parse(stdout);
      const temperature = smartTemperature(payload);
      const smartHealth = typeof payload?.smart_status?.passed === "boolean"
        ? payload.smart_status.passed
        : null;
      const model = typeof payload?.model_name === "string" ? payload.model_name : null;
      if (temperature !== null || smartHealth !== null || model !== null) {
        return {
          temperature,
          smartHealth,
          device: `/dev/${device}`,
          model,
        };
      }
    } catch {
      // Unsupported devices or incomplete output are unavailable.
    }
  }

  return { temperature: null, smartHealth: null, device: null, model: null };
}

async function defaultNetworkInterface() {
  const routes = (await readText("/proc/net/route"))?.split("\n") ?? [];
  for (const line of routes.slice(1)) {
    const fields = line.trim().split(/\s+/);
    if (fields[1] === "00000000" && (Number.parseInt(fields[3], 16) & 2) === 2) {
      return fields[0];
    }
  }
  return null;
}

async function networkCounters(interfaceName) {
  if (!interfaceName) return null;
  const lines = (await readText("/proc/net/dev"))?.split("\n") ?? [];
  const line = lines.find((entry) => entry.trim().startsWith(`${interfaceName}:`));
  if (!line) return null;
  const values = line.slice(line.indexOf(":") + 1).trim().split(/\s+/).map(Number);
  if (!Number.isFinite(values[0]) || !Number.isFinite(values[8])) return null;
  return { received: values[0], transmitted: values[8] };
}

async function readNetworkMetrics() {
  const interfaceName = await defaultNetworkInterface();
  const first = await networkCounters(interfaceName);
  if (!first) return {
    interfaceName,
    received: null,
    transmitted: null,
    downloadRate: null,
    uploadRate: null,
  };

  const start = process.hrtime.bigint();
  await wait(250);
  const second = await networkCounters(interfaceName);
  const elapsedSeconds = Number(process.hrtime.bigint() - start) / 1_000_000_000;
  if (!second || elapsedSeconds <= 0) return { interfaceName, ...first, downloadRate: null, uploadRate: null };

  return {
    interfaceName,
    ...second,
    downloadRate: Math.max(0, second.received - first.received) * 8 / elapsedSeconds / 1_000_000,
    uploadRate: Math.max(0, second.transmitted - first.transmitted) * 8 / elapsedSeconds / 1_000_000,
  };
}

async function readProcessCount() {
  try {
    const entries = await readdir("/proc");
    return entries.filter((entry) => /^\d+$/.test(entry)).length;
  } catch {
    return null;
  }
}

export class LinuxHostMetricsReader {
  constructor({ nodeName }) {
    const localHost = os.hostname().split(".")[0];
    const configuredNode = nodeName.split(".")[0];
    this.available = localHost === configuredNode && existsSync("/etc/pve");
  }

  async read() {
    if (!this.available) {
      return {
        available: false,
        cpuTemperature: null,
        ssdTemperature: null,
        ssdSmartHealth: null,
        ssdDevice: null,
        ssdModel: null,
        fanRpm: null,
        powerWatts: null,
        processCount: null,
        network: null,
        cpuUsage: null,
        memory: { total: null, used: null, available: null },
        storage: null,
        temperatures: [],
        cpuTemperatures: [],
        identity: null,
      };
    }

    const [sensors, ssd, powerWatts, processCount, network, cpuUsage, memory, storage, identity] =
      await Promise.all([
        readLmSensors(),
        readSsdMetrics(),
        readRaplPowerWatts(),
        readProcessCount(),
        readNetworkMetrics(),
        readCpuUsage(),
        readMemory(),
        readRootStorage(),
        readSystemIdentity(),
      ]);

    return {
      available: true,
      cpuTemperature: sensors.cpuTemperature,
      ssdTemperature: ssd.temperature,
      ssdSmartHealth: ssd.smartHealth,
      ssdDevice: ssd.device,
      ssdModel: ssd.model,
      fanRpm: sensors.fanRpm,
      powerWatts,
      processCount,
      network,
      cpuUsage,
      memory,
      storage,
      temperatures: sensors.temperatures,
      cpuTemperatures: sensors.cpuTemperatures,
      sensorsAvailable: sensors.available,
      identity,
    };
  }
}
