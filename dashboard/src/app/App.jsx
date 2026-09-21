import DashboardShell from "../components/layout/DashboardShell.jsx";
import HudPanel from "../components/panel/HudPanel.jsx";
import DashboardHeader from "../components/header/DashboardHeader.jsx";
import SystemOverview from "../components/overview/SystemOverview.jsx";
import JarvisCorePanel from "../components/core/JarvisCorePanel.jsx";
import { dashboardCopy } from "../config/dashboardContent.js";
import "./DashboardLayout.css";

export default function App() {
  return (
    <DashboardShell>
      <div className="dashboard-layout">
        <DashboardHeader className="dashboard-layout__header" />

        <div className="dashboard-layout__left">
          <SystemOverview />
          <HudPanel
            title={dashboardCopy.panels.liveResources.title}
            subtitle={dashboardCopy.panels.liveResources.subtitle}
            className="dashboard-layout__resource"
            frameStyle="open"
            variant="compact"
          />
          <HudPanel
            title={dashboardCopy.panels.network.title}
            subtitle={dashboardCopy.panels.network.subtitle}
            className="dashboard-layout__network"
            frameStyle="open"
            variant="compact"
          />
        </div>

        <div className="dashboard-layout__center">
          <HudPanel
            className="dashboard-layout__core"
            frameStyle="core"
            shape="core"
            energy="pair"
            variant="large"
          >
            <JarvisCorePanel />
          </HudPanel>
          <HudPanel
            title={dashboardCopy.panels.recentEvents.title}
            subtitle={dashboardCopy.panels.recentEvents.subtitle}
            className="dashboard-layout__events"
            frameStyle="open"
            variant="compact"
          />
        </div>

        <div className="dashboard-layout__right">
          <HudPanel
            title={dashboardCopy.panels.services.title}
            subtitle={dashboardCopy.panels.services.subtitle}
            className="dashboard-layout__services"
            frameStyle="open"
          />
          <HudPanel
            title={dashboardCopy.panels.temperature.title}
            subtitle={dashboardCopy.panels.temperature.subtitle}
            className="dashboard-layout__temperature"
            frameStyle="bracket"
          />
          <HudPanel
            title={dashboardCopy.panels.quickActions.title}
            subtitle={dashboardCopy.panels.quickActions.subtitle}
            className="dashboard-layout__actions"
            frameStyle="contained"
            energy="single"
          />
        </div>
      </div>
    </DashboardShell>
  );
}
