import { useEffect, useState } from "react";

const weekdayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "long" });
const dateFormatter = new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", year: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

function formatHeaderDate(date) {
  const parts = Object.fromEntries(
    dateFormatter.formatToParts(date).map(({ type, value }) => [type, value]),
  );
  return `${parts.day} ${parts.month.toUpperCase()} ${parts.year}`;
}

export default function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  const formattedTime = timeFormatter.format(now);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="live-clock">
      <time className="live-clock__time" dateTime={now.toISOString()}>
        <span>{formattedTime.slice(0, 5)}</span>
        <small>{formattedTime.slice(-2)}</small>
      </time>
      <div className="live-clock__details">
        <span>{weekdayFormatter.format(now).toUpperCase()}</span>
        <time dateTime={now.toISOString()}>{formatHeaderDate(now)}</time>
        <span>LOCAL TIME</span>
      </div>
    </div>
  );
}
