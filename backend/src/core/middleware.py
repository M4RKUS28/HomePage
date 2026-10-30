import ipaddress
import logging
from typing import Optional, Union

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from ..services.access_log import track_ip

logger = logging.getLogger(__name__)

IPAddress = Union[ipaddress.IPv4Address, ipaddress.IPv6Address]


def _parse_ip(value: str) -> Optional[IPAddress]:
    try:
        return ipaddress.ip_address(value.strip())
    except ValueError:
        return None


def _is_trusted_proxy(addr: IPAddress) -> bool:
    # All proxies in front of the backend (CloudPanel nginx, Docker nginx,
    # Next.js BFF) reach it over loopback or the private Docker network.
    return addr.is_private or addr.is_loopback or addr.is_link_local


def get_client_ip(request: Request) -> Optional[str]:
    """
    Resolve the visitor IP from the proxy chain.

    Each nginx hop appends the address of its TCP peer to X-Forwarded-For, so
    only the right-most entries are trustworthy; anything to the left may be
    supplied by the client. Walk the chain from the direct peer leftwards,
    skipping trusted (internal) proxies, and return the first external address.
    Returns None if the chain contains an unparsable entry before that point.
    """
    peer = request.client.host if request.client else None
    chain = [h for h in request.headers.get("x-forwarded-for", "").split(",") if h.strip()]
    if peer:
        chain.append(peer)

    for hop in reversed(chain):
        addr = _parse_ip(hop)
        if addr is None:
            return None
        if not _is_trusted_proxy(addr):
            return str(addr)
    return None


class IPTrackingMiddleware(BaseHTTPMiddleware):
    """
    IP-tracking middleware – record visitor IPs (deduped via Redis)
    """

    async def dispatch(self, request: Request, call_next):
        ip = get_client_ip(request)
        logger.debug("[middleware] resolved client IP: %s", ip)

        if ip:
            try:
                await track_ip(ip)
            except Exception as e:
                logger.error("[middleware] failed to track IP %s: %s", ip, e)
                pass  # never block a request because of tracking

        return await call_next(request)
