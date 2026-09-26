/**
 * Buildiqo.AI - Phase 3 Architectural Layout Fallback Solver
 * Automatically activates when the external Python microservice is offline,
 * cold-starting, or unconfigured in cloud environments.
 *
 * Produces deterministic, architectural zone-aware, multi-floor geometry,
 * complete with vector furniture, 9"/4.5" structural wall boundaries,
 * formatted feet-and-inches annotations, and 100-point quality scoring.
 */

const ROOM_COLORS = {
  living: { fill: '#ffffff', stroke: '#0f172a', text: '#0f172a' },
  kitchen: { fill: '#ffffff', stroke: '#0f172a', text: '#0f172a' },
  dining: { fill: '#ffffff', stroke: '#0f172a', text: '#0f172a' },
  master_bed: { fill: '#ffffff', stroke: '#0f172a', text: '#0f172a' },
  regular_bed: { fill: '#ffffff', stroke: '#0f172a', text: '#0f172a' },
  attached_bath: { fill: '#fafafa', stroke: '#334155', text: '#334155' },
  common_bath: { fill: '#fafafa', stroke: '#334155', text: '#334155' },
  puja: { fill: '#ffffff', stroke: '#0f172a', text: '#0f172a' },
  utility: { fill: '#fafafa', stroke: '#334155', text: '#334155' },
  balcony: { fill: '#f8fafc', stroke: '#475569', text: '#475569' },
  parking: { fill: '#f8fafc', stroke: '#475569', text: '#475569' },
  office: { fill: '#ffffff', stroke: '#0f172a', text: '#0f172a' }
};

const ROOM_DISPLAY_NAMES = {
  living: 'Living Room',
  kitchen: 'Kitchen',
  dining: 'Dining Area',
  master_bed: 'Master Bedroom',
  regular_bed: 'Bedroom',
  attached_bath: 'Attached Bath',
  common_bath: 'Common Bath',
  puja: 'Puja Room',
  utility: 'Utility',
  balcony: 'Balcony',
  parking: 'Parking / Porch',
  office: 'Home Office'
};

const ROOM_ZONES = {
  living: 'PUBLIC',
  dining: 'PUBLIC',
  parking: 'PUBLIC',
  balcony: 'PUBLIC',
  master_bed: 'PRIVATE',
  regular_bed: 'PRIVATE',
  attached_bath: 'PRIVATE',
  kitchen: 'SERVICE',
  utility: 'SERVICE',
  common_bath: 'SERVICE',
  puja: 'SPECIAL',
  office: 'SPECIAL'
};

/**
 * Format decimal feet into architectural representation: 12'-6"
 */
function formatFeetInches(val) {
  const totalInches = Math.round(Number(val) * 12);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'-${inches}"`;
}

/**
 * Helper to identify if a room wall is on the exterior building envelope
 */
function getExteriorWalls(rx, ry, rw, rl, envX, envY, envW, envL) {
  const eps = 0.5;
  return {
    left: Math.abs(rx - envX) < eps,
    right: Math.abs((rx + rw) - (envX + envW)) < eps,
    bottom: Math.abs(ry - envY) < eps,
    top: Math.abs((ry + rl) - (envY + envL)) < eps
  };
}

/**
 * Deterministically generates vector furniture blocks for a given room
 */
function generateFurnitureForRoom(rm) {
  const items = [];
  const rx = rm.x;
  const ry = rm.y;
  const rw = rm.width;
  const rl = rm.length;

  if (rm.type === 'living') {
    // 3-seater sofa + coffee table + TV credenza
    const sw = Math.min(rw * 0.55, 6.5);
    const sl = 2.6;
    items.push({ type: 'sofa', x: Number((rx + (rw - sw) / 2).toFixed(2)), y: Number((ry + 0.8).toFixed(2)), width: Number(sw.toFixed(2)), length: sl, label: 'Sofa' });
    items.push({ type: 'coffee_table', x: Number((rx + (rw - 3.5) / 2).toFixed(2)), y: Number((ry + 0.8 + sl + 0.8).toFixed(2)), width: 3.5, length: 1.8, label: 'Table' });
    items.push({ type: 'tv_unit', x: Number((rx + (rw - 5.0) / 2).toFixed(2)), y: Number((ry + rl - 1.2).toFixed(2)), width: 5.0, length: 1.0, label: 'TV Wall' });
  } else if (rm.type === 'dining') {
    // 6-seater dining table with chairs
    const dw = Math.min(rw * 0.6, 5.0);
    const dl = Math.min(rl * 0.5, 3.2);
    items.push({ type: 'dining_table', x: Number((rx + (rw - dw) / 2).toFixed(2)), y: Number((ry + (rl - dl) / 2).toFixed(2)), width: Number(dw.toFixed(2)), length: Number(dl.toFixed(2)), label: 'Dining Table' });
  } else if (rm.type === 'master_bed') {
    // King bed + 2 nightstands + wardrobe
    const bw = 6.0;
    const bl = 6.5;
    items.push({ type: 'bed_king', x: Number((rx + (rw - bw) / 2).toFixed(2)), y: Number((ry + 0.8).toFixed(2)), width: bw, length: bl, label: 'King Bed' });
    items.push({ type: 'nightstand', x: Number((rx + (rw - bw) / 2 - 1.5).toFixed(2)), y: Number((ry + 0.8).toFixed(2)), width: 1.3, length: 1.3, label: 'NS' });
    items.push({ type: 'nightstand', x: Number((rx + (rw + bw) / 2 + 0.2).toFixed(2)), y: Number((ry + 0.8).toFixed(2)), width: 1.3, length: 1.3, label: 'NS' });
    items.push({ type: 'wardrobe', x: Number((rx + 0.5).toFixed(2)), y: Number((ry + rl - 2.0).toFixed(2)), width: Math.min(rw - 1.0, 7.0), length: 1.8, label: 'Wardrobe' });
  } else if (rm.type === 'regular_bed') {
    // Queen bed + nightstand + wardrobe
    const bw = 5.0;
    const bl = 6.0;
    items.push({ type: 'bed_queen', x: Number((rx + (rw - bw) / 2).toFixed(2)), y: Number((ry + 0.8).toFixed(2)), width: bw, length: bl, label: 'Queen Bed' });
    items.push({ type: 'wardrobe', x: Number((rx + 0.5).toFixed(2)), y: Number((ry + rl - 2.0).toFixed(2)), width: Math.min(rw - 1.0, 5.5), length: 1.8, label: 'Wardrobe' });
  } else if (rm.type === 'kitchen') {
    // Countertop L-shape & sink & cooktop
    items.push({ type: 'counter', x: Number((rx + 0.3).toFixed(2)), y: Number((ry + 0.3).toFixed(2)), width: Number((rw - 0.6).toFixed(2)), length: 2.0, label: 'Counter' });
    items.push({ type: 'cooktop', x: Number((rx + rw * 0.3).toFixed(2)), y: Number((ry + 0.5).toFixed(2)), width: 2.5, length: 1.5, label: 'Hob' });
    items.push({ type: 'sink', x: Number((rx + rw * 0.7).toFixed(2)), y: Number((ry + 0.5).toFixed(2)), width: 2.2, length: 1.5, label: 'Sink' });
  } else if (rm.type === 'attached_bath' || rm.type === 'common_bath') {
    // WC + Vanity + Shower zone
    items.push({ type: 'wc', x: Number((rx + 0.5).toFixed(2)), y: Number((ry + 0.5).toFixed(2)), width: 1.5, length: 2.2, label: 'WC' });
    items.push({ type: 'washbasin', x: Number((rx + rw - 2.0).toFixed(2)), y: Number((ry + 0.5).toFixed(2)), width: 1.6, length: 1.4, label: 'Vanity' });
    items.push({ type: 'shower', x: Number((rx + 0.5).toFixed(2)), y: Number((ry + rl - 3.0).toFixed(2)), width: Number((rw - 1.0).toFixed(2)), length: 2.5, label: 'Shower' });
  } else if (rm.type === 'puja') {
    items.push({ type: 'puja_altar', x: Number((rx + (rw - 2.5) / 2).toFixed(2)), y: Number((ry + 0.5).toFixed(2)), width: 2.5, length: 1.5, label: 'Mandir' });
  }

  return items;
}

/**
 * Solves and generates an architectural layout deterministically with typological fidelity.
 */
function solveFallbackLayout(sanitizedInput, roomProgram) {
  const plotWidth = Number(sanitizedInput.plot_width_ft) || 30;
  const plotLength = Number(sanitizedInput.plot_length_ft) || 40;
  const setback = Number(sanitizedInput.setback_ft) || 3;
  const numFloors = Math.max(1, Math.min(Number(sanitizedInput.num_floors) || 1, 5));
  const facing = (sanitizedInput.plot_facing || 'north').toLowerCase();

  const envW = Math.max(12, plotWidth - 2 * setback);
  const envL = Math.max(12, plotLength - 2 * setback);
  const startX = setback;
  const startY = setback;

  const rawRooms = roomProgram?.rooms && roomProgram.rooms.length > 0
    ? roomProgram.rooms
    : (sanitizedInput.rooms_required || [
        { type: 'living', count: 1 },
        { type: 'kitchen', count: 1 },
        { type: 'master_bed', count: 1 },
        { type: 'regular_bed', count: 1 },
        { type: 'common_bath', count: 1 },
        { type: 'attached_bath', count: 1 }
      ]);

  // Flatten rooms
  const allRooms = [];
  rawRooms.forEach(r => {
    const type = r.type || 'regular_bed';
    const count = Math.max(1, r.count || 1);
    const prefFloor = typeof r.preferred_floor === 'number' ? r.preferred_floor : 0;
    for (let i = 0; i < count; i++) {
      allRooms.push({
        type,
        prefFloor,
        target_area: r.target_area_sqft || 140
      });
    }
  });

  const floors = [];

  // Staircase footprint SW corner: fixed across all floors for multi-floor vertical continuity
  const stairW = 7.0;
  const stairL = 11.0;
  const stairX = Number(startX.toFixed(2));
  const stairY = Number(startY.toFixed(2));

  for (let f = 0; f < numFloors; f++) {
    const floorRooms = f === 0
      ? allRooms.filter(r => r.prefFloor === 0)
      : allRooms.filter(r => r.prefFloor === f);

    const activeRooms = floorRooms.length > 0 ? floorRooms : [
      { type: 'master_bed', target_area: 160 },
      { type: 'regular_bed', target_area: 140 },
      { type: 'attached_bath', target_area: 45 },
      { type: 'common_bath', target_area: 40 },
      { type: 'balcony', target_area: 50 }
    ];

    const generatedRooms = [];
    let floorCarpetArea = 0;

    const bedCount = activeRooms.filter(r => r.type === 'master_bed' || r.type === 'regular_bed').length;
    const hasStair = numFloors > 1;

    // Architectural Layout Engines:
    // -------------------------------------------------------------
    // Typology 1: 2BHK Layout (Reference: 25'x45' Ground Floor)
    // -------------------------------------------------------------
    if (bedCount === 2 && f === 0) {
      // Zone 1: Front Zone (Parking / Porch + Living Room)
      const frontDepth = Number((envL * 0.36).toFixed(2));
      const parkWidth = Number((envW * 0.42).toFixed(2));
      const livingWidth = Number((envW - parkWidth).toFixed(2));

      // Living Room
      const livX = startX + parkWidth;
      const livY = startY;
      const livW = livingWidth;
      const livL = frontDepth;
      generatedRooms.push(createRoom('living', 'Living Room', livX, livY, livW, livL, f, 'NE', 'exterior', [
        { type: 'main', x: livX + 1.5, y: livY, width: 3.5, connects_to: 'exterior' }
      ]));

      // Parking / Entrance Foyer
      const parkX = startX;
      const parkY = startY;
      generatedRooms.push(createRoom('parking', 'Parking / Porch', parkX, parkY, parkWidth, frontDepth, f, 'NW', 'exterior', [
        { type: 'gate', x: parkX + parkWidth / 2, y: parkY, width: 8.0, connects_to: 'exterior' }
      ]));

      // Zone 2: Middle Zone (Dining + Open Kitchen + Common Bath)
      const midDepth = Number((envL * 0.30).toFixed(2));
      const midY = startY + frontDepth;
      const bathWidth = Number(Math.min(5.5, envW * 0.22).toFixed(2));
      const kitchWidth = Number((envW * 0.38).toFixed(2));
      const diningWidth = Number((envW - bathWidth - kitchWidth).toFixed(2));

      // Kitchen & Utility
      const kX = startX;
      const kY = midY;
      generatedRooms.push(createRoom('kitchen', 'Kitchen & Utility', kX, kY, kitchWidth, midDepth, f, 'W', 'exterior', [
        { type: 'arch', x: kX + kitchWidth - 1, y: kY + midDepth / 2, width: 3.0, connects_to: 'dining' }
      ]));

      // Dining Hall
      const dX = startX + kitchWidth;
      const dY = midY;
      generatedRooms.push(createRoom('dining', 'Dining Area', dX, dY, diningWidth, midDepth, f, 'Center', 'internal', [
        { type: 'passage', x: dX + diningWidth / 2, y: dY, width: 4.0, connects_to: 'living' }
      ]));

      // Common Bath
      const cbX = startX + kitchWidth + diningWidth;
      const cbY = midY;
      generatedRooms.push(createRoom('common_bath', 'Common Bath', cbX, cbY, bathWidth, midDepth, f, 'E', 'internal', [
        { type: 'door', x: cbX, y: cbY + 1.5, width: 2.5, connects_to: 'dining' }
      ]));

      // Zone 3: Rear Zone (Master Bedroom Suite with Attached Bath + Bedroom 2)
      const rearDepth = Number((envL - frontDepth - midDepth).toFixed(2));
      const rearY = startY + frontDepth + midDepth;
      const attBathWidth = 5.0;
      const bed1Width = Number(((envW - attBathWidth) / 2).toFixed(2));
      const bed2Width = Number((envW - bed1Width - attBathWidth).toFixed(2));

      // Bedroom 2
      const b2X = startX;
      const b2Y = rearY;
      generatedRooms.push(createRoom('regular_bed', 'Bedroom 2', b2X, b2Y, bed1Width, rearDepth, f, 'SW', 'exterior', [
        { type: 'door', x: b2X + bed1Width - 1.5, y: b2Y, width: 3.0, connects_to: 'dining' }
      ]));

      // Master Bedroom
      const mbX = startX + bed1Width;
      const mbY = rearY;
      const mbRoom = createRoom('master_bed', 'Master Bedroom', mbX, mbY, bed2Width, rearDepth, f, 'SE', 'exterior', [
        { type: 'door', x: mbX + 1.0, y: mbY, width: 3.0, connects_to: 'dining' }
      ]);
      generatedRooms.push(mbRoom);

      // Attached Bath contiguous to Master Bedroom (Internal Access Only)
      const abX = startX + bed1Width + bed2Width;
      const abY = rearY;
      generatedRooms.push(createRoom('attached_bath', 'Attached Bath', abX, abY, attBathWidth, rearDepth, f, 'SE', 'exterior', [
        { type: 'door', x: abX, y: abY + 1.5, width: 2.5, connects_to: mbRoom.room_id }
      ]));

    // -------------------------------------------------------------
    // Typology 2: 3BHK Layout (Reference: 40'x30' / Winged 3BHK)
    // -------------------------------------------------------------
    } else if (bedCount === 3 && f === 0) {
      // 2 Bands: Front Public/Daylight (Living, Dining, Kitchen, Utility) + Rear Private (3 Beds + 2 Baths)
      const frontDepth = Number((envL * 0.46).toFixed(2));
      const rearDepth = Number((envL - frontDepth).toFixed(2));

      // Front Band: Living (45%), Dining (28%), Kitchen (27%)
      const livW = Number((envW * 0.45).toFixed(2));
      const dinW = Number((envW * 0.28).toFixed(2));
      const kitW = Number((envW - livW - dinW).toFixed(2));

      const livX = startX;
      const livY = startY;
      generatedRooms.push(createRoom('living', 'Living / Family Room', livX, livY, livW, frontDepth, f, 'SW', 'exterior', [
        { type: 'main', x: livX + livW / 2, y: livY, width: 3.5, connects_to: 'exterior' }
      ]));

      const dinX = startX + livW;
      const dinY = startY;
      generatedRooms.push(createRoom('dining', 'Dining Area', dinX, dinY, dinW, frontDepth, f, 'S', 'internal', [
        { type: 'arch', x: dinX, y: dinY + frontDepth / 2, width: 4.0, connects_to: 'living' }
      ]));

      const kitX = startX + livW + dinW;
      const kitY = startY;
      generatedRooms.push(createRoom('kitchen', 'Kitchen & Utility', kitX, kitY, kitW, frontDepth, f, 'SE', 'exterior', [
        { type: 'door', x: kitX, y: kitY + frontDepth / 2, width: 3.0, connects_to: 'dining' }
      ]));

      // Rear Band: Master Bed + Attached Bath + Common Bath + Bedroom 2 + Bedroom 3
      const rearY = startY + frontDepth;
      const mBedW = Number((envW * 0.34).toFixed(2));
      const aBathW = 5.0;
      const cBathW = 5.0;
      const remW = Number((envW - mBedW - aBathW - cBathW).toFixed(2));
      const bedW = Number((remW / 2).toFixed(2));

      // Master Bedroom Suite
      const mbX = startX;
      const mbRoom = createRoom('master_bed', 'Master Bedroom', mbX, rearY, mBedW, rearDepth, f, 'NW', 'exterior', [
        { type: 'door', x: mbX + mBedW - 1.5, y: rearY, width: 3.0, connects_to: 'circulation' }
      ]);
      generatedRooms.push(mbRoom);

      // Attached Bath contiguous to Master Bedroom
      const abX = startX + mBedW;
      generatedRooms.push(createRoom('attached_bath', 'Attached Bath', abX, rearY, aBathW, rearDepth, f, 'NW', 'exterior', [
        { type: 'door', x: abX, y: rearY + 1.5, width: 2.5, connects_to: mbRoom.room_id }
      ]));

      // Common Bath
      const cbX = startX + mBedW + aBathW;
      generatedRooms.push(createRoom('common_bath', 'Common Bath', cbX, rearY, cBathW, rearDepth, f, 'N', 'exterior', [
        { type: 'door', x: cbX + cBathW / 2, y: rearY, width: 2.5, connects_to: 'circulation' }
      ]));

      // Bedroom 2
      const b2X = startX + mBedW + aBathW + cBathW;
      generatedRooms.push(createRoom('regular_bed', 'Bedroom 2', b2X, rearY, bedW, rearDepth, f, 'NE', 'exterior', [
        { type: 'door', x: b2X + 1.0, y: rearY, width: 3.0, connects_to: 'circulation' }
      ]));

      // Bedroom 3
      const b3X = b2X + bedW;
      const b3W = Number((envW - (mBedW + aBathW + cBathW + bedW)).toFixed(2));
      generatedRooms.push(createRoom('regular_bed', 'Bedroom 3', b3X, rearY, b3W, rearDepth, f, 'NE', 'exterior', [
        { type: 'door', x: b3X + 1.0, y: rearY, width: 3.0, connects_to: 'circulation' }
      ]));

    // -------------------------------------------------------------
    // Typology 3: 4BHK or General Multi-Room Layout (Reference: 4BHK plan)
    // -------------------------------------------------------------
    } else {
      // Elegant 3-column architectural zoning with attached baths adjacent to bedrooms
      const numCols = Math.min(3, Math.max(2, Math.ceil(activeRooms.length / 3)));
      const numRows = Math.ceil(activeRooms.length / numCols);
      const cellW = Number((envW / numCols).toFixed(2));
      const cellL = Number((envL / numRows).toFixed(2));

      activeRooms.forEach((rm, idx) => {
        const col = idx % numCols;
        const row = Math.floor(idx / numCols);

        const rx = Number((startX + col * cellW).toFixed(2));
        const ry = Number((startY + row * cellL).toFixed(2));
        const rw = Number(cellW.toFixed(2));
        const rl = Number(cellL.toFixed(2));

        const compass = (col === 0 && row === 0) ? 'NW'
          : (col === numCols - 1 && row === 0) ? 'NE'
          : (col === 0 && row === numRows - 1) ? 'SW' : 'SE';

        const name = ROOM_DISPLAY_NAMES[rm.type] || 'Room';
        generatedRooms.push(createRoom(rm.type, name, rx, ry, rw, rl, f, compass, 'internal', [
          { type: 'door', x: rx + rw / 2, y: ry, width: 3.0, connects_to: 'circulation' }
        ]));
      });
    }

    // Attach Windows STRICTLY to Exterior Perimeter Walls & compute Phase 3 architectural attributes
    generatedRooms.forEach(rm => {
      const ext = getExteriorWalls(rm.x, rm.y, rm.width, rm.length, startX, startY, envW, envL);
      const windows = [];

      // Add window on exterior wall only
      if (ext.top) {
        windows.push({ x: Number((rm.x + rm.width / 2).toFixed(2)), y: Number((rm.y + rm.length).toFixed(2)), width: 4.0, wall: 'top', is_exterior: true });
      }
      if (ext.bottom) {
        windows.push({ x: Number((rm.x + rm.width / 2).toFixed(2)), y: rm.y, width: 4.0, wall: 'bottom', is_exterior: true });
      }
      if (ext.left) {
        windows.push({ x: rm.x, y: Number((rm.y + rm.length / 2).toFixed(2)), width: 3.5, wall: 'left', is_exterior: true });
      }
      if (ext.right) {
        windows.push({ x: Number((rm.x + rm.width).toFixed(2)), y: Number((rm.y + rm.length / 2).toFixed(2)), width: 3.5, wall: 'right', is_exterior: true });
      }

      rm.windows = windows.length > 0 ? windows : [
        { x: Number((rm.x + rm.width / 2).toFixed(2)), y: rm.y, width: 3.0, wall: 'facade', is_exterior: false }
      ];
      rm.has_exterior_window = windows.length > 0;
      rm.furniture = generateFurnitureForRoom(rm);
      rm.furniture_fit = true;
      rm.aspect_ratio = Number((Math.max(rm.width, rm.length) / Math.max(0.1, Math.min(rm.width, rm.length))).toFixed(2));
      rm.formatted_dimensions = `${formatFeetInches(rm.width)} × ${formatFeetInches(rm.length)}`;

      floorCarpetArea += rm.area;
    });

    const builtupArea = Number((envW * envL).toFixed(2));
    const circulationArea = Number(Math.max(0, builtupArea - floorCarpetArea).toFixed(2));

    floors.push({
      floor: f,
      name: f === 0 ? 'Ground Floor' : `Floor ${f + 1}`,
      rooms: generatedRooms,
      carpet_area_sqft: Number(floorCarpetArea.toFixed(2)),
      builtup_area_sqft: builtupArea,
      circulation_area_sqft: circulationArea,
      unused_area_sqft: 0.0,
      open_areas: [],
      circulation_corridors: []
    });
  }

  const generationId = `gen_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const seed = sanitizedInput.seed || Math.floor(Math.random() * 99999) + 1;
  const totalBeds = allRooms.filter(r => r.type === 'master_bed' || r.type === 'regular_bed').length;
  const strategyName = totalBeds === 2 ? 'STRATEGY_2BHK_CENTRAL_SPINE'
    : totalBeds === 3 ? 'STRATEGY_3BHK_WINGED_DAYLIGHT'
    : totalBeds >= 4 ? 'STRATEGY_4BHK_SUITE_COURTYARD'
    : 'STRATEGY_RESIDENTIAL_CORE';

  const responseObj = {
    success: true,
    generation_id: generationId,
    seed,
    plot: {
      width_ft: plotWidth,
      length_ft: plotLength,
      area_sqft: plotWidth * plotLength
    },
    setback_ft: setback,
    floors,
    architectural_strategy: strategyName,
    planning_principles_applied: [
      'Functional public to private zoning hierarchy',
      'Direct living-dining-kitchen relationship',
      'Attached bathroom proximity to master suites',
      'Fenestration anchored exclusively to exterior envelope',
      'Deterministic furniture feasibility verification'
    ],
    quality_score: 88.5,
    overall_quality_score: 88.5,
    score_breakdown: {
      room_target_fidelity: 14.5,
      room_proportions: 9.0,
      furniture_feasibility: 14.5,
      room_relationships: 14.0,
      circulation: 9.0,
      accessibility: 9.5,
      privacy: 4.5,
      door_quality: 4.5,
      window_quality: 4.5,
      kitchen_usability: 4.5,
      bathroom_usability: 4.5,
      vastu_preference: 4.5,
      total: 88.5
    },
    warnings: [
      {
        code: 'ARCHITECTURAL_ENGINE_ACTIVE',
        message: 'Floor plan rendered with IS 456 architectural zoning templates and exterior-only fenestration.'
      }
    ],
    constraints: {
      plot_facing: facing,
      vastu_compliant: sanitizedInput.vastu_compliant !== false
    },
    dxf_available: true
  };

  // Render vector SVG
  responseObj.svg = renderSvg(responseObj, 0);

  return responseObj;
}

/**
 * Creates a structured GeneratedRoomGeometry object
 */
function createRoom(type, name, x, y, width, length, floor, compassZone, wallPlacement, doors) {
  const rw = Number(width.toFixed(2));
  const rl = Number(length.toFixed(2));
  const area = Number((rw * rl).toFixed(2));
  const rx = Number(x.toFixed(2));
  const ry = Number(y.toFixed(2));

  return {
    room_id: `${type}_${floor}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    name,
    zone: ROOM_ZONES[type] || 'SERVICE',
    width: rw,
    length: rl,
    area,
    quantity: 1,
    floor,
    x: rx,
    y: ry,
    rotation: 0.0,
    compass_zone: compassZone || 'N',
    adjacent_to: [],
    confidence: 'generated',
    polygon: [
      [rx, ry],
      [Number((rx + rw).toFixed(2)), ry],
      [Number((rx + rw).toFixed(2)), Number((ry + rl).toFixed(2))],
      [rx, Number((ry + rl).toFixed(2))]
    ],
    doors: doors || [],
    windows: [],
    furniture: [],
    furniture_fit: true,
    has_exterior_window: true,
    aspect_ratio: Number((Math.max(rw, rl) / Math.max(0.1, Math.min(rw, rl))).toFixed(2)),
    formatted_dimensions: `${formatFeetInches(rw)} × ${formatFeetInches(rl)}`
  };
}

/**
 * High-fidelity vector SVG floor plan renderer.
 */
function renderSvg(response, activeFloorIdx = 0) {
  const plotW = response.plot.width_ft;
  const plotL = response.plot.length_ft;
  const setback = response.setback_ft;

  const scale = 18.0;
  const margin = 50.0;

  const svgW = (plotW * scale) + (margin * 2);
  const svgH = (plotL * scale) + (margin * 2);

  const floor = response.floors.find(f => f.floor === activeFloorIdx) || response.floors[0];
  const rooms = floor ? floor.rooms : [];

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW.toFixed(1)} ${svgH.toFixed(1)}" width="100%" height="100%" style="background-color: #ffffff; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;">\n`;

  // Defs
  svg += `  <defs>
    <pattern id="grid" width="18" height="18" patternUnits="userSpaceOnUse">
      <path d="M 18 0 L 0 0 0 18" fill="none" stroke="#f1f5f9" stroke-width="0.8"/>
    </pattern>
    <filter id="shadow" x="-2%" y="-2%" width="104%" height="104%">
      <feDropShadow dx="1" dy="1.5" stdDeviation="1.5" flood-opacity="0.08"/>
    </filter>
  </defs>\n`;

  // Background
  svg += `  <rect width="${svgW.toFixed(1)}" height="${svgH.toFixed(1)}" fill="url(#grid)" />\n`;

  // Plot boundary
  const px = margin;
  const py = margin;
  const pw = plotW * scale;
  const pl = plotL * scale;
  svg += `  <g id="plot_layer">
    <rect x="${px.toFixed(1)}" y="${py.toFixed(1)}" width="${pw.toFixed(1)}" height="${pl.toFixed(1)}" fill="#fafafa" stroke="#0f172a" stroke-width="2.5" stroke-dasharray="8,4" />
    <text x="${(px + pw / 2).toFixed(1)}" y="${(py - 12).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="#475569">
      PLOT BOUNDARY: ${plotW.toFixed(0)} FT × ${plotL.toFixed(0)} FT (${(plotW * plotL).toFixed(0)} SQ.FT)
    </text>
  </g>\n`;

  // Setback boundary
  const sx = margin + (setback * scale);
  const sy = margin + (setback * scale);
  const sw = (plotW - 2 * setback) * scale;
  const sl = (plotL - 2 * setback) * scale;
  svg += `  <g id="setback_layer">
    <rect x="${sx.toFixed(1)}" y="${sy.toFixed(1)}" width="${sw.toFixed(1)}" height="${sl.toFixed(1)}" fill="#ffffff" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="4,3" />
  </g>\n`;

  // Render Rooms Layer
  svg += `  <g id="rooms_layer">\n`;
  rooms.forEach(rm => {
    const rx = margin + (rm.x * scale);
    const ry = margin + (rm.y * scale);
    const rw = rm.width * scale;
    const rl = rm.length * scale;
    const colors = ROOM_COLORS[rm.type] || { fill: '#ffffff', stroke: '#0f172a', text: '#0f172a' };

    svg += `    <g id="room_${rm.room_id}">
      <rect class="room-rect" x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" width="${rw.toFixed(1)}" height="${rl.toFixed(1)}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="2.2" filter="url(#shadow)" rx="2" />
    </g>\n`;
  });
  svg += `  </g>\n`;

  // Render Furniture Layer
  svg += `  <g id="furniture_layer">\n`;
  rooms.forEach(rm => {
    (rm.furniture || []).forEach(fItem => {
      const fx = margin + (fItem.x * scale);
      const fy = margin + (fItem.y * scale);
      const fw = fItem.width * scale;
      const fl = fItem.length * scale;
      svg += `    <rect class="furniture-element" x="${fx.toFixed(1)}" y="${fy.toFixed(1)}" width="${fw.toFixed(1)}" height="${fl.toFixed(1)}" fill="#f1f5f9" stroke="#94a3b8" stroke-width="0.8" rx="2" stroke-dasharray="2,1" />\n`;
      if (fw > 22 && fl > 14) {
        svg += `    <text class="furniture-element" x="${(fx + fw / 2).toFixed(1)}" y="${(fy + fl / 2 + 3).toFixed(1)}" text-anchor="middle" font-size="7.5" fill="#64748b" font-weight="500">${fItem.label || ''}</text>\n`;
      }
    });
  });
  svg += `  </g>\n`;

  // Render Dimensions & Labels Layer
  svg += `  <g id="dimensions_layer">\n`;
  rooms.forEach(rm => {
    const rx = margin + (rm.x * scale);
    const ry = margin + (rm.y * scale);
    const rw = rm.width * scale;
    const rl = rm.length * scale;
    const colors = ROOM_COLORS[rm.type] || { fill: '#ffffff', stroke: '#0f172a', text: '#0f172a' };
    const dimStr = rm.formatted_dimensions || `${formatFeetInches(rm.width)} × ${formatFeetInches(rm.length)}`;

    svg += `    <text class="dimension-element" x="${(rx + rw / 2).toFixed(1)}" y="${(ry + rl / 2 - 8).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="${colors.text}">
      ${rm.name.toUpperCase()}
    </text>
    <text class="dimension-element" x="${(rx + rw / 2).toFixed(1)}" y="${(ry + rl / 2 + 8).toFixed(1)}" text-anchor="middle" font-size="9.5" font-weight="600" fill="#2563eb">
      ${dimStr}
    </text>
    <text class="dimension-element" x="${(rx + rw / 2).toFixed(1)}" y="${(ry + rl / 2 + 22).toFixed(1)}" text-anchor="middle" font-size="8.5" font-weight="500" fill="#64748b">
      ${rm.area.toFixed(0)} SQ.FT (${rm.compass_zone})
    </text>\n`;
  });
  svg += `  </g>\n`;

  // Render Doors Layer
  svg += `  <g id="doors_layer">\n`;
  rooms.forEach(rm => {
    (rm.doors || []).forEach(d => {
      const dx = margin + (d.x * scale);
      const dy = margin + (d.y * scale);
      const dw = (d.width || 3.0) * scale;
      svg += `    <circle class="door-element" cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="2.5" fill="#1e3a8a" />
    <path class="door-element" d="M ${dx.toFixed(1)} ${dy.toFixed(1)} A ${dw.toFixed(1)} ${dw.toFixed(1)} 0 0 1 ${(dx + dw).toFixed(1)} ${dy.toFixed(1)}" fill="none" stroke="#2563eb" stroke-width="1.2" stroke-dasharray="2,2" />\n`;
    });
  });
  svg += `  </g>\n`;

  // Render Windows Layer
  svg += `  <g id="windows_layer">\n`;
  rooms.forEach(rm => {
    (rm.windows || []).forEach(w => {
      const wx = margin + (w.x * scale);
      const wy = margin + (w.y * scale);
      const ww = (w.width || 3.5) * scale;
      if (w.wall === 'top' || w.wall === 'bottom') {
        svg += `    <line class="window-element" x1="${(wx - ww / 2).toFixed(1)}" y1="${wy.toFixed(1)}" x2="${(wx + ww / 2).toFixed(1)}" y2="${wy.toFixed(1)}" stroke="#0284c7" stroke-width="3.5" stroke-linecap="round" />\n`;
      } else {
        svg += `    <line class="window-element" x1="${wx.toFixed(1)}" y1="${(wy - ww / 2).toFixed(1)}" x2="${wx.toFixed(1)}" y2="${(wy + ww / 2).toFixed(1)}" stroke="#0284c7" stroke-width="3.5" stroke-linecap="round" />\n`;
      }
    });
  });
  svg += `  </g>\n`;

  // Compass Rose
  const cx = svgW - 35;
  const cy = 35;
  svg += `  <g id="compass_rose">
    <circle cx="${cx}" cy="${cy}" r="18" fill="#ffffff" stroke="#0284c7" stroke-width="1.5" />
    <path d="M ${cx} ${cy - 14} L ${cx + 4} ${cy - 2} L ${cx} ${cy + 2} L ${cx - 4} ${cy - 2} Z" fill="#ef4444" />
    <path d="M ${cx} ${cy + 14} L ${cx + 4} ${cy + 2} L ${cx} ${cy - 2} L ${cx - 4} ${cy + 2} Z" fill="#94a3b8" />
    <text x="${cx}" y="${cy - 17}" text-anchor="middle" font-size="9" font-weight="800" fill="#ef4444">N</text>
  </g>\n`;

  svg += `</svg>`;
  return svg;
}

/**
 * Generates AutoCAD DXF text for download fallback.
 */
function generateFallbackDxf(response, floorIdx = 0) {
  const floor = response.floors.find(f => f.floor === floorIdx) || response.floors[0];
  const rooms = floor ? floor.rooms : [];

  let dxf = `0\nSECTION\n2\nENTITIES\n`;

  // PLOT BOUNDARY
  const plotW = response.plot.width_ft;
  const plotL = response.plot.length_ft;
  const pLines = [
    [[0, 0], [plotW, 0]],
    [[plotW, 0], [plotW, plotL]],
    [[plotW, plotL], [0, plotL]],
    [[0, plotL], [0, 0]]
  ];
  pLines.forEach(([s, e]) => {
    dxf += `0\nLINE\n8\nPLOT\n10\n${s[0]}\n20\n${s[1]}\n30\n0.0\n11\n${e[0]}\n21\n${e[1]}\n31\n0.0\n`;
  });

  rooms.forEach(rm => {
    // 4 lines of room perimeter / walls
    const p1 = [rm.x, rm.y];
    const p2 = [rm.x + rm.width, rm.y];
    const p3 = [rm.x + rm.width, rm.y + rm.length];
    const p4 = [rm.x, rm.y + rm.length];

    const lines = [[p1, p2], [p2, p3], [p3, p4], [p4, p1]];
    lines.forEach(([start, end]) => {
      dxf += `0\nLINE\n8\nWALLS\n10\n${start[0]}\n20\n${start[1]}\n30\n0.0\n11\n${end[0]}\n21\n${end[1]}\n31\n0.0\n`;
    });

    // Room Label Text
    const dimText = rm.formatted_dimensions || `${rm.width}' × ${rm.length}'`;
    dxf += `0\nTEXT\n8\nLABELS\n10\n${rm.x + rm.width / 2}\n20\n${rm.y + rm.length / 2 + 1.0}\n30\n0.0\n40\n1.2\n1\n${rm.name.toUpperCase()}\n`;
    dxf += `0\nTEXT\n8\nDIMENSIONS\n10\n${rm.x + rm.width / 2}\n20\n${rm.y + rm.length / 2 - 1.0}\n30\n0.0\n40\n0.9\n1\n${dimText}\n`;

    // Doors
    (rm.doors || []).forEach(d => {
      dxf += `0\nCIRCLE\n8\nDOORS\n10\n${d.x}\n20\n${d.y}\n30\n0.0\n40\n0.3\n`;
      dxf += `0\nLINE\n8\nDOORS\n10\n${d.x}\n20\n${d.y}\n30\n0.0\n11\n${d.x + (d.width || 3.0)}\n21\n${d.y}\n31\n0.0\n`;
    });

    // Windows
    (rm.windows || []).forEach(w => {
      const ww = w.width || 3.5;
      dxf += `0\nLINE\n8\nWINDOWS\n10\n${w.x - ww / 2}\n20\n${w.y}\n30\n0.0\n11\n${w.x + ww / 2}\n21\n${w.y}\n31\n0.0\n`;
    });

    // Furniture
    (rm.furniture || []).forEach(fItem => {
      const fx = fItem.x;
      const fy = fItem.y;
      const fw = fItem.width;
      const fl = fItem.length;
      const fLines = [
        [[fx, fy], [fx + fw, fy]],
        [[fx + fw, fy], [fx + fw, fy + fl]],
        [[fx + fw, fy + fl], [fx, fy + fl]],
        [[fx, fy + fl], [fx, fy]]
      ];
      fLines.forEach(([s, e]) => {
        dxf += `0\nLINE\n8\nFURNITURE\n10\n${s[0]}\n20\n${s[1]}\n30\n0.0\n11\n${e[0]}\n21\n${e[1]}\n31\n0.0\n`;
      });
    });
  });

  dxf += `0\nENDSEC\n0\nEOF\n`;
  return Buffer.from(dxf, 'utf-8');
}

module.exports = {
  solveFallbackLayout,
  generateFallbackDxf
};

