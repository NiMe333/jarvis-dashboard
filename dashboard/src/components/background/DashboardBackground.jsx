import "./DashboardBackground.css";

const hudMarks = [
  { className: "hud-mark--north-west", label: "01 / 48°" },
  { className: "hud-mark--north-east", label: "GRID // A7" },
  { className: "hud-mark--south-west", label: "SYS: IDLE" },
  { className: "hud-mark--south-east", label: "07.24.01" },
  { className: "hud-mark--west-tick", label: "" },
  { className: "hud-mark--east-tick", label: "" },
];

export default function DashboardBackground() {
  return (
    <div className="dashboard-background" aria-hidden="true">
      <div className="dashboard-background__dots dashboard-background__dots--primary" />
      <div className="dashboard-background__dots dashboard-background__dots--secondary" />
      <div className="dashboard-background__particles">
        <i className="atmospheric-particle atmospheric-particle--01" />
        <i className="atmospheric-particle atmospheric-particle--02" />
        <i className="atmospheric-particle atmospheric-particle--03" />
        <i className="atmospheric-particle atmospheric-particle--04" />
        <i className="atmospheric-particle atmospheric-particle--05" />
        <i className="atmospheric-particle atmospheric-particle--06" />
        <i className="atmospheric-particle atmospheric-particle--07" />
        <i className="atmospheric-particle atmospheric-particle--08" />
        <i className="atmospheric-particle atmospheric-particle--09" />
        <i className="atmospheric-particle atmospheric-particle--10" />
      </div>
      <div className="dashboard-background__scanlines" />
      <div className="dashboard-background__hud">
        {hudMarks.map(({ className, label }) => (
          <span className={`hud-mark ${className}`} key={className}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
