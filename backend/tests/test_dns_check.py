"""Unit tests for DNS check engine."""

from unittest.mock import AsyncMock, patch
import dns.resolver
import pytest

from app.engine.dns_check import run_dns_check
from app.models.domain import CheckStatus, TargetConfig


class MockRdata:
    def __init__(self, address: str | None = None, target: str | None = None):
        self.address = address
        self.target = target


class MockAnswer:
    def __init__(self, items: list[MockRdata]):
        self._items = items

    def __iter__(self):
        return iter(self._items)


@pytest.mark.asyncio
class TestDnsCheck:
    """Tests for run_dns_check()."""

    async def test_successful_public_resolution(self, sample_target: TargetConfig):
        with patch("dns.asyncresolver.Resolver.resolve", new_callable=AsyncMock) as mock_resolve:
            def side_effect(qname, rdtype):
                if rdtype == "A":
                    return MockAnswer([MockRdata(address="93.184.216.34")])
                if rdtype == "AAAA":
                    return MockAnswer([MockRdata(address="2606:2800:220:1:248:1893:25c8:1946")])
                raise dns.resolver.NoAnswer()

            mock_resolve.side_effect = side_effect

            result = await run_dns_check(sample_target)
            assert result.status == CheckStatus.PASS
            assert "93.184.216.34" in result.evidence["resolved_ips"]
            assert result.weight == 0.10

    async def test_fails_on_private_ip_ssrf(self, sample_target: TargetConfig):
        with patch("dns.asyncresolver.Resolver.resolve", new_callable=AsyncMock) as mock_resolve:
            mock_resolve.return_value = MockAnswer([MockRdata(address="192.168.1.1")])

            result = await run_dns_check(sample_target)
            assert result.status == CheckStatus.FAIL
            assert "192.168.1.1" in result.evidence["unsafe_ips"]
            assert "SSRF-prohibited" in result.summary

    async def test_fails_when_domain_not_found(self, sample_target: TargetConfig):
        with patch("dns.asyncresolver.Resolver.resolve", new_callable=AsyncMock) as mock_resolve:
            mock_resolve.side_effect = dns.resolver.NXDOMAIN()

            result = await run_dns_check(sample_target)
            assert result.status == CheckStatus.FAIL
            assert "No A or AAAA records resolved" in result.observed
