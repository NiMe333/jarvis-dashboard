import { Database, MemoryStick, ShieldAlert } from "lucide-react";
import HudPanel from "../panel/HudPanel.jsx";
import { dashboardCopy } from "../../config/dashboardContent.js";
import "./TemperaturePowerPanel.css";

const unavailable = dashboardCopy.common.unavailable;

function byteParts(value) {
  if (!Number.isFinite(value) || value < 0) return null;
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value || 1) / Math.log(1024)), units.length - 1);
  const amount = value / 1024 ** index;
  return { amount: amount.toLocaleString(undefined, { maximumFractionDigits: amount >= 100 ? 0 : 1 }), unit: units[index] };
}

function bytes(value) {
  const parts = byteParts(value);
  return parts ? `${parts.amount} ${parts.unit}` : unavailable;
}

function capacityPair(used, total) {
  const left = byteParts(used);
  const right = byteParts(total);
  if (!left || !right) return unavailable;
  return left.unit === right.unit ? <>{left.amount} <em>/</em> {right.amount} {right.unit}</> : <>{left.amount} {left.unit} <em>/</em> {right.amount} {right.unit}</>;
}

function ratio(value, total) {
  return Number.isFinite(value) && Number.isFinite(total) && total > 0 ? Math.max(0, Math.min(100, value / total * 100)) : null;
}

function Meter({ value, label }) {
  const width = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return <div className="memory-workload__meter" role="progressbar" aria-label={label} aria-valuemin="0" aria-valuemax="100" aria-valuenow={Number.isFinite(value) ? Math.round(width) : undefined}><span style={{ width: `${width}%` }} /></div>;
}

function MemoryChart({ history }) {
  const points = Array.isArray(history) ? history.filter(({ used, total }) => Number.isFinite(used) && Number.isFinite(total) && total > 0).slice(-60) : [];
  if (points.length < 2) return <div className="memory-workload__chart memory-workload__chart--empty">COLLECTING HISTORY</div>;
  const path = points.map(({ used, total }, index) => `${index ? "L" : "M"} ${(index / (points.length - 1) * 100).toFixed(2)} ${(100 - used / total * 100).toFixed(2)}`).join(" ");
  return <svg className="memory-workload__chart" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Memory usage history for recent samples"><path className="memory-workload__chart-grid" d="M0 25H100M0 50H100M0 75H100" /><path className="memory-workload__chart-fill" d={`${path} L100 100 L0 100 Z`} /><path className="memory-workload__chart-line" d={path} /></svg>;
}

function Hardware({ hardware, memory, workload }) {
  const modules = Array.isArray(hardware?.modules) ? hardware.modules : [];
  const slots = Number.isFinite(hardware?.slotsUsed) && Number.isFinite(hardware?.slotsTotal) ? `${hardware.slotsUsed} / ${hardware.slotsTotal}` : unavailable;
  return <section className="memory-workload__hardware"><header><MemoryStick aria-hidden="true" />MEMORY HARDWARE</header><dl><div><dt>INSTALLED</dt><dd>{bytes(hardware?.installedTotal)}</dd></div><div><dt>TYPE</dt><dd>{hardware?.memoryType ?? unavailable}</dd></div><div><dt>CONFIGURED</dt><dd>{hardware?.configuredSpeed ?? unavailable}</dd></div><div><dt>SLOTS</dt><dd>{slots}</dd></div></dl><div className="memory-workload__modules">{modules.length ? modules.map((module, index) => <div key={`${module.slot}-${index}`} title={module.model ?? undefined}><b>{module.slot ?? "SLOT N/A"}</b><span>{bytes(module.capacity)}</span><span>{module.manufacturer ?? unavailable}</span></div>) : <span>MODULE DETAILS: {unavailable}</span>}</div><footer>PROCESSES: {Number.isFinite(workload?.count) ? workload.count : unavailable} · RUNNING: {Number.isFinite(workload?.running) ? workload.running : unavailable} · BLOCKED: {Number.isFinite(workload?.blocked) ? workload.blocked : unavailable}</footer></section>;
}

export default function HostTelemetryPanel({ data = {}, dataSource = "offline", className = "" }) {
  const memory = data.memoryDetails ?? {};
  const memoryUsed = ratio(memory.used, memory.total);
  const swapUsed = ratio(memory.swapUsed, memory.swapTotal);
  const pressure = data.memoryPressure?.some;
  const pressureDetails = pressure ? `SOME 10s ${pressure.avg10 ?? unavailable}% · 60s ${pressure.avg60 ?? unavailable}% · 300s ${pressure.avg300 ?? unavailable}%` : unavailable;

  return <HudPanel title="MEMORY & WORKLOAD" subtitle="/ PROXMOX HOST" className={`memory-workload ${className}`.trim()} frameStyle="contained"><div className="memory-workload__top"><section className="memory-workload__memory" title="Main used memory is MemTotal minus MemAvailable. Cached memory is reclaimable and is not added to this number."><header><MemoryStick aria-hidden="true" />MEMORY</header><div className="memory-workload__capacity"><strong>{capacityPair(memory.used, memory.total)}</strong><span>{memoryUsed === null ? unavailable : `${memoryUsed.toFixed(1)}% USED`}</span></div><Meter value={memoryUsed} label="Host RAM usage" /><div className="memory-workload__chart-label"><span>RECENT MEMORY HISTORY</span><span>LAST ~5 MIN</span></div><MemoryChart history={data.memoryHistory} /><dl className="memory-workload__memory-facts"><div><dt>AVAILABLE</dt><dd>{bytes(memory.available)}</dd></div><div><dt>CACHED</dt><dd>{bytes(memory.cached)}</dd></div></dl></section><aside className="memory-workload__side"><section className="memory-workload__swap"><header><Database aria-hidden="true" />SWAP</header><strong>{capacityPair(memory.swapUsed, memory.swapTotal)}</strong><span>{swapUsed === null ? unavailable : `${swapUsed.toFixed(1)}% USED`}</span><Meter value={swapUsed} label="Swap usage" /></section><section className="memory-workload__pressure" title={`Memory PSI: share of time tasks waited for memory, not RAM usage. ${pressureDetails}`}><header><ShieldAlert aria-hidden="true" />MEMORY PRESSURE</header><span>SOME 10s: <b>{Number.isFinite(pressure?.avg10) ? `${pressure.avg10.toFixed(2)}%` : unavailable}</b></span></section></aside></div><Hardware hardware={data.memoryHardware} memory={memory} workload={data.workload} /></HudPanel>;
}
