import { Cpu, HardDrive, Zap } from "lucide-react";
import HudPanel from "../panel/HudPanel.jsx";
import { dashboardCopy } from "../../config/dashboardContent.js";
import { dashboardMockData } from "../../config/dashboardMockData.js";
import "./TemperaturePowerPanel.css";

function SensorCard({ icon: Icon, label, value, unit, state }) {
  const hasValue = value !== null && value !== undefined && Number.isFinite(Number(value));

  return (
    <article className={`temperature-power__card temperature-power__card--${state ?? "unavailable"}`}>
      <header><Icon size={14} aria-hidden="true" /><span>{label}</span></header>
      <strong>{hasValue ? value : dashboardCopy.common.unavailable}<small>{hasValue ? unit : ""}</small></strong>
      <span className={`temperature-power__state temperature-power__state--${state ?? "unavailable"}`}>
        {dashboardCopy.sensors.states[state] ?? dashboardCopy.sensors.states.unavailable}
      </span>
    </article>
  );
}

export default function TemperaturePowerPanel({ data = dashboardMockData.metrics, isMock = true, className = "" }) {
  const units = dashboardCopy.common.units;
  const fanValue = Number.isFinite(data.fanRpm)
    ? `${data.fanRpm}${units.fanSpeed}`
    : dashboardCopy.common.unavailable;
  const cpuLoadValue = Number.isFinite(data.cpuUsage)
    ? `${data.cpuUsage}${units.percent}`
    : dashboardCopy.common.unavailable;
  const sensorStatusLabel = dashboardCopy.sensors.states[data.sensorStatus]
    ?? dashboardCopy.sensors.states.unavailable;

  return (
    <HudPanel
      title={dashboardCopy.panels.temperature.title}
      subtitle={`${dashboardCopy.panels.temperature.subtitle} // ${isMock ? dashboardCopy.common.mockLabel : dashboardCopy.common.liveLabel}`}
      className={`temperature-power ${className}`.trim()}
      frameStyle="contained"
    >
      <div className="temperature-power__cards">
        <SensorCard
          icon={Cpu}
          label={dashboardCopy.sensors.cpuTemperature}
          value={data.cpuTemperature}
          unit={units.temperature}
          state={data.sensorStates?.cpuTemperature}
        />
        <SensorCard
          icon={HardDrive}
          label={dashboardCopy.sensors.ssdTemperature}
          value={data.ssdTemperature}
          unit={units.temperature}
          state={data.sensorStates?.ssdTemperature}
        />
        <SensorCard
          icon={Zap}
          label={dashboardCopy.sensors.power}
          value={data.powerWatts}
          unit={units.power}
          state={data.sensorStates?.powerWatts}
        />
      </div>

      <dl className="temperature-power__footer">
        <div><dt>{dashboardCopy.sensors.cpuLoad}</dt><dd>{cpuLoadValue}</dd></div>
        <div><dt>{dashboardCopy.sensors.fanSpeed}</dt><dd>{fanValue}</dd></div>
        <div><dt>{dashboardCopy.sensors.status}</dt><dd className={`is-${data.sensorStatus ?? "unavailable"}`}>{sensorStatusLabel}</dd></div>
      </dl>
    </HudPanel>
  );
}
