import "./SystemStatus.css";
import { dashboardCopy } from "../../config/dashboardContent.js";

const statusLabels = dashboardCopy.header.systemStates;

export default function SystemStatus({ status = "operational", alertCount = 0 }) {
  const { label, detail } = statusLabels[status] ?? statusLabels.offline;
  const secondary = status === "operational" && alertCount === 0
    ? statusLabels.operational.detail
    : status === "operational"
    ? `${alertCount} ${alertCount === 1 ? dashboardCopy.header.activeAlert : dashboardCopy.header.activeAlerts}`
    : detail;

  return (
    <div
      className={`system-status system-status--${status}`}
      role="status"
      aria-label={`${label}. ${secondary}.`}
    >
      <span className="system-status__frame" aria-hidden="true">
        <i className="system-status__edge system-status__edge--tl" />
        <i className="system-status__edge system-status__edge--tr" />
        <i className="system-status__edge system-status__edge--right" />
        <i className="system-status__edge system-status__edge--br" />
        <i className="system-status__edge system-status__edge--bl" />
        <i className="system-status__edge system-status__edge--left" />
      </span>
      <i className="system-status__light" aria-hidden="true" />
      <div className="system-status__copy">
        <span className="system-status__primary">{label}</span>
        <span className="system-status__secondary">{secondary}</span>
      </div>
    </div>
  );
}
