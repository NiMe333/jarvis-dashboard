import { loadLocalEnv } from "./loadEnv.js";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const configDirectory = dirname(fileURLToPath(import.meta.url));
loadLocalEnv(resolve(configDirectory, "../.env"));

const parsedPort = Number.parseInt(process.env.PORT ?? "3001", 10);
const requestedDataSource = process.env.DASHBOARD_DATA_SOURCE?.trim().toLowerCase() || "mock";
const dataSource = ["mock", "proxmox"].includes(requestedDataSource)
  ? requestedDataSource
  : "mock";

const proxmoxConfig = {
  apiUrl: process.env.PROXMOX_API_URL?.trim() || "",
  tokenId: process.env.PROXMOX_TOKEN_ID?.trim() || "",
  tokenSecret: process.env.PROXMOX_TOKEN_SECRET?.trim() || "",
  nodeName: process.env.PROXMOX_NODE_NAME?.trim() || "",
};

const requiredProxmoxVariables = {
  PROXMOX_API_URL: proxmoxConfig.apiUrl,
  PROXMOX_TOKEN_ID: proxmoxConfig.tokenId,
  PROXMOX_TOKEN_SECRET: proxmoxConfig.tokenSecret,
  PROXMOX_NODE_NAME: proxmoxConfig.nodeName,
};
const missingVariables = Object.entries(requiredProxmoxVariables)
  .filter(([, value]) => !value)
  .map(([key]) => key);

function booleanFromEnv(value, fallback) {
  if (value === undefined || value === "") return fallback;
  return !["0", "false", "no", "off"].includes(value.trim().toLowerCase());
}

function numberFromEnv(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export const env = Object.freeze({
  host: process.env.HOST?.trim() || "0.0.0.0",
  port: Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3001,
  allowedOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  dataSource,
  hostAlerts: Object.freeze({
    cpuUsageWarning: numberFromEnv(process.env.HOST_ALERT_CPU_WARNING_PERCENT, 85),
    cpuUsageCritical: numberFromEnv(process.env.HOST_ALERT_CPU_CRITICAL_PERCENT, 95),
    cpuSustainMs: numberFromEnv(process.env.HOST_ALERT_CPU_SUSTAIN_SECONDS, 300) * 1_000,
    cpuTempWarning: numberFromEnv(process.env.HOST_ALERT_CPU_TEMP_WARNING_C, 80),
    cpuTempCritical: numberFromEnv(process.env.HOST_ALERT_CPU_TEMP_CRITICAL_C, 90),
    memoryUsageWarning: numberFromEnv(process.env.HOST_ALERT_MEMORY_WARNING_PERCENT, 90),
    memoryUsageCritical: numberFromEnv(process.env.HOST_ALERT_MEMORY_CRITICAL_PERCENT, 96),
    memoryAvailableWarning: numberFromEnv(process.env.HOST_ALERT_MEMORY_AVAILABLE_WARNING_GIB, 1),
    memoryAvailableCritical: numberFromEnv(process.env.HOST_ALERT_MEMORY_AVAILABLE_CRITICAL_GIB, 0.5),
    diskFreeWarning: numberFromEnv(process.env.HOST_ALERT_DISK_FREE_WARNING_PERCENT, 10),
    diskFreeCritical: numberFromEnv(process.env.HOST_ALERT_DISK_FREE_CRITICAL_PERCENT, 5),
    ssdTempWarning: numberFromEnv(process.env.HOST_ALERT_SSD_TEMP_WARNING_C, 60),
    ssdTempCritical: numberFromEnv(process.env.HOST_ALERT_SSD_TEMP_CRITICAL_C, 70),
  }),
  proxmox: Object.freeze({
    ...proxmoxConfig,
    tlsRejectUnauthorized: booleanFromEnv(
      process.env.PROXMOX_TLS_REJECT_UNAUTHORIZED,
      true,
    ),
    isConfigured: missingVariables.length === 0,
    missingVariables,
  }),
});
