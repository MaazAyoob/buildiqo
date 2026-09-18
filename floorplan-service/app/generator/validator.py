"""
Buildiqo.AI - Phase 2.0 Geometry Validator
Uses Shapely to enforce boundary containment, setback limits,
non-overlap between rooms, and minimum dimensional invariants.
"""
from typing import List, Tuple, Dict, Any
from shapely.geometry import box, Polygon
from .schemas import GeneratedFloorplanResponse, GeneratedRoomGeometry, FloorLayout
from .room_registry import get_room_definition

class GeometryValidationResult:
    def __init__(self):
        self.is_valid: bool = True
        self.errors: List[str] = []
        self.warnings: List[str] = []

    def add_error(self, err: str):
        self.is_valid = False
        self.errors.append(err)

    def add_warning(self, warn: str):
        self.warnings.append(warn)

def validate_generated_geometry(response: GeneratedFloorplanResponse) -> GeometryValidationResult:
    """
    Authoritative spatial validation using Shapely 2.0.
    Checks:
    1. Plot boundary containment
    2. Setback boundary containment
    3. Non-overlap between all room pairs on each floor
    4. Minimum dimensional thresholds
    5. Positive area and valid polygon geometry
    6. Unique room IDs
    """
    result = GeometryValidationResult()

    plot_w = response.plot.get("width_ft", 0.0)
    plot_l = response.plot.get("length_ft", 0.0)
    setback = response.setback_ft

    if plot_w <= 0 or plot_l <= 0:
        result.add_error("Invalid plot dimensions: width and length must be positive.")
        return result

    # Allow tiny epsilon for numerical tolerance on boundary contact
    eps = 0.05
    plot_box = box(0.0, 0.0, plot_w, plot_l)
    buildable_box = box(setback - eps, setback - eps, plot_w - setback + eps, plot_l - setback + eps)

    seen_ids = set()

    for floor_layout in response.floors:
        floor_rooms = floor_layout.rooms
        room_polys: List[Tuple[GeneratedRoomGeometry, Polygon]] = []

        for room in floor_rooms:
            # 1. Unique Room ID check
            if room.room_id in seen_ids:
                result.add_error(f"Duplicate room ID detected: '{room.room_id}'")
            seen_ids.add(room.room_id)

            # 2. Strict confidence check
            if room.confidence != "generated":
                result.add_error(f"Room '{room.room_id}' confidence must be 'generated', found '{room.confidence}'")

            # 3. Positive dimensions and area
            if room.width <= 0 or room.length <= 0 or room.area <= 0:
                result.add_error(f"Room '{room.room_id}' has invalid non-positive dimensions: {room.width}×{room.length}, area={room.area}")
                continue

            # 4. Polygon validation
            rx, ry, rw, rl = room.x, room.y, room.width, room.length
            r_poly = box(rx, ry, rx + rw, ry + rl)

            if not r_poly.is_valid or r_poly.is_empty:
                result.add_error(f"Room '{room.room_id}' produced an invalid polygon.")
                continue

            # 5. Boundary and Setback containment
            if not buildable_box.covers(r_poly):
                # Calculate bounds excess
                minx, miny, maxx, maxy = r_poly.bounds
                result.add_error(
                    f"Room '{room.name}' ({room.room_id}) extends outside buildable setback envelope: "
                    f"bounds=[{minx:.1f}, {miny:.1f}, {maxx:.1f}, {maxy:.1f}] vs buildable=[{setback:.1f}, {setback:.1f}, {plot_w - setback:.1f}, {plot_l - setback:.1f}]"
                )

            # 6. Minimum dimension and area verification using canonical room registry
            r_def = get_room_definition(room.type)
            min_allowed_dim = min(r_def.min_width_ft, r_def.min_length_ft)
            actual_min_dim = min(room.width, room.length)

            if actual_min_dim < (min_allowed_dim - 0.1):
                result.add_warning(
                    f"Room '{room.name}' ({room.room_id}) is narrower than canonical minimum ({min_allowed_dim:.1f} ft): {room.width:.1f} ft × {room.length:.1f} ft."
                )

            if room.area < (r_def.min_area_sqft - 0.5):
                result.add_warning(
                    f"Room '{room.name}' ({room.room_id}) area ({room.area:.1f} sq.ft) is below canonical minimum ({r_def.min_area_sqft:.1f} sq.ft)."
                )

            room_polys.append((room, r_poly))

        # 7. Pairwise non-overlap validation
        n = len(room_polys)
        for i in range(n):
            for j in range(i + 1, n):
                r1, poly1 = room_polys[i]
                r2, poly2 = room_polys[j]

                intersection = poly1.intersection(poly2)
                # Overlap area threshold: edge-sharing polygons have intersection area ~0
                if intersection.area > 0.1:
                    result.add_error(
                        f"Forbidden room overlap detected on floor {floor_layout.floor}: "
                        f"'{r1.name}' ({r1.room_id}) and '{r2.name}' ({r2.room_id}) overlap by {intersection.area:.2f} sq.ft."
                    )

    return result
