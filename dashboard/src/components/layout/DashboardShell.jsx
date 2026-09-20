import DashboardBackground from "../background/DashboardBackground.jsx";
import "./DashboardShell.css";

export default function DashboardShell({ children }) {
  return (
    <main className="dashboard-shell">
      <DashboardBackground />
      <div className="dashboard-shell__content">{children}</div>
    </main>
  );
}
