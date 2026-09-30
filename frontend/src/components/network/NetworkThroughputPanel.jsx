import HudPanel from "../panel/HudPanel.jsx";
import { useState } from "react";
import { dashboardCopy } from "../../config/dashboardContent.js";
import "./NetworkThroughputPanel.css";

const CHART_WIDTH = 100;
const CHART_HEIGHT = 34;

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return dashboardCopy.common.unavailable;
  const units = dashboardCopy.common.units.bytes;
  let value = Math.max(0, bytes);
  let unitIndex = 0;
  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

function buildPath(series, key, maximum) {
  if (!series?.length || maximum <= 0) return "";
  return series.map((point, index) => {
    const x = series.length === 1 ? 0 : (index / (series.length - 1)) * CHART_WIDTH;
    const y = CHART_HEIGHT - (Math.max(0, point[key] ?? 0) / maximum) * (CHART_HEIGHT - 2) - 1;
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
}

function pointPosition(series, index, key, maximum) {
  const x = series.length === 1 ? 0 : (index / (series.length - 1)) * CHART_WIDTH;
  const y = CHART_HEIGHT - (Math.max(0, series[index][key] ?? 0) / maximum) * (CHART_HEIGHT - 2) - 1;
  return { x, y };
}

function measurementTime(point) {
  const explicit = Date.parse(point?.timestamp);
  const measuredAt = Number.isFinite(explicit)
    ? new Date(explicit)
    : new Date(Date.now() + Number(point?.offsetSeconds ?? 0) * 1000);
  return measuredAt.toLocaleTimeString("sl-SI", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function pointTime(point) {
  const explicit = Date.parse(point?.timestamp);
  return Number.isFinite(explicit) ? explicit : Number(point?.offsetSeconds ?? 0) * 1000;
}

function transferredBytes(series, key) {
  let total = 0;
  let hasSamples = false;
  for (let index = 1; index < series.length; index += 1) {
    const previousRate = series[index - 1]?.[key];
    const currentRate = series[index]?.[key];
    const elapsedSeconds = Math.max(0, (pointTime(series[index]) - pointTime(series[index - 1])) / 1000);
    if (!Number.isFinite(previousRate) || !Number.isFinite(currentRate) || elapsedSeconds <= 0) continue;
    total += ((previousRate + currentRate) / 2) * 1_000_000 / 8 * elapsedSeconds;
    hasSamples = true;
  }
  return hasSamples ? total : null;
}

export default function NetworkThroughputPanel({ data = {}, dataSource = "offline", className = "" }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [highlightedSeries, setHighlightedSeries] = useState(null);
  const series = data.networkSeries ?? [];
  const maximum = Math.max(0, ...series.flatMap((point) => [point.downloadRate ?? 0, point.uploadRate ?? 0]));
  const downloadPath = buildPath(series, "downloadRate", maximum);
  const uploadPath = buildPath(series, "uploadRate", maximum);
  const hoveredPoint = hoveredIndex === null ? null : series[hoveredIndex];
  const received = Number.isFinite(data.totalReceived)
    ? data.totalReceived
    : transferredBytes(series, "downloadRate");
  const transmitted = Number.isFinite(data.totalTransmitted)
    ? data.totalTransmitted
    : transferredBytes(series, "uploadRate");
  const totalsSuffix = data.totalsWindow || (!Number.isFinite(data.totalReceived) && received !== null)
    ? " · 1H"
    : "";
  const latestPoint = series.at(-1);
  const formatRate = (value) => Number.isFinite(value)
    ? `${value}${dashboardCopy.common.units.dataRate}`
    : dashboardCopy.common.unavailable;

  return (
    <HudPanel
      title={dashboardCopy.panels.network.title}
      subtitle={dashboardCopy.panels.network.subtitle}
      className={`network-throughput ${className}`.trim()}
      frameStyle="contained"
      variant="compact"
    >
      <div className="network-throughput__rates">
        <div onMouseEnter={() => setHighlightedSeries("download")} onMouseLeave={() => setHighlightedSeries(null)}><span className="network-throughput__key network-throughput__key--download" />{dashboardCopy.network.download}<strong>{formatRate(data.downloadRate)}</strong></div>
        <div onMouseEnter={() => setHighlightedSeries("upload")} onMouseLeave={() => setHighlightedSeries(null)}><span className="network-throughput__key network-throughput__key--upload" />{dashboardCopy.network.upload}<strong>{formatRate(data.uploadRate)}</strong></div>
      </div>

      <div className={`network-throughput__chart${highlightedSeries ? ` is-highlighting-${highlightedSeries}` : ""}`}>
        {hoveredPoint && (
          <div className="network-throughput__tooltip" role="status">
            <strong>MEASURED · {measurementTime(hoveredPoint)}</strong>
            <span><i className="network-throughput__tooltip-dot network-throughput__tooltip-dot--download" />↓ {formatRate(hoveredPoint.downloadRate)}</span>
            <span><i className="network-throughput__tooltip-dot network-throughput__tooltip-dot--upload" />↑ {formatRate(hoveredPoint.uploadRate)}</span>
          </div>
        )}
        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="none" role="img" aria-label={dashboardCopy.network.liveChartLabel}>
          <defs>
            <linearGradient id="network-download-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#55e8f2" stopOpacity="0.2" />
              <stop offset="1" stopColor="#55e8f2" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g className="network-throughput__grid" aria-hidden="true">
            <path d="M0 8.5H100 M0 17H100 M0 25.5H100" />
            <path d="M25 0V34 M50 0V34 M75 0V34" />
          </g>
          {downloadPath && <path className="network-throughput__area" d={`${downloadPath} L100 34 L0 34 Z`} />}
          <path className="network-throughput__line network-throughput__line--download" d={downloadPath} />
          <path className="network-throughput__line network-throughput__line--upload" d={uploadPath} />
          <path className="network-throughput__flow network-throughput__flow--download" d={downloadPath} aria-hidden="true" />
          <path className="network-throughput__flow network-throughput__flow--upload" d={uploadPath} aria-hidden="true" />
          {maximum > 0 && series.map((point, index) => {
            const download = pointPosition(series, index, "downloadRate", maximum);
            const upload = pointPosition(series, index, "uploadRate", maximum);
            return (
              <g
                className={`network-throughput__point-group${hoveredIndex === index ? " is-active" : ""}`}
                key={`${point.timestamp ?? point.offsetSeconds}-${index}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
                tabIndex="0"
                aria-label={`Network measured at ${measurementTime(point)}: download ${formatRate(point.downloadRate)}, upload ${formatRate(point.uploadRate)}`}
              >
                <line className="network-throughput__hit-area" x1={download.x} x2={download.x} y1="0" y2={CHART_HEIGHT} />
                <line className="network-throughput__guide" x1={download.x} x2={download.x} y1="0" y2={CHART_HEIGHT} />
                <circle className="network-throughput__point network-throughput__point--download" cx={download.x} cy={download.y} r="0.85" />
                <circle className="network-throughput__point network-throughput__point--upload" cx={upload.x} cy={upload.y} r="0.75" />
              </g>
            );
          })}
        </svg>
      </div>

      <dl className="network-throughput__totals">
        <div><dt>{dashboardCopy.network.received}{totalsSuffix}</dt><dd>{formatBytes(received)}</dd></div>
        <div><dt>{dashboardCopy.network.transmitted}{totalsSuffix}</dt><dd>{formatBytes(transmitted)}</dd></div>
        <div>
          <dt>{data.networkInterface ? dashboardCopy.network.interface : "LAST SAMPLE"}</dt>
          <dd>{data.networkInterface ?? (latestPoint ? measurementTime(latestPoint) : dashboardCopy.common.unavailable)}</dd>
        </div>
      </dl>
    </HudPanel>
  );
}
