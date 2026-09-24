import { Activity, Clock3, Cpu, HardDrive, ListTree, MemoryStick } from "lucide-react";
import HudPanel from "../panel/HudPanel.jsx";
import { dashboardCopy } from "../../config/dashboardContent.js";
import { dashboardMockData } from "../../config/dashboardMockData.js";
import "./LiveResourcesPanel.css";

function percentOf(value, total) {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.min(100, Math.max(0, (value / total) * 100));
}

function displayValue(value, suffix = "") {
  return Number.isFinite(value) ? `${value}${suffix}` : dashboardCopy.common.unavailable;
}

function displayPair(value, total, suffix = "") {
  return Number.isFinite(value) && Number.isFinite(total)
    ? `${value} / ${total}${suffix}`
    : dashboardCopy.common.unavailable;
}

function ResourceCard({ icon: Icon, label, value, detail, percent }) {
  const normalizedPercent = Math.min(100, Math.max(0, percent ?? 0));

  return (
    <article className="live-resources__card">
      <header>
        <span className="live-resources__icon" aria-hidden="true"><Icon size={16} /></span>
        <span>{label}</span>
      </header>
      <strong>{value}</strong>
      <small className="live-resources__card-detail">
        <span aria-hidden="true" />{detail}
      </small>
      <div
        className="live-resources__progress"
        role="progressbar"
        aria-label={label}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={Math.round(normalizedPercent)}
      >
        <span style={{ width: `${normalizedPercent}%` }} />
      </div>
    </article>
  );
}

export default function LiveResourcesPanel({ data = dashboardMockData.metrics, isMock = true, className = "" }) {
  const units = dashboardCopy.common.units;
  const loadAverage = Array.isArray(data.loadAverage)
    ? data.loadAverage.map((value) => Number.isFinite(value) ? value.toFixed(2) : dashboardCopy.common.unavailable).join(" / ")
    : data.loadAverage;

  return (
    <HudPanel
      title={dashboardCopy.panels.liveResources.title}
      subtitle={`${dashboardCopy.panels.liveResources.subtitle} // ${isMock ? dashboardCopy.common.mockLabel : dashboardCopy.common.liveLabel}`}
      className={`live-resources ${className}`.trim()}
      frameStyle="contained"
      variant="compact"
    >
      <div className="live-resources__primary">
        <ResourceCard
          icon={Cpu}
          label={dashboardCopy.resources.cpu}
          value={displayValue(data.cpuUsage, units.percent)}
          detail={dashboardCopy.resources.states[data.cpuState] ?? dashboardCopy.common.unavailable}
          percent={data.cpuUsage}
        />
        <ResourceCard
          icon={MemoryStick}
          label={dashboardCopy.resources.memory}
          value={displayPair(data.memoryUsed, data.memoryTotal, units.storage)}
          detail={Number.isFinite(data.memoryAvailable) ? `${data.memoryAvailable}${units.storage} ${dashboardCopy.resources.available}` : dashboardCopy.common.unavailable}
          percent={percentOf(data.memoryUsed, data.memoryTotal)}
        />
        <ResourceCard
          icon={HardDrive}
          label={dashboardCopy.resources.storage}
          value={displayPair(data.storageUsed, data.storageTotal, units.storage)}
          detail={Number.isFinite(data.storageFree) ? `${data.storageFree}${units.storage} ${dashboardCopy.resources.free}` : dashboardCopy.common.unavailable}
          percent={percentOf(data.storageUsed, data.storageTotal)}
        />
      </div>

      <dl className="live-resources__details">
        <div>
          <dt><Activity size={13} aria-hidden="true" />{dashboardCopy.resources.loadAverage}</dt>
          <dd>{loadAverage ?? dashboardCopy.common.unavailable}</dd>
          <span className="live-resources__detail-meter" aria-hidden="true" />
        </div>
        <div>
          <dt><Clock3 size={13} aria-hidden="true" />{dashboardCopy.resources.uptime}</dt>
          <dd>{data.uptime ?? dashboardCopy.common.unavailable}</dd>
          <span className="live-resources__detail-meter" aria-hidden="true" />
        </div>
        <div>
          <dt><ListTree size={13} aria-hidden="true" />{dashboardCopy.resources.processes}</dt>
          <dd>{data.processCount ?? dashboardCopy.common.unavailable}</dd>
          <span className="live-resources__detail-meter" aria-hidden="true" />
        </div>
      </dl>
    </HudPanel>
  );
}
