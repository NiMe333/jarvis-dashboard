import "./JarvisStatusWidget.css";
import { dashboardCopy } from "../../../config/dashboardContent.js";
import { dashboardMockData } from "../../../config/dashboardMockData.js";

const STATE_LABELS = dashboardCopy.systemOverview.statusStates;

export const defaultJarvisStatusData = dashboardMockData.overviewStatus;

export default function JarvisStatusWidget({ data }) {
  const supplied = data ?? {};
  const state = STATE_LABELS[supplied.state] ? supplied.state : defaultJarvisStatusData.state;
  const heading = supplied.heading ?? dashboardCopy.systemOverview.statusHeading;
  const status = supplied.status ?? STATE_LABELS[state];
  const value = {
    lastEventLabel: dashboardCopy.systemOverview.lastEventLabel,
    securityLabel: dashboardCopy.systemOverview.securityLabel,
    ...defaultJarvisStatusData,
    ...supplied,
    heading,
    status,
    state,
  };

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
