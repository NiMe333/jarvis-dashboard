// Conservative host thresholds. They are passed from env.js so deployments can
// tune them without changing code. CPU alerts require a sustained breach.
export function evaluateHostWarnings({ metrics, host, thresholds, cpuHighSince, now = Date.now() }) {
  const alerts = [];
  const unavailable = [];
  const add = (metric, value, warningAt, criticalAt, suffix = "") => {
    if (!Number.isFinite(value)) { unavailable.push(metric); return; }
    if (value >= criticalAt) alerts.push({ level: "critical", metric, value, suffix });
    else if (value >= warningAt) alerts.push({ level: "warning", metric, value, suffix });
  };

  let sustainedSince = cpuHighSince;
  if (!Number.isFinite(metrics.cpuUsage)) unavailable.push("CPU usage");
  else if (metrics.cpuUsage >= thresholds.cpuUsageWarning) {
    sustainedSince ??= now;
    if (now - sustainedSince >= thresholds.cpuSustainMs) {
      add("CPU usage", metrics.cpuUsage, thresholds.cpuUsageWarning, thresholds.cpuUsageCritical, "%");
    }
  } else sustainedSince = null;

  const temperatures = Array.isArray(host.cpuTemperatures) ? host.cpuTemperatures : [];
  const packageTemperature = host.cpuTemperature;
  if (temperatures.length === 0 && !Number.isFinite(packageTemperature)) unavailable.push("CPU temperature");
  if (Number.isFinite(packageTemperature)) add("CPU package", packageTemperature, thresholds.cpuTempWarning, thresholds.cpuTempCritical, " °C");
  temperatures.filter((reading) => /^core \d+$/i.test(reading.label ?? "")).forEach((reading) =>
    add(reading.label, reading.temperature, thresholds.cpuTempWarning, thresholds.cpuTempCritical, " °C"));

  const memoryPercent = Number.isFinite(metrics.memoryUsed) && Number.isFinite(metrics.memoryTotal) && metrics.memoryTotal > 0
    ? metrics.memoryUsed / metrics.memoryTotal * 100 : null;
  add("Memory usage", memoryPercent, thresholds.memoryUsageWarning, thresholds.memoryUsageCritical, "%");
  if (Number.isFinite(metrics.memoryAvailable)) {
    if (metrics.memoryAvailable <= thresholds.memoryAvailableCritical) alerts.push({ level: "critical", metric: "Memory available", value: metrics.memoryAvailable, suffix: " GiB" });
    else if (metrics.memoryAvailable <= thresholds.memoryAvailableWarning) alerts.push({ level: "warning", metric: "Memory available", value: metrics.memoryAvailable, suffix: " GiB" });
  } else unavailable.push("Memory available");

  const freePercent = Number.isFinite(metrics.rootStorageFree) && Number.isFinite(metrics.rootStorageTotal) && metrics.rootStorageTotal > 0
    ? metrics.rootStorageFree / metrics.rootStorageTotal * 100 : null;
  if (Number.isFinite(freePercent)) {
    if (freePercent <= thresholds.diskFreeCritical) alerts.push({ level: "critical", metric: "Root disk free", value: freePercent, suffix: "%" });
    else if (freePercent <= thresholds.diskFreeWarning) alerts.push({ level: "warning", metric: "Root disk free", value: freePercent, suffix: "%" });
  } else unavailable.push("Root disk space");

  if (host.ssdSmartHealth === false) alerts.push({ level: "critical", metric: "SMART health", value: "FAILED", suffix: "" });
  else if (host.ssdSmartHealth === null || host.ssdSmartHealth === undefined) unavailable.push("SMART health");
  add("SSD temperature", host.ssdTemperature, thresholds.ssdTempWarning, thresholds.ssdTempCritical, " °C");

  const status = alerts.some((alert) => alert.level === "critical") ? "critical"
    : alerts.length > 0 ? "warning"
      : unavailable.length > 0 && !Number.isFinite(metrics.cpuUsage) ? "unavailable"
        : "normal";
  return { status, alerts, unavailable, cpuHighSince: sustainedSince };
}
