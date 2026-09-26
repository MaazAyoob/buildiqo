"""
Buildiqo.AI - Phase 3 Architectural Wall System
Derives external walls (9" thick / 0.75 ft) and internal partitions (4.5" thick / 0.375 ft)
directly from the buildable envelope and room geometry boundaries.
"""
from typing import List, Dict, Any, Tuple

EXTERIOR_WALL_THICKNESS_FT = 0.75  # 9-inch brick / RCC exterior wall
INTERIOR_WALL_THICKNESS_FT = 0.375 # 4.5-inch internal partition wall

def extract_wall_segments(
    rooms: List[Any],
    env_x: float,
    env_y: float,
    env_w: float,
    env_l: float
) -> List[Dict[str, Any]]:
    """
    Extracts canonical wall segments for an architectural floor layout:
    - 4 exterior envelope walls (top, bottom, left, right)
    - Interior partition segments along shared room borders
    """
    walls: List[Dict[str, Any]] = []

    # 1. Four exterior perimeter walls
    walls.append({
        "wall_id": "ext_wall_bottom",
        "start": [round(env_x, 2), round(env_y, 2)],
        "end": [round(env_x + env_w, 2), round(env_y, 2)],
        "thickness_ft": EXTERIOR_WALL_THICKNESS_FT,
        "wall_type": "exterior",
        "orientation": "horizontal"
    })
    walls.append({
        "wall_id": "ext_wall_top",
        "start": [round(env_x, 2), round(env_y + env_l, 2)],
        "end": [round(env_x + env_w, 2), round(env_y + env_l, 2)],
        "thickness_ft": EXTERIOR_WALL_THICKNESS_FT,
        "wall_type": "exterior",
        "orientation": "horizontal"
    })
    walls.append({
        "wall_id": "ext_wall_left",
        "start": [round(env_x, 2), round(env_y, 2)],
        "end": [round(env_x, 2), round(env_y + env_l, 2)],
        "thickness_ft": EXTERIOR_WALL_THICKNESS_FT,
        "wall_type": "exterior",
        "orientation": "vertical"
    })
    walls.append({
        "wall_id": "ext_wall_right",
        "start": [round(env_x + env_w, 2), round(env_y, 2)],
        "end": [round(env_x + env_w, 2), round(env_y + env_l, 2)],
        "thickness_ft": EXTERIOR_WALL_THICKNESS_FT,
        "wall_type": "exterior",
        "orientation": "vertical"
    })

    # 2. Interior partitions extracted from unique interior room boundaries
    seen_partitions = set()
    eps = 0.2

    for r in rooms:
        rx = getattr(r, "x", 0.0)
        ry = getattr(r, "y", 0.0)
        rw = getattr(r, "width", 0.0)
        rl = getattr(r, "length", 0.0)

        # Right edge
        if abs((rx + rw) - (env_x + env_w)) > eps:
            key = (round(rx + rw, 1), round(ry, 1), round(ry + rl, 1), "v")
            if key not in seen_partitions:
                seen_partitions.add(key)
                walls.append({
                    "wall_id": f"int_wall_v_{int((rx+rw)*10)}_{int(ry*10)}",
                    "start": [round(rx + rw, 2), round(ry, 2)],
                    "end": [round(rx + rw, 2), round(ry + rl, 2)],
                    "thickness_ft": INTERIOR_WALL_THICKNESS_FT,
                    "wall_type": "interior",
                    "orientation": "vertical"
                })

        # Top edge
        if abs((ry + rl) - (env_y + env_l)) > eps:
            key = (round(ry + rl, 1), round(rx, 1), round(rx + rw, 1), "h")
            if key not in seen_partitions:
                seen_partitions.add(key)
                walls.append({
                    "wall_id": f"int_wall_h_{int(rx*10)}_{int((ry+rl)*10)}",
                    "start": [round(rx, 2), round(ry + rl, 2)],
                    "end": [round(rx + rw, 2), round(ry + rl, 2)],
                    "thickness_ft": INTERIOR_WALL_THICKNESS_FT,
                    "wall_type": "interior",
                    "orientation": "horizontal"
                })

    return walls
