import { DashboardService } from "./dashboardService.js";
import { LinuxHostMetricsReader } from "./linuxHostMetricsReader.js";
import { evaluateHostWarnings } from "./hostWarningEvaluator.js";
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

function bytesToGiB(value, digits = 2) {
  const bytes = finiteNumber(value);
  return bytes === null ? null : round(bytes / GIB, digits);
}

function percentage(value) {
  const ratio = finiteNumber(value);
  return ratio === null ? null : round(Math.max(0, Math.min(1, ratio)) * 100, 2);
}

function bytesPerSecondToMbps(value) {
  const bytesPerSecond = finiteNumber(value);
  return bytesPerSecond === null ? null : round((bytesPerSecond * 8) / 1_000_000, 3);
}

function accumulatedBytes(points, key) {
  let total = 0;
  let hasSamples = false;
  for (let index = 1; index < points.length; index += 1) {
    const previousTime = finiteNumber(points[index - 1]?.time);
    const currentTime = finiteNumber(points[index]?.time);
    const previousRate = finiteNumber(points[index - 1]?.[key]);
    const currentRate = finiteNumber(points[index]?.[key]);
    if (previousTime === null || currentTime === null || previousRate === null || currentRate === null) continue;
    const elapsedSeconds = Math.max(0, currentTime - previousTime);
    hasSamples = true;
    total += ((previousRate + currentRate) / 2) * elapsedSeconds;
  }
  return hasSamples ? Math.round(total) : null;
}

function preferredNetworkInterface(interfaces) {
  return [...interfaces]
    .filter((item) => item?.iface && item.iface !== "lo")
    .sort((left, right) => {
      const score = (item) =>
        (item.active ? 8 : 0)
        + (item.autostart ? 4 : 0)
        + (item.type === "bridge" ? 3 : 0)
        + (item.type === "bond" ? 2 : 0);
      return score(right) - score(left);
    })[0]?.iface ?? null;
}

function proxmoxVersion(snapshot) {
  const value = snapshot.version.version
    ?? snapshot.version.release
    ?? snapshot.nodeStatus.pveversion
    ?? null;
  if (value === null) return null;
  const match = String(value).match(/(?:pve-manager\/)?([^/]+)/);
  return match?.[1] ?? String(value);
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
  constructor({
    client,
    nodeName,
    webUrl = "",
    restartEnabled = false,
    cacheTtlMs = 3_000,
    alertConfig,
    hostMetricsReader = new LinuxHostMetricsReader({ nodeName }),
  }) {
    super();
    this.client = client;
    this.nodeName = nodeName;
    this.webUrl = webUrl;
    this.restartEnabled = restartEnabled;
    this.cacheTtlMs = cacheTtlMs;
    this.hostMetricsReader = hostMetricsReader;
    this.alertConfig = alertConfig;
    this.cpuHighSince = null;
    this.cachedSnapshot = null;
    this.cachedServices = [];
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
      this.client.get(`/nodes/${node}/rrddata`, { timeframe: "hour" }),
      this.client.get(`/nodes/${node}/network`),
      this.client.get("/version"),
      this.hostMetricsReader.read(),
    ]);

    const [statusResult, qemuResult, lxcResult, storageResult, tasksResult, rrdResult, networkResult, versionResult, hostResult] = requests;
    if (statusResult.status === "rejected") throw statusResult.reason;

    const snapshot = {
      collectedAt: new Date(),
      nodeStatus: safeObject(statusResult),
      qemu: safeArray(qemuResult),
      lxc: safeArray(lxcResult),
      storage: safeArray(storageResult),
      tasks: safeArray(tasksResult),
      rrd: safeArray(rrdResult),
      network: safeArray(networkResult),
      version: safeObject(versionResult),
      host: safeObject(hostResult),
      available: {
        qemu: qemuResult.status === "fulfilled",
        lxc: lxcResult.status === "fulfilled",
        storage: storageResult.status === "fulfilled",
        tasks: tasksResult.status === "fulfilled",
        rrd: rrdResult.status === "fulfilled",
        network: networkResult.status === "fulfilled",
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
    const { nodeStatus, tasks, host } = snapshot;
    const storage = storageTotals(snapshot.storage, nodeStatus.rootfs);
    const latestTask = [...tasks].sort((a, b) => (b.starttime ?? 0) - (a.starttime ?? 0))[0];
    const warning = host.ssdSmartHealth === false;
    const memoryTotal = bytesToGiB(nodeStatus.memory?.total, 1);
    const storageTotal = bytesToGiB(storage.total, 1);
    const pveVersion = proxmoxVersion(snapshot);
    const bootInfo = nodeStatus["boot-info"] ?? {};
    const currentKernel = nodeStatus["current-kernel"] ?? {};

    const metrics = {
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
        status: warning ? "warning" : "online",
      },
      hostTelemetry: {
        cpuModel: nodeStatus.cpuinfo?.model ?? null,
        cpuFrequencyMHz: finiteNumber(nodeStatus.cpuinfo?.mhz),
        proxmoxVersion: pveVersion,
        kernelVersion: currentKernel.release ?? null,
        bootMode: bootInfo.mode ? String(bootInfo.mode).toUpperCase() : null,
        secureBoot: bootInfo.secureboot === 1
          ? "ENABLED"
          : bootInfo.secureboot === 0 ? "DISABLED" : null,
        hostStatus: warning ? "WARNING" : "ONLINE",
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
    return metrics;
  }

  async getResources() {
    const snapshot = await this.getSnapshot();
    const { nodeStatus, host } = snapshot;
    const localMemory = host.memory ?? {};
    const localStorage = host.storage ?? {};
    const memoryTotalBytes = finiteNumber(localMemory.total) ?? finiteNumber(nodeStatus.memory?.total);
    const memoryUsedBytes = finiteNumber(localMemory.used) ?? finiteNumber(nodeStatus.memory?.used);
    const storage = storageTotals(snapshot.storage, nodeStatus.rootfs);
    const cpuUsage = round(host.cpuUsage, 2) ?? percentage(nodeStatus.cpu);
    const cpuCount = finiteNumber(nodeStatus.cpuinfo?.cpus)
      ?? finiteNumber(nodeStatus.cpuinfo?.cores);

    const metrics = {
      cpuUsage,
      cpuCount,
      cpuState: cpuUsage !== null && cpuUsage > 0 ? "active" : "processing",
      memoryUsed: bytesToGiB(memoryUsedBytes),
      memoryTotal: bytesToGiB(memoryTotalBytes),
      memoryAvailable: bytesToGiB(localMemory.available),
      memoryDetails: localMemory,
      swap: host.swap ?? null,
      memoryPressure: host.memoryPressure ?? null,
      memoryHistory: Array.isArray(host.memoryHistory) ? host.memoryHistory : [],
      memoryHardware: host.memoryHardware ?? null,
      workload: host.workload ?? null,
      swapUsed: bytesToGiB(nodeStatus.swap?.used),
      swapTotal: bytesToGiB(nodeStatus.swap?.total),
      storageUsed: bytesToGiB(localStorage.used ?? storage.used),
      storageTotal: bytesToGiB(localStorage.total ?? storage.total),
      storageFree: bytesToGiB(localStorage.free ?? storage.free),
      rootStorageUsed: bytesToGiB(localStorage.used ?? nodeStatus.rootfs?.used),
      rootStorageTotal: bytesToGiB(localStorage.total ?? nodeStatus.rootfs?.total),
      rootStorageFree: bytesToGiB(localStorage.free ?? nodeStatus.rootfs?.avail ?? nodeStatus.rootfs?.free),
      loadAverage: Array.isArray(nodeStatus.loadavg)
        ? nodeStatus.loadavg.map(finiteNumber)
        : null,
      uptime: formatUptime(host.identity?.uptimeSeconds ?? nodeStatus.uptime),
      processCount: finiteNumber(host.processCount),
    };
    const warnings = evaluateHostWarnings({
      metrics,
      host,
      thresholds: this.alertConfig,
      cpuHighSince: this.cpuHighSince,
    });
    this.cpuHighSince = warnings.cpuHighSince;
    return { ...metrics, warnings: { status: warnings.status, alerts: warnings.alerts, unavailable: warnings.unavailable } };
  }

  async getNetwork() {
    const snapshot = await this.getSnapshot();
    const network = snapshot.host.network ?? {};
    const rrdPoints = snapshot.rrd
      .filter((point) => finiteNumber(point.time) !== null)
      .sort((a, b) => Number(a.time) - Number(b.time));
    const latestTime = finiteNumber(rrdPoints.at(-1)?.time);
    const networkSeries = rrdPoints.map((point) => ({
      offsetSeconds: latestTime === null ? 0 : finiteNumber(point.time) - latestTime,
      timestamp: new Date(Number(point.time) * 1000).toISOString(),
      downloadRate: bytesPerSecondToMbps(point.netin),
      uploadRate: bytesPerSecondToMbps(point.netout),
    }));
    const latestPoint = networkSeries.at(-1) ?? {};
    const downloadRate = latestPoint.downloadRate ?? round(network.downloadRate, 3);
    const uploadRate = latestPoint.uploadRate ?? round(network.uploadRate, 3);

    const directReceived = finiteNumber(network.received);
    const directTransmitted = finiteNumber(network.transmitted);
    const totalReceived = directReceived ?? accumulatedBytes(rrdPoints, "netin");
    const totalTransmitted = directTransmitted ?? accumulatedBytes(rrdPoints, "netout");

    return {
      downloadRate,
      uploadRate,
      totalReceived,
      totalTransmitted,
      totalsWindow: directReceived === null && directTransmitted === null
        && (totalReceived !== null || totalTransmitted !== null) ? "1H" : null,
      networkInterface: network.interfaceName ?? preferredNetworkInterface(snapshot.network),
      networkSeries,
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
      ssdModel: host.ssdModel ?? null,
      storageDevices: Array.isArray(host.storageDevices) ? host.storageDevices : [],
      sensorSource: host.sensorsAvailable
        ? "lm-sensors"
        : host.available ? "lm-sensors unavailable"
          : "backend is not running on the selected host",
      powerWatts,
      fanRpm,
      sensorStatus,
      additionalTemperatures: Array.isArray(host.temperatures) ? host.temperatures : [],
      cpuTemperatures: Array.isArray(host.cpuTemperatures) ? host.cpuTemperatures : [],
      sensorStates: {
        cpuTemperature: cpuTemperature === null ? "unavailable" : "normal",
        ssdTemperature: host.ssdSmartHealth === false
          ? "warning"
          : ssdTemperature === null ? "unavailable" : "normal",
        powerWatts: powerWatts === null ? "unavailable" : "normal",
        fans: fanRpm === null ? "unavailable" : "normal",
      },
    };
  }

  async getServices() {
    const snapshot = await this.getSnapshot();
    const availableKinds = {
      qemu: snapshot.available.qemu === true,
      lxc: snapshot.available.lxc === true,
    };

    if (!availableKinds.qemu && !availableKinds.lxc) {
      // Do not turn a transient Proxmox inventory failure into an empty list.
      // Throwing lets the frontend keep its last successful response instead.
      throw new Error("Proxmox guest inventory is unavailable");
    }

    const current = [
      ...(availableKinds.qemu ? snapshot.qemu.map((guest) => guestService(guest, "qemu", this.nodeName)) : []),
      ...(availableKinds.lxc ? snapshot.lxc.map((guest) => guestService(guest, "lxc", this.nodeName)) : []),
    ];
    const staleKinds = this.cachedServices.filter((service) => !availableKinds[service.kind]);
    const services = [...current, ...staleKinds]
      .sort((a, b) => (a.vmid ?? 0) - (b.vmid ?? 0));

    this.cachedServices = services;
    return services;
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
    return structuredClone(quickActionsMockData).filter((action) => ["restart-service", "open-proxmox"].includes(action.id)).map((action) =>
      action.id === "open-proxmox"
        ? { ...action, label: "Open Proxmox", url: this.webUrl || this.client.baseUrl }
        : { ...action, label: "Restart", description: "Restart the Proxmox host", enabled: this.restartEnabled });
  }

  async restart() {
    if (!this.restartEnabled) {
      return { accepted: false, reason: "Proxmox restart is disabled in the backend configuration" };
    }

    const node = encodeURIComponent(this.nodeName);
    const task = await this.client.post(`/nodes/${node}/status`, { command: "reboot" });
    return { accepted: true, task };
  }
}
