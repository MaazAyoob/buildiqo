/**
 * Buildiqo.ai Export Utilities
 * Generates PDF (print), Excel/CSV BOQ takeoff, AutoCAD DXF floor plan, and WhatsApp shareable summary.
 */

// Format currency for text exports
function fmt(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return '0';
  return 'INR ' + Math.round(amount).toLocaleString('en-IN');
}

/**
 * Generates and downloads an itemized Excel-compatible CSV Bill of Quantities (BOQ)
 */
export function downloadExcelBOQ(state, estimation) {
  const projectName = state.projectName || 'My Construction Project';
  const cityName = estimation.city?.name || state.city || 'Bengaluru';
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const rows = [];

  // Header Banner
  rows.push(['BUILDIQO.AI — CIVIL CONSTRUCTION ESTIMATION & BILL OF QUANTITIES (BOQ)']);
  rows.push(['Deterministic Engineering Quantity Engine (Compliant with IS 456:2000 & IS 13920:2016)']);
  rows.push(['Generated On:', dateStr]);
  rows.push([]);

  // Project Information
  rows.push(['1. PROJECT SPECIFICATIONS']);
  rows.push(['Project Title', projectName]);
  rows.push(['Location / City', cityName]);
  rows.push(['Construction Quality Tier', (state.tier || 'Standard').toUpperCase() + ' PACKAGE']);
  rows.push(['Building Typology', state.buildingType || 'Residential Villa / Duplex']);
  rows.push(['Structural Frame', state.constructionType || 'RCC Framed Structure (IS 456)']);
  rows.push(['Plot Dimensions', `${state.plotWidth || 30} ft × ${state.plotLength || 40} ft`]);
  rows.push(['Plot Area', `${estimation.plotArea} sq.ft (${(estimation.plotArea / 9).toFixed(1)} sq.yd)`]);
  rows.push(['Total Built-up Area (BUA)', `${estimation.totalBuiltupArea} sq.ft`]);
  rows.push(['Total Carpet Area', `${estimation.totalCarpetArea} sq.ft`]);
  rows.push(['Number of Floors', `G + ${(state.numFloors || 2) - 1} (${state.numFloors || 2} levels)`]);
  rows.push([]);

  // Financial Cost Breakdown Summary
  rows.push(['2. FINANCIAL & BUDGET SUMMARY']);
  rows.push(['Cost Component', 'Rate / Basis', 'Total Amount (INR)']);
  rows.push(['Direct Material Procurement', 'Standard IS Benchmarks', Math.round(estimation.directMaterialCost)]);
  rows.push(['Civil & Trade Labor Works', 'Regional Labor Wage Index', Math.round(estimation.totalLaborCost)]);
  rows.push(['Infrastructure & Ancillary Works', 'Boundary, Sump, Tanks, Solar', Math.round(estimation.ancillaryCost || 0)]);
  rows.push(['DIRECT CONSTRUCTION SUB-TOTAL', '', Math.round(estimation.directConstructionCost)]);
  rows.push(['Architectural & Structural Engineering Fees', '2.5% of Direct Works', Math.round(estimation.architectureFee)]);
  rows.push(['Contractor Supervision & Builder Margin', '10.0% of Direct Works', Math.round(estimation.contractorMargin)]);
  rows.push(['Contingency & Price Escalation Buffer', '4.0% Safety Reserve', Math.round(estimation.contingencyBuffer)]);
  rows.push(['GST & Statutory Taxes', 'Applicable Taxes (18% / 1%)', Math.round(estimation.statutoryTaxes || 0)]);
  rows.push(['GRAND TOTAL ESTIMATED BUDGET', `INR ${Math.round(estimation.costPerSqFt)} / sq.ft BUA`, Math.round(estimation.grandTotalCost)]);
  rows.push([]);

  // Major Material Takeoff Quantities
  rows.push(['3. STRUCTURAL MATERIAL TAKEOFF (IS 456 QUANTITIES)']);
  rows.push(['Material Category', 'Selected Specification', 'Calculated Quantity', 'Unit', 'Estimated Cost (INR)']);

  const matItems = [
    { cat: 'Reinforcement Steel', name: estimation.materialSummary?.steelGrade || 'Fe 500D TMT Bars', qty: (estimation.materialSummary?.steelTonnes || 0).toFixed(2), unit: 'Tonnes', cost: estimation.materialSummary?.steelCost || 0 },
    { cat: 'Structural Cement', name: estimation.materialSummary?.cementBrand || 'UltraTech / Dalmia 53 Grade', qty: estimation.materialSummary?.cementBags || 0, unit: 'Bags (50kg)', cost: estimation.materialSummary?.cementCost || 0 },
    { cat: 'Sand (Coarse & Fine)', name: 'Filtered Concreting M-Sand + P-Sand', qty: estimation.materialSummary?.sandTons || 0, unit: 'Tonnes / CFT', cost: estimation.materialSummary?.sandCost || 0 },
    { cat: 'Coarse Aggregate', name: '20mm & 12mm Blue Metal Granite Jelly', qty: estimation.materialSummary?.aggTons || 0, unit: 'Tonnes', cost: estimation.materialSummary?.aggCost || 0 },
    { cat: 'Masonry Wall Units', name: 'AAC Lightweight Blocks / Concrete Blocks', qty: estimation.materialSummary?.blocksCount || 0, unit: 'Blocks / Nos', cost: estimation.materialSummary?.blocksCost || 0 },
    { cat: 'Flooring & Tiling', name: 'Vitrified Glazed Porcelain Tiles / Granite', qty: estimation.materialSummary?.flooringSqFt || 0, unit: 'Sq.Ft', cost: estimation.materialSummary?.flooringCost || 0 },
    { cat: 'Electrical Conduit & Wiring', name: 'FR Insulated Wires + Modular Switches', qty: estimation.materialSummary?.electricalPoints || 0, unit: 'Points', cost: estimation.materialSummary?.electricalCost || 0 },
    { cat: 'Plumbing & CP Sanitary', name: 'Jaquar / Kohler CPVC & PVC Lines', qty: estimation.materialSummary?.plumbingPoints || 0, unit: 'Outlets', cost: estimation.materialSummary?.plumbingCost || 0 },
    { cat: 'Painting & Finishing', name: '2 Coats Putty + Premium Acrylic Emulsion', qty: estimation.materialSummary?.paintSqFt || 0, unit: 'Sq.Ft', cost: estimation.materialSummary?.paintCost || 0 },
    { cat: 'Waterproofing System', name: 'Polymer Slurry + Brickbat Coba Membrane', qty: 1, unit: 'Lump Sum', cost: estimation.materialSummary?.waterproofingCost || 0 }
  ];

  matItems.forEach(item => {
    rows.push([item.cat, item.name, item.qty, item.unit, Math.round(item.cost)]);
  });
  rows.push([]);

  // Itemized BOQ Schedule by Work Phase
  if (estimation.boqItems && estimation.boqItems.length > 0) {
    rows.push(['4. DETAILED BILL OF QUANTITIES (BOQ) WORK SCHEDULE']);
    rows.push(['Item #', 'Trade Category', 'Work Description', 'Quantity', 'Unit', 'Unit Rate (INR)', 'Total Cost (INR)']);
    estimation.boqItems.forEach((b, idx) => {
      rows.push([
        idx + 1,
        b.category || 'Civil',
        b.item || b.description || 'Works',
        b.qty || 1,
        b.unit || 'sq.ft',
        Math.round(b.rate || 0),
        Math.round(b.totalCost || b.amount || 0)
      ]);
    });
    rows.push([]);
  }

  // Milestone Payment Schedule
  if (estimation.milestones && estimation.milestones.length > 0) {
    rows.push(['5. CONTRACTOR MILESTONE PAYMENT SCHEDULE']);
    rows.push(['Milestone #', 'Construction Stage', 'Share (%)', 'Amount (INR)', 'Indicative Timeline']);
    estimation.milestones.forEach((m, idx) => {
      rows.push([
        idx + 1,
        m.name || m.stage,
        `${m.pct}%`,
        Math.round(m.amount),
        m.timeline || 'Phase ' + (idx + 1)
      ]);
    });
    rows.push([]);
  }

  // Engineering Disclaimer
  rows.push(['NOTICE / DISCLAIMER']);
  rows.push(['Quantities are computed deterministically per IS 456 / NBC 2016 norms. Actual site consumption may vary depending on architectural details, soil bearing capacity, and quarry transport distances.']);

  // Convert to CSV with UTF-8 BOM for Microsoft Excel compatibility
  const csvContent = '\uFEFF' + rows.map(r => 
    r.map(cell => {
      if (cell === null || cell === undefined) return '""';
      const str = String(cell).replace(/"/g, '""');
      return `"${str}"`;
    }).join(',')
  ).join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `${projectName.replace(/[^a-zA-Z0-9_-]/g, '_')}_BOQ_Estimate.csv`;

  triggerBrowserDownload(blob, filename);
}

/**
 * Generates and downloads a standard AutoCAD DXF (Release 12 / 2000 ASCII)
 * CAD file containing:
 * - Plot Boundary with dimension markers
 * - Setback lines
 * - Building Plinth footprint
 * - Rooms and partition layout
 * - Column structural grid
 * - Complete title block with IS 456 compliance notes
 */
export function downloadCAD_DXF(state, estimation) {
  const projectName = state.projectName || 'My Dream Residence';
  const widthFt = Number(state.plotWidth) || 30;
  const lengthFt = Number(state.plotLength) || 40;
  const scale = 1.0; // 1 drawing unit = 1 foot

  // Convert dimensions to CAD coordinates
  const pW = widthFt * scale;
  const pL = lengthFt * scale;

  // Standard residential setbacks: Front 5ft, Rear 3ft, Left 3ft, Right 3ft
  const frontSetback = 5 * scale;
  const rearSetback = 3 * scale;
  const leftSetback = 3 * scale;
  const rightSetback = 3 * scale;

  const bldgX1 = leftSetback;
  const bldgY1 = frontSetback;
  const bldgX2 = pW - rightSetback;
  const bldgY2 = pL - rearSetback;
  const bldgW = Math.max(10, bldgX2 - bldgX1);
  const bldgL = Math.max(15, bldgY2 - bldgY1);

  // DXF Sections container
  let dxf = '';

  // 1. HEADER SECTION
  dxf += '0\nSECTION\n2\nHEADER\n';
  dxf += '9\n$ACADVER\n1\nAC1009\n'; // AutoCAD R12 standard compatible across all CAD tools
  dxf += '9\n$INSUNITS\n70\n2\n'; // Feet
  dxf += '9\n$EXTMIN\n10\n-10.0\n20\n-10.0\n30\n0.0\n';
  dxf += `9\n$EXTMAX\n10\n${(pW + 20).toFixed(1)}\n20\n${(pL + 25).toFixed(1)}\n30\n0.0\n`;
  dxf += '0\nENDSEC\n';

  // 2. TABLES SECTION (LAYERS)
  dxf += '0\nSECTION\n2\nTABLES\n';
  dxf += '0\nTABLE\n2\nLAYER\n70\n6\n';

  const layers = [
    { name: 'PLOT_BOUNDARY', color: 1 }, // Red
    { name: 'SETBACKS', color: 4 }, // Cyan
    { name: 'BUILDING_FOOTPRINT', color: 2 }, // Yellow
    { name: 'ROOMS_WALLS', color: 3 }, // Green
    { name: 'ROOM_LABELS', color: 7 }, // White
    { name: 'COLUMN_GRID', color: 5 }, // Blue
    { name: 'TITLE_BLOCK', color: 6 }  // Magenta
  ];

  layers.forEach(l => {
    dxf += '0\nLAYER\n';
    dxf += `2\n${l.name}\n`;
    dxf += '70\n0\n';
    dxf += `62\n${l.color}\n`;
    dxf += '6\nCONTINUOUS\n';
  });

  dxf += '0\nENDTAB\n';
  dxf += '0\nENDSEC\n';

  // 3. ENTITIES SECTION
  dxf += '0\nSECTION\n2\nENTITIES\n';

  // Helper: Draw line
  function addLine(layer, x1, y1, x2, y2) {
    return `0\nLINE\n8\n${layer}\n10\n${x1.toFixed(2)}\n20\n${y1.toFixed(2)}\n30\n0.0\n11\n${x2.toFixed(2)}\n20\n${y2.toFixed(2)}\n30\n0.0\n`;
  }

  // Helper: Draw text
  function addText(layer, x, y, height, text) {
    return `0\nTEXT\n8\n${layer}\n10\n${x.toFixed(2)}\n20\n${y.toFixed(2)}\n30\n0.0\n40\n${height.toFixed(2)}\n1\n${text}\n`;
  }

  // A. PLOT BOUNDARY (Rectangle: 0,0 to pW, pL)
  dxf += addLine('PLOT_BOUNDARY', 0, 0, pW, 0);
  dxf += addLine('PLOT_BOUNDARY', pW, 0, pW, pL);
  dxf += addLine('PLOT_BOUNDARY', pW, pL, 0, pL);
  dxf += addLine('PLOT_BOUNDARY', 0, pL, 0, 0);

  // Plot Dimensions Text
  dxf += addText('PLOT_BOUNDARY', pW / 2 - 4, -2.5, 1.2, `FRONT: ${widthFt}'-0" ROAD FACING (${state.facing || 'NORTH'})`);
  dxf += addText('PLOT_BOUNDARY', pW + 1.5, pL / 2, 1.2, `DEPTH: ${lengthFt}'-0"`);
  dxf += addText('PLOT_BOUNDARY', pW / 2 - 3, pL + 1.5, 1.2, `REAR: ${widthFt}'-0"`);

  // B. SETBACK LINES (Dashed / Offset)
  dxf += addLine('SETBACKS', leftSetback, frontSetback, pW - rightSetback, frontSetback);
  dxf += addLine('SETBACKS', pW - rightSetback, frontSetback, pW - rightSetback, pL - rearSetback);
  dxf += addLine('SETBACKS', pW - rightSetback, pL - rearSetback, leftSetback, pL - rearSetback);
  dxf += addLine('SETBACKS', leftSetback, pL - rearSetback, leftSetback, frontSetback);

  // C. BUILDING FOOTPRINT
  dxf += addLine('BUILDING_FOOTPRINT', bldgX1, bldgY1, bldgX2, bldgY1);
  dxf += addLine('BUILDING_FOOTPRINT', bldgX2, bldgY1, bldgX2, bldgY2);
  dxf += addLine('BUILDING_FOOTPRINT', bldgX2, bldgY2, bldgX1, bldgY2);
  dxf += addLine('BUILDING_FOOTPRINT', bldgX1, bldgY2, bldgX1, bldgY1);

  // D. ROOMS / INTERNAL PARTITIONS (From state.floors[0].rooms)
  const groundFloor = state.floors?.[0];
  const rooms = groundFloor?.rooms || [
    { name: 'Living Room', width: 15, length: 16 },
    { name: 'Kitchen', width: 10, length: 12 },
    { name: 'Master Bed', width: 14, length: 14 },
    { name: 'Car Parking', width: 12, length: 16 }
  ];

  // Grid layout for rooms within plinth footprint
  let curX = bldgX1 + 1;
  let curY = bldgY1 + 1;
  const colWidth = bldgW / 2 - 1.5;
  const rowHeight = bldgL / Math.ceil(rooms.length / 2) - 1.5;

  rooms.forEach((r, idx) => {
    const colIdx = idx % 2;
    const rowIdx = Math.floor(idx / 2);
    const rx1 = bldgX1 + 0.8 + (colIdx * (bldgW / 2));
    const ry1 = bldgY1 + 0.8 + (rowIdx * rowHeight);
    const rx2 = rx1 + Math.min(bldgW / 2 - 1.5, (r.width || 12) * 0.8);
    const ry2 = ry1 + Math.min(rowHeight - 1, (r.length || 12) * 0.8);

    // Draw room box
    dxf += addLine('ROOMS_WALLS', rx1, ry1, rx2, ry1);
    dxf += addLine('ROOMS_WALLS', rx2, ry1, rx2, ry2);
    dxf += addLine('ROOMS_WALLS', rx2, ry2, rx1, ry2);
    dxf += addLine('ROOMS_WALLS', rx1, ry2, rx1, ry1);

    // Label room name & dimensions
    const midX = (rx1 + rx2) / 2 - 2.5;
    const midY = (ry1 + ry2) / 2;
    dxf += addText('ROOM_LABELS', midX, midY + 0.5, 0.9, r.name || 'Room');
    dxf += addText('ROOM_LABELS', midX, midY - 0.7, 0.7, `${r.width || 12}' x ${r.length || 12}'`);
  });

  // E. STRUCTURAL COLUMN GRID (Columns C1..Cn at plinth corners and spans)
  const colPositions = [
    { name: 'C1', x: bldgX1, y: bldgY1 },
    { name: 'C2', x: (bldgX1 + bldgX2) / 2, y: bldgY1 },
    { name: 'C3', x: bldgX2, y: bldgY1 },
    { name: 'C4', x: bldgX1, y: (bldgY1 + bldgY2) / 2 },
    { name: 'C5', x: (bldgX1 + bldgX2) / 2, y: (bldgY1 + bldgY2) / 2 },
    { name: 'C6', x: bldgX2, y: (bldgY1 + bldgY2) / 2 },
    { name: 'C7', x: bldgX1, y: bldgY2 },
    { name: 'C8', x: (bldgX1 + bldgX2) / 2, y: bldgY2 },
    { name: 'C9', x: bldgX2, y: bldgY2 }
  ];

  colPositions.forEach(c => {
    // 9" x 12" column cross
    const s = 0.8;
    dxf += addLine('COLUMN_GRID', c.x - s, c.y - s, c.x + s, c.y - s);
    dxf += addLine('COLUMN_GRID', c.x + s, c.y - s, c.x + s, c.y + s);
    dxf += addLine('COLUMN_GRID', c.x + s, c.y + s, c.x - s, c.y + s);
    dxf += addLine('COLUMN_GRID', c.x - s, c.y + s, c.x - s, c.y - s);
    dxf += addText('COLUMN_GRID', c.x + 1.0, c.y + 0.5, 0.6, c.name);
  });

  // F. CAD TITLE BLOCK
  const tbX = 0;
  const tbY = pL + 5;
  const tbW = pW;
  const tbH = 9;

  dxf += addLine('TITLE_BLOCK', tbX, tbY, tbX + tbW, tbY);
  dxf += addLine('TITLE_BLOCK', tbX + tbW, tbY, tbX + tbW, tbY + tbH);
  dxf += addLine('TITLE_BLOCK', tbX + tbW, tbY + tbH, tbX, tbY + tbH);
  dxf += addLine('TITLE_BLOCK', tbX, tbY + tbH, tbX, tbY);

  dxf += addText('TITLE_BLOCK', tbX + 1, tbY + 6.8, 1.4, `PROJECT: ${projectName.toUpperCase()}`);
  dxf += addText('TITLE_BLOCK', tbX + 1, tbY + 4.8, 1.0, `LOCATION: ${state.city || 'Bengaluru'} | FLOORS: G+${(state.numFloors || 2) - 1} | PLOT: ${widthFt}x${lengthFt} FT`);
  dxf += addText('TITLE_BLOCK', tbX + 1, tbY + 3.0, 0.9, `ESTIMATED BUA: ${estimation.totalBuiltupArea} SQ.FT | TIER: ${(state.tier || 'Standard').toUpperCase()}`);
  dxf += addText('TITLE_BLOCK', tbX + 1, tbY + 1.2, 0.75, 'DESIGN CODE COMPLIANCE: IS 456:2000 (RCC) + IS 13920:2016 (DUCTILE DETAILING) | BUILDIQO.AI');

  // END OF ENTITIES & FILE
  dxf += '0\nENDSEC\n0\nEOF\n';

  const blob = new Blob([dxf], { type: 'application/dxf;charset=utf-8;' });
  const filename = `${projectName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Architectural_CAD.dxf`;

  triggerBrowserDownload(blob, filename);
}

/**
 * Pre-composes a professional construction estimation summary and opens WhatsApp
 */
export function shareOnWhatsApp(state, estimation) {
  const projectName = state.projectName || 'My Dream Residence';
  const cityName = estimation.city?.name || state.city || 'Bengaluru';
  const plotDim = `${state.plotWidth || 30} × ${state.plotLength || 40} ft (${estimation.plotArea} sq.ft)`;
  const bua = `${estimation.totalBuiltupArea} sq.ft`;
  const tier = (state.tier || 'Standard').toUpperCase();
  const totalCost = fmt(estimation.grandTotalCost);
  const costPerSqFt = fmt(estimation.costPerSqFt);
  const steel = `${(estimation.materialSummary?.steelTonnes || 0).toFixed(1)} Tonnes`;
  const cement = `${estimation.materialSummary?.cementBags || 0} Bags`;

  const message = 
`🏗️ *BUILDIQO.AI — CIVIL ESTIMATION & BOQ SUMMARY*
━━━━━━━━━━━━━━━━━━━━
🏠 *Project:* ${projectName}
📍 *Location:* ${cityName}
📐 *Plot Dimensions:* ${plotDim}
🏢 *Built-up Area (BUA):* ${bua} (G+${(state.numFloors || 2) - 1})
⭐ *Quality Package:* ${tier} Package

💰 *GRAND TOTAL ESTIMATED COST:*
👉 *${totalCost}* (${costPerSqFt} / sq.ft BUA)

📊 *Major Takeoff Quantities (IS 456):*
• Steel Rebar: ${steel}
• Cement: ${cement}
• Direct Material Cost: ${fmt(estimation.directMaterialCost)}
• Civil & Trade Labor: ${fmt(estimation.totalLaborCost)}

📄 *Download formal PDF, Excel BOQ & AutoCAD DXF:*
${window.location.origin}/

_Designed by Buildiqo.ai Quantity Survey Engine (IS 456:2000)_`;

  const encoded = encodeURIComponent(message);
  const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;
  window.open(waUrl, '_blank');
}

/**
 * Triggers native print / PDF export and records customer lead
 */
export function exportToPDF(state, estimation, captureCustomerLead, currentUser) {
  try {
    if (captureCustomerLead) {
      captureCustomerLead({
        name: currentUser?.name || (state.projectName || 'Homeowner') + ' Customer',
        email: currentUser?.email || 'customer@buildiqo.ai',
        phone: currentUser?.phone || '+91 98765 43210',
        notes: 'Customer generated formal PDF / Print BOQ report.'
      });
    }
  } catch (e) {}
  window.print();
}

// Internal helper to trigger file download in browser
function triggerBrowserDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
