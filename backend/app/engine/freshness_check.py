"""Content freshness and deployment version marker verification check."""

from __future__ import annotations

from datetime import datetime, timezone
import time
from typing import Any, Dict
import httpx

from app.core.config import get_settings
from app.models.domain import CheckResult, CheckStatus, TargetConfig

CHECK_ID = "content_freshness"
CATEGORY = "freshness"
WEIGHT = 0.15


async def run_freshness_check(target: TargetConfig) -> CheckResult:
    """
    Verify deployment freshness by searching for an expected release/version marker.
    
    If no marker is configured, returns SKIPPED (excluded from scoring denominator).
    If marker is configured, searches within bounded 10KB window of the response body.
    """
    settings = get_settings()
    started_at = datetime.now(timezone.utc)
    t0 = time.perf_counter()

    expected_marker = target.expected_version_marker
    if not expected_marker or not expected_marker.strip():
        duration_ms = round((time.perf_counter() - t0) * 1000, 2)
        return CheckResult(
            check_id=CHECK_ID,
            category=CATEGORY,
            status=CheckStatus.SKIPPED,
            weight=WEIGHT,
            started_at=started_at,
            duration_ms=duration_ms,
            summary="No expected_version_marker configured for target; freshness check skipped",
            expected=None,
            observed="Check skipped (no version marker defined)",
            evidence={"marker_configured": False},
            remediation=None,
            rule_version=settings.RULESET_VERSION,
        )

    expected_marker = expected_marker.strip()
    evidence: Dict[str, Any] = {
        "expected_marker": expected_marker,
        "max_bytes_searched": settings.MAX_FRESHNESS_BYTES,
        "marker_found": False,
    }

    try:
        async with httpx.AsyncClient(
            verify=True,
            timeout=httpx.Timeout(settings.CONNECTION_TIMEOUT),
            follow_redirects=True,
        ) as client:
            # Stream up to MAX_FRESHNESS_BYTES to prevent unbounded memory consumption
            async with client.stream(
                "GET",
                str(target.base_url),
                headers={"User-Agent": f"NexGuard-Validator/{settings.APP_VERSION}"},
            ) as response:
                chunks: list[bytes] = []
                total_bytes = 0
                async for chunk in response.aiter_bytes():
                    needed = settings.MAX_FRESHNESS_BYTES - total_bytes
                    if needed <= 0:
                        break
                    chunks.append(chunk[:needed])
                    total_bytes += len(chunks[-1])

                content = b"".join(chunks).decode("utf-8", errors="replace")

        duration_ms = round((time.perf_counter() - t0) * 1000, 2)
        evidence["bytes_searched"] = len(content.encode("utf-8"))
        evidence["body_snippet"] = content[:300].strip()

        if expected_marker in content:
            evidence["marker_found"] = True
            pos = content.find(expected_marker)
            evidence["marker_index"] = pos
            return CheckResult(
                check_id=CHECK_ID,
                category=CATEGORY,
                status=CheckStatus.PASS,
                weight=WEIGHT,
                started_at=started_at,
                duration_ms=duration_ms,
                summary=f"Found expected version marker '{expected_marker}' in response body",
                expected=f"Marker '{expected_marker}' present in payload",
                observed=f"Marker found at character index {pos}",
                evidence=evidence,
                remediation=None,
                rule_version=settings.RULESET_VERSION,
            )

        return CheckResult(
            check_id=CHECK_ID,
            category=CATEGORY,
            status=CheckStatus.FAIL,
            weight=WEIGHT,
            started_at=started_at,
            duration_ms=duration_ms,
            summary=f"Expected version marker '{expected_marker}' not found in first {settings.MAX_FRESHNESS_BYTES} bytes of response",
            expected=f"Marker '{expected_marker}' present",
            observed=f"Marker missing in first {len(content)} bytes",
            evidence=evidence,
            remediation="Verify that the correct release artifact has been deployed and edge caches are invalidated.",
            rule_version=settings.RULESET_VERSION,
        )

    except Exception as exc:
        duration_ms = round((time.perf_counter() - t0) * 1000, 2)
        evidence["error"] = str(exc)
        return CheckResult(
            check_id=CHECK_ID,
            category=CATEGORY,
            status=CheckStatus.FAIL,
            weight=WEIGHT,
            started_at=started_at,
            duration_ms=duration_ms,
            summary=f"Failed to fetch content for freshness check: {exc}",
            expected=f"Response containing '{expected_marker}'",
            observed=f"Error: {exc}",
            evidence=evidence,
            remediation="Ensure target endpoint is responsive.",
            rule_version=settings.RULESET_VERSION,
        )
