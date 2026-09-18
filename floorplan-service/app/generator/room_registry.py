"""
Buildiqo.AI - Phase 2.0 AI Floor Plan Generator
Controlled Room-Type Registry and Architectural Constants.
"""
from typing import Dict, List, Optional, Any
from pydantic import BaseModel

class RoomDefinition(BaseModel):
    code: str
    name: str
    category: str  # 'living', 'bedroom', 'utility', 'bath', 'outdoor', 'circulation', 'special'
    min_width_ft: float
    min_length_ft: float
    min_area_sqft: float
    target_area_sqft: float
    tolerance_pct: float = 0.25
    preferred_aspect_ratio: float = 1.25
    max_aspect_ratio: float = 2.0
    is_habitable: bool = True
    default_floor: int = 0  # 0: ground, 1: upper
    vastu_preferred_zone: str  # NE, SE, SW, NW, N, S, E, W, CENTER
    allowed_floors: List[int] = [0, 1, 2, 3]
    zone_type: str = "public"  # 'public', 'private', 'service', 'special'
    requires_exterior_window: bool = True

# Canonical Controlled Room Type Registry
ROOM_REGISTRY: Dict[str, RoomDefinition] = {
    "living": RoomDefinition(
        code="living",
        name="Living Room",
        category="living",
        min_width_ft=10.0,
        min_length_ft=12.0,
        min_area_sqft=150.0,
        target_area_sqft=180.0,
        tolerance_pct=0.25,
        preferred_aspect_ratio=1.2,
        max_aspect_ratio=1.85,
        is_habitable=True,
        default_floor=0,
        vastu_preferred_zone="NE",
        allowed_floors=[0, 1],
        zone_type="public",
        requires_exterior_window=True
    ),
    "dining": RoomDefinition(
        code="dining",
        name="Dining Room",
        category="living",
        min_width_ft=9.0,
        min_length_ft=10.0,
        min_area_sqft=100.0,
        target_area_sqft=120.0,
        tolerance_pct=0.25,
        preferred_aspect_ratio=1.2,
        max_aspect_ratio=1.85,
        is_habitable=True,
        default_floor=0,
        vastu_preferred_zone="E",
        allowed_floors=[0, 1],
        zone_type="public",
        requires_exterior_window=True
    ),
    "kitchen": RoomDefinition(
        code="kitchen",
        name="Kitchen",
        category="utility",
        min_width_ft=8.0,
        min_length_ft=9.0,
        min_area_sqft=80.0,
        target_area_sqft=95.0,
        tolerance_pct=0.25,
        preferred_aspect_ratio=1.2,
        max_aspect_ratio=1.85,
        is_habitable=True,
        default_floor=0,
        vastu_preferred_zone="SE",
        allowed_floors=[0, 1],
        zone_type="service",
        requires_exterior_window=True
    ),
    "master_bed": RoomDefinition(
        code="master_bed",
        name="Master Bedroom",
        category="bedroom",
        min_width_ft=11.0,
        min_length_ft=12.0,
        min_area_sqft=140.0,
        target_area_sqft=165.0,
        tolerance_pct=0.25,
        preferred_aspect_ratio=1.15,
        max_aspect_ratio=1.85,
        is_habitable=True,
        default_floor=1,
        vastu_preferred_zone="SW",
        allowed_floors=[0, 1, 2],
        zone_type="private",
        requires_exterior_window=True
    ),
    "regular_bed": RoomDefinition(
        code="regular_bed",
        name="Bedroom",
        category="bedroom",
        min_width_ft=10.0,
        min_length_ft=10.0,
        min_area_sqft=110.0,
        target_area_sqft=130.0,
        tolerance_pct=0.25,
        preferred_aspect_ratio=1.1,
        max_aspect_ratio=1.85,
        is_habitable=True,
        default_floor=1,
        vastu_preferred_zone="NW",
        allowed_floors=[0, 1, 2],
        zone_type="private",
        requires_exterior_window=True
    ),
    "attached_bath": RoomDefinition(
        code="attached_bath",
        name="Attached Bathroom",
        category="bath",
        min_width_ft=5.0,
        min_length_ft=6.0,
        min_area_sqft=35.0,
        target_area_sqft=42.0,
        tolerance_pct=0.20,
        preferred_aspect_ratio=1.3,
        max_aspect_ratio=2.2,
        is_habitable=False,
        default_floor=1,
        vastu_preferred_zone="NW",
        allowed_floors=[0, 1, 2],
        zone_type="private",
        requires_exterior_window=False
    ),
    "common_bath": RoomDefinition(
        code="common_bath",
        name="Common Bathroom",
        category="bath",
        min_width_ft=5.0,
        min_length_ft=6.0,
        min_area_sqft=35.0,
        target_area_sqft=42.0,
        tolerance_pct=0.20,
        preferred_aspect_ratio=1.3,
        max_aspect_ratio=2.2,
        is_habitable=False,
        default_floor=0,
        vastu_preferred_zone="NW",
        allowed_floors=[0, 1, 2],
        zone_type="service",
        requires_exterior_window=False
    ),
    "puja": RoomDefinition(
        code="puja",
        name="Puja Room",
        category="special",
        min_width_ft=5.0,
        min_length_ft=5.0,
        min_area_sqft=25.0,
        target_area_sqft=30.0,
        tolerance_pct=0.20,
        preferred_aspect_ratio=1.0,
        max_aspect_ratio=2.0,
        is_habitable=False,
        default_floor=0,
        vastu_preferred_zone="NE",
        allowed_floors=[0, 1],
        zone_type="special",
        requires_exterior_window=False
    ),
    "utility": RoomDefinition(
        code="utility",
        name="Utility / Wash",
        category="utility",
        min_width_ft=4.5,
        min_length_ft=6.0,
        min_area_sqft=30.0,
        target_area_sqft=36.0,
        tolerance_pct=0.20,
        preferred_aspect_ratio=1.3,
        max_aspect_ratio=2.2,
        is_habitable=False,
        default_floor=0,
        vastu_preferred_zone="SE",
        allowed_floors=[0, 1],
        zone_type="service",
        requires_exterior_window=False
    ),
    "balcony": RoomDefinition(
        code="balcony",
        name="Balcony",
        category="outdoor",
        min_width_ft=4.0,
        min_length_ft=8.0,
        min_area_sqft=35.0,
        target_area_sqft=45.0,
        tolerance_pct=0.30,
        preferred_aspect_ratio=2.0,
        max_aspect_ratio=2.5,
        is_habitable=False,
        default_floor=1,
        vastu_preferred_zone="N",
        allowed_floors=[1, 2],
        zone_type="special",
        requires_exterior_window=True
    ),
    "parking": RoomDefinition(
        code="parking",
        name="Parking / Porch",
        category="circulation",
        min_width_ft=10.0,
        min_length_ft=14.0,
        min_area_sqft=140.0,
        target_area_sqft=150.0,
        tolerance_pct=0.25,
        preferred_aspect_ratio=1.4,
        max_aspect_ratio=2.0,
        is_habitable=False,
        default_floor=0,
        vastu_preferred_zone="NW",
        allowed_floors=[0],
        zone_type="service",
        requires_exterior_window=True
    ),
    "staircase": RoomDefinition(
        code="staircase",
        name="Staircase Core",
        category="circulation",
        min_width_ft=6.5,
        min_length_ft=10.0,
        min_area_sqft=70.0,
        target_area_sqft=80.0,
        tolerance_pct=0.15,
        preferred_aspect_ratio=1.5,
        max_aspect_ratio=2.0,
        is_habitable=False,
        default_floor=0,
        vastu_preferred_zone="S",
        allowed_floors=[0, 1, 2, 3],
        zone_type="special",
        requires_exterior_window=False
    ),
    "office": RoomDefinition(
        code="office",
        name="Study / Office",
        category="special",
        min_width_ft=8.0,
        min_length_ft=9.0,
        min_area_sqft=80.0,
        target_area_sqft=95.0,
        tolerance_pct=0.25,
        preferred_aspect_ratio=1.1,
        max_aspect_ratio=1.85,
        is_habitable=True,
        default_floor=0,
        vastu_preferred_zone="W",
        allowed_floors=[0, 1, 2],
        zone_type="private",
        requires_exterior_window=True
    )
}

# Alias dictionary to normalize common synonyms into registry codes
ROOM_TYPE_ALIASES: Dict[str, str] = {
    "living_room": "living",
    "hall": "living",
    "drawing_room": "living",
    "lounge": "living",
    "living": "living",
    "dining_room": "dining",
    "dining": "dining",
    "kitchen": "kitchen",
    "master_bedroom": "master_bed",
    "master_bed": "master_bed",
    "main_bedroom": "master_bed",
    "master": "master_bed",
    "bedroom": "regular_bed",
    "bed": "regular_bed",
    "regular_bed": "regular_bed",
    "guest_room": "regular_bed",
    "guest_bed": "regular_bed",
    "bathroom": "common_bath",
    "bath": "common_bath",
    "common_bath": "common_bath",
    "toilet": "common_bath",
    "washroom": "common_bath",
    "attached_bathroom": "attached_bath",
    "attached_bath": "attached_bath",
    "ensuite": "attached_bath",
    "pooja": "puja",
    "pooja_room": "puja",
    "puja_room": "puja",
    "prayer_room": "puja",
    "mandir": "puja",
    "puja": "puja",
    "utility": "utility",
    "wash_area": "utility",
    "dry_balcony": "utility",
    "balcony": "balcony",
    "deck": "balcony",
    "verandah": "balcony",
    "parking": "parking",
    "car_parking": "parking",
    "porch": "parking",
    "garage": "parking",
    "staircase": "staircase",
    "stairs": "staircase",
    "office": "office",
    "study": "office",
    "study_room": "office"
}

def normalize_room_type(type_str: str) -> str:
    """Resolves an incoming room type name to a canonical registry key."""
    if not type_str:
        return "regular_bed"
    clean = type_str.strip().lower().replace("-", "_").replace(" ", "_")
    return ROOM_TYPE_ALIASES.get(clean, "regular_bed" if "bed" in clean else "living")

def get_room_definition(canonical_type: str) -> RoomDefinition:
    """Returns the definition for a room type, falling back safely."""
    return ROOM_REGISTRY.get(canonical_type, ROOM_REGISTRY["regular_bed"])
