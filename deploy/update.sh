#!/usr/bin/env bash
# =============================================================================
# deploy/update.sh — pull latest images and recreate changed containers.
# Runs hourly via cron (installed by start.sh); safe to run manually.
# `up -d` only recreates containers whose image actually changed.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"
COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$SCRIPT_DIR/docker-compose.prod.yml")

LOCK_FILE="$SCRIPT_DIR/.update.lock"
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "[update] $(date -Is) another update is still running — skipping."
  exit 0
fi

echo "[update] $(date -Is) pulling images…"
"${COMPOSE[@]}" pull --quiet

echo "[update] $(date -Is) applying (recreates only changed containers)…"
"${COMPOSE[@]}" up -d --remove-orphans

# Keep the disk clean: drop dangling images from previous pulls
docker image prune -f >/dev/null

echo "[update] $(date -Is) done."
