import { ProxmoxClient } from "../clients/proxmoxClient.js";
import { MockDashboardService } from "./mockDashboardService.js";
import { ProxmoxDashboardService } from "./proxmoxDashboardService.js";

export function createDashboardService(env) {
  if (env.dataSource !== "proxmox") {
    return new MockDashboardService();
  }

  if (!env.proxmox.isConfigured) {
    const missing = env.proxmox.missingVariables.join(", ");
    console.warn(`Proxmox data source is incomplete (${missing}); using mock data.`);
    return new MockDashboardService({
      fallbackReason: `Missing Proxmox configuration: ${missing}`,
    });
  }

  const client = new ProxmoxClient({
    apiUrl: env.proxmox.apiUrl,
    tokenId: env.proxmox.tokenId,
    tokenSecret: env.proxmox.tokenSecret,
    tlsRejectUnauthorized: env.proxmox.tlsRejectUnauthorized,
  });

  return new ProxmoxDashboardService({
    client,
    nodeName: env.proxmox.nodeName,
    alertConfig: env.hostAlerts,
  });
}
