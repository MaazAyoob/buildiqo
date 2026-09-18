import os
from typing import Dict, Any, List
from ..schemas import ExtractionResponse, ExtractedRoom, GeometryData, SourceMetadata
from ..extractors.dxf_extractor import parse_dxf_file
from ..geometry.room_detection import create_polygon_candidate, analyze_geometry_relationships
from ..geometry.label_matcher import match_labels_to_candidates
from ..classification.room_classifier import classify_room_type

def extract_dxf_floorplan(file_path: str, original_filename: str) -> ExtractionResponse:
    """
    Full extraction pipeline for AutoCAD DXF floor plans.
    Guarantees deterministic geometry, multi-factor confidence, explicit polygon area vs dimensions,
    and protected carpet area aggregation.
    """
    # 1. Parse DXF
    parsed = parse_dxf_file(file_path)

    global_warnings = list(parsed.get("warnings", []))
    raw_polys = parsed.get("polygons", [])
    raw_labels = parsed.get("labels", [])

    # 2. Build candidate geometries
    candidates = []
    for p in raw_polys:
        cand = create_polygon_candidate(
            vertices=p["vertices"],
            layer=p["layer"],
            entity_handle=p.get("handle", "")
        )
        if cand:
            candidates.append(cand)

    if not candidates:
        global_warnings.append("No closed room boundary polygons detected in drawing.")

    # 3. Analyze containment, overlaps, and duplicates
    analyze_geometry_relationships(candidates)

    # 4. Associate room labels
    candidate_matches, unmatched_labels = match_labels_to_candidates(candidates, raw_labels)

    # 5. Build ExtractedRoom objects
    extracted_rooms: List[ExtractedRoom] = []
    total_usable_carpet = 0.0

    room_counter = 1
    unit_conf = parsed.get("unit_confidence", "LOW")

    for i, cand in enumerate(candidates):
        matches = candidate_matches.get(i, [])

        # Determine Room Name & Type
        if matches:
            primary_label = matches[0]["text"]
            room_name = primary_label
            room_type = classify_room_type(primary_label)
            if len(matches) > 1:
                secondary_names = [m["text"] for m in matches[1:]]
                cand.warnings.append(f"Multiple text labels found inside space: {', '.join(secondary_names)}")
        else:
            room_name = f"Unnamed Space {room_counter}"
            room_type = "custom"
            room_counter += 1
            cand.warnings.append("Room boundary detected but no matching room label was found.")

        # Multi-factor confidence evaluation
        confidence = "HIGH"
        if unit_conf == "LOW":
            confidence = "LOW"
        elif cand.confidence == "LOW" or cand.is_duplicate or cand.area_sqft < 15.0:
            confidence = "LOW"
        elif cand.is_container or not matches:
            confidence = "MEDIUM"

        room_warnings = list(cand.warnings)

        # Build GeometryData
        geom = GeometryData(
            x=round(cand.min_x, 2),
            y=round(cand.min_y, 2),
            width=cand.width_ft,
            length=cand.length_ft,
            polygon=[[round(v[0], 2), round(v[1], 2)] for v in cand.vertices]
        )

        room_obj = ExtractedRoom(
            id=f"ext-room-{i+1}",
            name=room_name,
            type=room_type,
            width_ft=cand.width_ft,
            length_ft=cand.length_ft,
            area_sqft=round(cand.area_sqft, 2),
            area_method="POLYGON_AREA",
            dimension_method="MIN_ROTATED_BOUNDING_BOX",
            count=1,
            confidence=confidence,
            source="DXF_EXTRACTION",
            warnings=room_warnings,
            geometry=geom
        )

        extracted_rooms.append(room_obj)

        # 6. Protected carpet area aggregation:
        # Exclude container polygons (e.g. building envelope) and duplicates
        if not cand.is_container and not cand.is_duplicate:
            total_usable_carpet += cand.area_sqft

    # Format unmatched labels
    formatted_unmatched = [
        {"text": u["text"], "x": round(u["x"], 2), "y": round(u["y"], 2), "layer": u["layer"]}
        for u in unmatched_labels
    ]
    if formatted_unmatched:
        global_warnings.append(f"{len(formatted_unmatched)} CAD text labels could not be matched to any enclosed room boundary.")

    source_meta = SourceMetadata(
        filename=original_filename,
        file_type="DWG" if original_filename.lower().endswith(".dwg") else "DXF",
        units=parsed.get("unit_name", "feet"),
        unit_confidence=unit_conf
    )

    return ExtractionResponse(
        success=True,
        source=source_meta,
        rooms=extracted_rooms,
        warnings=global_warnings,
        unmatched_labels=formatted_unmatched,
        total_usable_carpet_sqft=round(total_usable_carpet, 2)
    )
