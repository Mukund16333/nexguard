"""Validation engine runner orchestrating all security and reliability checks."""

from __future__ import annotations

import asyncio
import logging
import time
from datetime import datetime, timezone
from uuid import UUID

from app.core.config import get_settings
from app.core.scoring import calculate_score
from app.engine.cdn_check import run_cdn_check
from app.engine.dns_check import run_dns_check
from app.engine.freshness_check import run_freshness_check
from app.engine.headers_check import run_headers_check
from app.engine.http_check import run_http_check
from app.engine.tls_check import run_tls_check
from app.models.domain import CheckResult, CheckStatus, Run, RunStatus, TargetConfig

logger = logging.getLogger(__name__)


async def _safe_run(coro, check_id: str, category: str, weight: float) -> CheckResult:
    """Wrapper ensuring unhandled exceptions are converted to typed ERROR CheckResult."""
    started_at = datetime.now(timezone.utc)
    t0 = time.perf_counter()
    try:
        return await coro
    except Exception as exc:
        duration_ms = round((time.perf_counter() - t0) * 1000, 2)
        logger.exception("Unexpected error in check %s", check_id)
        return CheckResult(
            check_id=check_id,
            category=category,
            status=CheckStatus.ERROR,
            weight=weight,
            started_at=started_at,
            duration_ms=duration_ms,
            summary=f"Internal check error: {exc}",
            expected="Clean check execution",
            observed=f"Exception raised: {exc}",
            evidence={"error": str(exc), "type": type(exc).__name__},
            remediation="Review check logs or retry the run.",
            rule_version=get_settings().RULESET_VERSION,
        )


async def run_all_checks(target: TargetConfig, run_id: UUID | None = None) -> Run:
    """
    Run all security and reliability checks against the target deployment.

    Ensures that individual check failures or timeouts never stop other checks
    from completing. Produces a completed Run with deterministic score and coverage.
    """
    settings = get_settings()
    started_at = datetime.now(timezone.utc)
    t0 = time.perf_counter()

    # Schedule all checks concurrently
    tasks = [
        _safe_run(run_dns_check(target), "dns_resolution", "dns", 0.10),
        _safe_run(run_http_check(target), "http_availability", "http", 0.15),
        _safe_run(run_tls_check(target), "tls_certificate", "tls", 0.25),
        _safe_run(run_headers_check(target), "security_headers", "headers", 0.20),
        _safe_run(run_freshness_check(target), "content_freshness", "freshness", 0.15),
        _safe_run(run_cdn_check(target), "cdn_behavior", "cdn", 0.10),
    ]

    results: list[CheckResult] = await asyncio.gather(*tasks)

    duration_ms = round((time.perf_counter() - t0) * 1000, 2)
    completed_at = datetime.now(timezone.utc)

    # Compute deterministic score & coverage
    score, coverage = calculate_score(results)

    run_obj = Run(
        run_id=run_id or target.target_id,  # Will use provided run_id or auto-generate
        target_id=target.target_id,
        owner_id=target.owner_id,
        status=RunStatus.COMPLETED,
        started_at=started_at,
        completed_at=completed_at,
        score=score,
        coverage=coverage,
        ruleset_version=settings.RULESET_VERSION,
        app_version=settings.APP_VERSION,
        check_results=results,
        duration_ms=duration_ms,
    )

    return run_obj
