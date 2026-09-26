import { API_ENDPOINTS } from "../../../shared/data-shapes.js";
import { runtimeConfig } from "../config/runtimeConfig.js";

function apiUrl(path) {
  if (!runtimeConfig.apiBaseUrl) {
    throw new Error("VITE_API_BASE_URL is not configured");
  }

  return `${runtimeConfig.apiBaseUrl}${path}`;
}

async function fetchJson(path, { signal } = {}) {
  const response = await fetch(apiUrl(path), {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Dashboard API returned ${response.status} for ${path}`);
  }

  return response.json();
}

export const dashboardApi = Object.freeze({
  getHealth: (options) => fetchJson(API_ENDPOINTS.health, options),
  getSystem: (options) => fetchJson(API_ENDPOINTS.system, options),
  getResources: (options) => fetchJson(API_ENDPOINTS.resources, options),
  getNetwork: (options) => fetchJson(API_ENDPOINTS.network, options),
  getTemperature: (options) => fetchJson(API_ENDPOINTS.temperature, options),
  getServices: (options) => fetchJson(API_ENDPOINTS.services, options),
  getEvents: (options) => fetchJson(API_ENDPOINTS.events, options),
  getQuickActions: (options) => fetchJson(API_ENDPOINTS.quickActions, options),
});

export async function loadDashboardData({ signal } = {}) {
  const entries = [
    ["health", dashboardApi.getHealth],
    ["system", dashboardApi.getSystem],
    ["resources", dashboardApi.getResources],
    ["network", dashboardApi.getNetwork],
    ["temperature", dashboardApi.getTemperature],
    ["services", dashboardApi.getServices],
    ["events", dashboardApi.getEvents],
    ["quickActions", dashboardApi.getQuickActions],
  ];
  const results = await Promise.allSettled(
    entries.map(([, request]) => request({ signal })),
  );
  const payload = {};
  const errors = {};

  results.forEach((result, index) => {
    const [name] = entries[index];
    if (result.status === "fulfilled") {
      payload[name] = result.value;
      if (import.meta.env.DEV) console.info(`[dashboard-api] ${name}`, result.value);
    } else {
      errors[name] = result.reason;
      if (import.meta.env.DEV) console.error(`[dashboard-api] ${name} failed`, result.reason);
    }
  });

  return { ...payload, errors };
}
