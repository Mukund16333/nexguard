"""Unit tests for TLS certificate check."""

from datetime import datetime, timedelta, timezone
from unittest.mock import patch
import pytest

from app.engine.tls_check import run_tls_check
from app.models.domain import CheckStatus, TargetConfig


@pytest.mark.asyncio
class TestTlsCheck:
    """Tests for run_tls_check()."""

    async def test_valid_cert_more_than_30_days(self, sample_target: TargetConfig):
        now = datetime.now(timezone.utc)
        mock_meta = {
            "subject_cn": "api.example.com",
            "issuer": "Let's Encrypt (R3)",
            "not_valid_before": now - timedelta(days=10),
            "not_valid_after": now + timedelta(days=80),
            "sans": ["api.example.com", "*.example.com"],
            "protocol_version": "TLSv1.3",
            "cipher": ("TLS_AES_256_GCM_SHA384", "TLSv1.3", 256),
        }

        with patch("app.engine.tls_check._fetch_tls_metadata", return_value=mock_meta):
            result = await run_tls_check(sample_target)
            assert result.status == CheckStatus.PASS
            assert result.weight == 0.25
            assert "Valid TLS certificate" in result.summary
            assert result.evidence["days_until_expiry"] > 30

    async def test_warning_when_expiring_soon(self, sample_target: TargetConfig):
        now = datetime.now(timezone.utc)
        mock_meta = {
            "subject_cn": "api.example.com",
            "issuer": "DigiCert",
            "not_valid_before": now - timedelta(days=350),
            "not_valid_after": now + timedelta(days=15),  # 15 days left
            "sans": ["api.example.com"],
            "protocol_version": "TLSv1.3",
            "cipher": ("TLS_AES_256_GCM_SHA384", "TLSv1.3", 256),
        }

        with patch("app.engine.tls_check._fetch_tls_metadata", return_value=mock_meta):
            result = await run_tls_check(sample_target)
            assert result.status == CheckStatus.WARNING
            assert "< 30 days" in result.summary
            assert result.evidence["days_until_expiry"] < 30

    async def test_expired_cert_fails(self, sample_target: TargetConfig):
        now = datetime.now(timezone.utc)
        mock_meta = {
            "subject_cn": "api.example.com",
            "issuer": "DigiCert",
            "not_valid_before": now - timedelta(days=400),
            "not_valid_after": now - timedelta(days=5),  # Expired 5 days ago
            "sans": ["api.example.com"],
            "protocol_version": "TLSv1.3",
            "cipher": ("TLS_AES_256_GCM_SHA384", "TLSv1.3", 256),
        }

        with patch("app.engine.tls_check._fetch_tls_metadata", return_value=mock_meta):
            result = await run_tls_check(sample_target)
            assert result.status == CheckStatus.FAIL
            assert "expired" in result.summary

    async def test_hostname_mismatch_fails(self, sample_target: TargetConfig):
        now = datetime.now(timezone.utc)
        mock_meta = {
            "subject_cn": "unrelated.domain.org",
            "issuer": "Sectigo",
            "not_valid_before": now - timedelta(days=10),
            "not_valid_after": now + timedelta(days=90),
            "sans": ["unrelated.domain.org", "other.org"],
            "protocol_version": "TLSv1.3",
            "cipher": ("TLS_AES_256_GCM_SHA384", "TLSv1.3", 256),
        }

        with patch("app.engine.tls_check._fetch_tls_metadata", return_value=mock_meta):
            result = await run_tls_check(sample_target)
            assert result.status == CheckStatus.FAIL
            assert "does not match" in result.summary

    async def test_handshake_error_fails(self, sample_target: TargetConfig):
        with patch("app.engine.tls_check._fetch_tls_metadata", side_effect=ConnectionRefusedError("Connection refused")):
            result = await run_tls_check(sample_target)
            assert result.status == CheckStatus.FAIL
            assert "handshake failed" in result.summary.lower()
