import "./SystemStatus.css";

export default function SystemStatus({
  dataSource = "loading",
  isRetrying = false,
}) {
  const reachable = dataSource === "live" || dataSource === "partial";
  const state = reachable ? "online" : dataSource === "loading" ? "loading" : "offline";
  const label = reachable ? "SYSTEM ONLINE" : state === "loading" ? "CONNECTING" : "SERVER UNREACHABLE";
  const secondary = reachable
    ? "TELEMETRY CONNECTED"
    : state === "loading"
      ? "WAITING FOR TELEMETRY"
      : isRetrying ? "RETRYING CONNECTION" : "CONNECTION UNAVAILABLE";

  return (
    <div
      className={`system-status system-status--${state}`}
      role="status"
      aria-label={`${label}. ${secondary}.`}
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
