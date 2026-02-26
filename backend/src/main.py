"""
Application entry-point.

Responsibilities:
* FastAPI app factory with ``lifespan`` (startup / shutdown)
* CORS configuration
* Mount the central API router
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.router import api_router
from .core.config import get_settings
from .core.lifespan import lifespan

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

# Mount all API routes
app.include_router(api_router)


@app.get("/", tags=["health"])
async def root():
    """Root endpoint for quick health check."""
    return {"message": f"Welcome to {settings.app_name}. Docs at /docs"}
