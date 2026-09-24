/**
 * @typedef {"running" | "stopped" | "warning" | "unknown"} ServiceStatus
 * @typedef {Object} Service
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} icon
 * @property {string | null} url
 * @property {ServiceStatus} status
 * @property {string} [statusDetails]
 */

// Replace this array with backend data when the services endpoint is available.
// Names and status details deliberately identify these records as mock values.
/** @type {ReadonlyArray<Service>} */
export const servicesMockData = Object.freeze([
  {
    id: "mock-hypervisor",
    name: "Mock Hypervisor",
    description: "Virtualization host sample",
    icon: "server",
    url: "#services-panel",
    status: "unknown",
    statusDetails: "MOCK VALUE",
  },
  {
    id: "mock-container-runtime",
    name: "Mock Container Runtime",
    description: "Container platform sample",
    icon: "containers",
    url: null,
    status: "running",
    statusDetails: "MOCK VALUE",
  },
  {
    id: "mock-backup-service",
    name: "Mock Backup Service",
    description: "Snapshot workflow sample",
    icon: "database",
    url: null,
    status: "warning",
    statusDetails: "MOCK VALUE",
  },
  {
    id: "mock-dns-gateway",
    name: "Mock DNS Gateway",
    description: "Network filtering sample",
    icon: "network",
    url: null,
    status: "stopped",
    statusDetails: "MOCK VALUE",
  },
  {
    id: "mock-remote-access",
    name: "Mock Remote Access",
    description: "Secure tunnel sample",
    icon: "shield",
    url: null,
    status: "unknown",
    statusDetails: "MOCK VALUE",
  },
  {
    id: "mock-worker-node",
    name: "Mock Worker Node",
    description: "Background jobs sample",
    icon: "activity",
    url: null,
    status: "running",
    statusDetails: "MOCK VALUE",
  },
  {
    id: "mock-media-service",
    name: "Mock Media Service",
    description: "Media streaming sample",
    icon: "activity",
    url: null,
    status: "warning",
    statusDetails: "MOCK VALUE",
  },
  {
    id: "mock-storage-node",
    name: "Mock Storage Node",
    description: "Shared storage sample",
    icon: "database",
    url: null,
    status: "running",
    statusDetails: "MOCK VALUE",
  },
  {
    id: "mock-edge-proxy",
    name: "Mock Edge Proxy",
    description: "Reverse proxy sample",
    icon: "network",
    url: null,
    status: "stopped",
    statusDetails: "MOCK VALUE",
  },
  {
    id: "mock-security-agent",
    name: "Mock Security Agent",
    description: "Threat monitor sample",
    icon: "shield",
    url: null,
    status: "running",
    statusDetails: "MOCK VALUE",
  },
  {
    id: "mock-database-cluster",
    name: "Mock Database Cluster",
    description: "Application data sample",
    icon: "database",
    url: null,
    status: "unknown",
    statusDetails: "MOCK VALUE",
  },
  {
    id: "mock-automation-engine",
    name: "Mock Automation Engine",
    description: "Scheduled workflow sample",
    icon: "containers",
    url: null,
    status: "running",
    statusDetails: "MOCK VALUE",
  },
]);
