/**
 * @typedef {"info" | "warning" | "error" | "success"} EventSeverity
 * @typedef {Object} SystemEvent
 * @property {string} id
 * @property {string} timestamp ISO 8601 timestamp
 * @property {string} message
 * @property {EventSeverity} severity
 * @property {string} [serviceId]
 */

// These records are presentation samples, not observed system activity.
/** @type {ReadonlyArray<SystemEvent>} */
export const recentEventsMockData = Object.freeze([
  {
    id: "mock-event-0012",
    timestamp: "2026-09-23T15:21:00+02:00",
    message: "Mock event: container lifecycle sample completed",
    severity: "info",
    serviceId: "mock-container-runtime",
  },
  {
    id: "mock-event-0011",
    timestamp: "2026-09-23T14:52:00+02:00",
    message: "Mock event: backup workflow completed successfully",
    severity: "success",
    serviceId: "mock-backup-service",
  },
  {
    id: "mock-event-0010",
    timestamp: "2026-09-23T12:33:00+02:00",
    message: "Mock event: new network device sample detected",
    severity: "info",
    serviceId: "mock-dns-gateway",
  },
  {
    id: "mock-event-0009",
    timestamp: "2026-09-23T10:17:00+02:00",
    message: "Mock warning: request threshold sample exceeded",
    severity: "warning",
    serviceId: "mock-edge-proxy",
  },
  {
    id: "mock-event-0008",
    timestamp: "2026-09-23T08:21:00+02:00",
    message: "Mock event: system health check sample completed",
    severity: "success",
  },
  {
    id: "mock-event-0007",
    timestamp: "2026-09-23T07:46:00+02:00",
    message: "Mock error: storage connection sample unavailable",
    severity: "error",
    serviceId: "mock-storage-node",
  },
  {
    id: "mock-event-0006",
    timestamp: "2026-09-23T06:30:00+02:00",
    message: "Mock event: scheduled automation sample started",
    severity: "info",
    serviceId: "mock-automation-engine",
  },
  {
    id: "mock-event-0005",
    timestamp: "2026-09-23T05:12:00+02:00",
    message: "Mock warning: elevated temperature sample recorded",
    severity: "warning",
  },
  {
    id: "mock-event-0004",
    timestamp: "2026-09-23T03:44:00+02:00",
    message: "Mock event: security scan sample completed",
    severity: "success",
    serviceId: "mock-security-agent",
  },
  {
    id: "mock-event-0003",
    timestamp: "2026-09-23T02:18:00+02:00",
    message: "Mock event: worker queue sample synchronized",
    severity: "info",
    serviceId: "mock-worker-node",
  },
  {
    id: "mock-event-0002",
    timestamp: "2026-09-23T01:05:00+02:00",
    message: "Mock warning: remote access latency sample increased",
    severity: "warning",
    serviceId: "mock-remote-access",
  },
  {
    id: "mock-event-0001",
    timestamp: "2026-09-23T00:14:00+02:00",
    message: "Mock event: daily telemetry sample archived",
    severity: "info",
  },
]);
