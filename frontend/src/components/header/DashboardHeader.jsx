import LiveClock from "./LiveClock.jsx";
import RotatingDirective from "./RotatingDirective.jsx";
import SystemStatus from "./SystemStatus.jsx";
import { dashboardCopy } from "../../config/dashboardContent.js";
import { dashboardMockData } from "../../config/dashboardMockData.js";
import "./DashboardHeader.css";

export default function DashboardHeader({ data = dashboardMockData.header, className = "" }) {
  return (
    <header className={`dashboard-header ${className}`.trim()}>
      <section
        className="dashboard-header__identity"
        aria-label={dashboardCopy.accessibility.commandCenter}
      >
        <div className="dashboard-header__brand">
          <h1>{dashboardCopy.header.brand}</h1>
          <span>{dashboardCopy.header.brandSubtitle}</span>
        </div>
      </section>

      <section
        className="dashboard-header__intelligence"
        aria-label={dashboardCopy.accessibility.serverIntelligence}
      >
        <small>{dashboardCopy.header.intelligenceLabel}</small>
        <strong>{dashboardCopy.header.intelligenceTitle}</strong>
        <span>{dashboardCopy.header.intelligenceSubtitle}</span>
        <i aria-hidden="true" />
      </section>

      <blockquote className="dashboard-header__quote">
        <RotatingDirective />
      </blockquote>

      <section
        className="dashboard-header__clock"
        aria-label={dashboardCopy.accessibility.currentDateTime}
      >
        <small>{dashboardCopy.header.localTimeLabel}</small>
        <LiveClock />
      </section>

      <SystemStatus
        status={data.systemStatus}
        alertCount={data.alertCount}
      />
    </header>
  );
}
