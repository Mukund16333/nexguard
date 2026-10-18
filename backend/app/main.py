"""FastAPI application factory and lifecycle management."""

from __future__ import annotations

import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

from app.api.health import router as health_router
from app.api.router import api_v1_router
from app.core.config import get_settings
from app.core.safety import SafetyValidationError, SSRFProtectionError
from app.repositories.sqlite_repo import init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nexguard")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager to initialize DB tables and teardown resources."""
    logger.info("Initializing NexGuard persistence layer...")
    await init_db()
    logger.info("Database initialized successfully.")
    yield
    logger.info("Shutting down NexGuard backend.")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    settings = get_settings()

    app = FastAPI(
        title="NexGuard",
        description="Cloud Deployment Security & Reliability Validator - non-intrusive read-only automated assurance",
        version=settings.APP_VERSION,
        lifespan=lifespan,
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global Exception Handlers
    @app.exception_handler(SSRFProtectionError)
    async def ssrf_exception_handler(request: Request, exc: SSRFProtectionError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error": "SSRF_VIOLATION",
                "message": str(exc),
            },
        )

    @app.exception_handler(SafetyValidationError)
    async def safety_exception_handler(
        request: Request, exc: SafetyValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "SAFETY_VALIDATION_ERROR",
                "message": str(exc),
            },
        )

    # Include routers
    app.include_router(health_router)
    app.include_router(api_v1_router)

    @app.get("/", include_in_schema=False)
    async def root() -> RedirectResponse:
        return RedirectResponse(url="/docs")

    return app


app = create_app()
