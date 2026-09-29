const EMPTY_HOST_METRICS = Object.freeze({
  available: false,
  cpuTemperature: null,
  ssdTemperature: null,
  ssdSmartHealth: null,
  ssdDevice: null,
  ssdModel: null,
  fanRpm: null,
  powerWatts: null,
  processCount: null,
  network: null,
  cpuUsage: null,
  memory: Object.freeze({ total: null, used: null, available: null }),
  storage: null,
  storageDevices: Object.freeze([]),
  temperatures: Object.freeze([]),
  cpuTemperatures: Object.freeze([]),
  sensorsAvailable: false,
  identity: null,
});

export class RemoteHostMetricsReader {
  constructor({ url, token, timeoutMs = 4_000 }) {
    this.metricsUrl = new URL("metrics", `${url.replace(/\/+$/, "")}/`);
    this.token = token;
    this.timeoutMs = timeoutMs;
  }

  async read() {
    try {
      const response = await fetch(this.metricsUrl, {
        headers: { Authorization: `Bearer ${this.token}`, Accept: "application/json" },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!response.ok) throw new Error(`Sensor agent returned HTTP ${response.status}`);
      const payload = await response.json();
      if (!payload || typeof payload !== "object") throw new Error("Sensor agent returned invalid data");
      return { ...EMPTY_HOST_METRICS, ...payload };
    } catch (error) {
      console.warn(`Remote host metrics unavailable: ${error.message}`);
      return EMPTY_HOST_METRICS;
    }
  }
}
