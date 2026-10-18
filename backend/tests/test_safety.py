"""Unit tests for safety module, URL validation, and SSRF prevention."""

import pytest

from app.core.safety import (
    SSRFProtectionError,
    SafetyValidationError,
    check_ip_safety,
    is_ip_safe,
    validate_redirect,
    validate_url,
)


class TestUrlValidation:
    """Tests for validate_url()."""

    def test_valid_https_url(self):
        url = "https://app.example.com/api/v1/health"
        assert validate_url(url) == url

    def test_reject_http_scheme(self):
        with pytest.raises(SafetyValidationError, match="requires 'https' scheme"):
            validate_url("http://example.com")

    def test_reject_ftp_scheme(self):
        with pytest.raises(SafetyValidationError, match="requires 'https' scheme"):
            validate_url("ftp://example.com/file")

    def test_reject_empty_or_none(self):
        with pytest.raises(SafetyValidationError):
            validate_url("")

    def test_reject_embedded_credentials(self):
        with pytest.raises(SafetyValidationError, match="credentials"):
            validate_url("https://admin:secret@example.com")

    def test_reject_ip_literals_ipv4(self):
        with pytest.raises(SSRFProtectionError, match="IP literal"):
            validate_url("https://93.184.216.34")

    def test_reject_ip_literals_ipv6(self):
        with pytest.raises(SSRFProtectionError, match="IP literal"):
            validate_url("https://[2606:2800:220:1:248:1893:25c8:1946]")

    def test_reject_localhost(self):
        with pytest.raises(SSRFProtectionError, match="reserved local hostname"):
            validate_url("https://localhost")
        with pytest.raises(SSRFProtectionError, match="reserved local hostname"):
            validate_url("https://localhost:8443")

    def test_reject_local_domain_suffix(self):
        with pytest.raises(SSRFProtectionError, match="reserved domain"):
            validate_url("https://myserver.local")
        with pytest.raises(SSRFProtectionError, match="reserved domain"):
            validate_url("https://k8s.internal")


class TestIpSafety:
    """Tests for is_ip_safe() and check_ip_safety()."""

    @pytest.mark.parametrize(
        "private_ip",
        [
            "127.0.0.1",       # Loopback
            "127.0.1.1",       # Loopback block
            "::1",             # IPv6 Loopback
            "10.0.0.5",        # RFC 1918 Private
            "172.16.0.1",      # RFC 1918 Private
            "172.31.255.255",  # RFC 1918 Private
            "192.168.1.1",     # RFC 1918 Private
            "169.254.169.254", # Link-local / Cloud metadata
            "224.0.0.1",       # Multicast
            "255.255.255.255", # Broadcast
            "100.64.0.1",      # CGNAT
            "0.0.0.0",         # Unspecified
        ],
    )
    def test_unsafe_ips_blocked(self, private_ip: str):
        assert not is_ip_safe(private_ip)
        with pytest.raises(SSRFProtectionError):
            check_ip_safety(private_ip)

    @pytest.mark.parametrize(
        "public_ip",
        [
            "8.8.8.8",
            "1.1.1.1",
            "93.184.216.34",
            "2606:4700:4700::1111",
        ],
    )
    def test_safe_public_ips_allowed(self, public_ip: str):
        assert is_ip_safe(public_ip)
        assert check_ip_safety(public_ip) is True


class TestRedirectValidation:
    """Tests for validate_redirect()."""

    def test_safe_relative_redirect(self):
        current = "https://example.com/login"
        target = "/dashboard"
        resolved = validate_redirect(current, target)
        assert resolved == "https://example.com/dashboard"

    def test_safe_absolute_redirect(self):
        current = "https://example.com"
        target = "https://cdn.example.com/static"
        resolved = validate_redirect(current, target)
        assert resolved == "https://cdn.example.com/static"

    def test_reject_redirect_to_http(self):
        current = "https://example.com"
        target = "http://example.com/insecure"
        with pytest.raises(SafetyValidationError):
            validate_redirect(current, target)

    def test_reject_redirect_to_localhost(self):
        current = "https://example.com"
        target = "https://localhost:8443/admin"
        with pytest.raises(SSRFProtectionError):
            validate_redirect(current, target)

    def test_reject_redirect_to_ip_literal(self):
        current = "https://example.com"
        target = "https://169.254.169.254/latest/meta-data"
        with pytest.raises(SSRFProtectionError):
            validate_redirect(current, target)
