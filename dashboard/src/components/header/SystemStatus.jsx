import "./SystemStatus.css";

const statusLabels = {
  operational: ["ALL SYSTEMS OPERATIONAL", "NO ACTIVE ALERTS"],
  warning: ["SYSTEM WARNING", "ATTENTION REQUIRED"],
  critical: ["CRITICAL SYSTEM STATE", "IMMEDIATE ATTENTION"],
  offline: ["SYSTEM OFFLINE", "CONNECTION UNAVAILABLE"],
};

function formatUptime(uptime) {
  return `UPTIME // ${uptime.toUpperCase()}`;
}

export default function SystemStatus({
  status = "operational",
  alertCount = 0,
  uptime = "",
}) {
  const [label, detail] = statusLabels[status] ?? statusLabels.offline;
  const secondary = status === "operational" && alertCount === 0;
  status === "operational"
    ? `${alertCount} ACTIVE ALERT${alertCount === 1 ? "" : "S"}`
    : detail;
  const uptimeLabel = formatUptime(uptime);

  return (
    <div
      className={`system-status system-status--${status}`}
      role="status"
      aria-label={`${label}. ${secondary}. ${uptimeLabel}.`}
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
        <span className="system-status__meta">{uptimeLabel}</span>
      </div>
    </div>
  );
}
