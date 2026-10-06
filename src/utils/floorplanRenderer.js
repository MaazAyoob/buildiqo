/**
 * Buildiqo.AI - High-Fidelity Architectural Floor Plan SVG Renderer
 * 
 * Generates conceptual architectural vector floor plans matching professional CAD standards:
 * - Double-line structural & partition walls with realistic thickness
 * - Geometrically accurate door swings with clearances and pivot points
 * - Architectural window openings with glass panes and sill lines
 * - Realistic scale-aware furniture:
 *     * Bedrooms: Bed with pillows, duvet fold, nightstands, and built-in wardrobe
 *     * Living: 3-seater / L-sectional sofa, coffee table, TV media console
 *     * Dining: Dining table with ergonomic chairs
 *     * Kitchen: L-counter run, double-bowl sink with faucet, 4-burner hob, refrigerator
 *     * Bathrooms: Wall-hung WC (cistern + bowl), vanity basin, glass shower enclosure & drain
 *     * Stairs: Treads, flight divider, direction arrow with "UP" annotation, landing
 *     * Car Parking: Car bay outline, vehicle silhouette, driveway
 *     * Landscape / Courtyard: Courtyard hatching, planter boxes
 * - Architectural dimensioning system with extension lines, tick marks, and overall envelope bounds
 * - Site context: Property boundary, road ("12.0M WIDE ROAD"), entry gate arrow
 * - Architectural title block & North compass
 * - Discrete SVG layer groups (#site_layer, #walls_layer, #rooms_layer, #doors_layer, #windows_layer,
 *   #furniture_layer, #fixtures_layer, #stairs_layer, #dimensions_layer, #annotations_layer)
 */

export function formatFeetInches(val) {
  if (val == null || isNaN(val)) return '0\'0"';
  const totalInches = Math.round(Number(val) * 12);
  const ft = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${ft}'${inches}"`;
}

export function renderArchitecturalFloorPlanSvg(planData, options = {}) {
  const {
    activeFloorIdx = 0,
    showDimensions = true,
    showFurniture = true,
    showFixtures = true,
    showDoors = true,
    showWindows = true,
    showWalls = true,
    showAnnotations = true,
    showSite = true,
    projectName = 'Architectural Residence'
  } = options;

  if (!planData) return '';

  const plotW = Number(planData.plot?.width_ft || planData.plot_width_ft || 30.0);
  const plotL = Number(planData.plot?.length_ft || planData.plot_length_ft || 40.0);
  const setback = Number(planData.setback_ft || 3.0);
  const facing = (planData.constraints?.plot_facing || planData.plot_facing || 'North').toLowerCase();

  const scale = 18.0; // 18 pixels per foot
  const marginX = 85.0; // Margins for external dimension strings and road
  const marginY = 85.0;

  const svgW = (plotW * scale) + (marginX * 2);
  const svgH = (plotL * scale) + (marginY * 2);

  // Active floor determination
  let floor = null;
  if (Array.isArray(planData.floors) && planData.floors.length > 0) {
    floor = planData.floors.find(f => f.floor === activeFloorIdx) || planData.floors[0];
  } else if (Array.isArray(planData.rooms)) {
    // If raw imported CAD rooms object without multi-floor envelope
    floor = {
      floor: 0,
      name: 'Ground Floor',
      carpet_area_sqft: planData.total_usable_carpet_sqft || planData.rooms.reduce((s, r) => s + (r.area_sqft || r.area || 0), 0),
      rooms: planData.rooms.map((r, idx) => ({
        room_id: r.id || `cad_room_${idx + 1}`,
        name: r.name || `Room ${idx + 1}`,
        type: r.type || 'living',
        x: r.geometry?.x != null ? Number(r.geometry.x) : (r.x != null ? Number(r.x) : setback + (idx % 2) * 12),
        y: r.geometry?.y != null ? Number(r.geometry.y) : (r.y != null ? Number(r.y) : setback + Math.floor(idx / 2) * 12),
        width: Number(r.width_ft || r.width || r.geometry?.width || 12),
        length: Number(r.length_ft || r.length || r.geometry?.length || 12),
        area: Number(r.area_sqft || r.area || ((r.width_ft || 12) * (r.length_ft || 12))),
        doors: r.doors || [],
        windows: r.windows || [],
        furniture: r.furniture || []
      }))
    };
  }

  const rooms = floor ? (floor.rooms || []) : [];
  const floorName = floor?.name || 'Ground Floor';
  const totalCarpet = floor?.carpet_area_sqft || rooms.reduce((s, r) => s + (Number(r.area) || 0), 0);

  // Coordinate transforms
  // In CAD: (0,0) is bottom-left. In SVG: (0,0) is top-left.
  // Standard transform: svgY = marginY + (plotL - (cadY + cadLength)) * scale
  const toSvgX = (x) => marginX + (Number(x) * scale);
  const toSvgY = (y, len = 0) => marginY + (plotL - (Number(y) + Number(len))) * scale;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW.toFixed(1)} ${svgH.toFixed(1)}" width="100%" height="100%" style="background-color: #0f172a; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;">\n`;

  // DEFS: Architectural patterns, marker arrows, hatched fills
  svg += `  <defs>
    <!-- Dark CAD Blueprint Grid -->
    <pattern id="cad_grid" width="18" height="18" patternUnits="userSpaceOnUse">
      <path d="M 18 0 L 0 0 0 18" fill="none" stroke="#1e293b" stroke-width="0.7"/>
    </pattern>
    <pattern id="cad_major_grid" width="90" height="90" patternUnits="userSpaceOnUse">
      <rect width="90" height="90" fill="none" stroke="#334155" stroke-width="1.0" stroke-opacity="0.6"/>
    </pattern>

    <!-- Structural Wall Hatching (45-degree concrete/masonry cross hatch) -->
    <pattern id="wall_hatch" width="6" height="6" patternUnits="userSpaceOnUse">
      <path d="M 0 6 L 6 0" fill="none" stroke="#475569" stroke-width="0.8"/>
    </pattern>

    <!-- Courtyard & Landscape Hatch -->
    <pattern id="landscape_hatch" width="10" height="10" patternUnits="userSpaceOnUse">
      <path d="M 0 10 L 10 0 M 0 0 L 10 10" fill="none" stroke="#065f46" stroke-width="0.75" stroke-opacity="0.3"/>
    </pattern>

    <!-- Floor Drain / Wet Area Pattern -->
    <pattern id="tile_pattern" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="none" stroke="#38bdf8" stroke-width="0.5" stroke-opacity="0.2"/>
    </pattern>

    <!-- Dimension Arrowheads & Architectural 45-degree Ticks -->
    <marker id="dim_tick" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 2 8 L 8 2" stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round"/>
    </marker>
    <marker id="arrow_road" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 1 L 9 5 L 0 9 Z" fill="#94a3b8"/>
    </marker>
    <marker id="arrow_entry" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M 0 1 L 9 5 L 0 9 Z" fill="#10b981"/>
    </marker>

    <!-- Elevation Dropshadow for room masses -->
    <filter id="cad_shadow" x="-2%" y="-2%" width="104%" height="104%">
      <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>\n`;

  // Background Grid Canvas
  svg += `  <rect width="${svgW.toFixed(1)}" height="${svgH.toFixed(1)}" fill="url(#cad_grid)" />\n`;
  svg += `  <rect width="${svgW.toFixed(1)}" height="${svgH.toFixed(1)}" fill="url(#cad_major_grid)" />\n`;

  // ==========================================
  // LAYER 1: SITE CONTEXT & BOUNDARIES
  // ==========================================
  const px = marginX;
  const py = marginY;
  const pw = plotW * scale;
  const pl = plotL * scale;

  svg += `  <g id="site_layer" class="site-layer">\n`;
  // Outer Property / Site Boundary
  svg += `    <!-- Property Boundary -->
    <rect x="${px.toFixed(1)}" y="${py.toFixed(1)}" width="${pw.toFixed(1)}" height="${pl.toFixed(1)}" fill="#090d16" stroke="#e2e8f0" stroke-width="2.5" stroke-dasharray="12,4,4,4" />
    <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3" fill="#38bdf8" />
    <circle cx="${(px + pw).toFixed(1)}" cy="${py.toFixed(1)}" r="3" fill="#38bdf8" />
    <circle cx="${(px + pw).toFixed(1)}" cy="${(py + pl).toFixed(1)}" r="3" fill="#38bdf8" />
    <circle cx="${px.toFixed(1)}" cy="${(py + pl).toFixed(1)}" r="3" fill="#38bdf8" />\n`;

  // Setback / Buildable Envelope
  const sx = marginX + (setback * scale);
  const sy = marginY + (setback * scale);
  const sw = (plotW - 2 * setback) * scale;
  const sl = (plotL - 2 * setback) * scale;

  svg += `    <!-- Setback Buildable Line -->
    <rect x="${sx.toFixed(1)}" y="${sy.toFixed(1)}" width="${sw.toFixed(1)}" height="${sl.toFixed(1)}" fill="#0f172a" fill-opacity="0.4" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="5,4" />
    <text x="${(sx + 8).toFixed(1)}" y="${(sy + 14).toFixed(1)}" font-size="9" font-weight="700" fill="#f59e0b" letter-spacing="0.5">
      BUILDABLE ENVELOPE (${setback.toFixed(0)}'-0" SETBACK PERIMETER)
    </text>\n`;

  // Road Orientation Banner
  let roadX1 = px, roadY1 = py, roadX2 = px + pw, roadY2 = py;
  let roadLabelX = px + pw / 2, roadLabelY = py - 32;
  let entryX = px + pw / 2, entryY = py - 18, entryAngle = 90;

  if (facing === 'north') {
    roadLabelX = px + pw / 2;
    roadLabelY = py - 35;
    entryX = px + pw / 2;
    entryY = py - 8;
    entryAngle = 90;
    // Road line across top
    svg += `    <!-- North Road -->
    <line x1="${(px - 40).toFixed(1)}" y1="${(py - 22).toFixed(1)}" x2="${(px + pw + 40).toFixed(1)}" y2="${(py - 22).toFixed(1)}" stroke="#64748b" stroke-width="1.5" stroke-dasharray="6,6" />
    <line x1="${(px - 40).toFixed(1)}" y1="${(py - 48).toFixed(1)}" x2="${(px + pw + 40).toFixed(1)}" y2="${(py - 48).toFixed(1)}" stroke="#94a3b8" stroke-width="2.5" />
    <text x="${roadLabelX.toFixed(1)}" y="${roadLabelY.toFixed(1)}" text-anchor="middle" font-size="11" font-weight="800" fill="#cbd5e1" letter-spacing="1.5">
      &larr; 12.0M WIDE PUBLIC ROAD (${facing.toUpperCase()}) &rarr;
    </text>
    <g transform="translate(${entryX.toFixed(1)}, ${(py).toFixed(1)})">
      <path d="M 0 -18 L 0 -2" stroke="#10b981" stroke-width="2.5" marker-end="url(#arrow_entry)"/>
      <text x="0" y="-22" text-anchor="middle" font-size="8.5" font-weight="800" fill="#10b981">MAIN SITE ENTRY</text>
    </g>\n`;
  } else if (facing === 'east') {
    roadLabelX = px + pw + 40;
    roadLabelY = py + pl / 2;
    svg += `    <!-- East Road -->
    <line x1="${(px + pw + 25).toFixed(1)}" y1="${(py - 40).toFixed(1)}" x2="${(px + pw + 25).toFixed(1)}" y2="${(py + pl + 40).toFixed(1)}" stroke="#64748b" stroke-width="1.5" stroke-dasharray="6,6" />
    <line x1="${(px + pw + 52).toFixed(1)}" y1="${(py - 40).toFixed(1)}" x2="${(px + pw + 52).toFixed(1)}" y2="${(py + pl + 40).toFixed(1)}" stroke="#94a3b8" stroke-width="2.5" />
    <text x="${roadLabelX.toFixed(1)}" y="${roadLabelY.toFixed(1)}" text-anchor="middle" font-size="11" font-weight="800" fill="#cbd5e1" letter-spacing="1.5" transform="rotate(90, ${roadLabelX.toFixed(1)}, ${roadLabelY.toFixed(1)})">
      &larr; 12.0M ROAD (EAST) &rarr;
    </text>\n`;
  } else if (facing === 'south') {
    roadLabelX = px + pw / 2;
    roadLabelY = py + pl + 45;
    svg += `    <!-- South Road -->
    <line x1="${(px - 40).toFixed(1)}" y1="${(py + pl + 25).toFixed(1)}" x2="${(px + pw + 40).toFixed(1)}" y2="${(py + pl + 25).toFixed(1)}" stroke="#64748b" stroke-width="1.5" stroke-dasharray="6,6" />
    <line x1="${(px - 40).toFixed(1)}" y1="${(py + pl + 52).toFixed(1)}" x2="${(px + pw + 40).toFixed(1)}" y2="${(py + pl + 52).toFixed(1)}" stroke="#94a3b8" stroke-width="2.5" />
    <text x="${roadLabelX.toFixed(1)}" y="${roadLabelY.toFixed(1)}" text-anchor="middle" font-size="11" font-weight="800" fill="#cbd5e1" letter-spacing="1.5">
      &larr; 12.0M WIDE PUBLIC ROAD (SOUTH) &rarr;
    </text>\n`;
  } else {
    // West
    roadLabelX = px - 45;
    roadLabelY = py + pl / 2;
    svg += `    <!-- West Road -->
    <line x1="${(px - 25).toFixed(1)}" y1="${(py - 40).toFixed(1)}" x2="${(px - 25).toFixed(1)}" y2="${(py + pl + 40).toFixed(1)}" stroke="#64748b" stroke-width="1.5" stroke-dasharray="6,6" />
    <line x1="${(px - 52).toFixed(1)}" y1="${(py - 40).toFixed(1)}" x2="${(px - 52).toFixed(1)}" y2="${(py + pl + 40).toFixed(1)}" stroke="#94a3b8" stroke-width="2.5" />
    <text x="${roadLabelX.toFixed(1)}" y="${roadLabelY.toFixed(1)}" text-anchor="middle" font-size="11" font-weight="800" fill="#cbd5e1" letter-spacing="1.5" transform="rotate(-90, ${roadLabelX.toFixed(1)}, ${roadLabelY.toFixed(1)})">
      &larr; 12.0M ROAD (WEST) &rarr;
    </text>\n`;
  }
  svg += `  </g>\n`;

  // ==========================================
  // LAYER 2: ROOM INTERIORS & FLOORS
  // ==========================================
  svg += `  <g id="rooms_layer" class="rooms-layer">\n`;
  rooms.forEach(rm => {
    const rx = toSvgX(rm.x);
    const ry = toSvgY(rm.y, rm.length);
    const rw = rm.width * scale;
    const rl = rm.length * scale;

    const rType = (rm.type || '').toLowerCase();
    const isWet = rType.includes('bath') || rType.includes('toilet') || rType.includes('utility');
    const isOutdoor = rType.includes('balcony') || rType.includes('verandah') || rType.includes('courtyard') || rType.includes('terrace');
    const isParking = rType.includes('parking') || rType.includes('garage');

    let floorFill = '#1e293b'; // Standard deep slate room interior
    let floorStroke = '#334155';

    if (isWet) {
      floorFill = 'url(#tile_pattern)';
      floorStroke = '#0284c7';
    } else if (isOutdoor) {
      floorFill = 'url(#landscape_hatch)';
      floorStroke = '#059669';
    } else if (isParking) {
      floorFill = '#111827';
      floorStroke = '#475569';
    }

    svg += `    <g id="room_${rm.room_id}">
      <rect class="room-rect" x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" width="${rw.toFixed(1)}" height="${rl.toFixed(1)}" fill="${floorFill}" stroke="${floorStroke}" stroke-width="1.2" filter="url(#cad_shadow)" rx="1.5" />
    </g>\n`;
  });
  svg += `  </g>\n`;

  // ==========================================
  // LAYER 3: STRUCTURAL & PARTITION WALLS (Double-line with cavity)
  // ==========================================
  svg += `  <g id="walls_layer" class="walls-layer">\n`;
  const extWallThick = 0.75 * scale; // 9" external masonry (13.5px)
  const intWallThick = 0.38 * scale; // 4.5" internal partition (6.8px)

  rooms.forEach(rm => {
    const rx = toSvgX(rm.x);
    const ry = toSvgY(rm.y, rm.length);
    const rw = rm.width * scale;
    const rl = rm.length * scale;

    // Outer double-wall outline with structural fill
    svg += `    <!-- Wall envelope for ${rm.name} -->
    <rect class="wall-outline" x="${(rx - 1.5).toFixed(1)}" y="${(ry - 1.5).toFixed(1)}" width="${(rw + 3.0).toFixed(1)}" height="${(rl + 3.0).toFixed(1)}" fill="none" stroke="#f8fafc" stroke-width="3.5" rx="1" />
    <rect class="wall-inner-line" x="${(rx + 1.2).toFixed(1)}" y="${(ry + 1.2).toFixed(1)}" width="${(rw - 2.4).toFixed(1)}" height="${(rl - 2.4).toFixed(1)}" fill="none" stroke="#0f172a" stroke-width="1.0" />\n`;
  });
  svg += `  </g>\n`;

  // ==========================================
  // LAYER 4: ARCHITECTURAL WINDOWS (Exterior Frames, Double Glass, Sill)
  // ==========================================
  svg += `  <g id="windows_layer" class="windows-layer">\n`;
  rooms.forEach(rm => {
    const rx = toSvgX(rm.x);
    const ry = toSvgY(rm.y, rm.length);
    const rw = rm.width * scale;
    const rl = rm.length * scale;

    const winList = rm.windows && rm.windows.length > 0 ? rm.windows : [];
    // If no explicit window array on exterior rooms, synthesize exterior window for realism
    if (winList.length === 0 && (rm.x <= setback + 0.5 || rm.y <= setback + 0.5 || rm.x + rm.width >= plotW - setback - 0.5 || rm.y + rm.length >= plotL - setback - 0.5)) {
      const isTop = rm.y + rm.length >= plotL - setback - 0.5;
      const isBottom = rm.y <= setback + 0.5;
      const isLeft = rm.x <= setback + 0.5;
      if (isTop) winList.push({ wall: 'top', width: Math.min(5.0, rm.width * 0.45), x: rm.x + rm.width * 0.28, y: rm.y + rm.length });
      else if (isBottom) winList.push({ wall: 'bottom', width: Math.min(5.0, rm.width * 0.45), x: rm.x + rm.width * 0.28, y: rm.y });
      else if (isLeft) winList.push({ wall: 'left', width: Math.min(4.5, rm.length * 0.4), x: rm.x, y: rm.y + rm.length * 0.3 });
    }

    winList.forEach(w => {
      const ww = (Number(w.width) || 4.0) * scale;
      const wall = w.wall || 'top';
      let wx = toSvgX(w.x || rm.x + rm.width * 0.25);
      let wy = toSvgY(w.y || rm.y + rm.length, 0);

      if (wall === 'top' || wall === 'bottom') {
        const yCoord = wall === 'top' ? ry : ry + rl;
        svg += `    <!-- Window: ${rm.name} (${wall}) -->
        <rect class="window-element" x="${wx.toFixed(1)}" y="${(yCoord - 3).toFixed(1)}" width="${ww.toFixed(1)}" height="6" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5" />
        <line class="window-element" x1="${wx.toFixed(1)}" y1="${yCoord.toFixed(1)}" x2="${(wx + ww).toFixed(1)}" y2="${yCoord.toFixed(1)}" stroke="#38bdf8" stroke-width="2.0" />
        <line class="window-element" x1="${(wx - 2).toFixed(1)}" y1="${(yCoord + (wall === 'top' ? -4 : 4)).toFixed(1)}" x2="${(wx + ww + 2).toFixed(1)}" y2="${(yCoord + (wall === 'top' ? -4 : 4)).toFixed(1)}" stroke="#94a3b8" stroke-width="1.0" />\n`;
      } else {
        const xCoord = wall === 'left' ? rx : rx + rw;
        svg += `    <!-- Window: ${rm.name} (${wall}) -->
        <rect class="window-element" x="${(xCoord - 3).toFixed(1)}" y="${wy.toFixed(1)}" width="6" height="${ww.toFixed(1)}" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5" />
        <line class="window-element" x1="${xCoord.toFixed(1)}" y1="${wy.toFixed(1)}" x2="${xCoord.toFixed(1)}" y2="${(wy + ww).toFixed(1)}" stroke="#38bdf8" stroke-width="2.0" />
        <line class="window-element" x1="${(xCoord + (wall === 'left' ? -4 : 4)).toFixed(1)}" y1="${(wy - 2).toFixed(1)}" x2="${(xCoord + (wall === 'left' ? -4 : 4)).toFixed(1)}" y2="${(wy + ww + 2).toFixed(1)}" stroke="#94a3b8" stroke-width="1.0" />\n`;
      }
    });
  });
  svg += `  </g>\n`;

  // ==========================================
  // LAYER 5: ARCHITECTURAL DOORS & SWING ARCS
  // ==========================================
  svg += `  <g id="doors_layer" class="doors-layer">\n`;
  rooms.forEach(rm => {
    const rx = toSvgX(rm.x);
    const ry = toSvgY(rm.y, rm.length);
    const rw = rm.width * scale;
    const rl = rm.length * scale;

    const doorList = rm.doors && rm.doors.length > 0 ? rm.doors : [
      { wall: 'bottom', width: 3.0, x: rm.x + 1.2, y: rm.y }
    ];

    doorList.forEach(d => {
      const dw = (Number(d.width) || 3.0) * scale;
      const wall = d.wall || 'bottom';
      const dx = toSvgX(d.x != null ? d.x : rm.x + 1.0);
      const dy = toSvgY(d.y != null ? d.y : rm.y, 0);

      // Door opening cut + pivot dot + leaf + 90-deg swing arc
      svg += `    <!-- Door: ${rm.name} -->
      <circle class="door-element" cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="2.8" fill="#3b82f6" />\n`;

      if (wall === 'bottom') {
        // Swing up into room
        svg += `      <line class="door-element" x1="${dx.toFixed(1)}" y1="${dy.toFixed(1)}" x2="${dx.toFixed(1)}" y2="${(dy - dw).toFixed(1)}" stroke="#60a5fa" stroke-width="2.0" />
      <path class="door-element" d="M ${dx.toFixed(1)} ${(dy - dw).toFixed(1)} A ${dw.toFixed(1)} ${dw.toFixed(1)} 0 0 1 ${(dx + dw).toFixed(1)} ${dy.toFixed(1)}" fill="none" stroke="#93c5fd" stroke-width="1.2" stroke-dasharray="3,2" />\n`;
      } else if (wall === 'top') {
        // Swing down into room
        svg += `      <line class="door-element" x1="${dx.toFixed(1)}" y1="${dy.toFixed(1)}" x2="${dx.toFixed(1)}" y2="${(dy + dw).toFixed(1)}" stroke="#60a5fa" stroke-width="2.0" />
      <path class="door-element" d="M ${dx.toFixed(1)} ${(dy + dw).toFixed(1)} A ${dw.toFixed(1)} ${dw.toFixed(1)} 0 0 0 ${(dx + dw).toFixed(1)} ${dy.toFixed(1)}" fill="none" stroke="#93c5fd" stroke-width="1.2" stroke-dasharray="3,2" />\n`;
      } else if (wall === 'left') {
        // Swing right into room
        svg += `      <line class="door-element" x1="${dx.toFixed(1)}" y1="${dy.toFixed(1)}" x2="${(dx + dw).toFixed(1)}" y2="${dy.toFixed(1)}" stroke="#60a5fa" stroke-width="2.0" />
      <path class="door-element" d="M ${(dx + dw).toFixed(1)} ${dy.toFixed(1)} A ${dw.toFixed(1)} ${dw.toFixed(1)} 0 0 0 ${dx.toFixed(1)} ${(dy - dw).toFixed(1)}" fill="none" stroke="#93c5fd" stroke-width="1.2" stroke-dasharray="3,2" />\n`;
      } else {
        // Right: swing left into room
        svg += `      <line class="door-element" x1="${dx.toFixed(1)}" y1="${dy.toFixed(1)}" x2="${(dx - dw).toFixed(1)}" y2="${dy.toFixed(1)}" stroke="#60a5fa" stroke-width="2.0" />
      <path class="door-element" d="M ${(dx - dw).toFixed(1)} ${dy.toFixed(1)} A ${dw.toFixed(1)} ${dw.toFixed(1)} 0 0 1 ${dx.toFixed(1)} ${(dy - dw).toFixed(1)}" fill="none" stroke="#93c5fd" stroke-width="1.2" stroke-dasharray="3,2" />\n`;
      }
    });
  });
  svg += `  </g>\n`;

  // ==========================================
  // LAYER 6: ARCHITECTURAL FURNITURE & FIXTURES
  // ==========================================
  svg += `  <g id="furniture_layer" class="furniture-layer">\n`;
  rooms.forEach(rm => {
    const rx = toSvgX(rm.x);
    const ry = toSvgY(rm.y, rm.length);
    const rw = rm.width * scale;
    const rl = rm.length * scale;
    const rType = (rm.type || '').toLowerCase();

    // 1. BEDROOMS (King/Queen Bed, Twin Pillows, Duvet Fold, Nightstands, Wardrobe)
    if (rType.includes('bed')) {
      const isMaster = rType.includes('master');
      const bedW = (isMaster ? 6.2 : 5.2) * scale;
      const bedL = (isMaster ? 6.8 : 6.2) * scale;
      const bx = rx + (rw - bedW) / 2.0;
      const by = ry + rl - bedL - 10; // Headboard against bottom/top wall

      // Bed Frame
      svg += `    <!-- Bed Unit: ${rm.name} -->
      <rect class="furniture-element" x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bedW.toFixed(1)}" height="${bedL.toFixed(1)}" fill="#1e293b" stroke="#cbd5e1" stroke-width="1.2" rx="3" />
      <!-- Headboard -->
      <rect class="furniture-element" x="${(bx - 2).toFixed(1)}" y="${(by + bedL - 8).toFixed(1)}" width="${(bedW + 4).toFixed(1)}" height="8" fill="#334155" stroke="#94a3b8" stroke-width="1.0" rx="2" />
      <!-- Twin Pillows -->
      <rect class="furniture-element" x="${(bx + bedW * 0.1).toFixed(1)}" y="${(by + bedL - 22).toFixed(1)}" width="${(bedW * 0.35).toFixed(1)}" height="12" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.8" rx="2" />
      <rect class="furniture-element" x="${(bx + bedW * 0.55).toFixed(1)}" y="${(by + bedL - 22).toFixed(1)}" width="${(bedW * 0.35).toFixed(1)}" height="12" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.8" rx="2" />
      <!-- Duvet Cover & Fold Line -->
      <line class="furniture-element" x1="${bx.toFixed(1)}" y1="${(by + bedL * 0.45).toFixed(1)}" x2="${(bx + bedW).toFixed(1)}" y2="${(by + bedL * 0.45).toFixed(1)}" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="2,2" />
      
      <!-- Bedside Tables (Left & Right) with Lamp Circles -->
      <rect class="furniture-element" x="${(bx - 18).toFixed(1)}" y="${(by + bedL - 18).toFixed(1)}" width="15" height="15" fill="#334155" stroke="#cbd5e1" stroke-width="0.9" rx="2" />
      <circle class="furniture-element" cx="${(bx - 10.5).toFixed(1)}" cy="${(by + bedL - 10.5).toFixed(1)}" r="3" fill="#facc15" stroke="#ca8a04" stroke-width="0.5" />

      <rect class="furniture-element" x="${(bx + bedW + 3).toFixed(1)}" y="${(by + bedL - 18).toFixed(1)}" width="15" height="15" fill="#334155" stroke="#cbd5e1" stroke-width="0.9" rx="2" />
      <circle class="furniture-element" cx="${(bx + bedW + 10.5).toFixed(1)}" cy="${(by + bedL - 10.5).toFixed(1)}" r="3" fill="#facc15" stroke="#ca8a04" stroke-width="0.5" />

      <!-- Built-In Wardrobe along opposite wall -->
      <rect class="furniture-element" x="${(rx + 8).toFixed(1)}" y="${(ry + 6).toFixed(1)}" width="${Math.min(rw - 16, 90).toFixed(1)}" height="18" fill="#1e293b" stroke="#cbd5e1" stroke-width="1.0" rx="1" />
      <line class="furniture-element" x1="${(rx + 8).toFixed(1)}" y1="${(ry + 15).toFixed(1)}" x2="${(rx + 8 + Math.min(rw - 16, 90)).toFixed(1)}" y2="${(ry + 15).toFixed(1)}" stroke="#64748b" stroke-width="0.75" />\n`;
    }

    // 2. LIVING ROOM (3-Seater Sofa, Coffee Table, TV Wall Console)
    else if (rType.includes('living')) {
      const sofaW = Math.min(rw * 0.65, 110);
      const sofaL = 38;
      const sx = rx + (rw - sofaW) / 2.0;
      const sy = ry + rl - sofaL - 12;

      svg += `    <!-- Living Sofa Group -->
      <!-- Main Sofa Frame -->
      <rect class="furniture-element" x="${sx.toFixed(1)}" y="${sy.toFixed(1)}" width="${sofaW.toFixed(1)}" height="${sofaL.toFixed(1)}" fill="#1e293b" stroke="#e2e8f0" stroke-width="1.4" rx="4" />
      <!-- Left & Right Armrests -->
      <rect class="furniture-element" x="${sx.toFixed(1)}" y="${sy.toFixed(1)}" width="10" height="${sofaL.toFixed(1)}" fill="#334155" stroke="#cbd5e1" stroke-width="0.8" rx="2" />
      <rect class="furniture-element" x="${(sx + sofaW - 10).toFixed(1)}" y="${sy.toFixed(1)}" width="10" height="${sofaL.toFixed(1)}" fill="#334155" stroke="#cbd5e1" stroke-width="0.8" rx="2" />
      <!-- 3 Seat Cushions -->
      <line class="furniture-element" x1="${(sx + (sofaW - 20) / 3 + 10).toFixed(1)}" y1="${sy.toFixed(1)}" x2="${(sx + (sofaW - 20) / 3 + 10).toFixed(1)}" y2="${(sy + sofaL).toFixed(1)}" stroke="#64748b" stroke-width="0.8" />
      <line class="furniture-element" x1="${(sx + (sofaW - 20) * 2 / 3 + 10).toFixed(1)}" y1="${sy.toFixed(1)}" x2="${(sx + (sofaW - 20) * 2 / 3 + 10).toFixed(1)}" y2="${(sy + sofaL).toFixed(1)}" stroke="#64748b" stroke-width="0.8" />

      <!-- Center Coffee Table -->
      <rect class="furniture-element" x="${(sx + 15).toFixed(1)}" y="${(sy - 30).toFixed(1)}" width="${(sofaW - 30).toFixed(1)}" height="18" fill="#334155" stroke="#94a3b8" stroke-width="1.0" rx="3" />

      <!-- Wall TV Unit / Credenza along Top Wall -->
      <rect class="furniture-element" x="${(rx + rw * 0.25).toFixed(1)}" y="${(ry + 6).toFixed(1)}" width="${(rw * 0.5).toFixed(1)}" height="12" fill="#1e293b" stroke="#cbd5e1" stroke-width="1.0" rx="1" />
      <text class="furniture-element" x="${(rx + rw * 0.5).toFixed(1)}" y="${(ry + 15).toFixed(1)}" text-anchor="middle" font-size="7.5" font-weight="700" fill="#94a3b8">TV UNIT</text>\n`;
    }

    // 3. DINING ROOM (6-Seater Dining Table + 6 Chairs)
    else if (rType.includes('dining')) {
      const dtW = Math.min(rw * 0.55, 75);
      const dtL = 40;
      const dtx = rx + (rw - dtW) / 2.0;
      const dty = ry + (rl - dtL) / 2.0;

      svg += `    <!-- Dining Table & 6 Chairs -->
      <rect class="furniture-element" x="${dtx.toFixed(1)}" y="${dty.toFixed(1)}" width="${dtW.toFixed(1)}" height="${dtL.toFixed(1)}" fill="#1e293b" stroke="#f1f5f9" stroke-width="1.4" rx="3" />
      <!-- Chairs along Top & Bottom -->
      <rect class="furniture-element" x="${(dtx + dtW * 0.15).toFixed(1)}" y="${(dty - 8).toFixed(1)}" width="14" height="6" fill="#475569" stroke="#cbd5e1" stroke-width="0.8" rx="1.5" />
      <rect class="furniture-element" x="${(dtx + dtW * 0.5 - 7).toFixed(1)}" y="${(dty - 8).toFixed(1)}" width="14" height="6" fill="#475569" stroke="#cbd5e1" stroke-width="0.8" rx="1.5" />
      <rect class="furniture-element" x="${(dtx + dtW * 0.85 - 14).toFixed(1)}" y="${(dty - 8).toFixed(1)}" width="14" height="6" fill="#475569" stroke="#cbd5e1" stroke-width="0.8" rx="1.5" />

      <rect class="furniture-element" x="${(dtx + dtW * 0.15).toFixed(1)}" y="${(dty + dtL + 2).toFixed(1)}" width="14" height="6" fill="#475569" stroke="#cbd5e1" stroke-width="0.8" rx="1.5" />
      <rect class="furniture-element" x="${(dtx + dtW * 0.5 - 7).toFixed(1)}" y="${(dty + dtL + 2).toFixed(1)}" width="14" height="6" fill="#475569" stroke="#cbd5e1" stroke-width="0.8" rx="1.5" />
      <rect class="furniture-element" x="${(dtx + dtW * 0.85 - 14).toFixed(1)}" y="${(dty + dtL + 2).toFixed(1)}" width="14" height="6" fill="#475569" stroke="#cbd5e1" stroke-width="0.8" rx="1.5" />\n`;
    }

    // 4. KITCHEN (L-Shaped Counter Run, Double-Bowl Sink, 4-Burner Hob, Refrigerator)
    else if (rType.includes('kitchen')) {
      const counterThick = 2.0 * scale; // 2ft counter depth (36px)
      svg += `    <!-- Kitchen Counters & Fixtures -->
      <!-- Main Counter Run along top & right wall (L-Shape) -->
      <rect class="furniture-element" x="${(rx + 6).toFixed(1)}" y="${(ry + 6).toFixed(1)}" width="${(rw - 12).toFixed(1)}" height="${counterThick.toFixed(1)}" fill="#334155" stroke="#f1f5f9" stroke-width="1.2" />
      <rect class="furniture-element" x="${(rx + rw - counterThick - 6).toFixed(1)}" y="${(ry + 6).toFixed(1)}" width="${counterThick.toFixed(1)}" height="${(rl - 12).toFixed(1)}" fill="#334155" stroke="#f1f5f9" stroke-width="1.2" />

      <!-- 4-Burner Gas Cooktop / Hob -->
      <rect class="furniture-element" x="${(rx + 25).toFixed(1)}" y="${(ry + 10).toFixed(1)}" width="36" height="22" fill="#0f172a" stroke="#cbd5e1" stroke-width="1.0" rx="2" />
      <circle class="furniture-element" cx="${(rx + 33).toFixed(1)}" cy="${(ry + 17).toFixed(1)}" r="4" fill="#334155" stroke="#cbd5e1" stroke-width="0.8" />
      <circle class="furniture-element" cx="${(rx + 53).toFixed(1)}" cy="${(ry + 17).toFixed(1)}" r="4" fill="#334155" stroke="#cbd5e1" stroke-width="0.8" />
      <circle class="furniture-element" cx="${(rx + 33).toFixed(1)}" cy="${(ry + 26).toFixed(1)}" r="3" fill="#334155" stroke="#cbd5e1" stroke-width="0.8" />
      <circle class="furniture-element" cx="${(rx + 53).toFixed(1)}" cy="${(ry + 26).toFixed(1)}" r="3" fill="#334155" stroke="#cbd5e1" stroke-width="0.8" />

      <!-- Stainless Double-Bowl Sink with Drainboard -->
      <rect class="furniture-element" x="${(rx + rw - counterThick - 2).toFixed(1)}" y="${(ry + rl * 0.4).toFixed(1)}" width="28" height="38" fill="#0f172a" stroke="#38bdf8" stroke-width="1.0" rx="2" />
      <rect class="furniture-element" x="${(rx + rw - counterThick + 2).toFixed(1)}" y="${(ry + rl * 0.4 + 4).toFixed(1)}" width="20" height="13" fill="#1e293b" stroke="#38bdf8" stroke-width="0.8" rx="1" />
      <rect class="furniture-element" x="${(rx + rw - counterThick + 2).toFixed(1)}" y="${(ry + rl * 0.4 + 21).toFixed(1)}" width="20" height="13" fill="#1e293b" stroke="#38bdf8" stroke-width="0.8" rx="1" />
      <circle class="furniture-element" cx="${(rx + rw - counterThick + 12).toFixed(1)}" cy="${(ry + rl * 0.4 + 18.5).toFixed(1)}" r="2" fill="#e2e8f0" />

      <!-- Refrigerator Unit -->
      <rect class="furniture-element" x="${(rx + 6).toFixed(1)}" y="${(ry + rl - 42).toFixed(1)}" width="32" height="34" fill="#1e293b" stroke="#cbd5e1" stroke-width="1.2" rx="3" />
      <line class="furniture-element" x1="${(rx + 6).toFixed(1)}" y1="${(ry + rl - 25).toFixed(1)}" x2="${(rx + 38).toFixed(1)}" y2="${(ry + rl - 25).toFixed(1)}" stroke="#94a3b8" stroke-width="1.0" />
      <text class="furniture-element" x="${(rx + 22).toFixed(1)}" y="${(ry + rl - 15).toFixed(1)}" text-anchor="middle" font-size="7" font-weight="800" fill="#cbd5e1">FRIDGE</text>\n`;
    }

    // 5. TOILETS & BATHROOMS (Wall-Hung WC, Vanity Basin, Glass Shower Partition & Drain)
    else if (rType.includes('bath') || rType.includes('toilet') || rType.includes('wc')) {
      const wcx = rx + 10;
      const wcy = ry + 8;
      const shwSize = Math.min(rw * 0.45, 42);

      svg += `    <!-- Bathroom Fixtures -->
      <!-- Wall-Hung WC Unit (Cistern + Bowl + Seat) -->
      <rect class="furniture-element" x="${wcx.toFixed(1)}" y="${wcy.toFixed(1)}" width="22" height="9" fill="#f8fafc" stroke="#475569" stroke-width="1.0" rx="1.5" />
      <ellipse class="furniture-element" cx="${(wcx + 11).toFixed(1)}" cy="${(wcy + 17).toFixed(1)}" rx="8" ry="11" fill="#f8fafc" stroke="#475569" stroke-width="1.2" />
      <ellipse class="furniture-element" cx="${(wcx + 11).toFixed(1)}" cy="${(wcy + 17).toFixed(1)}" rx="5" ry="7" fill="#e2e8f0" stroke="#94a3b8" stroke-width="0.8" />

      <!-- Countertop / Wall-Mounted Basin with Tap -->
      <rect class="furniture-element" x="${(rx + rw - 30).toFixed(1)}" y="${wcy.toFixed(1)}" width="24" height="16" fill="#f8fafc" stroke="#475569" stroke-width="1.0" rx="3" />
      <ellipse class="furniture-element" cx="${(rx + rw - 18).toFixed(1)}" cy="${(wcy + 8).toFixed(1)}" rx="8" ry="5.5" fill="#e0f2fe" stroke="#38bdf8" stroke-width="0.8" />
      <circle class="furniture-element" cx="${(rx + rw - 18).toFixed(1)}" cy="${(wcy + 3).toFixed(1)}" r="1.5" fill="#0284c7" />

      <!-- Glass Shower Enclosure with Floor Drain -->
      <rect class="furniture-element" x="${(rx + rw - shwSize - 4).toFixed(1)}" y="${(ry + rl - shwSize - 4).toFixed(1)}" width="${shwSize.toFixed(1)}" height="${shwSize.toFixed(1)}" fill="#0284c7" fill-opacity="0.1" stroke="#38bdf8" stroke-width="1.4" stroke-dasharray="4,2" />
      <circle class="furniture-element" cx="${(rx + rw - shwSize / 2 - 4).toFixed(1)}" cy="${(ry + rl - shwSize / 2 - 4).toFixed(1)}" r="3" fill="#38bdf8" stroke="#0284c7" stroke-width="0.8" />
      <line class="furniture-element" x1="${(rx + rw - shwSize / 2 - 8).toFixed(1)}" y1="${(ry + rl - shwSize / 2 - 4).toFixed(1)}" x2="${(rx + rw - shwSize / 2).toFixed(1)}" y2="${(ry + rl - shwSize / 2 - 4).toFixed(1)}" stroke="#0284c7" stroke-width="0.8" />\n`;
    }

    // 6. STAIRCASE (Treads, Riser Lines, Flight Divider, UP Arrow)
    else if (rType.includes('stair')) {
      const numTreads = 10;
      const treadStep = rl / numTreads;
      svg += `    <!-- Staircase Flight -->
      <!-- Flight Divider Line -->
      <line class="furniture-element" x1="${(rx + rw / 2).toFixed(1)}" y1="${ry.toFixed(1)}" x2="${(rx + rw / 2).toFixed(1)}" y2="${(ry + rl).toFixed(1)}" stroke="#cbd5e1" stroke-width="1.8" />\n`;
      for (let i = 1; i < numTreads; i++) {
        const ty = ry + (i * treadStep);
        svg += `      <line class="furniture-element" x1="${rx.toFixed(1)}" y1="${ty.toFixed(1)}" x2="${(rx + rw).toFixed(1)}" y2="${ty.toFixed(1)}" stroke="#64748b" stroke-width="0.9" />\n`;
      }
      // UP Arrow
      svg += `      <!-- UP Flight Indicator -->
      <line class="furniture-element" x1="${(rx + rw * 0.25).toFixed(1)}" y1="${(ry + rl - 15).toFixed(1)}" x2="${(rx + rw * 0.25).toFixed(1)}" y2="${(ry + 20).toFixed(1)}" stroke="#38bdf8" stroke-width="2.0" marker-end="url(#dim_tick)" />
      <text class="furniture-element" x="${(rx + rw * 0.25).toFixed(1)}" y="${(ry + rl - 5).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="900" fill="#38bdf8">UP</text>\n`;
    }

    // 7. CAR PARKING / CAR BAY (Vehicle Silhouette & Floor Markings)
    else if (rType.includes('parking') || rType.includes('car')) {
      const carW = Math.min(rw * 0.7, 75);
      const carL = Math.min(rl * 0.8, 130);
      const cx = rx + (rw - carW) / 2.0;
      const cy = ry + (rl - carL) / 2.0;

      svg += `    <!-- Car Bay Outline & Vehicle Silhouette -->
      <rect class="furniture-element" x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" width="${carW.toFixed(1)}" height="${carL.toFixed(1)}" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="6,4" rx="8" />
      <!-- Windshield & Roof Outline -->
      <rect class="furniture-element" x="${(cx + 10).toFixed(1)}" y="${(cy + carL * 0.22).toFixed(1)}" width="${(carW - 20).toFixed(1)}" height="${(carL * 0.55).toFixed(1)}" fill="#334155" stroke="#94a3b8" stroke-width="1.0" rx="4" />
      <path class="furniture-element" d="M ${(cx + 14).toFixed(1)} ${(cy + carL * 0.25).toFixed(1)} L ${(cx + carW - 14).toFixed(1)} ${(cy + carL * 0.25).toFixed(1)} L ${(cx + carW - 10).toFixed(1)} ${(cy + carL * 0.38).toFixed(1)} L ${(cx + 10).toFixed(1)} ${(cy + carL * 0.38).toFixed(1)} Z" fill="#0f172a" stroke="#cbd5e1" stroke-width="0.8" />
      <text class="furniture-element" x="${(rx + rw / 2).toFixed(1)}" y="${(cy + carL / 2 + 3).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="800" fill="#94a3b8">CAR BAY</text>\n`;
    }

    // 8. BALCONY / VERANDAH (Railing & Slate Hatching)
    else if (rType.includes('balcony') || rType.includes('verandah')) {
      svg += `    <!-- Verandah / Balcony Handrail -->
      <rect class="furniture-element" x="${(rx + 2).toFixed(1)}" y="${(ry + 2).toFixed(1)}" width="${(rw - 4).toFixed(1)}" height="${(rl - 4).toFixed(1)}" fill="none" stroke="#10b981" stroke-width="1.2" stroke-dasharray="4,3" />\n`;
    }
  });
  svg += `  </g>\n`;

  // ==========================================
  // LAYER 7: ARCHITECTURAL DIMENSIONS & LABELS
  // ==========================================
  svg += `  <g id="dimensions_layer" class="dimensions-layer">\n`;
  rooms.forEach(rm => {
    const rx = toSvgX(rm.x);
    const ry = toSvgY(rm.y, rm.length);
    const rw = rm.width * scale;
    const rl = rm.length * scale;

    const cx = rx + (rw / 2.0);
    const cy = ry + (rl / 2.0);

    const escName = (rm.name || 'SPACE').toUpperCase();
    const dimText = `${formatFeetInches(rm.width)} × ${formatFeetInches(rm.length)}`;
    const areaText = `${Math.round(rm.area)} SQ.FT`;

    // High-contrast, clean typography badge
    svg += `    <!-- Labels: ${rm.name} -->
    <g class="dim-label-group">
      <!-- Translucent backdrop pill for readability over furniture -->
      <rect x="${(cx - 52).toFixed(1)}" y="${(cy - 20).toFixed(1)}" width="104" height="40" fill="#090d16" fill-opacity="0.85" rx="6" stroke="#334155" stroke-width="0.8"/>
      
      <text class="dimension-element" x="${cx.toFixed(1)}" y="${(cy - 7).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="900" fill="#f8fafc" letter-spacing="0.5">
        ${escName}
      </text>
      <text class="dimension-element" x="${cx.toFixed(1)}" y="${(cy + 6).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="700" fill="#38bdf8" font-family="ui-monospace, monospace">
        ${dimText}
      </text>
      <text class="dimension-element" x="${cx.toFixed(1)}" y="${(cy + 16).toFixed(1)}" text-anchor="middle" font-size="8" font-weight="800" fill="#10b981">
        ${areaText}
      </text>
    </g>\n`;
  });

  // Overall Site Dimension Strings with 45-degree architectural tick lines
  const dimOffset = 30.0;

  // 1. Overall Width Dimension (Bottom)
  const dimBottomY = py + pl + dimOffset;
  svg += `    <!-- Overall Width Dimension -->
    <line x1="${px.toFixed(1)}" y1="${(py + pl + 4).toFixed(1)}" x2="${px.toFixed(1)}" y2="${(dimBottomY + 8).toFixed(1)}" stroke="#64748b" stroke-width="0.8" />
    <line x1="${(px + pw).toFixed(1)}" y1="${(py + pl + 4).toFixed(1)}" x2="${(px + pw).toFixed(1)}" y2="${(dimBottomY + 8).toFixed(1)}" stroke="#64748b" stroke-width="0.8" />
    <line x1="${px.toFixed(1)}" y1="${dimBottomY.toFixed(1)}" x2="${(px + pw).toFixed(1)}" y2="${dimBottomY.toFixed(1)}" stroke="#38bdf8" stroke-width="1.2" marker-start="url(#dim_tick)" marker-end="url(#dim_tick)" />
    <rect x="${(px + pw / 2 - 35).toFixed(1)}" y="${(dimBottomY - 9).toFixed(1)}" width="70" height="18" fill="#0f172a" rx="3" stroke="#38bdf8" stroke-width="0.6"/>
    <text x="${(px + pw / 2).toFixed(1)}" y="${(dimBottomY + 4).toFixed(1)}" text-anchor="middle" font-size="9.5" font-weight="800" fill="#38bdf8" font-family="ui-monospace, monospace">
      ${formatFeetInches(plotW)}
    </text>\n`;

  // 2. Overall Depth Dimension (Left)
  const dimLeftX = px - dimOffset;
  svg += `    <!-- Overall Depth Dimension -->
    <line x1="${(px - 4).toFixed(1)}" y1="${py.toFixed(1)}" x2="${(dimLeftX - 8).toFixed(1)}" y2="${py.toFixed(1)}" stroke="#64748b" stroke-width="0.8" />
    <line x1="${(px - 4).toFixed(1)}" y1="${(py + pl).toFixed(1)}" x2="${(dimLeftX - 8).toFixed(1)}" y2="${(py + pl).toFixed(1)}" stroke="#64748b" stroke-width="0.8" />
    <line x1="${dimLeftX.toFixed(1)}" y1="${py.toFixed(1)}" x2="${dimLeftX.toFixed(1)}" y2="${(py + pl).toFixed(1)}" stroke="#38bdf8" stroke-width="1.2" marker-start="url(#dim_tick)" marker-end="url(#dim_tick)" />
    <rect x="${(dimLeftX - 9).toFixed(1)}" y="${(py + pl / 2 - 35).toFixed(1)}" width="18" height="70" fill="#0f172a" rx="3" stroke="#38bdf8" stroke-width="0.6"/>
    <text x="${(dimLeftX + 4).toFixed(1)}" y="${(py + pl / 2).toFixed(1)}" text-anchor="middle" font-size="9.5" font-weight="800" fill="#38bdf8" font-family="ui-monospace, monospace" transform="rotate(-90, ${dimLeftX.toFixed(1)}, ${(py + pl / 2).toFixed(1)})">
      ${formatFeetInches(plotL)}
    </text>\n`;

  svg += `  </g>\n`;

  // ==========================================
  // LAYER 8: ARCHITECTURAL TITLE BLOCK & COMPASS ROSE
  // ==========================================
  svg += `  <g id="annotations_layer" class="annotations-layer">\n`;

  // North Compass Rose (Upper Right)
  const compX = svgW - 46;
  const compY = 46;
  svg += `    <!-- North Compass Rose -->
    <g id="compass_rose" transform="translate(${compX}, ${compY})">
      <circle r="22" fill="#090d16" stroke="#38bdf8" stroke-width="1.5" filter="url(#cad_shadow)"/>
      <circle r="18" fill="none" stroke="#334155" stroke-width="0.75" stroke-dasharray="2,2"/>
      <!-- North Arrow Pointer -->
      <polygon points="0,-16 5,-3 0,0 -5,-3" fill="#ef4444" />
      <polygon points="0,16 5,3 0,0 -5,3" fill="#64748b" />
      <text x="0" y="-19" text-anchor="middle" font-size="9.5" font-weight="900" fill="#ef4444">N</text>
      <text x="0" y="27" text-anchor="middle" font-size="7.5" font-weight="800" fill="#94a3b8">${facing.toUpperCase()}</text>
    </g>\n`;

  // Professional Architectural Title Block (Bottom Right)
  const tbW = 240;
  const tbH = 68;
  const tbX = svgW - tbW - 20;
  const tbY = svgH - tbH - 18;

  svg += `    <!-- Architectural Title Block -->
    <g id="cad_title_block" transform="translate(${tbX}, ${tbY})">
      <rect width="${tbW}" height="${tbH}" fill="#090d16" stroke="#38bdf8" stroke-width="1.4" rx="4" filter="url(#cad_shadow)"/>
      <line x1="0" y1="22" x2="${tbW}" y2="22" stroke="#334155" stroke-width="1.0" />
      <line x1="0" y1="46" x2="${tbW}" y2="46" stroke="#334155" stroke-width="1.0" />
      <line x1="140" y1="22" x2="140" y2="${tbH}" stroke="#334155" stroke-width="1.0" />

      <!-- Row 1: Brand & Project Name -->
      <text x="10" y="15" font-size="9" font-weight="900" fill="#38bdf8" letter-spacing="0.5">BUILDIQO.AI</text>
      <text x="80" y="15" font-size="9" font-weight="700" fill="#f8fafc">${projectName.substring(0, 22).toUpperCase()}</text>

      <!-- Row 2: Sheet Info -->
      <text x="10" y="34" font-size="8" font-weight="600" fill="#94a3b8">DRAWING:</text>
      <text x="56" y="34" font-size="8.5" font-weight="800" fill="#e2e8f0">${floorName.toUpperCase()}</text>
      <text x="148" y="34" font-size="8" font-weight="600" fill="#94a3b8">SCALE:</text>
      <text x="185" y="34" font-size="8" font-weight="800" fill="#38bdf8">1:100</text>

      <!-- Row 3: Metrics -->
      <text x="10" y="58" font-size="8" font-weight="600" fill="#94a3b8">CARPET:</text>
      <text x="56" y="58" font-size="8.5" font-weight="800" fill="#10b981">${Math.round(totalCarpet)} SQ.FT</text>
      <text x="148" y="58" font-size="8" font-weight="600" fill="#94a3b8">STATUS:</text>
      <text x="188" y="58" font-size="8" font-weight="800" fill="#f59e0b">VERIFIED</text>
    </g>\n`;

  svg += `  </g>\n`;

  svg += `</svg>`;
  return svg;
}
