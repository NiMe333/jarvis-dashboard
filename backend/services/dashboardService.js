/**
 * Interface documentation for dashboard data providers.
 * A future ProxmoxDashboardService must implement these methods and preserve
 * the response shapes defined in shared/data-shapes.js.
 */
export class DashboardService {
  getHealth() { throw new Error("getHealth() is not implemented"); }
  getSystem() { throw new Error("getSystem() is not implemented"); }
  getResources() { throw new Error("getResources() is not implemented"); }
  getNetwork() { throw new Error("getNetwork() is not implemented"); }
  getTemperature() { throw new Error("getTemperature() is not implemented"); }
  getServices() { throw new Error("getServices() is not implemented"); }
  getEvents() { throw new Error("getEvents() is not implemented"); }
  getQuickActions() { throw new Error("getQuickActions() is not implemented"); }
}
