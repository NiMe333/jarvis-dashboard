# JARVIS dashboard API

The backend is a dependency-free Node.js REST API. It supports the original
mock provider and a read-only Proxmox provider behind the same response
contract and routes.

## Project layout

```text
jarvis-dashboard/
├── frontend/             React + Vite application
├── backend/
│   ├── server.js         HTTP server and active service provider
│   ├── routes/           Stable REST route mapping
│   ├── clients/          Proxmox HTTPS client
│   ├── services/         Mock, Proxmox, and Linux sensor providers
│   ├── mock-data/        Backend mock values
│   └── config/           Environment loading
└── shared/
    └── data-shapes.js    Shared endpoint names and response fields
```

## Local development

Node.js `^20.19.0` or `>=22.12.0` is recommended because the frontend uses
Vite 7.

From the project root, configure and start the API:

```bash
cp backend/.env.example backend/.env
npm run dev:backend
```

The API listens on `http://localhost:3001` by default. In another terminal,
configure and start the frontend:

```bash
cp frontend/.env.example frontend/.env.local
npm ci --prefix frontend
npm run dev:frontend
```

Both development servers can also be started together:

```bash
npm run dev
```

If `VITE_API_BASE_URL` is empty or the API is unavailable, the dashboard shows
unavailable data until the API returns. The frontend refreshes all dashboard
endpoints every five seconds and prevents overlapping refresh cycles.

## Data source configuration

Mock mode remains the default:

```dotenv
DASHBOARD_DATA_SOURCE=mock
```

For Proxmox, copy `backend/.env.example` to `backend/.env` and configure:

```dotenv
HOST=0.0.0.0
PORT=3001
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173

DASHBOARD_DATA_SOURCE=proxmox
PROXMOX_API_URL=https://proxmox.example.local:8006
PROXMOX_WEB_URL=https://proxmox.example.local:8006
PROXMOX_TOKEN_ID=dashboard@pve!jarvis-readonly
PROXMOX_TOKEN_SECRET=replace-with-token-secret
PROXMOX_NODE_NAME=pve
PROXMOX_TLS_REJECT_UNAUTHORIZED=true
PROXMOX_RESTART_ENABLED=false
```

`PROXMOX_API_URL` is the Proxmox origin and port, without `/api2/json`.
`PROXMOX_WEB_URL` is the browser destination used by the Open Proxmox action;
it may be a separate Tailscale or reverse-proxy URL.
`PROXMOX_NODE_NAME` must exactly match the node name shown by Proxmox. The
backend sends the token as a `PVEAPIToken` authorization header; credentials
never enter the frontend bundle or API responses.

The Proxmox provider starts only when all four URL, token ID, token secret, and
node variables are present. If configuration is incomplete, the backend logs
the missing variable names and starts with the mock provider. If a configured
Proxmox server is temporarily unavailable, API requests fail and the frontend
retains its local mock fallback.

### API token permissions

Create a dedicated Proxmox user and API token used only by this dashboard.
Grant the built-in read-only `PVEAuditor` role at `/` with propagation to the
dedicated user and, when token privilege separation is enabled, to the token as
well. Proxmox evaluates a separated token using the intersection of the user
and token permissions. This role supplies the audit privileges needed to read
node status, guest status, storage status, and recent tasks without granting VM
power or configuration permissions.

Example commands, run from a Proxmox node as an administrator:

```bash
pveum user add dashboard@pve
pveum acl modify / -user dashboard@pve -role PVEAuditor
pveum user token add dashboard@pve jarvis-readonly -privsep 1
pveum acl modify / -token 'dashboard@pve!jarvis-readonly' -role PVEAuditor
```

Save the generated token secret immediately; Proxmox only displays it when the
token is created. You can inspect the effective grants with:

```bash
pveum user permissions dashboard@pve
pveum user token permissions dashboard@pve jarvis-readonly
```

The integration performs only read operations by default. Setting
`PROXMOX_RESTART_ENABLED=true` enables the confirmed node-reboot action. The
API token and its user must both have `Sys.PowerMgmt` on the selected node when
token privilege separation is enabled. Keep this disabled for read-only tokens.

### Host hardware sensors

The Proxmox REST API does not normally expose CPU temperature, SATA SMART
health, fan RPM, Intel RAPL power, or physical-interface byte counters. The
backend reads these from Linux only when it is running directly on the selected
Proxmox node: the short local hostname must match `PROXMOX_NODE_NAME` and
`/etc/pve` must exist. Otherwise those fields are returned as `null` with an
`unavailable` sensor state.

Direct-host collection uses these read-only sources:

- `lm-sensors` via `sensors -j` for CPU, Fujitsu board and fan readings. The
  `coretemp` `Package id 0` reading is the CPU package temperature and its
  `Core N` readings remain separately labelled. `ftsteutates` temperatures
  remain generic channels; `FAULT` and zero-RPM fan values are unavailable.
- `/sys/class/powercap/intel-rapl:*` for measured package power
- `/proc/net/route` and `/proc/net/dev` for interface counters and rates
- `smartctl -j -a` for SATA/NVMe temperature and SMART health

Install `smartmontools` on the Proxmox node if SMART information is required.
The backend account must have read permission for the relevant sysfs files and
disk device. Do not grant broader device or root access to a dashboard running
inside an LXC merely to obtain sensors; leaving these fields unavailable is the
safer configuration.

### Remote sensor agent for an LXC dashboard backend

When the dashboard backend runs outside the Proxmox host, use the included
sensor agent rather than exposing host `/sys`, `/dev`, or `/proc` into the LXC.
The agent has a single authenticated read-only endpoint and restricts requests
to the dashboard LXC IP address.

On the Proxmox host, place `backend/sensor_agent.py` at
`/opt/jarvis-sensor-agent/sensor_agent.py` and create
`/etc/jarvis-sensor-agent.env` from
`backend/.sensor-agent.env.example`. Set `SENSOR_AGENT_ALLOWED_IPS` to the
dashboard LXC address, set a unique random token of at least 32 characters,
and use the same token in the dashboard backend's `HOST_METRICS_AGENT_TOKEN`.
Then install `backend/deploy/jarvis-sensor-agent.service` in
`/etc/systemd/system/` and enable it with `systemctl enable --now
jarvis-sensor-agent`.

For a standard deployment, copy the `backend/` directory to the Proxmox host
and run `sudo backend/deploy/install-sensor-agent.sh 192.168.0.30 jarvis`.
The installer writes the agent token to `/etc/jarvis-sensor-agent.env` with
root-only permissions and enables the systemd service.

The dashboard backend uses the agent only when both of the following settings
are configured in its `.env` file:

```dotenv
HOST_METRICS_AGENT_URL=http://192.168.0.11:3100
HOST_METRICS_AGENT_TOKEN=the-same-long-random-token
```

The agent is intentionally not a general remote-command service. It only
returns collected hardware metrics at `GET /metrics` to the permitted LXC IP
when the bearer token matches.

## Endpoints and response shapes

All endpoints accept `GET` and return JSON. Values come from the selected data
source.

### `GET /api/health`

```js
{ status, source, timestamp, uptimeSeconds, node, hostMetricsAvailable,
  unavailableSources }
```

### `GET /api/system`

```js
{
  header: { alertCount, systemStatus },
  systemOverview: { uptime, hostname, hypervisor, processor, memory, storage },
  overviewStatus: { lastEventTime, lastEvent, state },
  core: { cpuTemperature, fanSpeed, systemHealth, status },
  virtualization: { runningVms, totalVms, runningContainers, totalContainers }
}
```

### `GET /api/resources`

```js
{
  cpuUsage, cpuCount, cpuState,
  memoryUsed, memoryTotal, memoryAvailable,
  storageUsed, storageTotal, storageFree,
  swapUsed, swapTotal, loadAverage, uptime, processCount
}
```

### `GET /api/network`

```js
{
  downloadRate, uploadRate, totalReceived, totalTransmitted, networkInterface,
  networkSeries: [{ offsetSeconds, downloadRate, uploadRate }]
}
```

Rates are Mbps and totals are bytes.

### `GET /api/temperature`

```js
{
  cpuTemperature, ssdTemperature, ssdSmartHealth, ssdDevice,
  powerWatts, fanRpm, sensorStatus,
  sensorStates: { cpuTemperature, ssdTemperature, powerWatts }
}
```

Temperature values are degrees Celsius, power is watts, and fan speed is RPM.

### `GET /api/services`

```js
[{ id, name, description, icon, url, status, statusLabel, statusDetails,
   kind, vmid, node, cpuUsage, cpuCount, memoryUsed, memoryTotal,
   storageUsed, storageTotal, networkReceived, networkTransmitted, uptime }]
```

Supported frontend states are `running`, `stopped`, `warning`, and `unknown`.

### `GET /api/events`

```js
[{ id, timestamp, message, type, serviceId }]
```

Supported event types are `info`, `success`, `warning`, and `error`.

### `GET /api/quick-actions`

```js
[{ id, label, icon, url, description, enabled }]
```

An empty URL keeps the action disabled. This endpoint does not execute system
operations.

### `POST /api/actions/restart`

Requests a reboot of the configured Proxmox node. The backend accepts this
only when `PROXMOX_RESTART_ENABLED=true`; Proxmox still enforces the API token's
`Sys.PowerMgmt` permission.

## Provider boundary

The route layer in `backend/routes/apiRoutes.js` only calls the methods defined
by `backend/services/dashboardService.js`. Provider selection lives in
`backend/services/createDashboardService.js`; the implementations are
`mockDashboardService.js` and `proxmoxDashboardService.js`.

Current environment variables:

- `HOST`: API bind address, default `0.0.0.0`
- `PORT`: API port, default `3001`
- `CORS_ORIGIN`: comma-separated allowed frontend origins
- `DASHBOARD_DATA_SOURCE`: `mock` or `proxmox`
- `PROXMOX_API_URL`: Proxmox HTTPS origin, normally port 8006
- `PROXMOX_WEB_URL`: browser URL used by Open Proxmox
- `PROXMOX_TOKEN_ID`: full `user@realm!token-name` identifier
- `PROXMOX_TOKEN_SECRET`: API token secret
- `PROXMOX_NODE_NAME`: target Proxmox node
- `PROXMOX_TLS_REJECT_UNAUTHORIZED`: certificate validation, default `true`
- `PROXMOX_RESTART_ENABLED`: enables confirmed Proxmox node reboot, default `false`
- `VITE_API_BASE_URL`: frontend build-time API base URL

Keep secrets only in the backend environment. Never expose them through a
`VITE_` variable because Vite embeds those values in the browser bundle.

Set permissions on the backend environment file so only the service account
can read it, for example `chmod 600 backend/.env`. Prefer a certificate trusted
by the backend host. Set `PROXMOX_TLS_REJECT_UNAUTHORIZED=false` only for a
self-signed Proxmox certificate on a trusted private network; this weakens
server identity verification and should not be used across untrusted networks.
