"""Health check endpoint."""

from fastapi import APIRouter, Depends

from app.api.deps import get_current_settings
from app.core.config import Settings
from app.models.schemas import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse, summary="Service health check")
async def health_check(settings: Settings = Depends(get_current_settings)) -> HealthResponse:
    """Return health status and current backend version."""
    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION,
    )
