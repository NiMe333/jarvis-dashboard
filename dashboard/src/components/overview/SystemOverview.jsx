import HudPanel from "../panel/HudPanel.jsx";
import SystemHealthCore from "./SystemHealthCore/SystemHealthCore.jsx";
import "./SystemOverview.css";

const facts = [
  { label: "HOSTNAME", value: "jarvis-homelab" },
  { label: "HYPERVISOR", value: "Proxmox VE 8.2" },
  { label: "CPU", value: "AMD Ryzen 7 5700X (8C/16T)" },
  { label: "MEMORY", value: "32 GB DDR4" },
  { label: "STORAGE", value: "4.6 TB / 8 TB" },
];

export default function SystemOverview() {
  return (
    <HudPanel title="SYSTEM OVERVIEW" subtitle="/ HOME SERVER" action="ONLINE" className="dashboard-layout__overview system-overview" frameStyle="open" variant="standard">
      <div className="system-overview__grid">
        <div className="system-overview__info">
          <div className="system-overview__uptime"><span>UPTIME</span><strong>12D 07H 42M</strong><small>SINCE AUG 3, 2024</small></div>
          <dl className="system-overview__facts">{facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
        </div>
        <SystemHealthCore health={100} status="healthy" />
      </div>
    </HudPanel>
  );
}
