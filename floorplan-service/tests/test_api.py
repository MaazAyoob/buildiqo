import os
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")
SAMPLE_DXF_PATH = os.path.join(FIXTURES_DIR, "sample_floorplan.dxf")

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "buildiqo-floorplan-service"

def test_extract_invalid_extension():
    response = client.post(
        "/extract/dxf",
        files={"file": ("test.png", b"\x89PNG\r\n\x1a\n", "image/png")}
    )
    assert response.status_code == 400
    assert "Only AutoCAD .dxf and .dwg files are supported" in response.json()["detail"]

def test_extract_empty_file():
    response = client.post(
        "/extract/dxf",
        files={"file": ("empty.dxf", b"", "application/dxf")}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

def test_extract_valid_dxf():
    with open(SAMPLE_DXF_PATH, "rb") as f:
        response = client.post(
            "/extract/dxf",
            files={"file": ("sample.dxf", f, "application/octet-stream")}
        )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["source"]["file_type"] == "DXF"
    assert data["source"]["units"] == "feet"
    assert len(data["rooms"]) == 4
    assert data["total_usable_carpet_sqft"] == 604.0

def test_service_token_security(monkeypatch):
    test_secret = "test_super_secret_service_token_2026"
    monkeypatch.setenv("FLOORPLAN_SERVICE_TOKEN", test_secret)

    # 1. Without token -> 401
    with open(SAMPLE_DXF_PATH, "rb") as f:
        res_no_token = client.post(
            "/extract/dxf",
            files={"file": ("sample.dxf", f, "application/octet-stream")}
        )
    assert res_no_token.status_code == 401
    assert "Invalid or missing service token" in res_no_token.json()["detail"]

    # 2. With invalid token -> 401
    with open(SAMPLE_DXF_PATH, "rb") as f:
        res_bad_token = client.post(
            "/extract/dxf",
            headers={"X-Floorplan-Service-Token": "wrong_token"},
            files={"file": ("sample.dxf", f, "application/octet-stream")}
        )
    assert res_bad_token.status_code == 401

    # 3. With valid token -> 200
    with open(SAMPLE_DXF_PATH, "rb") as f:
        res_valid = client.post(
            "/extract/dxf",
            headers={"X-Floorplan-Service-Token": test_secret},
            files={"file": ("sample.dxf", f, "application/octet-stream")}
        )
    assert res_valid.status_code == 200
    assert res_valid.json()["success"] is True
