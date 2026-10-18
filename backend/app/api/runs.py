"""Run lifecycle and report generation endpoints."""

from __future__ import annotations

from typing import Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import HTMLResponse, JSONResponse

from app.api.deps import get_current_owner, get_repo
from app.engine.runner import run_all_checks
from app.models.domain import Run, RunStatus
from app.models.schemas import RunCreateResponse, RunListResponse, RunResponse
from app.reports.serializer import generate_html_report, generate_json_report
from app.repositories.base import BaseRepository

router = APIRouter(tags=["Runs"])


@router.post(
    "/targets/{target_id}/runs",
    response_model=RunCreateResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger a validation run against a target",
)
async def trigger_run(
    target_id: UUID,
    owner_id: str = Depends(get_current_owner),
    repo: BaseRepository = Depends(get_repo),
) -> RunCreateResponse:
    """
    Trigger a security and reliability validation run.
    
    Verifies that the target exists and runs all checks.
    """
    target = await repo.get_target(target_id)
    if not target or target.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target with ID '{target_id}' not found.",
        )

    run_id = uuid4()

    # Create initial queued record
    initial_run = Run(
        run_id=run_id,
        target_id=target_id,
        owner_id=owner_id,
        status=RunStatus.RUNNING,
    )
    await repo.create_run(initial_run)

    # Execute all checks synchronously for MVP
    completed_run = await run_all_checks(target=target, run_id=run_id)

    # Persist completed run with checks, score, coverage
    await repo.update_run(completed_run)

    return RunCreateResponse(
        run_id=run_id,
        target_id=target_id,
        status=completed_run.status,
        message="Validation run completed successfully.",
    )


@router.get(
    "/targets/{target_id}/runs",
    response_model=RunListResponse,
    summary="List runs for a specific target",
)
async def list_runs_for_target(
    target_id: UUID,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    repo: BaseRepository = Depends(get_repo),
) -> RunListResponse:
    """Retrieve history of runs performed on a target."""
    target = await repo.get_target(target_id)
    if not target or target.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target with ID '{target_id}' not found.",
        )

    runs, total = await repo.list_runs_for_target(target_id=target_id, limit=limit, offset=offset)
    return RunListResponse(
        items=[RunResponse.model_validate(r) for r in runs],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/runs/{run_id}",
    response_model=RunResponse,
    summary="Get full details of a validation run",
)
async def get_run(
    run_id: UUID,
    repo: BaseRepository = Depends(get_repo),
) -> RunResponse:
    """Retrieve run record including all check results and score."""
    run = await repo.get_run(run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run with ID '{run_id}' not found.",
        )
    return RunResponse.model_validate(run)


@router.get(
    "/runs/{run_id}/report",
    summary="Generate downloadable JSON or HTML validation report",
)
async def get_run_report(
    run_id: UUID,
    format: Literal["json", "html"] = Query(default="json"),
    repo: BaseRepository = Depends(get_repo),
) -> Response:
    """Generate and return a serialized report for the specified run."""
    run = await repo.get_run(run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run with ID '{run_id}' not found.",
        )

    target = await repo.get_target(run.target_id)

    if format == "html":
        html_content = generate_html_report(run=run, target=target)
        return HTMLResponse(content=html_content)

    json_content = generate_json_report(run=run, target=target)
    return JSONResponse(content=json_content)
