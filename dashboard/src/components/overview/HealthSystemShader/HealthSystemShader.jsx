import "./HealthSystemShader.css";

const TICK_COUNT = 48;
const AMBER_TICKS = new Set([6, 18, 30, 42]);

const clampHealth = (health) => Math.max(0, Math.min(100, Number(health) || 0));

function HealthTick({ index, active }) {
  const major = index % 4 === 0;
  const cardinal = index % 12 === 0;
  const amber = AMBER_TICKS.has(index);
  const inner = cardinal ? 20 : major ? 22 : 24;
  const outer = cardinal ? 34 : major ? 30 : 28;

  return (
    <line
      className={[
        "health-system-shader__tick",
        active ? "is-active" : "",
        major ? "is-major" : "",
        cardinal ? "is-cardinal" : "",
        amber ? "is-amber" : "",
      ].filter(Boolean).join(" ")}
      x1="130"
      y1={inner}
      x2="130"
      y2={outer}
      transform={`rotate(${index * (360 / TICK_COUNT)} 130 130)`}
      key={index}
    />
  );
}

export default function HealthSystemShader({ health = 100, status }) {
  const value = clampHealth(health);
  const healthStatus = value < 65 ? "CRITICAL" : value < 90 ? "WARNING" : status ?? "HEALTHY";
  const activeTickCount = Math.round((value / 100) * TICK_COUNT);

  return (
    <div
      className="health-system-shader"
      data-health-state={healthStatus.toLowerCase()}
      role="img"
      aria-label={`${value}% system health, ${healthStatus.toLowerCase()}`}
    >
      <svg className="health-system-shader__dial" viewBox="0 0 260 260" aria-hidden="true">
        <g className="health-system-shader__pulse">
          <circle className="health-system-shader__breath-glow" cx="130" cy="130" r="91" />
          <circle className="health-system-shader__guide" cx="130" cy="130" r="96" />
          <circle className="health-system-shader__inner-guide" cx="130" cy="130" r="77" />
          <g className="health-system-shader__tick-rotor">
            {Array.from({ length: TICK_COUNT }, (_, index) => (
              <HealthTick key={index} index={index} active={index < activeTickCount} />
            ))}
          </g>
        </g>
        <g className="health-system-shader__static-rail">
          <circle className="health-system-shader__static-rail-cyan" cx="130" cy="130" r="92" />
          <circle className="health-system-shader__static-rail-amber" cx="130" cy="130" r="92" pathLength="100" />
        </g>
        <g className="health-system-shader__rotor">
          <circle className="health-system-shader__rotor-cyan" cx="130" cy="130" r="87" />
          <circle className="health-system-shader__rotor-amber" cx="130" cy="130" r="82" />
        </g>
        <path className="health-system-shader__corner" d="M23 48V23h25 M212 23h25v25 M237 212v25h-25 M48 237H23v-25" />
      </svg>
      <div className="health-system-shader__label">
        <strong><span>{value}</span><span className="health-system-shader__percent">%</span></strong>
        <small>{healthStatus}</small>
      </div>
    </div>
  );
}
