import "./SystemStatus.css";

export default function SystemStatus({
  dataSource = "loading",
  isRetrying = false,
  warningTone = false,
  lastSuccessfulRefreshAt = null,
}) {
  const reachable = dataSource === "live" || dataSource === "partial";
  const state = !reachable ? dataSource === "loading" ? "loading" : "offline" : warningTone ? "warning" : "online";
  const label = state === "warning" ? "SYSTEM ATTENTION" : reachable ? "SYSTEM ONLINE" : state === "loading" ? "CONNECTING" : "SERVER UNREACHABLE";
  const secondary = state === "warning"
    ? "TELEMETRY WARNING"
    : reachable
    ? "TELEMETRY CONNECTED"
    : state === "loading"
      ? "WAITING FOR TELEMETRY"
      : isRetrying ? "RETRYING CONNECTION" : "CONNECTION UNAVAILABLE";
  const refreshedAt = lastSuccessfulRefreshAt
    ? new Date(lastSuccessfulRefreshAt).toLocaleTimeString("sl-SI", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "NOT YET AVAILABLE";
  const statusDetails = `${label}. ${secondary}. Last successful refresh: ${refreshedAt}.`;

  return (
    <div
      className={`system-status system-status--${state}`}
      role="status"
      aria-label={statusDetails}
      title={statusDetails}
    >
      <span className="system-status__meta">JARVIS / NODE</span>
      <div className="system-status__body">
        <span className="system-status__icon" aria-hidden="true"><i /></span>
        <div className="system-status__copy">
          <span className="system-status__primary">{label}</span>
          <span className="system-status__secondary">{secondary}</span>
        </div>
      </div>
    </div>
  );
}
