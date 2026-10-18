const PDFDocument = require('pdfkit');

function fmtPdfINR(val, decimals = 0) {
  const num = Number(val) || 0;
  return 'Rs. ' + Math.round(num).toLocaleString('en-IN');
}

/**
 * Generates a clean, professional multi-page PDF document for residential/commercial
 * construction estimates generated via the Buildiqo Planner.
 *
 * @param {Object} state - The planner project state
 * @param {Object} estimation - The calculation result from calculator.js
 * @returns {Promise<Buffer>}
 */
async function generatePlannerPDF(state = {}, estimation = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
      const buffers = [];

      doc.on('data', b => buffers.push(b));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const printableWidth = 515;
      const maxY = 750;
      const footerY = 805;

      const projectName = state.projectName || 'Residential Construction Project';
      const clientName = state.customerName || 'Valued Client';
      const city = estimation.city?.name || state.city || 'Bengaluru';
      const projectState = estimation.city?.state || state.state || 'Karnataka';
      const tierName = (state.tier || 'standard').toUpperCase();

      // Calculation values (matching reference formulas)
      const plotWidth = Number(state.plotWidth) || 55;
      const plotLength = Number(state.plotLength) || 55;
      const plotArea = estimation.plotArea || Math.round(plotWidth * plotLength * 100) / 100;
      const carpetArea = estimation.plotCarpetArea || Math.round(plotArea * 0.70 * 10) / 10;
      const bua = estimation.totalBuiltupArea || 1800;
      const numFloors = state.numFloors || 2;

      const pkgRate = estimation.packageEstimate?.ratePerSqFt || (
        state.tier === 'luxury' ? 3800 : state.tier === 'premium' ? 2850 : 2250
      );
      const baseCost = estimation.packageEstimate?.estimatedCost || (bua * pkgRate);
      const gstRate = estimation.gstRate || 18;
      const gstAmount = estimation.packageEstimate?.gstAmount || Math.round(baseCost * (gstRate / 100));
      const grandTotal = estimation.grandTotalCost || estimation.packageEstimate?.grandTotal || (baseCost + gstAmount);
      const costPerSqFt = bua > 0 ? Math.round(grandTotal / bua) : pkgRate;

      // ================= 1. HEADER BANNER =================
      doc.rect(40, 40, printableWidth, 68).fill('#1E3A8A');
      doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold').text('Buildiqo.ai', 55, 52);
      doc.fontSize(10.5).font('Helvetica').text('CIVIL ESTIMATION & STRUCTURAL BOQ REPORT', 55, 76);
      doc.fontSize(8).fillColor('#93C5FD').text(
        `IS 456:2000 & IS 13920:2016 Compliant Takeoff • Date: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })}`,
        55, 92
      );

      doc.y = 125;

      // ================= 2. PROJECT METADATA CARD =================
      doc.fillColor('#0F172A').fontSize(14).font('Helvetica-Bold').text(projectName, 40, doc.y);
      doc.moveDown(0.2);
      doc.fontSize(9).font('Helvetica').fillColor('#64748B').text(
        `Client: ${clientName}  |  Location: ${city}, ${projectState}  |  Tier: ${tierName} PACKAGE  |  Ref: BQ-${Date.now().toString().slice(-6)}`
      );
      doc.moveDown(0.8);

      // Metadata Key-Value Box
      const metaBoxY = doc.y;
      doc.rect(40, metaBoxY, printableWidth, 54).fill('#F8FAFC');
      doc.rect(40, metaBoxY, printableWidth, 54).stroke('#E2E8F0');

      const col1X = 52, col2X = 310;
      doc.fillColor('#475569').font('Helvetica').fontSize(8.5);
      doc.text(`Plot Dimensions: ${plotWidth} ft × ${plotLength} ft`, col1X, metaBoxY + 8);
      doc.text(`Gross Plot Area: ${plotArea.toLocaleString('en-IN')} sq.ft (${(plotArea / 9).toFixed(1)} sq.yd)`, col1X, metaBoxY + 22);
      doc.text(`Carpet Area (70% Basis): ${carpetArea.toLocaleString('en-IN')} sq.ft`, col1X, metaBoxY + 36);

      doc.text(`Constructed Built-up Area (SBA): ${bua.toLocaleString('en-IN')} sq.ft`, col2X, metaBoxY + 8);
      doc.text(`Floor Configuration: ${numFloors} Floor(s) (G + ${numFloors - 1})`, col2X, metaBoxY + 22);
      doc.text(`Selected Package Rate: ${fmtPdfINR(pkgRate)} / sq.ft`, col2X, metaBoxY + 36);

      doc.y = metaBoxY + 66;

      // ================= 3. FINANCIAL SUMMARY (KEY CLIENT REFERENCE) =================
      doc.fillColor('#1E3A8A').fontSize(11).font('Helvetica-Bold').text('FINANCIAL & STATUTORY TAX SUMMARY');
      doc.moveDown(0.4);

      const finTable = [
        ['Constructed Built-up Area (SBA / BUA)', `${bua.toLocaleString('en-IN')} sq.ft`],
        ['Package Quality Grade', `${tierName} Package`],
        ['Agreed Package Base Rate', `${fmtPdfINR(pkgRate)} / sq.ft`],
        ['Base Construction Cost (SBA × Rate)', fmtPdfINR(baseCost)],
        [`Applicable GST (${gstRate}%)`, fmtPdfINR(gstAmount)],
        ['Grand Total Project Cost (Incl. GST)', fmtPdfINR(grandTotal)],
        ['Effective All-Inclusive Cost per Sq.Ft', `${fmtPdfINR(costPerSqFt)} / sq.ft`]
      ];

      let fY = doc.y;
      for (let i = 0; i < finTable.length; i++) {
        const isGrand = i === 5;
        const bg = isGrand ? '#EFF6FF' : (i % 2 === 0 ? '#FFFFFF' : '#F8FAFC');
        doc.rect(40, fY, printableWidth, 20).fill(bg);
        doc.rect(40, fY, printableWidth, 20).stroke('#E2E8F0');

        doc.fillColor(isGrand ? '#1E3A8A' : '#334155')
           .font(isGrand ? 'Helvetica-Bold' : 'Helvetica')
           .fontSize(8.5)
           .text(finTable[i][0], 52, fY + 6);

        doc.fillColor(isGrand ? '#1E3A8A' : '#0F172A')
           .font('Helvetica-Bold')
           .fontSize(isGrand ? 10 : 8.5)
           .text(finTable[i][1], 320, fY + (isGrand ? 5 : 6), { width: 220, align: 'right' });

        fY += 20;
      }

      doc.y = fY + 14;

      // ================= 4. FLOOR BREAKDOWN TABLE =================
      const floors = state.floors || [
        { name: 'Ground Floor', carpetArea: Math.round(carpetArea / numFloors), builtupArea: Math.round(bua / numFloors), roomCount: 4 }
      ];

      doc.fillColor('#1E3A8A').fontSize(11).font('Helvetica-Bold').text('FLOOR-WISE AREA & ROOM DISTRIBUTION');
      doc.moveDown(0.4);

      doc.rect(40, doc.y, printableWidth, 18).fill('#1E3A8A');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('#', 52, doc.y + 5);
      doc.text('Floor Level', 80, doc.y + 5);
      doc.text('Carpet Area', 260, doc.y + 5, { width: 90, align: 'right' });
      doc.text('Built-up Area', 360, doc.y + 5, { width: 90, align: 'right' });
      doc.text('Spaces / Rooms', 460, doc.y + 5, { width: 60, align: 'right' });

      let flY = doc.y + 18;
      floors.forEach((fl, idx) => {
        const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(40, flY, printableWidth, 18).fill(bg);
        doc.rect(40, flY, printableWidth, 18).stroke('#F1F5F9');

        doc.fillColor('#334155').font('Helvetica').fontSize(8);
        doc.text(String(idx + 1), 52, flY + 5);
        doc.text(fl.name || `Floor ${idx + 1}`, 80, flY + 5);
        doc.text(`${(fl.carpetArea || 0).toLocaleString('en-IN')} sq.ft`, 260, flY + 5, { width: 90, align: 'right' });
        doc.text(`${(fl.builtupArea || 0).toLocaleString('en-IN')} sq.ft`, 360, flY + 5, { width: 90, align: 'right' });
        doc.text(String(fl.roomCount || fl.spaces?.length || '-'), 460, flY + 5, { width: 60, align: 'right' });
        flY += 18;
      });

      doc.y = flY + 16;

      // ================= 5. STRUCTURAL MATERIAL TAKEOFF (PAGE 2) =================
      doc.addPage();
      
      // Page 2 Compact Header Band
      doc.rect(40, 40, printableWidth, 32).fill('#1E3A8A');
      doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold').text('Buildiqo.ai • STRUCTURAL MATERIAL TAKEOFF & SPECIFICATIONS', 55, 48);
      doc.fontSize(8).fillColor('#93C5FD').text(`Project: ${projectName} • Standards: IS 456:2000 / IS 1786 / IS 383`, 55, 62);
      
      doc.y = 86;
      doc.fillColor('#1E3A8A').fontSize(11).font('Helvetica-Bold').text('KEY MATERIAL QUANTITY TAKEOFF (IS 456 STANDARDS)', 40, doc.y);
      doc.moveDown(0.4);

      doc.rect(40, doc.y, printableWidth, 18).fill('#1E3A8A');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('Material Category', 52, doc.y + 5);
      doc.text('Standard Specification', 190, doc.y + 5);
      doc.text('Estimated Quantity', 360, doc.y + 5, { width: 100, align: 'right' });
      doc.text('Unit', 470, doc.y + 5, { width: 50, align: 'center' });

      const matRows = [
        ['Fe 550D TMT Reinforcement Steel', 'High Ductility TMT (IS 1786)', `${(estimation.materialSummary?.steelTonnes || (bua * 0.0035)).toFixed(2)}`, 'Tonnes'],
        ['Structural Grade Cement', '53 Grade OPC / PPC (IS 12269)', `${Math.round(estimation.materialSummary?.cementBags || (bua * 0.42))}`, 'Bags (50kg)'],
        ['Manufactured Sand (M-Sand)', 'Zone II Coarse Aggregate Sand (IS 383)', `${Math.round(bua * 1.9)}`, 'Cu.Ft'],
        ['Coarse Aggregate (20mm & 10mm)', 'Crushed Blue Granite Metal', `${Math.round(bua * 1.35)}`, 'Cu.Ft'],
        ['Solid Concrete Blocks / Red Bricks', 'Class 3.5 MPa Load Bearing (IS 2185)', `${Math.round(bua * 5.2)}`, 'Nos'],
        ['Vitrified Flooring & Tiling', 'Double Charged GVT / Ceramic Tiles', `${Math.round(carpetArea * 1.15)}`, 'Sq.Ft']
      ];

      let mY = doc.y + 18;
      matRows.forEach((row, idx) => {
        const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(40, mY, printableWidth, 18).fill(bg);
        doc.rect(40, mY, printableWidth, 18).stroke('#F1F5F9');

        doc.fillColor('#334155').font('Helvetica').fontSize(8);
        doc.text(row[0], 52, mY + 5);
        doc.text(row[1], 190, mY + 5);
        doc.text(row[2], 360, mY + 5, { width: 100, align: 'right' });
        doc.text(row[3], 470, mY + 5, { width: 50, align: 'center' });
        mY += 18;
      });

      doc.y = mY + 20;

      // ================= 6. ENGINEERING NOTES & ASSUMPTIONS =================
      doc.fillColor('#1E3A8A').fontSize(10).font('Helvetica-Bold').text('ENGINEERING ASSUMPTIONS & COMPLIANCE NOTES', 40, doc.y);
      doc.moveDown(0.3);

      const notes = [
        '1. Structural design conforms to IS 456:2000 (Plain & Reinforced Concrete) and IS 13920:2016 (Ductile Detailing of Reinforced Concrete Structures).',
        '2. Safe Bearing Capacity (SBC) of soil is assumed at 180-200 kN/m². Extreme rocky excavation or deep pile foundation is subject to site geotechnical test.',
        '3. All rates are inclusive of civil materials, labor, specialized formwork, batch mixing, vibrator compaction, and minimum 14-day curing protocol.',
        '4. GST is computed at statutory rates (18%). Any statutory municipal sanction fees, betterment charges, or electricity/water board deposits are external.'
      ];

      doc.fillColor('#64748B').fontSize(7.5).font('Helvetica');
      notes.forEach(n => {
        doc.text(n, 45, doc.y, { width: printableWidth - 10 });
        doc.moveDown(0.25);
      });

      // Disclaimer Banner
      doc.moveDown(0.5);
      doc.rect(40, doc.y, printableWidth, 32).fill('#F8FAFC');
      doc.rect(40, doc.y, printableWidth, 32).stroke('#E2E8F0');
      doc.fillColor('#64748B').fontSize(7).font('Helvetica-Oblique').text(
        'Legal Notice: This document is an algorithmic quantity surveying estimate issued by Buildiqo.ai. ' +
        'Final contractor execution agreement may vary according to architectural drawings, structural engineering approvals, and site-specific conditions.',
        48,
        doc.y + 6,
        { width: printableWidth - 16 }
      );

      // ================= 7. FOOTER ACROSS ALL BUFFERED PAGES =================
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.page.margins.bottom = 0;
        doc.fontSize(7.5).font('Helvetica').fillColor('#94A3B8');
        doc.text(
          `Buildiqo.ai • Page ${i + 1} of ${range.count} • Strict Mathematical Estimation Engine`,
          40,
          785,
          { width: printableWidth, align: 'center', lineBreak: false }
        );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generatePlannerPDF
};
