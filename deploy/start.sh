#!/usr/bin/env bash
# =============================================================================
# deploy/start.sh — start the production stack
#
#   - pulls the latest images from DockerHub and starts the stack
#   - enables the Docker daemon on boot (containers use restart: always,
#     so the app comes back automatically after a server reboot)
#   - installs an hourly cron job that pulls new images and recreates
#     changed containers (deploy/update.sh)
#
# Config: ONE file — the repo-root .env (copy .env.example → .env).
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"
COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$SCRIPT_DIR/docker-compose.prod.yml")

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE is missing. Copy .env.example → .env and fill it in." >&2
  exit 1
fi

# Make sure Docker itself starts on boot (restart: always handles the rest)
if command -v systemctl >/dev/null 2>&1; then
  systemctl enable docker >/dev/null 2>&1 \
    || sudo systemctl enable docker >/dev/null 2>&1 \
    || echo "[start] WARN: could not 'systemctl enable docker' — make sure Docker starts on boot."
fi

echo "[start] Pulling latest images…"
"${COMPOSE[@]}" pull

echo "[start] Starting stack (detached)…"
"${COMPOSE[@]}" up -d --remove-orphans

# Install / refresh the hourly auto-update cron job (idempotent via marker)
CRON_MARK="# m4rkus-hp-auto-update"
CRON_LINE="0 * * * * $SCRIPT_DIR/update.sh >> $SCRIPT_DIR/update.log 2>&1 $CRON_MARK"
( crontab -l 2>/dev/null | grep -vF "$CRON_MARK" ; echo "$CRON_LINE" ) | crontab -
echo "[start] Hourly auto-update installed (crontab). Log: $SCRIPT_DIR/update.log"

"${COMPOSE[@]}" ps
echo "[start] Done. Logs: docker compose --env-file $ENV_FILE -f $SCRIPT_DIR/docker-compose.prod.yml logs -f"
