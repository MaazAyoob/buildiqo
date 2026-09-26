import os
import re
import zlib
import math
from typing import Dict, Any, List, Tuple, Optional
from shapely.geometry import Polygon, box

from ..schemas import ExtractionResponse, ExtractedRoom, GeometryData, SourceMetadata
from ..geometry.room_detection import create_polygon_candidate, analyze_geometry_relationships
from ..geometry.label_matcher import match_labels_to_candidates
from ..classification.room_classifier import classify_room_type

def parse_pdf_streams(file_bytes: bytes) -> Tuple[List[str], bool, bool]:
    """
    Extracts text/operator streams from a PDF file.
    Identifies whether the document contains vector paths, text strings, and/or raster images.
    """
    streams: List[str] = []
    has_raster_image = False
    has_vector_paths = False

    # Check for raster image indicators in raw PDF dictionary
    if re.search(rb'/Subtype\s*/Image', file_bytes) or re.search(rb'/Filter\s*/DCTDecode', file_bytes):
        has_raster_image = True

    # Find all stream ... endstream blocks
    stream_matches = re.finditer(rb'stream[\r\n]+(.*?)[\r\n]+endstream', file_bytes, re.DOTALL)
    
    for match in stream_matches:
        raw_stream = match.group(1)
        decompressed = None

        # Attempt Flate decompression
        try:
            decompressed = zlib.decompress(raw_stream)
        except Exception:
            try:
                # Some PDFs use zlib raw deflate without header
                decompressed = zlib.decompress(raw_stream, -15)
            except Exception:
                decompressed = raw_stream

        if decompressed:
            try:
                text_stream = decompressed.decode('latin1', errors='ignore')
            except Exception:
                text_stream = ""

            if text_stream:
                streams.append(text_stream)
                # Check for vector geometry drawing operators in content stream
                if re.search(r'[-+]?\d*\.?\d+\s+[-+]?\d*\.?\d+\s+[-+]?\d*\.?\d+\s+[-+]?\d*\.?\d+\s+re\b', text_stream) or \
                   re.search(r'[-+]?\d*\.?\d+\s+[-+]?\d*\.?\d+\s+m\b.*?\b(?:l|c|v|y)\b.*?\b(?:h|s|S|f|F|B)\b', text_stream, re.DOTALL):
                    has_vector_paths = True

    return streams, has_raster_image, has_vector_paths

def extract_pdf_geometry(streams: List[str]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Parses vector polygons and text labels from PDF operator streams.
    """
    polygons: List[Dict[str, Any]] = []
    labels: List[Dict[str, Any]] = []

    # 1. Parse 're' (rectangle: x y width height re)
    re_pattern = re.compile(r'([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\s+re\b')
    
    # 2. Parse text blocks 'BT ... ET'
    bt_pattern = re.compile(r'BT\s*(.*?)\s*ET', re.DOTALL)
    
    # Position matrix in BT: Tm or Td
    pos_pattern = re.compile(r'([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\s+(?:Td|TD|[-+]?\d*\.?\d+\s+[-+]?\d*\.?\d+\s+Tm)')
    text_string_pattern = re.compile(r'\((.*?)\)\s*(?:Tj|\'|")')

    for stream in streams:
        # Extract rectangles
        for match in re_pattern.finditer(stream):
            try:
                x = float(match.group(1))
                y = float(match.group(2))
                w = float(match.group(3))
                h = float(match.group(4))
                if abs(w) >= 30.0 and abs(h) >= 30.0:  # Ignore tiny icon strokes
                    # Standardize top-left / positive dimensions
                    x1 = min(x, x + w)
                    x2 = max(x, x + w)
                    y1 = min(y, y + h)
                    y2 = max(y, y + h)
                    
                    # Convert to feet estimation (typical architectural scale: 10-25 pt / ft or normalized)
                    # Coordinates in standard points (1/72 in)
                    vertices = [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]]
                    polygons.append({
                        "vertices": vertices,
                        "layer": "PDF_VECTOR_RECTANGLE",
                        "handle": f"pdf_rect_{len(polygons)}"
                    })
            except (ValueError, IndexError):
                continue

        # Extract text labels
        for bt_match in bt_pattern.finditer(stream):
            block = bt_match.group(1)
            # Find placement coordinates
            x_pos = 0.0
            y_pos = 0.0
            pos_m = pos_pattern.search(block)
            if pos_m:
                try:
                    x_pos = float(pos_m.group(1))
                    y_pos = float(pos_m.group(2))
                except (ValueError, IndexError):
                    pass

            # Extract string content
            for t_match in text_string_pattern.finditer(block):
                raw_text = t_match.group(1).strip()
                # Clean octal or escaped chars
                clean_text = re.sub(r'\\[0-7]{3}', '', raw_text)
                clean_text = clean_text.replace('\\(', '(').replace('\\)', ')').replace('\\\\', '\\').strip()
                if len(clean_text) >= 2 and not clean_text.isdigit():
                    labels.append({
                        "text": clean_text,
                        "x": x_pos,
                        "y": y_pos,
                        "layer": "PDF_TEXT_LABELS"
                    })

    return polygons, labels

def extract_pdf_floorplan(file_bytes: bytes, original_filename: str) -> ExtractionResponse:
    """
    Authoritative PDF floor-plan extractor.
    Enforces strict distinction between vector PDFs and scanned/raster PDFs.
    """
    if not file_bytes or len(file_bytes) == 0:
        raise ValueError("Uploaded PDF file is empty.")

    streams, has_raster, has_vector = parse_pdf_streams(file_bytes)

    # Scanned PDF protection: Do NOT hallucinate geometry from a bitmap scan
    if not has_vector and (has_raster or not streams):
        raise ValueError(
            "Scanned / raster PDF detected. Vector floor plan extraction requires CAD-exported "
            "vector geometry. Scanned blueprints are unsupported for automatic geometric boundary extraction. "
            "Please upload an AutoCAD .dxf / .dwg drawing or enter room specifications directly in Step 2."
        )

    raw_polys, raw_labels = extract_pdf_geometry(streams)

    if not raw_polys and not has_vector:
        raise ValueError(
            "No extractable vector room geometry detected in PDF. "
            "The document does not contain closed CAD boundary vector paths."
        )

    # Determine scaling factor to normalize points into feet
    # In CAD PDFs, a 10-15 ft room is commonly 200-500 points across
    scale_factor = 1.0
    if raw_polys:
        sample_w = max(abs(p["vertices"][1][0] - p["vertices"][0][0]) for p in raw_polys)
        if sample_w > 100.0:
            # Scale points to reasonable residential room feet (approx 15-25 points per foot)
            scale_factor = 18.0

    scaled_polys = []
    for p in raw_polys:
        sv = [[round(pt[0] / scale_factor, 1), round(pt[1] / scale_factor, 1)] for pt in p["vertices"]]
        scaled_polys.append({
            "vertices": sv,
            "layer": p["layer"],
            "handle": p["handle"]
        })

    scaled_labels = []
    for l in raw_labels:
        scaled_labels.append({
            "text": l["text"],
            "x": round(l["x"] / scale_factor, 1),
            "y": round(l["y"] / scale_factor, 1),
            "layer": l["layer"]
        })

    # Build candidates
    candidates = []
    for p in scaled_polys:
        cand = create_polygon_candidate(
            vertices=p["vertices"],
            layer=p["layer"],
            entity_handle=p["handle"]
        )
        if cand:
            candidates.append(cand)

    global_warnings: List[str] = []
    if not candidates:
        global_warnings.append("No valid closed room boundary polygons could be reconstructed from PDF vectors.")

    # Containment and relationship analysis
    analyze_geometry_relationships(candidates)

    # Match labels to polygons
    candidate_matches, unmatched_labels = match_labels_to_candidates(candidates, scaled_labels)

    extracted_rooms: List[ExtractedRoom] = []
    total_usable_carpet = 0.0
    room_counter = 1

    for i, cand in enumerate(candidates):
        matches = candidate_matches.get(i, [])
        if matches:
            primary_label = matches[0]["text"]
            room_name = primary_label
            room_type = classify_room_type(primary_label)
        else:
            room_name = f"Extracted Space {room_counter}"
            room_type = "living" if cand.area >= 180.0 else ("regular_bed" if cand.area >= 100.0 else "common_bath")
            room_counter += 1

        width_ft = round(cand.bbox_width, 1)
        length_ft = round(cand.bbox_length, 1)
        area_sqft = round(cand.area, 1)

        if not cand.is_container and not cand.is_duplicate:
            total_usable_carpet += area_sqft

        geom_data = GeometryData(
            x=round(cand.minx, 1),
            y=round(cand.miny, 1),
            width=width_ft,
            length=length_ft,
            polygon=cand.exterior_coords,
            doors=[],
            windows=[]
        )

        extracted_rooms.append(ExtractedRoom(
            id=f"pdf_room_{i+1}",
            name=room_name,
            type=room_type,
            width_ft=width_ft,
            length_ft=length_ft,
            area_sqft=area_sqft,
            area_method="POLYGON_AREA",
            dimension_method="MIN_ROTATED_BOUNDING_BOX",
            count=1,
            confidence="MEDIUM" if matches else "LOW",
            source="PDF_VECTOR_EXTRACTION",
            warnings=list(cand.warnings),
            geometry=geom_data
        ))

    source_meta = SourceMetadata(
        filename=original_filename,
        file_type="PDF",
        units="feet",
        unit_confidence="MEDIUM"
    )

    return ExtractionResponse(
        success=True,
        source=source_meta,
        rooms=extracted_rooms,
        warnings=global_warnings,
        unmatched_labels=unmatched_labels,
        total_usable_carpet_sqft=round(total_usable_carpet, 1)
    )
