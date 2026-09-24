import { dashboardCopy } from "./dashboardContent.js";

/**
 * Frontend-only mock data. This file is the single replacement boundary for
 * future backend responses; none of these values represent live system state.
 *
 * Service: { id, name, description, icon, url, status, statusLabel, statusDetails }
 * Event: { id, timestamp, message, type, serviceId }
 * Quick action: { id, label, icon, url }
 * Metrics: {
 *   cpuUsage, memoryUsed, memoryTotal, memoryAvailable,
 *   storageUsed, storageTotal, storageFree, loadAverage, uptime, processCount,
 *   cpuTemperature, ssdTemperature, powerWatts, fanRpm, sensorStatus,
 *   downloadRate, uploadRate, totalReceived, totalTransmitted, networkInterface,
 *   networkSeries, sensorStates
 * }
 */

const serviceRuntimeData = [
  { id: "mock-hypervisor", icon: "server", url: null, status: "unknown" },
  { id: "mock-container-runtime", icon: "containers", url: null, status: "running" },
  { id: "mock-backup-service", icon: "database", url: null, status: "warning" },
  { id: "mock-dns-gateway", icon: "network", url: null, status: "stopped" },
  { id: "mock-remote-access", icon: "shield", url: null, status: "unknown" },
  { id: "mock-worker-node", icon: "activity", url: null, status: "running" },
  { id: "mock-media-service", icon: "activity", url: null, status: "warning" },
  { id: "mock-storage-node", icon: "database", url: null, status: "running" },
  { id: "mock-edge-proxy", icon: "network", url: null, status: "stopped" },
  { id: "mock-security-agent", icon: "shield", url: null, status: "running" },
  { id: "mock-database-cluster", icon: "database", url: null, status: "unknown" },
  { id: "mock-automation-engine", icon: "containers", url: null, status: "running" },
];

const services = serviceRuntimeData.map((service) => ({
  id: service.id,
  ...dashboardCopy.services.catalog[service.id],
  icon: service.icon,
  url: service.url,
  status: service.status,
  statusLabel: dashboardCopy.services.statusLabels[service.status]
    ?? dashboardCopy.services.statusLabels.unknown,
  statusDetails: dashboardCopy.services.mockValue,
}));

const eventRuntimeData = [
  { id: "mock-event-0012", timestamp: "2026-09-23T15:21:00+02:00", type: "info", serviceId: "mock-container-runtime" },
  { id: "mock-event-0011", timestamp: "2026-09-23T14:52:00+02:00", type: "success", serviceId: "mock-backup-service" },
  { id: "mock-event-0010", timestamp: "2026-09-23T12:33:00+02:00", type: "info", serviceId: "mock-dns-gateway" },
  { id: "mock-event-0009", timestamp: "2026-09-23T10:17:00+02:00", type: "warning", serviceId: "mock-edge-proxy" },
  { id: "mock-event-0008", timestamp: "2026-09-23T08:21:00+02:00", type: "success", serviceId: null },
  { id: "mock-event-0007", timestamp: "2026-09-23T07:46:00+02:00", type: "error", serviceId: "mock-storage-node" },
  { id: "mock-event-0006", timestamp: "2026-09-23T06:30:00+02:00", type: "info", serviceId: "mock-automation-engine" },
  { id: "mock-event-0005", timestamp: "2026-09-23T05:12:00+02:00", type: "warning", serviceId: null },
  { id: "mock-event-0004", timestamp: "2026-09-23T03:44:00+02:00", type: "success", serviceId: "mock-security-agent" },
  { id: "mock-event-0003", timestamp: "2026-09-23T02:18:00+02:00", type: "info", serviceId: "mock-worker-node" },
  { id: "mock-event-0002", timestamp: "2026-09-23T01:05:00+02:00", type: "warning", serviceId: "mock-remote-access" },
  { id: "mock-event-0001", timestamp: "2026-09-23T00:14:00+02:00", type: "info", serviceId: null },
];

const recentEvents = eventRuntimeData.map((event) => ({
  id: event.id,
  timestamp: event.timestamp,
  message: dashboardCopy.events.messages[event.id],
  type: event.type,
  serviceId: event.serviceId,
}));

const quickActionRuntimeData = [
  { id: "start-vm", icon: "start", url: "" },
  { id: "restart-service", icon: "restart", url: "" },
  { id: "open-proxmox", icon: "server", url: "" },
  { id: "open-home-assistant", icon: "home", url: "" },
  { id: "view-logs", icon: "logs", url: "" },
  { id: "system-update", icon: "update", url: "" },
];

const quickActions = quickActionRuntimeData.map((action) => ({
  id: action.id,
  label: dashboardCopy.quickActions.labels[action.id],
  icon: action.icon,
  url: action.url,
}));

export const dashboardMockData = Object.freeze({
  isMock: true,
  header: {
    alertCount: 0,
    systemStatus: "operational",
  },
  systemOverview: {
    uptime: "12d 07h 42m",
    hostname: "jarvis",
    hypervisor: "Proxmox VE 9.2.20",
    processor: "Intel Core i5-6500T",
    memory: "16 GB DDR4",
    storage: "256 GB",
  },
  overviewStatus: {
    lastEventTime: "19:42",
    lastEvent: dashboardCopy.events.messages.overviewBackupCompleted,
    state: "nominal",
  },
  core: {
    cpuTemperature: 42,
    fanSpeed: 1031,
    systemHealth: 100,
    status: "online",
  },
  virtualization: {
    runningVms: 2,
    totalVms: 3,
    runningContainers: 4,
    totalContainers: 5,
  },
  metrics: {
    cpuUsage: 18,
    cpuCount: 4,
    cpuState: "active",
    memoryUsed: 5.8,
    memoryTotal: 16,
    memoryAvailable: 10.2,
    storageUsed: 112,
    storageTotal: 256,
    storageFree: 144,
    loadAverage: [0.42, 0.38, 0.35],
    uptime: "12d 07h 42m",
    processCount: 142,
    swapUsed: 0.2,
    swapTotal: 2,
    downloadRate: 42.8,
    uploadRate: 8.4,
    totalReceived: 1_840_000_000_000,
    totalTransmitted: 426_000_000_000,
    networkInterface: "enp2s0",
    networkSeries: [
      { offsetSeconds: -60, downloadRate: 18.2, uploadRate: 3.2 },
      { offsetSeconds: -57, downloadRate: 24.6, uploadRate: 4.1 },
      { offsetSeconds: -54, downloadRate: 21.4, uploadRate: 3.8 },
      { offsetSeconds: -51, downloadRate: 31.8, uploadRate: 5.3 },
      { offsetSeconds: -48, downloadRate: 28.1, uploadRate: 4.7 },
      { offsetSeconds: -45, downloadRate: 37.5, uploadRate: 6.2 },
      { offsetSeconds: -42, downloadRate: 34.2, uploadRate: 5.7 },
      { offsetSeconds: -39, downloadRate: 46.8, uploadRate: 7.1 },
      { offsetSeconds: -36, downloadRate: 41.3, uploadRate: 6.5 },
      { offsetSeconds: -33, downloadRate: 52.4, uploadRate: 9.2 },
      { offsetSeconds: -30, downloadRate: 38.7, uploadRate: 6.8 },
      { offsetSeconds: -27, downloadRate: 35.4, uploadRate: 5.9 },
      { offsetSeconds: -24, downloadRate: 44.9, uploadRate: 7.4 },
      { offsetSeconds: -21, downloadRate: 49.6, uploadRate: 8.1 },
      { offsetSeconds: -18, downloadRate: 40.2, uploadRate: 7.2 },
      { offsetSeconds: -15, downloadRate: 47.1, uploadRate: 8.8 },
      { offsetSeconds: -12, downloadRate: 39.8, uploadRate: 6.9 },
      { offsetSeconds: -9, downloadRate: 45.6, uploadRate: 9.1 },
      { offsetSeconds: -6, downloadRate: 41.2, uploadRate: 7.7 },
      { offsetSeconds: -3, downloadRate: 43.7, uploadRate: 8.1 },
      { offsetSeconds: 0, downloadRate: 42.8, uploadRate: 8.4 },
    ],
    cpuTemperature: 48,
    ssdTemperature: 36,
    ssdSmartHealth: true,
    ssdDevice: "/dev/sda",
    powerWatts: 24,
    fanRpm: 1031,
    sensorStatus: "normal",
    sensorStates: {
      cpuTemperature: "normal",
      ssdTemperature: "normal",
      powerWatts: "estimated",
    },
  },
  services,
  recentEvents,
  quickActions,
});
