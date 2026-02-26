#!/bin/sh
# entrypoint.sh – smart Alembic startup handler
#
# Three possible states:
#   1. Fresh DB (no tables)          → run "alembic upgrade head" normally
#   2. Pre-Alembic DB (tables exist, # no alembic_version table)
#                                    → stamp as current head, then upgrade
#   3. Alembic-managed DB            → run "alembic upgrade head" normally
set -e

echo "[entrypoint] Checking database migration state..."

ALEMBIC_TRACKED=$(python3 - <<'PYEOF'
import sys
try:
    from app.db.database import engine
    from sqlalchemy import inspect as sa_inspect, text
    insp = sa_inspect(engine)
    tables = set(insp.get_table_names())
    has_version_table = "alembic_version" in tables
    has_app_tbls = "users" in tables

    if has_version_table:
        # Check whether the table actually contains a revision row
        with engine.connect() as conn:
            row = conn.execute(text("SELECT version_num FROM alembic_version LIMIT 1")).fetchone()
        if row:
            print("tracked")   # Alembic is managing this DB with a known revision
        else:
            # Table exists but is empty – stamp needed
            print("untracked")
    elif has_app_tbls:
        print("untracked")     # Tables exist but Alembic never managed them
    else:
        print("empty")         # Fresh database
except Exception as e:
    print(f"error: {e}", file=sys.stderr)
    sys.exit(1)
PYEOF
)

echo "[entrypoint] DB state: $ALEMBIC_TRACKED"

case "$ALEMBIC_TRACKED" in
  tracked)
    echo "[entrypoint] alembic_version found – running upgrade head..."
    alembic upgrade head
    ;;
  untracked)
    echo "[entrypoint] Existing tables without Alembic tracking detected."
    echo "[entrypoint] Stamping current revision as head (no DDL changes)..."
    alembic stamp head
    echo "[entrypoint] Stamp complete – running upgrade head for any pending migrations..."
    alembic upgrade head
    ;;
  empty)
    echo "[entrypoint] Fresh database – running upgrade head..."
    alembic upgrade head
    ;;
  *)
    echo "[entrypoint] Unexpected state, attempting upgrade head anyway..."
    alembic upgrade head
    ;;
esac

echo "[entrypoint] Migrations complete. Starting application..."
exec "$@"
