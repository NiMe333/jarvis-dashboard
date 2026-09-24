import { useEffect, useState } from "react";
import { loadDashboardData } from "../api/dashboardApi.js";
import { dashboardMockData } from "../config/dashboardMockData.js";
import { runtimeConfig } from "../config/runtimeConfig.js";

function mergeApiData(payload) {
  const system = payload.system && typeof payload.system === "object"
    ? payload.system
    : {};

  return {
    ...dashboardMockData,
    ...system,
    isMock: payload.health?.source === "mock",
    metrics: {
      ...dashboardMockData.metrics,
      ...payload.resources,
      ...payload.network,
      ...payload.temperature,
    },
    services: Array.isArray(payload.services)
      ? payload.services
      : dashboardMockData.services,
    recentEvents: Array.isArray(payload.events)
      ? payload.events
      : dashboardMockData.recentEvents,
    quickActions: Array.isArray(payload.quickActions)
      ? payload.quickActions
      : dashboardMockData.quickActions,
  };
}

export function useDashboardData() {
  const [data, setData] = useState(dashboardMockData);

  useEffect(() => {
    if (!runtimeConfig.apiBaseUrl) return undefined;

    const controller = new AbortController();

    loadDashboardData({ signal: controller.signal })
      .then((payload) => setData(mergeApiData(payload)))
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.warn("Dashboard API unavailable; using local mock data.", error);
        }
      });

    return () => controller.abort();
  }, []);

  return data;
}
