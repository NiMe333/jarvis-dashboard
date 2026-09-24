import HudPanel from "../panel/HudPanel.jsx";
import { dashboardCopy } from "../../config/dashboardContent.js";
import { dashboardMockData } from "../../config/dashboardMockData.js";
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

export default function NetworkThroughputPanel({ data = dashboardMockData.metrics, isMock = true, className = "" }) {
  const series = data.networkSeries ?? [];
  const maximum = Math.max(1, ...series.flatMap((point) => [point.downloadRate ?? 0, point.uploadRate ?? 0]));
  const downloadPath = buildPath(series, "downloadRate", maximum);
  const uploadPath = buildPath(series, "uploadRate", maximum);
  const formatRate = (value) => Number.isFinite(value)
    ? `${value}${dashboardCopy.common.units.dataRate}`
    : dashboardCopy.common.unavailable;

  return (
    <HudPanel
      title={dashboardCopy.panels.network.title}
      subtitle={`${dashboardCopy.panels.network.subtitle} // ${isMock ? dashboardCopy.common.mockLabel : dashboardCopy.common.liveLabel}`}
      className={`network-throughput ${className}`.trim()}
      frameStyle="contained"
      variant="compact"
    >
      <div className="network-throughput__rates">
        <div><span className="network-throughput__key network-throughput__key--download" />{dashboardCopy.network.download}<strong>{formatRate(data.downloadRate)}</strong></div>
        <div><span className="network-throughput__key network-throughput__key--upload" />{dashboardCopy.network.upload}<strong>{formatRate(data.uploadRate)}</strong></div>
      </div>

      <div className="network-throughput__chart">
        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="none" role="img" aria-label={isMock ? dashboardCopy.network.chartLabel : dashboardCopy.network.liveChartLabel}>
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
        </svg>
      </div>

      <dl className="network-throughput__totals">
        <div><dt>{dashboardCopy.network.received}</dt><dd>{formatBytes(data.totalReceived)}</dd></div>
        <div><dt>{dashboardCopy.network.transmitted}</dt><dd>{formatBytes(data.totalTransmitted)}</dd></div>
        <div><dt>{dashboardCopy.network.interface}</dt><dd>{data.networkInterface ?? dashboardCopy.common.unavailable}</dd></div>
      </dl>
    </HudPanel>
  );
}
