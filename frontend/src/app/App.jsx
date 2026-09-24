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

export default function App() {
  const data = useDashboardData();

  return (
    <DashboardShell>
      <div className="dashboard-layout">
        <DashboardHeader data={data.header} className="dashboard-layout__header" />

        <div className="dashboard-layout__left">
          <SystemOverview telemetry={data.systemOverview} status={data.overviewStatus} />
          <LiveResourcesPanel data={data.metrics} className="dashboard-layout__resource" />
          <NetworkThroughputPanel data={data.metrics} className="dashboard-layout__network" />
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
          <RecentEventsPanel events={data.recentEvents} className="dashboard-layout__events" />
        </div>

        <div className="dashboard-layout__right">
          <ServicesPanel services={data.services} className="dashboard-layout__services" />
          <TemperaturePowerPanel data={data.metrics} className="dashboard-layout__temperature" />
          <QuickActionsPanel actions={data.quickActions} className="dashboard-layout__actions" />
        </div>
      </div>
    </DashboardShell>
  );
}
