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

echo "[update] $(date -Is) pulling app images…"
# Only the application images — infra (garage/postgres/redis) is managed
# deliberately and never pulled by the hourly job. APP_IMAGE_TAG pins the
# exact commit tag, so this cannot roll back to an older "latest".
"${COMPOSE[@]}" pull --quiet homepagebackend nextfrontend nginx

echo "[update] $(date -Is) applying (recreates only changed containers)…"
"${COMPOSE[@]}" up -d --no-deps --pull never homepagebackend nextfrontend nginx

# No --remove-orphans and no image prune: old images stay available for
# manual rollback; cleanup is a separate, explicitly approved step.

echo "[update] $(date -Is) done."
