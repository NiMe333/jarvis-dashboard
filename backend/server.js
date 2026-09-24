import { createServer } from "node:http";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { MockDashboardService } from "./services/mockDashboardService.js";

const service = new MockDashboardService();
const server = createServer(createApp({
  service,
  allowedOrigins: env.allowedOrigins,
}));

server.listen(env.port, env.host, () => {
  console.log(`JARVIS API listening on http://${env.host}:${env.port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
