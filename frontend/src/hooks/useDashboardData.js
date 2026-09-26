import { useEffect, useState } from "react";
import { loadDashboardData } from "../api/dashboardApi.js";

const EMPTY_DASHBOARD_DATA = Object.freeze({
  header: Object.freeze({}),
  systemOverview: Object.freeze({}),
  overviewStatus: Object.freeze({}),
  core: Object.freeze({}),
  hostTelemetry: Object.freeze({}),
  virtualization: Object.freeze({}),
  metrics: Object.freeze({}),
  services: Object.freeze([]),
  recentEvents: Object.freeze([]),
  quickActions: Object.freeze([]),
  dataSource: "loading",
  dataError: null,
});

function mergeApiData(previous, payload) {
  const system = payload.system && typeof payload.system === "object" ? payload.system : null;
  const hasResources = payload.resources && typeof payload.resources === "object";
  const hasNetwork = payload.network && typeof payload.network === "object";

  return {
    ...previous,
    ...(system ?? {}),
    metrics: {
      ...previous.metrics,
      ...(hasResources ? payload.resources : {}),
      ...(hasNetwork ? payload.network : {}),
    },
    services: Array.isArray(payload.services)
      ? payload.services
      : previous.services,
    recentEvents: Array.isArray(payload.events)
      ? payload.events
      : previous.recentEvents,
    quickActions: Array.isArray(payload.quickActions)
      ? payload.quickActions
      : previous.quickActions,
  };
}

export function useDashboardData() {
  const [data, setData] = useState(EMPTY_DASHBOARD_DATA);

  useEffect(() => {
    const controller = new AbortController();

    const refresh = () => loadDashboardData({ signal: controller.signal })
      .then((payload) => {
        const successfulEndpoints = Object.keys(payload).filter((key) => key !== "errors");
        const failedEndpoints = Object.keys(payload.errors ?? {});
        const source = successfulEndpoints.length === 0
          ? "offline"
          : failedEndpoints.length > 0
            ? "partial"
            : "live";

        setData((current) => {
          if (source === "offline") {
            const offline = {
              ...EMPTY_DASHBOARD_DATA,
              dataSource: "offline",
              dataError: failedEndpoints,
            };
            if (import.meta.env.DEV) console.info("[dashboard] component data", offline);
            return offline;
          }

          const next = {
            ...mergeApiData(current, payload),
            dataSource: source,
            dataError: failedEndpoints.length > 0 ? failedEndpoints : null,
          };
          if (import.meta.env.DEV) console.info("[dashboard] component data", next);
          return next;
        });
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Dashboard API unavailable.", error);
          setData(() => ({
            ...EMPTY_DASHBOARD_DATA,
            dataSource: "offline",
            dataError: ["api"],
          }));
        }
      });

    refresh();
    const refreshTimer = window.setInterval(refresh, 15_000);

    return () => {
      window.clearInterval(refreshTimer);
      controller.abort();
    };
  }, []);

  return data;
}
