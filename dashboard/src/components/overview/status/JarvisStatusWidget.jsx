import "./JarvisStatusWidget.css";

const STATE_LABELS = {
  nominal: "NOMINAL",
  warning: "ATTENTION",
  critical: "CRITICAL",
  offline: "OFFLINE",
};

export const defaultJarvisStatusData = Object.freeze({
  heading: "SYSTEM STATUS",
  status: "NOMINAL",
  lastEventLabel: "LAST EVENT",
  lastEventTime: "19:42",
  lastEvent: "BACKUP COMPLETED",
  securityLabel: "SECURITY ARMED",
  state: "nominal",
});

export default function JarvisStatusWidget({ data }) {
  const supplied = data ?? {};
  const state = STATE_LABELS[supplied.state] ? supplied.state : "nominal";
  const heading = supplied.heading ?? defaultJarvisStatusData.heading;
  const status = supplied.status ?? STATE_LABELS[state];
  const value = { ...defaultJarvisStatusData, ...supplied, heading, status, state };

  return (
    <section className="jarvis-status" data-state={state} aria-label={`${heading}: ${status}`}>
      <div className="jarvis-status__readout">
        <span className="jarvis-status__heading">{heading}</span>
        <strong className="jarvis-status__value">{status}</strong>
      </div>

      <div className="jarvis-status__events">
        <div className="jarvis-status__event">
          <div className="jarvis-status__event-head">
            <span>{value.lastEventLabel}</span>
            <time>{value.lastEventTime}</time>
          </div>
          <strong>{value.lastEvent}</strong>
        </div>
      </div>

      <div className="jarvis-status__security">
        <i aria-hidden="true" />
        <span>{value.securityLabel}</span>
      </div>
    </section>
  );
}
