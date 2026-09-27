import { API_ENDPOINTS } from "../../shared/data-shapes.js";

export function createApiRoutes(service) {
  return new Map([
    [API_ENDPOINTS.health, () => service.getHealth()],
    [API_ENDPOINTS.system, () => service.getSystem()],
    [API_ENDPOINTS.resources, () => service.getResources()],
    [API_ENDPOINTS.network, () => service.getNetwork()],
    [API_ENDPOINTS.temperature, () => service.getTemperature()],
    [API_ENDPOINTS.services, () => service.getServices()],
    [API_ENDPOINTS.events, () => service.getEvents()],
    [API_ENDPOINTS.quickActions, () => service.getQuickActions()],
    [API_ENDPOINTS.restart, () => service.restart()],
  ]);
}
