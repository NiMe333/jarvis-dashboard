import LiveClock from "./LiveClock.jsx";
import RotatingDirective from "./RotatingDirective.jsx";
import SystemStatus from "./SystemStatus.jsx";
import { dashboardCopy, dashboardMockData } from "../../config/dashboardContent.js";
import "./DashboardHeader.css";

export default function DashboardHeader({ className = "" }) {
  return (
    <header className={`dashboard-header ${className}`.trim()}>
      <section
        className="dashboard-header__identity"
        aria-label="JARVIS command center"
      >
        <div className="dashboard-header__brand">
          <h1>{dashboardCopy.header.brand}</h1>
          <span>{dashboardCopy.header.brandSubtitle}</span>
        </div>
      </section>

      <section
        className="dashboard-header__intelligence"
        aria-label="Home server intelligence"
      >
        <small>{dashboardCopy.header.intelligenceLabel}</small>
        <strong>{dashboardMockData.header.intelligenceTitle}</strong>
        <span>{dashboardMockData.header.intelligenceSubtitle}</span>
        <i aria-hidden="true" />
      </section>

      <blockquote className="dashboard-header__quote">
        <RotatingDirective />
      </blockquote>

      <section
        className="dashboard-header__clock"
        aria-label="Current date and time"
      >
        <small>{dashboardCopy.header.localTimeLabel}</small>
        <LiveClock />
      </section>

      <SystemStatus
        status={dashboardMockData.header.systemStatus}
        alertCount={dashboardMockData.header.alertCount}
      />
    </header>
  );
}
