"""Application configuration and environment settings."""

from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """NexGuard application settings."""

    APP_NAME: str = "NexGuard"
    APP_VERSION: str = "0.1.0"
    RULESET_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./nexguard.db"

    # CORS Settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*",
    ]

    # Validation Engine Timeouts & Safeguards
    MAX_REDIRECTS: int = 5
    CONNECTION_TIMEOUT: float = 10.0
    READ_TIMEOUT: float = 30.0
    DNS_TIMEOUT: float = 5.0
    TLS_TIMEOUT: float = 10.0
    MAX_FRESHNESS_BYTES: int = 10240  # Bounded search: first 10KB

    # Default owner for local mode operations
    DEFAULT_OWNER_ID: str = "local-user"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    """Return cached application settings instance."""
    return Settings()
