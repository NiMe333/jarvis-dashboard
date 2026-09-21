import HudPanel from "../panel/HudPanel.jsx";
import HealthSystemShader from "./HealthSystemShader/HealthSystemShader.jsx";
import "./SystemOverview.css";

const facts = [
  { label: "HOSTNAME", value: "jarvis" },
  { label: "HYPERVISOR", value: "Proxmox VE 9.2.20" },
  { label: "CPU", value: "Intel(R) Core(TM) i5-6500T" },
  { label: "MEMORY", value: "16 GB DDR4" },
  { label: "STORAGE", value: "256 GB" },
];

export default function SystemOverview() {
  return (
    <HudPanel
      title="SYSTEM OVERVIEW"
      subtitle="/ HOME SERVER"
      action="ONLINE"
      className="dashboard-layout__overview system-overview"
      frameStyle="open"
      variant="standard"
    >
      <div className="system-overview__grid">
        <div className="system-overview__info">
          <div className="system-overview__uptime">
            <span>UPTIME</span>
            <strong>12D 07H 42M</strong>
            <small>SINCE AUG 3, 2024</small>
          </div>
          <dl className="system-overview__facts">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <HealthSystemShader health={100} status="HEALTHY" />
      </div>
    </HudPanel>
  );
}
