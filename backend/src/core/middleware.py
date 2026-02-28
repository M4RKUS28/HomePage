import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from ..services.access_log import track_ip

logger = logging.getLogger(__name__)


class IPTrackingMiddleware(BaseHTTPMiddleware):
    """
    IP-tracking middleware – record visitor IPs (deduped via Redis)
    """

    async def dispatch(self, request: Request, call_next):
        # Extract real client IP (X-Forwarded-For from nginx/proxy, fallback to direct)
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
            logger.debug("[middleware] extracted IP %s from x-forwarded-for", ip)
        else:
            ip = request.client.host if request.client else "unknown"
            logger.debug("[middleware] extracted IP %s from direct client host", ip)

        if ip and ip != "unknown":
            try:
                logger.debug("[middleware] tracking IP: %s", ip)
                await track_ip(ip)
            except Exception as e:
                logger.error("[middleware] failed to track IP %s: %s", ip, e)
                pass  # never block a request because of tracking

        return await call_next(request)
