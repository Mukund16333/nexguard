"""Unit tests for content freshness check."""

import httpx
import pytest
import respx

from app.engine.freshness_check import run_freshness_check
from app.models.domain import CheckStatus, TargetConfig


@pytest.mark.asyncio
class TestFreshnessCheck:
    """Tests for run_freshness_check()."""

    async def test_skipped_when_no_marker_configured(self, sample_target: TargetConfig):
        sample_target.expected_version_marker = None

        result = await run_freshness_check(sample_target)
        assert result.status == CheckStatus.SKIPPED
        assert result.weight == 0.15
        assert "skipped" in result.summary.lower()

    @respx.mock
    async def test_marker_found_passes(self, sample_target: TargetConfig):
        sample_target.expected_version_marker = "sha-9f8e7d6"
        html_body = "<html><body>Release version: sha-9f8e7d6 active</body></html>"

        respx.get("https://api.example.com").mock(return_value=httpx.Response(200, text=html_body))

        result = await run_freshness_check(sample_target)
        assert result.status == CheckStatus.PASS
        assert result.evidence["marker_found"] is True
        assert "Found expected version marker" in result.summary

    @respx.mock
    async def test_marker_absent_fails(self, sample_target: TargetConfig):
        sample_target.expected_version_marker = "v2.0.0-final"
        html_body = "<html><body>Outdated release: v1.0.0</body></html>"

        respx.get("https://api.example.com").mock(return_value=httpx.Response(200, text=html_body))

        result = await run_freshness_check(sample_target)
        assert result.status == CheckStatus.FAIL
        assert result.evidence["marker_found"] is False
        assert "not found" in result.summary
