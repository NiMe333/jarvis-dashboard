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
  const health = await dashboardApi.getHealth({ signal });

  const [system, resources, network, temperature, services, events, quickActions] =
    await Promise.all([
      dashboardApi.getSystem({ signal }),
      dashboardApi.getResources({ signal }),
      dashboardApi.getNetwork({ signal }),
      dashboardApi.getTemperature({ signal }),
      dashboardApi.getServices({ signal }),
      dashboardApi.getEvents({ signal }),
      dashboardApi.getQuickActions({ signal }),
    ]);

  return { health, system, resources, network, temperature, services, events, quickActions };
}
