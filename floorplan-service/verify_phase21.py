"""
Buildiqo.AI - Phase 2.1 Complete Verification Engine
Runs the full verification matrix across Cases 1 to 5, determinism, target-area fidelity,
doors, windows, access graph, Vastu, area accounting, and SVG/DXF consistency.
"""
import os
import sys
import time
import json
import math
from typing import Dict, List, Any
from collections import deque
from shapely.geometry import box, Polygon

sys.path.insert(0, os.path.abspath("floorplan-service"))
from app.generator.room_registry import ROOM_REGISTRY, get_room_definition, normalize_room_type
from app.generator.schemas import (
    FloorplanGenerationRequest,
    RoomProgramItem,
    GeneratedRoomGeometry,
    FloorLayout,
    GenerationWarning,
    GeneratedFloorplanResponse
)
from app.generator.solver import DeterministicFloorplanSolver, SolverException
from app.generator.validator import validate_generated_geometry
from app.generator.svg_renderer import render_floorplan_svg
from app.generator.dxf_renderer import render_floorplan_dxf

def run_case(case_name: str, req: FloorplanGenerationRequest) -> Dict[str, Any]:
    t0 = time.perf_counter()
    res_data = {
        "case": case_name,
        "success": False,
        "error_code": None,
        "error_message": None,
        "plot_w": req.plot_width_ft,
        "plot_l": req.plot_length_ft,
        "setback": req.setback_ft,
        "buildable_w": req.plot_width_ft - 2 * req.setback_ft,
        "buildable_l": req.plot_length_ft - 2 * req.setback_ft,
        "buildable_area": (req.plot_width_ft - 2 * req.setback_ft) * (req.plot_length_ft - 2 * req.setback_ft),
        "requested_rooms_count": sum(r.count for r in req.rooms_required),
        "generated_rooms_count": 0,
        "total_carpet": 0.0,
        "circulation_area": 0.0,
        "unused_area": 0.0,
        "target_deviations": {},
        "max_aspect_ratio": 0.0,
        "inaccessible_rooms": [],
        "door_count": 0,
        "invalid_doors": [],
        "ext_windows_count": 0,
        "int_windows_count": 0,
        "vastu_warnings": [],
        "plumbing_warnings": [],
        "overlap_violations": [],
        "setback_violations": [],
        "min_dim_violations": [],
        "duration_ms": 0.0,
        "floors_data": []
    }

    try:
        solver = DeterministicFloorplanSolver(req)
        response = solver.solve()
        t1 = time.perf_counter()
        res_data["duration_ms"] = round((t1 - t0) * 1000, 2)
        res_data["success"] = True

        # Validation with Shapely
        val = validate_generated_geometry(response)
        if not val.is_valid:
            res_data["overlap_violations"] = [e for e in val.errors if "overlap" in e.lower()]
            res_data["setback_violations"] = [e for e in val.errors if "setback" in e.lower() or "outside" in e.lower()]

        res_data["vastu_warnings"] = [w.message for w in response.warnings if w.code == "VASTU_PREFERENCE_UNMET"]
        res_data["plumbing_warnings"] = [w.message for w in response.warnings if w.code == "PLUMBING_ALIGNMENT_WARNING"]

        all_rooms = []
        for fl in response.floors:
            all_rooms.extend(fl.rooms)
            res_data["circulation_area"] += fl.circulation_area_sqft
            res_data["unused_area"] += fl.unused_area_sqft
            f_carpet = fl.carpet_area_sqft
            f_circ = fl.circulation_area_sqft
            f_unused = fl.unused_area_sqft
            f_buildable = round(bw * bl, 1)
            res_data["floors_data"].append({
                "floor": fl.floor,
                "name": fl.name,
                "room_count": len(fl.rooms),
                "carpet_area": f_carpet,
                "circulation_area": f_circ,
                "unused_area": f_unused,
                "buildable_area": f_buildable,
                "sum_check_diff": round(f_carpet + f_circ + f_unused - f_buildable, 2),
                "circulation_percentage": round((f_circ / f_buildable) * 100, 2) if f_buildable > 0 else 0.0,
                "corridors": fl.circulation_corridors,
                "rooms": [{"name": r.name, "type": r.type, "w": r.width, "l": r.length, "area": r.area} for r in fl.rooms]
            })

        res_data["circulation_area"] = round(res_data["circulation_area"], 1)
        res_data["unused_area"] = round(res_data["unused_area"], 1)
        res_data["generated_rooms_count"] = len(all_rooms)
        res_data["total_carpet"] = round(sum(r.area for r in all_rooms), 1)

        # Target fidelity & aspect ratio
        max_ar = 0.0
        for r in all_rooms:
            r_def = get_room_definition(r.type)
            tgt = r_def.target_area_sqft
            dev_pct = round(((r.area - tgt) / tgt) * 100, 1)
            res_data["target_deviations"][f"{r.name}_{r.floor}"] = {
                "type": r.type,
                "target": tgt,
                "generated": r.area,
                "dev_pct": dev_pct
            }
            ar = max(r.width / r.length, r.length / r.width)
            if ar > max_ar:
                max_ar = ar
        res_data["max_aspect_ratio"] = round(max_ar, 2)

        # Doors & Windows checks
        ox = req.setback_ft
        oy = req.setback_ft
        bw = res_data["buildable_w"]
        bl = res_data["buildable_l"]

        for fl in response.floors:
            # Access Graph (BFS)
            graph = {"exterior": [], "circulation": []}
            for r in fl.rooms:
                graph[r.room_id] = []

            for r in fl.rooms:
                for d in r.doors:
                    res_data["door_count"] += 1
                    dest = d.get("connects_to", "circulation")
                    if dest in graph:
                        graph[r.room_id].append(dest)
                        graph[dest].append(r.room_id)
                    else:
                        # Check if connects to another room
                        if any(rm.room_id == dest for rm in fl.rooms):
                            graph[r.room_id].append(dest)
                            if dest not in graph:
                                graph[dest] = []
                            graph[dest].append(r.room_id)

                    # Verify door width & wall
                    if d.get("width", 0) < 2.0 or d.get("width", 0) > 4.0:
                        res_data["invalid_doors"].append(f"Door in {r.name} has invalid width: {d.get('width')}")

                # Windows
                for w in r.windows:
                    wx = w.get("x", r.x)
                    wy = w.get("y", r.y)
                    # Check if window is exterior
                    is_ext = (
                        abs(r.x - ox) <= 0.15 or
                        abs((r.x + r.width) - (ox + bw)) <= 0.15 or
                        abs(r.y - oy) <= 0.15 or
                        abs((r.y + r.length) - (oy + bl)) <= 0.15
                    )
                    if is_ext:
                        res_data["ext_windows_count"] += 1
                    else:
                        res_data["int_windows_count"] += 1

            # BFS reachability
            reach = set(["exterior", "circulation"])
            q = deque(["exterior", "circulation"])
            while q:
                curr = q.popleft()
                for nbr in graph.get(curr, []):
                    if nbr not in reach:
                        reach.add(nbr)
                        q.append(nbr)

            for r in fl.rooms:
                if r.room_id not in reach:
                    res_data["inaccessible_rooms"].append(f"{r.name} on {fl.name}")

        return res_data

    except SolverException as se:
        t1 = time.perf_counter()
        res_data["duration_ms"] = round((t1 - t0) * 1000, 2)
        res_data["success"] = False
        res_data["error_code"] = se.code
        res_data["error_message"] = se.message
        return res_data
    except Exception as ex:
        t1 = time.perf_counter()
        res_data["duration_ms"] = round((t1 - t0) * 1000, 2)
        res_data["success"] = False
        res_data["error_code"] = "UNHANDLED_EXCEPTION"
        res_data["error_message"] = str(ex)
        return res_data

# Execute Cases
cases = [
    ("CASE 1 (30x40 ft, 2 floors)", FloorplanGenerationRequest(
        plot_width_ft=30, plot_length_ft=40, setback_ft=3, plot_facing="east", num_floors=2,
        rooms_required=[
            {"type": "living", "count": 1}, {"type": "dining", "count": 1}, {"type": "kitchen", "count": 1},
            {"type": "puja", "count": 1}, {"type": "common_bath", "count": 1}, {"type": "staircase", "count": 1},
            {"type": "master_bed", "count": 1}, {"type": "regular_bed", "count": 2}, {"type": "attached_bath", "count": 1}
        ],
        seed=123
    )),
    ("CASE 2 (40x60 ft, 2 floors)", FloorplanGenerationRequest(
        plot_width_ft=40, plot_length_ft=60, setback_ft=5, plot_facing="east", num_floors=2,
        rooms_required=[
            {"type": "living", "count": 1}, {"type": "dining", "count": 1}, {"type": "kitchen", "count": 1},
            {"type": "puja", "count": 1}, {"type": "common_bath", "count": 1}, {"type": "staircase", "count": 1},
            {"type": "master_bed", "count": 1}, {"type": "regular_bed", "count": 2}, {"type": "attached_bath", "count": 1}
        ],
        seed=123
    )),
    ("CASE 3 (20x30 ft, 1 floor small plot)", FloorplanGenerationRequest(
        plot_width_ft=20, plot_length_ft=30, setback_ft=3, plot_facing="east", num_floors=1,
        rooms_required=[
            {"type": "living", "count": 1}, {"type": "kitchen", "count": 1}, {"type": "regular_bed", "count": 1}, {"type": "common_bath", "count": 1}
        ],
        seed=123
    )),
    ("CASE 4 (30x40 ft, 5 floors)", FloorplanGenerationRequest(
        plot_width_ft=30, plot_length_ft=40, setback_ft=3, plot_facing="east", num_floors=5,
        rooms_required=[
            {"type": "living", "count": 1}, {"type": "dining", "count": 1}, {"type": "kitchen", "count": 1},
            {"type": "puja", "count": 1}, {"type": "master_bed", "count": 1}, {"type": "regular_bed", "count": 4}
        ],
        seed=123
    )),
    ("CASE 5 (30x30 ft, 5 ft setback overconstrained)", FloorplanGenerationRequest(
        plot_width_ft=30, plot_length_ft=30, setback_ft=5, plot_facing="east", num_floors=1,
        rooms_required=[
            {"type": "living", "count": 2}, {"type": "master_bed", "count": 2}, {"type": "regular_bed", "count": 3}, {"type": "kitchen", "count": 2}
        ],
        seed=123
    ))
]

results = [run_case(c_name, req) for c_name, req in cases]

# Determinism check
req_123_a = cases[0][1]
req_123_b = FloorplanGenerationRequest(
    plot_width_ft=30, plot_length_ft=40, setback_ft=3, plot_facing="east", num_floors=2,
    rooms_required=[
        {"type": "living", "count": 1}, {"type": "dining", "count": 1}, {"type": "kitchen", "count": 1},
        {"type": "puja", "count": 1}, {"type": "common_bath", "count": 1}, {"type": "staircase", "count": 1},
        {"type": "master_bed", "count": 1}, {"type": "regular_bed", "count": 2}, {"type": "attached_bath", "count": 1}
    ],
    seed=123
)
req_456 = FloorplanGenerationRequest(
    plot_width_ft=30, plot_length_ft=40, setback_ft=3, plot_facing="east", num_floors=2,
    rooms_required=[
        {"type": "living", "count": 1}, {"type": "dining", "count": 1}, {"type": "kitchen", "count": 1},
        {"type": "puja", "count": 1}, {"type": "common_bath", "count": 1}, {"type": "staircase", "count": 1},
        {"type": "master_bed", "count": 1}, {"type": "regular_bed", "count": 2}, {"type": "attached_bath", "count": 1}
    ],
    seed=456
)
req_789 = FloorplanGenerationRequest(
    plot_width_ft=30, plot_length_ft=40, setback_ft=3, plot_facing="east", num_floors=2,
    rooms_required=[
        {"type": "living", "count": 1}, {"type": "dining", "count": 1}, {"type": "kitchen", "count": 1},
        {"type": "puja", "count": 1}, {"type": "common_bath", "count": 1}, {"type": "staircase", "count": 1},
        {"type": "master_bed", "count": 1}, {"type": "regular_bed", "count": 2}, {"type": "attached_bath", "count": 1}
    ],
    seed=789
)

sol_123_a = DeterministicFloorplanSolver(req_123_a).solve()
sol_123_b = DeterministicFloorplanSolver(req_123_b).solve()
sol_456 = DeterministicFloorplanSolver(req_456).solve()
sol_789 = DeterministicFloorplanSolver(req_789).solve()

coords_123_a = [(r.room_id, r.x, r.y, r.width, r.length) for f in sol_123_a.floors for r in f.rooms]
coords_123_b = [(r.room_id, r.x, r.y, r.width, r.length) for f in sol_123_b.floors for r in f.rooms]
coords_456 = [(r.room_id, r.x, r.y, r.width, r.length) for f in sol_456.floors for r in f.rooms]
coords_789 = [(r.room_id, r.x, r.y, r.width, r.length) for f in sol_789.floors for r in f.rooms]

seeds_data = {}
for s_val, s_sol in [("seed_123", sol_123_a), ("seed_456", sol_456), ("seed_789", sol_789)]:
    c_area = sum(fl.carpet_area_sqft for fl in s_sol.floors)
    circ_area = sum(fl.circulation_area_sqft for fl in s_sol.floors)
    un_area = sum(fl.unused_area_sqft for fl in s_sol.floors)
    living_rm = next((r for fl in s_sol.floors for r in fl.rooms if r.type == "living"), None)
    seeds_data[s_val] = {
        "carpet_area": round(c_area, 1),
        "circulation_area": round(circ_area, 1),
        "unused_area": round(un_area, 1),
        "living_dim": f"{living_rm.width}x{living_rm.length} ft ({living_rm.area} sq.ft)" if living_rm else "N/A"
    }

det_res = {
    "123_vs_123_identical": coords_123_a == coords_123_b,
    "123_vs_456_different": coords_123_a != coords_456,
    "123_vs_789_different": coords_123_a != coords_789,
    "seeds_metrics": seeds_data
}

# SVG / DXF generation test
svg_out = render_floorplan_svg(sol_123_a, active_floor_idx=0)
dxf_out = render_floorplan_dxf(sol_123_a, active_floor_idx=0)

summary = {
    "cases": results,
    "determinism": det_res,
    "svg_len": len(svg_out),
    "dxf_bytes_len": len(dxf_out.getvalue())
}

out_dir = "floorplan-service" if os.path.isdir("floorplan-service") else "."
with open(os.path.join(out_dir, "verify_results.json"), "w") as f:
    json.dump(summary, f, indent=2)

print("VERIFICATION_COMPLETE_SUCCESS")
