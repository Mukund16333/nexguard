"""Security headers inspection check."""

from __future__ import annotations

from datetime import datetime, timezone
import time
from typing import Any, Dict, List
import httpx

from app.core.config import get_settings
from app.models.domain import CheckResult, CheckStatus, TargetConfig

CHECK_ID = "security_headers"
CATEGORY = "headers"
WEIGHT = 0.20

CRITICAL_HEADERS = {
    "strict-transport-security": "Strict-Transport-Security",
    "x-content-type-options": "X-Content-Type-Options",
}

RECOMMENDED_HEADERS = {
    "content-security-policy": "Content-Security-Policy",
    "x-frame-options": "X-Frame-Options",
    "referrer-policy": "Referrer-Policy",
    "permissions-policy": "Permissions-Policy",
}


async def run_headers_check(target: TargetConfig, response_headers: Dict[str, str] | None = None) -> CheckResult:
    """
    Inspect HTTP response headers for essential security protections.
    
    Checks:
    - Strict-Transport-Security (Critical)
    - X-Content-Type-Options (Critical)
    - Content-Security-Policy (Recommended)
    - X-Frame-Options (Recommended)
    - Referrer-Policy (Recommended)
    - Permissions-Policy (Recommended)
    """
    settings = get_settings()
    started_at = datetime.now(timezone.utc)
    t0 = time.perf_counter()

    headers_lower: Dict[str, str] = {}
    
    if response_headers is not None:
        headers_lower = {k.lower(): v for k, v in response_headers.items()}
    else:
        try:
            async with httpx.AsyncClient(
                verify=True,
                timeout=httpx.Timeout(settings.CONNECTION_TIMEOUT),
                follow_redirects=True,
            ) as client:
                resp = await client.get(
                    str(target.base_url),
                    headers={"User-Agent": f"NexGuard-Validator/{settings.APP_VERSION}"},
                )
                headers_lower = {k.lower(): v for k, v in resp.headers.items()}
        except Exception as exc:
            duration_ms = round((time.perf_counter() - t0) * 1000, 2)
            return CheckResult(
                check_id=CHECK_ID,
                category=CATEGORY,
                status=CheckStatus.FAIL,
                weight=WEIGHT,
                started_at=started_at,
                duration_ms=duration_ms,
                summary=f"Failed to retrieve security headers: {exc}",
                expected="HTTP response with standard security headers",
                observed=f"Request error: {exc}",
                evidence={"error": str(exc)},
                remediation="Ensure target server is reachable.",
                rule_version=settings.RULESET_VERSION,
            )

    duration_ms = round((time.perf_counter() - t0) * 1000, 2)

    subchecks: Dict[str, Dict[str, Any]] = {}
    missing_critical: List[str] = []
    missing_recommended: List[str] = []

    # 1. Critical Headers
    for key, display_name in CRITICAL_HEADERS.items():
        val = headers_lower.get(key)
        if not val:
            missing_critical.append(display_name)
            subchecks[display_name] = {
                "present": False,
                "value": None,
                "importance": "critical",
                "status": "FAIL",
                "issue": f"{display_name} header is missing",
            }
        else:
            issue = None
            status = "PASS"
            if key == "strict-transport-security":
                if "max-age" not in val.lower():
                    issue = "HSTS header missing max-age directive"
                    status = "WARNING"
            elif key == "x-content-type-options":
                if val.lower() != "nosniff":
                    issue = f"Expected 'nosniff', found '{val}'"
                    status = "FAIL"
                    missing_critical.append(display_name)
            subchecks[display_name] = {
                "present": True,
                "value": val,
                "importance": "critical",
                "status": status,
                "issue": issue,
            }

    # 2. Recommended Headers
    for key, display_name in RECOMMENDED_HEADERS.items():
        val = headers_lower.get(key)
        if not val:
            # Special case: frame-ancestors in CSP satisfies X-Frame-Options
            csp_val = headers_lower.get("content-security-policy", "")
            if key == "x-frame-options" and "frame-ancestors" in csp_val.lower():
                subchecks[display_name] = {
                    "present": False,
                    "value": None,
                    "importance": "recommended",
                    "status": "PASS",
                    "note": "Satisfied by CSP frame-ancestors directive",
                }
            else:
                missing_recommended.append(display_name)
                subchecks[display_name] = {
                    "present": False,
                    "value": None,
                    "importance": "recommended",
                    "status": "WARNING",
                    "issue": f"{display_name} header is missing",
                }
        else:
            subchecks[display_name] = {
                "present": True,
                "value": val,
                "importance": "recommended",
                "status": "PASS",
                "issue": None,
            }

    evidence: Dict[str, Any] = {
        "subchecks": subchecks,
        "missing_critical": missing_critical,
        "missing_recommended": missing_recommended,
        "observed_security_headers": {k: v for k, v in headers_lower.items() if k in CRITICAL_HEADERS or k in RECOMMENDED_HEADERS},
    }

    if missing_critical:
        return CheckResult(
            check_id=CHECK_ID,
            category=CATEGORY,
            status=CheckStatus.FAIL,
            weight=WEIGHT,
            started_at=started_at,
            duration_ms=duration_ms,
            summary=f"Missing or invalid critical security header(s): {', '.join(missing_critical)}",
            expected="All critical security headers (HSTS, X-Content-Type-Options: nosniff) configured",
            observed=f"Critical deficiencies: {', '.join(missing_critical)}",
            evidence=evidence,
            remediation="Add Strict-Transport-Security with max-age >= 15552000 and X-Content-Type-Options: nosniff.",
            rule_version=settings.RULESET_VERSION,
        )

    if missing_recommended:
        return CheckResult(
            check_id=CHECK_ID,
            category=CATEGORY,
            status=CheckStatus.WARNING,
            weight=WEIGHT,
            started_at=started_at,
            duration_ms=duration_ms,
            summary=f"Critical headers present, but missing recommended header(s): {', '.join(missing_recommended)}",
            expected="Full defense-in-depth header suite",
            observed=f"Missing: {', '.join(missing_recommended)}",
            evidence=evidence,
            remediation=f"Consider enabling: {', '.join(missing_recommended)}.",
            rule_version=settings.RULESET_VERSION,
        )

    return CheckResult(
        check_id=CHECK_ID,
        category=CATEGORY,
        status=CheckStatus.PASS,
        weight=WEIGHT,
        started_at=started_at,
        duration_ms=duration_ms,
        summary="All critical and recommended security headers are properly configured",
        expected="Complete security headers suite",
        observed="All 6 security headers present with valid directives",
        evidence=evidence,
        remediation=None,
        rule_version=settings.RULESET_VERSION,
    )
