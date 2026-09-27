import { createApiRoutes } from "./routes/apiRoutes.js";

function sendJson(response, statusCode, payload, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extraHeaders,
  });
  response.end(JSON.stringify(payload));
}

function corsHeaders(request, allowedOrigins) {
  const origin = request.headers.origin;
  if (!origin) return {};

  const isAllowed = allowedOrigins.includes("*") || allowedOrigins.includes(origin);
  if (!isAllowed) return {};

  return {
    "Access-Control-Allow-Origin": allowedOrigins.includes("*") ? "*" : origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export function createApp({ service, allowedOrigins }) {
  const routes = createApiRoutes(service);

  return async function app(request, response) {
    const headers = corsHeaders(request, allowedOrigins);

    if (request.method === "OPTIONS") {
      response.writeHead(204, headers);
      response.end();
      return;
    }

    const url = new URL(request.url ?? "/", "http://localhost");
    if (request.method !== "GET" && !(request.method === "POST" && url.pathname === "/api/actions/restart")) {
      sendJson(response, 405, { error: "Method not allowed" }, {
        ...headers,
        Allow: "GET, OPTIONS",
      });
      return;
    }

    const path = url.pathname.length > 1
      ? url.pathname.replace(/\/+$/, "")
      : url.pathname;
    const handler = routes.get(path);

    if (!handler) {
      sendJson(response, 404, { error: "Endpoint not found" }, headers);
      return;
    }

    try {
      sendJson(response, 200, await handler(), headers);
    } catch (error) {
      console.error("Dashboard API request failed", error);
      sendJson(response, 500, { error: "Internal server error" }, headers);
    }
  };
}
