"""
Buildiqo.AI - Phase 2.0 Architectural SVG Renderer
Renders high-fidelity, safe architectural vector SVG floor plans
directly from deterministic solver geometry.
"""
import html
from typing import Dict, List, Optional
from .schemas import GeneratedFloorplanResponse, FloorLayout, GeneratedRoomGeometry

# Color palette mapped by room category
CATEGORY_COLORS = {
    "living": {"fill": "#eff6ff", "stroke": "#1e3a8a", "label": "#1e3a8a"},       # Blue
    "bedroom": {"fill": "#f0fdf4", "stroke": "#14532d", "label": "#14532d"},      # Green
    "utility": {"fill": "#fefce8", "stroke": "#713f12", "label": "#713f12"},      # Yellow/Gold
    "bath": {"fill": "#f8fafc", "stroke": "#334155", "label": "#334155"},         # Slate
    "outdoor": {"fill": "#ecfdf5", "stroke": "#065f46", "label": "#065f46"},      # Emerald
    "circulation": {"fill": "#f1f5f9", "stroke": "#475569", "label": "#475569"},  # Grey
    "special": {"fill": "#fdf4ff", "stroke": "#701a75", "label": "#701a75"}       # Purple
}

def render_floorplan_svg(response: GeneratedFloorplanResponse, active_floor_idx: int = 0) -> str:
    """
    Produces clean architectural SVG from solver geometry.
    Ensures absolute XML safety by escaping all text.
    """
    plot_w = response.plot.get("width_ft", 30.0)
    plot_l = response.plot.get("length_ft", 40.0)
    setback = response.setback_ft

    # Scale: 18 pixels per foot
    scale = 18.0
    margin = 50.0  # margin for dimension lines and compass

    svg_w = (plot_w * scale) + (margin * 2)
    svg_h = (plot_l * scale) + (margin * 2)

    # Invert Y so (0,0) is bottom-left conventionally in CAD, or top-left in SVG
    def to_svg_x(x_ft: float) -> float:
        return margin + (x_ft * scale)

    def to_svg_y(y_ft: float) -> float:
        # SVG Y goes downwards, so y_ft=0 is top or bottom
        return margin + (plot_l - y_ft) * scale

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

    # Defs: styles & markers
    svg_parts.append('''
    <defs>
        <pattern id="grid" width="18" height="18" patternUnits="userSpaceOnUse">
            <path d="M 18 0 L 0 0 0 18" fill="none" stroke="#f1f5f9" stroke-width="0.8"/>
        </pattern>
        <filter id="shadow" x="-2%" y="-2%" width="104%" height="104%">
            <feDropShadow dx="1" dy="1.5" stdDeviation="1.5" flood-opacity="0.08"/>
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
        f'<text x="{px + pw/2:.1f}" y="{py - 12:.1f}" text-anchor="middle" font-size="11" font-weight="700" fill="#475569">'
        f'PLOT BOUNDARY: {plot_w:.0f} FT × {plot_l:.0f} FT ({plot_w*plot_l:.0f} SQ.FT)'
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
        f'BUILDABLE ENVELOPE ({setback:.0f} FT SETBACK)'
        f'</text>'
    )
    svg_parts.append('</g>')

    # 3.5 Circulation and Open Space Layer
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
                f'fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.0" stroke-dasharray="3,3" />'
            )
            svg_parts.append(
                f'<text x="{ccx + ccw/2:.1f}" y="{ccy + ccl/2 + 3:.1f}" text-anchor="middle" font-size="8.5" font-weight="600" fill="#64748b">'
                f'CIRCULATION &bull; {corridor["width"]:.0f}&apos; × {corridor["length"]:.0f}&apos;'
                f'</text>'
            )
        svg_parts.append('</g>')

    # 4. Rooms Layer
    svg_parts.append('<g id="rooms">')
    for room in rooms:
        rx = margin + (room.x * scale)
        # Note: SVG Y is inverted
        ry = margin + (plot_l - (room.y + room.length)) * scale
        rw = room.width * scale
        rl = room.length * scale

        cat = "living" if room.type in ["living", "dining"] else \
              "bedroom" if "bed" in room.type else \
              "utility" if room.type in ["kitchen", "utility"] else \
              "bath" if "bath" in room.type else \
              "special" if room.type in ["puja", "office"] else "circulation"

        colors = CATEGORY_COLORS.get(cat, CATEGORY_COLORS["living"])

        # Room rectangle
        svg_parts.append(
            f'<rect id="room_{html.escape(room.room_id)}" x="{rx:.1f}" y="{ry:.1f}" width="{rw:.1f}" height="{rl:.1f}" '
            f'fill="{colors["fill"]}" stroke="#1e293b" stroke-width="2.0" filter="url(#shadow)" rx="2"/>'
        )

        # Doors
        for door in room.doors:
            dx = margin + (door.get("x", room.x) * scale)
            dy = margin + (plot_l - (door.get("y", room.y))) * scale
            dw = door.get("width", 3.0) * scale
            # Door arc
            svg_parts.append(
                f'<path d="M {dx:.1f} {dy:.1f} A {dw:.1f} {dw:.1f} 0 0 1 {dx+dw:.1f} {dy-dw:.1f}" '
                f'fill="none" stroke="#0284c7" stroke-width="1.2" stroke-dasharray="2,2"/>'
            )

        # Windows
        for win in room.windows:
            wx = margin + (win.get("x", room.x) * scale)
            wy = margin + (plot_l - (win.get("y", room.y + room.length))) * scale
            ww = win.get("width", 4.0) * scale
            svg_parts.append(
                f'<line x1="{wx:.1f}" y1="{wy:.1f}" x2="{wx+ww:.1f}" y2="{wy:.1f}" stroke="#0ea5e9" stroke-width="3.5" />'
            )

        # Room Labels: Centered name, dimensions, area
        cx = rx + (rw / 2.0)
        cy = ry + (rl / 2.0)

        esc_name = html.escape(room.name.upper())
        dim_str = f"{room.width:.1f}&apos; × {room.length:.1f}&apos;"
        area_str = f"{room.area:.0f} SQ.FT"

        svg_parts.append(
            f'<text x="{cx:.1f}" y="{cy - 8:.1f}" text-anchor="middle" font-size="11" font-weight="800" fill="#0f172a">'
            f'{esc_name}'
            f'</text>'
        )
        svg_parts.append(
            f'<text x="{cx:.1f}" y="{cy + 6:.1f}" text-anchor="middle" font-size="9.5" font-weight="600" fill="#475569">'
            f'{dim_str}'
            f'</text>'
        )
        svg_parts.append(
            f'<text x="{cx:.1f}" y="{cy + 19:.1f}" text-anchor="middle" font-size="8.5" font-weight="700" fill="{colors["stroke"]}">'
            f'{area_str}'
            f'</text>'
        )

    svg_parts.append('</g>')

    # 5. Compass Rose
    comp_x = svg_w - 36
    comp_y = 36
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

    # 6. Floor Indicator Title
    floor_title = html.escape(target_floor.name if target_floor else "Ground Floor")
    carpet_info = f"{target_floor.carpet_area_sqft:.0f} sq.ft carpet" if target_floor else ""
    svg_parts.append(
        f'<text x="{margin:.1f}" y="{svg_h - 14:.1f}" font-size="11" font-weight="800" fill="#0f172a">'
        f'{floor_title.upper()} &bull; <tspan font-weight="500" fill="#64748b">{carpet_info}</tspan>'
        f'</text>'
    )

    svg_parts.append('</svg>')
    return "".join(svg_parts)
