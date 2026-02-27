"""
Application entry-point.

Responsibilities:
* FastAPI app factory with ``lifespan`` (startup / shutdown)
* CORS configuration
* Mount the central API router
"""

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from .api.router import api_router
from .core.config import get_settings
from .core.lifespan import lifespan
from .services.access_log import track_ip

logging.basicConfig(level=logging.INFO)

settings = get_settings()


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title=settings.app_name,
    root_path=settings.root_path,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    redirect_slashes=False,   # Proxy can't re-send body on 307 redirects
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# IP-tracking middleware – record visitor IPs (deduped via Redis)
# ---------------------------------------------------------------------------

class IPTrackingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Extract real client IP (X-Forwarded-For from nginx/proxy, fallback to direct)
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
        else:
            ip = request.client.host if request.client else "unknown"

        if ip and ip != "unknown":
            try:
                await track_ip(ip)
            except Exception:
                pass  # never block a request because of tracking

        return await call_next(request)


app.add_middleware(IPTrackingMiddleware)

# Mount all API routes
app.include_router(api_router)


@app.get("/", tags=["health"])
async def root():
    """Root endpoint for quick health check."""
    return {"message": f"Welcome to {settings.app_name}. Docs at /docs"}
