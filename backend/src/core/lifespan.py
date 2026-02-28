"""
Lifespan context manager and startup/shutdown helpers for the FastAPI app.
"""

import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI

from .config import get_settings
from .security import get_password_hash
from ..db.minio import get_minio
from ..db.redis import close_redis_pool, init_redis_pool
from ..db.session import AsyncSessionLocal
from ..db.crud import user as user_crud
from ..services.cv import init_default_cv
from ..services.project import check_all_projects_health
from ..services.translation import run_translation_sync
from ..services.access_log import resolve_pending_ips

logger = logging.getLogger(__name__)

settings = get_settings()
scheduler = AsyncIOScheduler()


# ---------------------------------------------------------------------------
# Startup helpers
# ---------------------------------------------------------------------------

async def _ensure_admin_exists() -> None:
    """Create the admin account from env settings if it does not exist."""
    cfg = settings.admin
    if not cfg.username or not cfg.email or not cfg.password:
        logger.info("[startup] ADMIN credentials not set - skipping admin creation.")
        return

    async with AsyncSessionLocal() as db:
        existing = await user_crud.get_user_by_username(db, cfg.username)
        if existing is None:
            existing = await user_crud.get_user_by_email(db, cfg.email)
        if existing:
            logger.info("[startup] Admin account already exists.")
            return

        await user_crud.create_user(
            db,
            username=cfg.username,
            email=cfg.email,
            hashed_password=get_password_hash(cfg.password),
            is_admin=True,
            is_active=True,
        )
        logger.info("[startup] Admin account '%s' created.", cfg.username)


async def _init_cv_data() -> None:
    """Seed default CV data if the database is empty."""
    async with AsyncSessionLocal() as db:
        admin = await user_crud.get_user_by_username(db, settings.admin.username)
        if admin:
            await init_default_cv(db, admin.id)


async def _scheduled_health_check() -> None:
    """Periodic health check triggered by APScheduler."""
    async with AsyncSessionLocal() as db:
        await check_all_projects_health(db)


async def _scheduled_translation_sync() -> None:
    """Periodic translation sync triggered by APScheduler."""
    try:
        await run_translation_sync()
    except Exception as exc:
        logger.error("[translation] Scheduled sync failed: %s", exc)


# ---------------------------------------------------------------------------
# Lifespan (replaces deprecated on_event)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──
    logger.info("[startup] Initialising resources…")
    await init_redis_pool()
    get_minio()  # ensure bucket exists

    await _ensure_admin_exists()
    await _init_cv_data()

    # Start periodic health-check scheduler
    scheduler.add_job(
        _scheduled_health_check,
        "interval",
        minutes=20,
        id="health_check_all_projects",
        replace_existing=True,
        misfire_grace_time=60,
    )

    # Resolve pending IPs every 2 minutes
    scheduler.add_job(
        resolve_pending_ips,
        "interval",
        minutes=2,
        id="resolve_pending_ips",
        replace_existing=True,
        misfire_grace_time=60,
    )

    scheduler.start()
    logger.info("[startup] APScheduler started (health checks every 20 min, IP resolve every 2 min).")

    # Start translation sync scheduler (if enabled)
    if settings.translation.enabled and settings.gemini.api_key:
        scheduler.add_job(
            _scheduled_translation_sync,
            "interval",
            minutes=settings.translation.interval_minutes,
            id="translation_sync",
            replace_existing=True,
            misfire_grace_time=60,
        )
        logger.info(
            "[startup] Translation sync enabled (every %d min).",
            settings.translation.interval_minutes,
        )
    else:
        logger.info("[startup] Translation sync disabled (TRANSLATION_ENABLED=false or no GEMINI_API_KEY).")

    yield  # ── Application runs ──

    # ── Shutdown ──
    if scheduler.running:
        scheduler.shutdown()
        logger.info("[shutdown] APScheduler stopped.")
    await close_redis_pool()
    logger.info("[shutdown] Resources cleaned up.")
