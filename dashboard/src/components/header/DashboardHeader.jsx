import LiveClock from "./LiveClock.jsx";
import SystemStatus from "./SystemStatus.jsx";
import UptimeDisplay from "./UptimeDisplay.jsx";
import { headerConfig } from "./headerConfig.js";
import "./DashboardHeader.css";

export default function DashboardHeader({ className = "" }) {
  return (
    <header className={`dashboard-header ${className}`.trim()}>
      <section className="dashboard-header__identity" aria-label="JARVIS command center">
        <div className="dashboard-header__brand">
          <h1>JARVIS</h1>
          <span>COMMAND CENTER</span>
        </div>
      </section>

      <section className="dashboard-header__intelligence" aria-label="Home server intelligence">
        <small>SYS.INT // 01</small>
        <strong>{headerConfig.intelligenceTitle}</strong>
        <span>{headerConfig.intelligenceSubtitle}</span>
        <em>CORE LINK ACTIVE</em>
        <i aria-hidden="true" />
      </section>

      <blockquote className="dashboard-header__quote">
        <small>DIRECTIVE // HOME</small>
        <span>“{headerConfig.quote[0]}</span>
        <span>{headerConfig.quote[1]}”</span>
      </blockquote>

      <section className="dashboard-header__clock" aria-label="Current date and time">
        <small>LOCAL TIME</small>
        <LiveClock />
        <UptimeDisplay uptime={headerConfig.uptime} nodeName={headerConfig.nodeName} />
      </section>

      <SystemStatus status={headerConfig.systemStatus} alertCount={headerConfig.alertCount} />
    </header>
  );
}
