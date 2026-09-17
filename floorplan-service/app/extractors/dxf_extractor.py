import ezdxf
import re
from typing import Dict, Any, List, Tuple

# Common layer name patterns for room boundaries
ROOM_LAYER_PATTERNS = [
    r'ROOM', r'A-AREA', r'AREA', r'SPACE', r'SPACES', r'BOUNDARY', r'ROOMS', r'A-ROOM', r'ZONE'
]

# DXF $INSUNITS mapping to feet conversion factor
# 1 = Inches, 2 = Feet, 4 = Millimeters, 5 = Centimeters, 6 = Meters
INSUNITS_SCALE_TO_FEET = {
    1: 1.0 / 12.0,            # Inches to feet
    2: 1.0,                   # Feet
    4: 1.0 / 304.8,           # Millimeters to feet
    5: 1.0 / 30.48,           # Centimeters to feet
    6: 3.28084                # Meters to feet
}

INSUNITS_NAMES = {
    1: "inches",
    2: "feet",
    4: "millimeters",
    5: "centimeters",
    6: "meters"
}

def is_room_layer(layer_name: str) -> bool:
    """Fuzzy matching for room boundary layer names."""
    if not layer_name:
        return False
    norm = re.sub(r'[^a-zA-Z0-9]', '', layer_name.upper())
    for pat in ROOM_LAYER_PATTERNS:
        if pat in norm:
            return True
    return False

def parse_dxf_file(
    file_path: str,
    max_entities: int = 15000,
    max_polygons: int = 500
) -> Dict[str, Any]:
    """
    Parses a DXF file using ezdxf.
    Extracts closed polylines, text entities, and unit metadata with scale conversion to feet.
    """
    try:
        doc = ezdxf.readfile(file_path)
    except Exception as e:
        raise ValueError(f"Malformed or unsupported DXF file: {str(e)}")

    # 1. Unit Detection ($INSUNITS)
    unit_code = doc.header.get('$INSUNITS', 0)
    warnings: List[str] = []

    if unit_code in INSUNITS_SCALE_TO_FEET:
        scale_to_feet = INSUNITS_SCALE_TO_FEET[unit_code]
        unit_name = INSUNITS_NAMES[unit_code]
        unit_confidence = "HIGH"
    else:
        # Fallback to feet per specification, but flag as LOW confidence with warning
        scale_to_feet = 1.0
        unit_name = "feet (assumed)"
        unit_confidence = "LOW"
        warnings.append("Missing or unrecognized DXF $INSUNITS header; scale assumed as feet with LOW confidence.")

    msp = doc.modelspace()

    raw_polygons: List[Dict[str, Any]] = []
    raw_labels: List[Dict[str, Any]] = []

    entity_count = 0

    # 2. Extract closed polylines and text entities
    for entity in msp:
        entity_count += 1
        if entity_count > max_entities:
            warnings.append(f"Entity limit ({max_entities}) reached during CAD parsing; partial plan processed.")
            break

        dxftype = entity.dxftype()
        layer = entity.dxf.layer if hasattr(entity.dxf, 'layer') else '0'

        # Closed LWPOLYLINE
        if dxftype == 'LWPOLYLINE':
            if entity.is_closed:
                pts = [
                    [round(p[0] * scale_to_feet, 3), round(p[1] * scale_to_feet, 3)]
                    for p in entity.get_points(format='xy')
                ]
                if len(pts) >= 3 and len(raw_polygons) < max_polygons:
                    raw_polygons.append({
                        "vertices": pts,
                        "layer": layer,
                        "is_room_layer": is_room_layer(layer),
                        "handle": entity.dxf.handle
                    })

        # Closed 2D POLYLINE
        elif dxftype == 'POLYLINE':
            if entity.is_closed and not entity.is_3d_polygon_mesh:
                pts = [
                    [round(v.dxf.location.x * scale_to_feet, 3), round(v.dxf.location.y * scale_to_feet, 3)]
                    for v in entity.vertices
                ]
                if len(pts) >= 3 and len(raw_polygons) < max_polygons:
                    raw_polygons.append({
                        "vertices": pts,
                        "layer": layer,
                        "is_room_layer": is_room_layer(layer),
                        "handle": entity.dxf.handle
                    })

        # TEXT entity
        elif dxftype == 'TEXT':
            text = entity.dxf.text if hasattr(entity.dxf, 'text') else ''
            loc = entity.dxf.insert if hasattr(entity.dxf, 'insert') else None
            if text and loc:
                raw_labels.append({
                    "text": str(text),
                    "x": loc.x * scale_to_feet,
                    "y": loc.y * scale_to_feet,
                    "layer": layer
                })

        # MTEXT entity
        elif dxftype == 'MTEXT':
            text = entity.text if hasattr(entity, 'text') else ''
            loc = entity.dxf.insert if hasattr(entity.dxf, 'insert') else None
            if text and loc:
                raw_labels.append({
                    "text": str(text),
                    "x": loc.x * scale_to_feet,
                    "y": loc.y * scale_to_feet,
                    "layer": layer
                })

    return {
        "unit_name": unit_name,
        "unit_confidence": unit_confidence,
        "scale_to_feet": scale_to_feet,
        "polygons": raw_polygons,
        "labels": raw_labels,
        "warnings": warnings,
        "total_entities_scanned": entity_count
    }
