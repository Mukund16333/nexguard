"""HTTP availability and redirect verification check."""

from __future__ import annotations

from datetime import datetime, timezone
import time
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import httpx

from app.core.config import get_settings
from app.core.safety import SSRFProtectionError, SafetyValidationError, validate_redirect
from app.models.domain import CheckResult, CheckStatus, TargetConfig

CHECK_ID = "http_availability"
CATEGORY = "http"
WEIGHT = 0.15


async def run_http_check(target: TargetConfig) -> CheckResult:
    """
    Execute HTTP availability test with safe redirect tracking and timing.
    
    Validates:
    - HTTP 200 status code
    - Safe redirect chain (no loops, no SSRF jumps, max 5 hops)
    - Response latency
    - Expected host match
    """
    settings = get_settings()
    started_at = datetime.now(timezone.utc)
    t0 = time.perf_counter()

    expected_host = target.expected_host.strip().lower() if target.expected_host else ""
    current_url = str(target.base_url)
    redirect_chain: List[Dict[str, Any]] = []
    headers = {
        "User-Agent": f"NexGuard-Validator/{settings.APP_VERSION} (Security & Reliability Check)",
        "Accept": "*/*",
    }

    evidence: Dict[str, Any] = {
        "initial_url": current_url,
        "redirect_chain": redirect_chain,
        "final_url": None,
        "status_code": None,
        "server_header": None,
        "response_time_ms": None,
    }

    try:
        async with httpx.AsyncClient(
            verify=True,
            timeout=httpx.Timeout(
                connect=settings.CONNECTION_TIMEOUT,
                read=settings.READ_TIMEOUT,
                write=10.0,
                pool=5.0,
            ),
            follow_redirects=False,
            headers=headers,
        ) as client:
            hops = 0
            response: Optional[httpx.Response] = None

            while hops <= settings.MAX_REDIRECTS:
                req_start = time.perf_counter()
                response = await client.get(current_url)
                hop_duration = round((time.perf_counter() - req_start) * 1000, 2)

                redirect_chain.append({
                    "hop": hops,
                    "url": current_url,
                    "status_code": response.status_code,
                    "duration_ms": hop_duration,
                })

                if response.is_redirect:
                    location = response.headers.get("location")
                    if not location:
                        break
                    # Validate next URL with SSRF checks
                    try:
                        current_url = validate_redirect(current_url, location)
                    except (SSRFProtectionError, SafetyValidationError) as e:
                        duration_ms = round((time.perf_counter() - t0) * 1000, 2)
                        evidence["redirect_chain"] = redirect_chain
                        return CheckResult(
                            check_id=CHECK_ID,
                            category=CATEGORY,
                            status=CheckStatus.FAIL,
                            weight=WEIGHT,
                            started_at=started_at,
                            duration_ms=duration_ms,
                            summary=f"Redirect chain violated safety policy: {e}",
                            expected="Safe redirect destination adhering to SSRF policies",
                            observed=f"Redirect target: {location}",
                            evidence=evidence,
                            remediation="Ensure redirection endpoints do not redirect to unsafe, internal, or non-HTTPS locations.",
                            rule_version=settings.RULESET_VERSION,
                        )
                    hops += 1
                else:
                    break

            if response is None:
                raise RuntimeError("No HTTP response obtained")

            total_duration_ms = round((time.perf_counter() - t0) * 1000, 2)
            final_url = current_url
            final_host = urlparse(final_url).hostname or ""
            server_header = response.headers.get("server")

            evidence.update({
                "final_url": final_url,
                "status_code": response.status_code,
                "server_header": server_header,
                "response_time_ms": total_duration_ms,
                "content_length": len(response.content),
            })

            # Check status code
            if response.status_code != 200:
                return CheckResult(
                    check_id=CHECK_ID,
                    category=CATEGORY,
                    status=CheckStatus.FAIL,
                    weight=WEIGHT,
                    started_at=started_at,
                    duration_ms=total_duration_ms,
                    summary=f"HTTP availability check returned non-200 status code: {response.status_code}",
                    expected="HTTP 200 OK",
                    observed=f"HTTP {response.status_code}",
                    evidence=evidence,
                    remediation="Check web server / reverse proxy error logs and upstream service health.",
                    rule_version=settings.RULESET_VERSION,
                )

            # Check host alignment
            if expected_host and final_host.lower() != expected_host.lower():
                return CheckResult(
                    check_id=CHECK_ID,
                    category=CATEGORY,
                    status=CheckStatus.WARNING,
                    weight=WEIGHT,
                    started_at=started_at,
                    duration_ms=total_duration_ms,
                    summary=f"HTTP response 200 OK, but final host '{final_host}' differs from expected '{expected_host}'",
                    expected=f"Final host matching expected host '{expected_host}'",
                    observed=f"Final host is '{final_host}'",
                    evidence=evidence,
                    remediation="Check canonical URL redirects and domain configuration.",
                    rule_version=settings.RULESET_VERSION,
                )

            # Standard pass
            return CheckResult(
                check_id=CHECK_ID,
                category=CATEGORY,
                status=CheckStatus.PASS,
                weight=WEIGHT,
                started_at=started_at,
                duration_ms=total_duration_ms,
                summary=f"HTTP 200 OK received in {total_duration_ms}ms with host '{final_host}'",
                expected="HTTP 200 OK with expected host",
                observed=f"HTTP 200 OK, latency {total_duration_ms}ms",
                evidence=evidence,
                remediation=None,
                rule_version=settings.RULESET_VERSION,
            )

    except httpx.TimeoutException as exc:
        duration_ms = round((time.perf_counter() - t0) * 1000, 2)
        evidence["error"] = f"Request timed out: {exc}"
        return CheckResult(
            check_id=CHECK_ID,
            category=CATEGORY,
            status=CheckStatus.FAIL,
            weight=WEIGHT,
            started_at=started_at,
            duration_ms=duration_ms,
            summary=f"HTTP request timed out after {duration_ms}ms",
            expected="HTTP 200 OK response within timeout bounds",
            observed=f"Timeout: {exc}",
            evidence=evidence,
            remediation="Investigate server load, latency, or firewall rules dropping traffic.",
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
            summary=f"HTTP request failed: {exc}",
            expected="HTTP 200 OK",
            observed=f"Error: {exc}",
            evidence=evidence,
            remediation="Verify target availability, routing, and network connectivity.",
            rule_version=settings.RULESET_VERSION,
        )
