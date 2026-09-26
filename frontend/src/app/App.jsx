import DashboardShell from "../components/layout/DashboardShell.jsx";
import HudPanel from "../components/panel/HudPanel.jsx";
import DashboardHeader from "../components/header/DashboardHeader.jsx";
import SystemOverview from "../components/overview/SystemOverview.jsx";
import JarvisCorePanel from "../components/core/JarvisCorePanel.jsx";
import ServicesPanel from "../components/services/ServicesPanel.jsx";
import RecentEventsPanel from "../components/events/RecentEventsPanel.jsx";
import QuickActionsPanel from "../components/actions/QuickActionsPanel.jsx";
import LiveResourcesPanel from "../components/resources/LiveResourcesPanel.jsx";
import NetworkThroughputPanel from "../components/network/NetworkThroughputPanel.jsx";
import TemperaturePowerPanel from "../components/sensors/TemperaturePowerPanel.jsx";
import { useDashboardData } from "../hooks/useDashboardData.js";
import "./DashboardLayout.css";

function DevelopmentDataStatus({ data }) {
  if (!import.meta.env.DEV) return null;

  const label = data.dataSource === "loading"
    ? "LOADING API DATA"
    : data.dataSource === "live"
      ? "LIVE PROXMOX DATA"
      : data.dataSource === "partial"
        ? "PARTIAL DATA"
        : "BACKEND OFFLINE";

  return (
    <output
      aria-live="polite"
      title={data.dataError ? `Failed endpoints: ${data.dataError.join(", ")}` : undefined}
      style={{ position: "fixed", zIndex: 20, right: 8, bottom: 8, padding: "4px 6px", color: "#8eeff2", background: "#031117", font: "10px monospace" }}
    >
      {label}{data.dataError ? ` · ${data.dataError.length} API ERROR${data.dataError.length === 1 ? "" : "S"}` : ""}
    </output>
  );
}

export default function App() {
  const data = useDashboardData();

  return (
    <DashboardShell>
      <DevelopmentDataStatus data={data} />
      <div className="dashboard-layout">
        <DashboardHeader data={data.header} className="dashboard-layout__header" />

        <div className="dashboard-layout__left">
          <SystemOverview telemetry={data.systemOverview} status={data.overviewStatus} />
          <LiveResourcesPanel data={data.metrics} dataSource={data.dataSource} className="dashboard-layout__resource" />
          <NetworkThroughputPanel data={data.metrics} dataSource={data.dataSource} className="dashboard-layout__network" />
        </div>

        <div className="dashboard-layout__center">
          <HudPanel
            className="dashboard-layout__core"
            frameStyle="core"
            shape="core"
            energy="pair"
            variant="large"
          >
            <JarvisCorePanel telemetry={data.core} />
          </HudPanel>
          <RecentEventsPanel events={data.recentEvents} dataSource={data.dataSource} className="dashboard-layout__events" />
        </div>

        <div className="dashboard-layout__right">
          <ServicesPanel services={data.services} className="dashboard-layout__services" />
          <TemperaturePowerPanel data={data.metrics} dataSource={data.dataSource} className="dashboard-layout__temperature" />
          <QuickActionsPanel actions={data.quickActions} className="dashboard-layout__actions" />
        </div>
      </div>
    </DashboardShell>
  );
}
