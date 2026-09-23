import { memo, useLayoutEffect, useRef, useState } from "react";
import JarvisShader from "../JarvisShader.jsx";
import {
  dashboardCopy,
  dashboardMockData,
} from "../../config/dashboardContent.js";
import "./JarvisCorePanel.css";

const StableJarvisShader = memo(JarvisShader);
const SEGMENTS = Array.from({ length: 7 }, (_, index) => index);

export const mockCoreTelemetry = dashboardMockData.core;

const displayMetric = (value, suffix = "") =>
  value == null ? dashboardCopy.common.unavailable : `${value}${suffix}`;

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

  const connectorPath = ({ angle, target }) => {
    const start = polar(angle, radius * 0.96);
    const exit = polar(angle, radius * 1.035);
    const endY = statusTop + 5;
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

                <circle cx={connector.target} cy={statusTop + 5} r="2.8" />
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

  const health =
    telemetry.systemHealth == null
      ? dashboardCopy.common.unavailable
      : `${Math.max(0, Math.min(100, telemetry.systemHealth))}%`;

  return (
    <div
      className="jarvis-core-panel__telemetry jarvis-core__telemetry"
      data-status={status}
      aria-label="JARVIS core telemetry"
    >
      <div className="jarvis-core__telemetry-group jarvis-core__telemetry-group--thermal">
        <div className="jarvis-core__metric">
          <span className="jarvis-core__telemetry-label">
            {dashboardCopy.core.cpuTemperatureLabel}
          </span>

          <strong className="jarvis-core__telemetry-value">
            {displayMetric(
              telemetry.cpuTemperature,
              dashboardCopy.core.units.temperature,
            )}
          </strong>
        </div>

        <div className="jarvis-core__metric">
          <span className="jarvis-core__telemetry-label">
            {dashboardCopy.core.fanSpeedLabel}
          </span>

          <strong className="jarvis-core__telemetry-value">
            {displayMetric(
              telemetry.fanSpeed,
              dashboardCopy.core.units.fanSpeed,
            )}
          </strong>
        </div>
      </div>

      <div className="jarvis-core__telemetry-group jarvis-core__telemetry-group--integrity">
        <span className="jarvis-core__telemetry-heading">
          {dashboardCopy.core.integrityLabel}
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

          <strong className="jarvis-core__integrity-value">{health}</strong>

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
        <span className="jarvis-core__status-line jarvis-core__status-line--primary">
          <i />
          {copy.core}
        </span>

        <span className="jarvis-core__status-line">
          <i />
          {dashboardCopy.core.secureLabel}
        </span>

        <span className="jarvis-core__status-line">
          <i />
          {dashboardCopy.core.monitoringLabel}
        </span>
      </div>
    </div>
  );
});

export default function JarvisCorePanel({ telemetry = mockCoreTelemetry }) {
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
          <StableJarvisShader quality="balanced" />
        </div>
      </div>

      <JarvisCoreTelemetry telemetry={telemetry} />
    </div>
  );
}
