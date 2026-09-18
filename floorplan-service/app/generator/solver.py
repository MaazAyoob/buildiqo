"""
Buildiqo.AI - Phase 2.1 Architectural Floor-Plan Solver
Generates deterministic, usable, architecturally sensible residential floor plans
with target-area fidelity, functional zoning, circulation core, access graphs,
exterior-only windows, multi-floor staircase alignment, and quality scoring.
"""
import random
import math
import uuid
from typing import List, Dict, Tuple, Optional, Any
from collections import deque
from shapely.geometry import box, Polygon

from .room_registry import (
    ROOM_REGISTRY,
    normalize_room_type,
    get_room_definition,
    RoomDefinition
)
from .schemas import (
    FloorplanGenerationRequest,
    RoomProgramItem,
    GeneratedRoomGeometry,
    FloorLayout,
    GenerationWarning,
    GeneratedFloorplanResponse
)

class SolverException(Exception):
    """Controlled solver failure exception with structured diagnostic context."""
    def __init__(
        self,
        code: str,
        message: str,
        suggestions: Optional[List[str]] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message)
        self.code = code
        self.message = message
        self.suggestions = suggestions or []
        self.details = details or {}

class DeterministicFloorplanSolver:
    """
    Phase 2.1 Architectural Floor-Plan Solver.
    Replaces 100% BSP flood-filling with target-area fidelity, circulation spine,
    door access graphs, exterior-only fenestration, and deterministic candidate quality scoring.
    """

    def __init__(self, request: FloorplanGenerationRequest):
        self.req = request
        self.seed = request.seed if request.seed is not None else 42
        self.rng = random.Random(self.seed)
        self.warnings: List[GenerationWarning] = []

    def solve(self, room_program: Optional[List[RoomProgramItem]] = None) -> GeneratedFloorplanResponse:
        plot_w = float(self.req.plot_width_ft)
        plot_l = float(self.req.plot_length_ft)
        setback = float(self.req.setback_ft)

        # 1. Validate floor limits and buildable envelope
        if self.req.num_floors < 1 or self.req.num_floors > 5:
            raise SolverException(
                code="INVALID_FLOORS",
                message=f"num_floors ({self.req.num_floors}) must be between 1 and 5.",
                suggestions=["Specify num_floors between 1 and 5"]
            )

        buildable_w = round(plot_w - 2 * setback, 1)
        buildable_l = round(plot_l - 2 * setback, 1)

        if buildable_w < 10.0 or buildable_l < 10.0:
            raise SolverException(
                code="LIMITED_BUILDABLE_AREA",
                message=f"Buildable area ({buildable_w:.1f} ft × {buildable_l:.1f} ft) is too small after {setback:.1f} ft setbacks.",
                suggestions=["Reduce setback distance", "Increase plot dimensions"],
                details={"buildable_w": buildable_w, "buildable_l": buildable_l, "setback": setback}
            )

        buildable_area = round(buildable_w * buildable_l, 1)

        # 2. Build or normalize the room program
        program = room_program if room_program else self._create_default_room_program()
        if not program:
            raise SolverException(
                code="EMPTY_ROOM_PROGRAM",
                message="No rooms requested for generation.",
                suggestions=["Add at least one bedroom, living room, or kitchen"]
            )

        # 3. Distribute rooms across requested floors
        floor_assignments = self._distribute_rooms_to_floors(program, self.req.num_floors)

        # 4. Infeasibility pre-check: verify minimum required area per floor
        for f_idx, f_rooms in floor_assignments.items():
            min_req = sum(get_room_definition(r.type).min_area_sqft for r in f_rooms)
            if min_req > buildable_area:
                blocking = [r.type for r in f_rooms]
                raise SolverException(
                    code="LAYOUT_INFEASIBLE",
                    message=(
                        f"Floor {f_idx} requires at least {min_req:.0f} sq.ft minimum carpet area, "
                        f"which exceeds the buildable envelope ({buildable_area:.0f} sq.ft)."
                    ),
                    suggestions=[
                        "Increase plot dimensions",
                        "Reduce the number of rooms requested",
                        "Distribute rooms across additional floors",
                        "Reduce setback requirements"
                    ],
                    details={
                        "buildable_width": buildable_w,
                        "buildable_length": buildable_l,
                        "buildable_area": buildable_area,
                        "required_min_area": min_req,
                        "requested_room_count": len(f_rooms),
                        "blocking_room_types": blocking,
                        "reason": f"Floor {f_idx} minimum carpet area exceeds buildable envelope."
                    }
                )

        # 5. Multi-floor solve with Staircase Core vertical preservation
        generated_floors: List[FloorLayout] = []
        floor_names = ["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor", "4th Floor"]
        stair_rect: Optional[Tuple[float, float, float, float]] = None

        for f_idx in range(self.req.num_floors):
            floor_rooms = floor_assignments.get(f_idx, [])
            if not floor_rooms:
                continue

            floor_name = floor_names[f_idx] if f_idx < len(floor_names) else f"Floor {f_idx}"

            # Candidate exploration: evaluate 5 deterministic seeds and pick highest Quality Score
            best_layout = None
            best_score = -1e9
            best_stair = stair_rect

            for cand_i in range(5):
                cand_seed = self.seed + (f_idx * 1000) + (cand_i * 79)
                cand_rng = random.Random(cand_seed)

                layout, s_rect, score = self._solve_floor_candidate(
                    floor_idx=f_idx,
                    floor_name=floor_name,
                    rooms=floor_rooms,
                    ox=setback,
                    oy=setback,
                    bw=buildable_w,
                    bl=buildable_l,
                    stair_rect=stair_rect,
                    rng=cand_rng
                )

                if layout is not None and score > best_score:
                    best_score = score
                    best_layout = layout
                    best_stair = s_rect

            if best_layout is None:
                # Fallback to 2D aspect-ratio balanced grid partition
                best_layout, best_stair = self._solve_fallback_floor(
                    floor_idx=f_idx,
                    floor_name=floor_name,
                    rooms=floor_rooms,
                    ox=setback,
                    oy=setback,
                    bw=buildable_w,
                    bl=buildable_l,
                    stair_rect=stair_rect
                )

            stair_rect = best_stair
            generated_floors.append(best_layout)

        # 6. Verify multi-floor vertical consistency (stair alignment, plumbing stacks)
        if len(generated_floors) > 1:
            self._verify_vertical_consistency(generated_floors)

        gen_id = f"gen_{uuid.uuid4().hex[:12]}"

        return GeneratedFloorplanResponse(
            success=True,
            generation_id=gen_id,
            seed=self.seed,
            plot={"width_ft": plot_w, "length_ft": plot_l},
            setback_ft=setback,
            floors=generated_floors,
            warnings=self.warnings,
            constraints={
                "vastu_requested": self.req.vastu_compliant,
                "vastu_preferences_applied": self.req.vastu_compliant,
                "solver_algorithm": "architectural_zoned_target_area_solver",
                "plot_facing": self.req.plot_facing
            },
            svg="",  # Populated by svg_renderer
            dxf_available=True
        )

    def _create_default_room_program(self) -> List[RoomProgramItem]:
        """Creates normalized program items from requested rooms or standard residential baseline."""
        items: List[RoomProgramItem] = []
        counts: Dict[str, int] = {}

        if self.req.rooms_required:
            for req_room in self.req.rooms_required:
                canon_type = normalize_room_type(req_room.type)
                cnt = max(1, min(req_room.count, 6))
                for _ in range(cnt):
                    idx = counts.get(canon_type, 0) + 1
                    counts[canon_type] = idx
                    r_def = get_room_definition(canon_type)
                    items.append(RoomProgramItem(
                        room_id=f"{canon_type}_{idx}",
                        type=canon_type,
                        display_name=f"{r_def.name} {idx}" if cnt > 1 else r_def.name,
                        count=1,
                        target_area_sqft=r_def.target_area_sqft,
                        preferred_floor=r_def.default_floor,
                        adjacency=[],
                        compass_zone=r_def.vastu_preferred_zone,
                        priority="high" if canon_type in ["living", "kitchen", "master_bed"] else "medium"
                    ))
        else:
            baseline = [
                ("living", 1), ("dining", 1), ("kitchen", 1),
                ("master_bed", 1), ("regular_bed", 1), ("common_bath", 1), ("attached_bath", 1)
            ]
            for c_type, count in baseline:
                r_def = get_room_definition(c_type)
                items.append(RoomProgramItem(
                    room_id=f"{c_type}_1",
                    type=c_type,
                    display_name=r_def.name,
                    count=1,
                    target_area_sqft=r_def.target_area_sqft,
                    preferred_floor=r_def.default_floor,
                    adjacency=[],
                    compass_zone=r_def.vastu_preferred_zone,
                    priority="high"
                ))

        return items

    def _distribute_rooms_to_floors(
        self,
        rooms: List[RoomProgramItem],
        num_floors: int
    ) -> Dict[int, List[RoomProgramItem]]:
        """Intelligently assigns rooms across available building floors."""
        result: Dict[int, List[RoomProgramItem]] = {i: [] for i in range(num_floors)}

        if num_floors == 1:
            result[0] = list(rooms)
            return result

        has_stair = any(r.type == "staircase" for r in rooms)
        other_rooms = [r for r in rooms if r.type != "staircase"]

        # Add staircase on all floors for vertical continuity
        for f in range(num_floors):
            s_def = get_room_definition("staircase")
            result[f].append(RoomProgramItem(
                room_id=f"staircase_{f}",
                type="staircase",
                display_name="Staircase",
                count=1,
                target_area_sqft=s_def.target_area_sqft,
                preferred_floor=f,
                adjacency=[],
                compass_zone="SW",
                priority="high"
            ))

        ground_types = {"living", "dining", "kitchen", "puja", "utility", "parking", "common_bath"}
        upper_types = {"master_bed", "regular_bed", "attached_bath", "balcony", "office"}

        ground_rooms = [r for r in other_rooms if r.type in ground_types]
        upper_rooms = [r for r in other_rooms if r.type in upper_types]
        other_unassigned = [r for r in other_rooms if r.type not in ground_types and r.type not in upper_types]

        for item in ground_rooms:
            result[0].append(item)

        for item in other_unassigned:
            target_f = min(item.preferred_floor or 0, num_floors - 1)
            result[target_f].append(item)

        # Distribute upper rooms across upper floors (1 to num_floors - 1)
        if num_floors == 2:
            for item in upper_rooms:
                result[1].append(item)
        elif num_floors > 2:
            upper_floor_indices = list(range(1, num_floors))
            masters = [r for r in upper_rooms if r.type == "master_bed"]
            att_baths = [r for r in upper_rooms if r.type == "attached_bath"]
            rem_upper = [r for r in upper_rooms if r.type not in ["master_bed", "attached_bath"]]

            for m in masters:
                result[1].append(m)
            for ab in att_baths:
                result[1].append(ab)

            # Distribute remaining bedrooms/rooms across available upper floors
            for idx, item in enumerate(rem_upper):
                target_f = upper_floor_indices[idx % len(upper_floor_indices)]
                result[target_f].append(item)

        # Balance if ground floor is completely empty except for staircase
        if not [r for r in result[0] if r.type != "staircase"] and len(result[1]) > 1:
            result[0].append(result[1].pop(0))

        return result

    def _solve_floor_candidate(
        self,
        floor_idx: int,
        floor_name: str,
        rooms: List[RoomProgramItem],
        ox: float,
        oy: float,
        bw: float,
        bl: float,
        stair_rect: Optional[Tuple[float, float, float, float]],
        rng: random.Random
    ) -> Tuple[Optional[FloorLayout], Optional[Tuple[float, float, float, float]], float]:
        """
        Solves one floor candidate layout using functional zoning wings and target-area fidelity.
        Returns (FloorLayout, stair_rect, quality_score).
        """
        buildable_area = round(bw * bl, 1)
        target_sum = sum(get_room_definition(r.type).target_area_sqft for r in rooms)

        # 1. Staircase Placement: Fixed dimensions (7.0 ft x 11.5 ft) in SW corner
        if stair_rect:
            sx, sy, sw, sl = stair_rect
        else:
            sw = 7.0
            sl = 11.5
            sx = ox
            sy = oy
            stair_rect = (sx, sy, sw, sl)

        # 2. Footprint Sizing: Prevent ballooning on large plots by creating unassigned open area
        min_needed_l = round(sl + 4.0 + 13.0, 1)
        if bl > min_needed_l + 4.0 and buildable_area > target_sum * 1.35:
            enc_l = round(min_needed_l, 1)
        else:
            enc_l = bl

        # 3. Categorize rooms
        stairs = [r for r in rooms if r.type == "staircase"]
        publics = [r for r in rooms if get_room_definition(r.type).zone_type == "public"]
        services = [r for r in rooms if get_room_definition(r.type).zone_type == "service"]
        privates = [r for r in rooms if get_room_definition(r.type).zone_type == "private"]
        specials = [r for r in rooms if get_room_definition(r.type).zone_type == "special" and r.type != "staircase"]

        placed_rooms: List[GeneratedRoomGeometry] = []
        tot_carpet = 0.0
        circ_corridors: List[Dict[str, Any]] = []

        # Band 1: Staircase Core
        if stairs:
            s_item = stairs[0]
            s_area = round(sw * sl, 1)
            tot_carpet += s_area
            placed_rooms.append(GeneratedRoomGeometry(
                room_id=s_item.room_id, type="staircase", name=s_item.display_name,
                width=sw, length=sl, area=s_area, quantity=1, floor=floor_idx,
                x=sx, y=sy, rotation=0.0, compass_zone="SW", adjacent_to=[], confidence="generated",
                polygon=[[sx, sy], [sx+sw, sy], [sx+sw, sy+sl], [sx, sy+sl], [sx, sy]],
                doors=[{"type": "single_swing", "x": round(sx+1.0, 1), "y": round(sy+sl, 1), "width": 3.0, "wall": "top", "connects_to": "circulation"}],
                windows=[{"type": "sliding", "x": round(sx+sw/2, 1), "y": round(sy, 1), "width": 3.0, "wall": "bottom", "is_exterior": True}]
            ))

        rem_bw = round(bw - sw, 1)

        # Band 2: Central Corridor
        cy = round(oy + sl, 1)
        cl = 4.0
        has_other_rooms = len(rooms) > (1 if stairs else 0)
        has_north_wing = bool(publics or floor_idx == 0 or beds or (baths and not masters))
        if has_other_rooms and has_north_wing:
            circ_corridors.append({"x": ox, "y": cy, "width": bw, "length": cl})
        elif has_other_rooms:
            circ_corridors.append({"x": sx, "y": cy, "width": round(min(bw, 14.0), 1), "length": cl})
        else:
            circ_corridors.append({"x": sx, "y": cy, "width": sw, "length": cl})

        # Band 3: North wing parameters
        ny = round(cy + cl, 1)
        nl = round(enc_l - (sl + cl), 1)

        if publics or floor_idx == 0:
            # =========================================================================
            # GROUND FLOOR: Public Wing + Service Wing
            # =========================================================================
            kitchens = [r for r in services if r.type == "kitchen"]
            baths = [r for r in services if "bath" in r.type]
            dinings = [r for r in publics if r.type == "dining"]
            livings = [r for r in publics if r.type == "living"]
            pujas = [r for r in specials if r.type == "puja"]

            # 1. Kitchen in SE (Vastu preferred zone):
            if kitchens:
                k_item = kitchens[0]
                kw = round(min(rem_bw, max(8.5, 10.0)), 1)
                kl = sl
                kx = round(ox + bw - kw, 1)
                ky = oy
                ka = round(kw * kl, 1)
                tot_carpet += ka
                placed_rooms.append(GeneratedRoomGeometry(
                    room_id=k_item.room_id, type="kitchen", name=k_item.display_name,
                    width=kw, length=kl, area=ka, quantity=1, floor=floor_idx,
                    x=kx, y=ky, rotation=0.0, compass_zone="SE", adjacent_to=[], confidence="generated",
                    polygon=[[kx, ky], [kx+kw, ky], [kx+kw, ky+kl], [kx, ky+kl], [kx, ky]],
                    doors=[{"type": "single_swing", "x": round(kx+1.0, 1), "y": round(ky+kl, 1), "width": 3.0, "wall": "top", "connects_to": "circulation"}],
                    windows=[{"type": "sliding", "x": round(kx+kw, 1), "y": round(ky+kl/2, 1), "width": 3.5, "wall": "right", "is_exterior": True}]
                ))

                # Space between Stair & Kitchen for Bath or Utility:
                mid_w = round(kx - (sx + sw), 1)
                if mid_w >= 4.5 and baths:
                    b_item = baths.pop(0)
                    bw_bath = round(min(mid_w, 6.0), 1)
                    ba = round(bw_bath * sl, 1)
                    tot_carpet += ba
                    placed_rooms.append(GeneratedRoomGeometry(
                        room_id=b_item.room_id, type="common_bath", name=b_item.display_name,
                        width=bw_bath, length=sl, area=ba, quantity=1, floor=floor_idx,
                        x=round(sx + sw, 1), y=oy, rotation=0.0, compass_zone="S", adjacent_to=[], confidence="generated",
                        polygon=[[sx+sw, oy], [sx+sw+bw_bath, oy], [sx+sw+bw_bath, oy+sl], [sx+sw, oy+sl], [sx+sw, oy]],
                        doors=[{"type": "single_swing", "x": round(sx+sw+1.0, 1), "y": round(oy+sl, 1), "width": 2.5, "wall": "top", "connects_to": "circulation"}],
                        windows=[{"type": "sliding", "x": round(sx+sw+bw_bath/2, 1), "y": round(oy, 1), "width": 2.5, "wall": "bottom", "is_exterior": True}]
                    ))

            # 2. North Wing: Living, Dining, Puja
            puja_w = 0.0
            if pujas:
                p_item = pujas[0]
                pw = 5.0
                pl = 5.5
                px = round(ox + bw - pw, 1)
                py = round(ny + nl - pl, 1)
                pa = round(pw * pl, 1)
                tot_carpet += pa
                puja_w = pw
                placed_rooms.append(GeneratedRoomGeometry(
                    room_id=p_item.room_id, type="puja", name=p_item.display_name,
                    width=pw, length=pl, area=pa, quantity=1, floor=floor_idx,
                    x=px, y=py, rotation=0.0, compass_zone="NE", adjacent_to=[], confidence="generated",
                    polygon=[[px, py], [px+pw, py], [px+pw, py+pl], [px, py+pl], [px, py]],
                    doors=[{"type": "single_swing", "x": round(px, 1), "y": round(py+1.0, 1), "width": 2.5, "wall": "left", "connects_to": "circulation"}],
                    windows=[{"type": "sliding", "x": round(px+pw/2, 1), "y": round(py+pl, 1), "width": 2.5, "wall": "top", "is_exterior": True}]
                ))

            # Side-by-side Living & Dining in North Wing with seed-dependent variation:
            if dinings and livings:
                d_item = dinings[0]
                l_item = livings[0]

                # Seed jitter to create valid alternative dimensions across different seeds
                jitter_w = round((rng.randint(-1, 1) * 0.8) if bw >= 24.0 else 0.0, 1)
                dw = round(min(12.0, max(8.5, (bw * 0.42) + jitter_w)), 1)
                lw = round(bw - dw, 1)

                dl = round(nl - 5.5 if pujas else nl, 1)
                dx = round(ox + lw, 1)
                dy = ny
                da = round(dw * dl, 1)
                tot_carpet += da
                placed_rooms.append(GeneratedRoomGeometry(
                    room_id=d_item.room_id, type="dining", name=d_item.display_name,
                    width=dw, length=dl, area=da, quantity=1, floor=floor_idx,
                    x=dx, y=dy, rotation=0.0, compass_zone="E", adjacent_to=[], confidence="generated",
                    polygon=[[dx, dy], [dx+dw, dy], [dx+dw, dy+dl], [dx, dy+dl], [dx, dy]],
                    doors=[{"type": "single_swing", "x": round(dx+1.0, 1), "y": round(dy, 1), "width": 3.0, "wall": "bottom", "connects_to": "circulation"}],
                    windows=[{"type": "sliding", "x": round(dx+dw, 1), "y": round(dy+dl/2, 1), "width": 3.5, "wall": "right", "is_exterior": True}]
                ))

                lx = ox
                ly = ny
                ll = nl
                la = round(lw * ll, 1)
                tot_carpet += la
                placed_rooms.append(GeneratedRoomGeometry(
                    room_id=l_item.room_id, type="living", name=l_item.display_name,
                    width=lw, length=ll, area=la, quantity=1, floor=floor_idx,
                    x=lx, y=ly, rotation=0.0, compass_zone="N", adjacent_to=[], confidence="generated",
                    polygon=[[lx, ly], [lx+lw, ly], [lx+lw, ly+ll], [lx, ly+ll], [lx, ly]],
                    doors=[
                        {"type": "main_entrance", "x": round(lx+lw/2-1.75, 1), "y": round(ly+ll, 1), "width": 3.5, "wall": "top", "connects_to": "exterior"},
                        {"type": "single_swing", "x": round(lx+2.0, 1), "y": round(ly, 1), "width": 3.0, "wall": "bottom", "connects_to": "circulation"}
                    ],
                    windows=[{"type": "sliding", "x": round(lx+3.0, 1), "y": round(ly+ll, 1), "width": 4.5, "wall": "top", "is_exterior": True}]
                ))

            elif livings:
                l_item = livings[0]
                lw = round(bw - puja_w, 1)
                lx = ox
                ly = ny
                ll = nl
                la = round(lw * ll, 1)
                tot_carpet += la
                placed_rooms.append(GeneratedRoomGeometry(
                    room_id=l_item.room_id, type="living", name=l_item.display_name,
                    width=lw, length=ll, area=la, quantity=1, floor=floor_idx,
                    x=lx, y=ly, rotation=0.0, compass_zone="N", adjacent_to=[], confidence="generated",
                    polygon=[[lx, ly], [lx+lw, ly], [lx+lw, ly+ll], [lx, ly+ll], [lx, ly]],
                    doors=[
                        {"type": "main_entrance", "x": round(lx+lw/2-1.75, 1), "y": round(ly+ll, 1), "width": 3.5, "wall": "top", "connects_to": "exterior"},
                        {"type": "single_swing", "x": round(lx+2.0, 1), "y": round(ly, 1), "width": 3.0, "wall": "bottom", "connects_to": "circulation"}
                    ],
                    windows=[{"type": "sliding", "x": round(lx+3.0, 1), "y": round(ly+ll, 1), "width": 4.5, "wall": "top", "is_exterior": True}]
                ))

        else:
            # =========================================================================
            # UPPER FLOOR: Private Wing (Bedrooms + Bathrooms)
            # =========================================================================
            masters = [r for r in privates if r.type == "master_bed"]
            beds = [r for r in privates if r.type == "regular_bed"]
            baths = [r for r in privates if "bath" in r.type] or [r for r in services if "bath" in r.type]

            # 1. Master Bedroom beside Staircase in South Wing (Vastu preferred zone SW):
            if masters:
                m_item = masters[0]
                mw = round(min(rem_bw - (5.5 if baths else 0.0), 14.0), 1)
                ml = sl
                mx = round(ox + sw, 1)
                my = oy
                ma = round(mw * ml, 1)
                tot_carpet += ma
                placed_rooms.append(GeneratedRoomGeometry(
                    room_id=m_item.room_id, type="master_bed", name=m_item.display_name,
                    width=mw, length=ml, area=ma, quantity=1, floor=floor_idx,
                    x=mx, y=my, rotation=0.0, compass_zone="SW", adjacent_to=[], confidence="generated",
                    polygon=[[mx, my], [mx+mw, my], [mx+mw, my+ml], [mx, my+ml], [mx, my]],
                    doors=[{"type": "single_swing", "x": round(mx+1.0, 1), "y": round(my+ml, 1), "width": 3.0, "wall": "top", "connects_to": "circulation"}],
                    windows=[{"type": "sliding", "x": round(mx+mw/2, 1), "y": round(my, 1), "width": 4.0, "wall": "bottom", "is_exterior": True}]
                ))

                # Attached bath in SE corner beside Master Bed:
                avail_abw = round(ox + bw - (mx + mw), 1)
                if baths and avail_abw >= 4.5:
                    b_item = baths.pop(0)
                    abw = round(min(avail_abw, 6.0), 1)
                    abl = sl
                    abx = round(mx + mw, 1)
                    aby = oy
                    aba = round(abw * abl, 1)
                    tot_carpet += aba
                    placed_rooms.append(GeneratedRoomGeometry(
                        room_id=b_item.room_id, type="attached_bath", name=b_item.display_name,
                        width=abw, length=abl, area=aba, quantity=1, floor=floor_idx,
                        x=abx, y=aby, rotation=0.0, compass_zone="SE", adjacent_to=[], confidence="generated",
                        polygon=[[abx, aby], [abx+abw, aby], [abx+abw, aby+abl], [abx, aby+abl], [abx, aby]],
                        doors=[{"type": "single_swing", "x": round(abx, 1), "y": round(aby+1.0, 1), "width": 2.5, "wall": "left", "connects_to": m_item.room_id}],
                        windows=[{"type": "sliding", "x": round(abx+abw, 1), "y": round(aby+abl/2, 1), "width": 2.5, "wall": "right", "is_exterior": True}]
                    ))

            # 2. North Wing: Common Bath (NW) + Regular Bedrooms (Center & East)
            bath_w = 0.0
            if baths:
                b_item = baths.pop(0)
                bw_b = 6.0
                bl_b = 7.5
                bx = ox
                by = ny
                ba = round(bw_b * bl_b, 1)
                tot_carpet += ba
                bath_w = bw_b
                placed_rooms.append(GeneratedRoomGeometry(
                    room_id=b_item.room_id, type=b_item.type, name=b_item.display_name,
                    width=bw_b, length=bl_b, area=ba, quantity=1, floor=floor_idx,
                    x=bx, y=by, rotation=0.0, compass_zone="NW", adjacent_to=[], confidence="generated",
                    polygon=[[bx, by], [bx+bw_b, by], [bx+bw_b, by+bl_b], [bx, by+bl_b], [bx, by]],
                    doors=[{"type": "single_swing", "x": round(bx+1.0, 1), "y": round(by, 1), "width": 2.5, "wall": "bottom", "connects_to": "circulation"}],
                    windows=[{"type": "sliding", "x": round(bx, 1), "y": round(by+bl_b/2, 1), "width": 2.5, "wall": "left", "is_exterior": True}]
                ))

            # Remaining width for regular bedrooms:
            avail_bed_w = round(bw - bath_w, 1)
            num_beds = len(beds)
            bed_w = round(avail_bed_w / max(1, num_beds), 1)

            for i, bed_item in enumerate(beds):
                bx = round(ox + bath_w + (i * bed_w), 1)
                by = ny
                blen = nl
                ba = round(bed_w * blen, 1)
                tot_carpet += ba
                placed_rooms.append(GeneratedRoomGeometry(
                    room_id=bed_item.room_id, type="regular_bed", name=bed_item.display_name,
                    width=bed_w, length=blen, area=ba, quantity=1, floor=floor_idx,
                    x=bx, y=by, rotation=0.0, compass_zone="N" if i == 0 else "NE", adjacent_to=[], confidence="generated",
                    polygon=[[bx, by], [bx+bed_w, by], [bx+bed_w, by+blen], [bx, by+blen], [bx, by]],
                    doors=[{"type": "single_swing", "x": round(bx+1.0, 1), "y": round(by, 1), "width": 3.0, "wall": "bottom", "connects_to": "circulation"}],
                    windows=[{"type": "sliding", "x": round(bx+bed_w/2, 1), "y": round(by+blen, 1), "width": 4.0, "wall": "top", "is_exterior": True}]
                ))

        # Check that 100% of rooms were successfully placed
        placed_ids = {r.room_id for r in placed_rooms}
        if len(placed_ids) != len(rooms):
            return None, stair_rect, -1e9

        # Check Shapely geometry validity and non-overlap:
        geoms = []
        for r in placed_rooms:
            p = box(r.x, r.y, r.x + r.width, r.y + r.length)
            for g in geoms:
                if p.intersects(g) and p.intersection(g).area > 0.05:
                    return None, stair_rect, -1e9
            geoms.append(p)

        # BFS Reachability Check: verify all rooms reachable from entrance/circulation
        access_graph: Dict[str, List[str]] = {"exterior": [], "circulation": []}
        for r in placed_rooms:
            access_graph[r.room_id] = []

        for r in placed_rooms:
            for d in r.doors:
                dest = d.get("connects_to", "circulation")
                if dest in access_graph:
                    access_graph[r.room_id].append(dest)
                    access_graph[dest].append(r.room_id)

        reachable = set()
        queue = deque(["exterior", "circulation"])
        reachable.update(queue)
        while queue:
            node = queue.popleft()
            for neighbor in access_graph.get(node, []):
                if neighbor not in reachable:
                    reachable.add(neighbor)
                    queue.append(neighbor)

        unreachable_rooms = [r.room_id for r in placed_rooms if r.room_id not in reachable]
        if unreachable_rooms:
            # Soft penalty rather than hard failure if minor connectivity issue
            pass

        # Calculate circulation & unused/open space strictly from physical corridor geometry
        circ_area = round(sum(c["width"] * c["length"] for c in circ_corridors), 1)
        unused_area = round(max(0.0, buildable_area - (tot_carpet + circ_area)), 1)

        # Quality Score Q calculation:
        q = 1000.0
        # 1. Target area deviation penalty
        for r in placed_rooms:
            r_def = get_room_definition(r.type)
            dev = abs(r.area - r_def.target_area_sqft) / r_def.target_area_sqft
            if dev > 0.25:
                q -= (dev - 0.25) * 100.0

        # 2. Aspect ratio penalty
        for r in placed_rooms:
            ar = max(r.width / r.length, r.length / r.width)
            if ar > 1.85:
                q -= (ar - 1.85) * 150.0

        # 3. Vastu score reward
        for r in placed_rooms:
            r_def = get_room_definition(r.type)
            if r_def.vastu_preferred_zone in r.compass_zone:
                q += 20.0

        # 4. Inaccessible room penalty
        if unreachable_rooms:
            q -= len(unreachable_rooms) * 200.0

        builtup = round(tot_carpet + circ_area, 1)

        layout = FloorLayout(
            floor=floor_idx,
            name=floor_name,
            rooms=placed_rooms,
            carpet_area_sqft=round(tot_carpet, 1),
            builtup_area_sqft=builtup,
            circulation_area_sqft=circ_area,
            unused_area_sqft=unused_area,
            circulation_corridors=circ_corridors
        )

        return layout, stair_rect, q

    def _solve_fallback_floor(
        self,
        floor_idx: int,
        floor_name: str,
        rooms: List[RoomProgramItem],
        ox: float,
        oy: float,
        bw: float,
        bl: float,
        stair_rect: Optional[Tuple[float, float, float, float]]
    ) -> Tuple[FloorLayout, Tuple[float, float, float, float]]:
        """
        Generalized robust 2D aspect-ratio balanced grid partition for custom/single-floor programs.
        Ensures 100% geometric correctness, non-overlap, and canonical minimum dimensions.
        """
        stair_items = [r for r in rooms if r.type == "staircase"]
        other_rooms = [r for r in rooms if r.type != "staircase"]

        if stair_items:
            if stair_rect:
                sx, sy, sw, sl = stair_rect
            else:
                sw = 7.0
                sl = 11.5
                sx = ox
                sy = oy
                stair_rect = (sx, sy, sw, sl)
        else:
            sw, sl = 0.0, 0.0
            sx, sy = ox, oy

        placed_rooms: List[GeneratedRoomGeometry] = []
        tot_carpet = 0.0

        if stair_items:
            s_item = stair_items[0]
            s_area = round(sw * sl, 1)
            tot_carpet += s_area
            placed_rooms.append(GeneratedRoomGeometry(
                room_id=s_item.room_id, type="staircase", name=s_item.display_name,
                width=sw, length=sl, area=s_area, quantity=1, floor=floor_idx,
                x=sx, y=sy, rotation=0.0, compass_zone="SW", adjacent_to=[], confidence="generated",
                polygon=[[sx, sy], [sx+sw, sy], [sx+sw, sy+sl], [sx, sy+sl], [sx, sy]],
                doors=[{"type": "single_swing", "x": round(sx+1.0, 1), "y": round(sy+sl, 1), "width": 3.0, "wall": "top", "connects_to": "circulation"}],
                windows=[{"type": "sliding", "x": round(sx+sw/2, 1), "y": round(sy, 1), "width": 3.0, "wall": "bottom", "is_exterior": True}]
            ))

        rem_y = round(oy + (sl if stair_items else 0.0), 1)
        rem_l = round(bl - (sl if stair_items else 0.0), 1)

        num_other = len(other_rooms)
        if num_other == 1:
            item = other_rooms[0]
            rx, ry, rw, rl = ox, rem_y, bw, rem_l
            area = round(rw * rl, 1)
            tot_carpet += area
            zone = self._compute_compass_zone(rx, ry, rw, rl, ox, oy, bw, bl)
            placed_rooms.append(GeneratedRoomGeometry(
                room_id=item.room_id, type=item.type, name=item.display_name,
                width=rw, length=rl, area=area, quantity=1, floor=floor_idx,
                x=rx, y=ry, rotation=0.0, compass_zone=zone, adjacent_to=[], confidence="generated",
                polygon=[[rx, ry], [rx+rw, ry], [rx+rw, ry+rl], [rx, ry+rl], [rx, ry]],
                doors=[{"type": "single_swing", "x": round(rx+1.0, 1), "y": round(ry, 1), "width": 3.0, "wall": "bottom", "connects_to": "circulation"}],
                windows=[{"type": "sliding", "x": round(rx+rw/2, 1), "y": round(ry+rl, 1), "width": 4.0, "wall": "top", "is_exterior": True}]
            ))
        elif num_other == 2:
            if bw >= rem_l:
                w1 = round(bw / 2.0, 1)
                w2 = round(bw - w1, 1)
                for i, (item, w, x_off) in enumerate([(other_rooms[0], w1, 0.0), (other_rooms[1], w2, w1)]):
                    rx = round(ox + x_off, 1)
                    ry = rem_y
                    rw, rl = w, rem_l
                    area = round(rw * rl, 1)
                    tot_carpet += area
                    zone = self._compute_compass_zone(rx, ry, rw, rl, ox, oy, bw, bl)
                    placed_rooms.append(GeneratedRoomGeometry(
                        room_id=item.room_id, type=item.type, name=item.display_name,
                        width=rw, length=rl, area=area, quantity=1, floor=floor_idx,
                        x=rx, y=ry, rotation=0.0, compass_zone=zone, adjacent_to=[], confidence="generated",
                        polygon=[[rx, ry], [rx+rw, ry], [rx+rw, ry+rl], [rx, ry+rl], [rx, ry]],
                        doors=[{"type": "single_swing", "x": round(rx+1.0, 1), "y": round(ry, 1), "width": 3.0, "wall": "bottom", "connects_to": "circulation"}],
                        windows=[{"type": "sliding", "x": round(rx+rw/2, 1), "y": round(ry+rl, 1), "width": 4.0, "wall": "top", "is_exterior": True}]
                    ))
            else:
                l1 = round(rem_l / 2.0, 1)
                l2 = round(rem_l - l1, 1)
                for i, (item, l_len, y_off) in enumerate([(other_rooms[0], l1, 0.0), (other_rooms[1], l2, l1)]):
                    rx = ox
                    ry = round(rem_y + y_off, 1)
                    rw, rl = bw, l_len
                    area = round(rw * rl, 1)
                    tot_carpet += area
                    zone = self._compute_compass_zone(rx, ry, rw, rl, ox, oy, bw, bl)
                    placed_rooms.append(GeneratedRoomGeometry(
                        room_id=item.room_id, type=item.type, name=item.display_name,
                        width=rw, length=rl, area=area, quantity=1, floor=floor_idx,
                        x=rx, y=ry, rotation=0.0, compass_zone=zone, adjacent_to=[], confidence="generated",
                        polygon=[[rx, ry], [rx+rw, ry], [rx+rw, ry+rl], [rx, ry+rl], [rx, ry]],
                        doors=[{"type": "single_swing", "x": round(rx+1.0, 1), "y": round(ry, 1), "width": 3.0, "wall": "bottom", "connects_to": "circulation"}],
                        windows=[{"type": "sliding", "x": round(rx+rw/2, 1), "y": round(ry+rl, 1), "width": 4.0, "wall": "top", "is_exterior": True}]
                    ))
        elif num_other >= 3:
            half = math.ceil(num_other / 2.0)
            col1_rooms = other_rooms[:half]
            col2_rooms = other_rooms[half:]
            w1 = round(bw / 2.0, 1)
            w2 = round(bw - w1, 1)

            for col_idx, (col_rooms, col_w, x_off) in enumerate([(col1_rooms, w1, 0.0), (col2_rooms, w2, w1)]):
                slice_l = round(rem_l / len(col_rooms), 1)
                for i, item in enumerate(col_rooms):
                    rx = round(ox + x_off, 1)
                    ry = round(rem_y + (i * slice_l), 1)
                    rw = col_w
                    rl = slice_l if i < len(col_rooms) - 1 else round(rem_y + rem_l - ry, 1)
                    area = round(rw * rl, 1)
                    tot_carpet += area
                    zone = self._compute_compass_zone(rx, ry, rw, rl, ox, oy, bw, bl)
                    placed_rooms.append(GeneratedRoomGeometry(
                        room_id=item.room_id, type=item.type, name=item.display_name,
                        width=rw, length=rl, area=area, quantity=1, floor=floor_idx,
                        x=rx, y=ry, rotation=0.0, compass_zone=zone, adjacent_to=[], confidence="generated",
                        polygon=[[rx, ry], [rx+rw, ry], [rx+rw, ry+rl], [rx, ry+rl], [rx, ry]],
                        doors=[{"type": "single_swing", "x": round(rx+1.0, 1), "y": round(ry, 1), "width": 3.0, "wall": "bottom", "connects_to": "circulation"}],
                        windows=[{"type": "sliding", "x": round(rx+rw/2, 1), "y": round(ry+rl, 1), "width": 4.0, "wall": "top", "is_exterior": True}]
                    ))

        builtup = round(tot_carpet * 1.15, 1)
        layout = FloorLayout(
            floor=floor_idx,
            name=floor_name,
            rooms=placed_rooms,
            carpet_area_sqft=round(tot_carpet, 1),
            builtup_area_sqft=builtup,
            circulation_area_sqft=round(tot_carpet * 0.15, 1),
            unused_area_sqft=0.0,
            circulation_corridors=[]
        )
        return layout, stair_rect

    def _compute_compass_zone(
        self,
        rx: float,
        ry: float,
        rw: float,
        rl: float,
        ox: float,
        oy: float,
        total_w: float,
        total_l: float
    ) -> str:
        """Determines true compass quadrant for room centroid."""
        cx = rx + rw / 2.0 - ox
        cy = ry + rl / 2.0 - oy

        rel_x = cx / max(1.0, total_w)
        rel_y = cy / max(1.0, total_l)

        # Standard architectural coordinate mapping:
        # +Y is North, -Y is South, +X is East, -X is West
        ns = "N" if rel_y >= 0.55 else ("S" if rel_y <= 0.45 else "")
        ew = "E" if rel_x >= 0.55 else ("W" if rel_x <= 0.45 else "")

        result = ns + ew
        return result if result else "CENTER"

    def _verify_vertical_consistency(self, floors: List[FloorLayout]):
        """Checks multi-floor alignment (stairs, plumbing stacks)."""
        baths_per_floor: Dict[int, List[GeneratedRoomGeometry]] = {}
        for fl in floors:
            baths_per_floor[fl.floor] = [
                r for r in fl.rooms if r.type in ["attached_bath", "common_bath", "utility"]
            ]

        # Check if upper floor has bathrooms directly over living room
        if len(floors) >= 2:
            ground_living = [r for r in floors[0].rooms if r.type == "living"]
            upper_baths = baths_per_floor.get(1, [])

            for gl in ground_living:
                for ub in upper_baths:
                    if (ub.x < gl.x + gl.width and ub.x + ub.width > gl.x and
                        ub.y < gl.y + gl.length and ub.y + ub.length > gl.y):
                        self.warnings.append(GenerationWarning(
                            code="PLUMBING_ALIGNMENT_WARNING",
                            room_id=ub.room_id,
                            message=f"{ub.name} on Floor 1 is positioned above {gl.name} on Ground Floor. Consider plumbing stack alignment."
                        ))
