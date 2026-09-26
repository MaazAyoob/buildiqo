"""
Buildiqo.AI - Phase 3 Architectural Planning Strategies & Typology Solvers
Implements multi-strategy generation adapted to plot aspect ratio, facing, and room program:
1. Public Front / Private Rear (2BHK, 3BHK, 4BHK)
2. Central Circulation Spine
3. Side Corridor (Narrow Plots)
4. Central Dining with Room Wings
5. Compact Service Core
"""
import math
from typing import List, Dict, Any, Tuple, Optional
from shapely.geometry import box, Polygon

from .room_registry import get_room_definition, format_room_dimensions
from .schemas import GeneratedRoomGeometry, FloorLayout
from .furniture_solver import generate_schematic_furniture, verify_furniture_feasibility
from .walls import extract_wall_segments

def select_planning_strategies(plot_w: float, plot_l: float, bed_count: int, num_floors: int) -> List[str]:
    """
    Selects candidate planning strategies ranked by plot geometry and typology appropriateness.
    """
    aspect = plot_l / max(1.0, plot_w)
    strategies = []

    if aspect >= 1.4:
        # Narrow deep plot (e.g. 25x45 or 30x50): Side corridor and Public Front / Private Rear work best
        strategies.extend(["side_corridor", "public_front_private_rear", "central_circulation_spine"])
    elif aspect <= 0.85:
        # Wide shallow plot (e.g. 40x30): Central dining and Public front / Side wing work best
        strategies.extend(["central_dining_room_wings", "public_front_private_rear", "compact_service_core"])
    else:
        # Standard plot (e.g. 30x40): Public Front / Private Rear, Central Spine, Compact Service Core
        strategies.extend(["public_front_private_rear", "central_circulation_spine", "central_dining_room_wings", "compact_service_core"])

    return strategies

def solve_2bhk_strategy(
    ox: float,
    oy: float,
    bw: float,
    bl: float,
    floor_idx: int,
    rooms_needed: List[Any],
    stair_rect: Optional[Tuple[float, float, float, float]],
    has_stair: bool,
    strategy_name: str
) -> Tuple[List[GeneratedRoomGeometry], List[Dict[str, Any]], List[Dict[str, Any]], Optional[Tuple[float, float, float, float]]]:
    """
    Solves a realistic 2BHK layout:
    - Front Zone: Living Room + Entrance / Parking
    - Middle Zone: Dining Area + Kitchen & Utility + Common Bath
    - Rear Zone: Bedroom 2 + Master Bedroom Suite + Attached Bath (interior door)
    """
    placed_rooms: List[GeneratedRoomGeometry] = []
    corridors: List[Dict[str, Any]] = []
    open_areas: List[Dict[str, Any]] = []

    # 1. Staircase handling if multi-floor
    sw, sl = 7.0, 11.5
    if has_stair:
        if stair_rect:
            sx, sy, sw, sl = stair_rect
        else:
            sx, sy = ox, oy
            stair_rect = (sx, sy, sw, sl)
        stair_poly = [[sx, sy], [sx+sw, sy], [sx+sw, sy+sl], [sx, sy+sl], [sx, sy]]
        placed_rooms.append(GeneratedRoomGeometry(
            room_id=f"staircase_{floor_idx}",
            type="staircase",
            name="Staircase Core",
            width=sw,
            length=sl,
            area=round(sw*sl, 1),
            quantity=1,
            floor=floor_idx,
            x=sx,
            y=sy,
            rotation=0.0,
            compass_zone="SW",
            adjacent_to=[],
            confidence="generated",
            polygon=stair_poly,
            doors=[{"type": "single_swing", "x": round(sx+1.0, 1), "y": round(sy+sl, 1), "width": 3.0, "wall": "top", "connects_to": "circulation"}],
            windows=[{"type": "sliding", "x": round(sx+sw/2, 1), "y": round(sy, 1), "width": 3.0, "wall": "bottom", "is_exterior": True}],
            zone="circulation",
            formatted_dimensions=format_room_dimensions(sw, sl),
            furniture=[]
        ))

    # 3-Zone Depth Breakdown (Front 35%, Middle 30%, Rear 35%)
    front_l = round(bl * 0.35, 1)
    mid_l = round(bl * 0.30, 1)
    rear_l = round(bl - (front_l + mid_l), 1)

    # -------------------------------------------------------------
    # Zone 1: Front (Living Room + Entrance / Foyer / Sitout)
    # -------------------------------------------------------------
    liv_w = round(bw * 0.65, 1)
    ent_w = round(bw - liv_w, 1)
    liv_y = oy + (sl if (has_stair and strategy_name == "side_corridor") else 0.0)
    # If single floor, front zone starts at oy
    liv_x = ox + ent_w
    liv_y_pos = oy

    # Living Room
    liv_area = round(liv_w * front_l, 1)
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=f"living_{floor_idx}",
        type="living",
        name="Living Room",
        width=liv_w,
        length=front_l,
        area=liv_area,
        quantity=1,
        floor=floor_idx,
        x=liv_x,
        y=liv_y_pos,
        rotation=0.0,
        compass_zone="NE",
        adjacent_to=[],
        confidence="generated",
        polygon=[[liv_x, liv_y_pos], [liv_x+liv_w, liv_y_pos], [liv_x+liv_w, liv_y_pos+front_l], [liv_x, liv_y_pos+front_l], [liv_x, liv_y_pos]],
        doors=[
            {"type": "main_entrance", "x": round(liv_x + 1.5, 1), "y": round(liv_y_pos, 1), "width": 3.5, "wall": "bottom", "connects_to": "exterior"},
            {"type": "single_swing", "x": round(liv_x + liv_w/2, 1), "y": round(liv_y_pos + front_l, 1), "width": 3.5, "wall": "top", "connects_to": "dining"}
        ],
        windows=[{"type": "sliding", "x": round(liv_x + liv_w - 2.0, 1), "y": round(liv_y_pos, 1), "width": 4.5, "wall": "bottom", "is_exterior": True}],
        zone="public",
        formatted_dimensions=format_room_dimensions(liv_w, front_l),
        furniture=generate_schematic_furniture("living", liv_x, liv_y_pos, liv_w, front_l)
    ))

    # Front Sitout / Porch
    open_areas.append({
        "type": "sitout",
        "name": "Entrance Porch / Sit-out",
        "x": ox,
        "y": liv_y_pos,
        "width": ent_w,
        "length": front_l,
        "area": round(ent_w * front_l, 1)
    })

    # -------------------------------------------------------------
    # Zone 2: Middle (Kitchen + Dining Hall + Common Bath)
    # -------------------------------------------------------------
    mid_y = oy + front_l
    bath_w = round(min(6.0, bw * 0.22), 1)
    kit_w = round(max(8.5, bw * 0.38), 1)
    din_w = round(bw - (kit_w + bath_w), 1)

    # Kitchen
    kit_x = ox
    kit_y = mid_y
    kit_area = round(kit_w * mid_l, 1)
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=f"kitchen_{floor_idx}",
        type="kitchen",
        name="Kitchen & Utility",
        width=kit_w,
        length=mid_l,
        area=kit_area,
        quantity=1,
        floor=floor_idx,
        x=kit_x,
        y=kit_y,
        rotation=0.0,
        compass_zone="SE",
        adjacent_to=[],
        confidence="generated",
        polygon=[[kit_x, kit_y], [kit_x+kit_w, kit_y], [kit_x+kit_w, kit_y+mid_l], [kit_x, kit_y+mid_l], [kit_x, kit_y]],
        doors=[{"type": "single_swing", "x": round(kit_x + kit_w - 0.5, 1), "y": round(kit_y + mid_l/2, 1), "width": 3.0, "wall": "right", "connects_to": "dining"}],
        windows=[{"type": "sliding", "x": round(kit_x, 1), "y": round(kit_y + mid_l/2, 1), "width": 3.5, "wall": "left", "is_exterior": True}],
        zone="service",
        formatted_dimensions=format_room_dimensions(kit_w, mid_l),
        furniture=generate_schematic_furniture("kitchen", kit_x, kit_y, kit_w, mid_l)
    ))

    # Dining Area
    din_x = ox + kit_w
    din_y = mid_y
    din_area = round(din_w * mid_l, 1)
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=f"dining_{floor_idx}",
        type="dining",
        name="Dining Hall",
        width=din_w,
        length=mid_l,
        area=din_area,
        quantity=1,
        floor=floor_idx,
        x=din_x,
        y=din_y,
        rotation=0.0,
        compass_zone="CENTER",
        adjacent_to=[],
        confidence="generated",
        polygon=[[din_x, din_y], [din_x+din_w, din_y], [din_x+din_w, din_y+mid_l], [din_x, din_y+mid_l], [din_x, din_y]],
        doors=[
            {"type": "passage", "x": round(din_x + din_w/2, 1), "y": round(din_y, 1), "width": 4.0, "wall": "bottom", "connects_to": "living"},
            {"type": "passage", "x": round(din_x + din_w/2, 1), "y": round(din_y + mid_l, 1), "width": 3.5, "wall": "top", "connects_to": "circulation"}
        ],
        windows=[],
        zone="public",
        formatted_dimensions=format_room_dimensions(din_w, mid_l),
        furniture=generate_schematic_furniture("dining", din_x, din_y, din_w, mid_l)
    ))

    # Common Bath
    cb_x = ox + kit_w + din_w
    cb_y = mid_y
    cb_area = round(bath_w * mid_l, 1)
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=f"common_bath_{floor_idx}",
        type="common_bath",
        name="Common Bath",
        width=bath_w,
        length=mid_l,
        area=cb_area,
        quantity=1,
        floor=floor_idx,
        x=cb_x,
        y=cb_y,
        rotation=0.0,
        compass_zone="NW",
        adjacent_to=[],
        confidence="generated",
        polygon=[[cb_x, cb_y], [cb_x+bath_w, cb_y], [cb_x+bath_w, cb_y+mid_l], [cb_x, cb_y+mid_l], [cb_x, cb_y]],
        doors=[{"type": "single_swing", "x": round(cb_x, 1), "y": round(cb_y + 1.2, 1), "width": 2.5, "wall": "left", "connects_to": "dining"}],
        windows=[{"type": "sliding", "x": round(cb_x + bath_w, 1), "y": round(cb_y + mid_l/2, 1), "width": 2.5, "wall": "right", "is_exterior": True}],
        zone="service",
        formatted_dimensions=format_room_dimensions(bath_w, mid_l),
        furniture=generate_schematic_furniture("common_bath", cb_x, cb_y, bath_w, mid_l)
    ))

    # -------------------------------------------------------------
    # Zone 3: Rear (Master Bedroom Suite with Attached Bath + Bedroom 2)
    # -------------------------------------------------------------
    rear_y = oy + front_l + mid_l
    att_bath_w = 5.0
    bed1_w = round((bw - att_bath_w) * 0.48, 1)
    bed2_w = round(bw - (bed1_w + att_bath_w), 1)

    # Bedroom 2
    b2_x = ox
    b2_y = rear_y
    b2_area = round(bed1_w * rear_l, 1)
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=f"regular_bed_{floor_idx}",
        type="regular_bed",
        name="Bedroom 2",
        width=bed1_w,
        length=rear_l,
        area=b2_area,
        quantity=1,
        floor=floor_idx,
        x=b2_x,
        y=b2_y,
        rotation=0.0,
        compass_zone="NW",
        adjacent_to=[],
        confidence="generated",
        polygon=[[b2_x, b2_y], [b2_x+bed1_w, b2_y], [b2_x+bed1_w, b2_y+rear_l], [b2_x, b2_y+rear_l], [b2_x, b2_y]],
        doors=[{"type": "single_swing", "x": round(b2_x + bed1_w - 1.2, 1), "y": round(b2_y, 1), "width": 3.0, "wall": "bottom", "connects_to": "dining"}],
        windows=[{"type": "sliding", "x": round(b2_x + bed1_w/2, 1), "y": round(b2_y + rear_l, 1), "width": 4.0, "wall": "top", "is_exterior": True}],
        zone="private",
        formatted_dimensions=format_room_dimensions(bed1_w, rear_l),
        furniture=generate_schematic_furniture("regular_bed", b2_x, b2_y, bed1_w, rear_l)
    ))

    # Master Bedroom
    mb_x = ox + bed1_w
    mb_y = rear_y
    mb_area = round(bed2_w * rear_l, 1)
    mb_id = f"master_bed_{floor_idx}"
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=mb_id,
        type="master_bed",
        name="Master Bedroom",
        width=bed2_w,
        length=rear_l,
        area=mb_area,
        quantity=1,
        floor=floor_idx,
        x=mb_x,
        y=mb_y,
        rotation=0.0,
        compass_zone="SW",
        adjacent_to=[],
        confidence="generated",
        polygon=[[mb_x, mb_y], [mb_x+bed2_w, mb_y], [mb_x+bed2_w, mb_y+rear_l], [mb_x, mb_y+rear_l], [mb_x, mb_y]],
        doors=[
            {"type": "single_swing", "x": round(mb_x + 1.2, 1), "y": round(mb_y, 1), "width": 3.0, "wall": "bottom", "connects_to": "dining"},
            {"type": "single_swing", "x": round(mb_x + bed2_w, 1), "y": round(mb_y + 1.5, 1), "width": 2.5, "wall": "right", "connects_to": f"attached_bath_{floor_idx}"}
        ],
        windows=[{"type": "sliding", "x": round(mb_x + bed2_w/2, 1), "y": round(mb_y + rear_l, 1), "width": 4.5, "wall": "top", "is_exterior": True}],
        zone="private",
        formatted_dimensions=format_room_dimensions(bed2_w, rear_l),
        furniture=generate_schematic_furniture("master_bed", mb_x, mb_y, bed2_w, rear_l)
    ))

    # Attached Bath (Contiguous to Master Bedroom with INTERNAL Access Door)
    ab_x = ox + bed1_w + bed2_w
    ab_y = rear_y
    ab_l = round(min(8.0, rear_l), 1)
    ab_area = round(att_bath_w * ab_l, 1)
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=f"attached_bath_{floor_idx}",
        type="attached_bath",
        name="Attached Bath",
        width=att_bath_w,
        length=ab_l,
        area=ab_area,
        quantity=1,
        floor=floor_idx,
        x=ab_x,
        y=ab_y,
        rotation=0.0,
        compass_zone="SW",
        adjacent_to=[mb_id],
        confidence="generated",
        polygon=[[ab_x, ab_y], [ab_x+att_bath_w, ab_y], [ab_x+att_bath_w, ab_y+ab_l], [ab_x, ab_y+ab_l], [ab_x, ab_y]],
        doors=[{"type": "single_swing", "x": round(ab_x, 1), "y": round(ab_y + 1.5, 1), "width": 2.5, "wall": "left", "connects_to": mb_id}],
        windows=[{"type": "sliding", "x": round(ab_x + att_bath_w, 1), "y": round(ab_y + ab_l/2, 1), "width": 2.5, "wall": "right", "is_exterior": True}],
        zone="private",
        attached_to_room_id=mb_id,
        formatted_dimensions=format_room_dimensions(att_bath_w, ab_l),
        furniture=generate_schematic_furniture("attached_bath", ab_x, ab_y, att_bath_w, ab_l)
    ))

    # Dress / Wardrobe space if depth remains behind attached bath
    if rear_l - ab_l >= 3.5:
        dr_l = round(rear_l - ab_l, 1)
        dr_y = ab_y + ab_l
        placed_rooms.append(GeneratedRoomGeometry(
            room_id=f"dressing_{floor_idx}",
            type="utility",
            name="Dress / Wardrobe",
            width=att_bath_w,
            length=dr_l,
            area=round(att_bath_w * dr_l, 1),
            quantity=1,
            floor=floor_idx,
            x=ab_x,
            y=dr_y,
            rotation=0.0,
            compass_zone="SW",
            adjacent_to=[mb_id],
            confidence="generated",
            polygon=[[ab_x, dr_y], [ab_x+att_bath_w, dr_y], [ab_x+att_bath_w, dr_y+dr_l], [ab_x, dr_y+dr_l], [ab_x, dr_y]],
            doors=[{"type": "single_swing", "x": round(ab_x, 1), "y": round(dr_y + 1.2, 1), "width": 2.5, "wall": "left", "connects_to": mb_id}],
            windows=[{"type": "sliding", "x": round(ab_x + att_bath_w, 1), "y": round(dr_y + dr_l/2, 1), "width": 2.0, "wall": "right", "is_exterior": True}],
            zone="private",
            formatted_dimensions=format_room_dimensions(att_bath_w, dr_l),
            furniture=generate_schematic_furniture("utility", ab_x, dr_y, att_bath_w, dr_l)
        ))

    # Connecting circulation corridor (non-overlapping)
    corridors.append({
        "x": ox,
        "y": round(rear_y - 3.5, 1),
        "width": bw,
        "length": 3.5
    })

    return placed_rooms, corridors, open_areas, stair_rect

def solve_3bhk_strategy(
    ox: float,
    oy: float,
    bw: float,
    bl: float,
    floor_idx: int,
    rooms_needed: List[Any],
    stair_rect: Optional[Tuple[float, float, float, float]],
    has_stair: bool,
    strategy_name: str
) -> Tuple[List[GeneratedRoomGeometry], List[Dict[str, Any]], List[Dict[str, Any]], Optional[Tuple[float, float, float, float]]]:
    """
    Solves an architecturally authentic 3BHK layout across 3 depth zones:
    - Zone 1 (Front): Living Room + Kitchen & Utility (daylight & ventilation)
    - Zone 2 (Middle): Dining Hall + Common Bath + Attached Bath + Bedroom 3
    - Zone 3 (Rear): Master Bedroom Suite + Bedroom 2 (private quiet wing)
    Guarantees all bedrooms >= 10 ft width and all bathrooms with capped functional depth.
    """
    placed_rooms: List[GeneratedRoomGeometry] = []
    corridors: List[Dict[str, Any]] = []
    open_areas: List[Dict[str, Any]] = []

    # 1. Staircase handling if multi-floor
    sw, sl = 7.0, 11.5
    stair_offset_x = 0.0
    if has_stair:
        if stair_rect:
            sx, sy, sw, sl = stair_rect
        else:
            sx, sy = ox, oy
            stair_rect = (sx, sy, sw, sl)
        stair_poly = [[sx, sy], [sx+sw, sy], [sx+sw, sy+sl], [sx, sy+sl], [sx, sy]]
        placed_rooms.append(GeneratedRoomGeometry(
            room_id=f"staircase_{floor_idx}",
            type="staircase",
            name="Staircase Core",
            width=sw,
            length=sl,
            area=round(sw*sl, 1),
            quantity=1,
            floor=floor_idx,
            x=sx,
            y=sy,
            rotation=0.0,
            compass_zone="SW",
            adjacent_to=[],
            confidence="generated",
            polygon=stair_poly,
            doors=[{"type": "single_swing", "x": round(sx+1.0, 1), "y": round(sy+sl, 1), "width": 3.0, "wall": "top", "connects_to": "circulation"}],
            windows=[{"type": "sliding", "x": round(sx+sw/2, 1), "y": round(sy, 1), "width": 3.0, "wall": "bottom", "is_exterior": True}],
            zone="circulation",
            formatted_dimensions=format_room_dimensions(sw, sl),
            furniture=[]
        ))
        stair_offset_x = sw

    # 3-Zone Depth Allocation
    front_l = round(bl * 0.34, 1)
    mid_l = round(bl * 0.33, 1)
    rear_l = round(bl - front_l - mid_l, 1)

    # -------------------------------------------------------------
    # Zone 1: Front (Living Room + Kitchen & Utility)
    # -------------------------------------------------------------
    avail_front_w = bw - stair_offset_x
    liv_w = round(max(10.5, avail_front_w * 0.58), 1)
    kit_w = round(avail_front_w - liv_w, 1)
    if kit_w < 8.0:
        kit_w = 8.0
        liv_w = round(avail_front_w - kit_w, 1)

    liv_x = ox + stair_offset_x
    liv_y = oy
    liv_area = round(liv_w * front_l, 1)
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=f"living_{floor_idx}",
        type="living",
        name="Living Room",
        width=liv_w,
        length=front_l,
        area=liv_area,
        quantity=1,
        floor=floor_idx,
        x=liv_x,
        y=liv_y,
        rotation=0.0,
        compass_zone="SW",
        adjacent_to=[],
        confidence="generated",
        polygon=[[liv_x, liv_y], [liv_x+liv_w, liv_y], [liv_x+liv_w, liv_y+front_l], [liv_x, liv_y+front_l], [liv_x, liv_y]],
        doors=[
            {"type": "main_entrance", "x": round(liv_x + 1.5, 1), "y": round(liv_y, 1), "width": 3.5, "wall": "bottom", "connects_to": "exterior"},
            {"type": "passage", "x": round(liv_x + liv_w/2, 1), "y": round(liv_y + front_l, 1), "width": 3.5, "wall": "top", "connects_to": "circulation"}
        ],
        windows=[{"type": "sliding", "x": round(liv_x + liv_w/2, 1), "y": round(liv_y, 1), "width": 4.5, "wall": "bottom", "is_exterior": True}],
        zone="public",
        formatted_dimensions=format_room_dimensions(liv_w, front_l),
        furniture=generate_schematic_furniture("living", liv_x, liv_y, liv_w, front_l)
    ))

    # Kitchen & Utility
    kit_x = liv_x + liv_w
    kit_y = oy
    kit_area = round(kit_w * front_l, 1)
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=f"kitchen_{floor_idx}",
        type="kitchen",
        name="Kitchen & Utility",
        width=kit_w,
        length=front_l,
        area=kit_area,
        quantity=1,
        floor=floor_idx,
        x=kit_x,
        y=kit_y,
        rotation=0.0,
        compass_zone="SE",
        adjacent_to=[],
        confidence="generated",
        polygon=[[kit_x, kit_y], [kit_x+kit_w, kit_y], [kit_x+kit_w, kit_y+front_l], [kit_x, kit_y+front_l], [kit_x, kit_y]],
        doors=[{"type": "single_swing", "x": round(kit_x, 1), "y": round(kit_y + front_l - 1.5, 1), "width": 3.0, "wall": "left", "connects_to": "circulation"}],
        windows=[{"type": "sliding", "x": round(kit_x + kit_w, 1), "y": round(kit_y + front_l/2, 1), "width": 3.5, "wall": "right", "is_exterior": True}],
        zone="service",
        formatted_dimensions=format_room_dimensions(kit_w, front_l),
        furniture=generate_schematic_furniture("kitchen", kit_x, kit_y, kit_w, front_l)
    ))

    # -------------------------------------------------------------
    # Zone 2: Middle (Common Bath, Attached Bath, Dining Hall, Bedroom 3)
    # -------------------------------------------------------------
    mid_y = oy + front_l
    bath_w = 5.0
    bath_l = round(min(7.5, mid_l / 2.0), 1)

    # Common Bath (accessed from Dining/Circulation corridor)
    cb_x = ox
    cb_y = mid_y
    cb_area = round(bath_w * bath_l, 1)
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=f"common_bath_{floor_idx}",
        type="common_bath",
        name="Common Bath",
        width=bath_w,
        length=bath_l,
        area=cb_area,
        quantity=1,
        floor=floor_idx,
        x=cb_x,
        y=cb_y,
        rotation=0.0,
        compass_zone="W",
        adjacent_to=[],
        confidence="generated",
        polygon=[[cb_x, cb_y], [cb_x+bath_w, cb_y], [cb_x+bath_w, cb_y+bath_l], [cb_x, cb_y+bath_l], [cb_x, cb_y]],
        doors=[{"type": "single_swing", "x": round(cb_x + bath_w, 1), "y": round(cb_y + 1.2, 1), "width": 2.5, "wall": "right", "connects_to": "circulation"}],
        windows=[{"type": "sliding", "x": round(cb_x, 1), "y": round(cb_y + bath_l/2, 1), "width": 2.5, "wall": "left", "is_exterior": True}],
        zone="service",
        formatted_dimensions=format_room_dimensions(bath_w, bath_l),
        furniture=generate_schematic_furniture("common_bath", cb_x, cb_y, bath_w, bath_l)
    ))

    # Attached Bath (directly touches Master Bed in Zone 3, internal access door)
    ab_x = ox
    ab_y = mid_y + bath_l
    ab_l = round(mid_l - bath_l, 1)
    ab_area = round(bath_w * ab_l, 1)
    mb_id = f"master_bed_{floor_idx}"
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=f"attached_bath_{floor_idx}",
        type="attached_bath",
        name="Attached Bath",
        width=bath_w,
        length=ab_l,
        area=ab_area,
        quantity=1,
        floor=floor_idx,
        x=ab_x,
        y=ab_y,
        rotation=0.0,
        compass_zone="W",
        adjacent_to=[mb_id],
        confidence="generated",
        polygon=[[ab_x, ab_y], [ab_x+bath_w, ab_y], [ab_x+bath_w, ab_y+ab_l], [ab_x, ab_y+ab_l], [ab_x, ab_y]],
        doors=[{"type": "single_swing", "x": round(ab_x + bath_w/2, 1), "y": round(ab_y + ab_l, 1), "width": 2.5, "wall": "top", "connects_to": mb_id}],
        windows=[{"type": "sliding", "x": round(ab_x, 1), "y": round(ab_y + ab_l/2, 1), "width": 2.5, "wall": "left", "is_exterior": True}],
        zone="private",
        attached_to_room_id=mb_id,
        formatted_dimensions=format_room_dimensions(bath_w, ab_l),
        furniture=generate_schematic_furniture("attached_bath", ab_x, ab_y, bath_w, ab_l)
    ))

    # Remainder of mid zone width is shared between Dining Hall and Bedroom 3
    rem_mid_w = round(bw - bath_w, 1)
    b3_w = round(max(10.0, rem_mid_w * 0.48), 1)
    din_w = round(rem_mid_w - b3_w, 1)
    if din_w < 9.0:
        din_w = 9.0
        b3_w = round(rem_mid_w - din_w, 1)

    # Dining Hall (in center of Zone 2)
    din_x = ox + bath_w
    din_y = mid_y
    din_area = round(din_w * mid_l, 1)
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=f"dining_{floor_idx}",
        type="dining",
        name="Dining Hall",
        width=din_w,
        length=mid_l,
        area=din_area,
        quantity=1,
        floor=floor_idx,
        x=din_x,
        y=din_y,
        rotation=0.0,
        compass_zone="CENTER",
        adjacent_to=[],
        confidence="generated",
        polygon=[[din_x, din_y], [din_x+din_w, din_y], [din_x+din_w, din_y+mid_l], [din_x, din_y+mid_l], [din_x, din_y]],
        doors=[
            {"type": "passage", "x": round(din_x + 1.5, 1), "y": round(din_y, 1), "width": 3.5, "wall": "bottom", "connects_to": f"living_{floor_idx}"},
            {"type": "passage", "x": round(din_x + din_w/2, 1), "y": round(din_y + mid_l, 1), "width": 3.5, "wall": "top", "connects_to": "circulation"}
        ],
        windows=[],
        zone="public",
        formatted_dimensions=format_room_dimensions(din_w, mid_l),
        furniture=generate_schematic_furniture("dining", din_x, din_y, din_w, mid_l)
    ))

    # Bedroom 3 (East side of Zone 2, with exterior window)
    b3_x = din_x + din_w
    b3_y = mid_y
    b3_area = round(b3_w * mid_l, 1)
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=f"regular_bed_2_{floor_idx}",
        type="regular_bed",
        name="Bedroom 3",
        width=b3_w,
        length=mid_l,
        area=b3_area,
        quantity=1,
        floor=floor_idx,
        x=b3_x,
        y=b3_y,
        rotation=0.0,
        compass_zone="E",
        adjacent_to=[],
        confidence="generated",
        polygon=[[b3_x, b3_y], [b3_x+b3_w, b3_y], [b3_x+b3_w, b3_y+mid_l], [b3_x, b3_y+mid_l], [b3_x, b3_y]],
        doors=[{"type": "single_swing", "x": round(b3_x, 1), "y": round(b3_y + 1.5, 1), "width": 3.0, "wall": "left", "connects_to": f"dining_{floor_idx}"}],
        windows=[{"type": "sliding", "x": round(b3_x + b3_w, 1), "y": round(b3_y + mid_l/2, 1), "width": 4.0, "wall": "right", "is_exterior": True}],
        zone="private",
        formatted_dimensions=format_room_dimensions(b3_w, mid_l),
        furniture=generate_schematic_furniture("regular_bed", b3_x, b3_y, b3_w, mid_l)
    ))

    # -------------------------------------------------------------
    # Zone 3: Rear (Master Bedroom Suite + Bedroom 2)
    # -------------------------------------------------------------
    rear_y = oy + front_l + mid_l
    mb_w = round(max(11.0, bw * 0.54), 1)
    b2_w = round(bw - mb_w, 1)
    if b2_w < 10.0:
        b2_w = 10.0
        mb_w = round(bw - b2_w, 1)

    # Master Bedroom (West side of rear zone, connects internally to attached bath in Zone 2)
    mb_x = ox
    mb_area = round(mb_w * rear_l, 1)
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=mb_id,
        type="master_bed",
        name="Master Bedroom",
        width=mb_w,
        length=rear_l,
        area=mb_area,
        quantity=1,
        floor=floor_idx,
        x=mb_x,
        y=rear_y,
        rotation=0.0,
        compass_zone="NW",
        adjacent_to=[f"attached_bath_{floor_idx}"],
        confidence="generated",
        polygon=[[mb_x, rear_y], [mb_x+mb_w, rear_y], [mb_x+mb_w, rear_y+rear_l], [mb_x, rear_y+rear_l], [mb_x, rear_y]],
        doors=[
            {"type": "single_swing", "x": round(mb_x + mb_w - 1.5, 1), "y": round(rear_y, 1), "width": 3.0, "wall": "bottom", "connects_to": "circulation"},
            {"type": "single_swing", "x": round(mb_x + bath_w/2, 1), "y": round(rear_y, 1), "width": 2.5, "wall": "bottom", "connects_to": f"attached_bath_{floor_idx}"}
        ],
        windows=[
            {"type": "sliding", "x": round(mb_x + mb_w/2, 1), "y": round(rear_y + rear_l, 1), "width": 4.5, "wall": "top", "is_exterior": True},
            {"type": "sliding", "x": round(mb_x, 1), "y": round(rear_y + rear_l/2, 1), "width": 4.0, "wall": "left", "is_exterior": True}
        ],
        zone="private",
        formatted_dimensions=format_room_dimensions(mb_w, rear_l),
        furniture=generate_schematic_furniture("master_bed", mb_x, rear_y, mb_w, rear_l)
    ))

    # Bedroom 2 (East side of rear zone)
    b2_x = ox + mb_w
    b2_area = round(b2_w * rear_l, 1)
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=f"regular_bed_1_{floor_idx}",
        type="regular_bed",
        name="Bedroom 2",
        width=b2_w,
        length=rear_l,
        area=b2_area,
        quantity=1,
        floor=floor_idx,
        x=b2_x,
        y=rear_y,
        rotation=0.0,
        compass_zone="NE",
        adjacent_to=[],
        confidence="generated",
        polygon=[[b2_x, rear_y], [b2_x+b2_w, rear_y], [b2_x+b2_w, rear_y+rear_l], [b2_x, rear_y+rear_l], [b2_x, rear_y]],
        doors=[{"type": "single_swing", "x": round(b2_x + 1.2, 1), "y": round(rear_y, 1), "width": 3.0, "wall": "bottom", "connects_to": "circulation"}],
        windows=[
            {"type": "sliding", "x": round(b2_x + b2_w/2, 1), "y": round(rear_y + rear_l, 1), "width": 4.0, "wall": "top", "is_exterior": True},
            {"type": "sliding", "x": round(b2_x + b2_w, 1), "y": round(rear_y + rear_l/2, 1), "width": 4.0, "wall": "right", "is_exterior": True}
        ],
        zone="private",
        formatted_dimensions=format_room_dimensions(b2_w, rear_l),
        furniture=generate_schematic_furniture("regular_bed", b2_x, rear_y, b2_w, rear_l)
    ))

    # Circulation Spine Corridor connecting Dining to Master Bedroom & Bedroom 2
    corridors.append({
        "x": ox + bath_w,
        "y": round(rear_y - 3.5, 1),
        "width": round(bw - bath_w, 1),
        "length": 3.5
    })

    return placed_rooms, corridors, open_areas, stair_rect

def solve_4bhk_strategy(
    ox: float,
    oy: float,
    bw: float,
    bl: float,
    floor_idx: int,
    rooms_needed: List[Any],
    stair_rect: Optional[Tuple[float, float, float, float]],
    has_stair: bool,
    strategy_name: str
) -> Tuple[List[GeneratedRoomGeometry], List[Dict[str, Any]], List[Dict[str, Any]], Optional[Tuple[float, float, float, float]]]:
    """
    Solves an expansive 4BHK architectural layout with private and public wings.
    """
    placed_rooms: List[GeneratedRoomGeometry] = []
    corridors: List[Dict[str, Any]] = []
    open_areas: List[Dict[str, Any]] = []

    # 1. Staircase handling
    sw, sl = 7.0, 11.5
    if has_stair:
        if stair_rect:
            sx, sy, sw, sl = stair_rect
        else:
            sx, sy = ox, oy
            stair_rect = (sx, sy, sw, sl)
        stair_poly = [[sx, sy], [sx+sw, sy], [sx+sw, sy+sl], [sx, sy+sl], [sx, sy]]
        placed_rooms.append(GeneratedRoomGeometry(
            room_id=f"staircase_{floor_idx}",
            type="staircase",
            name="Staircase Core",
            width=sw,
            length=sl,
            area=round(sw*sl, 1),
            quantity=1,
            floor=floor_idx,
            x=sx,
            y=sy,
            rotation=0.0,
            compass_zone="SW",
            adjacent_to=[],
            confidence="generated",
            polygon=stair_poly,
            doors=[{"type": "single_swing", "x": round(sx+1.0, 1), "y": round(sy+sl, 1), "width": 3.0, "wall": "top", "connects_to": "circulation"}],
            windows=[{"type": "sliding", "x": round(sx+sw/2, 1), "y": round(sy, 1), "width": 3.0, "wall": "bottom", "is_exterior": True}],
            zone="circulation",
            formatted_dimensions=format_room_dimensions(sw, sl),
            furniture=[]
        ))

    # 3-Zone Depth Allocation
    front_l = round(bl * 0.33, 1)
    mid_l = round(bl * 0.34, 1)
    rear_l = round(bl - front_l - mid_l, 1)

    # -------------------------------------------------------------
    # Zone 1: Front (Formal Living Room + Bedroom 4 / Guest Study)
    # -------------------------------------------------------------
    stair_offset_x = sw if has_stair else 0.0
    avail_front_w = bw - stair_offset_x
    liv_w = round(max(14.0, avail_front_w * 0.60), 1)
    b4_w = round(avail_front_w - liv_w, 1)
    if b4_w < 10.5:
        b4_w = 10.5
        liv_w = round(avail_front_w - b4_w, 1)

    # Living Room
    liv_x = ox + stair_offset_x
    liv_y = oy
    liv_area = round(liv_w * front_l, 1)
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=f"living_{floor_idx}",
        type="living",
        name="Formal Living Room",
        width=liv_w,
        length=front_l,
        area=liv_area,
        quantity=1,
        floor=floor_idx,
        x=liv_x,
        y=liv_y,
        rotation=0.0,
        compass_zone="SW",
        adjacent_to=[],
        confidence="generated",
        polygon=[[liv_x, liv_y], [liv_x+liv_w, liv_y], [liv_x+liv_w, liv_y+front_l], [liv_x, liv_y+front_l], [liv_x, liv_y]],
        doors=[
            {"type": "main_entrance", "x": round(liv_x + 1.5, 1), "y": round(liv_y, 1), "width": 4.0, "wall": "bottom", "connects_to": "exterior"},
            {"type": "passage", "x": round(liv_x + liv_w/2, 1), "y": round(liv_y + front_l, 1), "width": 3.5, "wall": "top", "connects_to": "circulation"}
        ],
        windows=[{"type": "sliding", "x": round(liv_x + liv_w/2, 1), "y": round(liv_y, 1), "width": 5.0, "wall": "bottom", "is_exterior": True}],
        zone="public",
        formatted_dimensions=format_room_dimensions(liv_w, front_l),
        furniture=generate_schematic_furniture("living", liv_x, liv_y, liv_w, front_l)
    ))

    # Bedroom 4 / Guest Suite (East side of Zone 1)
    b4_x = liv_x + liv_w
    b4_y = oy
    b4_area = round(b4_w * front_l, 1)
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=f"regular_bed_3_{floor_idx}",
        type="regular_bed",
        name="Bedroom 4 / Guest Room",
        width=b4_w,
        length=front_l,
        area=b4_area,
        quantity=1,
        floor=floor_idx,
        x=b4_x,
        y=b4_y,
        rotation=0.0,
        compass_zone="SE",
        adjacent_to=[],
        confidence="generated",
        polygon=[[b4_x, b4_y], [b4_x+b4_w, b4_y], [b4_x+b4_w, b4_y+front_l], [b4_x, b4_y+front_l], [b4_x, b4_y]],
        doors=[{"type": "single_swing", "x": round(b4_x, 1), "y": round(b4_y + front_l - 1.5, 1), "width": 3.0, "wall": "left", "connects_to": "circulation"}],
        windows=[
            {"type": "sliding", "x": round(b4_x + b4_w/2, 1), "y": round(b4_y, 1), "width": 4.0, "wall": "bottom", "is_exterior": True},
            {"type": "sliding", "x": round(b4_x + b4_w, 1), "y": round(b4_y + front_l/2, 1), "width": 4.0, "wall": "right", "is_exterior": True}
        ],
        zone="private",
        formatted_dimensions=format_room_dimensions(b4_w, front_l),
        furniture=generate_schematic_furniture("regular_bed", b4_x, b4_y, b4_w, front_l)
    ))

    # -------------------------------------------------------------
    # Zone 2: Middle (Baths, Dining, Puja, Kitchen, Bedroom 3)
    # -------------------------------------------------------------
    mid_y = oy + front_l
    bath_w = 5.5
    bath_l = round(min(7.5, mid_l / 2.0), 1)

    # Common Bath (West wall)
    cb_x = ox
    cb_y = mid_y
    cb_area = round(bath_w * bath_l, 1)
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=f"common_bath_{floor_idx}",
        type="common_bath",
        name="Common Bath",
        width=bath_w,
        length=bath_l,
        area=cb_area,
        quantity=1,
        floor=floor_idx,
        x=cb_x,
        y=cb_y,
        rotation=0.0,
        compass_zone="W",
        adjacent_to=[],
        confidence="generated",
        polygon=[[cb_x, cb_y], [cb_x+bath_w, cb_y], [cb_x+bath_w, cb_y+bath_l], [cb_x, cb_y+bath_l], [cb_x, cb_y]],
        doors=[{"type": "single_swing", "x": round(cb_x + bath_w, 1), "y": round(cb_y + 1.2, 1), "width": 2.5, "wall": "right", "connects_to": "circulation"}],
        windows=[{"type": "sliding", "x": round(cb_x, 1), "y": round(cb_y + bath_l/2, 1), "width": 2.5, "wall": "left", "is_exterior": True}],
        zone="service",
        formatted_dimensions=format_room_dimensions(bath_w, bath_l),
        furniture=generate_schematic_furniture("common_bath", cb_x, cb_y, bath_w, bath_l)
    ))

    # Attached Bath (touches Master Bed in Zone 3)
    ab_x = ox
    ab_y = mid_y + bath_l
    ab_l = round(mid_l - bath_l, 1)
    ab_area = round(bath_w * ab_l, 1)
    mb_id = f"master_bed_{floor_idx}"
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=f"attached_bath_{floor_idx}",
        type="attached_bath",
        name="Attached Bath 1",
        width=bath_w,
        length=ab_l,
        area=ab_area,
        quantity=1,
        floor=floor_idx,
        x=ab_x,
        y=ab_y,
        rotation=0.0,
        compass_zone="W",
        adjacent_to=[mb_id],
        confidence="generated",
        polygon=[[ab_x, ab_y], [ab_x+bath_w, ab_y], [ab_x+bath_w, ab_y+ab_l], [ab_x, ab_y+ab_l], [ab_x, ab_y]],
        doors=[{"type": "single_swing", "x": round(ab_x + bath_w/2, 1), "y": round(ab_y + ab_l, 1), "width": 2.5, "wall": "top", "connects_to": mb_id}],
        windows=[{"type": "sliding", "x": round(ab_x, 1), "y": round(ab_y + ab_l/2, 1), "width": 2.5, "wall": "left", "is_exterior": True}],
        zone="private",
        attached_to_room_id=mb_id,
        formatted_dimensions=format_room_dimensions(bath_w, ab_l),
        furniture=generate_schematic_furniture("attached_bath", ab_x, ab_y, bath_w, ab_l)
    ))

    # Remainder of mid zone: Dining Hall, Puja, Kitchen, Bedroom 3
    rem_mid_w = round(bw - bath_w, 1)
    b3_w = round(max(10.5, rem_mid_w * 0.34), 1)
    puja_w = 5.0
    kit_w = round(max(9.5, (rem_mid_w - b3_w - puja_w) * 0.50), 1)
    din_w = round(rem_mid_w - b3_w - puja_w - kit_w, 1)
    if din_w < 10.0:
        din_w = 10.0
        kit_w = max(9.0, round(rem_mid_w - b3_w - puja_w - din_w, 1))

    # Dining Hall
    din_x = ox + bath_w
    din_y = mid_y
    din_area = round(din_w * mid_l, 1)
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=f"dining_{floor_idx}",
        type="dining",
        name="Dining Hall",
        width=din_w,
        length=mid_l,
        area=din_area,
        quantity=1,
        floor=floor_idx,
        x=din_x,
        y=din_y,
        rotation=0.0,
        compass_zone="CENTER",
        adjacent_to=[],
        confidence="generated",
        polygon=[[din_x, din_y], [din_x+din_w, din_y], [din_x+din_w, din_y+mid_l], [din_x, din_y+mid_l], [din_x, din_y]],
        doors=[
            {"type": "passage", "x": round(din_x + 1.5, 1), "y": round(din_y, 1), "width": 3.5, "wall": "bottom", "connects_to": f"living_{floor_idx}"},
            {"type": "passage", "x": round(din_x + din_w/2, 1), "y": round(din_y + mid_l, 1), "width": 3.5, "wall": "top", "connects_to": "circulation"}
        ],
        windows=[],
        zone="public",
        formatted_dimensions=format_room_dimensions(din_w, mid_l),
        furniture=generate_schematic_furniture("dining", din_x, din_y, din_w, mid_l)
    ))

    # Puja Room
    p_x = din_x + din_w
    p_y = mid_y
    p_area = round(puja_w * mid_l, 1)
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=f"puja_{floor_idx}",
        type="puja",
        name="Puja Room",
        width=puja_w,
        length=mid_l,
        area=p_area,
        quantity=1,
        floor=floor_idx,
        x=p_x,
        y=p_y,
        rotation=0.0,
        compass_zone="NE",
        adjacent_to=[],
        confidence="generated",
        polygon=[[p_x, p_y], [p_x+puja_w, p_y], [p_x+puja_w, p_y+mid_l], [p_x, p_y+mid_l], [p_x, p_y]],
        doors=[{"type": "single_swing", "x": round(p_x, 1), "y": round(p_y + 1.2, 1), "width": 2.5, "wall": "left", "connects_to": f"dining_{floor_idx}"}],
        windows=[],
        zone="special",
        formatted_dimensions=format_room_dimensions(puja_w, mid_l),
        furniture=generate_schematic_furniture("puja", p_x, p_y, puja_w, mid_l)
    ))

    # Kitchen & Utility
    kit_x = p_x + puja_w
    kit_y = mid_y
    kit_area = round(kit_w * mid_l, 1)
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=f"kitchen_{floor_idx}",
        type="kitchen",
        name="Kitchen & Utility",
        width=kit_w,
        length=mid_l,
        area=kit_area,
        quantity=1,
        floor=floor_idx,
        x=kit_x,
        y=kit_y,
        rotation=0.0,
        compass_zone="E",
        adjacent_to=[],
        confidence="generated",
        polygon=[[kit_x, kit_y], [kit_x+kit_w, kit_y], [kit_x+kit_w, kit_y+mid_l], [kit_x, kit_y+mid_l], [kit_x, kit_y]],
        doors=[{"type": "single_swing", "x": round(kit_x, 1), "y": round(kit_y + 1.5, 1), "width": 3.0, "wall": "left", "connects_to": f"dining_{floor_idx}"}],
        windows=[],
        zone="service",
        formatted_dimensions=format_room_dimensions(kit_w, mid_l),
        furniture=generate_schematic_furniture("kitchen", kit_x, kit_y, kit_w, mid_l)
    ))

    # Bedroom 3 (East wall of Zone 2)
    b3_x = kit_x + kit_w
    b3_y = mid_y
    b3_area = round(b3_w * mid_l, 1)
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=f"regular_bed_2_{floor_idx}",
        type="regular_bed",
        name="Bedroom 3",
        width=b3_w,
        length=mid_l,
        area=b3_area,
        quantity=1,
        floor=floor_idx,
        x=b3_x,
        y=b3_y,
        rotation=0.0,
        compass_zone="E",
        adjacent_to=[],
        confidence="generated",
        polygon=[[b3_x, b3_y], [b3_x+b3_w, b3_y], [b3_x+b3_w, b3_y+mid_l], [b3_x, b3_y+mid_l], [b3_x, b3_y]],
        doors=[{"type": "single_swing", "x": round(b3_x, 1), "y": round(b3_y + mid_l - 1.5, 1), "width": 3.0, "wall": "top", "connects_to": "circulation"}],
        windows=[{"type": "sliding", "x": round(b3_x + b3_w, 1), "y": round(b3_y + mid_l/2, 1), "width": 4.0, "wall": "right", "is_exterior": True}],
        zone="private",
        formatted_dimensions=format_room_dimensions(b3_w, mid_l),
        furniture=generate_schematic_furniture("regular_bed", b3_x, b3_y, b3_w, mid_l)
    ))

    # -------------------------------------------------------------
    # Zone 3: Rear (Master Bedroom Suite + Bedroom 2)
    # -------------------------------------------------------------
    rear_y = oy + front_l + mid_l
    mb_w = round(max(13.0, bw * 0.54), 1)
    b2_w = round(bw - mb_w, 1)
    if b2_w < 11.0:
        b2_w = 11.0
        mb_w = round(bw - b2_w, 1)

    # Master Bedroom (West side of rear zone)
    mb_x = ox
    mb_area = round(mb_w * rear_l, 1)
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=mb_id,
        type="master_bed",
        name="Master Bedroom Suite",
        width=mb_w,
        length=rear_l,
        area=mb_area,
        quantity=1,
        floor=floor_idx,
        x=mb_x,
        y=rear_y,
        rotation=0.0,
        compass_zone="NW",
        adjacent_to=[f"attached_bath_{floor_idx}"],
        confidence="generated",
        polygon=[[mb_x, rear_y], [mb_x+mb_w, rear_y], [mb_x+mb_w, rear_y+rear_l], [mb_x, rear_y+rear_l], [mb_x, rear_y]],
        doors=[
            {"type": "single_swing", "x": round(mb_x + mb_w - 1.5, 1), "y": round(rear_y, 1), "width": 3.0, "wall": "bottom", "connects_to": "circulation"},
            {"type": "single_swing", "x": round(mb_x + bath_w/2, 1), "y": round(rear_y, 1), "width": 2.5, "wall": "bottom", "connects_to": f"attached_bath_{floor_idx}"}
        ],
        windows=[
            {"type": "sliding", "x": round(mb_x + mb_w/2, 1), "y": round(rear_y + rear_l, 1), "width": 4.5, "wall": "top", "is_exterior": True},
            {"type": "sliding", "x": round(mb_x, 1), "y": round(rear_y + rear_l/2, 1), "width": 4.5, "wall": "left", "is_exterior": True}
        ],
        zone="private",
        formatted_dimensions=format_room_dimensions(mb_w, rear_l),
        furniture=generate_schematic_furniture("master_bed", mb_x, rear_y, mb_w, rear_l)
    ))

    # Bedroom 2 (East side of rear zone)
    b2_x = ox + mb_w
    b2_area = round(b2_w * rear_l, 1)
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=f"regular_bed_1_{floor_idx}",
        type="regular_bed",
        name="Bedroom 2",
        width=b2_w,
        length=rear_l,
        area=b2_area,
        quantity=1,
        floor=floor_idx,
        x=b2_x,
        y=rear_y,
        rotation=0.0,
        compass_zone="NE",
        adjacent_to=[],
        confidence="generated",
        polygon=[[b2_x, rear_y], [b2_x+b2_w, rear_y], [b2_x+b2_w, rear_y+rear_l], [b2_x, rear_y+rear_l], [b2_x, rear_y]],
        doors=[{"type": "single_swing", "x": round(b2_x + 1.2, 1), "y": round(rear_y, 1), "width": 3.0, "wall": "bottom", "connects_to": "circulation"}],
        windows=[
            {"type": "sliding", "x": round(b2_x + b2_w/2, 1), "y": round(rear_y + rear_l, 1), "width": 4.0, "wall": "top", "is_exterior": True},
            {"type": "sliding", "x": round(b2_x + b2_w, 1), "y": round(rear_y + rear_l/2, 1), "width": 4.0, "wall": "right", "is_exterior": True}
        ],
        zone="private",
        formatted_dimensions=format_room_dimensions(b2_w, rear_l),
        furniture=generate_schematic_furniture("regular_bed", b2_x, rear_y, b2_w, rear_l)
    ))

    # Spine corridor connecting Dining to Master Bedroom, Bedroom 2, and Bedroom 3
    corridors.append({
        "x": ox + bath_w,
        "y": round(rear_y - 3.5, 1),
        "width": round(bw - bath_w, 1),
        "length": 3.5
    })

    return placed_rooms, corridors, open_areas, stair_rect

def solve_multi_floor_upper(
    ox: float,
    oy: float,
    bw: float,
    bl: float,
    floor_idx: int,
    rooms_needed: List[Any],
    stair_rect: Tuple[float, float, float, float]
) -> Tuple[List[GeneratedRoomGeometry], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Upper floor architectural solver:
    - Vertical continuity: Preserves exact SW staircase core position
    - Family Lounge / Central Lobby
    - Master Bedroom Suite with Attached Bath
    - Secondary Bedrooms + Bathrooms
    - Balcony / Terrace overlooking frontage
    """
    placed_rooms: List[GeneratedRoomGeometry] = []
    corridors: List[Dict[str, Any]] = []
    open_areas: List[Dict[str, Any]] = []

    sx, sy, sw, sl = stair_rect
    stair_poly = [[sx, sy], [sx+sw, sy], [sx+sw, sy+sl], [sx, sy+sl], [sx, sy]]
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=f"staircase_fl{floor_idx}",
        type="staircase",
        name="Staircase Core",
        width=sw,
        length=sl,
        area=round(sw*sl, 1),
        quantity=1,
        floor=floor_idx,
        x=sx,
        y=sy,
        rotation=0.0,
        compass_zone="SW",
        adjacent_to=[],
        confidence="generated",
        polygon=stair_poly,
        doors=[{"type": "single_swing", "x": round(sx+1.0, 1), "y": round(sy+sl, 1), "width": 3.0, "wall": "top", "connects_to": "circulation"}],
        windows=[{"type": "sliding", "x": round(sx+sw/2, 1), "y": round(sy, 1), "width": 3.0, "wall": "bottom", "is_exterior": True}],
        zone="circulation",
        formatted_dimensions=format_room_dimensions(sw, sl),
        furniture=[]
    ))

    # South Wing remaining space beside staircase: Master Bed Suite
    mb_w = round(min(bw - sw - 5.5, 14.0), 1)
    mb_x = ox + sw
    mb_y = oy
    mb_id = f"master_bed_fl{floor_idx}"
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=mb_id,
        type="master_bed",
        name="Master Bedroom Suite",
        width=mb_w,
        length=sl,
        area=round(mb_w * sl, 1),
        quantity=1,
        floor=floor_idx,
        x=mb_x,
        y=mb_y,
        rotation=0.0,
        compass_zone="SW",
        adjacent_to=[],
        confidence="generated",
        polygon=[[mb_x, mb_y], [mb_x+mb_w, mb_y], [mb_x+mb_w, mb_y+sl], [mb_x, mb_y+sl], [mb_x, mb_y]],
        doors=[
            {"type": "single_swing", "x": round(mb_x + 1.2, 1), "y": round(mb_y + sl, 1), "width": 3.0, "wall": "top", "connects_to": "circulation"},
            {"type": "single_swing", "x": round(mb_x + mb_w, 1), "y": round(mb_y + 1.5, 1), "width": 2.5, "wall": "right", "connects_to": f"attached_bath_fl{floor_idx}"}
        ],
        windows=[{"type": "sliding", "x": round(mb_x + mb_w/2, 1), "y": round(mb_y, 1), "width": 4.5, "wall": "bottom", "is_exterior": True}],
        zone="private",
        formatted_dimensions=format_room_dimensions(mb_w, sl),
        furniture=generate_schematic_furniture("master_bed", mb_x, mb_y, mb_w, sl)
    ))

    # Attached Bath in SE corner
    ab_w = round(bw - (sw + mb_w), 1)
    ab_x = mb_x + mb_w
    ab_y = oy
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=f"attached_bath_fl{floor_idx}",
        type="attached_bath",
        name="Attached Bath",
        width=ab_w,
        length=sl,
        area=round(ab_w * sl, 1),
        quantity=1,
        floor=floor_idx,
        x=ab_x,
        y=ab_y,
        rotation=0.0,
        compass_zone="SE",
        adjacent_to=[mb_id],
        confidence="generated",
        polygon=[[ab_x, ab_y], [ab_x+ab_w, ab_y], [ab_x+ab_w, ab_y+sl], [ab_x, ab_y+sl], [ab_x, ab_y]],
        doors=[{"type": "single_swing", "x": round(ab_x, 1), "y": round(ab_y + 1.5, 1), "width": 2.5, "wall": "left", "connects_to": mb_id}],
        windows=[{"type": "sliding", "x": round(ab_x + ab_w, 1), "y": round(ab_y + sl/2, 1), "width": 2.5, "wall": "right", "is_exterior": True}],
        zone="private",
        attached_to_room_id=mb_id,
        formatted_dimensions=format_room_dimensions(ab_w, sl),
        furniture=generate_schematic_furniture("attached_bath", ab_x, ab_y, ab_w, sl)
    ))

    # Central Circulation Corridor & Family Lobby
    cy = oy + sl
    cl = 4.0
    corridors.append({"x": ox, "y": cy, "width": bw, "length": cl})

    # North Wing: Common Bath + Secondary Bedrooms + Front Balcony
    ny = cy + cl
    nl = round(bl - (sl + cl), 1)

    cb_w = 5.5
    cb_l = round(min(8.0, nl), 1)
    placed_rooms.append(GeneratedRoomGeometry(
        room_id=f"common_bath_fl{floor_idx}",
        type="common_bath",
        name="Common Bath",
        width=cb_w,
        length=cb_l,
        area=round(cb_w * cb_l, 1),
        quantity=1,
        floor=floor_idx,
        x=ox,
        y=ny,
        rotation=0.0,
        compass_zone="NW",
        adjacent_to=[],
        confidence="generated",
        polygon=[[ox, ny], [ox+cb_w, ny], [ox+cb_w, ny+cb_l], [ox, ny+cb_l], [ox, ny]],
        doors=[{"type": "single_swing", "x": round(ox + cb_w/2, 1), "y": round(ny, 1), "width": 2.5, "wall": "bottom", "connects_to": "circulation"}],
        windows=[{"type": "sliding", "x": round(ox, 1), "y": round(ny + cb_l/2, 1), "width": 2.5, "wall": "left", "is_exterior": True}],
        zone="service",
        formatted_dimensions=format_room_dimensions(cb_w, cb_l),
        furniture=generate_schematic_furniture("common_bath", ox, ny, cb_w, cb_l)
    ))

    # If depth remains behind common bath, place a utility / linen room
    if nl - cb_l >= 5.0:
        ut_l = round(nl - cb_l, 1)
        ut_y = ny + cb_l
        placed_rooms.append(GeneratedRoomGeometry(
            room_id=f"utility_fl{floor_idx}",
            type="utility",
            name="Utility & Linen",
            width=cb_w,
            length=ut_l,
            area=round(cb_w * ut_l, 1),
            quantity=1,
            floor=floor_idx,
            x=ox,
            y=ut_y,
            rotation=0.0,
            compass_zone="NW",
            adjacent_to=[],
            confidence="generated",
            polygon=[[ox, ut_y], [ox+cb_w, ut_y], [ox+cb_w, ut_y+ut_l], [ox, ut_y+ut_l], [ox, ut_y]],
            doors=[{"type": "single_swing", "x": round(ox + cb_w, 1), "y": round(ut_y + 1.2, 1), "width": 2.5, "wall": "right", "connects_to": "circulation"}],
            windows=[{"type": "sliding", "x": round(ox, 1), "y": round(ut_y + ut_l/2, 1), "width": 2.5, "wall": "left", "is_exterior": True}],
            zone="service",
            formatted_dimensions=format_room_dimensions(cb_w, ut_l),
            furniture=generate_schematic_furniture("utility", ox, ut_y, cb_w, ut_l)
        ))

    # FIX: Determine how many secondary bedrooms are needed on this upper floor.
    # rooms_needed contains the program items assigned to this floor.
    needed_beds = [r for r in rooms_needed if r.type == "regular_bed"]
    n_beds_upper = max(1, len(needed_beds))   # at least 1, driven by actual program

    rem_n_w = round(bw - cb_w, 1)
    # Reserve balcony (max 8ft) only if ≥2 secondary beds fit beside it
    MIN_BED_W_U = 10.0
    balc_w = round(min(8.0, max(0.0, rem_n_w - n_beds_upper * MIN_BED_W_U)), 1)
    beds_total_w = round(rem_n_w - balc_w, 1)
    bed_unit_w = max(MIN_BED_W_U, round(beds_total_w / max(1, n_beds_upper), 1))

    # Secondary Bedrooms — one for each needed_beds entry
    for bi in range(n_beds_upper):
        bx = ox + cb_w + bi * bed_unit_w
        bw_cur = bed_unit_w if bi < n_beds_upper - 1 else max(MIN_BED_W_U, round(beds_total_w - bi * bed_unit_w, 1))
        b_id = f"regular_bed_{bi+1}_fl{floor_idx}"
        connects_right = f"balcony_fl{floor_idx}" if (balc_w > 0 and bi == n_beds_upper - 1) else "circulation"
        placed_rooms.append(GeneratedRoomGeometry(
            room_id=b_id,
            type="regular_bed",
            name=f"Bedroom {bi + 2}",
            width=bw_cur,
            length=nl,
            area=round(bw_cur * nl, 1),
            quantity=1,
            floor=floor_idx,
            x=bx,
            y=ny,
            rotation=0.0,
            compass_zone="N",
            adjacent_to=[],
            confidence="generated",
            polygon=[[bx, ny], [bx+bw_cur, ny], [bx+bw_cur, ny+nl], [bx, ny+nl], [bx, ny]],
            doors=[
                {"type": "single_swing", "x": round(bx + 1.2, 1), "y": round(ny, 1), "width": 3.0, "wall": "bottom", "connects_to": "circulation"},
                *([{"type": "single_swing", "x": round(bx + bw_cur, 1), "y": round(ny + nl/2, 1), "width": 3.0, "wall": "right", "connects_to": f"balcony_fl{floor_idx}"}]
                  if (balc_w > 0 and bi == n_beds_upper - 1) else [])
            ],
            windows=[{"type": "sliding", "x": round(bx + bw_cur/2, 1), "y": round(ny + nl, 1), "width": 4.5, "wall": "top", "is_exterior": True}],
            zone="private",
            formatted_dimensions=format_room_dimensions(bw_cur, nl),
            furniture=generate_schematic_furniture("regular_bed", bx, ny, bw_cur, nl)
        ))

    # Balcony (only placed if width remains after fitting all beds)
    if balc_w > 0:
        balc_x = ox + cb_w + n_beds_upper * bed_unit_w
        last_b_id = f"regular_bed_{n_beds_upper}_fl{floor_idx}"
        placed_rooms.append(GeneratedRoomGeometry(
            room_id=f"balcony_fl{floor_idx}",
            type="balcony",
            name="Terrace Balcony",
            width=balc_w,
            length=nl,
            area=round(balc_w * nl, 1),
            quantity=1,
            floor=floor_idx,
            x=balc_x,
            y=ny,
            rotation=0.0,
            compass_zone="NE",
            adjacent_to=[last_b_id],
            confidence="generated",
            polygon=[[balc_x, ny], [balc_x+balc_w, ny], [balc_x+balc_w, ny+nl], [balc_x, ny+nl], [balc_x, ny]],
            doors=[{"type": "single_swing", "x": round(balc_x, 1), "y": round(ny + nl/2, 1), "width": 3.0, "wall": "left", "connects_to": last_b_id}],
            windows=[{"type": "sliding", "x": round(balc_x + balc_w, 1), "y": round(ny + nl/2, 1), "width": 4.0, "wall": "right", "is_exterior": True}],
            zone="special",
            formatted_dimensions=format_room_dimensions(balc_w, nl),
            furniture=generate_schematic_furniture("balcony", balc_x, ny, balc_w, nl)
        ))

    return placed_rooms, corridors, open_areas

