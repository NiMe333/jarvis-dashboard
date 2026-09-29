import DashboardBackground from "../background/DashboardBackground.jsx";
import "./DashboardShell.css";

export default function DashboardShell({ children, tone = "normal" }) {
  return (
    <main className={`dashboard-shell dashboard-shell--${tone}`}>
      <DashboardBackground />
      <div className="dashboard-shell__content">{children}</div>
    </main>
  );
}
