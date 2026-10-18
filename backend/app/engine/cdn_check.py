"""CDN and edge caching behavior observation check."""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any

import httpx

from app.core.config import get_settings
from app.models.domain import CheckResult, CheckStatus, TargetConfig

CHECK_ID = "cdn_behavior"
CATEGORY = "cdn"
WEIGHT = 0.10

CDN_HEADER_SIGNATURES = {
    "cf-ray": "Cloudflare",
    "cf-cache-status": "Cloudflare",
    "x-amz-cf-id": "Amazon CloudFront",
    "x-amz-cf-pop": "Amazon CloudFront",
    "x-fastly-request-id": "Fastly",
    "fastly-debug-digest": "Fastly",
    "x-akamai-transformed": "Akamai",
    "x-azure-ref": "Azure Front Door",
    "x-cache": "Generic Caching Proxy",
    "via": "Generic HTTP Proxy/CDN",
    "age": "HTTP Cache Standard",
}


async def run_cdn_check(
    target: TargetConfig, response_headers: dict[str, str] | None = None
) -> CheckResult:
    """
    Observe CDN headers and edge cache behavior.

    Checks for presence of edge CDN indicators. Note: Per architectural requirements,
    this check observes and reports, returning PASS when CDN headers are present,
    and WARNING if no CDN indicators are found (it never issues a FAIL on missing CDN).
    """
    settings = get_settings()
    started_at = datetime.now(timezone.utc)
    t0 = time.perf_counter()

    headers_lower: dict[str, str] = {}

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
                status=CheckStatus.WARNING,
                weight=WEIGHT,
                started_at=started_at,
                duration_ms=duration_ms,
                summary=f"Unable to observe CDN headers due to connection failure: {exc}",
                expected="Observable CDN edge response",
                observed=f"Error: {exc}",
                evidence={"error": str(exc)},
                remediation="Ensure target is reachable to inspect CDN edge headers.",
                rule_version=settings.RULESET_VERSION,
            )

    duration_ms = round((time.perf_counter() - t0) * 1000, 2)

    found_cdn_headers: dict[str, str] = {}
    detected_providers: list[str] = []

    for header_key, provider in CDN_HEADER_SIGNATURES.items():
        if header_key in headers_lower:
            val = headers_lower[header_key]
            found_cdn_headers[header_key] = val
            if provider not in detected_providers:
                detected_providers.append(provider)

    # Server header inspection
    server_val = headers_lower.get("server", "").lower()
    if "cloudflare" in server_val and "Cloudflare" not in detected_providers:
        detected_providers.append("Cloudflare")
    elif "cloudfront" in server_val and "Amazon CloudFront" not in detected_providers:
        detected_providers.append("Amazon CloudFront")

    cache_control = headers_lower.get("cache-control")

    evidence: dict[str, Any] = {
        "detected_providers": detected_providers,
        "found_cdn_headers": found_cdn_headers,
        "cache_control": cache_control,
        "raw_via": headers_lower.get("via"),
        "raw_age": headers_lower.get("age"),
    }

    if detected_providers or found_cdn_headers:
        provider_desc = (
            ", ".join(detected_providers) if detected_providers else "Active CDN/Edge Cache"
        )
        return CheckResult(
            check_id=CHECK_ID,
            category=CATEGORY,
            status=CheckStatus.PASS,
            weight=WEIGHT,
            started_at=started_at,
            duration_ms=duration_ms,
            summary=f"CDN / edge caching indicators detected: {provider_desc}",
            expected="Edge CDN or caching reverse proxy fronting deployment",
            observed=f"Providers: {provider_desc}; Headers: {list(found_cdn_headers.keys())}",
            evidence=evidence,
            remediation=None,
            rule_version=settings.RULESET_VERSION,
        )

    return CheckResult(
        check_id=CHECK_ID,
        category=CATEGORY,
        status=CheckStatus.WARNING,
        weight=WEIGHT,
        started_at=started_at,
        duration_ms=duration_ms,
        summary="No CDN or edge caching proxy indicators detected in HTTP response",
        expected="Edge CDN indicators (e.g. Cloudflare, CloudFront, Fastly, or Via/Age headers)",
        observed="No recognized CDN headers found",
        evidence=evidence,
        remediation="Deploy an Edge CDN (e.g. Cloudflare, CloudFront) to protect origin servers and accelerate static assets.",
        rule_version=settings.RULESET_VERSION,
    )
