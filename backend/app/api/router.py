"""Main API router combining v1 endpoint collections."""

from fastapi import APIRouter

from app.api.runs import router as runs_router
from app.api.targets import router as targets_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(targets_router)
api_v1_router.include_router(runs_router)
