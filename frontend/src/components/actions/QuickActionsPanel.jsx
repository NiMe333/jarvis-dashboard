import { useCallback, useEffect, useRef, useState } from "react";
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

const PROXMOX_WEB_URL = "https://jarvis.taile46e9c.ts.net/#v1:0:=node%2Fjarvis:4:=jsconsole::::::5";

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
        className={`quick-actions__button quick-actions__button--active quick-actions__button--${action.id}`}
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
        className={`quick-actions__button quick-actions__button--active quick-actions__button--${action.id}`}
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

function RestartConfirmation({ countdown, onCancel, onConfirm }) {
  return (
    <div className="restart-confirmation" role="presentation">
      <div className="restart-confirmation__backdrop" onClick={onCancel} />
      <section
        className="restart-confirmation__dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="restart-confirmation-title"
        aria-describedby="restart-confirmation-description"
      >
        <span className="restart-confirmation__eyebrow">CRITICAL HOST OPERATION</span>
        <h2 id="restart-confirmation-title">REBOOT PROXMOX HOST</h2>
        <p id="restart-confirmation-description">
          All running containers, virtual machines, and dashboard services will be interrupted.
        </p>

        <div className="restart-confirmation__countdown" aria-live="polite">
          <strong>{countdown}</strong>
          <span>{countdown === 0 ? "RESTARTING" : "SAFETY DELAY"}</span>
          <i style={{ "--countdown-progress": `${(10 - countdown) * 10}%` }} aria-hidden="true" />
        </div>

        <div className="restart-confirmation__actions">
          <button type="button" className="restart-confirmation__cancel" onClick={onCancel}>
            CANCEL
          </button>
          <button
            type="button"
            className="restart-confirmation__execute"
            onClick={onConfirm}
          >
            {countdown > 0 ? "RESTART NOW" : "RESTARTING…"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default function QuickActionsPanel({ actions = [], className = "" }) {
  const [restartState, setRestartState] = useState("idle");
  const [restartFeedback, setRestartFeedback] = useState("");
  const [isRestartConfirmationOpen, setIsRestartConfirmationOpen] = useState(false);
  const [restartCountdown, setRestartCountdown] = useState(10);
  const restartInFlightRef = useRef(false);
  const visibleActions = actions.filter((action) => ["restart-service", "open-proxmox"].includes(action.id));

  const restart = useCallback(async () => {
    if (restartInFlightRef.current) return;
    restartInFlightRef.current = true;
    setIsRestartConfirmationOpen(false);
    setRestartState("loading");
    setRestartFeedback("RESTARTING…");
    try {
      const result = await dashboardApi.restart();
      if (!result?.accepted) throw new Error(result?.reason || "Restart was not accepted");
      setRestartState("success");
      setRestartFeedback("REBOOT ACCEPTED");
    } catch (error) {
      restartInFlightRef.current = false;
      setRestartState("error");
      setRestartFeedback(error?.message || "RESTART FAILED");
    }
  }, []);

  useEffect(() => {
    if (!isRestartConfirmationOpen) return undefined;

    setRestartCountdown(10);
    const timer = window.setInterval(() => {
      setRestartCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          void restart();
          return 0;
        }
        return current - 1;
      });
    }, 1_000);

    return () => window.clearInterval(timer);
  }, [isRestartConfirmationOpen, restart]);

  const openRestartConfirmation = () => {
    if (restartState !== "loading") setIsRestartConfirmationOpen(true);
  };

  return (
    <>
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
                onRestart={openRestartConfirmation}
              />
            ))
            : <p>{dashboardCopy.common.unavailable}</p>}
        </div>
        <p className="quick-actions__feedback" aria-live="polite" data-state={restartState}>
          {restartFeedback}
        </p>
      </HudPanel>
      {isRestartConfirmationOpen && (
        <RestartConfirmation
          countdown={restartCountdown}
          onCancel={() => setIsRestartConfirmationOpen(false)}
          onConfirm={restart}
        />
      )}
    </>
  );
}
