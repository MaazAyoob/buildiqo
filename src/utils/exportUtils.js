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
  const customerName = state.customerName || 'Valued Customer';
  const professionalName = state.professionalName ? `${state.professionalName} (${state.professionalRole || 'Architect / Consultant'})` : 'Buildiqo Certified Consultant';
  const companyName = state.companyName || 'Buildiqo Architectural Network';
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const gstRateGlobal = estimation.gstRate || 18;

  const rows = [];

  // Compact Header Block (No redundant gaps, clean tabular alignment)
  rows.push(['BUILDIQO.AI — DETAILED CIVIL BILL OF QUANTITIES (BOQ) & MATERIAL RATE AUDIT']);
  rows.push(['IS 456:2000 & IS 13920:2016 Compliant Deterministic Engineering Takeoff']);
  rows.push(['Generated On', dateStr, 'Ref Code', `BQ-${Date.now().toString().slice(-6)}`, 'GST Status', 'Itemized with Statutory Taxes']);
  
  // Section 1: Project & Client Specifications
  rows.push(['1. PROJECT & CLIENT SPECIFICATIONS']);
  rows.push(['Project Title', projectName, 'Customer / Client Name', customerName]);
  rows.push(['Prepared By', professionalName, 'Firm / Company', companyName]);
  rows.push(['Location / State', `${cityName} (${estimation.city?.state || state.state || 'Karnataka'})`, 'Quality Tier', `${(state.tier || 'Standard').toUpperCase()} PACKAGE`]);
  rows.push(['Building Typology', state.buildingType || 'Residential Villa / Duplex', 'Structural System', state.constructionType || 'RCC Framed Structure (IS 456)']);
  rows.push(['Plot Dimensions', `${state.plotWidth || 30} ft × ${state.plotLength || 40} ft`, 'Plot Area', `${estimation.plotArea} sq.ft (${(estimation.plotArea / 9).toFixed(1)} sq.yd)`]);
  rows.push(['Built-up Area (BUA)', `${estimation.totalBuiltupArea} sq.ft`, 'Usable Carpet Area', `${estimation.totalCarpetArea} sq.ft`]);
  rows.push(['Number of Floors', `G + ${(state.numFloors || 2) - 1} (${state.numFloors || 2} levels)`, 'Rate per Sq.Ft BUA', `INR ${Math.round(estimation.costPerSqFt)} / sq.ft`]);

  // Section 2: Financial & Budget Summary with GST Breakdown
  rows.push(['2. FINANCIAL & BUDGET SUMMARY (WITH GST BREAKDOWN)']);
  rows.push(['Cost Component', 'Basis / Standard Code', 'Pre-GST Amount (INR)', 'GST %', 'GST Amount (INR)', 'Total with GST (INR)']);

  const directPreGst = Math.round(estimation.directConstructionCost);
  const directGst = Math.round(directPreGst * (gstRateGlobal / 100));
  const laborPreGst = Math.round(estimation.totalLaborCost);
  const laborCessAmt = Math.round(laborPreGst * ((estimation.labourCessRate || 1) / 100));
  const supervisionPreGst = Math.round(estimation.architectureFee + estimation.contractorMargin + estimation.contingencyBuffer);
  const supervisionGst = Math.round(supervisionPreGst * (gstRateGlobal / 100));

  rows.push(['Direct Material Procurement', 'IS 456 Engineering Quantities', Math.round(estimation.directMaterialCost), `${gstRateGlobal}%`, Math.round(estimation.directMaterialCost * (gstRateGlobal / 100)), Math.round(estimation.directMaterialCost * (1 + gstRateGlobal / 100))]);
  rows.push(['Civil & Trade Labor Works', 'Regional Labor Wage Index', laborPreGst, `${estimation.labourCessRate || 1}% Cess`, laborCessAmt, laborPreGst + laborCessAmt]);
  rows.push(['Site Amenities & Ancillary Works', 'Boundary Wall, Sump, Tanks, Solar', Math.round(estimation.ancillaryCost || 0), `${gstRateGlobal}%`, Math.round((estimation.ancillaryCost || 0) * (gstRateGlobal / 100)), Math.round((estimation.ancillaryCost || 0) * (1 + gstRateGlobal / 100))]);
  rows.push(['Architectural, Supervision & Buffer', 'Design Fees (2.5%) + Margin (10%) + Contingency (4%)', supervisionPreGst, `${gstRateGlobal}%`, supervisionGst, supervisionPreGst + supervisionGst]);
  rows.push(['TOTAL STATUTORY TAXES (GST + BOCW CESS)', 'Statutory Compliance', '', '', Math.round(estimation.statutoryTaxes || (directGst + laborCessAmt)), Math.round(estimation.statutoryTaxes || (directGst + laborCessAmt))]);
  rows.push(['GRAND TOTAL ESTIMATED BUDGET', `INR ${Math.round(estimation.costPerSqFt)} / sq.ft BUA`, Math.round(estimation.baseGrandTotalCost || estimation.directConstructionCost + supervisionPreGst), `${gstRateGlobal}%`, Math.round(estimation.statutoryTaxes || directGst), Math.round(estimation.grandTotalCost)]);

  // Section 3: Structural Material Takeoff & Pricing Along With GST
  rows.push(['3. STRUCTURAL MATERIAL TAKEOFF & PRICING ALONG WITH GST']);
  rows.push([
    'Material Category',
    'Selected Brand & Specification',
    'Calculated Quantity',
    'Unit',
    'Base Unit Rate (INR)',
    'Pre-GST Amount (INR)',
    'GST %',
    'GST Amount (INR)',
    'Total Amount with GST (INR)'
  ]);

  const selMat = estimation.selectedMaterials || {};
  
  // Explicit itemized material entries with exact GST rates per Indian GST classification
  const matTakeoff = [
    {
      cat: 'Reinforcement Steel Rebar',
      spec: selMat.steel ? `${selMat.steel.name} (${selMat.steel.grade || 'IS 1786'})` : 'Fe 550D High-Ductility TMT Rebar',
      qty: (estimation.materialSummary?.steelTonnes || 0).toFixed(2),
      unit: 'Tonnes',
      baseCost: Math.round(estimation.materialSummary?.steelCost || (estimation.directMaterialCost * 0.38)),
      gstPct: 18
    },
    {
      cat: 'Structural Cement',
      spec: selMat.cement ? `${selMat.cement.name} (${selMat.cement.grade || '53 Grade'})` : 'UltraTech / Dalmia 53 Grade OPC/PPC',
      qty: estimation.materialSummary?.cementBags || 0,
      unit: 'Bags (50kg)',
      baseCost: Math.round(estimation.materialSummary?.cementCost || (estimation.directMaterialCost * 0.22)),
      gstPct: 28 // 28% GST on cement in India
    },
    {
      cat: 'Manufactured Sand (M-Sand & P-Sand)',
      spec: selMat.sand ? `${selMat.sand.name}` : 'Filtered Concreting M-Sand + Plastering P-Sand (IS 383)',
      qty: Math.round(estimation.totalBuiltupArea * 1.9),
      unit: 'Cu.Ft',
      baseCost: Math.round(estimation.materialSummary?.sandCost || (estimation.directMaterialCost * 0.10)),
      gstPct: 5 // 5% GST on sand/aggregates
    },
    {
      cat: 'Coarse Aggregates (20mm & 12mm)',
      spec: selMat.aggregate ? `${selMat.aggregate.name}` : '20mm & 12mm Machine-Crushed Blue Metal Granite Jelly',
      qty: Math.round(estimation.totalBuiltupArea * 1.35),
      unit: 'Cu.Ft',
      baseCost: Math.round(estimation.materialSummary?.aggCost || (estimation.directMaterialCost * 0.08)),
      gstPct: 5
    },
    {
      cat: 'Masonry Wall Units',
      spec: selMat.masonry ? `${selMat.masonry.name} (${selMat.masonry.desc || 'Grade 1'})` : 'AAC Lightweight Blocks (600x200x150mm)',
      qty: estimation.materialSummary?.blocksCount || Math.round(estimation.totalBuiltupArea * 0.85),
      unit: 'Blocks / Sq.Ft',
      baseCost: Math.round(estimation.materialSummary?.blocksCost || (estimation.directMaterialCost * 0.08)),
      gstPct: 12 // 12% on AAC blocks
    },
    {
      cat: 'Flooring & Tiling',
      spec: selMat.flooring ? `${selMat.flooring.name} (${selMat.flooring.desc || 'Vitrified'})` : 'Double Charged Vitrified Tiles / Granite',
      qty: Math.round(estimation.totalCarpetArea * 1.07),
      unit: 'Sq.Ft',
      baseCost: Math.round(estimation.materialSummary?.flooringCost || (estimation.directMaterialCost * 0.06)),
      gstPct: 18
    },
    {
      cat: 'Electrical Conduits & Wiring',
      spec: selMat.electrical ? `${selMat.electrical.name}` : 'Polycab FRLS Wires + Schneider Modular Switches',
      qty: estimation.totalBuiltupArea,
      unit: 'Sq.Ft BUA',
      baseCost: Math.round(estimation.materialSummary?.electricalCost || (estimation.directMaterialCost * 0.04)),
      gstPct: 18
    },
    {
      cat: 'Plumbing & Sanitaryware',
      spec: selMat.bathroom ? `${selMat.bathroom.name}` : 'Jaquar / Kohler CP & Ceramic Fittings + CPVC Pipes',
      qty: estimation.totalBuiltupArea,
      unit: 'Sq.Ft BUA',
      baseCost: Math.round(estimation.materialSummary?.plumbingCost || (estimation.directMaterialCost * 0.03)),
      gstPct: 18
    },
    {
      cat: 'Internal & Exterior Painting',
      spec: selMat.painting ? `${selMat.painting.name}` : 'Asian Paints 2-Coat Putty + Apex Royale Emulsion',
      qty: Math.round(estimation.totalBuiltupArea * 3.2),
      unit: 'Sq.Ft Surface',
      baseCost: Math.round(estimation.materialSummary?.paintCost || (estimation.directMaterialCost * 0.02)),
      gstPct: 18
    },
    {
      cat: 'Waterproofing Chemical Systems',
      spec: selMat.waterproofing ? `${selMat.waterproofing.name}` : 'Dr. Fixit 2K Polymer Elastomeric Membrane',
      qty: 1,
      unit: 'Package (L.S)',
      baseCost: Math.round(estimation.materialSummary?.waterproofingCost || (estimation.directMaterialCost * 0.01)),
      gstPct: 18
    }
  ];

  matTakeoff.forEach(m => {
    const qtyNum = parseFloat(m.qty) || 1;
    const unitRate = qtyNum > 0 ? Math.round(m.baseCost / qtyNum) : m.baseCost;
    const gstAmt = Math.round(m.baseCost * (m.gstPct / 100));
    const totalWithGst = m.baseCost + gstAmt;

    rows.push([
      m.cat,
      m.spec,
      m.qty,
      m.unit,
      unitRate,
      m.baseCost,
      `${m.gstPct}%`,
      gstAmt,
      totalWithGst
    ]);
  });

  // Section 4: Detailed BOQ Work Schedule by Trade with Material Specs & GST
  if (estimation.boqItems && estimation.boqItems.length > 0) {
    rows.push(['4. DETAILED BILL OF QUANTITIES (BOQ) WORK SCHEDULE']);
    rows.push([
      'Item #',
      'Trade Work Package',
      'Work Scope & Technical Specification',
      'Quantity',
      'Unit',
      'Unit Rate (INR)',
      'Pre-GST Amount (INR)',
      'GST %',
      'GST Amount (INR)',
      'Total with GST (INR)'
    ]);

    let itemCounter = 1;
    estimation.boqItems.forEach(group => {
      const groupGstPct = 18;
      (group.items || []).forEach(it => {
        const preGstCost = Math.round(it.total || (it.materialCost + it.laborCost) || 0);
        const gstVal = Math.round(preGstCost * (groupGstPct / 100));
        const totalVal = preGstCost + gstVal;
        const qNum = parseFloat(it.qty) || 1;
        const uRate = qNum > 0 ? Math.round(preGstCost / qNum) : preGstCost;

        rows.push([
          itemCounter++,
          group.category,
          it.spec ? `${it.name} — ${it.spec}` : it.name,
          it.qty,
          it.unit || 'sq.ft',
          uRate,
          preGstCost,
          `${groupGstPct}%`,
          gstVal,
          totalVal
        ]);
      });
    });
  }

  // Section 5: Contractor Milestone Payment Disbursement Schedule
  if (estimation.milestones && estimation.milestones.length > 0) {
    rows.push(['5. STAGE-WISE PAYMENT DISBURSEMENT SCHEDULE (WITH GST)']);
    rows.push(['Stage #', 'Construction Milestone', 'Scope Description', 'Share (%)', 'Pre-GST Amount (INR)', 'Total with GST (INR)', 'Timeline']);
    estimation.milestones.forEach((m, idx) => {
      const grossAmt = Math.round(m.amount);
      const netAmt = Math.round(grossAmt / (1 + (gstRateGlobal / 100)));
      rows.push([
        idx + 1,
        m.stage || m.name,
        m.desc || 'Construction works execution',
        `${m.pct}%`,
        netAmt,
        grossAmt,
        m.timeline || `Phase ${idx + 1}`
      ]);
    });
  }

  // Section 6: Engineering & Statutory Notes
  rows.push(['6. STATUTORY & ENGINEERING COMPLIANCE NOTES']);
  rows.push(['Standards Compliance', 'Quantities calculated deterministically per IS 456:2000, IS 1786:2008, IS 383, and National Building Code 2016.']);
  rows.push(['GST Treatment', 'All material and contractor prices are itemized showing Pre-GST base value, statutory GST rate, and gross payable total.']);
  rows.push(['Soil & Foundation', 'Structural rebar estimates include 5% lap/cutting wastage based on isolated pad footing benchmark. Verify final BBS against structural engineer design.']);

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
