/**
 * Shared API contract used by the frontend client and backend router.
 * The field lists are documentation and a stable integration boundary; values
 * are intentionally not coupled to the current mock implementation.
 */
export const API_ENDPOINTS = Object.freeze({
  health: "/api/health",
  system: "/api/system",
  resources: "/api/resources",
  network: "/api/network",
  temperature: "/api/temperature",
  services: "/api/services",
  events: "/api/events",
  quickActions: "/api/quick-actions",
  restart: "/api/actions/restart",
});

export const API_RESPONSE_FIELDS = Object.freeze({
  health: ["status", "source", "timestamp", "uptimeSeconds", "node", "hostMetricsAvailable", "unavailableSources"],
  system: ["header", "systemOverview", "overviewStatus", "core", "hostTelemetry", "virtualization"],
  resources: [
    "cpuUsage", "cpuState", "memoryUsed", "memoryTotal", "memoryAvailable",
    "storageUsed", "storageTotal", "storageFree", "loadAverage", "uptime",
    "processCount", "cpuCount", "swapUsed", "swapTotal",
    "rootStorageUsed", "rootStorageTotal", "rootStorageFree",
    "warnings",
  ],
  network: [
    "downloadRate", "uploadRate", "totalReceived", "totalTransmitted",
    "totalsWindow", "networkInterface", "networkSeries",
  ],
  temperature: [
    "cpuTemperature", "ssdTemperature", "powerWatts", "fanRpm",
    "additionalTemperatures", "cpuTemperatures", "sensorStatus", "sensorStates", "sensorSource", "ssdSmartHealth", "ssdDevice", "ssdModel",
  ],
  service: [
    "id", "name", "description", "icon", "url", "status", "statusLabel",
    "statusDetails", "kind", "vmid", "node", "cpuUsage", "cpuCount",
    "memoryUsed", "memoryTotal", "storageUsed", "storageTotal",
    "networkReceived", "networkTransmitted", "uptime",
  ],
  event: ["id", "timestamp", "message", "type", "serviceId"],
  quickAction: ["id", "label", "icon", "url", "description", "enabled"],
});
