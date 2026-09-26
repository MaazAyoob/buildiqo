"""
Buildiqo.AI - Phase 3 Furniture-Aware Geometry & Symbol Generator
Generates realistic schematic vector furniture layouts and tests clearance feasibility.
"""
from typing import List, Dict, Any, Tuple

FURNITURE_TEMPLATES: Dict[str, List[Dict[str, Any]]] = {
    "living": [
        {"id": "sofa_main", "type": "sofa", "name": "3-Seater Sofa", "width": 6.8, "length": 2.8, "dx": 1.2, "dy": 1.2, "align": "wall_bottom"},
        {"id": "coffee_table", "type": "table", "name": "Coffee Table", "width": 3.2, "length": 1.8, "dx": 3.0, "dy": 4.5, "align": "center"},
        {"id": "tv_unit", "type": "media", "name": "TV Media Console", "width": 5.5, "length": 1.3, "dx": 2.0, "dy": 0.5, "align": "wall_top"}
    ],
    "dining": [
        {"id": "dining_table", "type": "table", "name": "6-Seater Dining Table", "width": 4.8, "length": 3.0, "dx": 2.5, "dy": 2.5, "align": "center"},
        {"id": "chair_1", "type": "chair", "name": "Chair", "width": 1.4, "length": 1.4, "dx": 2.8, "dy": 1.4, "align": "table_side"},
        {"id": "chair_2", "type": "chair", "name": "Chair", "width": 1.4, "length": 1.4, "dx": 4.8, "dy": 1.4, "align": "table_side"},
        {"id": "chair_3", "type": "chair", "name": "Chair", "width": 1.4, "length": 1.4, "dx": 2.8, "dy": 5.2, "align": "table_side"},
        {"id": "chair_4", "type": "chair", "name": "Chair", "width": 1.4, "length": 1.4, "dx": 4.8, "dy": 5.2, "align": "table_side"}
    ],
    "master_bed": [
        {"id": "king_bed", "type": "bed", "name": "King Bed", "width": 6.2, "length": 6.5, "dx": 2.5, "dy": 1.2, "align": "wall_bottom"},
        {"id": "side_table_l", "type": "table", "name": "Side Table", "width": 1.5, "length": 1.5, "dx": 0.8, "dy": 1.2, "align": "bed_side"},
        {"id": "side_table_r", "type": "table", "name": "Side Table", "width": 1.5, "length": 1.5, "dx": 8.9, "dy": 1.2, "align": "bed_side"},
        {"id": "wardrobe", "type": "wardrobe", "name": "Built-in Wardrobe", "width": 5.5, "length": 2.0, "dx": 1.0, "dy": 0.5, "align": "wall_side"}
    ],
    "regular_bed": [
        {"id": "queen_bed", "type": "bed", "name": "Queen Bed", "width": 5.0, "length": 6.2, "dx": 2.0, "dy": 1.2, "align": "wall_bottom"},
        {"id": "side_table", "type": "table", "name": "Side Table", "width": 1.4, "length": 1.4, "dx": 0.5, "dy": 1.2, "align": "bed_side"},
        {"id": "wardrobe", "type": "wardrobe", "name": "Wardrobe", "width": 4.2, "length": 1.8, "dx": 1.0, "dy": 0.5, "align": "wall_side"}
    ],
    "kitchen": [
        {"id": "counter_main", "type": "counter", "name": "Main Kitchen Counter", "width": 7.5, "length": 2.0, "dx": 0.3, "dy": 0.3, "align": "wall_bottom"},
        {"id": "sink", "type": "fixture", "name": "Double Bowl Sink", "width": 2.5, "length": 1.6, "dx": 1.0, "dy": 0.5, "align": "on_counter"},
        {"id": "cooktop", "type": "appliance", "name": "4-Burner Hob", "width": 2.5, "length": 1.6, "dx": 4.5, "dy": 0.5, "align": "on_counter"}
    ],
    "attached_bath": [
        {"id": "wc", "type": "fixture", "name": "Wall-Hung WC", "width": 1.6, "length": 2.2, "dx": 0.8, "dy": 0.8, "align": "wall"},
        {"id": "basin", "type": "fixture", "name": "Countertop Basin", "width": 1.8, "length": 1.5, "dx": 2.8, "dy": 0.8, "align": "wall"},
        {"id": "shower", "type": "fixture", "name": "Glass Shower Enclosure", "width": 3.0, "length": 3.0, "dx": 0.8, "dy": 3.2, "align": "corner"}
    ],
    "common_bath": [
        {"id": "wc", "type": "fixture", "name": "Wall-Hung WC", "width": 1.6, "length": 2.2, "dx": 0.8, "dy": 0.8, "align": "wall"},
        {"id": "basin", "type": "fixture", "name": "Wash Basin", "width": 1.8, "length": 1.4, "dx": 2.8, "dy": 0.8, "align": "wall"},
        {"id": "shower", "type": "fixture", "name": "Shower Stall", "width": 2.8, "length": 2.8, "dx": 0.8, "dy": 3.2, "align": "corner"}
    ],
    "puja": [
        {"id": "mandir", "type": "fixture", "name": "Mandir Altar Platform", "width": 3.0, "length": 1.5, "dx": 1.0, "dy": 0.5, "align": "wall"}
    ],
    "balcony": [
        {"id": "balcony_table", "type": "table", "name": "Bistro Table", "width": 2.0, "length": 2.0, "dx": 1.5, "dy": 1.2, "align": "center"}
    ]
}

def verify_furniture_feasibility(room_type: str, rw: float, rl: float) -> Tuple[bool, float]:
    """
    Checks if a room of dimensions (rw x rl) can physically accommodate
    its required furniture modules with adequate functional circulation clearances.
    Returns (fits: bool, feasibility_ratio: float).
    """
    min_dim = min(rw, rl)
    max_dim = max(rw, rl)
    area = rw * rl

    if room_type in ["master_bed"]:
        # Needs at least 10.5 ft width for king bed (6.2) + 2 side clearances (1.8 each) = 9.8 ft min
        fits = min_dim >= 10.2 and max_dim >= 11.2 and area >= 130.0
        ratio = min(1.0, area / 150.0) if fits else max(0.4, area / 150.0 * 0.7)
        return fits, ratio

    elif room_type in ["regular_bed"]:
        # Needs at least 9.5 ft for queen bed (5.0) + clearance
        fits = min_dim >= 9.2 and max_dim >= 9.8 and area >= 100.0
        ratio = min(1.0, area / 120.0) if fits else max(0.4, area / 120.0 * 0.7)
        return fits, ratio

    elif room_type in ["living"]:
        fits = min_dim >= 10.0 and max_dim >= 11.5 and area >= 140.0
        ratio = min(1.0, area / 160.0) if fits else max(0.4, area / 160.0 * 0.7)
        return fits, ratio

    elif room_type in ["dining"]:
        fits = min_dim >= 8.5 and max_dim >= 9.5 and area >= 90.0
        ratio = min(1.0, area / 110.0) if fits else max(0.4, area / 110.0 * 0.7)
        return fits, ratio

    elif room_type in ["kitchen"]:
        fits = min_dim >= 7.5 and max_dim >= 8.5 and area >= 70.0
        ratio = min(1.0, area / 85.0) if fits else max(0.4, area / 85.0 * 0.7)
        return fits, ratio

    elif room_type in ["attached_bath", "common_bath"]:
        fits = min_dim >= 4.5 and max_dim >= 5.5 and area >= 30.0
        ratio = min(1.0, area / 38.0) if fits else max(0.4, area / 38.0 * 0.7)
        return fits, ratio

    elif room_type in ["puja"]:
        fits = min_dim >= 4.0 and max_dim >= 4.0 and area >= 18.0
        return fits, 1.0

    return True, 1.0

def generate_schematic_furniture(
    room_type: str,
    rx: float,
    ry: float,
    rw: float,
    rl: float
) -> List[Dict[str, Any]]:
    """
    Generates positioned vector furniture items placed proportionally inside room bounds.
    """
    templates = FURNITURE_TEMPLATES.get(room_type, [])
    if not templates:
        return []

    placed_items: List[Dict[str, Any]] = []

    for tmpl in templates:
        fw = tmpl["width"]
        fl = tmpl["length"]
        align = tmpl.get("align", "center")

        # Skip if item exceeds room boundary
        if fw >= (rw - 0.4) or fl >= (rl - 0.4):
            # Scale down if necessary
            scale_factor = min((rw - 0.6) / fw, (rl - 0.6) / fl, 1.0)
            if scale_factor < 0.65:
                continue
            fw = round(fw * scale_factor, 1)
            fl = round(fl * scale_factor, 1)

        if align == "center":
            fx = round(rx + (rw - fw) / 2.0, 1)
            fy = round(ry + (rl - fl) / 2.0, 1)
        elif align == "wall_bottom":
            fx = round(rx + (rw - fw) / 2.0, 1)
            fy = round(ry + 0.6, 1)
        elif align == "wall_top":
            fx = round(rx + (rw - fw) / 2.0, 1)
            fy = round(ry + rl - fl - 0.6, 1)
        elif align == "wall_side":
            fx = round(rx + 0.6, 1)
            fy = round(ry + rl - fl - 0.6, 1)
        elif align == "bed_side":
            # Offset beside bed
            if "table_l" in tmpl["id"]:
                fx = round(rx + max(0.4, (rw - 6.2) / 2.0 - 1.6), 1)
                fy = round(ry + 0.6, 1)
            else:
                fx = round(rx + min(rw - 1.8, (rw + 6.2) / 2.0 + 0.2), 1)
                fy = round(ry + 0.6, 1)
        elif align == "table_side":
            fx = round(rx + tmpl.get("dx", 1.0), 1)
            fy = round(ry + tmpl.get("dy", 1.0), 1)
        elif align == "corner":
            fx = round(rx + rw - fw - 0.5, 1)
            fy = round(ry + rl - fl - 0.5, 1)
        else:
            fx = round(rx + tmpl.get("dx", 0.5), 1)
            fy = round(ry + tmpl.get("dy", 0.5), 1)

        # Enforce containment strictly within room boundary
        fx = max(rx + 0.3, min(rx + rw - fw - 0.3, fx))
        fy = max(ry + 0.3, min(ry + rl - fl - 0.3, fy))

        placed_items.append({
            "id": f"{tmpl['id']}_{int(rx*10)}_{int(ry*10)}",
            "type": tmpl["type"],
            "name": tmpl["name"],
            "x": round(fx, 1),
            "y": round(fy, 1),
            "width": round(fw, 1),
            "length": round(fl, 1),
            "rotation": 0.0
        })

    return placed_items
