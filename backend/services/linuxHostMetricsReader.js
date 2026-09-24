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
  if (devices.length === 0) return { temperature: null, smartHealth: null, device: null };

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
      if (temperature !== null || smartHealth !== null) {
        return { temperature, smartHealth, device: `/dev/${device}` };
      }
    } catch {
      // Unsupported devices or incomplete output are unavailable.
    }
  }

  return { temperature: null, smartHealth: null, device: null };
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
        fanRpm: null,
        powerWatts: null,
        processCount: null,
        network: null,
      };
    }

    const [cpuTemperature, ssd, fanRpm, powerWatts, processCount, network] =
      await Promise.all([
        readCpuTemperature(),
        readSsdMetrics(),
        readFanRpm(),
        readRaplPowerWatts(),
        readProcessCount(),
        readNetworkMetrics(),
      ]);

    return {
      available: true,
      cpuTemperature,
      ssdTemperature: ssd.temperature,
      ssdSmartHealth: ssd.smartHealth,
      ssdDevice: ssd.device,
      fanRpm,
      powerWatts,
      processCount,
      network,
    };
  }
}
