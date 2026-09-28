import "./JarvisStatusWidget.css";
import { dashboardCopy } from "../../../config/dashboardContent.js";

const STATE_LABELS = dashboardCopy.systemOverview.statusStates;

export default function JarvisStatusWidget({ data }) {
  const supplied = data ?? {};
  const state = STATE_LABELS[supplied.state] ? supplied.state : "offline";
  const heading = supplied.heading ?? dashboardCopy.systemOverview.statusHeading;
  const status = supplied.status ?? STATE_LABELS[state];
  const value = {
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

    </section>
  );
}
