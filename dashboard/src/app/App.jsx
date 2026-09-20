import DashboardShell from "../components/layout/DashboardShell.jsx";
import HudPanel from "../components/panel/HudPanel.jsx";
import DashboardHeader from "../components/header/DashboardHeader.jsx";
import "./DashboardLayout.css";

export default function App() {
  return (
    <DashboardShell>
      <div className="dashboard-layout">
        <DashboardHeader className="dashboard-layout__header" />

        <div className="dashboard-layout__left">
          <HudPanel title="SYSTEM OVERVIEW" className="dashboard-layout__overview" frameStyle="open" />
          <HudPanel title="RESOURCE MONITOR" className="dashboard-layout__resource" frameStyle="bracket" />
        </div>

        <HudPanel title="JARVIS CORE" eyebrow="PRIMARY INTERFACE" className="dashboard-layout__core" frameStyle="core" shape="core" energy="pair">
          <div className="dashboard-layout__core-reserved">CORE MODULE RESERVED</div>
        </HudPanel>

        <div className="dashboard-layout__right">
          <HudPanel title="SERVICES & CONTAINERS" className="dashboard-layout__services" frameStyle="open" />
          <HudPanel title="TEMPERATURE & POWER" className="dashboard-layout__temperature" frameStyle="bracket" energy="single" />
          <HudPanel title="NETWORK THROUGHPUT" className="dashboard-layout__network" frameStyle="open" />
        </div>

        <HudPanel title="RECENT EVENTS" className="dashboard-layout__events" frameStyle="open" />
        <HudPanel title="QUICK ACTIONS" className="dashboard-layout__actions" frameStyle="contained" energy="single" />
        <HudPanel className="dashboard-layout__footer" title="SYSTEM STATUS BAR" frameStyle="open" />
      </div>
    </DashboardShell>
  );
}
