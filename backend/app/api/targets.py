"""Target configuration CRUD API endpoints."""

from __future__ import annotations

from urllib.parse import urlparse
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_owner, get_repo
from app.core.safety import SafetyValidationError, validate_url
from app.models.domain import TargetConfig
from app.models.schemas import TargetCreate, TargetListResponse, TargetResponse, TargetUpdate
from app.repositories.base import BaseRepository

router = APIRouter(prefix="/targets", tags=["Targets"])


@router.post(
    "",
    response_model=TargetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new target deployment",
)
async def create_target(
    payload: TargetCreate,
    owner_id: str = Depends(get_current_owner),
    repo: BaseRepository = Depends(get_repo),
) -> TargetResponse:
    """Validate target URL safety and persist target configuration."""
    # Extra validation defensive check
    try:
        validated_url = validate_url(payload.base_url)
    except SafetyValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )

    # Infer expected host if not explicitly specified
    parsed = urlparse(validated_url)
    expected_host = payload.expected_host or parsed.hostname or ""
    if not expected_host:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not infer valid expected host from base_url.",
        )

    target = TargetConfig(
        owner_id=owner_id,
        display_name=payload.display_name,
        base_url=validated_url,
        environment=payload.environment,
        expected_host=expected_host,
        expected_version_marker=payload.expected_version_marker,
        origin_url=payload.origin_url,
    )

    created = await repo.create_target(target)
    return TargetResponse.model_validate(created)


@router.get(
    "",
    response_model=TargetListResponse,
    summary="List registered targets",
)
async def list_targets(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    include_deleted: bool = Query(default=False),
    repo: BaseRepository = Depends(get_repo),
) -> TargetListResponse:
    """Retrieve paginated list of non-deleted targets."""
    items, total = await repo.list_targets(
        include_deleted=include_deleted,
        limit=limit,
        offset=offset,
    )
    return TargetListResponse(
        items=[TargetResponse.model_validate(t) for t in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{target_id}",
    response_model=TargetResponse,
    summary="Get target by ID",
)
async def get_target(
    target_id: UUID,
    repo: BaseRepository = Depends(get_repo),
) -> TargetResponse:
    """Retrieve details for a specific target."""
    target = await repo.get_target(target_id)
    if not target or target.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target with ID '{target_id}' not found.",
        )
    return TargetResponse.model_validate(target)


@router.delete(
    "/{target_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete target (soft-delete)",
)
async def delete_target(
    target_id: UUID,
    repo: BaseRepository = Depends(get_repo),
) -> None:
    """Soft delete target by setting deleted_at timestamp."""
    deleted = await repo.delete_target(target_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target with ID '{target_id}' not found or already deleted.",
        )
