import http from "node:http";
import https from "node:https";

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

export class ProxmoxApiError extends Error {
  constructor(message, { statusCode = null, path = null } = {}) {
    super(message);
    this.name = "ProxmoxApiError";
    this.statusCode = statusCode;
    this.path = path;
  }
}

export class ProxmoxClient {
  constructor({ apiUrl, tokenId, tokenSecret, tlsRejectUnauthorized = true, timeoutMs = 10_000 }) {
    this.baseUrl = apiUrl.replace(/\/+$/, "").replace(/\/api2\/json$/i, "");
    this.authorization = `PVEAPIToken=${tokenId}=${tokenSecret}`;
    this.tlsRejectUnauthorized = tlsRejectUnauthorized;
    this.timeoutMs = timeoutMs;
  }

  async get(path, query = {}) {
    const url = new URL(`${this.baseUrl}/api2/json${path}`);
    Object.entries(query).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });

    const transport = url.protocol === "https:" ? https : http;

    return new Promise((resolve, reject) => {
      const request = transport.request(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: this.authorization,
        },
        ...(url.protocol === "https:"
          ? { rejectUnauthorized: this.tlsRejectUnauthorized }
          : {}),
      }, (response) => {
        const chunks = [];
        let receivedBytes = 0;

        response.on("data", (chunk) => {
          receivedBytes += chunk.length;
          if (receivedBytes > MAX_RESPONSE_BYTES) {
            request.destroy(new ProxmoxApiError("Proxmox response exceeded the size limit", { path }));
            return;
          }
          chunks.push(chunk);
        });

        response.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          let payload;

          try {
            payload = body ? JSON.parse(body) : {};
          } catch {
            reject(new ProxmoxApiError("Proxmox returned invalid JSON", {
              statusCode: response.statusCode,
              path,
            }));
            return;
          }

          if ((response.statusCode ?? 500) < 200 || (response.statusCode ?? 500) >= 300) {
            reject(new ProxmoxApiError(
              payload?.errors
                ? `Proxmox request failed: ${JSON.stringify(payload.errors)}`
                : `Proxmox request failed with HTTP ${response.statusCode}`,
              { statusCode: response.statusCode, path },
            ));
            return;
          }

          resolve(payload.data);
        });
      });

      request.setTimeout(this.timeoutMs, () => {
        request.destroy(new ProxmoxApiError("Proxmox request timed out", { path }));
      });
      request.on("error", reject);
      request.end();
    });
  }
}
