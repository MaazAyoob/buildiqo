"""
Buildiqo.AI - Phase 3 Architectural Room Relationship Graph
Evaluates spatial adjacencies, functional proximities, privacy separation,
and service clustering based on architectural principles.
"""
import math
from typing import List, Dict, Any, Optional, Tuple

ROOM_RELATIONSHIPS: Dict[str, Dict[str, Any]] = {
    "living": {
        "zone": "public",
        "privacy": "low",
        "near": ["dining", "entrance", "porch", "parking", "foyer"],
        "avoid": ["attached_bath", "common_bath"],
        "ideal_orientation": ["NE", "N", "E"]
    },
    "dining": {
        "zone": "public",
        "privacy": "low",
        "near": ["living", "kitchen", "puja"],
        "avoid": ["attached_bath"],
        "ideal_orientation": ["E", "CENTER", "N"]
    },
    "kitchen": {
        "zone": "service",
        "privacy": "medium",
        "near": ["dining", "utility"],
        "avoid": ["master_bed", "attached_bath"],
        "service_cluster": ["utility"],
        "ideal_orientation": ["SE", "NW", "E"]
    },
    "master_bed": {
        "zone": "private",
        "privacy": "high",
        "near": ["attached_bath"],
        "avoid": ["entrance", "living", "kitchen"],
        "direct_access": ["attached_bath"],
        "ideal_orientation": ["SW", "S", "W"]
    },
    "regular_bed": {
        "zone": "private",
        "privacy": "high",
        "near": ["circulation", "common_bath"],
        "avoid": ["entrance", "kitchen"],
        "ideal_orientation": ["NW", "W", "N", "NE"]
    },
    "attached_bath": {
        "zone": "private",
        "privacy": "high",
        "parent_room": "master_bed",
        "near": ["master_bed"],
        "avoid": ["living", "dining", "entrance", "kitchen"],
        "direct_access_from": "master_bed",
        "ideal_orientation": ["SW", "NW", "SE"]
    },
    "common_bath": {
        "zone": "service",
        "privacy": "medium",
        "near": ["circulation", "regular_bed"],
        "avoid": ["living", "dining", "entrance"],
        "ideal_orientation": ["NW", "W", "S"]
    },
    "utility": {
        "zone": "service",
        "privacy": "service",
        "parent_room": "kitchen",
        "near": ["kitchen"],
        "avoid": ["master_bed", "living"],
        "ideal_orientation": ["SE", "E", "S"]
    },
    "puja": {
        "zone": "special",
        "privacy": "special",
        "near": ["living", "dining", "circulation"],
        "avoid": ["attached_bath", "common_bath", "utility"],
        "ideal_orientation": ["NE", "N", "E"]
    },
    "staircase": {
        "zone": "circulation",
        "privacy": "circulation",
        "near": ["circulation", "living", "entrance"],
        "avoid": [],
        "ideal_orientation": ["S", "SW", "W"]
    },
    "balcony": {
        "zone": "special",
        "privacy": "medium",
        "near": ["living", "master_bed", "regular_bed"],
        "avoid": ["common_bath", "attached_bath"],
        "ideal_orientation": ["N", "E", "NE"]
    }
}

def get_room_centroid(room: Any) -> Tuple[float, float]:
    """Returns the (cx, cy) centroid of a room geometry."""
    rx = getattr(room, "x", 0.0)
    ry = getattr(room, "y", 0.0)
    rw = getattr(room, "width", 0.0)
    rl = getattr(room, "length", 0.0)
    return (rx + rw / 2.0, ry + rl / 2.0)

def calculate_distance(c1: Tuple[float, float], c2: Tuple[float, float]) -> float:
    """Euclidean distance between two centroids."""
    return math.hypot(c1[0] - c2[0], c1[1] - c2[1])

def evaluate_relationship_graph(
    rooms: List[Any],
    plot_w: float,
    plot_l: float
) -> Dict[str, Any]:
    """
    Evaluates spatial relationships and returns:
    - score: float (0 to 15)
    - penalties: List[str]
    - bonuses: List[str]
    - metrics: Dict[str, Any]
    """
    max_diag = math.hypot(plot_w, plot_l)
    if max_diag <= 0:
        max_diag = 50.0

    by_type: Dict[str, List[Any]] = {}
    by_id: Dict[str, Any] = {}
    for r in rooms:
        t = getattr(r, "type", "")
        by_type.setdefault(t, []).append(r)
        by_id[getattr(r, "room_id", "")] = r

    score = 15.0
    penalties: List[str] = []
    bonuses: List[str] = []
    metrics: Dict[str, Any] = {}

    # 1. Living <-> Dining proximity: ideal within 30% of plot diagonal
    if "living" in by_type and "dining" in by_type:
        liv = by_type["living"][0]
        din = by_type["dining"][0]
        dist_ld = calculate_distance(get_room_centroid(liv), get_room_centroid(din))
        norm_ld = dist_ld / max_diag
        metrics["living_dining_dist_ft"] = round(dist_ld, 1)
        if norm_ld <= 0.35:
            bonuses.append("Living and Dining are in direct spatial proximity")
        else:
            penalty = min(3.0, (norm_ld - 0.35) * 8.0)
            score -= penalty
            penalties.append(f"Living and Dining separated by {dist_ld:.1f} ft")

    # 2. Dining <-> Kitchen proximity: ideal within 35% of plot diagonal
    if "dining" in by_type and "kitchen" in by_type:
        din = by_type["dining"][0]
        kit = by_type["kitchen"][0]
        dist_dk = calculate_distance(get_room_centroid(din), get_room_centroid(kit))
        norm_dk = dist_dk / max_diag
        metrics["dining_kitchen_dist_ft"] = round(dist_dk, 1)
        if norm_dk <= 0.38:
            bonuses.append("Kitchen and Dining have strong functional service adjacency")
        else:
            penalty = min(3.0, (norm_dk - 0.38) * 8.0)
            score -= penalty
            penalties.append(f"Kitchen far from Dining ({dist_dk:.1f} ft)")

    # 3. Master Bed <-> Attached Bath: must share a wall or be within 10 ft
    if "master_bed" in by_type and "attached_bath" in by_type:
        mb = by_type["master_bed"][0]
        ab = by_type["attached_bath"][0]
        dist_ma = calculate_distance(get_room_centroid(mb), get_room_centroid(ab))
        metrics["master_attached_bath_dist_ft"] = round(dist_ma, 1)
        max_adj_dist = (mb.width + mb.length + ab.width + ab.length) / 3.0
        if dist_ma <= max_adj_dist:
            bonuses.append("Attached bath is directly adjacent to Master Bedroom Suite")
        else:
            score -= 3.5
            penalties.append(f"Attached bath is not adjacent to Master Bedroom ({dist_ma:.1f} ft)")

    # 4. Kitchen <-> Utility relationship
    if "kitchen" in by_type and "utility" in by_type:
        kit = by_type["kitchen"][0]
        ut = by_type["utility"][0]
        dist_ku = calculate_distance(get_room_centroid(kit), get_room_centroid(ut))
        metrics["kitchen_utility_dist_ft"] = round(dist_ku, 1)
        if dist_ku <= 14.0:
            bonuses.append("Utility room is contiguous to Kitchen")
        else:
            score -= 1.5
            penalties.append("Utility room is isolated from Kitchen")

    # 5. Common Bath door privacy: ensure common bath does not face directly into Living Room
    if "common_bath" in by_type and "living" in by_type:
        cb = by_type["common_bath"][0]
        liv = by_type["living"][0]
        dist_cl = calculate_distance(get_room_centroid(cb), get_room_centroid(liv))
        if dist_cl < 10.0:
            score -= 2.0
            penalties.append("Common bathroom is too close or facing Living area directly")
        else:
            bonuses.append("Common bathroom is discreetly zoned away from formal living")

    # 6. Privacy: Public vs Private separation
    if "living" in by_type and "master_bed" in by_type:
        liv = by_type["living"][0]
        mb = by_type["master_bed"][0]
        dist_lm = calculate_distance(get_room_centroid(liv), get_room_centroid(mb))
        if dist_lm < 12.0 and getattr(liv, "floor", 0) == getattr(mb, "floor", 0):
            score -= 1.5
            penalties.append("Master bedroom lacks buffer separation from public living area")

    final_score = max(0.0, min(15.0, round(score, 1)))

    return {
        "score": final_score,
        "max_score": 15.0,
        "penalties": penalties,
        "bonuses": bonuses,
        "metrics": metrics
    }
