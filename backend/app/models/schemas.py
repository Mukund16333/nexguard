"""Pydantic API request and response schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.safety import validate_url
from app.models.domain import CheckStatus, Environment, RunStatus


class TargetCreate(BaseModel):
    """Payload to register a new validation target."""

    display_name: str = Field(min_length=1, max_length=120, description="Friendly deployment name")
    base_url: str = Field(description="Target base URL (must start with https://)")
    environment: Environment = Field(default=Environment.PROD, description="Deployment stage")
    expected_host: str | None = Field(
        default=None,
        description="Expected host header value; auto-inferred from base_url if omitted",
    )
    expected_version_marker: str | None = Field(
        default=None,
        max_length=255,
        description="Optional version/hash marker expected in HTML or API payload",
    )
    origin_url: str | None = Field(default=None, description="Optional origin server URL")

    @field_validator("base_url")
    @classmethod
    def validate_target_url(cls, v: str) -> str:
        """Validate base_url with SSRF and syntax rules."""
        return validate_url(v)

    @field_validator("origin_url")
    @classmethod
    def validate_origin(cls, v: str | None) -> str | None:
        """Validate optional origin_url with SSRF rules."""
        if v:
            return validate_url(v)
        return v


class TargetUpdate(BaseModel):
    """Payload to update an existing target configuration."""

    display_name: str | None = Field(default=None, min_length=1, max_length=120)
    base_url: str | None = None
    environment: Environment | None = None
    expected_host: str | None = None
    expected_version_marker: str | None = None
    origin_url: str | None = None

    @field_validator("base_url")
    @classmethod
    def validate_target_url(cls, v: str | None) -> str | None:
        if v is not None:
            return validate_url(v)
        return v

    @field_validator("origin_url")
    @classmethod
    def validate_origin(cls, v: str | None) -> str | None:
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
    expected_version_marker: str | None = None
    origin_url: str | None = None
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None


class TargetListResponse(BaseModel):
    """Paginated list of targets."""

    items: list[TargetResponse]
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
    expected: str | None = None
    observed: str | None = None
    evidence: dict[str, Any] = Field(default_factory=dict)
    remediation: str | None = None
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
    completed_at: datetime | None = None
    score: float | None = None
    coverage: float | None = None
    ruleset_version: str
    app_version: str
    check_results: list[CheckResultSchema]
    report_key: str | None = None
    duration_ms: float | None = None


class RunListResponse(BaseModel):
    """Paginated list of runs."""

    items: list[RunResponse]
    total: int
    limit: int
    offset: int


class HealthResponse(BaseModel):
    """Health check payload."""

    status: str
    version: str
