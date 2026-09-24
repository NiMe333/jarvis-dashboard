import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  Box,
  Cpu,
  Database,
  Download,
  Home,
  Play,
  Power,
  RefreshCw,
  Server,
  Thermometer,
  Upload,
} from "lucide-react";
import "./styles/dashboard.css";
function ShaderCanvas() {
  useEffect(() => {
    import("../../shader/src/main.js");
  }, []);
  return (
    <section id="jarvis-core-panel">
      <canvas id="shader-canvas" />
    </section>
  );
}
const Spark = ({ orange = false }) => (
  <div className={`spark ${orange ? "orange" : ""}`}>
    <i />
    <i />
    <i />
    <i />
    <i />
    <i />
    <i />
  </div>
);
const Panel = ({ title, sub, children, action }) => (
  <section className="panel">
    <div className="panel-head">
      <div>
        <b>{title}</b>
        <small>/ {sub}</small>
      </div>
      {action && <span className="action">{action} ↗</span>}
    </div>
    {children}
  </section>
);
const Stat = ({ icon: Icon, label, value, orange = false }) => (
  <div className="stat">
    <Icon size={24} />
    <small>{label}</small>
    <strong>{value}</strong>
    <Spark orange={orange} />
  </div>
);
function App() {
  return (
    <main className="dashboard">
      <header className="topbar">
        <div className="brand">
          <div className="reactor">◉</div>
          <div>
            <h1>JARVIS</h1>
            <b>COMMAND CENTER</b>
          </div>
        </div>
        <div className="tagline">
          HOME SERVER INTELLIGENCE
          <small>MONITOR / CONTROL / AUTOMATE / SECURE</small>
        </div>
        <div className="quote">
          “A MORE CONNECTED HOME
          <br />
          STARTS TOMORROW”
        </div>
        <div className="clock">
          <small>FRI, AUG 16, 2024</small>
          <strong>15:24:17</strong>
        </div>
        <div className="operational">
          ●{" "}
          <span>
            ALL SYSTEMS OPERATIONAL<small>NO ACTIVE ALERTS</small>
          </span>
        </div>
        <div className="home-lab">
          ⌂{" "}
          <span>
            HOME LAB
            <small>
              v1.0.0
              <br />● LOCAL
            </small>
          </span>
        </div>
      </header>
      <div className="main-grid">
        <div className="left-col">
          <Panel title="SYSTEM OVERVIEW" sub="HOME SERVER" action="ONLINE">
            <div className="health">
              <div>
                <small>UPTIME</small>
                <strong>12d 07h 42m</strong>
                <small>SINCE AUG 3, 2024</small>
              </div>
              <div className="health-ring">
                100
                <small>
                  %<br />
                  HEALTHY
                </small>
              </div>
            </div>
            <dl>
              <dt>HOSTNAME</dt>
              <dd>jarvis-homelab</dd>
              <dt>HYPERVISOR</dt>
              <dd>Proxmox VE 8.2</dd>
              <dt>CPU</dt>
              <dd>AMD Ryzen 7 5700X (8C/16T)</dd>
              <dt>MEMORY</dt>
              <dd>32 GB DDR4</dd>
              <dt>STORAGE</dt>
              <dd>4.6 TB / 8 TB</dd>
              <dt>LOCATION</dt>
              <dd>Home</dd>
            </dl>
          </Panel>
          <Panel title="RESOURCES" sub="SYSTEM USAGE">
            <div className="stats">
              <Stat icon={Cpu} label="CPU" value="24%" />
              <Stat icon={Database} label="MEMORY" value="62%" />
              <Stat icon={Database} label="STORAGE" value="56%" />
              <Stat
                icon={Upload}
                label="NETWORK"
                value={
                  <>
                    ↓ 72.4 Mb/s
                    <br />
                    <em>↑ 18.6 Mb/s</em>
                  </>
                }
              />
            </div>
          </Panel>
        </div>
        <Panel title="JARVIS CORE" sub="AI ASSISTED HOMELAB INTELLIGENCE">
          <div className="core-title">ANALYZE / MONITOR / OPTIMIZE</div>
          <ShaderCanvas />
          <div className="core-metrics">
            <span>
              CORE TEMP <b>42°C</b>
            </span>
            <span>
              FAN SPEED <b>1031</b>
            </span>
            <span>
              POWER DRAW <b>48 W</b>
            </span>
            <strong>
              SYSTEM INTEGRITY
              <br />
              <big>100%</big>
            </strong>
          </div>
        </Panel>
        <div className="right-col">
          <Panel
            title="SERVICES & CONTAINERS"
            sub="CORE SERVICES"
            action="VIEW ALL"
          >
            <ul className="services">
              {[
                ["Proxmox VE", "Hypervisor"],
                ["Docker", "Container Platform"],
                ["Home Assistant", "Smart Home"],
                ["Jellyfin", "Media Server"],
                ["Pi-hole", "Network Ad Blocking"],
                ["Tailscale", "VPN / Remote Access"],
                ["Grafana", "Monitoring"],
              ].map(([a, b]) => (
                <li>
                  <b>{a}</b>
                  <small>{b}</small>
                  <em>● Running</em>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="TEMPERATURES & POWER" sub="SYSTEM SENSORS">
            <div className="stats temps">
              <Stat icon={Cpu} label="CPU" value="48°C" orange />
              <Stat icon={Thermometer} label="MOTHERBOARD" value="36°C" />
              <Stat icon={Database} label="NVME SSD" value="42°C" orange />
            </div>
          </Panel>
          <Panel title="NETWORK THROUGHPUT" sub="REAL-TIME" action="1 MIN">
            <div className="network-chart">
              <Spark />
              <strong>
                <Download />
                72.4 Mb/s
                <br />
                <em>
                  <Upload />
                  18.6 Mb/s
                </em>
              </strong>
            </div>
          </Panel>
        </div>
      </div>
      <div className="bottom-grid">
        <Panel title="RECENT EVENTS" sub="SYSTEM LOG" action="VIEW ALL">
          <div className="events">
            {[
              "Container 'Jellyfin' started",
              "Backup completed successfully",
              "New device connected (Pixel 8)",
              "Pi-hole blocked 1,234 requests",
              "System health check completed",
            ].map((x, i) => (
              <p>
                <i />{" "}
                <time>{["15:21", "14:52", "12:33", "10:17", "08:21"][i]}</time>
                {x}
              </p>
            ))}
          </div>
        </Panel>
        <Panel title="QUICK ACTIONS" sub="OPERATIONS">
          <div className="actions">
            {[
              [Play, "Start VM"],
              [RefreshCw, "Restart Service"],
              [Box, "Open Proxmox"],
              [Home, "Open Home Assistant"],
              [Server, "View Logs"],
              [Power, "System Update"],
            ].map(([I, x]) => (
              <button>
                <I size={15} />
                {x}
              </button>
            ))}
          </div>
        </Panel>
      </div>
      <footer>
        JARVIS OS v1.0.0　　SELF-HOSTED TODAY / A SMARTER TOMORROW　　 CPU
        24%　〰〰〰　　 MEM 62%　〰〰〰　　 STORAGE 56%　〰〰〰　　 12 SERVICES
        | 4 VMS | 24 CONTAINERS
      </footer>
    </main>
  );
}
export { App, Panel, ShaderCanvas, Stat, Spark };
