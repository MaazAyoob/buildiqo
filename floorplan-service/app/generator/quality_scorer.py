"""
Buildiqo.AI - Phase 3 Architectural Quality Scorer
Calculates a comprehensive 100-point composite score based on architectural principles:
- Room target fidelity: 15
- Room proportions: 10
- Furniture feasibility: 15
- Room relationships: 15
- Circulation efficiency: 10
- Accessibility: 10
- Privacy separation: 5
- Door quality: 5
- Window quality: 5
- Kitchen usability: 5
- Bathroom usability: 5
- Vastu preference: 5
"""
from typing import List, Dict, Any, Tuple
from .room_registry import get_room_definition
from .relationship_graph import evaluate_relationship_graph
from .furniture_solver import verify_furniture_feasibility

def compute_architectural_quality_score(
    rooms: List[Any],
    plot_w: float,
    plot_l: float,
    circ_area: float,
    buildable_area: float,
    vastu_enabled: bool = True
) -> Dict[str, Any]:
    """
    Computes the 100-point composite architectural quality score and detailed breakdown.
    """
    breakdown = {
        "target_fidelity": 15.0,
        "proportions": 10.0,
        "furniture_feasibility": 15.0,
        "room_relationships": 15.0,
        "circulation": 10.0,
        "accessibility": 10.0,
        "privacy": 5.0,
        "door_quality": 5.0,
        "window_quality": 5.0,
        "kitchen_usability": 5.0,
        "bathroom_usability": 5.0,
        "vastu_preference": 5.0
    }

    warnings: List[str] = []

    # 0. HARD GATE: Minimum-dimension correctness check
    # Any room that violates its registry minimum width gets a large score penalty.
    # This ensures the quality score cannot reward architecturally impossible plans.
    hard_gate_pen = 0.0
    critical_violations: List[str] = []
    for r in rooms:
        r_def = get_room_definition(r.type)
        min_dim = min(r_def.min_width_ft, r_def.min_length_ft)
        actual_min = min(r.width, r.length)
        if actual_min < (min_dim - 0.2) and r.type in ["master_bed", "regular_bed", "living", "dining", "kitchen"]:
            shortfall = min_dim - actual_min
            # 5 pts penalty per foot below minimum, max 30 pts total per violation
            hard_gate_pen += min(30.0, shortfall * 5.0)
            critical_violations.append(
                f"{r.name} width {actual_min:.1f} ft is {shortfall:.1f} ft below minimum {min_dim:.1f} ft"
            )
    if hard_gate_pen > 0:
        warnings.extend(critical_violations[:3])

    # 1. Target Area Fidelity (15 pts)
    tot_dev = 0.0
    for r in rooms:
        r_def = get_room_definition(r.type)
        if r.type != "staircase":
            dev = abs(r.area - r_def.target_area_sqft) / max(1.0, r_def.target_area_sqft)
            tot_dev += dev
    avg_dev = tot_dev / max(1, len([r for r in rooms if r.type != "staircase"]))
    # Up to 25% deviation is acceptable; penalize beyond
    if avg_dev > 0.15:
        pen = min(10.0, (avg_dev - 0.15) * 25.0)
        breakdown["target_fidelity"] = max(5.0, round(15.0 - pen, 1))

    # 2. Room Proportions & Aspect Ratios (10 pts)
    prop_pen = 0.0
    for r in rooms:
        aspect = max(r.width, r.length) / max(0.1, min(r.width, r.length))
        r_def = get_room_definition(r.type)
        if aspect > r_def.max_aspect_ratio:
            prop_pen += 2.5
            warnings.append(f"{r.name} aspect ratio ({aspect:.2f}) exceeds recommended maximum ({r_def.max_aspect_ratio:.2f})")
        elif aspect > (r_def.preferred_aspect_ratio + 0.35):
            prop_pen += 1.0
    breakdown["proportions"] = max(3.0, round(10.0 - min(7.0, prop_pen), 1))

    # 3. Furniture Feasibility (15 pts)
    fit_ratios = []
    for r in rooms:
        fits, ratio = verify_furniture_feasibility(r.type, r.width, r.length)
        fit_ratios.append(ratio)
        if not fits and r.type in ["master_bed", "regular_bed", "living", "dining"]:
            warnings.append(f"{r.name} cannot fully accommodate standard furniture module with clearances")
    avg_fit = sum(fit_ratios) / max(1, len(fit_ratios))
    breakdown["furniture_feasibility"] = max(4.0, round(15.0 * avg_fit, 1))

    # 4. Room Relationship Graph (15 pts)
    rel_eval = evaluate_relationship_graph(rooms, plot_w, plot_l)
    breakdown["room_relationships"] = rel_eval["score"]
    warnings.extend(rel_eval["penalties"])

    # 5. Circulation Efficiency (10 pts)
    # Circulation should be 8% to 18% of buildable area
    circ_pct = (circ_area / max(1.0, buildable_area)) * 100.0
    if 7.0 <= circ_pct <= 20.0:
        breakdown["circulation"] = 10.0
    elif circ_pct < 7.0:
        # Too little circulation might imply cramped transitions
        breakdown["circulation"] = 8.0
    else:
        # Wasteful circulation
        pen = min(5.0, (circ_pct - 20.0) * 0.5)
        breakdown["circulation"] = max(5.0, round(10.0 - pen, 1))

    # 6. Accessibility & Doors (10 pts accessibility + 5 pts door quality)
    has_doors = all(len(getattr(r, "doors", [])) > 0 for r in rooms)
    if has_doors:
        breakdown["accessibility"] = 10.0
        breakdown["door_quality"] = 5.0
    else:
        breakdown["accessibility"] = 6.0
        breakdown["door_quality"] = 3.0
        warnings.append("One or more rooms lack accessible door openings")

    # 7. Window Quality & Exterior Fenestration (5 pts)
    # Geometrically verifies that claimed exterior windows actually lie on the envelope perimeter
    habitable_with_ext_windows = True
    min_x = min(r.x for r in rooms) if rooms else 0.0
    max_x = max(r.x + r.width for r in rooms) if rooms else plot_w
    min_y = min(r.y for r in rooms) if rooms else 0.0
    max_y = max(r.y + r.length for r in rooms) if rooms else plot_l

    for r in rooms:
        r_def = get_room_definition(r.type)
        if r_def.is_habitable:
            has_geo_ext = False
            for w in getattr(r, "windows", []):
                wall = w.get("wall", "")
                if wall == "left" and abs(r.x - min_x) < 0.3:
                    has_geo_ext = True
                elif wall == "right" and abs((r.x + r.width) - max_x) < 0.3:
                    has_geo_ext = True
                elif wall == "bottom" and abs(r.y - min_y) < 0.3:
                    has_geo_ext = True
                elif wall == "top" and abs((r.y + r.length) - max_y) < 0.3:
                    has_geo_ext = True
                elif w.get("is_exterior", False):
                    # Check if any room edge touches perimeter
                    if (abs(r.x - min_x) < 0.3 or abs((r.x + r.width) - max_x) < 0.3 or
                        abs(r.y - min_y) < 0.3 or abs((r.y + r.length) - max_y) < 0.3):
                        has_geo_ext = True
            if not has_geo_ext:
                habitable_with_ext_windows = False
                warnings.append(f"Habitable room {r.name} lacks an exterior ventilation window")
    breakdown["window_quality"] = 5.0 if habitable_with_ext_windows else 2.5

    # 8. Kitchen Usability (5 pts)
    kitchens = [r for r in rooms if r.type == "kitchen"]
    if kitchens:
        k = kitchens[0]
        if k.width >= 8.0 and k.length >= 9.0 and k.area >= 75.0:
            breakdown["kitchen_usability"] = 5.0
        else:
            breakdown["kitchen_usability"] = 3.5
    else:
        breakdown["kitchen_usability"] = 5.0

    # 9. Bathroom Usability (5 pts)
    baths = [r for r in rooms if "bath" in r.type]
    bath_ok = all(b.width >= 4.5 and b.length >= 5.5 for b in baths)
    breakdown["bathroom_usability"] = 5.0 if bath_ok else 3.5

    # 10. Privacy (5 pts)
    breakdown["privacy"] = 5.0 if rel_eval["score"] >= 11.0 else 3.5

    # 11. Vastu Preference (5 pts)
    if vastu_enabled:
        vastu_score = 0.0
        vastu_checks = 0
        for r in rooms:
            r_def = get_room_definition(r.type)
            zone = getattr(r, "compass_zone", "")
            if zone:
                vastu_checks += 1
                if zone == r_def.vastu_preferred_zone:
                    vastu_score += 1.0
                elif zone in ["N", "E", "NE", "NW"]:
                    vastu_score += 0.7
                else:
                    vastu_score += 0.4
        vastu_ratio = vastu_score / max(1, vastu_checks)
        breakdown["vastu_preference"] = max(2.5, round(5.0 * vastu_ratio, 1))
    else:
        breakdown["vastu_preference"] = 5.0

    total_score = round(sum(breakdown.values()), 1)
    total_score = max(30.0, min(100.0, total_score))
    # Apply hard-gate penalty AFTER summing — guaranteed to suppress broken plans
    total_score = max(20.0, round(total_score - hard_gate_pen, 1))

    return {
        "total_score": total_score,
        "breakdown": breakdown,
        "warnings": warnings[:8]
    }
