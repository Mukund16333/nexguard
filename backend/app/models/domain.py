"""Core domain models for targets, checks, and runs."""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field


class CheckStatus(str, Enum):
    """Execution status of an individual security or reliability check."""
    PASS = "PASS"
    WARNING = "WARNING"
    FAIL = "FAIL"
    SKIPPED = "SKIPPED"
    ERROR = "ERROR"


class Environment(str, Enum):
    """Target deployment environment."""
    DEV = "dev"
    STAGING = "staging"
    PROD = "prod"


class RunStatus(str, Enum):
    """Overall status of a validation run."""
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


def utc_now() -> datetime:
    """Return timezone-aware current UTC datetime."""
    return datetime.now(timezone.utc)


class CheckResult(BaseModel):
    """Detailed outcome of a single validation check."""

    model_config = ConfigDict(from_attributes=True)

    check_id: str = Field(description="Unique check identifier, e.g. 'dns_resolution'")
    category: str = Field(description="Check category: dns, http, tls, headers, freshness, cdn")
    status: CheckStatus = Field(description="Result status: PASS, WARNING, FAIL, SKIPPED, ERROR")
    weight: float = Field(description="Relative weight in overall score calculation", ge=0.0, le=1.0)
    started_at: datetime = Field(default_factory=utc_now)
    duration_ms: float = Field(description="Execution latency in milliseconds", ge=0.0)
    summary: str = Field(description="Human-readable outcome summary")
    expected: Optional[str] = Field(default=None, description="Expected value or behavior")
    observed: Optional[str] = Field(default=None, description="Observed outcome or evidence summary")
    evidence: Dict[str, Any] = Field(default_factory=dict, description="Structured forensic evidence")
    remediation: Optional[str] = Field(default=None, description="Recommended remediation instructions")
    rule_version: str = Field(default="1.0.0", description="Ruleset version applied")


class TargetConfig(BaseModel):
    """Configuration for a validation target."""

    model_config = ConfigDict(from_attributes=True)

    target_id: UUID = Field(default_factory=uuid4, description="Target unique ID")
    owner_id: str = Field(default="local-user", description="Owner identifier")
    display_name: str = Field(description="User-friendly name of the target deployment")
    base_url: str = Field(description="Target base URL (must be HTTPS)")
    environment: Environment = Field(default=Environment.PROD, description="Target environment")
    expected_host: str = Field(description="Expected FQDN for host header validation")
    expected_version_marker: Optional[str] = Field(
        default=None,
        description="Optional release hash, tag, or version marker expected in body"
    )
    origin_url: Optional[str] = Field(
        default=None,
        description="Optional origin server URL behind CDN/proxy for comparison"
    )
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    deleted_at: Optional[datetime] = Field(default=None, description="Soft-delete timestamp")


class Run(BaseModel):
    """Execution record for a validation run against a target."""

    model_config = ConfigDict(from_attributes=True)

    run_id: UUID = Field(default_factory=uuid4, description="Unique run identifier")
    target_id: UUID = Field(description="Target being evaluated")
    owner_id: str = Field(default="local-user", description="Owner identifier")
    status: RunStatus = Field(default=RunStatus.QUEUED, description="Execution status")
    started_at: datetime = Field(default_factory=utc_now)
    completed_at: Optional[datetime] = Field(default=None)
    score: Optional[float] = Field(default=None, ge=0.0, le=100.0, description="Score 0-100")
    coverage: Optional[float] = Field(default=None, ge=0.0, le=100.0, description="Test coverage percentage")
    ruleset_version: str = Field(default="1.0.0")
    app_version: str = Field(default="0.1.0")
    check_results: List[CheckResult] = Field(default_factory=list)
    report_key: Optional[str] = Field(default=None, description="Report identifier or path")
    duration_ms: Optional[float] = Field(default=None, ge=0.0)
