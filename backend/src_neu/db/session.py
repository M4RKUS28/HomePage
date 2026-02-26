"""
Async database engine and session management.

* ``async_engine``      – the SQLAlchemy async engine (asyncpg)
* ``AsyncSessionLocal`` – the session factory
* ``get_db()``          – FastAPI dependency that yields an ``AsyncSession``
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from ..core.config import get_settings

settings = get_settings()

async_engine = create_async_engine(
    settings.db.async_url,
    echo=settings.db.echo,
    pool_size=settings.db.pool_size,
    max_overflow=settings.db.max_overflow,
    pool_recycle=settings.db.pool_recycle,
    pool_pre_ping=settings.db.pool_pre_ping,
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides an ``AsyncSession``.

    Usage::

        @router.get("/items")
        async def list_items(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
