import "./SystemHealthCore.css";
import { dashboardCopy } from "../../../config/dashboardContent.js";

const SEGMENTS = Array.from({ length: 20 }, (_, index) => index);
const TICKS = Array.from({ length: 40 }, (_, index) => index);
const NODES = [18, 108, 198, 288];

export default function SystemHealthCore({ health }) {
  const available = Number.isFinite(health);
  const activeSegments = available ? Math.round((Math.max(0, Math.min(100, health)) / 100) * SEGMENTS.length) : 0;
  const isWarning = !available || health < 90;
  const label = available ? `${health}${dashboardCopy.common.units.percent}` : dashboardCopy.common.unavailable;
  return <div className={`system-health-core${isWarning ? " is-warning" : ""}`} data-renderer="svg" data-health-state={isWarning ? "warning" : "healthy"} aria-label={`${label} ${dashboardCopy.accessibility.systemHealth}`}><svg className="system-health-core__visual" viewBox="0 0 200 200" role="img" aria-hidden="true"><g className="system-health-core__ticks">{TICKS.map((tick) => <line key={tick} x1="100" y1={tick % 5 === 0 ? "12" : "16"} x2="100" y2={tick % 5 === 0 ? "20" : "19"} transform={`rotate(${tick * 9} 100 100)`} />)}</g><circle className="system-health-core__orbit system-health-core__orbit--outer" cx="100" cy="100" r="82" /><circle className="system-health-core__orbit system-health-core__orbit--middle" cx="100" cy="100" r="57" /><g className="system-health-core__segments">{SEGMENTS.map((segment) => <line key={segment} className={segment < activeSegments ? "is-active" : ""} x1="100" y1="24" x2="100" y2="38" transform={`rotate(${segment * 18} 100 100)`} />)}</g><g className="system-health-core__arcs"><circle cx="100" cy="100" r="45" pathLength="100" /><circle cx="100" cy="100" r="35" pathLength="100" /></g><circle className="system-health-core__inner-ring" cx="100" cy="100" r="25" /><g className="system-health-core__guides"><line x1="52" y1="100" x2="67" y2="100" /><line x1="133" y1="100" x2="148" y2="100" /><line x1="100" y1="52" x2="100" y2="67" /><line x1="100" y1="133" x2="100" y2="148" /></g><g className="system-health-core__nodes">{NODES.map((angle) => <circle key={angle} cx="100" cy="18" r="2.4" transform={`rotate(${angle} 100 100)`} />)}</g></svg><div className="system-health-core__label" aria-hidden="true"><strong>{label}</strong><span>{available ? (isWarning ? dashboardCopy.health.warning : dashboardCopy.health.healthy) : dashboardCopy.common.unavailable}</span></div></div>;
}
