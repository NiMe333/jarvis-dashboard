import { useEffect, useRef, useState } from "react";
import { dashboardCopy } from "../../config/dashboardContent.js";

const directives = dashboardCopy.header.directives;

function DirectiveLines({ directive, className, hidden = false }) {
  return (
    <span className={className} aria-hidden={hidden || undefined}>
      {`${directive.first}, ${directive.second}.`}
    </span>
  );
}

export default function RotatingDirective() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [outgoingIndex, setOutgoingIndex] = useState(null);
  const activeIndexRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const timersRef = useRef({ dwell: null, transition: null });

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => {
      reducedMotionRef.current = motionQuery.matches;
    };
    updateMotionPreference();
    motionQuery.addEventListener("change", updateMotionPreference);
    return () =>
      motionQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    const clearTimers = () => {
      window.clearTimeout(timersRef.current.dwell);
      window.clearTimeout(timersRef.current.transition);
    };
    const scheduleNext = () => {
      if (document.hidden) return;
      timersRef.current.dwell = window.setTimeout(() => {
        const currentIndex = activeIndexRef.current;
        const nextIndex = (currentIndex + 1) % directives.length;

        if (!reducedMotionRef.current) {
          setOutgoingIndex(currentIndex);
          timersRef.current.transition = window.setTimeout(
            () => setOutgoingIndex(null),
            350,
          );
        }

        activeIndexRef.current = nextIndex;
        setActiveIndex(nextIndex);
        scheduleNext();
      }, 8000);
    };
    const handleVisibility = () => {
      clearTimers();
      setOutgoingIndex(null);
      if (!document.hidden) scheduleNext();
    };

    scheduleNext();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearTimers();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <div className="rotating-directive">
      <span className="rotating-directive__meta">DIRECTIVE</span>
      <span
        className="rotating-directive__messages"
        aria-live="polite"
        aria-atomic="true"
      >
        {outgoingIndex !== null && (
          <DirectiveLines
            directive={directives[outgoingIndex]}
            className="rotating-directive__message rotating-directive__message--outgoing"
            hidden
          />
        )}
        <DirectiveLines
          directive={directives[activeIndex]}
          className="rotating-directive__message rotating-directive__message--active"
        />
      </span>
      <span className="rotating-directive__rail" aria-hidden="true" />
    </div>
  );
}
