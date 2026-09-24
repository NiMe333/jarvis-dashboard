export const systemMockData = Object.freeze({
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
    lastEvent: "BACKUP COMPLETED",
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
});
