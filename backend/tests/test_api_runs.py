"""Integration tests for Runs API endpoints and report generation."""

from datetime import datetime, timezone
from unittest.mock import patch
from uuid import UUID, uuid4

import pytest
from httpx import AsyncClient

from app.models.domain import CheckResult, CheckStatus, Run, RunStatus


@pytest.mark.asyncio
class TestRunsApi:
    """Tests for run triggers, lifecycle, and report generation."""

    async def test_health_check_endpoint(self, async_client: AsyncClient):
        response = await async_client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data

    async def test_run_lifecycle_and_reports(self, async_client: AsyncClient):
        # 1. Create Target
        create_target_resp = await async_client.post(
            "/api/v1/targets",
            json={"display_name": "E-Commerce Frontend", "base_url": "https://shop.example.com"},
        )
        assert create_target_resp.status_code == 201
        target_id = create_target_resp.json()["target_id"]

        # 2. Trigger Run with mocked check runner
        async def mock_runner(target, run_id=None):
            return Run(
                run_id=run_id or uuid4(),
                target_id=UUID(target_id),
                owner_id="local-user",
                status=RunStatus.COMPLETED,
                started_at=datetime.now(timezone.utc),
                completed_at=datetime.now(timezone.utc),
                score=90.0,
                coverage=100.0,
                check_results=[
                    CheckResult(
                        check_id="tls_certificate",
                        category="tls",
                        status=CheckStatus.PASS,
                        weight=0.25,
                        started_at=datetime.now(timezone.utc),
                        duration_ms=35.0,
                        summary="TLS certificate is valid",
                        rule_version="1.0.0",
                    )
                ],
                duration_ms=150.0,
            )

        with patch("app.api.runs.run_all_checks", side_effect=mock_runner):
            trigger_resp = await async_client.post(f"/api/v1/targets/{target_id}/runs")
            assert trigger_resp.status_code == 202
            run_data = trigger_resp.json()
            assert "run_id" in run_data
            assert run_data["status"] == "completed"
            run_id = run_data["run_id"]

        # 3. Retrieve Run by ID
        get_run_resp = await async_client.get(f"/api/v1/runs/{run_id}")
        assert get_run_resp.status_code == 200
        run_record = get_run_resp.json()
        assert run_record["run_id"] == run_id
        assert run_record["score"] == 90.0
        assert len(run_record["check_results"]) == 1

        # 4. List runs for target
        target_runs_resp = await async_client.get(f"/api/v1/targets/{target_id}/runs")
        assert target_runs_resp.status_code == 200
        target_runs = target_runs_resp.json()
        assert target_runs["total"] >= 1
        assert any(r["run_id"] == run_id for r in target_runs["items"])

        # 5. Generate JSON report
        json_report_resp = await async_client.get(f"/api/v1/runs/{run_id}/report?format=json")
        assert json_report_resp.status_code == 200
        report_json = json_report_resp.json()
        assert report_json["report_type"] == "NexGuard Validation Report"
        assert report_json["summary"]["score"] == 90.0
        assert report_json["target"]["display_name"] == "E-Commerce Frontend"

        # 6. Generate HTML report
        html_report_resp = await async_client.get(f"/api/v1/runs/{run_id}/report?format=html")
        assert html_report_resp.status_code == 200
        assert "text/html" in html_report_resp.headers["content-type"]
        html_text = html_report_resp.text
        assert "NexGuard Security &amp; Reliability Report" in html_text
        assert "E-Commerce Frontend" in html_text
        assert "90.0" in html_text

    async def test_trigger_run_nonexistent_target_returns_404(self, async_client: AsyncClient):
        random_id = uuid4()
        response = await async_client.post(f"/api/v1/targets/{random_id}/runs")
        assert response.status_code == 404

    async def test_get_nonexistent_run_returns_404(self, async_client: AsyncClient):
        random_id = uuid4()
        response = await async_client.get(f"/api/v1/runs/{random_id}")
        assert response.status_code == 404

    async def test_get_report_nonexistent_run_returns_404(self, async_client: AsyncClient):
        random_id = uuid4()
        response = await async_client.get(f"/api/v1/runs/{random_id}/report?format=html")
        assert response.status_code == 404
