"""
Buildiqo.AI - Phase 2.0 AI Floor Plan Generator Test Suite
Tests solver determinism, spatial invariants, Shapely validation,
Vastu preferences, multi-floor generation, SVG rendering, and DXF export.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.generator import (
    FloorplanGenerationRequest,
    DeterministicFloorplanSolver,
    SolverException,
    validate_generated_geometry,
    render_floorplan_svg,
    render_floorplan_dxf,
    normalize_room_type,
    ROOM_REGISTRY
)

client = TestClient(app)

def test_room_type_normalization():
    """Verifies that common natural language room names map to canonical types."""
    assert normalize_room_type("hall") == "living"
    assert normalize_room_type("living room") == "living"
    assert normalize_room_type("master bedroom") == "master_bed"
    assert normalize_room_type("guest bed") == "regular_bed"
    assert normalize_room_type("washroom") == "common_bath"
    assert normalize_room_type("pooja room") == "puja"
    assert normalize_room_type("prayer room") == "puja"

def test_solver_determinism():
    """Identical input and identical seed must produce identical room geometry."""
    req_a = FloorplanGenerationRequest(
        plot_width_ft=30.0,
        plot_length_ft=40.0,
        plot_facing="north",
        num_floors=1,
        setback_ft=3.0,
        rooms_required=[
            {"type": "living", "count": 1},
            {"type": "kitchen", "count": 1},
            {"type": "master_bed", "count": 1},
            {"type": "attached_bath", "count": 1}
        ],
        seed=12345
    )

    req_b = FloorplanGenerationRequest(
        plot_width_ft=30.0,
        plot_length_ft=40.0,
        plot_facing="north",
        num_floors=1,
        setback_ft=3.0,
        rooms_required=[
            {"type": "living", "count": 1},
            {"type": "kitchen", "count": 1},
            {"type": "master_bed", "count": 1},
            {"type": "attached_bath", "count": 1}
        ],
        seed=12345
    )

    solver_a = DeterministicFloorplanSolver(req_a)
    layout_a = solver_a.solve()

    solver_b = DeterministicFloorplanSolver(req_b)
    layout_b = solver_b.solve()

    rooms_a = layout_a.floors[0].rooms
    rooms_b = layout_b.floors[0].rooms

    assert len(rooms_a) == len(rooms_b)
    for ra, rb in zip(rooms_a, rooms_b):
        assert ra.room_id == rb.room_id
        assert ra.name == rb.name
        assert ra.x == rb.x
        assert ra.y == rb.y
        assert ra.width == rb.width
        assert ra.length == rb.length
        assert ra.area == rb.area
        assert ra.confidence == "generated"

def test_geometry_invariants():
    """All rooms must be inside buildable boundary, positive area, and non-overlapping."""
    req = FloorplanGenerationRequest(
        plot_width_ft=30.0,
        plot_length_ft=50.0,
        plot_facing="east",
        num_floors=1,
        setback_ft=3.0,
        rooms_required=[
            {"type": "living", "count": 1},
            {"type": "kitchen", "count": 1},
            {"type": "regular_bed", "count": 2},
            {"type": "common_bath", "count": 1}
        ],
        seed=42
    )

    solver = DeterministicFloorplanSolver(req)
    response = solver.solve()

    validation = validate_generated_geometry(response)
    assert validation.is_valid is True, f"Validation errors: {validation.errors}"

    floor = response.floors[0]
    setback = req.setback_ft
    buildable_max_x = req.plot_width_ft - setback
    buildable_max_y = req.plot_length_ft - setback

    for r in floor.rooms:
        assert r.confidence == "generated"
        assert r.area > 0
        assert r.width >= 4.0
        assert r.length >= 4.0
        assert r.x >= setback - 0.05
        assert r.y >= setback - 0.05
        assert r.x + r.width <= buildable_max_x + 0.05
        assert r.y + r.length <= buildable_max_y + 0.05

def test_seed_regeneration_variation():
    """Different seeds should generate valid alternative arrangements."""
    req_1 = FloorplanGenerationRequest(
        plot_width_ft=40.0,
        plot_length_ft=60.0,
        num_floors=1,
        setback_ft=4.0,
        rooms_required=[
            {"type": "living", "count": 1},
            {"type": "kitchen", "count": 1},
            {"type": "regular_bed", "count": 2},
            {"type": "attached_bath", "count": 1}
        ],
        seed=101
    )
    req_2 = FloorplanGenerationRequest(
        plot_width_ft=40.0,
        plot_length_ft=60.0,
        num_floors=1,
        setback_ft=4.0,
        rooms_required=[
            {"type": "living", "count": 1},
            {"type": "kitchen", "count": 1},
            {"type": "regular_bed", "count": 2},
            {"type": "attached_bath", "count": 1}
        ],
        seed=999
    )

    sol_1 = DeterministicFloorplanSolver(req_1).solve()
    sol_2 = DeterministicFloorplanSolver(req_2).solve()

    val_1 = validate_generated_geometry(sol_1)
    val_2 = validate_generated_geometry(sol_2)

    assert val_1.is_valid is True
    assert val_2.is_valid is True

def test_multi_floor_distribution():
    """Multi-floor requests distribute rooms logically between ground and upper floors."""
    req = FloorplanGenerationRequest(
        plot_width_ft=30.0,
        plot_length_ft=40.0,
        plot_facing="north",
        num_floors=2,
        setback_ft=3.0,
        rooms_required=[
            {"type": "living", "count": 1},
            {"type": "kitchen", "count": 1},
            {"type": "master_bed", "count": 1},
            {"type": "regular_bed", "count": 2},
            {"type": "common_bath", "count": 1},
            {"type": "attached_bath", "count": 1}
        ],
        seed=777
    )

    solver = DeterministicFloorplanSolver(req)
    response = solver.solve()

    assert len(response.floors) == 2
    ground_rooms = [r.type for r in response.floors[0].rooms]
    upper_rooms = [r.type for r in response.floors[1].rooms]

    assert "living" in ground_rooms or "kitchen" in ground_rooms
    assert "master_bed" in upper_rooms or "regular_bed" in upper_rooms

    val = validate_generated_geometry(response)
    assert val.is_valid is True

def test_solver_failure_on_impossible_plot():
    """When requested rooms cannot fit inside buildable area, solver raises controlled SolverException."""
    req = FloorplanGenerationRequest(
        plot_width_ft=12.0,
        plot_length_ft=12.0,
        setback_ft=5.0,  # leaves only 2x2 ft buildable area
        rooms_required=[{"type": "living", "count": 1}],
        seed=1
    )

    solver = DeterministicFloorplanSolver(req)
    with pytest.raises(SolverException) as exc_info:
        solver.solve()
    assert exc_info.value.code == "LIMITED_BUILDABLE_AREA"

def test_svg_rendering():
    """SVG renderer produces valid XML with plot boundary, room labels, dimensions, and area."""
    req = FloorplanGenerationRequest(
        plot_width_ft=30.0,
        plot_length_ft=40.0,
        setback_ft=3.0,
        rooms_required=[
            {"type": "living", "count": 1},
            {"type": "kitchen", "count": 1}
        ],
        seed=42
    )
    solver = DeterministicFloorplanSolver(req)
    response = solver.solve()
    svg_str = render_floorplan_svg(response, active_floor_idx=0)

    assert svg_str.startswith("<svg")
    assert svg_str.endswith("</svg>")
    assert 'id="plot_boundary"' in svg_str
    assert 'id="setback_boundary"' in svg_str
    assert 'id="compass"' in svg_str
    assert "LIVING ROOM" in svg_str
    assert "SQ.FT" in svg_str

def test_dxf_rendering():
    """DXF renderer produces non-empty AutoCAD DXF stream with correct layers."""
    req = FloorplanGenerationRequest(
        plot_width_ft=30.0,
        plot_length_ft=40.0,
        setback_ft=3.0,
        rooms_required=[
            {"type": "living", "count": 1},
            {"type": "kitchen", "count": 1}
        ],
        seed=42
    )
    solver = DeterministicFloorplanSolver(req)
    response = solver.solve()
    dxf_stream = render_floorplan_dxf(response, active_floor_idx=0)

    dxf_bytes = dxf_stream.getvalue()
    assert len(dxf_bytes) > 500
    assert b"SECTION" in dxf_bytes
    assert b"ROOM_WALLS" in dxf_bytes
    assert b"PLOT_BOUNDARY" in dxf_bytes

import os

def get_auth_headers():
    token = os.environ.get("FLOORPLAN_SERVICE_TOKEN")
    return {"X-Floorplan-Service-Token": token} if token else {}

def test_fastapi_generate_layout_endpoint():
    """POST /generate-layout returns HTTP 200 with structured response and SVG."""
    payload = {
        "plot_width_ft": 30.0,
        "plot_length_ft": 40.0,
        "plot_facing": "north",
        "num_floors": 1,
        "setback_ft": 3.0,
        "rooms_required": [
            {"type": "living", "count": 1},
            {"type": "kitchen", "count": 1},
            {"type": "regular_bed", "count": 1},
            {"type": "common_bath", "count": 1}
        ],
        "vastu_compliant": True,
        "seed": 42
    }

    res = client.post("/generate-layout", headers=get_auth_headers(), json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["success"] is True
    assert "generation_id" in data
    assert len(data["floors"]) == 1
    assert data["svg"].startswith("<svg")
    assert data["dxf_available"] is True

    room_confidences = [r["confidence"] for r in data["floors"][0]["rooms"]]
    assert all(c == "generated" for c in room_confidences)

def test_fastapi_export_dxf_endpoint():
    """POST /export/dxf returns DXF file attachment."""
    payload = {
        "plot_width_ft": 30.0,
        "plot_length_ft": 40.0,
        "num_floors": 1,
        "setback_ft": 3.0,
        "rooms_required": [
            {"type": "living", "count": 1},
            {"type": "kitchen", "count": 1}
        ],
        "seed": 42
    }
    gen_res = client.post("/generate-layout", headers=get_auth_headers(), json=payload)
    assert gen_res.status_code == 200

    dxf_res = client.post("/export/dxf?floor=0", headers=get_auth_headers(), json=gen_res.json())
    assert dxf_res.status_code == 200
    assert dxf_res.headers["content-type"] == "application/dxf"
    assert b"ROOM_WALLS" in dxf_res.content

def test_generator_token_security(monkeypatch):
    """Verifies service token authentication on generator endpoints."""
    test_secret = "test_ai_generator_token_xyz"
    monkeypatch.setenv("FLOORPLAN_SERVICE_TOKEN", test_secret)

    payload = {
        "plot_width_ft": 30.0,
        "plot_length_ft": 40.0,
        "num_floors": 1,
        "setback_ft": 3.0,
        "rooms_required": [{"type": "living", "count": 1}],
        "seed": 42
    }

    # 1. No token -> 401
    res_no_token = client.post("/generate-layout", json=payload)
    assert res_no_token.status_code == 401

    # 2. Bad token -> 401
    res_bad_token = client.post(
        "/generate-layout",
        headers={"X-Floorplan-Service-Token": "bad_token"},
        json=payload
    )
    assert res_bad_token.status_code == 401

    # 3. Valid token -> 200
    res_valid = client.post(
        "/generate-layout",
        headers={"X-Floorplan-Service-Token": test_secret},
        json=payload
    )
    assert res_valid.status_code == 200

def test_floor_count_limit_validation():
    """Phase 2.0 specification strictly enforces MAX FLOORS = 5."""
    from pydantic import ValidationError

    # 1. 5 floors -> accepted
    req_5 = FloorplanGenerationRequest(
        plot_width_ft=40.0,
        plot_length_ft=50.0,
        num_floors=5,
        rooms_required=[{"type": "living", "count": 1}]
    )
    assert req_5.num_floors == 5
    solver_5 = DeterministicFloorplanSolver(req_5)
    assert solver_5.req.num_floors == 5

    # 2. 6 floors -> rejected by schema
    with pytest.raises(ValidationError):
        FloorplanGenerationRequest(
            plot_width_ft=40.0,
            plot_length_ft=50.0,
            num_floors=6,
            rooms_required=[{"type": "living", "count": 1}]
        )

    # 3. 10 floors -> rejected by schema
    with pytest.raises(ValidationError):
        FloorplanGenerationRequest(
            plot_width_ft=40.0,
            plot_length_ft=50.0,
            num_floors=10,
            rooms_required=[{"type": "living", "count": 1}]
        )

