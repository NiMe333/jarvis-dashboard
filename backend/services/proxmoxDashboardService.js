import { DashboardService } from "./dashboardService.js";
import { LinuxHostMetricsReader } from "./linuxHostMetricsReader.js";
import { quickActionsMockData } from "../mock-data/quickActions.js";

const GIB = 1024 ** 3;

function finiteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function round(value, digits = 1) {
  const number = finiteNumber(value);
  if (number === null) return null;
  const scale = 10 ** digits;
  return Math.round(number * scale) / scale;
}

function bytesToGiB(value) {
  const bytes = finiteNumber(value);
  return bytes === null ? null : round(bytes / GIB, 1);
}

function percentage(value) {
  const ratio = finiteNumber(value);
  return ratio === null ? null : round(Math.max(0, Math.min(1, ratio)) * 100, 1);
}

function formatUptime(totalSeconds) {
  const seconds = finiteNumber(totalSeconds);
  if (seconds === null) return null;
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
}

function safeArray(result) {
  return result?.status === "fulfilled" && Array.isArray(result.value) ? result.value : [];
}

function safeObject(result) {
  return result?.status === "fulfilled" && result.value && typeof result.value === "object"
    ? result.value
    : {};
}

function taskType(task) {
  const status = String(task.status ?? "").toUpperCase();
  if (status === "OK") return "success";
  if (task.endtime && status && status !== "OK") return "error";
  return "info";
}

function taskServiceId(task) {
  if (!task.id) return null;
  if (/^(qm|qemu)/i.test(task.type ?? "")) return `qemu-${task.id}`;
  if (/^(vz|lxc|pct)/i.test(task.type ?? "")) return `lxc-${task.id}`;
  return null;
}

function taskMessage(task) {
  const operation = String(task.type ?? "task").replace(/[-_]+/g, " ").toUpperCase();
  const target = task.id ? ` ${task.id}` : "";
  const status = task.status ? ` · ${task.status}` : " · RUNNING";
  return `${operation}${target}${status}`;
}

function taskTimestamp(task) {
  const seconds = finiteNumber(task.starttime);
  return seconds === null ? "" : new Date(seconds * 1000).toISOString();
}

function taskId(task, index) {
  return task.upid ?? `${task.node ?? "node"}-${task.starttime ?? 0}-${task.type ?? "task"}-${index}`;
}

function guestStatus(value) {
  if (value === "running") return "running";
  if (value === "stopped") return "stopped";
  if (value === "paused") return "warning";
  return "unknown";
}

function guestService(guest, kind, nodeName) {
  const status = guestStatus(guest.status);
  const memoryUsed = bytesToGiB(guest.mem);
  const memoryTotal = bytesToGiB(guest.maxmem);
  const cpuUsage = percentage(guest.cpu);
  const details = [
    cpuUsage === null ? null : `CPU ${cpuUsage}%`,
    memoryUsed === null || memoryTotal === null ? null : `MEM ${memoryUsed}/${memoryTotal} GB`,
  ].filter(Boolean).join(" · ");

  return {
    id: `${kind}-${guest.vmid}`,
    name: guest.name || `${kind === "qemu" ? "VM" : "LXC"} ${guest.vmid}`,
    description: `${kind === "qemu" ? "Virtual machine" : "LXC container"} on ${nodeName}`,
    icon: kind === "qemu" ? "server" : "containers",
    url: null,
    status,
    statusLabel: status.toUpperCase(),
    statusDetails: details || null,
    kind,
    vmid: finiteNumber(guest.vmid),
    node: nodeName,
    cpuUsage,
    cpuCount: finiteNumber(guest.cpus),
    memoryUsed,
    memoryTotal,
    storageUsed: bytesToGiB(guest.disk),
    storageTotal: bytesToGiB(guest.maxdisk),
    networkReceived: finiteNumber(guest.netin),
    networkTransmitted: finiteNumber(guest.netout),
    uptime: finiteNumber(guest.uptime),
  };
}

function storageTotals(storage, rootfs = {}) {
  const active = storage.filter((item) => item.active !== 0 && item.enabled !== 0);
  const total = active.reduce((sum, item) => sum + (finiteNumber(item.total) ?? 0), 0);
  const used = active.reduce((sum, item) => sum + (finiteNumber(item.used) ?? 0), 0);
  if (total > 0) return { total, used, free: Math.max(0, total - used) };

  const rootTotal = finiteNumber(rootfs.total);
  const rootUsed = finiteNumber(rootfs.used);
  return {
    total: rootTotal,
    used: rootUsed,
    free: rootTotal !== null && rootUsed !== null ? Math.max(0, rootTotal - rootUsed) : null,
  };
}

export class ProxmoxDashboardService extends DashboardService {
  constructor({ client, nodeName, cacheTtlMs = 3_000 }) {
    super();
    this.client = client;
    this.nodeName = nodeName;
    this.cacheTtlMs = cacheTtlMs;
    this.hostMetricsReader = new LinuxHostMetricsReader({ nodeName });
    this.cachedSnapshot = null;
    this.snapshotPromise = null;
  }

  async loadSnapshot() {
    const node = encodeURIComponent(this.nodeName);
    const requests = await Promise.allSettled([
      this.client.get(`/nodes/${node}/status`),
      this.client.get(`/nodes/${node}/qemu`),
      this.client.get(`/nodes/${node}/lxc`),
      this.client.get(`/nodes/${node}/storage`, { enabled: 1 }),
      this.client.get(`/nodes/${node}/tasks`, { limit: 50, source: "all" }),
      this.client.get("/version"),
      this.hostMetricsReader.read(),
    ]);

    const [statusResult, qemuResult, lxcResult, storageResult, tasksResult, versionResult, hostResult] = requests;
    if (statusResult.status === "rejected") throw statusResult.reason;

    const snapshot = {
      collectedAt: new Date(),
      nodeStatus: safeObject(statusResult),
      qemu: safeArray(qemuResult),
      lxc: safeArray(lxcResult),
      storage: safeArray(storageResult),
      tasks: safeArray(tasksResult),
      version: safeObject(versionResult),
      host: safeObject(hostResult),
      available: {
        qemu: qemuResult.status === "fulfilled",
        lxc: lxcResult.status === "fulfilled",
        storage: storageResult.status === "fulfilled",
        tasks: tasksResult.status === "fulfilled",
        version: versionResult.status === "fulfilled",
        hostMetrics: hostResult.status === "fulfilled" && hostResult.value?.available === true,
      },
    };
    this.cachedSnapshot = snapshot;
    return snapshot;
  }

  async getSnapshot() {
    const age = this.cachedSnapshot ? Date.now() - this.cachedSnapshot.collectedAt.getTime() : Infinity;
    if (this.cachedSnapshot && age < this.cacheTtlMs) return this.cachedSnapshot;
    if (this.snapshotPromise) return this.snapshotPromise;

    this.snapshotPromise = this.loadSnapshot().finally(() => {
      this.snapshotPromise = null;
    });
    return this.snapshotPromise;
  }

  async getHealth() {
    const snapshot = await this.getSnapshot();
    return {
      status: "ok",
      source: "proxmox",
      timestamp: snapshot.collectedAt.toISOString(),
      uptimeSeconds: finiteNumber(snapshot.nodeStatus.uptime),
      node: this.nodeName,
      hostMetricsAvailable: snapshot.host.available === true,
      unavailableSources: Object.entries(snapshot.available)
        .filter(([, available]) => !available)
        .map(([source]) => source),
    };
  }

  async getSystem() {
    const snapshot = await this.getSnapshot();
    const { nodeStatus, tasks, version, host } = snapshot;
    const storage = storageTotals(snapshot.storage, nodeStatus.rootfs);
    const latestTask = [...tasks].sort((a, b) => (b.starttime ?? 0) - (a.starttime ?? 0))[0];
    const warning = host.ssdSmartHealth === false;
    const memoryTotal = bytesToGiB(nodeStatus.memory?.total);
    const storageTotal = bytesToGiB(storage.total);
    const pveVersion = version.version ?? version.release ?? nodeStatus.pveversion ?? null;

    return {
      header: {
        alertCount: host.ssdSmartHealth === false ? 1 : 0,
        systemStatus: warning ? "warning" : "operational",
      },
      systemOverview: {
        uptime: formatUptime(nodeStatus.uptime),
        hostname: this.nodeName,
        hypervisor: pveVersion ? `Proxmox VE ${pveVersion}` : "Proxmox VE",
        processor: nodeStatus.cpuinfo?.model ?? null,
        memory: memoryTotal === null ? null : `${memoryTotal} GB`,
        storage: storageTotal === null ? null : `${storageTotal} GB`,
      },
      overviewStatus: {
        lastEventTime: latestTask
          ? new Date((latestTask.starttime ?? 0) * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : null,
        lastEvent: latestTask ? taskMessage(latestTask) : null,
        state: warning ? "warning" : "nominal",
      },
      core: {
        cpuTemperature: finiteNumber(host.cpuTemperature),
        fanSpeed: finiteNumber(host.fanRpm),
        systemHealth: null,
        status: warning ? "warning" : "online",
      },
      virtualization: {
        runningVms: snapshot.available.qemu
          ? snapshot.qemu.filter((guest) => guest.status === "running").length
          : null,
        totalVms: snapshot.available.qemu ? snapshot.qemu.length : null,
        runningContainers: snapshot.available.lxc
          ? snapshot.lxc.filter((guest) => guest.status === "running").length
          : null,
        totalContainers: snapshot.available.lxc ? snapshot.lxc.length : null,
      },
    };
  }

  async getResources() {
    const snapshot = await this.getSnapshot();
    const { nodeStatus, host } = snapshot;
    const memoryTotalBytes = finiteNumber(nodeStatus.memory?.total);
    const memoryUsedBytes = finiteNumber(nodeStatus.memory?.used);
    const storage = storageTotals(snapshot.storage, nodeStatus.rootfs);
    const cpuUsage = percentage(nodeStatus.cpu);
    const cpuCount = finiteNumber(nodeStatus.cpuinfo?.cpus)
      ?? finiteNumber(nodeStatus.cpuinfo?.cores);

    return {
      cpuUsage,
      cpuCount,
      cpuState: cpuUsage !== null && cpuUsage > 0 ? "active" : "processing",
      memoryUsed: bytesToGiB(memoryUsedBytes),
      memoryTotal: bytesToGiB(memoryTotalBytes),
      memoryAvailable: memoryTotalBytes !== null && memoryUsedBytes !== null
        ? bytesToGiB(Math.max(0, memoryTotalBytes - memoryUsedBytes))
        : null,
      swapUsed: bytesToGiB(nodeStatus.swap?.used),
      swapTotal: bytesToGiB(nodeStatus.swap?.total),
      storageUsed: bytesToGiB(storage.used),
      storageTotal: bytesToGiB(storage.total),
      storageFree: bytesToGiB(storage.free),
      loadAverage: Array.isArray(nodeStatus.loadavg)
        ? nodeStatus.loadavg.map(finiteNumber)
        : null,
      uptime: formatUptime(nodeStatus.uptime),
      processCount: finiteNumber(host.processCount),
    };
  }

  async getNetwork() {
    const snapshot = await this.getSnapshot();
    const network = snapshot.host.network ?? {};
    const downloadRate = round(network.downloadRate, 2);
    const uploadRate = round(network.uploadRate, 2);
    const hasRates = downloadRate !== null || uploadRate !== null;

    return {
      downloadRate,
      uploadRate,
      totalReceived: finiteNumber(network.received),
      totalTransmitted: finiteNumber(network.transmitted),
      networkInterface: network.interfaceName ?? null,
      networkSeries: hasRates
        ? [{ offsetSeconds: 0, downloadRate, uploadRate }]
        : [],
    };
  }

  async getTemperature() {
    const snapshot = await this.getSnapshot();
    const host = snapshot.host;
    const cpuTemperature = round(host.cpuTemperature, 1);
    const ssdTemperature = round(host.ssdTemperature, 1);
    const powerWatts = round(host.powerWatts, 1);
    const fanRpm = round(host.fanRpm, 0);
    const hasSensor = [cpuTemperature, ssdTemperature, powerWatts, fanRpm]
      .some((value) => value !== null);
    const sensorStatus = host.ssdSmartHealth === false
      ? "warning"
      : hasSensor ? "normal" : "unavailable";

    return {
      cpuTemperature,
      ssdTemperature,
      ssdSmartHealth: host.ssdSmartHealth ?? null,
      ssdDevice: host.ssdDevice ?? null,
      powerWatts,
      fanRpm,
      sensorStatus,
      sensorStates: {
        cpuTemperature: cpuTemperature === null ? "unavailable" : "normal",
        ssdTemperature: host.ssdSmartHealth === false
          ? "warning"
          : ssdTemperature === null ? "unavailable" : "normal",
        powerWatts: powerWatts === null ? "unavailable" : "normal",
      },
    };
  }

  async getServices() {
    const snapshot = await this.getSnapshot();
    return [
      ...snapshot.qemu.map((guest) => guestService(guest, "qemu", this.nodeName)),
      ...snapshot.lxc.map((guest) => guestService(guest, "lxc", this.nodeName)),
    ].sort((a, b) => (a.vmid ?? 0) - (b.vmid ?? 0));
  }

  async getEvents() {
    const snapshot = await this.getSnapshot();
    return [...snapshot.tasks]
      .sort((a, b) => (b.starttime ?? 0) - (a.starttime ?? 0))
      .map((task, index) => ({
        id: taskId(task, index),
        timestamp: taskTimestamp(task),
        message: taskMessage(task),
        type: taskType(task),
        serviceId: taskServiceId(task),
      }));
  }

  async getQuickActions() {
    return structuredClone(quickActionsMockData);
  }
}
