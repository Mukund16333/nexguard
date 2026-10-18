"""FastAPI dependency injection providers."""

from __future__ import annotations

from typing import Annotated, Optional

from fastapi import Depends, Header

from app.core.config import Settings, get_settings
from app.repositories.base import BaseRepository
from app.repositories.sqlite_repo import get_repository


def get_current_settings() -> Settings:
    """Settings dependency."""
    return get_settings()


def get_repo() -> BaseRepository:
    """Repository dependency."""
    return get_repository()


def get_current_owner(
    x_owner_id: Annotated[Optional[str], Header()] = None,
    settings: Settings = Depends(get_current_settings),
) -> str:
    """Extract owner ID from request header or fall back to default local user."""
    if x_owner_id and x_owner_id.strip():
        return x_owner_id.strip()
    return settings.DEFAULT_OWNER_ID
