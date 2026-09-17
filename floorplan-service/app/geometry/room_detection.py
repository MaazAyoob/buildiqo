from typing import List, Tuple, Dict, Any, Optional
from shapely.geometry import Polygon, MultiPolygon, Point
from shapely.validation import make_valid
import math

class RoomCandidate:
    def __init__(
        self,
        polygon: Polygon,
        vertices: List[List[float]],
        layer: str,
        entity_handle: str = ""
    ):
        self.polygon = polygon
        self.vertices = vertices
        self.layer = layer
        self.entity_handle = entity_handle
        self.area_sqft = float(polygon.area)
        self.is_valid = polygon.is_valid and not polygon.is_empty
        self.is_container = False
        self.is_duplicate = False
        self.duplicate_of: Optional[str] = None
        self.warnings: List[str] = []
        self.confidence = "HIGH"

        # Calculate bounding box dimensions (minimum rotated bounding box)
        self.min_x, self.min_y, self.max_x, self.max_y = polygon.bounds
        self.width_ft, self.length_ft = self._calculate_dimensions()

    def _calculate_dimensions(self) -> Tuple[float, float]:
        """
        Calculates bounding dimensions in feet using minimum rotated bounding box.
        Returns (width, length) where width <= length.
        """
        try:
            mrr = self.polygon.minimum_rotated_rectangle
            if mrr and hasattr(mrr, 'exterior') and mrr.exterior:
                coords = list(mrr.exterior.coords)
                if len(coords) >= 4:
                    # Edge lengths of rectangle
                    e1 = math.hypot(coords[1][0] - coords[0][0], coords[1][1] - coords[0][1])
                    e2 = math.hypot(coords[2][0] - coords[1][0], coords[2][1] - coords[1][1])
                    w = round(min(e1, e2), 2)
                    l = round(max(e1, e2), 2)
                    return w, l
        except Exception:
            pass

        # Fallback to axis-aligned bounds
        w = round(abs(self.max_x - self.min_x), 2)
        l = round(abs(self.max_y - self.min_y), 2)
        return min(w, l), max(w, l)

def create_polygon_candidate(
    vertices: List[List[float]],
    layer: str,
    entity_handle: str = ""
) -> Optional[RoomCandidate]:
    """
    Creates and validates a Shapely polygon from raw 2D vertices (already scaled to feet).
    Enforces the small-polygon rule:
      < 2 sq.ft: rejected as degenerate
      2 - 15 sq.ft: retained with LOW confidence & warning
      > 15 sq.ft: normal processing
    """
    if len(vertices) < 3:
        return None

    # Ensure closed polygon
    if vertices[0] != vertices[-1]:
        closed_vertices = vertices + [vertices[0]]
    else:
        closed_vertices = vertices

    try:
        poly = Polygon(closed_vertices)
        if not poly.is_valid:
            poly = make_valid(poly)
            if isinstance(poly, MultiPolygon):
                # Pick largest polygon if split by self-intersection
                poly = max(poly.geoms, key=lambda g: g.area)

        if not poly.is_valid or poly.is_empty:
            return None

        area = poly.area

        # Rule 5: Small polygon handling
        if area < 2.0:
            # Reject micro-geometry / degenerate loops
            return None

        candidate = RoomCandidate(
            polygon=poly,
            vertices=closed_vertices,
            layer=layer,
            entity_handle=entity_handle
        )

        if 2.0 <= area <= 15.0:
            candidate.confidence = "LOW"
            candidate.warnings.append("Very small detected space; manual verification recommended.")

        return candidate

    except Exception:
        return None

def analyze_geometry_relationships(candidates: List[RoomCandidate]) -> None:
    """
    Performs spatial containment and duplicate checks across all room candidates.
    - Identifies containers/parent envelopes (e.g. building footprint enclosing all rooms).
    - Identifies duplicates / near-duplicates (>95% overlap).
    - Modifies candidate flags in-place.
    """
    n = len(candidates)
    if n <= 1:
        return

    # Check for duplicates
    for i in range(n):
        if candidates[i].is_duplicate:
            continue
        for j in range(i + 1, n):
            if candidates[j].is_duplicate:
                continue

            poly_i = candidates[i].polygon
            poly_j = candidates[j].polygon

            try:
                intersection_area = poly_i.intersection(poly_j).area
                if intersection_area > 0:
                    union_area = poly_i.union(poly_j).area
                    iou = intersection_area / union_area if union_area > 0 else 0
                    if iou > 0.90:
                        # Near-identical duplicate
                        candidates[j].is_duplicate = True
                        candidates[j].duplicate_of = candidates[i].entity_handle or f"Candidate {i}"
                        candidates[j].warnings.append("Duplicate or near-identical polygon detected; excluded from carpet sum.")
                        candidates[j].confidence = "LOW"
            except Exception:
                pass

    # Check for container polygons (e.g. building envelope or site boundary)
    for i in range(n):
        if candidates[i].is_duplicate or candidates[i].is_container:
            continue

        poly_i = candidates[i].polygon
        contained_count = 0

        for j in range(n):
            if i == j or candidates[j].is_duplicate:
                continue
            poly_j = candidates[j].polygon

            try:
                # If poly_i contains poly_j or poly_j is >80% inside poly_i and poly_i is significantly larger
                if poly_i.area > (poly_j.area * 1.5):
                    if poly_i.contains(poly_j) or (poly_i.intersection(poly_j).area / poly_j.area) > 0.80:
                        contained_count += 1
            except Exception:
                pass

        if contained_count >= 2:
            candidates[i].is_container = True
            candidates[i].warnings.append(
                f"Container/envelope polygon enclosing {contained_count} sub-spaces; excluded from room carpet sum."
            )
            candidates[i].confidence = "MEDIUM"
