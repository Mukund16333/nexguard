"""URL and IP validation with comprehensive SSRF protection."""

from __future__ import annotations

import ipaddress
import re
from urllib.parse import urljoin, urlparse

# Engine constants
MAX_REDIRECTS: int = 5
CONNECTION_TIMEOUT: float = 10.0
READ_TIMEOUT: float = 30.0

# Disallowed domain suffixes and reserved names
BLOCKED_HOSTNAMES = {
    "localhost",
    "localhost.localdomain",
    "broadcasthost",
    "local",
    "internal",
    "corp",
    "home",
    "lan",
}

BLOCKED_SUFFIXES = (
    ".local",
    ".internal",
    ".arpa",
    ".localhost",
    ".lan",
    ".corp",
)

# Explicit extra CIDR networks to block
BLOCKED_NETWORKS = [
    ipaddress.ip_network("100.64.0.0/10"),  # Carrier-Grade NAT
    ipaddress.ip_network("192.0.0.0/24"),  # IETF Protocol Assignments
    ipaddress.ip_network("192.0.2.0/24"),  # Documentation (TEST-NET-1)
    ipaddress.ip_network("198.18.0.0/15"),  # Benchmarking
    ipaddress.ip_network("198.51.100.0/24"),  # Documentation (TEST-NET-2)
    ipaddress.ip_network("203.0.113.0/24"),  # Documentation (TEST-NET-3)
    ipaddress.ip_network("192.88.99.0/24"),  # 6to4 Relay Anycast
    ipaddress.ip_network("240.0.0.0/4"),  # Reserved for Future Use
    ipaddress.ip_network("255.255.255.255/32"),  # Limited Broadcast
    ipaddress.ip_network("2001:db8::/32"),  # IPv6 Documentation
    ipaddress.ip_network("100::/64"),  # IPv6 Discard prefix
]

# Simple hostname regex (RFC 1123 compliant)
HOSTNAME_REGEX = re.compile(
    r"^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)"
    r"(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*\.?$"
)


class SafetyValidationError(ValueError):
    """Raised when URL fails structural safety checks."""

    pass


class SSRFProtectionError(SafetyValidationError):
    """Raised when an address violates SSRF protection boundaries."""

    pass


def is_ip_literal(hostname: str) -> bool:
    """Check if the given hostname string is an IPv4 or IPv6 literal."""
    clean_host = hostname.strip("[]")

    # Check standard IPv4 / IPv6
    try:
        ipaddress.ip_address(clean_host)
        return True
    except ValueError:
        pass

    # Check decimal / octal integer representations (e.g. 2130706433 or 017700000001)
    if clean_host.isdigit():
        try:
            ipaddress.ip_address(int(clean_host))
            return True
        except ValueError:
            pass

    # Check hex format (e.g. 0x7f000001)
    if clean_host.lower().startswith("0x"):
        try:
            ipaddress.ip_address(int(clean_host, 16))
            return True
        except ValueError:
            pass

    return False


def is_ip_safe(ip: str | ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """
    Check if an IP address is a safe, routable public IP.

    Blocks:
    - Loopback (127.0.0.0/8, ::1)
    - Private networks (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, fc00::/7)
    - Link-local (169.254.0.0/16, fe80::/10)
    - Multicast (224.0.0.0/4, ff00::/8)
    - Reserved / unspecified / special-use ranges
    """
    if isinstance(ip, str):
        try:
            ip_obj = ipaddress.ip_address(ip.strip("[]"))
        except ValueError as exc:
            raise SSRFProtectionError(f"Invalid IP address format: {ip}") from exc
    else:
        ip_obj = ip

    # Built-in properties from ipaddress
    if (
        ip_obj.is_loopback
        or ip_obj.is_private
        or ip_obj.is_link_local
        or ip_obj.is_multicast
        or ip_obj.is_reserved
        or ip_obj.is_unspecified
    ):
        return False

    # Check additional blocked networks
    for net in BLOCKED_NETWORKS:
        if ip_obj in net:
            return False

    return True


def check_ip_safety(ip: str | ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """
    Validate that an IP is safe. Raises SSRFProtectionError if unsafe.
    Returns True if valid.
    """
    if not is_ip_safe(ip):
        raise SSRFProtectionError(
            f"Access to IP '{ip}' is blocked by NexGuard SSRF safety policies (private/loopback/reserved IP)."
        )
    return True


def validate_url(url: str) -> str:
    """
    Validate that a URL is safe for security testing.

    Enforces:
    - HTTPS scheme only (never unencrypted HTTP)
    - Valid non-empty hostname
    - Rejects IP literals (e.g. https://1.1.1.1, https://127.0.0.1)
    - Rejects private / reserved hostnames (e.g. localhost, *.local, *.internal)
    - Rejects URLs with embedded userinfo (credentials)
    """
    if not url or not isinstance(url, str):
        raise SafetyValidationError("URL must be a non-empty string.")

    cleaned_url = url.strip()
    parsed = urlparse(cleaned_url)

    # 1. Scheme check: only HTTPS allowed
    if parsed.scheme.lower() != "https":
        raise SafetyValidationError(
            f"Invalid scheme '{parsed.scheme}'. NexGuard requires 'https' scheme for all targets."
        )

    # 2. Hostname presence
    hostname = parsed.hostname
    if not hostname:
        raise SafetyValidationError("URL must include a valid hostname.")

    hostname_lower = hostname.lower()

    # 3. Disallow user info / embedded credentials
    if parsed.username or parsed.password:
        raise SafetyValidationError("URLs containing credentials (user:pass@host) are prohibited.")

    # 4. Disallow IP literals
    if is_ip_literal(hostname_lower):
        raise SSRFProtectionError(
            f"IP literal hostnames ('{hostname}') are prohibited. Targets must use valid domain names."
        )

    # 5. Check blocked local/internal hostnames
    if hostname_lower in BLOCKED_HOSTNAMES:
        raise SSRFProtectionError(
            f"Target hostname '{hostname}' is a reserved local hostname and is blocked."
        )

    for suffix in BLOCKED_SUFFIXES:
        if hostname_lower.endswith(suffix):
            raise SSRFProtectionError(
                f"Target hostname '{hostname}' belongs to reserved domain '{suffix}' and is blocked."
            )

    # 6. Hostname format validation
    if not HOSTNAME_REGEX.match(hostname_lower):
        raise SafetyValidationError(f"Target hostname '{hostname}' is not a valid domain name.")

    # 7. Port check if specified
    if parsed.port is not None:
        if not (1 <= parsed.port <= 65535):
            raise SafetyValidationError(f"Invalid port: {parsed.port}")

    return cleaned_url


def validate_redirect(current_url: str, redirect_target: str) -> str:
    """
    Resolve and validate a redirect destination against SSRF and safety rules.
    """
    if not redirect_target:
        raise SafetyValidationError("Redirect target cannot be empty.")

    resolved_url = urljoin(current_url, redirect_target.strip())
    # Run the full validation suite against the resolved redirect URL
    validate_url(resolved_url)
    return resolved_url
