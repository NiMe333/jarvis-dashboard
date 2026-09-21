import HudPanel from "../panel/HudPanel.jsx";
import "./SystemOverview.css";

export const mockSystemOverview = Object.freeze({
  uptime: "12D 07H 42M",
  since: "AUG 3, 2026",
  online: true,
  cpuLoad: 18,
  memoryUsed: 5.8,
  memoryTotal: 16,
  storageUsed: 74,
  storageTotal: 256,
  cpuTemperature: 42,
  healthyServices: 24,
  totalServices: 25,
  runningVms: 4,
  hostname: "jarvis",
  hypervisor: "Proxmox VE 9.2.20",
  processor: "Intel Core i5-6500T",
});

const show = (value, suffix = "") => value == null ? "—" : `${value}${suffix}`;
const ratio = (used, total, suffix = "") => used == null || total == null ? "—" : `${used} / ${total}${suffix}`;

export default function SystemOverview({ telemetry = mockSystemOverview }) {
  const metrics = [
    { label: "CPU LOAD", value: show(telemetry.cpuLoad, "%") },
    { label: "MEMORY", value: ratio(telemetry.memoryUsed, telemetry.memoryTotal, " GB") },
    { label: "STORAGE", value: ratio(telemetry.storageUsed, telemetry.storageTotal, " GB") },
    { label: "CPU TEMP", value: show(telemetry.cpuTemperature, "°C"), warning: telemetry.cpuTemperature >= 75 },
    { label: "SERVICES", value: ratio(telemetry.healthyServices, telemetry.totalServices), warning: telemetry.healthyServices < telemetry.totalServices },
    { label: "VMs", value: telemetry.runningVms == null ? "—" : `${telemetry.runningVms} RUNNING` },
  ];

  const identity = [
    { label: "HOSTNAME", value: telemetry.hostname },
    { label: "HYPERVISOR", value: telemetry.hypervisor },
    { label: "PROCESSOR", value: telemetry.processor },
  ];

  return (
    <HudPanel
      title="SYSTEM OVERVIEW"
      subtitle="/ HOME SERVER"
      className="dashboard-layout__overview system-overview"
      frameStyle="open"
      variant="standard"
    >
      <div className="system-overview__content">
        <section className="system-overview__uptime" aria-label="Server uptime">
          <div>
            <span className="system-overview__section-label">UPTIME</span>
            <strong>{telemetry.uptime ?? "—"}</strong>
            <small>SINCE {telemetry.since ?? "—"}</small>
          </div>
          <span className="system-overview__online" data-online={telemetry.online}>
            <i />{telemetry.online ? "ONLINE" : "OFFLINE"}
          </span>
        </section>

        <section className="system-overview__metrics" aria-label="Resource summary">
          {metrics.map((metric) => (
            <div className="system-overview__metric" data-warning={metric.warning || undefined} key={metric.label}>
              <span><i />{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </section>

        <dl className="system-overview__identity">
          {identity.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value ?? "—"}</dd>
            </div>
          ))}
        </dl>
      </div>
    </HudPanel>
  );
}
