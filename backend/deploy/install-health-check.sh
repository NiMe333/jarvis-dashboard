#!/bin/sh
set -eu

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this installer as root." >&2
  exit 1
fi

source_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

install -m 644 "$source_dir/jarvis-health-check.service" /etc/systemd/system/jarvis-health-check.service
install -m 644 "$source_dir/jarvis-health-check.timer" /etc/systemd/system/jarvis-health-check.timer
install -m 644 "$source_dir/jarvis-health-alert@.service" /etc/systemd/system/jarvis-health-alert@.service

systemctl daemon-reload
systemctl enable --now jarvis-health-check.timer
systemctl start jarvis-health-check.service
systemctl --no-pager --full status jarvis-health-check.timer
