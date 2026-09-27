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
import { dashboardApi } from "../../api/dashboardApi.js";
import "./QuickActionsPanel.css";

const ACTION_ICONS = {
  home: House,
  logs: FileText,
  restart: RefreshCw,
  server: Server,
  start: Play,
  update: Download,
};

import { useState } from "react";

function QuickAction({ action }) {
  const [state, setState] = useState("idle");
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

  if (action.id === "restart-service") {
    const restart = async () => {
      setState("loading");
      try { await dashboardApi.restart(); setState("success"); }
      catch { setState("error"); }
    };
    return <button type="button" className="quick-actions__button quick-actions__button--active" onClick={restart} disabled={state === "loading"}>
      {content}<small className="quick-actions__feedback">{state === "loading" ? "RESTARTING…" : state === "success" ? "ACCEPTED" : state === "error" ? "FAILED" : "RESTART SERVER"}</small>
    </button>;
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
  const visibleActions = actions.filter((action) => ["restart-service", "open-proxmox"].includes(action.id));
  return (
    <HudPanel
      title={dashboardCopy.panels.quickActions.title}
      subtitle={dashboardCopy.panels.quickActions.subtitle}
      className={`quick-actions ${className}`.trim()}
      frameStyle="contained"
      energy="single"
    >
      <div className="quick-actions__grid">
        {visibleActions.length > 0
          ? visibleActions.map((action) => <QuickAction key={action.id} action={action} />)
          : <p>{dashboardCopy.common.unavailable}</p>}
      </div>
    </HudPanel>
  );
}
