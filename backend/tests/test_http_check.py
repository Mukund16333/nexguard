"""Unit tests for HTTP check engine."""

import httpx
import pytest
import respx

from app.engine.http_check import run_http_check
from app.models.domain import CheckStatus, TargetConfig


@pytest.mark.asyncio
class TestHttpCheck:
    """Tests for run_http_check()."""

    @respx.mock
    async def test_http_200_ok(self, sample_target: TargetConfig):
        respx.get("https://api.example.com").mock(
            return_value=httpx.Response(200, headers={"Server": "cloudflare"}, text="OK")
        )

        result = await run_http_check(sample_target)
        assert result.status == CheckStatus.PASS
        assert result.weight == 0.15
        assert result.evidence["status_code"] == 200
        assert result.evidence["server_header"] == "cloudflare"

    @respx.mock
    async def test_safe_redirect_chain(self, sample_target: TargetConfig):
        respx.get("https://api.example.com/").mock(
            return_value=httpx.Response(301, headers={"Location": "https://api.example.com/final"})
        )
        respx.get("https://api.example.com/final").mock(
            return_value=httpx.Response(200, text="Final")
        )

        result = await run_http_check(sample_target)
        assert result.status == CheckStatus.PASS
        assert len(result.evidence["redirect_chain"]) >= 2
        assert result.evidence["final_url"] == "https://api.example.com/final"

    @respx.mock
    async def test_redirect_to_different_host_warning(self, sample_target: TargetConfig):
        respx.get("https://api.example.com").mock(
            return_value=httpx.Response(
                302, headers={"Location": "https://other.example.com/login"}
            )
        )
        respx.get("https://other.example.com/login").mock(
            return_value=httpx.Response(200, text="Other")
        )

        result = await run_http_check(sample_target)
        assert result.status == CheckStatus.WARNING
        assert "differs from expected" in result.summary

    @respx.mock
    async def test_unsafe_redirect_fails_ssrf(self, sample_target: TargetConfig):
        respx.get("https://api.example.com").mock(
            return_value=httpx.Response(302, headers={"Location": "http://insecure.example.com"})
        )

        result = await run_http_check(sample_target)
        assert result.status == CheckStatus.FAIL
        assert "safety policy" in result.summary

    @respx.mock
    async def test_non_200_fails(self, sample_target: TargetConfig):
        respx.get("https://api.example.com").mock(
            return_value=httpx.Response(500, text="Internal Error")
        )

        result = await run_http_check(sample_target)
        assert result.status == CheckStatus.FAIL
        assert "non-200" in result.summary
        assert result.evidence["status_code"] == 500

    @respx.mock
    async def test_timeout_fails(self, sample_target: TargetConfig):
        respx.get("https://api.example.com").mock(
            side_effect=httpx.ConnectTimeout("Connection timed out")
        )

        result = await run_http_check(sample_target)
        assert result.status == CheckStatus.FAIL
        assert "timed out" in result.summary
