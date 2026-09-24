import { DashboardService } from "./dashboardService.js";
import { systemMockData } from "../mock-data/system.js";
import { resourcesMockData } from "../mock-data/resources.js";
import { networkMockData } from "../mock-data/network.js";
import { temperatureMockData } from "../mock-data/temperature.js";
import { servicesMockData } from "../mock-data/services.js";
import { eventsMockData } from "../mock-data/events.js";
import { quickActionsMockData } from "../mock-data/quickActions.js";

const copy = (value) => structuredClone(value);

export class MockDashboardService extends DashboardService {
  async getHealth() {
    return {
      status: "ok",
      source: "mock",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  async getSystem() { return copy(systemMockData); }
  async getResources() { return copy(resourcesMockData); }
  async getNetwork() { return copy(networkMockData); }
  async getTemperature() { return copy(temperatureMockData); }
  async getServices() { return copy(servicesMockData); }
  async getEvents() { return copy(eventsMockData); }
  async getQuickActions() { return copy(quickActionsMockData); }
}
