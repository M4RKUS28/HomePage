"""
Central API router - includes all sub-routers.

Imported by ``main.py`` and mounted on the FastAPI app.
"""

from fastapi import APIRouter

from .routers import cv, internal, messages, projects, storage, users

api_router = APIRouter()

api_router.include_router(users.router)
api_router.include_router(projects.router)
api_router.include_router(messages.router)
api_router.include_router(cv.router)
api_router.include_router(storage.router)
api_router.include_router(internal.router)
