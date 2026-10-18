"""Integration tests for Target API endpoints."""

from uuid import uuid4
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestTargetsApi:
    """Tests for /api/v1/targets routes."""

    async def test_create_valid_target(self, async_client: AsyncClient):
        payload = {
            "display_name": "Production Core API",
            "base_url": "https://api.example.com",
            "environment": "prod",
            "expected_version_marker": "release-v1",
        }

        response = await async_client.post("/api/v1/targets", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["display_name"] == "Production Core API"
        assert data["base_url"] == "https://api.example.com"
        assert data["expected_host"] == "api.example.com"
        assert "target_id" in data

    async def test_create_target_rejects_insecure_http(self, async_client: AsyncClient):
        payload = {
            "display_name": "Insecure HTTP Site",
            "base_url": "http://api.example.com",
        }

        response = await async_client.post("/api/v1/targets", json=payload)
        assert response.status_code == 422

    async def test_create_target_rejects_localhost_and_ip_literals(self, async_client: AsyncClient):
        # Localhost
        resp1 = await async_client.post(
            "/api/v1/targets",
            json={"display_name": "Localhost", "base_url": "https://localhost:8000"},
        )
        assert resp1.status_code in (400, 422)

        # IP literal
        resp2 = await async_client.post(
            "/api/v1/targets",
            json={"display_name": "Raw IP", "base_url": "https://127.0.0.1"},
        )
        assert resp2.status_code in (400, 422)

    async def test_list_and_get_target(self, async_client: AsyncClient):
        # Create target
        create_resp = await async_client.post(
            "/api/v1/targets",
            json={"display_name": "Payment Service", "base_url": "https://pay.example.com"},
        )
        assert create_resp.status_code == 201
        target_id = create_resp.json()["target_id"]

        # List targets
        list_resp = await async_client.get("/api/v1/targets")
        assert list_resp.status_code == 200
        list_data = list_resp.json()
        assert list_data["total"] >= 1
        assert any(t["target_id"] == target_id for t in list_data["items"])

        # Get single target
        get_resp = await async_client.get(f"/api/v1/targets/{target_id}")
        assert get_resp.status_code == 200
        assert get_resp.json()["target_id"] == target_id

    async def test_soft_delete_target(self, async_client: AsyncClient):
        create_resp = await async_client.post(
            "/api/v1/targets",
            json={"display_name": "Ephemeral Service", "base_url": "https://temp.example.com"},
        )
        target_id = create_resp.json()["target_id"]

        # Delete
        del_resp = await async_client.delete(f"/api/v1/targets/{target_id}")
        assert del_resp.status_code == 204

        # Verify 404 after deletion
        get_resp = await async_client.get(f"/api/v1/targets/{target_id}")
        assert get_resp.status_code == 404

    async def test_get_nonexistent_target_returns_404(self, async_client: AsyncClient):
        random_id = uuid4()
        response = await async_client.get(f"/api/v1/targets/{random_id}")
        assert response.status_code == 404
