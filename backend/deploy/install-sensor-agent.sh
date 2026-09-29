#!/bin/sh
set -eu

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this installer with sudo or as root." >&2
  exit 1
fi

source_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
agent_dir=/opt/jarvis-sensor-agent
environment_file=/etc/jarvis-sensor-agent.env
dashboard_ip=${1:-192.168.0.30}
node_name=${2:-jarvis}

install -d -m 755 "$agent_dir"
install -m 755 "$source_dir/sensor_agent.py" "$agent_dir/sensor_agent.py"
install -m 644 "$source_dir/deploy/jarvis-sensor-agent.service" /etc/systemd/system/jarvis-sensor-agent.service

if [ ! -f "$environment_file" ]; then
  token=$(od -An -N32 -tx1 /dev/urandom | tr -d ' \n')
  umask 077
  {
    printf '%s\n' 'SENSOR_AGENT_HOST=0.0.0.0'
    printf '%s\n' 'SENSOR_AGENT_PORT=3100'
    printf '%s\n' "SENSOR_AGENT_NODE_NAME=$node_name"
    printf '%s\n' "SENSOR_AGENT_ALLOWED_IPS=$dashboard_ip"
    printf '%s\n' "SENSOR_AGENT_TOKEN=$token"
  } > "$environment_file"
fi

systemctl daemon-reload
systemctl enable --now jarvis-sensor-agent
systemctl restart jarvis-sensor-agent
systemctl --no-pager --full status jarvis-sensor-agent

echo "Sensor agent is installed. Its token is stored in $environment_file."
