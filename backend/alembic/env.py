import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# ---------------------------------------------------------------------------
# Make sure the 'app' package is importable.
#
# Docker runtime  : CWD = /home/app/web/, code at /home/app/web/app/
# Local dev mount : same – docker-compose.local.yml mounts ./backend/src
#                   to /home/app/web/app inside the container.
#
# Run alembic commands from INSIDE the container:
#   docker compose exec homepagebackend alembic upgrade head
#   docker compose exec homepagebackend alembic revision --autogenerate -m "msg"
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# ---------------------------------------------------------------------------
# Import Base + all models so that autogenerate detects every table.
# ---------------------------------------------------------------------------
from app.db.database import Base  # noqa: E402
import app.models.db_user         # noqa: F401
import app.models.db_project      # noqa: F401
import app.models.db_message      # noqa: F401
import app.models.db_cv           # noqa: F401

# ---------------------------------------------------------------------------
# Import settings to get the live database URL
# ---------------------------------------------------------------------------
from app.config import settings  # noqa: E402

# Alembic Config object (gives access to .ini file values)
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Override the sqlalchemy.url from settings so we never need to put credentials
# in alembic.ini
config.set_main_option("sqlalchemy.url", settings.SQLALCHEMY_DATABASE_URL)

target_metadata = Base.metadata


# ---------------------------------------------------------------------------
# Run migrations offline (no live DB connection – generates SQL script only)
# ---------------------------------------------------------------------------
def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


# ---------------------------------------------------------------------------
# Run migrations online (connects to the DB and applies changes)
# ---------------------------------------------------------------------------
def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # Compare server defaults so autogenerate catches DEFAULT changes:
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
