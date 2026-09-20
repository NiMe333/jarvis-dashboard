import DashboardShell from "../components/layout/DashboardShell.jsx";

export default function App() {
  return (
    <DashboardShell>
      <div className="initialization-marker" role="status">
        <p className="initialization-marker__title">JARVIS // INTERFACE INITIALIZED</p>
        <p className="initialization-marker__subtitle">BACKGROUND SYSTEM ONLINE</p>
      </div>
    </DashboardShell>
  );
}
