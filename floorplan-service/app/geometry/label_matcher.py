import re
from typing import List, Dict, Any, Tuple
from shapely.geometry import Point
from .room_detection import RoomCandidate
from ..classification.room_classifier import classify_room_type

def clean_cad_text(text: str) -> str:
    """
    Cleans CAD MTEXT / TEXT formatting artifacts (e.g. \\A1;, \\P, {\\fArial|...}).
    """
    if not text:
        return ""
    # Strip MTEXT formatting codes like \A1;, \H10;, \P (newline)
    t = re.sub(r'\\A\d+;', '', text)
    t = re.sub(r'\\H[\d\.]+x?;', '', t)
    t = re.sub(r'\\W[\d\.]+;', '', t)
    t = re.sub(r'\\C\d+;', '', t)
    t = re.sub(r'\\F[^;]+;', '', t)
    t = re.sub(r'\\P', ' ', t)
    t = re.sub(r'\\[a-zA-Z0-9]+', ' ', t)
    t = re.sub(r'[\{\}]', '', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def match_labels_to_candidates(
    candidates: List[RoomCandidate],
    raw_labels: List[Dict[str, Any]]
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Associates CAD text labels with room candidate polygons via point-in-polygon queries.
    Returns:
      (matched_candidates_data, unmatched_labels)
    """
    # Clean and filter labels
    valid_labels = []
    for lbl in raw_labels:
        cleaned = clean_cad_text(lbl.get("text", ""))
        if cleaned and len(cleaned) >= 2:
            valid_labels.append({
                "text": cleaned,
                "x": float(lbl.get("x", 0)),
                "y": float(lbl.get("y", 0)),
                "layer": lbl.get("layer", ""),
                "matched": False
            })

    # Group candidate associations
    candidate_matches: Dict[int, List[Dict[str, Any]]] = {i: [] for i in range(len(candidates))}

    for lbl in valid_labels:
        pt = Point(lbl["x"], lbl["y"])
        # Find containing candidate
        matched_idx = None
        for i, cand in enumerate(candidates):
            if cand.is_container or cand.is_duplicate:
                continue
            if cand.polygon.contains(pt):
                matched_idx = i
                break

        if matched_idx is not None:
            candidate_matches[matched_idx].append(lbl)
            lbl["matched"] = True

    # Process matches per candidate
    unmatched_labels = [lbl for lbl in valid_labels if not lbl["matched"]]
    
    return candidate_matches, unmatched_labels
