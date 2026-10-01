"""
Phase 3.1 Correctness Repair Verification
Tests Cases A-E from the Phase 3 audit and validates all critical geometry invariants.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.generator.schemas import FloorplanGenerationRequest, RoomProgramItem
from app.generator.solver import DeterministicFloorplanSolver
from app.generator.room_registry import get_room_definition

def make_request(plot_w, plot_l, beds, setback, floors, facing="East", vastu=True):
    rooms = [
        RoomProgramItem(room_id="living_1", type="living", display_name="Living Room", count=1,
                        target_area_sqft=180, preferred_floor=0, adjacency=[], compass_zone="NE", priority="high"),
        RoomProgramItem(room_id="dining_1", type="dining", display_name="Dining", count=1,
                        target_area_sqft=120, preferred_floor=0, adjacency=[], compass_zone="E", priority="medium"),
        RoomProgramItem(room_id="kitchen_1", type="kitchen", display_name="Kitchen", count=1,
                        target_area_sqft=95, preferred_floor=0, adjacency=[], compass_zone="SE", priority="high"),
        RoomProgramItem(room_id="master_1", type="master_bed", display_name="Master Bed", count=1,
                        target_area_sqft=165, preferred_floor=0 if floors==1 else 1, adjacency=[], compass_zone="SW", priority="high"),
        RoomProgramItem(room_id="attached_1", type="attached_bath", display_name="Attached Bath", count=1,
                        target_area_sqft=42, preferred_floor=0 if floors==1 else 1, adjacency=[], compass_zone="NW", priority="medium"),
        RoomProgramItem(room_id="common_1", type="common_bath", display_name="Common Bath", count=1,
                        target_area_sqft=42, preferred_floor=0, adjacency=[], compass_zone="NW", priority="medium"),
    ]
    # Add regular bedrooms
    for i in range(beds - 1):
        rooms.append(RoomProgramItem(
            room_id=f"bed_{i+1}", type="regular_bed", display_name=f"Bedroom {i+2}", count=1,
            target_area_sqft=130, preferred_floor=0 if floors==1 else 1, adjacency=[], compass_zone="NW", priority="medium"
        ))
    return FloorplanGenerationRequest(
        plot_width_ft=plot_w, plot_length_ft=plot_l, num_floors=floors,
        setback_ft=setback, vastu_compliant=vastu, plot_facing=facing,
        rooms_required=rooms, seed=42
    )

def check_case(label, req):
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"{'='*60}")
    solver = DeterministicFloorplanSolver(req)
    resp = solver.solve()

    all_pass = True
    total_beds = 0
    for fl in resp.floors:
        print(f"\n  Floor {fl.floor}: {fl.name}")
        for r in fl.rooms:
            rdef = get_room_definition(r.type)
            min_dim = min(rdef.min_width_ft, rdef.min_length_ft)
            actual_min = min(r.width, r.length)
            ar = max(r.width, r.length) / max(0.01, min(r.width, r.length))
            status = "✓"
            issues = []

            if actual_min < (min_dim - 0.2) and r.type not in ["staircase", "parking", "balcony", "utility", "puja"]:
                issues.append(f"MIN_WIDTH FAIL: {actual_min:.1f} < {min_dim:.1f}")
                status = "✗"
                all_pass = False
            if ar > rdef.max_aspect_ratio and r.type not in ["staircase", "balcony"]:
                issues.append(f"AR FAIL: {ar:.2f} > {rdef.max_aspect_ratio}")
                status = "✗"
                all_pass = False
            if r.type in ["master_bed", "regular_bed"]:
                total_beds += 1

            issue_str = "  ← " + " | ".join(issues) if issues else ""
            print(f"    {status} {r.name:30s} {r.width:5.1f}×{r.length:5.1f}  AR={ar:.2f}{issue_str}")

    expected_beds = req.rooms_required.count if hasattr(req.rooms_required, 'count') else sum(
        1 for r in req.rooms_required if r.type in ["master_bed", "regular_bed"]
    )
    exp = sum(1 for r in req.rooms_required if r.type in ["master_bed", "regular_bed"])
    if total_beds != exp:
        print(f"\n  ✗ BED COUNT FAIL: got {total_beds}, expected {exp}")
        all_pass = False
    else:
        print(f"\n  ✓ Bedroom count: {total_beds}/{exp}")

    q = resp.overall_quality_score
    print(f"  Quality score: {q}/100")
    if q > 70 and not all_pass:
        print(f"  ✗ QUALITY GATING FAIL: score {q} too high for broken geometry")
    elif all_pass:
        print(f"  ✓ All geometry invariants PASS")
    else:
        print(f"  ✗ GEOMETRY FAILURES DETECTED")

    return all_pass

if __name__ == "__main__":
    results = []

    # Case A: 30x40 2BHK 3ft setback East Vastu
    results.append(("A: 30×40 2BHK", check_case(
        "Case A: 30×40 2BHK, East, Vastu ON",
        make_request(30, 40, 2, 3, 1, "East", True)
    )))

    # Case B: 30x50 3BHK 3ft setback East Vastu
    results.append(("B: 30×50 3BHK", check_case(
        "Case B: 30×50 3BHK, East, Vastu ON",
        make_request(30, 50, 3, 3, 1, "East", True)
    )))

    # Case C: 40x60 4BHK 5ft setback East Vastu
    results.append(("C: 40×60 4BHK", check_case(
        "Case C: 40×60 4BHK, East, Vastu ON",
        make_request(40, 60, 4, 5, 1, "East", True)
    )))

    # Case D: 30x40 3BHK 2-floor 3ft setback East Vastu
    results.append(("D: 30×40 3BHK 2F", check_case(
        "Case D: 30×40 3BHK, 2 floors, East, Vastu ON",
        make_request(30, 40, 3, 3, 2, "East", True)
    )))

    # Case E: 30x50 4BHK 2-floor 3ft setback North Vastu OFF
    results.append(("E: 30×50 4BHK 2F", check_case(
        "Case E: 30×50 4BHK, 2 floors, North, Vastu OFF",
        make_request(30, 50, 4, 3, 2, "North", False)
    )))

    print(f"\n{'='*60}")
    print("  SUMMARY")
    print(f"{'='*60}")
    passed = sum(1 for _, p in results if p)
    for label, p in results:
        print(f"  {'PASS' if p else 'FAIL'} — {label}")
    print(f"\n  {passed}/{len(results)} cases passed")
    sys.exit(0 if passed == len(results) else 1)
