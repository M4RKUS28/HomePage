#!/bin/sh
# entrypoint_neu.sh – Alembic migration handler for the refactored backend
set -e

echo "[entrypoint] Running Alembic migrations..."
alembic upgrade head

echo "[entrypoint] Migrations complete. Starting application..."
exec "$@"
