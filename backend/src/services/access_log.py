"""
Access-log service.

Responsibilities:
* Track IPs in Redis with 10-minute deduplication
* Resolve IPs via IPinfo API to get geolocation
* Scheduled background task to flush pending IPs to PostgreSQL
"""

import logging
from datetime import datetime, timezone
from typing import Optional

import httpx
import redis.asyncio as aioredis

from ..core.config import get_settings
from ..db.crud import access_log as access_crud
from ..db import redis as redis_mod
from ..db.session import AsyncSessionLocal

logger = logging.getLogger(__name__)
settings = get_settings()

# Redis key prefixes
_DEDUP_PREFIX = "access:ip:"
_PENDING_SET = "access:pending"
_DEDUP_TTL = 600  # 10 minutes in seconds


# ---------------------------------------------------------------------------
# Redis dedup helpers
# ---------------------------------------------------------------------------

async def track_ip(ip: str) -> bool:
    """
    Track an IP access in Redis.

    Returns True if this is a **new** access (not seen in the last 10 min).
    Uses SET NX + EX for atomic dedup.
    """
    pool = redis_mod.redis_pool
    if pool is None:
        logger.warning("[access] Redis pool not initialised, skipping IP tracking")
        return False

    client = aioredis.Redis(connection_pool=pool)
    key = f"{_DEDUP_PREFIX}{ip}"
    now_iso = datetime.now(timezone.utc).isoformat()
    logger.debug("[access] Attempting to track IP %s with key %s", ip, key)

    # SET NX: only set if key doesn't exist (= not seen in last 10 min)
    was_set = await client.set(key, now_iso, nx=True, ex=_DEDUP_TTL)
    if was_set:
        # Add to pending set so the background job can pick it up
        await client.sadd(_PENDING_SET, f"{ip}||{now_iso}")
        logger.info("[access] New IP tracked: %s", ip)
        return True
    
    logger.debug("[access] IP %s already tracked recently.", ip)
    return False


# ---------------------------------------------------------------------------
# IPinfo geolocation
# ---------------------------------------------------------------------------

async def _lookup_ip(ip: str) -> dict:
    """Call IPinfo API to resolve an IP to geolocation data."""
    logger.debug("[access] Looking up IP geolocation: %s", ip)
    token = settings.ipinfo_token
    url = f"https://ipinfo.io/{ip}/json"
    params = {}
    if token:
        params["token"] = token

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            logger.debug("[access] Sending request to %s", url)
            resp = await client.get(url, params=params)
            logger.debug("[access] IPinfo response status for %s: %s", ip, resp.status_code)
            if resp.status_code == 200:
                data = resp.json()
                logger.debug("[access] Geodata received for %s: %s", ip, data)
                return data
            logger.warning("[access] IPinfo returned %s for %s", resp.status_code, ip)
    except Exception as exc:
        logger.error("[access] IPinfo lookup failed for %s: %s", ip, exc)

    return {}


def _parse_loc(loc_str: Optional[str]) -> tuple[Optional[float], Optional[float]]:
    """Parse IPinfo 'loc' field like '52.5200,13.4050' → (lat, lng)."""
    if not loc_str:
        return None, None
    try:
        parts = loc_str.split(",")
        return float(parts[0]), float(parts[1])
    except (ValueError, IndexError):
        return None, None


# ---------------------------------------------------------------------------
# Background routine – resolve pending IPs and store in PostgreSQL
# ---------------------------------------------------------------------------

async def resolve_pending_ips() -> None:
    """
    Pop all pending IPs from Redis, geolocate them, and store in PostgreSQL.

    Called periodically by APScheduler.
    """
    pool = redis_mod.redis_pool
    if pool is None:
        return

    client = aioredis.Redis(connection_pool=pool)

    # Atomically pop all members from the pending set
    logger.debug("[access] Fetching pending IPs from Redis set %s", _PENDING_SET)
    members = await client.smembers(_PENDING_SET)
    if not members:
        logger.debug("[access] No pending IPs to resolve.")
        return

    # Remove them from the set immediately to avoid re-processing
    if members:
        await client.srem(_PENDING_SET, *members)

    logger.info("[access] Resolving %d pending IP(s)…", len(members))

    async with AsyncSessionLocal() as db:
        for entry in members:
            try:
                entry_str = entry if isinstance(entry, str) else entry.decode()
                parts = entry_str.split("||", 1)
                ip = parts[0]
                ts_iso = parts[1] if len(parts) > 1 else None
                ts = (
                    datetime.fromisoformat(ts_iso)
                    if ts_iso
                    else datetime.now(timezone.utc)
                )

                logger.debug("[access] Resolving pending IP entry: %s", ip)

                # Skip private/local IPs
                if _is_private_ip(ip):
                    logger.debug("[access] IP %s is private, skipping geolocation.", ip)
                    await access_crud.create_access_log(
                        db,
                        ip_address=ip,
                        city="Local",
                        region="Local",
                        country="--",
                        timestamp=ts,
                    )
                    continue

                logger.debug("[access] Performing geo lookup for %s", ip)
                geo = await _lookup_ip(ip)
                lat, lng = _parse_loc(geo.get("loc"))
                logger.debug("[access] Storing geodata in DB for %s", ip)

                await access_crud.create_access_log(
                    db,
                    ip_address=ip,
                    city=geo.get("city"),
                    region=geo.get("region"),
                    country=geo.get("country"),
                    latitude=lat,
                    longitude=lng,
                    org=geo.get("org"),
                    timezone=geo.get("timezone"),
                    timestamp=ts,
                )
            except Exception as exc:
                logger.error("[access] Failed to resolve IP entry %s: %s", entry, exc)

    logger.info("[access] Finished resolving pending IPs.")


def _is_private_ip(ip: str) -> bool:
    """Check if an IP is a private/local address."""
    import ipaddress
    try:
        addr = ipaddress.ip_address(ip)
        return addr.is_private or addr.is_loopback or addr.is_reserved
    except ValueError:
        return False
