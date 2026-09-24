import { DashboardService } from "./dashboardService.js";
import { systemMockData } from "../mock-data/system.js";
import { resourcesMockData } from "../mock-data/resources.js";
import { networkMockData } from "../mock-data/network.js";
import { temperatureMockData } from "../mock-data/temperature.js";
import { servicesMockData } from "../mock-data/services.js";
import { eventsMockData } from "../mock-data/events.js";
import { quickActionsMockData } from "../mock-data/quickActions.js";

const copy = (value) => structuredClone(value);
const mockServiceResourceFields = Object.freeze({
  kind: null,
  vmid: null,
  node: null,
  cpuUsage: null,
  cpuCount: null,
  memoryUsed: null,
  memoryTotal: null,
  storageUsed: null,
  storageTotal: null,
  networkReceived: null,
  networkTransmitted: null,
  uptime: null,
});

export class MockDashboardService extends DashboardService {
  constructor({ fallbackReason = null } = {}) {
    super();
    this.fallbackReason = fallbackReason;
  }

  async getHealth() {
    return {
      status: "ok",
      source: "mock",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      node: null,
      hostMetricsAvailable: false,
      unavailableSources: [],
      ...(this.fallbackReason ? { fallbackReason: this.fallbackReason } : {}),
    };
  }

  async getSystem() { return copy(systemMockData); }
  async getResources() { return copy(resourcesMockData); }
  async getNetwork() { return copy(networkMockData); }
  async getTemperature() { return copy(temperatureMockData); }
  async getServices() {
    return servicesMockData.map((service) => ({
      ...mockServiceResourceFields,
      ...copy(service),
    }));
  }
  async getEvents() { return copy(eventsMockData); }
  async getQuickActions() { return copy(quickActionsMockData); }
}
