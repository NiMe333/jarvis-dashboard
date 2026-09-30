import LiveClock from "./LiveClock.jsx";
import RotatingDirective from "./RotatingDirective.jsx";
import SystemStatus from "./SystemStatus.jsx";
import { dashboardCopy } from "../../config/dashboardContent.js";
import jarvisLogo from "../image/logo.png";
import "@fontsource/orbitron/500.css";
import "./DashboardHeader.css";

export default function DashboardHeader({ data = {}, imageSrc = jarvisLogo, className = "" }) {
  return (
    <header className={`dashboard-header ${className}`.trim()}>
      <section
        className="dashboard-header__identity"
        aria-label={dashboardCopy.accessibility.commandCenter}
      >
        <div className="dashboard-header__identity-image" aria-hidden="true">
          {imageSrc ? (
            <img
              key={imageSrc}
              src={imageSrc}
              alt=""
              onError={(event) => { event.currentTarget.hidden = true; }}
            />
          ) : null}
        </div>
        <div className="dashboard-header__brand">
          <h1>{dashboardCopy.header.brand}</h1>
          <span>HOME LAB</span>
        </div>
      </section>

      <blockquote className="dashboard-header__quote">
        <RotatingDirective />
      </blockquote>

      <section
        className="dashboard-header__clock"
        aria-label={dashboardCopy.accessibility.currentDateTime}
      >
        <LiveClock />
      </section>

      <SystemStatus
        dataSource={data.dataSource}
        isRetrying={data.isRetrying}
        warningTone={data.warningTone}
        lastSuccessfulRefreshAt={data.lastSuccessfulRefreshAt}
      />
    </header>
  );
}
