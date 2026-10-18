"""Unit tests for security headers check."""

import pytest

from app.engine.headers_check import run_headers_check
from app.models.domain import CheckStatus, TargetConfig


@pytest.mark.asyncio
class TestHeadersCheck:
    """Tests for run_headers_check()."""

    async def test_all_headers_present_passes(self, sample_target: TargetConfig):
        headers = {
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": "default-src 'self'",
            "X-Frame-Options": "DENY",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "camera=(), geolocation=()",
        }

        result = await run_headers_check(sample_target, response_headers=headers)
        assert result.status == CheckStatus.PASS
        assert result.weight == 0.20
        assert "All critical and recommended" in result.summary

    async def test_missing_critical_hsts_fails(self, sample_target: TargetConfig):
        headers = {
            # HSTS is missing!
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": "default-src 'self'",
            "X-Frame-Options": "DENY",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "camera=()",
        }

        result = await run_headers_check(sample_target, response_headers=headers)
        assert result.status == CheckStatus.FAIL
        assert "Strict-Transport-Security" in result.evidence["missing_critical"]

    async def test_invalid_x_content_type_options_fails(self, sample_target: TargetConfig):
        headers = {
            "Strict-Transport-Security": "max-age=31536000",
            "X-Content-Type-Options": "sniff",  # Invalid
        }

        result = await run_headers_check(sample_target, response_headers=headers)
        assert result.status == CheckStatus.FAIL
        assert "X-Content-Type-Options" in result.evidence["missing_critical"]

    async def test_missing_recommended_headers_warns(self, sample_target: TargetConfig):
        headers = {
            # Critical headers present:
            "Strict-Transport-Security": "max-age=31536000",
            "X-Content-Type-Options": "nosniff",
            # Missing recommended: CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy
        }

        result = await run_headers_check(sample_target, response_headers=headers)
        assert result.status == CheckStatus.WARNING
        assert len(result.evidence["missing_recommended"]) > 0

    async def test_csp_frame_ancestors_satisfies_x_frame_options(self, sample_target: TargetConfig):
        headers = {
            "Strict-Transport-Security": "max-age=31536000",
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": "default-src 'self'; frame-ancestors 'none'",
            "Referrer-Policy": "no-referrer",
            "Permissions-Policy": "geolocation=()",
            # X-Frame-Options omitted, but satisfied by frame-ancestors
        }

        result = await run_headers_check(sample_target, response_headers=headers)
        assert result.status == CheckStatus.PASS
