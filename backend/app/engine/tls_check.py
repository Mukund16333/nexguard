"""TLS certificate inspection check using cryptography and ssl."""

from __future__ import annotations

import asyncio
import socket
import ssl
import time
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

from cryptography import x509
from cryptography.x509.oid import ExtensionOID, NameOID

from app.core.config import get_settings
from app.models.domain import CheckResult, CheckStatus, TargetConfig

CHECK_ID = "tls_certificate"
CATEGORY = "tls"
WEIGHT = 0.25


def _matches_san(hostname: str, san_pattern: str) -> bool:
    """Check if a hostname matches a SAN DNS pattern (supports standard wildcard)."""
    hostname = hostname.lower()
    pattern = san_pattern.lower()

    if pattern == hostname:
        return True

    if pattern.startswith("*."):
        # Wildcard only matches single leftmost label
        suffix = pattern[1:]  # e.g. .example.com
        if hostname.endswith(suffix):
            sub = hostname[: -len(suffix)]
            if "." not in sub:
                return True
    return False


def _verify_hostname_in_cert(hostname: str, sans: list[str], common_name: str | None) -> bool:
    """Verify that hostname matches at least one SAN DNS entry or common name."""
    if sans:
        return any(_matches_san(hostname, san) for san in sans)
    if common_name:
        return _matches_san(hostname, common_name)
    return False


def _fetch_tls_metadata(hostname: str, port: int, timeout: float) -> dict[str, Any]:
    """Synchronous TLS handshake and certificate extraction."""
    context = ssl.create_default_context()
    # Connect with SNI
    with socket.create_connection((hostname, port), timeout=timeout) as sock:
        with context.wrap_socket(sock, server_hostname=hostname) as ssock:
            protocol_version = ssock.version()
            cipher = ssock.cipher()
            der_cert = ssock.getpeercert(binary_form=True)

    if not der_cert:
        raise ValueError("No binary certificate data returned by peer")

    cert = x509.load_der_x509_certificate(der_cert)

    # Subject and Issuer
    common_names = cert.subject.get_attributes_for_oid(NameOID.COMMON_NAME)
    subject_cn = common_names[0].value if common_names else None

    org_names = cert.issuer.get_attributes_for_oid(NameOID.ORGANIZATION_NAME)
    issuer_org = org_names[0].value if org_names else None
    issuer_cn_attrs = cert.issuer.get_attributes_for_oid(NameOID.COMMON_NAME)
    issuer_cn = issuer_cn_attrs[0].value if issuer_cn_attrs else None
    issuer_display = f"{issuer_org or ''} ({issuer_cn or ''})".strip()

    # Validity
    not_valid_before = cert.not_valid_before_utc
    not_valid_after = cert.not_valid_after_utc

    # SANs
    sans: list[str] = []
    try:
        san_ext = cert.extensions.get_extension_for_oid(ExtensionOID.SUBJECT_ALTERNATIVE_NAME)
        san_value = san_ext.value
        if isinstance(san_value, x509.SubjectAlternativeName):
            sans = [str(name) for name in san_value.get_values_for_type(x509.DNSName)]
    except x509.ExtensionNotFound:
        pass

    return {
        "subject_cn": subject_cn,
        "issuer": issuer_display or "Unknown",
        "not_valid_before": not_valid_before,
        "not_valid_after": not_valid_after,
        "sans": sans,
        "protocol_version": protocol_version,
        "cipher": cipher,
    }


async def run_tls_check(target: TargetConfig) -> CheckResult:
    """
    Validate TLS certificate validity, expiration, hostname match, and protocol version.
    """
    settings = get_settings()
    started_at = datetime.now(timezone.utc)
    t0 = time.perf_counter()

    parsed = urlparse(str(target.base_url))
    hostname = target.expected_host.strip() if target.expected_host else (parsed.hostname or "")
    port = parsed.port or 443

    try:
        data = await asyncio.to_thread(
            _fetch_tls_metadata,
            hostname,
            port,
            settings.TLS_TIMEOUT,
        )
    except Exception as exc:
        duration_ms = round((time.perf_counter() - t0) * 1000, 2)
        return CheckResult(
            check_id=CHECK_ID,
            category=CATEGORY,
            status=CheckStatus.FAIL,
            weight=WEIGHT,
            started_at=started_at,
            duration_ms=duration_ms,
            summary=f"TLS handshake failed: {exc}",
            expected="Successful TLS handshake with valid certificate",
            observed=f"Handshake error: {exc}",
            evidence={"hostname": hostname, "port": port, "error": str(exc)},
            remediation="Ensure the server is listening with a valid SSL/TLS certificate on port 443.",
            rule_version=settings.RULESET_VERSION,
        )

    duration_ms = round((time.perf_counter() - t0) * 1000, 2)
    now = datetime.now(timezone.utc)
    not_valid_before: datetime = data["not_valid_before"]
    not_valid_after: datetime = data["not_valid_after"]
    sans: list[str] = data["sans"]
    subject_cn: str | None = data["subject_cn"]
    days_until_expiry = round((not_valid_after - now).total_seconds() / 86400, 1)

    evidence: dict[str, Any] = {
        "hostname": hostname,
        "port": port,
        "subject_cn": subject_cn,
        "issuer": data["issuer"],
        "not_valid_before": not_valid_before.isoformat(),
        "not_valid_after": not_valid_after.isoformat(),
        "days_until_expiry": days_until_expiry,
        "sans": sans,
        "protocol_version": data["protocol_version"],
        "cipher": data["cipher"],
    }

    # 1. Hostname match check
    if not _verify_hostname_in_cert(hostname, sans, subject_cn):
        return CheckResult(
            check_id=CHECK_ID,
            category=CATEGORY,
            status=CheckStatus.FAIL,
            weight=WEIGHT,
            started_at=started_at,
            duration_ms=duration_ms,
            summary=f"TLS certificate does not match target hostname '{hostname}'",
            expected=f"Certificate covering '{hostname}'",
            observed=f"Subject: {subject_cn}, SANs: {sans[:5]}",
            evidence=evidence,
            remediation="Configure a certificate with SAN covering the target domain.",
            rule_version=settings.RULESET_VERSION,
        )

    # 2. Expiration check
    if now < not_valid_before:
        return CheckResult(
            check_id=CHECK_ID,
            category=CATEGORY,
            status=CheckStatus.FAIL,
            weight=WEIGHT,
            started_at=started_at,
            duration_ms=duration_ms,
            summary=f"TLS certificate is not yet valid (valid from {not_valid_before.isoformat()})",
            expected="Certificate currently valid",
            observed=f"Valid from {not_valid_before.isoformat()}",
            evidence=evidence,
            remediation="Verify system clock or issuance timestamps.",
            rule_version=settings.RULESET_VERSION,
        )

    if now > not_valid_after:
        return CheckResult(
            check_id=CHECK_ID,
            category=CATEGORY,
            status=CheckStatus.FAIL,
            weight=WEIGHT,
            started_at=started_at,
            duration_ms=duration_ms,
            summary=f"TLS certificate expired on {not_valid_after.isoformat()}",
            expected="Valid non-expired certificate",
            observed=f"Expired {abs(days_until_expiry)} days ago",
            evidence=evidence,
            remediation="Renew TLS certificate immediately.",
            rule_version=settings.RULESET_VERSION,
        )

    # 3. Near-expiry warning (< 30 days)
    if days_until_expiry < 30.0:
        return CheckResult(
            check_id=CHECK_ID,
            category=CATEGORY,
            status=CheckStatus.WARNING,
            weight=WEIGHT,
            started_at=started_at,
            duration_ms=duration_ms,
            summary=f"TLS certificate expires in {days_until_expiry} days (< 30 days threshold)",
            expected="Certificate with at least 30 days validity remaining",
            observed=f"{days_until_expiry} days remaining",
            evidence=evidence,
            remediation="Renew certificate to prevent unexpected downtime.",
            rule_version=settings.RULESET_VERSION,
        )

    # 4. Success
    return CheckResult(
        check_id=CHECK_ID,
        category=CATEGORY,
        status=CheckStatus.PASS,
        weight=WEIGHT,
        started_at=started_at,
        duration_ms=duration_ms,
        summary=f"Valid TLS certificate issued by {data['issuer']} with {days_until_expiry} days remaining",
        expected="Valid TLS certificate with >30 days validity",
        observed=f"Protocol {data['protocol_version']}, {days_until_expiry} days remaining",
        evidence=evidence,
        remediation=None,
        rule_version=settings.RULESET_VERSION,
    )
