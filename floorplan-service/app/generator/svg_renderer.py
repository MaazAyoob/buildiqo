"""
Buildiqo.AI - Phase 3 Architectural SVG Renderer
Renders high-fidelity, professional architectural vector SVG floor plans
complete with structural walls, schematic furniture, door swings, exterior windows,
formatted dimensions, and layer groups for interactive Studio toggling.
"""
import html
from typing import Dict, List, Optional
from .schemas import GeneratedFloorplanResponse, FloorLayout, GeneratedRoomGeometry
from .room_registry import format_room_dimensions

CATEGORY_COLORS = {
    "living": {"fill": "#f8fafc", "stroke": "#1e293b", "label": "#0f172a"},
    "bedroom": {"fill": "#f8fafc", "stroke": "#1e293b", "label": "#0f172a"},
    "utility": {"fill": "#f8fafc", "stroke": "#1e293b", "label": "#0f172a"},
    "bath": {"fill": "#f1f5f9", "stroke": "#334155", "label": "#1e293b"},
    "outdoor": {"fill": "#ecfdf5", "stroke": "#065f46", "label": "#065f46"},
    "circulation": {"fill": "#f8fafc", "stroke": "#64748b", "label": "#475569"},
    "special": {"fill": "#faf5ff", "stroke": "#6b21a8", "label": "#581c87"}
}

def render_floorplan_svg(response: GeneratedFloorplanResponse, active_floor_idx: int = 0) -> str:
    """
    Produces clean, conceptual architectural drawings in monochrome with subtle blue highlights.
    """
    plot_w = response.plot.get("width_ft", 30.0)
    plot_l = response.plot.get("length_ft", 40.0)
    setback = response.setback_ft

    scale = 18.0
    margin = 55.0

    svg_w = (plot_w * scale) + (margin * 2)
    svg_h = (plot_l * scale) + (margin * 2)

    target_floor = None
    for f in response.floors:
        if f.floor == active_floor_idx:
            target_floor = f
            break
    if not target_floor and response.floors:
        target_floor = response.floors[0]

    rooms = target_floor.rooms if target_floor else []

    svg_parts: List[str] = []
    svg_parts.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {svg_w:.1f} {svg_h:.1f}" '
        f'width="100%" height="100%" style="background-color: #ffffff; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;">'
    )

    # Defs
    svg_parts.append('''
    <defs>
        <pattern id="grid" width="18" height="18" patternUnits="userSpaceOnUse">
            <path d="M 18 0 L 0 0 0 18" fill="none" stroke="#f8fafc" stroke-width="0.8"/>
        </pattern>
        <pattern id="courtyard_hatch" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 0 8 L 8 0 M 0 0 L 8 8" fill="none" stroke="#e2e8f0" stroke-width="0.75"/>
        </pattern>
        <filter id="shadow" x="-2%" y="-2%" width="104%" height="104%">
            <feDropShadow dx="1" dy="1.5" stdDeviation="1.5" flood-opacity="0.06"/>
        </filter>
    </defs>
    ''')

    # 1. Background grid
    svg_parts.append(f'<rect width="{svg_w:.1f}" height="{svg_h:.1f}" fill="url(#grid)" />')

    # 2. Plot boundary
    px = margin
    py = margin
    pw = plot_w * scale
    pl = plot_l * scale
    svg_parts.append(f'<g id="plot_boundary">')
    svg_parts.append(
        f'<rect x="{px:.1f}" y="{py:.1f}" width="{pw:.1f}" height="{pl:.1f}" '
        f'fill="#fafafa" stroke="#0f172a" stroke-width="2.5" stroke-dasharray="8,4" />'
    )
    svg_parts.append(
        f'<text x="{px + pw/2:.1f}" y="{py - 14:.1f}" text-anchor="middle" font-size="11" font-weight="700" fill="#475569">'
        f'PLOT BOUNDARY: {plot_w:.0f}&apos; × {plot_l:.0f}&apos; ({plot_w*plot_l:.0f} SQ.FT)'
        f'</text>'
    )
    svg_parts.append('</g>')

    # 3. Setback boundary
    sx = margin + (setback * scale)
    sy = margin + (setback * scale)
    sw = (plot_w - 2 * setback) * scale
    sl = (plot_l - 2 * setback) * scale
    svg_parts.append(f'<g id="setback_boundary">')
    svg_parts.append(
        f'<rect x="{sx:.1f}" y="{sy:.1f}" width="{sw:.1f}" height="{sl:.1f}" '
        f'fill="none" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="4,4" />'
    )
    svg_parts.append(
        f'<text x="{sx + 6:.1f}" y="{sy + 14:.1f}" font-size="9" font-weight="600" fill="#b45309">'
        f'BUILDABLE ENVELOPE ({setback:.0f}&apos; SETBACK)'
        f'</text>'
    )
    svg_parts.append('</g>')

    # 3.5 Open / Courtyard Areas Layer
    open_areas = getattr(target_floor, "open_areas", []) or []
    if open_areas:
        svg_parts.append('<g id="open_areas">')
        for idx, oa in enumerate(open_areas):
            oax = margin + (oa["x"] * scale)
            oay = margin + (plot_l - (oa["y"] + oa["length"])) * scale
            oaw = oa["width"] * scale
            oal = oa["length"] * scale
            svg_parts.append(
                f'<rect id="open_{idx}" x="{oax:.1f}" y="{oay:.1f}" width="{oaw:.1f}" height="{oal:.1f}" '
                f'fill="url(#courtyard_hatch)" stroke="#cbd5e1" stroke-width="1.0" stroke-dasharray="2,2"/>'
            )
            svg_parts.append(
                f'<text x="{oax + oaw/2:.1f}" y="{oay + oal/2 + 3:.1f}" text-anchor="middle" font-size="9" font-weight="700" fill="#64748b">'
                f'{html.escape(oa.get("name", "Open Area").upper())}'
                f'</text>'
            )
        svg_parts.append('</g>')

    # 4. Circulation Layer
    circ_list = getattr(target_floor, "circulation_corridors", []) or []
    if circ_list:
        svg_parts.append('<g id="circulation">')
        for idx, corridor in enumerate(circ_list):
            ccx = margin + (corridor["x"] * scale)
            ccy = margin + (plot_l - (corridor["y"] + corridor["length"])) * scale
            ccw = corridor["width"] * scale
            ccl = corridor["length"] * scale
            svg_parts.append(
                f'<rect id="corridor_{idx}" x="{ccx:.1f}" y="{ccy:.1f}" width="{ccw:.1f}" height="{ccl:.1f}" '
                f'fill="#f8fafc" stroke="#94a3b8" stroke-width="1.0" stroke-dasharray="3,3" />'
            )
            svg_parts.append(
                f'<text x="{ccx + ccw/2:.1f}" y="{ccy + ccl/2 + 3:.1f}" text-anchor="middle" font-size="8.5" font-weight="600" fill="#64748b">'
                f'CIRCULATION &bull; {corridor["width"]:.0f}&apos; × {corridor["length"]:.0f}&apos;'
                f'</text>'
            )
        svg_parts.append('</g>')

    # 5. Rooms Layer
    svg_parts.append('<g id="rooms">')
    for room in rooms:
        rx = margin + (room.x * scale)
        ry = margin + (plot_l - (room.y + room.length)) * scale
        rw = room.width * scale
        rl = room.length * scale

        cat = "living" if room.type in ["living", "dining"] else \
              "bedroom" if "bed" in room.type else \
              "utility" if room.type in ["kitchen", "utility"] else \
              "bath" if "bath" in room.type else \
              "special" if room.type in ["puja", "office"] else "circulation"

        colors = CATEGORY_COLORS.get(cat, CATEGORY_COLORS["living"])

        # Room boundary polygon
        svg_parts.append(
            f'<rect id="room_{html.escape(room.room_id)}" x="{rx:.1f}" y="{ry:.1f}" width="{rw:.1f}" height="{rl:.1f}" '
            f'fill="{colors["fill"]}" stroke="#1e293b" stroke-width="1.8" filter="url(#shadow)" rx="2"/>'
        )

        # Room Labels: Centered title, ft-in dimensions, area
        cx = rx + (rw / 2.0)
        cy = ry + (rl / 2.0)

        esc_name = html.escape(room.name.upper())
        dim_str = getattr(room, "formatted_dimensions", "")
        if not dim_str:
            dim_str = format_room_dimensions(room.width, room.length)
        dim_str = dim_str.replace("'", "&apos;")
        area_str = f"{room.area:.0f} SQ.FT"

        svg_parts.append(
            f'<text x="{cx:.1f}" y="{cy - 9:.1f}" text-anchor="middle" font-size="10.5" font-weight="800" fill="#0f172a">'
            f'{esc_name}'
            f'</text>'
        )
        svg_parts.append(
            f'<text x="{cx:.1f}" y="{cy + 6:.1f}" text-anchor="middle" font-size="9" font-weight="600" fill="#475569">'
            f'{dim_str}'
            f'</text>'
        )
        svg_parts.append(
            f'<text x="{cx:.1f}" y="{cy + 20:.1f}" text-anchor="middle" font-size="8.5" font-weight="700" fill="#2563eb">'
            f'{area_str}'
            f'</text>'
        )
    svg_parts.append('</g>')

    # 6. Schematic Furniture Layer
    svg_parts.append('<g id="furniture">')
    for room in rooms:
        furn_items = getattr(room, "furniture", []) or []
        for fi in furn_items:
            fx = margin + (fi["x"] * scale)
            fy = margin + (plot_l - (fi["y"] + fi["length"])) * scale
            fw = fi["width"] * scale
            fl = fi["length"] * scale

            ftype = fi.get("type", "generic")
            if ftype == "bed":
                # Bed outline with pillow styling
                svg_parts.append(
                    f'<rect x="{fx:.1f}" y="{fy:.1f}" width="{fw:.1f}" height="{fl:.1f}" fill="#ffffff" stroke="#94a3b8" stroke-width="1.2" rx="3"/>'
                )
                pil_w = fw * 0.38
                pil_l = fl * 0.22
                svg_parts.append(
                    f'<rect x="{fx + fw*0.08:.1f}" y="{fy + 3:.1f}" width="{pil_w:.1f}" height="{pil_l:.1f}" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.8" rx="2"/>'
                )
                svg_parts.append(
                    f'<rect x="{fx + fw*0.54:.1f}" y="{fy + 3:.1f}" width="{pil_w:.1f}" height="{pil_l:.1f}" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.8" rx="2"/>'
                )
                svg_parts.append(
                    f'<line x1="{fx:.1f}" y1="{fy + fl*0.35:.1f}" x2="{fx+fw:.1f}" y2="{fy + fl*0.35:.1f}" stroke="#cbd5e1" stroke-width="0.8"/>'
                )
            elif ftype == "sofa":
                svg_parts.append(
                    f'<rect x="{fx:.1f}" y="{fy:.1f}" width="{fw:.1f}" height="{fl:.1f}" fill="#ffffff" stroke="#94a3b8" stroke-width="1.2" rx="4"/>'
                )
                svg_parts.append(
                    f'<rect x="{fx + 3:.1f}" y="{fy + 3:.1f}" width="{fw - 6:.1f}" height="{fl - 6:.1f}" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="0.8" rx="2"/>'
                )
            elif ftype == "fixture" and "wc" in fi.get("id", ""):
                # WC symbol (cistern + bowl)
                cistern_h = fl * 0.32
                svg_parts.append(
                    f'<rect x="{fx:.1f}" y="{fy:.1f}" width="{fw:.1f}" height="{cistern_h:.1f}" fill="#ffffff" stroke="#64748b" stroke-width="1.0" rx="1"/>'
                )
                svg_parts.append(
                    f'<ellipse cx="{fx + fw/2:.1f}" cy="{fy + fl*0.65:.1f}" rx="{fw*0.42:.1f}" ry="{fl*0.34:.1f}" fill="#ffffff" stroke="#64748b" stroke-width="1.0"/>'
                )
            elif ftype == "fixture" and "basin" in fi.get("id", ""):
                svg_parts.append(
                    f'<rect x="{fx:.1f}" y="{fy:.1f}" width="{fw:.1f}" height="{fl:.1f}" fill="#ffffff" stroke="#64748b" stroke-width="1.0" rx="2"/>'
                    f'<ellipse cx="{fx + fw/2:.1f}" cy="{fy + fl/2:.1f}" rx="{fw*0.36:.1f}" ry="{fl*0.34:.1f}" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.8"/>'
                )
            elif ftype == "counter":
                svg_parts.append(
                    f'<rect x="{fx:.1f}" y="{fy:.1f}" width="{fw:.1f}" height="{fl:.1f}" fill="#f1f5f9" stroke="#64748b" stroke-width="1.2"/>'
                )
            else:
                svg_parts.append(
                    f'<rect x="{fx:.1f}" y="{fy:.1f}" width="{fw:.1f}" height="{fl:.1f}" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.0" rx="2"/>'
                )
    svg_parts.append('</g>')

    # 7. Doors Layer with wall-aware swing arcs
    svg_parts.append('<g id="doors">')
    for room in rooms:
        for door in room.doors:
            dx = margin + (door.get("x", room.x) * scale)
            dy = margin + (plot_l - (door.get("y", room.y))) * scale
            dw = door.get("width", 3.0) * scale
            wall = door.get("wall", "bottom")

            # Door pivot dot
            svg_parts.append(
                f'<circle cx="{dx:.1f}" cy="{dy:.1f}" r="2.5" fill="#1e3a8a"/>'
            )

            # Wall-aware door leaf + arc swinging INTO the room
            if wall == "bottom":
                # Wall at bottom → door opens upward in floor coords (= upward in SVG too since Y is flipped)
                svg_parts.append(f'<line x1="{dx:.1f}" y1="{dy:.1f}" x2="{dx:.1f}" y2="{dy - dw:.1f}" stroke="#2563eb" stroke-width="1.8"/>')
                svg_parts.append(f'<path d="M {dx:.1f} {dy - dw:.1f} A {dw:.1f} {dw:.1f} 0 0 1 {dx + dw:.1f} {dy:.1f}" fill="none" stroke="#60a5fa" stroke-width="1.2" stroke-dasharray="2,2"/>')
            elif wall == "top":
                # Wall at top → door opens downward in SVG coords
                svg_parts.append(f'<line x1="{dx:.1f}" y1="{dy:.1f}" x2="{dx:.1f}" y2="{dy + dw:.1f}" stroke="#2563eb" stroke-width="1.8"/>')
                svg_parts.append(f'<path d="M {dx:.1f} {dy + dw:.1f} A {dw:.1f} {dw:.1f} 0 0 0 {dx + dw:.1f} {dy:.1f}" fill="none" stroke="#60a5fa" stroke-width="1.2" stroke-dasharray="2,2"/>')
            elif wall == "left":
                # Wall at left → door opens rightward
                svg_parts.append(f'<line x1="{dx:.1f}" y1="{dy:.1f}" x2="{dx + dw:.1f}" y2="{dy:.1f}" stroke="#2563eb" stroke-width="1.8"/>')
                svg_parts.append(f'<path d="M {dx + dw:.1f} {dy:.1f} A {dw:.1f} {dw:.1f} 0 0 0 {dx:.1f} {dy - dw:.1f}" fill="none" stroke="#60a5fa" stroke-width="1.2" stroke-dasharray="2,2"/>')
            else:  # right
                # Wall at right → door opens leftward
                svg_parts.append(f'<line x1="{dx:.1f}" y1="{dy:.1f}" x2="{dx - dw:.1f}" y2="{dy:.1f}" stroke="#2563eb" stroke-width="1.8"/>')
                svg_parts.append(f'<path d="M {dx - dw:.1f} {dy:.1f} A {dw:.1f} {dw:.1f} 0 0 1 {dx:.1f} {dy - dw:.1f}" fill="none" stroke="#60a5fa" stroke-width="1.2" stroke-dasharray="2,2"/>')
    svg_parts.append('</g>')

    # 8. Windows Layer
    svg_parts.append('<g id="windows">')
    for room in rooms:
        for win in room.windows:
            wx = margin + (win.get("x", room.x) * scale)
            wy = margin + (plot_l - (win.get("y", room.y + room.length))) * scale
            ww = win.get("width", 4.0) * scale
            wall = win.get("wall", "top")

            # Architectural double line for window opening
            if wall in ["top", "bottom"]:
                svg_parts.append(
                    f'<rect x="{wx:.1f}" y="{wy - 2:.1f}" width="{ww:.1f}" height="4" fill="#ffffff" stroke="#0284c7" stroke-width="1.5"/>'
                    f'<line x1="{wx:.1f}" y1="{wy:.1f}" x2="{wx+ww:.1f}" y2="{wy:.1f}" stroke="#0284c7" stroke-width="1.5"/>'
                )
            else:
                svg_parts.append(
                    f'<rect x="{wx - 2:.1f}" y="{wy:.1f}" width="4" height="{ww:.1f}" fill="#ffffff" stroke="#0284c7" stroke-width="1.5"/>'
                    f'<line x1="{wx:.1f}" y1="{wy:.1f}" x2="{wx:.1f}" y2="{wy+ww:.1f}" stroke="#0284c7" stroke-width="1.5"/>'
                )
    svg_parts.append('</g>')

    # 9. Compass Rose
    comp_x = svg_w - 38
    comp_y = 38
    facing_label = html.escape(response.constraints.get("plot_facing", "North").upper())
    svg_parts.append(f'''
    <g id="compass" transform="translate({comp_x}, {comp_y})">
        <circle r="18" fill="#ffffff" stroke="#94a3b8" stroke-width="1.2" filter="url(#shadow)"/>
        <polygon points="0,-14 4,-2 0,0 -4,-2" fill="#ef4444"/>
        <polygon points="0,14 4,2 0,0 -4,2" fill="#64748b"/>
        <text x="0" y="-17" text-anchor="middle" font-size="9" font-weight="800" fill="#ef4444">N</text>
        <text x="0" y="27" text-anchor="middle" font-size="7.5" font-weight="700" fill="#475569">{facing_label}</text>
    </g>
    ''')

    # 10. Floor Indicator Title & Quality Rating
    floor_title = html.escape(target_floor.name if target_floor else "Ground Floor")
    carpet_info = f"{target_floor.carpet_area_sqft:.0f} sq.ft carpet" if target_floor else ""
    q_score = getattr(response, "overall_quality_score", 85.0)

    svg_parts.append(
        f'<text x="{margin:.1f}" y="{svg_h - 16:.1f}" font-size="11" font-weight="800" fill="#0f172a">'
        f'{floor_title.upper()} &bull; <tspan font-weight="500" fill="#64748b">{carpet_info}</tspan> '
        f'&bull; <tspan font-weight="700" fill="#2563eb">ARCHITECTURAL QUALITY: {q_score:.0f}/100</tspan>'
        f'</text>'
    )

    svg_parts.append('</svg>')
    return "".join(svg_parts)
