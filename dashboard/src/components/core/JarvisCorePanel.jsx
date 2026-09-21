import { memo } from "react";
import JarvisShader from "../JarvisShader.jsx";
import "./JarvisCorePanel.css";

const StableJarvisShader = memo(JarvisShader);
const SEGMENTS = Array.from({ length: 7 }, (_, index) => index);

export const mockCoreTelemetry = Object.freeze({
  cpuTemperature: 42,
  cpuLoad: 18,
  fanSpeed: 1031,
  powerDraw: 48,
  memoryUsage: 36,
  systemHealth: 100,
  status: "online",
});

const displayMetric = (value, suffix = "") => value == null ? "—" : `${value}${suffix}`;

const STATUS_COPY = {
  online: { core: "CORE ONLINE", integrity: "ALL SYSTEMS NOMINAL" },
  warning: { core: "CORE WARNING", integrity: "SYSTEM ATTENTION" },
  critical: { core: "CORE CRITICAL", integrity: "CRITICAL SYSTEM STATE" },
  offline: { core: "CORE OFFLINE", integrity: "SYSTEM OFFLINE" },
};

export const JarvisCoreTelemetry = memo(function JarvisCoreTelemetry({ telemetry }) {
  const status = STATUS_COPY[telemetry.status] ? telemetry.status : "offline";
  const copy = STATUS_COPY[status];
  const health = telemetry.systemHealth == null
    ? "—"
    : `${Math.max(0, Math.min(100, telemetry.systemHealth))}%`;

  return (
    <div className="jarvis-core-panel__telemetry jarvis-core__telemetry" data-status={status} aria-label="JARVIS core telemetry">
      <div className="jarvis-core__telemetry-group jarvis-core__telemetry-group--thermal">
        <div className="jarvis-core__metric">
          <span className="jarvis-core__telemetry-label">CPU TEMP</span>
          <strong className="jarvis-core__telemetry-value">{displayMetric(telemetry.cpuTemperature, "°C")}</strong>
        </div>
        <div className="jarvis-core__metric">
          <span className="jarvis-core__telemetry-label">FAN SPEED</span>
          <strong className="jarvis-core__telemetry-value">{displayMetric(telemetry.fanSpeed, " RPM")}</strong>
        </div>
      </div>

      <div className="jarvis-core__telemetry-group jarvis-core__telemetry-group--integrity">
        <span className="jarvis-core__telemetry-heading">SYSTEM INTEGRITY</span>
        <div className="jarvis-core__integrity-row">
          <span className="jarvis-core__segments jarvis-core__segments--left" aria-hidden="true">
            {SEGMENTS.map((segment) => <i key={segment} />)}
          </span>
          <strong className="jarvis-core__integrity-value">{health}</strong>
          <span className="jarvis-core__segments jarvis-core__segments--right" aria-hidden="true">
            {SEGMENTS.map((segment) => <i key={segment} />)}
          </span>
        </div>
        <span className="jarvis-core__integrity-status">{copy.integrity}</span>
      </div>

      <div className="jarvis-core__telemetry-group jarvis-core__telemetry-group--status">
        <span className="jarvis-core__status-line jarvis-core__status-line--primary"><i />{copy.core}</span>
        <span className="jarvis-core__status-line"><i />SECURE</span>
        <span className="jarvis-core__status-line"><i />MONITORING</span>
      </div>
    </div>
  );
});

export default function JarvisCorePanel({ telemetry = mockCoreTelemetry }) {
  return (
    <div className="jarvis-core-panel">
      <div className="jarvis-core-panel__viewport">
        <div className="jarvis-core-panel__shader-shell">
          <StableJarvisShader quality="balanced" />
        </div>
      </div>
      <JarvisCoreTelemetry telemetry={telemetry} />
    </div>
  );
}
