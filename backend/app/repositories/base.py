"""Abstract repository interface for NexGuard data access."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any
from uuid import UUID

from app.models.domain import Run, TargetConfig


class BaseRepository(ABC):
    """Abstract interface defining target and run persistence operations."""

    @abstractmethod
    async def create_target(self, target: TargetConfig) -> TargetConfig:
        """Persist a new target configuration."""
        raise NotImplementedError

    @abstractmethod
    async def get_target(self, target_id: UUID) -> TargetConfig | None:
        """Retrieve a target by its unique identifier."""
        raise NotImplementedError

    @abstractmethod
    async def list_targets(
        self,
        owner_id: str | None = None,
        include_deleted: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[TargetConfig], int]:
        """List targets with optional filtering and pagination. Returns (items, total_count)."""
        raise NotImplementedError

    @abstractmethod
    async def update_target(self, target_id: UUID, updates: dict[str, Any]) -> TargetConfig | None:
        """Update mutable fields of a target."""
        raise NotImplementedError

    @abstractmethod
    async def delete_target(self, target_id: UUID) -> bool:
        """Soft delete a target (records deleted_at timestamp). Returns True if updated."""
        raise NotImplementedError

    @abstractmethod
    async def create_run(self, run: Run) -> Run:
        """Persist a new run record."""
        raise NotImplementedError

    @abstractmethod
    async def get_run(self, run_id: UUID) -> Run | None:
        """Retrieve a run by its ID."""
        raise NotImplementedError

    @abstractmethod
    async def update_run(self, run: Run) -> Run:
        """Update an existing run with results, score, and completion status."""
        raise NotImplementedError

    @abstractmethod
    async def list_runs_for_target(
        self,
        target_id: UUID,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Run], int]:
        """List runs executed for a specific target. Returns (items, total_count)."""
        raise NotImplementedError

    @abstractmethod
    async def list_runs(
        self,
        owner_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Run], int]:
        """List runs across all targets. Returns (items, total_count)."""
        raise NotImplementedError
