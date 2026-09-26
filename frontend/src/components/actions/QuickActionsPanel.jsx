import {
  CircleHelp,
  Download,
  FileText,
  House,
  Play,
  RefreshCw,
  Server,
} from "lucide-react";
import HudPanel from "../panel/HudPanel.jsx";
import { dashboardCopy } from "../../config/dashboardContent.js";
import "./QuickActionsPanel.css";

const ACTION_ICONS = {
  home: House,
  logs: FileText,
  restart: RefreshCw,
  server: Server,
  start: Play,
  update: Download,
};

function QuickAction({ action }) {
  const Icon = ACTION_ICONS[action.icon] ?? CircleHelp;
  const hasDestination = Boolean(action.url?.trim());
  const content = (
    <>
      <span className="quick-actions__icon" aria-hidden="true">
        <Icon size={18} strokeWidth={1.65} />
      </span>
      <span className="quick-actions__label">{action.label}</span>
    </>
  );

  if (hasDestination) {
    return (
      <a
        className="quick-actions__button quick-actions__button--active"
        href={action.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${action.label} — ${dashboardCopy.quickActions.opensNewTab}`}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className="quick-actions__button"
      title={dashboardCopy.quickActions.destinationMissing}
      disabled
    >
      {content}
    </button>
  );
}

export default function QuickActionsPanel({ actions = [], className = "" }) {
  return (
    <HudPanel
      title={dashboardCopy.panels.quickActions.title}
      subtitle={dashboardCopy.panels.quickActions.subtitle}
      className={`quick-actions ${className}`.trim()}
      frameStyle="contained"
      energy="single"
    >
      <div className="quick-actions__grid">
        {actions.length > 0
          ? actions.map((action) => <QuickAction key={action.id} action={action} />)
          : <p>{dashboardCopy.common.unavailable}</p>}
      </div>
    </HudPanel>
  );
}
