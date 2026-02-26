"""
Redis connection pool (via ``redis.asyncio``).

Provides:
* ``get_redis()``  – FastAPI dependency
* ``redis_pool``   – raw pool for direct access in services
"""

from collections.abc import AsyncGenerator
from typing import Optional

import redis.asyncio as aioredis

from ..core.config import get_settings

settings = get_settings()

redis_pool: Optional[aioredis.ConnectionPool] = None


async def init_redis_pool() -> None:
    """Create the connection pool. Call once during app startup."""
    global redis_pool
    redis_pool = aioredis.ConnectionPool.from_url(
        settings.redis.url,
        decode_responses=True,
        max_connections=20,
    )


async def close_redis_pool() -> None:
    """Gracefully close the pool. Call during app shutdown."""
    global redis_pool
    if redis_pool is not None:
        await redis_pool.disconnect()
        redis_pool = None


async def get_redis() -> AsyncGenerator[aioredis.Redis, None]:
    """
    FastAPI dependency that yields a Redis client bound to the shared pool.

    Usage::

        @router.get("/cached")
        async def cached(r: aioredis.Redis = Depends(get_redis)):
            await r.get("key")
    """
    assert redis_pool is not None, "Redis pool not initialised – call init_redis_pool() first"
    client = aioredis.Redis(connection_pool=redis_pool)
    try:
        yield client
    finally:
        await client.aclose()
