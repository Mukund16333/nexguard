"""Unit tests for CDN behavior observation check."""

import pytest

from app.engine.cdn_check import run_cdn_check
from app.models.domain import CheckStatus, TargetConfig


@pytest.mark.asyncio
class TestCdnCheck:
    """Tests for run_cdn_check()."""

    async def test_cloudflare_detected_passes(self, sample_target: TargetConfig):
        headers = {
            "cf-ray": "8d3e12345678-SJC",
            "cf-cache-status": "HIT",
            "server": "cloudflare",
            "cache-control": "public, max-age=14400",
        }

        result = await run_cdn_check(sample_target, response_headers=headers)
        assert result.status == CheckStatus.PASS
        assert result.weight == 0.10
        assert "Cloudflare" in result.evidence["detected_providers"]
        assert "cf-ray" in result.evidence["found_cdn_headers"]

    async def test_cloudfront_detected_passes(self, sample_target: TargetConfig):
        headers = {
            "x-amz-cf-id": "AbCdEf12345==",
            "x-amz-cf-pop": "SFO53-C1",
            "via": "1.1 cloudfront.net",
        }

        result = await run_cdn_check(sample_target, response_headers=headers)
        assert result.status == CheckStatus.PASS
        assert "Amazon CloudFront" in result.evidence["detected_providers"]

    async def test_no_cdn_indicators_returns_warning_not_fail(self, sample_target: TargetConfig):
        # Plain server without CDN headers
        headers = {
            "server": "Apache/2.4.41 (Ubuntu)",
            "content-type": "text/html",
        }

        result = await run_cdn_check(sample_target, response_headers=headers)
        # CDN absence must be WARNING, never FAIL
        assert result.status == CheckStatus.WARNING
        assert len(result.evidence["detected_providers"]) == 0
        assert "No CDN or edge caching" in result.summary
