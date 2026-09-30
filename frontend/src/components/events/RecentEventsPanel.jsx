import { Fragment, useLayoutEffect, useMemo, useRef, useState } from "react";
import HudPanel from "../panel/HudPanel.jsx";
import { dashboardCopy } from "../../config/dashboardContent.js";
import "./RecentEventsPanel.css";

const VALID_EVENT_TYPES = new Set(Object.keys(dashboardCopy.events.typeLabels));
const TIME_FORMATTER = new Intl.DateTimeFormat([], {
  hour: "2-digit",
  minute: "2-digit",
});
const DATE_FORMATTER = new Intl.DateTimeFormat([], {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function normalizeEventType(type) {
  return VALID_EVENT_TYPES.has(type) ? type : "info";
}

function formatEventTime(timestamp) {
  const parsedTimestamp = new Date(timestamp);
  return Number.isNaN(parsedTimestamp.getTime())
    ? dashboardCopy.common.unavailable
    : TIME_FORMATTER.format(parsedTimestamp);
}

function eventDayKey(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return [date.getFullYear(), date.getMonth(), date.getDate()].join("-");
}

function isToday(timestamp) {
  return eventDayKey(timestamp) === eventDayKey(new Date());
}

function formatEventDate(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return dashboardCopy.common.unavailable;
  return isToday(timestamp) ? "TODAY" : DATE_FORMATTER.format(date).toUpperCase();
}

function EventRow({ event, expanded = false }) {
  const type = normalizeEventType(event.type);

  return (
    <article className={`recent-events__row recent-events__row--${type}${expanded ? " recent-events__row--expanded" : ""}`} title={event.message}>
      <span className="recent-events__indicator" aria-hidden="true" />
      <time dateTime={event.timestamp}>{formatEventTime(event.timestamp)}</time>
      <span className="recent-events__message" title={!expanded ? event.message : undefined}>
        {event.message}
      </span>
      {expanded && event.serviceId && (
        <span className="recent-events__service">{event.serviceId}</span>
      )}
    </article>
  );
}

function EventList({ events, expanded = false }) {
  let previousDay = null;

  return events.map((event) => {
    const day = eventDayKey(event.timestamp);
    const startsNewDay = day !== previousDay;
    previousDay = day;
    const showDate = startsNewDay && (expanded || !isToday(event.timestamp));

    return (
      <Fragment key={event.id}>
        {showDate && (
          <div className="recent-events__date-divider" role="separator">
            {formatEventDate(event.timestamp)}
          </div>
        )}
        <EventRow event={event} expanded={expanded} />
      </Fragment>
    );
  });
}

function useVisibleEventCount(containerRef, totalCount) {
  const [visibleCount, setVisibleCount] = useState(0);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const measure = () => {
      const rowHeight = Number.parseFloat(
        getComputedStyle(container).getPropertyValue("--event-row-height"),
      );
      const nextCount = rowHeight > 0
        ? Math.min(totalCount, Math.max(4, Math.floor(container.clientHeight / rowHeight)))
        : totalCount;
      setVisibleCount(nextCount);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, totalCount]);

  return visibleCount;
}

export default function RecentEventsPanel({ events = [], className = "" }) {
  const listRef = useRef(null);
  const dialogRef = useRef(null);
  const openButtonRef = useRef(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [events],
  );
  const visibleCount = useVisibleEventCount(listRef, sortedEvents.length);
  const visibleEvents = sortedEvents.slice(0, visibleCount);

  const openDialog = () => {
    setIsDialogOpen(true);
    dialogRef.current?.showModal();
  };

  const closeDialog = () => {
    dialogRef.current?.close();
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    openButtonRef.current?.focus();
  };

  return (
    <>
      <HudPanel
        title={dashboardCopy.panels.recentEvents.title}
        subtitle={dashboardCopy.panels.recentEvents.subtitle}
        className={`recent-events ${className}`.trim()}
        frameStyle="contained"
        variant="compact"
        action={(
          <button
            ref={openButtonRef}
            type="button"
            className="recent-events__view-all"
            aria-haspopup="dialog"
            aria-expanded={isDialogOpen}
            onClick={openDialog}
          >
            {dashboardCopy.events.viewAll}
          </button>
        )}
      >
        <div ref={listRef} className="recent-events__list">
          {sortedEvents.length === 0 ? (
            <p className="recent-events__empty">{dashboardCopy.events.empty}</p>
          ) : (
            <EventList events={visibleEvents} />
          )}
        </div>
      </HudPanel>

      <dialog
        ref={dialogRef}
        className="recent-events-dialog"
        aria-labelledby="recent-events-dialog-title"
        onClose={handleDialogClose}
        onCancel={() => setIsDialogOpen(false)}
      >
        <div className="recent-events-dialog__frame">
          <header className="recent-events-dialog__header">
            <div>
              <p>{dashboardCopy.panels.recentEvents.subtitle}</p>
              <h2 id="recent-events-dialog-title">{dashboardCopy.events.dialogTitle}</h2>
            </div>
            <button
              type="button"
              className="recent-events-dialog__close"
              aria-label={dashboardCopy.events.close}
              onClick={closeDialog}
              autoFocus
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>

          <div className="recent-events-dialog__list">
            {sortedEvents.length === 0 ? (
              <p className="recent-events__empty">{dashboardCopy.events.empty}</p>
            ) : (
              <EventList events={sortedEvents} expanded />
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
