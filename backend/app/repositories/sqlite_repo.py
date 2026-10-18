"""SQLAlchemy 2.x async SQLite implementation of BaseRepository."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import (
    JSON,
    DateTime,
    Float,
    ForeignKey,
    String,
    desc,
    func,
    select,
    update,
)
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.core.config import get_settings
from app.models.domain import (
    CheckResult,
    Environment,
    Run,
    RunStatus,
    TargetConfig,
)
from app.repositories.base import BaseRepository


class Base(DeclarativeBase):
    """SQLAlchemy declarative base."""

    pass


class TargetModel(Base):
    """SQLAlchemy model for targets table."""

    __tablename__ = "targets"

    target_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    owner_id: Mapped[str] = mapped_column(String(64), index=True)
    display_name: Mapped[str] = mapped_column(String(255))
    base_url: Mapped[str] = mapped_column(String(1024))
    environment: Mapped[str] = mapped_column(String(32), default="prod")
    expected_host: Mapped[str] = mapped_column(String(255))
    expected_version_marker: Mapped[str | None] = mapped_column(String(255), nullable=True)
    origin_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )


class RunModel(Base):
    """SQLAlchemy model for runs table."""

    __tablename__ = "runs"

    run_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    target_id: Mapped[str] = mapped_column(String(36), ForeignKey("targets.target_id"), index=True)
    owner_id: Mapped[str] = mapped_column(String(64), index=True)
    status: Mapped[str] = mapped_column(String(32), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    coverage: Mapped[float | None] = mapped_column(Float, nullable=True)
    ruleset_version: Mapped[str] = mapped_column(String(32))
    app_version: Mapped[str] = mapped_column(String(32))
    check_results: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    report_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    duration_ms: Mapped[float | None] = mapped_column(Float, nullable=True)


def _target_model_to_domain(model: TargetModel) -> TargetConfig:
    """Map DB TargetModel to TargetConfig domain model."""
    return TargetConfig(
        target_id=UUID(model.target_id),
        owner_id=model.owner_id,
        display_name=model.display_name,
        base_url=model.base_url,
        environment=Environment(model.environment),
        expected_host=model.expected_host,
        expected_version_marker=model.expected_version_marker,
        origin_url=model.origin_url,
        created_at=model.created_at,
        updated_at=model.updated_at,
        deleted_at=model.deleted_at,
    )


def _run_model_to_domain(model: RunModel) -> Run:
    """Map DB RunModel to Run domain model."""
    results = [CheckResult.model_validate(item) for item in (model.check_results or [])]
    return Run(
        run_id=UUID(model.run_id),
        target_id=UUID(model.target_id),
        owner_id=model.owner_id,
        status=RunStatus(model.status),
        started_at=model.started_at,
        completed_at=model.completed_at,
        score=model.score,
        coverage=model.coverage,
        ruleset_version=model.ruleset_version,
        app_version=model.app_version,
        check_results=results,
        report_key=model.report_key,
        duration_ms=model.duration_ms,
    )


class SQLiteRepository(BaseRepository):
    """Async SQLite repository backed by SQLAlchemy."""

    def __init__(self, session_factory: async_sessionmaker[AsyncSession]):
        self._session_factory = session_factory

    async def create_target(self, target: TargetConfig) -> TargetConfig:
        async with self._session_factory() as session:
            async with session.begin():
                model = TargetModel(
                    target_id=str(target.target_id),
                    owner_id=target.owner_id,
                    display_name=target.display_name,
                    base_url=str(target.base_url),
                    environment=target.environment.value,
                    expected_host=target.expected_host,
                    expected_version_marker=target.expected_version_marker,
                    origin_url=str(target.origin_url) if target.origin_url else None,
                    created_at=target.created_at,
                    updated_at=target.updated_at,
                    deleted_at=target.deleted_at,
                )
                session.add(model)
        return target

    async def get_target(self, target_id: UUID) -> TargetConfig | None:
        async with self._session_factory() as session:
            stmt = select(TargetModel).where(TargetModel.target_id == str(target_id))
            result = await session.execute(stmt)
            model = result.scalar_one_or_none()
            if not model:
                return None
            return _target_model_to_domain(model)

    async def list_targets(
        self,
        owner_id: str | None = None,
        include_deleted: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[TargetConfig], int]:
        async with self._session_factory() as session:
            stmt = select(TargetModel)
            count_stmt = select(func.count(TargetModel.target_id))

            if not include_deleted:
                stmt = stmt.where(TargetModel.deleted_at.is_(None))
                count_stmt = count_stmt.where(TargetModel.deleted_at.is_(None))

            if owner_id:
                stmt = stmt.where(TargetModel.owner_id == owner_id)
                count_stmt = count_stmt.where(TargetModel.owner_id == owner_id)

            total_result = await session.execute(count_stmt)
            total = total_result.scalar_one() or 0

            stmt = stmt.order_by(desc(TargetModel.created_at)).limit(limit).offset(offset)
            results = await session.execute(stmt)
            models = results.scalars().all()
            return [_target_model_to_domain(m) for m in models], total

    async def update_target(self, target_id: UUID, updates: dict[str, Any]) -> TargetConfig | None:
        async with self._session_factory() as session:
            async with session.begin():
                stmt = select(TargetModel).where(TargetModel.target_id == str(target_id))
                result = await session.execute(stmt)
                model = result.scalar_one_or_none()
                if not model:
                    return None

                for key, val in updates.items():
                    if hasattr(model, key) and val is not None:
                        if key == "environment" and isinstance(val, Environment):
                            setattr(model, key, val.value)
                        elif key in ("base_url", "origin_url") and val is not None:
                            setattr(model, key, str(val))
                        else:
                            setattr(model, key, val)
                model.updated_at = datetime.now(timezone.utc)
                await session.flush()
                await session.refresh(model)
                return _target_model_to_domain(model)

    async def delete_target(self, target_id: UUID) -> bool:
        async with self._session_factory() as session:
            async with session.begin():
                stmt = select(TargetModel).where(
                    TargetModel.target_id == str(target_id),
                    TargetModel.deleted_at.is_(None),
                )
                result = await session.execute(stmt)
                model = result.scalar_one_or_none()
                if not model:
                    return False
                model.deleted_at = datetime.now(timezone.utc)
                return True

    async def create_run(self, run: Run) -> Run:
        results_json = [r.model_dump(mode="json") for r in run.check_results]
        async with self._session_factory() as session:
            async with session.begin():
                model = RunModel(
                    run_id=str(run.run_id),
                    target_id=str(run.target_id),
                    owner_id=run.owner_id,
                    status=run.status.value,
                    started_at=run.started_at,
                    completed_at=run.completed_at,
                    score=run.score,
                    coverage=run.coverage,
                    ruleset_version=run.ruleset_version,
                    app_version=run.app_version,
                    check_results=results_json,
                    report_key=run.report_key,
                    duration_ms=run.duration_ms,
                )
                session.add(model)
        return run

    async def get_run(self, run_id: UUID) -> Run | None:
        async with self._session_factory() as session:
            stmt = select(RunModel).where(RunModel.run_id == str(run_id))
            result = await session.execute(stmt)
            model = result.scalar_one_or_none()
            if not model:
                return None
            return _run_model_to_domain(model)

    async def update_run(self, run: Run) -> Run:
        results_json = [r.model_dump(mode="json") for r in run.check_results]
        async with self._session_factory() as session:
            async with session.begin():
                stmt = (
                    update(RunModel)
                    .where(RunModel.run_id == str(run.run_id))
                    .values(
                        status=run.status.value,
                        completed_at=run.completed_at,
                        score=run.score,
                        coverage=run.coverage,
                        check_results=results_json,
                        report_key=run.report_key,
                        duration_ms=run.duration_ms,
                    )
                )
                await session.execute(stmt)
        return run

    async def list_runs_for_target(
        self,
        target_id: UUID,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Run], int]:
        async with self._session_factory() as session:
            count_stmt = select(func.count(RunModel.run_id)).where(
                RunModel.target_id == str(target_id)
            )
            total_res = await session.execute(count_stmt)
            total = total_res.scalar_one() or 0

            stmt = (
                select(RunModel)
                .where(RunModel.target_id == str(target_id))
                .order_by(desc(RunModel.started_at))
                .limit(limit)
                .offset(offset)
            )
            result = await session.execute(stmt)
            models = result.scalars().all()
            return [_run_model_to_domain(m) for m in models], total

    async def list_runs(
        self,
        owner_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Run], int]:
        async with self._session_factory() as session:
            count_stmt = select(func.count(RunModel.run_id))
            stmt = select(RunModel)

            if owner_id:
                count_stmt = count_stmt.where(RunModel.owner_id == owner_id)
                stmt = stmt.where(RunModel.owner_id == owner_id)

            total_res = await session.execute(count_stmt)
            total = total_res.scalar_one() or 0

            stmt = stmt.order_by(desc(RunModel.started_at)).limit(limit).offset(offset)
            result = await session.execute(stmt)
            models = result.scalars().all()
            return [_run_model_to_domain(m) for m in models], total


# Global engine and session factory cache
_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def get_engine(database_url: str | None = None) -> AsyncEngine:
    """Get or create singleton SQLAlchemy AsyncEngine."""
    global _engine
    if _engine is None:
        url = database_url or get_settings().DATABASE_URL
        if "sqlite" in url and "///" in url:
            db_path = url.split("///")[-1]
            if not db_path.startswith(":memory:"):
                db_dir = os.path.dirname(db_path)
                if db_dir:
                    os.makedirs(db_dir, exist_ok=True)
        _engine = create_async_engine(
            url,
            echo=False,
            future=True,
        )
    return _engine


def get_session_factory(database_url: str | None = None) -> async_sessionmaker[AsyncSession]:
    """Get or create session factory."""
    global _session_factory
    if _session_factory is None:
        engine = get_engine(database_url)
        _session_factory = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _session_factory


async def init_db(engine: AsyncEngine | None = None) -> None:
    """Initialize SQLite database tables."""
    eng = engine or get_engine()
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


def get_repository() -> SQLiteRepository:
    """Dependency helper returning active SQLiteRepository instance."""
    return SQLiteRepository(get_session_factory())
