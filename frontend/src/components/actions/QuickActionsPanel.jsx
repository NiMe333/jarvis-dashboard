import { useState } from "react";
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

const PROXMOX_WEB_URL = "https://jarvis.taile46e9c.ts.net/#v1:0:18:4:::::::";

function QuickAction({ action, restartState, onRestart }) {
  const Icon = ACTION_ICONS[action.icon] ?? CircleHelp;
  const label = dashboardCopy.quickActions.labels[action.id] ?? action.label;
  const destination = action.id === "open-proxmox"
    ? action.url?.trim() || PROXMOX_WEB_URL
    : action.url?.trim();
  const hasDestination = Boolean(destination);
  const content = (
    <>
      <span className="quick-actions__icon" aria-hidden="true">
        <Icon size={24} strokeWidth={1.65} />
      </span>
      <span className="quick-actions__label">{label}</span>
    </>
  );

  if (hasDestination) {
    return (
      <a
        className="quick-actions__button quick-actions__button--active"
        href={destination}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label} — ${dashboardCopy.quickActions.opensNewTab}`}
      >
        {content}
      </a>
    );
  }

  if (action.id === "restart-service") {
    const restartDisabled = action.enabled === false;
    return (
      <button
        type="button"
        className="quick-actions__button quick-actions__button--active"
        onClick={onRestart}
        disabled={restartState === "loading" || restartDisabled}
        title={restartDisabled ? "RESTART DISABLED IN BACKEND CONFIGURATION" : undefined}
      >
        {content}
      </button>
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
  const [restartState, setRestartState] = useState("idle");
  const [restartFeedback, setRestartFeedback] = useState("");
  const visibleActions = actions.filter((action) => ["restart-service", "open-proxmox"].includes(action.id));
  const restart = async () => {
    const confirmed = window.confirm(
      "Restart the Proxmox host? All running services and guests may be interrupted.",
    );
    if (!confirmed) return;

    setRestartState("loading");
    setRestartFeedback("RESTARTING…");
    try {
      const result = await dashboardApi.restart();
      if (!result?.accepted) throw new Error(result?.reason || "Restart was not accepted");
      setRestartState("success");
      setRestartFeedback("REBOOT ACCEPTED");
    } catch (error) {
      setRestartState("error");
      setRestartFeedback(error?.message || "RESTART FAILED");
    }
  };

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
          ? visibleActions.map((action) => (
            <QuickAction
              key={action.id}
              action={action}
              restartState={restartState}
              onRestart={restart}
            />
          ))
          : <p>{dashboardCopy.common.unavailable}</p>}
      </div>
      <p className="quick-actions__feedback" aria-live="polite" data-state={restartState}>
        {restartFeedback}
      </p>
    </HudPanel>
  );
}
