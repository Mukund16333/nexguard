"""Pydantic API request and response schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.safety import validate_url
from app.models.domain import CheckStatus, Environment, RunStatus


class TargetCreate(BaseModel):
    """Payload to register a new validation target."""

    display_name: str = Field(min_length=1, max_length=120, description="Friendly deployment name")
    base_url: str = Field(description="Target base URL (must start with https://)")
    environment: Environment = Field(default=Environment.PROD, description="Deployment stage")
    expected_host: Optional[str] = Field(
        default=None,
        description="Expected host header value; auto-inferred from base_url if omitted"
    )
    expected_version_marker: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Optional version/hash marker expected in HTML or API payload"
    )
    origin_url: Optional[str] = Field(
        default=None,
        description="Optional origin server URL"
    )

    @field_validator("base_url")
    @classmethod
    def validate_target_url(cls, v: str) -> str:
        """Validate base_url with SSRF and syntax rules."""
        return validate_url(v)

    @field_validator("origin_url")
    @classmethod
    def validate_origin(cls, v: Optional[str]) -> Optional[str]:
        """Validate optional origin_url with SSRF rules."""
        if v:
            return validate_url(v)
        return v


class TargetUpdate(BaseModel):
    """Payload to update an existing target configuration."""

    display_name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    base_url: Optional[str] = None
    environment: Optional[Environment] = None
    expected_host: Optional[str] = None
    expected_version_marker: Optional[str] = None
    origin_url: Optional[str] = None

    @field_validator("base_url")
    @classmethod
    def validate_target_url(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_url(v)
        return v

    @field_validator("origin_url")
    @classmethod
    def validate_origin(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_url(v)
        return v


class TargetResponse(BaseModel):
    """Target representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    target_id: UUID
    owner_id: str
    display_name: str
    base_url: str
    environment: Environment
    expected_host: str
    expected_version_marker: Optional[str] = None
    origin_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None


class TargetListResponse(BaseModel):
    """Paginated list of targets."""

    items: List[TargetResponse]
    total: int
    limit: int
    offset: int


class CheckResultSchema(BaseModel):
    """Individual check result payload."""

    model_config = ConfigDict(from_attributes=True)

    check_id: str
    category: str
    status: CheckStatus
    weight: float
    started_at: datetime
    duration_ms: float
    summary: str
    expected: Optional[str] = None
    observed: Optional[str] = None
    evidence: Dict[str, Any] = Field(default_factory=dict)
    remediation: Optional[str] = None
    rule_version: str


class RunCreateResponse(BaseModel):
    """Immediate response when triggering a run."""

    run_id: UUID
    target_id: UUID
    status: RunStatus
    message: str


class RunResponse(BaseModel):
    """Full validation run outcome."""

    model_config = ConfigDict(from_attributes=True)

    run_id: UUID
    target_id: UUID
    owner_id: str
    status: RunStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    score: Optional[float] = None
    coverage: Optional[float] = None
    ruleset_version: str
    app_version: str
    check_results: List[CheckResultSchema]
    report_key: Optional[str] = None
    duration_ms: Optional[float] = None


class RunListResponse(BaseModel):
    """Paginated list of runs."""

    items: List[RunResponse]
    total: int
    limit: int
    offset: int


class HealthResponse(BaseModel):
    """Health check payload."""

    status: str
    version: str
