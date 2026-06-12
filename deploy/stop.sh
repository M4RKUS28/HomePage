#!/usr/bin/env bash
# =============================================================================
# deploy/stop.sh — stop the production stack and remove the auto-update cron.
# Data volumes (postgres, minio, redis) are NOT removed.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"
COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$SCRIPT_DIR/docker-compose.prod.yml")

# Remove the hourly auto-update cron job
CRON_MARK="# m4rkus-hp-auto-update"
( crontab -l 2>/dev/null | grep -vF "$CRON_MARK" ) | crontab - || true
echo "[stop] Auto-update cron removed."

echo "[stop] Stopping stack…"
"${COMPOSE[@]}" down

echo "[stop] Done. (Volumes kept — data is safe.)"
