import HudPanel from "../panel/HudPanel.jsx";
import "./SystemOverview.css";

export const mockSystemOverview = Object.freeze({
  uptime: "12d 07h 42m",
  since: "AUG 3, 2026",
  hostname: "jarvis",
  hypervisor: "Proxmox VE 9.2.20",
  processor: "Intel Core i5-6500T",
  memory: "16 GB DDR4",
  storage: "256 GB",
  location: "HOME",
});

function VectorClock() {
  return (
    <svg className="system-overview__clock" viewBox="0 0 64 64" role="img" aria-label="Uptime clock">
      <circle className="system-overview__clock-halo" cx="32" cy="32" r="25" />
      <circle className="system-overview__clock-face" cx="32" cy="32" r="21" />
      <path className="system-overview__clock-ticks" d="M32 7v5 M32 52v5 M7 32h5 M52 32h5 M14.3 14.3l3.5 3.5 M46.2 46.2l3.5 3.5 M49.7 14.3l-3.5 3.5 M17.8 46.2l-3.5 3.5" />
      <path className="system-overview__clock-hands" d="M32 18v15l11 7" />
      <circle className="system-overview__clock-pin" cx="32" cy="33" r="2.2" />
      <path className="system-overview__clock-accent" d="M17 10l4 3 M47 10l-4 3 M9 45l4-2" />
    </svg>
  );
}

export default function SystemOverview({ telemetry = mockSystemOverview }) {
  const identity = [
    { label: "HOSTNAME", value: telemetry.hostname },
    { label: "HYPERVISOR", value: telemetry.hypervisor },
    { label: "CPU", value: telemetry.processor },
    { label: "MEMORY", value: telemetry.memory },
    { label: "STORAGE", value: telemetry.storage },
    { label: "LOCATION", value: telemetry.location },
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
        <section className="system-overview__hero" aria-label="Server uptime">
          <span className="system-overview__label">UPTIME</span>
          <div className="system-overview__uptime-row">
            <VectorClock />
            <div className="system-overview__uptime-copy">
              <strong>{telemetry.uptime ?? "—"}</strong>
              <small>SINCE {telemetry.since ?? "—"}</small>
            </div>
          </div>
        </section>

        <dl className="system-overview__identity">
          {identity.map((item) => (
            <div className="system-overview__identity-row" key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value ?? "—"}</dd>
            </div>
          ))}
        </dl>
      </div>
    </HudPanel>
  );
}
