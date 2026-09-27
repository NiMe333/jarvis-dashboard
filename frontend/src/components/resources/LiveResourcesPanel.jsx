import { Activity, Cpu, HardDrive, MemoryStick, Thermometer, CheckCircle } from "lucide-react";
import HudPanel from "../panel/HudPanel.jsx";
import { dashboardCopy } from "../../config/dashboardContent.js";
import { dataSourceLabel } from "../../utils/dashboardFormatters.js";
import "./LiveResourcesPanel.css";

function percentOf(value, total) {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return null;
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
  const normalizedPercent = Number.isFinite(percent)
    ? Math.min(100, Math.max(0, percent))
    : null;

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
        aria-valuenow={normalizedPercent === null ? undefined : Math.round(normalizedPercent)}
      >
        <span style={{ width: normalizedPercent === null ? undefined : `${normalizedPercent}%` }} />
      </div>
    </article>
  );
}

export default function LiveResourcesPanel({ data = {}, dataSource = "offline", className = "" }) {
  const units = dashboardCopy.common.units;
  const loadAverage = Array.isArray(data.loadAverage)
    ? data.loadAverage.map((value) => Number.isFinite(value) ? value.toFixed(2) : dashboardCopy.common.unavailable).join(" / ")
    : data.loadAverage;

  return (
    <HudPanel
      title={dashboardCopy.panels.liveResources.title}
      subtitle={`${dashboardCopy.panels.liveResources.subtitle} // ${dataSourceLabel(dataSource)}`}
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
          icon={Thermometer}
          label="CPU TEMPERATURE"
          value={displayValue(data.cpuTemperature, " °C")}
          detail={data.cpuTemperature === null || data.cpuTemperature === undefined ? dashboardCopy.common.unavailable : "PACKAGE SENSOR"}
          percent={null}
        />
        <ResourceCard
          icon={Thermometer}
          label="SSD TEMPERATURE"
          value={displayValue(data.ssdTemperature, " °C")}
          detail={data.ssdSmartHealth === true ? "SMART PASSED" : data.ssdSmartHealth === false ? "SMART WARNING" : dashboardCopy.common.unavailable}
          percent={null}
        />
        <ResourceCard
          icon={CheckCircle}
          label="SMART STATUS"
          value={data.ssdSmartHealth === true ? "PASSED" : data.ssdSmartHealth === false ? "FAILED" : dashboardCopy.common.unavailable}
          detail={data.ssdModel ?? data.ssdDevice ?? dashboardCopy.common.unavailable}
          percent={null}
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
        <div className="live-resources__core-temperatures">
          <dt><Thermometer size={13} aria-hidden="true" />CPU CORE TEMPERATURES</dt>
          {Array.isArray(data.cpuTemperatures) && data.cpuTemperatures.length > 0 ? (
            <dd className="live-resources__core-temperature-list">
              {data.cpuTemperatures.map((reading, index) => (
                <span key={`${reading.label}-${index}`}>{reading.label}: {displayValue(reading.temperature, " °C")}</span>
              ))}
            </dd>
          ) : <dd>{dashboardCopy.common.unavailable}</dd>}
        </div>
        {Array.isArray(data.additionalTemperatures) && data.additionalTemperatures.length > 0 && (
          <div className="live-resources__core-temperatures">
            <dt><Thermometer size={13} aria-hidden="true" />BOARD SENSORS</dt>
            <dd className="live-resources__core-temperature-list">
              {data.additionalTemperatures.map((reading, index) => (
                <span key={`${reading.sensor}-${reading.channel}-${index}`}>{reading.sensor} / {reading.channel}: {displayValue(reading.temperature, " °C")}</span>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </HudPanel>
  );
}
