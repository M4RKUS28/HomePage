#!/usr/bin/env bash
# =============================================================================
# run-prod.sh — start / manage the PRODUCTION stack (docker-compose.prod.yml)
#
# Images are pulled from DockerHub (built & pushed by CI), not built locally.
# DB migrations run automatically via the backend entrypoint (alembic upgrade
# head) when the container starts.
#
# Config:
#   - Root ./.env          → Compose variable substitution
#                            (DOCKERHUB_USERNAME, DB_PASSWORD, MINIO_*,
#                             AUTH_INTERNAL_SHARED_SECRET, SESSION_SECRET, …)
#   - ./backend/.env       → injected into the backend container (env_file)
#
# Usage:
#   ./run-prod.sh [up|down|restart|pull|logs|ps]   (default: up)
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")"

COMPOSE="docker compose -f docker-compose.prod.yml"
CMD="${1:-up}"

# --- Pre-flight checks ------------------------------------------------------
if [ ! -f .env ]; then
  echo "ERROR: root .env is missing. Copy .env.example → .env and fill it in." >&2
  exit 1
fi
if [ ! -f backend/.env ]; then
  echo "ERROR: backend/.env is missing. Copy backend/.env.example → backend/.env and fill it in." >&2
  exit 1
fi

case "$CMD" in
  up)
    echo "[run-prod] Pulling latest images…"
    $COMPOSE pull
    echo "[run-prod] Starting stack (detached)…"
    $COMPOSE up -d
    $COMPOSE ps
    echo "[run-prod] Done. Logs: ./run-prod.sh logs"
    ;;
  down)    $COMPOSE down ;;
  restart) $COMPOSE restart ;;
  pull)    $COMPOSE pull ;;
  logs)    $COMPOSE logs -f --tail=100 ;;
  ps)      $COMPOSE ps ;;
  *)       shift; $COMPOSE "$CMD" "$@" ;;
esac
