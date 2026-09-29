import { memo, useLayoutEffect, useRef, useState } from "react";
import JarvisShader from "../JarvisShader.jsx";
import {
  dashboardCopy,
} from "../../config/dashboardContent.js";
import "./JarvisCorePanel.css";

const StableJarvisShader = memo(JarvisShader);
const SEGMENTS = Array.from({ length: 7 }, (_, index) => index);

const displayMetric = (value, suffix = "") =>
  value == null ? dashboardCopy.common.unavailable : `${value}${suffix}`;

const coreTemperature = (readings, index) => {
  if (!Array.isArray(readings)) return dashboardCopy.common.unavailable;

  const reading = readings.find(({ label }) =>
    new RegExp(`^CORE\\s*0*${index}$`, "i").test(String(label ?? "")),
  );

  return displayMetric(reading?.temperature, " °C");
};

const roundedMetric = (value, suffix, digits = 1) => {
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(digits)}${suffix}` : dashboardCopy.common.unavailable;
};

const averageCpuTemperature = (readings) => {
  if (!Array.isArray(readings)) return dashboardCopy.common.unavailable;
  const values = readings
    .filter(({ label }) => /^CORE\s+\d+$/i.test(String(label ?? "")))
    .map(({ temperature }) => Number(temperature))
    .filter(Number.isFinite);
  if (values.length === 0) return dashboardCopy.common.unavailable;
  return `${(values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)} °C`;
};

const cpuClock = (megahertz) => {
  const value = Number(megahertz);
  if (!Number.isFinite(value)) return dashboardCopy.common.unavailable;
  return value >= 1_000
    ? `${(value / 1_000).toFixed(2)} GHz`
    : `${Math.round(value)} MHz`;
};

const STATUS_COPY = dashboardCopy.core.states;

function CorePanelDecoration({ panelRef }) {
  const [geometry, setGeometry] = useState(null);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return undefined;

    const shell = panel.querySelector(".jarvis-core-panel__shader-shell");
    const telemetry = panel.querySelector(".jarvis-core__telemetry");
    const groups = [...panel.querySelectorAll(".jarvis-core__telemetry-group")];

    if (!shell || !telemetry || groups.length !== 3) {
      return undefined;
    }

    const measure = () => {
      const panelRect = panel.getBoundingClientRect();
      const shellRect = shell.getBoundingClientRect();
      const telemetryRect = telemetry.getBoundingClientRect();

      if (
        !panelRect.width ||
        !panelRect.height ||
        !shellRect.width ||
        !shellRect.height
      ) {
        return;
      }

      const next = {
        width: panelRect.width,
        height: panelRect.height,
        cx: shellRect.left - panelRect.left + shellRect.width / 2,
        cy: shellRect.top - panelRect.top + shellRect.height / 2,
        radius: Math.min(shellRect.width, shellRect.height) * 0.49,
        statusTop: telemetryRect.top - panelRect.top,
        targets: groups.map((group) => {
          const rect = group.getBoundingClientRect();

          return rect.left - panelRect.left + rect.width / 2;
        }),
      };

      setGeometry((previous) => {
        if (!previous) return next;

        const before = [
          previous.width,
          previous.height,
          previous.cx,
          previous.cy,
          previous.radius,
          previous.statusTop,
          ...previous.targets,
        ];

        const after = [
          next.width,
          next.height,
          next.cx,
          next.cy,
          next.radius,
          next.statusTop,
          ...next.targets,
        ];

        const unchanged = before.every(
          (value, index) => Math.abs(value - after[index]) < 0.5,
        );

        return unchanged ? previous : next;
      });
    };

    const observer = new ResizeObserver(measure);

    [panel, shell, telemetry, ...groups].forEach((element) => {
      observer.observe(element);
    });

    measure();

    return () => observer.disconnect();
  }, [panelRef]);

  if (!geometry) {
    return <div className="jarvis-core-panel__decoration" aria-hidden="true" />;
  }

  const { width, height, cx, cy, radius, statusTop, targets } = geometry;

  const compact = width < 480;

  const polar = (degrees, distance = radius) => {
    const angle = (degrees * Math.PI) / 180;

    return {
      x: cx + Math.cos(angle) * distance,
      y: cy + Math.sin(angle) * distance,
    };
  };

  const arc = (startAngle, endAngle, distance) => {
    const start = polar(startAngle, distance);
    const end = polar(endAngle, distance);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return [
      `M ${start.x} ${start.y}`,
      `A ${distance} ${distance}`,
      `0 ${largeArc} 1`,
      `${end.x} ${end.y}`,
    ].join(" ");
  };

  const connectors = [
    {
      angle: 126,
      target: targets[0],
      color: "cyan",
    },
    {
      angle: 90,
      target: targets[1],
      color: "cyan",
      primary: true,
    },
    {
      angle: 54,
      target: targets[2],
      color: "orange",
    },
  ];

  const edgeConnectors = [
    { angle: 218, side: "left", offset: -0.06, tone: "cyan" },
    { angle: 180, side: "left", offset: 0, tone: "cyan", primary: true },
    { angle: 142, side: "left", offset: 0.06, tone: "orange" },
    { angle: 322, side: "right", offset: -0.06, tone: "cyan" },
    { angle: 0, side: "right", offset: 0, tone: "cyan", primary: true },
    { angle: 38, side: "right", offset: 0.06, tone: "orange" },
  ];

  const statusRailOffset = 22;

  const connectorPath = ({ angle, target }) => {
    const start = polar(angle, radius * 0.96);
    const exit = polar(angle, radius * 1.035);
    const endY = statusTop + statusRailOffset;
    const railY = Math.max(exit.y + 10, endY - 18);

    return [
      `M ${start.x} ${start.y}`,
      `L ${exit.x} ${exit.y}`,
      `L ${target} ${railY}`,
      `L ${target} ${endY}`,
    ].join(" ");
  };

  const edgePath = (connector) => {
    const start = polar(connector.angle, radius * 1.025);
    const exit = polar(connector.angle, radius * 1.12);
    const left = connector.side === "left";
    const edgeX = left ? width * 0.045 : width * 0.955;
    const elbowX = left ? width * 0.12 : width * 0.88;
    const endY = exit.y + radius * connector.offset;

    return {
      start,
      end: { x: edgeX, y: endY },
      d: `M ${start.x} ${start.y} L ${exit.x} ${exit.y} L ${elbowX} ${endY} L ${edgeX} ${endY}`,
    };
  };

  return (
    <div className="jarvis-core-panel__decoration" aria-hidden="true">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="presentation"
      >
        <defs>
          <filter
            id="jarvis-core-accent-glow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur stdDeviation="4" result="soft" />
            <feMerge>
              <feMergeNode in="soft" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="core-decoration__rings">
          <path
            className="core-decoration__arc"
            d={arc(198, 326, radius * 1.08)}
          />

          <path
            className="core-decoration__arc core-decoration__arc--dim"
            d={arc(18, 160, radius * 1.08)}
          />

          <path
            className="core-decoration__arc core-decoration__arc--orange"
            d={arc(34, 73, radius * 1.15)}
          />

          {!compact && (
            <path
              className="core-decoration__arc core-decoration__arc--fine"
              d={arc(204, 326, radius * 1.2)}
            />
          )}
        </g>

        <g className="core-decoration__connectors">
          {connectors.map((connector, index) => {
            const start = polar(connector.angle, radius * 0.96);

            const className =
              connector.color === "orange"
                ? "core-decoration__connector core-decoration__connector--orange"
                : connector.primary
                  ? "core-decoration__connector core-decoration__connector--primary"
                  : "core-decoration__connector";

            return (
              <g key={index} className={className}>
                <path d={connectorPath(connector)} />

                <circle cx={start.x} cy={start.y} r="2.4" />

                <circle cx={connector.target} cy={statusTop + statusRailOffset} r="2.8" />
              </g>
            );
          })}
        </g>

        <g className="core-decoration__edge-network">
          {edgeConnectors.map((connector, index) => {
            if (compact && !connector.primary && connector.tone !== "orange") {
              return null;
            }

            const geometry = edgePath(connector);
            const className = [
              "core-decoration__edge-branch",
              connector.primary && "is-primary",
              connector.tone === "orange" && "is-orange",
            ].filter(Boolean).join(" ");

            return (
              <g key={`edge-${index}`} className={className}>
                <path d={geometry.d} />
                <circle cx={geometry.start.x} cy={geometry.start.y} r={connector.primary ? 2.8 : 2.2} />
                <circle cx={geometry.end.x} cy={geometry.end.y} r={connector.tone === "orange" ? 3.1 : 2.4} />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export const JarvisCoreTelemetry = memo(function JarvisCoreTelemetry({
  telemetry,
}) {
  const status = STATUS_COPY[telemetry.status] ? telemetry.status : "offline";

  const copy = STATUS_COPY[status];

  const hostStatus = status === "offline"
    ? dashboardCopy.common.unavailable
    : status.toUpperCase();

  const cpuMetrics = [
    {
      label: dashboardCopy.core.cpuUsageLabel,
      value: roundedMetric(telemetry.cpuUsage, " %", 1),
    },
    {
      label: dashboardCopy.core.cpuAverageTempLabel,
      value: averageCpuTemperature(telemetry.cpuTemperatures),
    },
    {
      label: dashboardCopy.core.cpuPowerLabel,
      value: roundedMetric(telemetry.powerWatts, " W", 1),
    },
    {
      label: dashboardCopy.core.cpuClockLabel,
      value: cpuClock(telemetry.cpuFrequencyMHz),
    },
  ];

  return (
    <div
      className="jarvis-core-panel__telemetry jarvis-core__telemetry"
      data-status={status}
      aria-label={dashboardCopy.accessibility.coreTelemetry}
    >
      <div className="jarvis-core__telemetry-group jarvis-core__telemetry-group--thermal">
        {[0, 1, 2, 3].map((index) => (
          <div className="jarvis-core__metric" key={index}>
            <span className="jarvis-core__telemetry-label">CORE {index + 1}</span>
            <strong className="jarvis-core__telemetry-value">
              {coreTemperature(telemetry.cpuTemperatures, index)}
            </strong>
          </div>
        ))}
      </div>

      <div className="jarvis-core__telemetry-group jarvis-core__telemetry-group--integrity">
        <span className="jarvis-core__telemetry-heading">
          {dashboardCopy.core.hostStatusLabel}
        </span>

        <div className="jarvis-core__integrity-row">
          <span
            className="jarvis-core__segments jarvis-core__segments--left"
            aria-hidden="true"
          >
            {SEGMENTS.map((segment) => (
              <i key={segment} />
            ))}
          </span>

          <strong className="jarvis-core__integrity-value">{hostStatus}</strong>

          <span
            className="jarvis-core__segments jarvis-core__segments--right"
            aria-hidden="true"
          >
            {SEGMENTS.map((segment) => (
              <i key={segment} />
            ))}
          </span>
        </div>

        <span className="jarvis-core__integrity-status">{copy.integrity}</span>
      </div>

      <div className="jarvis-core__telemetry-group jarvis-core__telemetry-group--status">
        {cpuMetrics.map(({ label, value }) => (
          <div className="jarvis-core__metric" key={label}>
            <span className="jarvis-core__telemetry-label">{label}</span>
            <strong className="jarvis-core__telemetry-value">{value}</strong>
          </div>
        ))}

      </div>
    </div>
  );
});

export default function JarvisCorePanel({ telemetry = {} }) {
  const panelRef = useRef(null);

  return (
    <div ref={panelRef} className="jarvis-core-panel">
      <CorePanelDecoration panelRef={panelRef} />

      <div className="jarvis-core-panel__title">
        <strong>{dashboardCopy.core.title}</strong>
        <small>{dashboardCopy.core.subtitle}</small>
      </div>

      <div className="jarvis-core-panel__viewport">
        <div className="jarvis-core-panel__shader-shell">
          <StableJarvisShader quality="high" />
        </div>
      </div>

      <JarvisCoreTelemetry telemetry={telemetry} />
    </div>
  );
}
