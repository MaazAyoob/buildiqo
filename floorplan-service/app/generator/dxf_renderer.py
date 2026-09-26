"""
Buildiqo.AI - Phase 2.0 Architectural DXF Generator
Generates clean, standardized CAD DXF files from the exact same
deterministic solver geometry using ezdxf.
"""
import io
import ezdxf
from typing import Optional
from .schemas import GeneratedFloorplanResponse, FloorLayout

def render_floorplan_dxf(response: GeneratedFloorplanResponse, active_floor_idx: int = 0) -> io.BytesIO:
    """
    Renders the generated floorplan geometry into a standard AutoCAD R2018 DXF document.
    """
    doc = ezdxf.new("R2018", setup=True)
    msp = doc.modelspace()

    # 1. Setup CAD Layers
    layers = [
        ("PLOT_BOUNDARY", 7, "CONTINUOUS"),
        ("SETBACK_LINE", 1, "DASHED"),
        ("WALLS", 4, "CONTINUOUS"),
        ("ROOM_WALLS", 4, "CONTINUOUS"),
        ("ROOM_LABELS", 2, "CONTINUOUS"),
        ("DOORS", 5, "CONTINUOUS"),
        ("WINDOWS", 6, "CONTINUOUS"),
        ("CIRCULATION", 8, "DASHED"),
        ("FURNITURE", 9, "CONTINUOUS"),
        ("OPEN_AREAS", 3, "DASHED")
    ]
    for layer_name, color, linetype in layers:
        if layer_name not in doc.layers:
            doc.layers.add(layer_name, color=color, linetype=linetype)

    plot_w = response.plot.get("width_ft", 30.0)
    plot_l = response.plot.get("length_ft", 40.0)
    setback = response.setback_ft

    # 2. Draw Plot Boundary
    plot_pts = [(0, 0), (plot_w, 0), (plot_w, plot_l), (0, plot_l), (0, 0)]
    msp.add_lwpolyline(plot_pts, dxfattribs={"layer": "PLOT_BOUNDARY", "lineweight": 35})

    # 3. Draw Setback Boundary
    sx0, sy0 = setback, setback
    sx1, sy1 = plot_w - setback, plot_l - setback
    setback_pts = [(sx0, sy0), (sx1, sy0), (sx1, sy1), (sx0, sy1), (sx0, sy0)]
    msp.add_lwpolyline(setback_pts, dxfattribs={"layer": "SETBACK_LINE", "lineweight": 15})

    # 4. Draw Selected Floor Rooms, Walls, and Furniture
    target_floor = None
    for fl in response.floors:
        if fl.floor == active_floor_idx:
            target_floor = fl
            break
    if not target_floor and response.floors:
        target_floor = response.floors[0]

    if target_floor:
        # Draw Wall Segments
        for wall in getattr(target_floor, "walls", []) or []:
            sp = wall.get("start", [0, 0])
            ep = wall.get("end", [0, 0])
            wtype = wall.get("wall_type", "interior")
            lweight = 35 if wtype == "exterior" else 20
            msp.add_line((sp[0], sp[1]), (ep[0], ep[1]), dxfattribs={"layer": "WALLS", "lineweight": lweight})

        # Draw Open Areas
        for oa in getattr(target_floor, "open_areas", []) or []:
            ox, oy = oa["x"], oa["y"]
            ow, ol = oa["width"], oa["length"]
            o_pts = [(ox, oy), (ox + ow, oy), (ox + ow, oy + ol), (ox, oy + ol), (ox, oy)]
            msp.add_lwpolyline(o_pts, dxfattribs={"layer": "OPEN_AREAS", "lineweight": 15})
            msp.add_text(
                oa.get("name", "OPEN AREA").upper(),
                dxfattribs={"layer": "OPEN_AREAS", "height": 0.6}
            ).set_placement((ox + ow/2, oy + ol/2), align=ezdxf.enums.TextEntityAlignment.MIDDLE_CENTER)

        # Draw Circulation Corridors
        for corridor in getattr(target_floor, "circulation_corridors", []) or []:
            cx, cy = corridor["x"], corridor["y"]
            cw, cl = corridor["width"], corridor["length"]
            c_pts = [(cx, cy), (cx + cw, cy), (cx + cw, cy + cl), (cx, cy + cl), (cx, cy)]
            msp.add_lwpolyline(c_pts, dxfattribs={"layer": "CIRCULATION", "lineweight": 15})

        for room in target_floor.rooms:
            rx, ry = room.x, room.y
            rw, rl = room.width, room.length

            # Room wall polyline
            room_pts = [(rx, ry), (rx + rw, ry), (rx + rw, ry + rl), (rx, ry + rl), (rx, ry)]
            msp.add_lwpolyline(room_pts, dxfattribs={"layer": "ROOM_WALLS", "lineweight": 30})

            # Centered Text Label
            cx = rx + (rw / 2.0)
            cy = ry + (rl / 2.0)

            dim_display = getattr(room, "formatted_dimensions", f"{rw:.1f}' x {rl:.1f}'")

            msp.add_text(
                room.name.upper(),
                dxfattribs={
                    "layer": "ROOM_LABELS",
                    "height": 0.8,
                    "style": "OpenSans"
                }
            ).set_placement((cx, cy + 0.5), align=ezdxf.enums.TextEntityAlignment.MIDDLE_CENTER)

            msp.add_text(
                f"{dim_display} ({room.area:.0f} sq.ft)",
                dxfattribs={
                    "layer": "ROOM_LABELS",
                    "height": 0.6,
                    "style": "OpenSans"
                }
            ).set_placement((cx, cy - 0.5), align=ezdxf.enums.TextEntityAlignment.MIDDLE_CENTER)

            # Draw Doors
            for door in room.doors:
                dx = door.get("x", rx)
                dy = door.get("y", ry)
                dw = door.get("width", 3.0)
                msp.add_line((dx, dy), (dx + dw, dy), dxfattribs={"layer": "DOORS", "lineweight": 20})

            # Draw Windows
            for win in room.windows:
                wx = win.get("x", rx)
                wy = win.get("y", ry + rl)
                ww = win.get("width", 4.0)
                msp.add_line((wx, wy), (wx + ww, wy), dxfattribs={"layer": "WINDOWS", "lineweight": 25})

            # Draw Furniture
            for fi in getattr(room, "furniture", []) or []:
                fx, fy = fi["x"], fi["y"]
                fw, fl = fi["width"], fi["length"]
                f_pts = [(fx, fy), (fx + fw, fy), (fx + fw, fy + fl), (fx, fy + fl), (fx, fy)]
                msp.add_lwpolyline(f_pts, dxfattribs={"layer": "FURNITURE", "lineweight": 10})

    stream = io.StringIO()
    doc.write(stream)
    return io.BytesIO(stream.getvalue().encode("utf-8"))

