import DashboardShell from "../components/layout/DashboardShell.jsx";
import HudPanel from "../components/panel/HudPanel.jsx";
import DashboardHeader from "../components/header/DashboardHeader.jsx";
import SystemOverview from "../components/overview/SystemOverview.jsx";
import JarvisShader from "../components/JarvisShader.jsx";
import "./DashboardLayout.css";

export default function App() {
  return (
    <DashboardShell>
      <div className="dashboard-layout">
        <DashboardHeader className="dashboard-layout__header" />

        <div className="dashboard-layout__left">
          <SystemOverview />
          <HudPanel title="LIVE RESOURCES" subtitle="// 1 SEC" className="dashboard-layout__resource" frameStyle="open" variant="compact" />
          <HudPanel title="NETWORK THROUGHPUT" subtitle="/ REAL-TIME // 1 MIN" className="dashboard-layout__network" frameStyle="open" variant="compact" />
        </div>

        <div className="dashboard-layout__center">
          <HudPanel title="JARVIS CORE" eyebrow="PRIMARY INTERFACE" className="dashboard-layout__core" frameStyle="core" shape="core" energy="pair" variant="large">
            <JarvisShader />
          </HudPanel>
          <HudPanel title="RECENT EVENTS" subtitle="/ SYSTEM LOG" className="dashboard-layout__events" frameStyle="open" variant="compact" />
        </div>

        <div className="dashboard-layout__right">
          <HudPanel title="SERVICES & CONTAINERS" subtitle="/ CORE SERVICES" className="dashboard-layout__services" frameStyle="open" />
          <HudPanel title="TEMPERATURE & POWER" subtitle="/ SYSTEM SENSORS" className="dashboard-layout__temperature" frameStyle="bracket" />
          <HudPanel title="QUICK ACTIONS" subtitle="// OPERATIONS" className="dashboard-layout__actions" frameStyle="contained" energy="single" />
        </div>

      </div>
    </DashboardShell>
  );
}
