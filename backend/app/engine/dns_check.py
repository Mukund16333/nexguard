"""DNS resolution check using dnspython with IP safety verification."""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

import dns.asyncresolver
import dns.exception
import dns.resolver

from app.core.config import get_settings
from app.core.safety import is_ip_safe
from app.models.domain import CheckResult, CheckStatus, TargetConfig

CHECK_ID = "dns_resolution"
CATEGORY = "dns"
WEIGHT = 0.10


def _extract_hostname(target: TargetConfig) -> str:
    """Extract host string from expected_host or base_url."""
    if target.expected_host:
        return target.expected_host.strip()
    parsed = urlparse(str(target.base_url))
    return parsed.hostname or str(target.base_url)


async def run_dns_check(target: TargetConfig) -> CheckResult:
    """
    Perform DNS resolution for target host and verify IP safety.

    Checks:
    - Resolution of A, AAAA, and CNAME records
    - Verification that all resolved IPs are safe public routable addresses
    """
    settings = get_settings()
    hostname = _extract_hostname(target)
    started_at = datetime.now(timezone.utc)
    t0 = time.perf_counter()

    records: dict[str, list[str]] = {"A": [], "AAAA": [], "CNAME": []}
    resolved_ips: list[str] = []
    unsafe_ips: list[str] = []
    errors: list[str] = []

    resolver = dns.asyncresolver.Resolver()
    resolver.timeout = settings.DNS_TIMEOUT
    resolver.lifetime = settings.DNS_TIMEOUT

    # 1. Resolve CNAME
    try:
        cname_answers = await resolver.resolve(hostname, "CNAME")
        records["CNAME"] = [str(rdata.target).rstrip(".") for rdata in cname_answers]
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
        pass
    except Exception as exc:
        errors.append(f"CNAME query error: {exc}")

    # 2. Resolve A records
    try:
        a_answers = await resolver.resolve(hostname, "A")
        records["A"] = [str(rdata.address) for rdata in a_answers]
        resolved_ips.extend(records["A"])
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
        pass
    except Exception as exc:
        errors.append(f"A query error: {exc}")

    # 3. Resolve AAAA records
    try:
        aaaa_answers = await resolver.resolve(hostname, "AAAA")
        records["AAAA"] = [str(rdata.address) for rdata in aaaa_answers]
        resolved_ips.extend(records["AAAA"])
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
        pass
    except Exception as exc:
        errors.append(f"AAAA query error: {exc}")

    duration_ms = round((time.perf_counter() - t0) * 1000, 2)

    # 4. Check for safety violations in resolved IPs
    for ip in resolved_ips:
        if not is_ip_safe(ip):
            unsafe_ips.append(ip)

    evidence: dict[str, Any] = {
        "hostname": hostname,
        "records": records,
        "resolved_ips": resolved_ips,
        "unsafe_ips": unsafe_ips,
        "errors": errors,
    }

    if unsafe_ips:
        return CheckResult(
            check_id=CHECK_ID,
            category=CATEGORY,
            status=CheckStatus.FAIL,
            weight=WEIGHT,
            started_at=started_at,
            duration_ms=duration_ms,
            summary=f"DNS resolution returned private or SSRF-prohibited IP(s): {', '.join(unsafe_ips)}",
            expected="All resolved IPs must be safe, routable public addresses",
            observed=f"Unsafe IPs: {', '.join(unsafe_ips)}",
            evidence=evidence,
            remediation="Ensure production DNS records only resolve to public IP addresses.",
            rule_version=settings.RULESET_VERSION,
        )

    if not resolved_ips:
        summary_msg = f"DNS resolution failed for hostname '{hostname}'"
        if errors:
            summary_msg += f": {'; '.join(errors)}"
        return CheckResult(
            check_id=CHECK_ID,
            category=CATEGORY,
            status=CheckStatus.FAIL,
            weight=WEIGHT,
            started_at=started_at,
            duration_ms=duration_ms,
            summary=summary_msg,
            expected="At least one valid public A or AAAA record",
            observed="No A or AAAA records resolved",
            evidence=evidence,
            remediation="Verify domain registration, authoritative nameservers, and DNS propagation.",
            rule_version=settings.RULESET_VERSION,
        )

    # If some queries had errors but others resolved, or IPv6 missing
    if errors and resolved_ips:
        return CheckResult(
            check_id=CHECK_ID,
            category=CATEGORY,
            status=CheckStatus.WARNING,
            weight=WEIGHT,
            started_at=started_at,
            duration_ms=duration_ms,
            summary=f"Resolved {len(resolved_ips)} safe public IP(s), but encountered query warnings",
            expected="All record queries succeed with safe public IPs",
            observed=f"Resolved {resolved_ips}; warnings: {errors}",
            evidence=evidence,
            remediation="Review DNS nameserver health and dual-stack IPv4/IPv6 configuration.",
            rule_version=settings.RULESET_VERSION,
        )

    return CheckResult(
        check_id=CHECK_ID,
        category=CATEGORY,
        status=CheckStatus.PASS,
        weight=WEIGHT,
        started_at=started_at,
        duration_ms=duration_ms,
        summary=f"Successfully resolved hostname '{hostname}' to {len(resolved_ips)} safe public IP(s)",
        expected="Safe public IP resolution",
        observed=f"Resolved IPs: {', '.join(resolved_ips)}",
        evidence=evidence,
        remediation=None,
        rule_version=settings.RULESET_VERSION,
    )
