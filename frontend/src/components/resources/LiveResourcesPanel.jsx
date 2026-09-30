import { HardDrive, ShieldAlert, ShieldCheck, Thermometer } from "lucide-react";
import HudPanel from "../panel/HudPanel.jsx";
import { dashboardCopy } from "../../config/dashboardContent.js";
import "./LiveResourcesPanel.css";

const unavailable = dashboardCopy.common.unavailable;

function formatBytes(value) {
  if (!Number.isFinite(value) || value < 0) return unavailable;
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value || 1) / Math.log(1024)), units.length - 1);
  const amount = value / (1024 ** index);
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: amount >= 100 ? 0 : 1 })} ${units[index]}`;
}

function byteParts(value) {
  if (!Number.isFinite(value) || value < 0) return null;
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value || 1) / Math.log(1024)), units.length - 1);
  const amount = value / (1024 ** index);
  return {
    amount: amount.toLocaleString(undefined, { maximumFractionDigits: amount >= 100 ? 0 : 1 }),
    unit: units[index],
  };
}

function capacityPair(used, total) {
  const usedParts = byteParts(used);
  const totalParts = byteParts(total);
  if (!usedParts || !totalParts) return unavailable;
  return usedParts.unit === totalParts.unit
    ? <>{usedParts.amount} <em>/</em> {totalParts.amount} {totalParts.unit}</>
    : <>{usedParts.amount} {usedParts.unit} <em>/</em> {totalParts.amount} {totalParts.unit}</>;
}

function statusLabel(value) {
  if (value === true) return "PASSED";
  if (value === false) return "WARNING";
  return unavailable;
}

function normalizedPercent(usage) {
  const value = Number.isFinite(usage?.percent)
    ? usage.percent
    : Number.isFinite(usage?.used) && Number.isFinite(usage?.total) && usage.total > 0
      ? (usage.used / usage.total) * 100
      : null;
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null;
}

function fallbackDisk(role) {
  return {
    id: role,
    role,
    name: role === "system" ? "SYSTEM SSD" : "DATA SSD",
    device: null,
    model: null,
    physicalTotal: null,
    mountPoint: role === "system" ? "/ + local-lvm" : "/mnt/storage",
    usage: null,
    temperature: null,
    smartHealth: null,
  };
}

function StorageCard({ disk, warningTone, dataSource }) {
  const usage = disk.usage ?? {};
  const percent = normalizedPercent(usage);
  const telemetryUnavailable = dataSource === "offline" || !disk.device;
  const online = !telemetryUnavailable && disk.smartHealth !== false;
  const SmartIcon = disk.smartHealth === false ? ShieldAlert : ShieldCheck;
  const statusText = telemetryUnavailable ? "DATA N/A" : online ? "ONLINE" : "SMART ALERT";

  return (
    <article className="storage-overview__card">
      <header className="storage-overview__card-header">
        <span className="storage-overview__disk-icon" aria-hidden="true"><HardDrive /></span>
        <span className="storage-overview__name-wrap">
          <strong>{disk.name}</strong>
          <small title={disk.model ?? undefined}>
            <span>{disk.model ?? unavailable}</span>
            {disk.device && <b>{disk.device}</b>}
          </small>
        </span>
        <span className={`storage-overview__status ${!online || warningTone ? "storage-overview__status--warning" : ""}`}>
          <i aria-hidden="true" />{statusText}
        </span>
      </header>

      <section
        className="storage-overview__capacity"
        aria-label={`${disk.name} capacity`}
        title={`Used ${formatBytes(usage.used)} · Free ${formatBytes(usage.free)} · Total ${formatBytes(usage.total)} · ${percent === null ? unavailable : `${percent.toFixed(1)}% used`}`}
      >
        <span>{usage.label ?? "USAGE"}</span>
        <strong>{capacityPair(usage.used, usage.total)}</strong>
        <div
          className="storage-overview__meter"
          role="progressbar"
          aria-label={`${disk.name} usage`}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={percent === null ? undefined : Math.round(percent)}
          tabIndex="0"
        >
          <span style={{ width: percent === null ? "0%" : `${percent}%` }} />
        </div>
        <div className="storage-overview__free"><span>{formatBytes(usage.free)} FREE</span><span>{percent === null ? unavailable : `${percent.toFixed(1)}%`}</span></div>
      </section>

      <dl className="storage-overview__health">
        <div>
          <dt><Thermometer aria-hidden="true" />TEMPERATURE</dt>
          <dd>{Number.isFinite(disk.temperature) ? `${disk.temperature.toFixed(0)} °C` : unavailable}</dd>
        </div>
        <div>
          <dt><SmartIcon aria-hidden="true" />SMART STATUS</dt>
          <dd
            className={disk.smartHealth === false ? "storage-overview__health-alert" : ""}
            title={disk.smartHealth === true ? "SMART self-assessment reports the drive is healthy." : disk.smartHealth === false ? "SMART reports a drive health warning." : "SMART status is unavailable."}
          >{statusLabel(disk.smartHealth)}</dd>
        </div>
      </dl>

      <footer className="storage-overview__footer">
        <span title={disk.mountPoint ?? undefined}>{disk.mountPoint ?? unavailable}</span>
        <span>PHYSICAL: {formatBytes(disk.physicalTotal)}</span>
      </footer>
    </article>
  );
}

export default function LiveResourcesPanel({ data = {}, dataSource = "offline", warningTone = false, className = "" }) {
  const storageDevices = Array.isArray(data.storageDevices) ? data.storageDevices : [];
  const system = storageDevices.find((disk) => disk?.role === "system") ?? fallbackDisk("system");
  const dataDisk = storageDevices.find((disk) => disk?.role === "data") ?? fallbackDisk("data");

  return (
    <HudPanel
      title={dashboardCopy.panels.liveResources.title}
      subtitle={dashboardCopy.panels.liveResources.subtitle}
      className={`storage-overview ${className}`.trim()}
      frameStyle="contained"
      variant="compact"
    >
      <div className="storage-overview__grid">
        <StorageCard disk={system} warningTone={warningTone} dataSource={dataSource} />
        <StorageCard disk={dataDisk} warningTone={warningTone} dataSource={dataSource} />
      </div>
    </HudPanel>
  );
}
