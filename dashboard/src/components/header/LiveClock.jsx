import { useEffect, useState } from "react";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short", month: "short", day: "2-digit", year: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

function formatHeaderDate(date) {
  const parts = Object.fromEntries(dateFormatter.formatToParts(date).map(({ type, value }) => [type, value]));
  return `${parts.weekday.toUpperCase()}, ${parts.month.toUpperCase()} ${parts.day}, ${parts.year}`;
}

export default function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="live-clock">
      <time className="live-clock__date" dateTime={now.toISOString()}>{formatHeaderDate(now)}</time>
      <time className="live-clock__time" dateTime={now.toISOString()}>{timeFormatter.format(now)}</time>
    </div>
  );
}
