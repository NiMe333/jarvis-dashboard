#!/bin/sh
# Read-only health check for the dashboard LXC. Intended for systemd timer use.
set -eu

log() {
  /usr/bin/logger -t jarvis-health-check "$1"
}

fail() {
  /usr/bin/logger -p daemon.err -t jarvis-health-check "ALERT: $1"
  exit 1
}

systemctl is-active --quiet jarvis-backend || fail "jarvis-backend is not active"

health=$(/usr/bin/curl --fail --silent --show-error --max-time 12 http://127.0.0.1:3001/api/health) \
  || fail "dashboard health endpoint did not respond"

printf '%s' "$health" | /bin/grep -q '"status":"ok"' \
  || fail "dashboard health response is not ok"
printf '%s' "$health" | /bin/grep -q '"source":"proxmox"' \
  || fail "Proxmox source is unavailable"
printf '%s' "$health" | /bin/grep -q '"hostMetricsAvailable":true' \
  || fail "Proxmox sensor agent telemetry is unavailable"

log "OK: backend, Proxmox API, and host telemetry are healthy"
