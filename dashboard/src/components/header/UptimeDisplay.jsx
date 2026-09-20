export default function UptimeDisplay({ uptime, nodeName }) {
  return (
    <div className="uptime-display">
      <span className="uptime-display__value">UP {uptime}</span>
      <span className="uptime-display__node">{nodeName}</span>
    </div>
  );
}
