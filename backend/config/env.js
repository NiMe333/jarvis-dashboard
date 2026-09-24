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

export const env = Object.freeze({
  host: process.env.HOST?.trim() || "0.0.0.0",
  port: Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3001,
  allowedOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  dataSource,
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
