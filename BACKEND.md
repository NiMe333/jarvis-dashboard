# JARVIS dashboard API

The backend is a dependency-free Node.js REST API. It currently uses realistic
mock records and keeps the same response contract that a later Proxmox data
provider must implement.

## Project layout

```text
jarvis-dashboard/
├── frontend/             React + Vite application
├── backend/
│   ├── server.js         HTTP server and active service provider
│   ├── routes/           Stable REST route mapping
│   ├── services/         Provider interface and mock implementation
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

If `VITE_API_BASE_URL` is empty or the API is unavailable, the frontend keeps
using `frontend/src/config/dashboardMockData.js`. There is no polling; data is
loaded once when the dashboard mounts.

## Endpoints and response shapes

All endpoints accept `GET`, return JSON, and currently use mock data.

### `GET /api/health`

```js
{ status, source, timestamp, uptimeSeconds }
```

### `GET /api/system`

```js
{
  header: { alertCount, systemStatus },
  systemOverview: { uptime, hostname, hypervisor, processor, memory, storage },
  overviewStatus: { lastEventTime, lastEvent, state },
  core: { cpuTemperature, fanSpeed, systemHealth, status }
}
```

### `GET /api/resources`

```js
{
  cpuUsage, cpuState,
  memoryUsed, memoryTotal, memoryAvailable,
  storageUsed, storageTotal, storageFree,
  loadAverage, uptime, processCount
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
  cpuTemperature, ssdTemperature, powerWatts, fanRpm, sensorStatus,
  sensorStates: { cpuTemperature, ssdTemperature, powerWatts }
}
```

Temperature values are degrees Celsius, power is watts, and fan speed is RPM.

### `GET /api/services`

```js
[{ id, name, description, icon, url, status, statusLabel, statusDetails }]
```

Supported frontend states are `running`, `stopped`, `warning`, and `unknown`.

### `GET /api/events`

```js
[{ id, timestamp, message, type, serviceId }]
```

Supported event types are `info`, `success`, `warning`, and `error`.

### `GET /api/quick-actions`

```js
[{ id, label, icon, url }]
```

An empty URL keeps the action disabled. This endpoint does not execute system
operations.

## Replacing mock data with Proxmox

The route layer in `backend/routes/apiRoutes.js` only calls the provider
methods defined by `backend/services/dashboardService.js`. Later, add
`backend/services/proxmoxDashboardService.js` with the same methods and select
that provider in `backend/server.js`. Routes and frontend components can remain
unchanged.

Current environment variables:

- `HOST`: API bind address, default `0.0.0.0`
- `PORT`: API port, default `3001`
- `CORS_ORIGIN`: comma-separated allowed frontend origins
- `VITE_API_BASE_URL`: frontend build-time API base URL

Expected future Proxmox variables:

- `PROXMOX_BASE_URL`
- `PROXMOX_TOKEN_ID`
- `PROXMOX_TOKEN_SECRET`
- `PROXMOX_NODE`

Keep secrets only in the backend environment. Never expose them through a
`VITE_` variable because Vite embeds those values in the browser bundle.
