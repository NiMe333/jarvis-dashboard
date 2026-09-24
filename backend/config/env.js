import { loadLocalEnv } from "./loadEnv.js";

loadLocalEnv();

const parsedPort = Number.parseInt(process.env.PORT ?? "3001", 10);

export const env = Object.freeze({
  host: process.env.HOST?.trim() || "0.0.0.0",
  port: Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3001,
  allowedOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
});
