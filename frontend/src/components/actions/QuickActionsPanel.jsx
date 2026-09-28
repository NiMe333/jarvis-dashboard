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

function QuickAction({ action, restartState, onRestart }) {
  const Icon = ACTION_ICONS[action.icon] ?? CircleHelp;
  const label = dashboardCopy.quickActions.labels[action.id] ?? action.label;
  const hasDestination = Boolean(action.url?.trim());
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
        href={action.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label} — ${dashboardCopy.quickActions.opensNewTab}`}
      >
        {content}
      </a>
    );
  }

  if (action.id === "restart-service") {
    return (
      <button
        type="button"
        className="quick-actions__button quick-actions__button--active"
        onClick={onRestart}
        disabled={restartState === "loading"}
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
  const visibleActions = actions.filter((action) => ["restart-service", "open-proxmox"].includes(action.id));
  const restart = async () => {
    setRestartState("loading");
    try {
      await dashboardApi.restart();
      setRestartState("success");
    } catch {
      setRestartState("error");
    }
  };
  const feedback = {
    loading: "RESTARTING…",
    success: "ACCEPTED",
    error: "FAILED",
  }[restartState] ?? "";

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
        {feedback}
      </p>
    </HudPanel>
  );
}
