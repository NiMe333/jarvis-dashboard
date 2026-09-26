import { Activity, Cpu, Database, HardDrive, MemoryStick, Server } from "lucide-react";
import HudPanel from "../panel/HudPanel.jsx";
import { dashboardCopy } from "../../config/dashboardContent.js";
import { dataSourceLabel, formatNullable } from "../../utils/dashboardFormatters.js";
import "./TemperaturePowerPanel.css";

const NUMBER_FORMATTER = new Intl.NumberFormat([], { maximumFractionDigits: 2 });

function formatNumber(value, suffix = "") {
  return Number.isFinite(value)
    ? `${NUMBER_FORMATTER.format(value)}${suffix}`
    : dashboardCopy.common.unavailable;
}

function formatLoadAverage(values) {
  if (!Array.isArray(values) || values.length < 3) return dashboardCopy.common.unavailable;
  return values.slice(0, 3).map((value) => (
    Number.isFinite(value) ? value.toFixed(2) : dashboardCopy.common.unavailable
  )).join(" / ");
}

function formatPair(value, total, suffix = "") {
  if (!Number.isFinite(value) || !Number.isFinite(total)) return dashboardCopy.common.unavailable;
  return `${NUMBER_FORMATTER.format(value)} / ${NUMBER_FORMATTER.format(total)}${suffix}`;
}

function TelemetryCard({ icon: Icon, label, value }) {
  const available = value !== dashboardCopy.common.unavailable;

  return (
    <article className={`temperature-power__card temperature-power__card--${available ? "normal" : "unavailable"}`}>
      <header><Icon size={14} aria-hidden="true" /><span>{label}</span></header>
      <strong title={available ? value : undefined}>{value}</strong>
      <span className={`temperature-power__state temperature-power__state--${available ? "normal" : "unavailable"}`}>
        {available ? dashboardCopy.hostTelemetry.live : dashboardCopy.common.unavailable}
      </span>
    </article>
  );
}

export default function HostTelemetryPanel({ data = {}, host = {}, dataSource = "offline", className = "" }) {
  const units = dashboardCopy.common.units;
  const fields = dashboardCopy.hostTelemetry;

  return (
    <HudPanel
      title={dashboardCopy.panels.hostTelemetry.title}
      subtitle={`${dashboardCopy.panels.hostTelemetry.subtitle} // ${dataSourceLabel(dataSource)}`}
      className={`temperature-power ${className}`.trim()}
      frameStyle="contained"
    >
      <div className="temperature-power__cards">
        <TelemetryCard icon={Cpu} label={fields.cpuLoad} value={formatNumber(data.cpuUsage, units.percent)} />
        <TelemetryCard icon={Activity} label={fields.loadAverage} value={formatLoadAverage(data.loadAverage)} />
        <TelemetryCard icon={MemoryStick} label={fields.memoryAvailable} value={formatNumber(data.memoryAvailable, units.storage)} />
        <TelemetryCard icon={Database} label={fields.swapUsage} value={formatPair(data.swapUsed, data.swapTotal, units.storage)} />
        <TelemetryCard icon={HardDrive} label={fields.storageFree} value={formatPair(data.rootStorageFree, data.rootStorageTotal, units.storage)} />
        <TelemetryCard icon={Server} label={fields.proxmoxVersion} value={formatNullable(host.proxmoxVersion)} />
      </div>
    </HudPanel>
  );
}
