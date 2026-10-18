"""Pytest configuration and shared fixtures."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.deps import get_repo
from app.main import create_app
from app.models.domain import CheckResult, CheckStatus, Environment, TargetConfig
from app.repositories.sqlite_repo import Base, SQLiteRepository


@pytest_asyncio.fixture
async def in_memory_repo() -> AsyncGenerator[SQLiteRepository, None]:
    """Provide an isolated in-memory SQLite repository for tests."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
        future=True,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    repo = SQLiteRepository(session_factory)
    yield repo

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def async_client(in_memory_repo: SQLiteRepository) -> AsyncGenerator[AsyncClient, None]:
    """Provide AsyncClient wired with in-memory database repository override."""
    with patch("app.main.init_db", new_callable=AsyncMock):
        app = create_app()
        app.dependency_overrides[get_repo] = lambda: in_memory_repo

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            yield client


@pytest.fixture
def sample_target() -> TargetConfig:
    """Fixture providing a standard valid target configuration."""
    return TargetConfig(
        target_id=uuid4(),
        owner_id="test-user",
        display_name="Production API",
        base_url="https://api.example.com",
        environment=Environment.PROD,
        expected_host="api.example.com",
        expected_version_marker="v1.2.3",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


@pytest.fixture
def sample_check_pass() -> CheckResult:
    """Fixture providing a sample passing check result."""
    return CheckResult(
        check_id="dns_resolution",
        category="dns",
        status=CheckStatus.PASS,
        weight=0.10,
        started_at=datetime.now(timezone.utc),
        duration_ms=45.2,
        summary="DNS resolution succeeded",
        expected="Valid public IPs",
        observed="Resolved to 93.184.216.34",
        evidence={"resolved_ips": ["93.184.216.34"]},
        rule_version="1.0.0",
    )
