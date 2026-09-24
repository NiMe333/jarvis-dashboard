import { createServer } from "node:http";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { createDashboardService } from "./services/createDashboardService.js";

const service = createDashboardService(env);
const server = createServer(createApp({
  service,
  allowedOrigins: env.allowedOrigins,
}));

server.listen(env.port, env.host, () => {
  console.log(`JARVIS API listening on http://${env.host}:${env.port}`);
  console.log(`Dashboard data source: ${service.constructor.name}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
