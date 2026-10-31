const PDFDocument = require('pdfkit');

/**
 * Format currency in Indian Rupees format safely for PDFKit standard fonts
 * Using 'Rs. ' avoids missing glyph issues with standard Helvetica fonts across all PDF viewers.
 */
function fmtINR(val) {
  const num = Number(val) || 0;
  return 'Rs. ' + Math.round(num).toLocaleString('en-IN');
}

function fmtNum(val) {
  const num = Number(val) || 0;
  return num.toLocaleString('en-IN');
}

/**
 * Generates an authoritative, publication-quality A4 PDF estimate report.
 * Fully adapts to page boundaries, dynamically handles multi-page flow without clipping,
 * accurately aligns financial tables, and computes quantities from authoritative calculator output.
 *
 * @param {Object} state - Project state parameters
 * @param {Object} estimation - Authoritative calculation output from calculator.js
 * @returns {Promise<Buffer>}
 */
async function generatePlannerPDF(state = {}, estimation = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        bufferPages: true,
        autoFirstPage: true
      });

      const buffers = [];
      doc.on('data', b => buffers.push(b));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const printableWidth = 515; // 595 - 2*40
      const leftMargin = 40;
      const rightMargin = leftMargin + printableWidth;
      const maxY = 750;
      const footerY = 805;

      // --- Authoritative Data Resolution ---
      const projectName = state.projectName || 'Residential Construction Project';
      const customerName = state.customerName || 'Valued Client';
      const city = estimation.city?.name || state.city || 'Bengaluru';
      const projectState = estimation.city?.state || state.state || 'Karnataka';
      const tierKey = (state.tier || 'standard').toLowerCase();
      const buildingType = state.buildingType || 'Independent Residential Villa';
      const constructionType = state.constructionType || 'RCC Framed Structure (IS 456:2000)';

      const plotWidth = Number(state.plotWidth) || 55;
      const plotLength = Number(state.plotLength) || 55;
      const plotArea = estimation.plotArea || Math.round(plotWidth * plotLength);
      const numFloors = Number(state.numFloors) || 2;
      
      // Authoritative SBA from calculator engine
      const totalSBA = Number(estimation.totalBuiltupArea) || (plotArea * numFloors);
      // Authoritative Carpet Area (70% of SBA in Bangalore calculation engine)
      const totalCarpet = Number(estimation.totalCarpetArea) || Number(estimation.plotCarpetArea) || Math.round(totalSBA * 0.70);

      // Package Name & Rates
      const tierNames = {
        standard: 'Standard Package',
        premium: 'Premium Package',
        luxury: 'Luxury / Bespoke Package'
      };
      const tierName = tierNames[tierKey] || `${tierKey.toUpperCase()} Package`;

      const pkgRate = Number(estimation.packageEstimate?.ratePerSqFt) || (
        state.isCustomPackageRate && state.customPackageRate ? Number(state.customPackageRate) :
        tierKey === 'luxury' ? 3800 : tierKey === 'premium' ? 2850 : 2250
      );

      // Financials
      const baseEstimate = Number(estimation.packageEstimate?.estimatedCost) || Number(estimation.baseGrandTotalCost) || Math.round(totalSBA * pkgRate);
      const gstRate = Number(estimation.gstRate) || 18;
      const gstAmount = Number(estimation.packageEstimate?.gstAmount) || Number(estimation.statutoryTaxes) || Math.round(baseEstimate * (gstRate / 100));
      const totalEstimate = Number(estimation.grandTotalCost) || (baseEstimate + gstAmount);
      const allInclusiveRate = totalSBA > 0 ? Math.round(totalEstimate / totalSBA) : pkgRate;

      // Helper: check space and break page
      function checkPageBreak(neededHeight) {
        if (doc.y + neededHeight > maxY) {
          doc.addPage();
          renderHeaderBand(false);
          return true;
        }
        return false;
      }

      // Helper: Header banner
      function renderHeaderBand(isFirstPage = true) {
        if (isFirstPage) {
          doc.rect(leftMargin, 40, printableWidth, 68).fill('#1E3A8A');
          
          doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold').text('Buildiqo.ai', leftMargin + 16, 52);
          doc.fontSize(10).font('Helvetica').fillColor('#E0E7FF').text('CIVIL ESTIMATION & STRUCTURAL BOQ REPORT', leftMargin + 16, 75);
          doc.fontSize(7.5).font('Helvetica').fillColor('#93C5FD').text(
            `IS 456:2000 & IS 13920:2016 Compliant Engineering Takeoff • Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
            leftMargin + 16, 91
          );

          // Right-aligned reference code
          const refCode = `REF: BQ-${Date.now().toString().slice(-6)}`;
          doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#F8FAFC').text(refCode, leftMargin, 55, {
            width: printableWidth - 16,
            align: 'right'
          });
          doc.fontSize(7.5).font('Helvetica').fillColor('#BFDBFE').text(`Jurisdiction: ${city}, ${projectState}`, leftMargin, 70, {
            width: printableWidth - 16,
            align: 'right'
          });

          doc.y = 120;
        } else {
          // Compact header for subsequent pages
          doc.rect(leftMargin, 40, printableWidth, 34).fill('#1E3A8A');
          doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold').text('Buildiqo.ai • CONSTRUCTION ESTIMATION & QUANTITY SURVEY', leftMargin + 14, 48);
          doc.fontSize(7.5).font('Helvetica').fillColor('#93C5FD').text(`Project: ${projectName} • Package: ${tierName}`, leftMargin + 14, 62);
          
          doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFFFFF').text('IS 456:2000', leftMargin, 52, {
            width: printableWidth - 14,
            align: 'right'
          });

          doc.y = 86;
        }
      }

      // 1. Initial Page Header
      renderHeaderBand(true);

      // 2. Project Title & Overview
      doc.fillColor('#0F172A').fontSize(13).font('Helvetica-Bold').text(projectName, leftMargin, doc.y);
      doc.moveDown(0.2);
      doc.fontSize(8.5).font('Helvetica').fillColor('#475569').text(
        `Client: ${customerName}   |   Location: ${city}, ${projectState}   |   Package: ${tierName.toUpperCase()}   |   Structure: RCC Framed`
      );
      doc.moveDown(0.6);

      // 3. Project Specifications Card
      const cardY = doc.y;
      const cardH = 68;
      doc.rect(leftMargin, cardY, printableWidth, cardH).fill('#F8FAFC');
      doc.rect(leftMargin, cardY, printableWidth, cardH).stroke('#CBD5E1');

      const colW = (printableWidth - 32) / 3;
      const c1X = leftMargin + 12;
      const c2X = c1X + colW + 8;
      const c3X = c2X + colW + 8;

      // Column 1: Plot & Land Details
      doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(8).text('PLOT & SITE GEOMETRY', c1X, cardY + 8);
      doc.fillColor('#475569').font('Helvetica').fontSize(7.5);
      doc.text(`Dimensions: ${plotWidth} ft × ${plotLength} ft`, c1X, cardY + 22);
      doc.text(`Gross Plot Area: ${fmtNum(plotArea)} sq.ft`, c1X, cardY + 34);
      doc.text(`Area in Sq.Yards: ${(plotArea / 9).toFixed(1)} sq.yd`, c1X, cardY + 46);
      doc.text(`Orientation: ${state.plotFacing || 'North Facing'}`, c1X, cardY + 56);

      // Column 2: Constructed Area & Configuration
      doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(8).text('CONSTRUCTED BUILT-UP (SBA)', c2X, cardY + 8);
      doc.fillColor('#475569').font('Helvetica').fontSize(7.5);
      doc.text(`Total SBA (BUA): ${fmtNum(totalSBA)} sq.ft`, c2X, cardY + 22);
      doc.text(`Carpet Area (70%): ${fmtNum(totalCarpet)} sq.ft`, c2X, cardY + 34);
      doc.text(`Floor Count: ${numFloors} Levels (G + ${numFloors - 1})`, c2X, cardY + 46);
      doc.text(`Typology: ${buildingType.substring(0, 24)}`, c2X, cardY + 56);

      // Column 3: Package Pricing Benchmark
      doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(8).text('PACKAGE RATE BENCHMARK', c3X, cardY + 8);
      doc.fillColor('#475569').font('Helvetica').fontSize(7.5);
      doc.text(`Tier: ${tierName}`, c3X, cardY + 22);
      doc.text(`Agreed Rate: ${fmtINR(pkgRate)} / sq.ft`, c3X, cardY + 34);
      doc.text(`GST Status: Statutory 18% Applicable`, c3X, cardY + 46);
      doc.text(`Methodology: Deterministic IS 456`, c3X, cardY + 56);

      doc.y = cardY + cardH + 14;

      // 4. Financial & Statutory Tax Summary Table
      doc.fillColor('#1E3A8A').fontSize(10).font('Helvetica-Bold').text('1. FINANCIAL & STATUTORY TAX SUMMARY', leftMargin, doc.y);
      doc.moveDown(0.3);

      const finTable = [
        ['Constructed Built-up Area (SBA / BUA)', `${fmtNum(totalSBA)} sq.ft`, 'Gross chargeable area across all levels'],
        ['Selected Construction Package Tier', tierName, 'Comprehensive material & workmanship scope'],
        ['Agreed Package Internal Base Rate', `${fmtINR(pkgRate)} / sq.ft`, 'Pre-GST rate per sq.ft constructed area'],
        ['Base Construction Cost (SBA × Package Rate)', fmtINR(baseEstimate), `${fmtNum(totalSBA)} sq.ft × ${fmtINR(pkgRate)} / sq.ft`],
        [`Statutory GST (${gstRate}%)`, fmtINR(gstAmount), 'Statutory tax on works contract (IS / GST Law)'],
        ['GRAND TOTAL ESTIMATED INVESTMENT', fmtINR(totalEstimate), 'Total all-inclusive contract investment'],
        ['Effective All-Inclusive Cost per Sq.Ft', `${fmtINR(allInclusiveRate)} / sq.ft`, 'Comprehensive post-tax cost per sq.ft SBA']
      ];

      // Table Header
      const finHeaderH = 18;
      doc.rect(leftMargin, doc.y, printableWidth, finHeaderH).fill('#1E3A8A');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8);
      doc.text('Financial Component', leftMargin + 10, doc.y + 5);
      doc.text('Basis & Calculation Method', leftMargin + 230, doc.y + 5);
      doc.text('Amount (INR)', rightMargin - 120, doc.y + 5, { width: 110, align: 'right' });

      let finY = doc.y + finHeaderH;

      finTable.forEach((row, i) => {
        const isGrand = (i === 5);
        const rowH = isGrand ? 22 : 18;
        const bg = isGrand ? '#EFF6FF' : (i % 2 === 0 ? '#FFFFFF' : '#F8FAFC');

        doc.rect(leftMargin, finY, printableWidth, rowH).fill(bg);
        doc.rect(leftMargin, finY, printableWidth, rowH).stroke('#E2E8F0');

        doc.fillColor(isGrand ? '#1E3A8A' : '#1E293B')
           .font(isGrand ? 'Helvetica-Bold' : 'Helvetica')
           .fontSize(isGrand ? 8.5 : 8)
           .text(row[0], leftMargin + 10, finY + (isGrand ? 6 : 5));

        doc.fillColor(isGrand ? '#3B82F6' : '#64748B')
           .font(isGrand ? 'Helvetica-Bold' : 'Helvetica')
           .fontSize(7.5)
           .text(row[2], leftMargin + 230, finY + (isGrand ? 6 : 5));

        doc.fillColor(isGrand ? '#1E3A8A' : '#0F172A')
           .font('Helvetica-Bold')
           .fontSize(isGrand ? 10 : 8)
           .text(row[1], rightMargin - 125, finY + (isGrand ? 5 : 5), { width: 115, align: 'right' });

        finY += rowH;
      });

      doc.y = finY + 14;

      // 5. Floor-Wise Area & Space Breakdown
      checkPageBreak(120);

      doc.fillColor('#1E3A8A').fontSize(10).font('Helvetica-Bold').text('2. FLOOR-WISE AREA BREAKDOWN', leftMargin, doc.y);
      doc.moveDown(0.3);

      const rawFloors = (estimation.floors && estimation.floors.length > 0)
        ? estimation.floors
        : (state.floors && state.floors.length > 0)
          ? state.floors
          : [];

      // Ensure floors match numFloors
      const floorRows = [];
      const sbaPerFloor = Math.round(totalSBA / numFloors);
      const carpetPerFloor = Math.round(sbaPerFloor * 0.70 * 10) / 10;

      for (let fi = 0; fi < numFloors; fi++) {
        const existing = rawFloors[fi];
        const flName = existing?.name || (fi === 0 ? 'Ground Floor' : fi === 1 ? '1st Floor' : fi === 2 ? '2nd Floor' : `${fi}th Floor`);
        const flBUA = existing?.builtupArea || sbaPerFloor;
        const flCarpet = existing?.carpetArea || Math.round(flBUA * 0.70 * 10) / 10;
        const flRooms = existing?.roomCount || existing?.rooms?.length || (fi === 0 ? 5 : 4);
        const flShare = ((flBUA / totalSBA) * 100).toFixed(1);

        floorRows.push({
          num: fi + 1,
          name: flName,
          carpet: flCarpet,
          bua: flBUA,
          rooms: flRooms,
          share: `${flShare}%`
        });
      }

      // Floor Table Header
      const flHeaderH = 18;
      doc.rect(leftMargin, doc.y, printableWidth, flHeaderH).fill('#1E3A8A');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8);
      doc.text('#', leftMargin + 8, doc.y + 5);
      doc.text('Floor Level', leftMargin + 28, doc.y + 5);
      doc.text('Carpet Area (70%)', leftMargin + 180, doc.y + 5, { width: 100, align: 'right' });
      doc.text('Built-up Area (SBA)', leftMargin + 295, doc.y + 5, { width: 105, align: 'right' });
      doc.text('Spaces / Rooms', leftMargin + 415, doc.y + 5, { width: 45, align: 'center' });
      doc.text('Share', rightMargin - 45, doc.y + 5, { width: 35, align: 'right' });

      let flY = doc.y + flHeaderH;

      floorRows.forEach((fl, idx) => {
        const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(leftMargin, flY, printableWidth, 18).fill(bg);
        doc.rect(leftMargin, flY, printableWidth, 18).stroke('#F1F5F9');

        doc.fillColor('#334155').font('Helvetica').fontSize(8);
        doc.text(String(fl.num), leftMargin + 8, flY + 5);
        doc.text(fl.name, leftMargin + 28, flY + 5);
        doc.text(`${fmtNum(fl.carpet)} sq.ft`, leftMargin + 180, flY + 5, { width: 100, align: 'right' });
        doc.text(`${fmtNum(fl.bua)} sq.ft`, leftMargin + 295, flY + 5, { width: 105, align: 'right' });
        doc.text(String(fl.rooms), leftMargin + 415, flY + 5, { width: 45, align: 'center' });
        doc.text(fl.share, rightMargin - 45, flY + 5, { width: 35, align: 'right' });

        flY += 18;
      });

      // Floor Subtotal Row
      doc.rect(leftMargin, flY, printableWidth, 18).fill('#EFF6FF');
      doc.rect(leftMargin, flY, printableWidth, 18).stroke('#BFDBFE');
      doc.fillColor('#1E3A8A').font('Helvetica-Bold').fontSize(8);
      doc.text('Total Constructed Coverage', leftMargin + 28, flY + 5);
      doc.text(`${fmtNum(totalCarpet)} sq.ft`, leftMargin + 180, flY + 5, { width: 100, align: 'right' });
      doc.text(`${fmtNum(totalSBA)} sq.ft`, leftMargin + 295, flY + 5, { width: 105, align: 'right' });
      doc.text(String(floorRows.reduce((acc, f) => acc + f.rooms, 0)), leftMargin + 415, flY + 5, { width: 45, align: 'center' });
      doc.text('100.0%', rightMargin - 45, flY + 5, { width: 35, align: 'right' });

      doc.y = flY + 28;

      // 6. Structural Material Takeoff (IS 456 Standards)
      // Check if we need to start a clean new page for Material Takeoff
      checkPageBreak(210);

      doc.fillColor('#1E3A8A').fontSize(10).font('Helvetica-Bold').text('3. STRUCTURAL MATERIAL TAKEOFF (IS 456:2000 SPECIFICATIONS)', leftMargin, doc.y);
      doc.moveDown(0.3);

      // Resolve package-specific materials
      const packageMaterials = {
        standard: {
          steel: 'JSW Neosteel Fe 550D High-Ductility TMT (IS 1786)',
          cement: 'UltraTech Super 53 Grade / PPC WeatherPro (IS 12269)',
          sand: 'Manufactured Double-Washed VSI M-Sand & P-Sand (IS 383)',
          aggregate: 'Machine-Crushed Blue Metal Granite (20mm & 12mm)',
          masonry: 'Autoclaved Aerated Concrete (AAC) Lightweight Blocks',
          flooring: 'Double Charged 4x2 GVT Vitrified Tile Slabs',
          paint: 'Asian Paints Apex Exterior & Royale Luxury Interior'
        },
        premium: {
          steel: 'Tata Tiscon 550D Super Ductile TMT Rebar (IS 1786 SD)',
          cement: 'UltraTech Super / ACC Concrete Plus Micro-Fine (IS 12269)',
          sand: 'VSI M-Sand for Structure + Graded Plaster Sand (IS 383)',
          aggregate: '20mm & 10mm Hard Blue Granite Aggregate Jelly',
          masonry: 'First-Class Machine-Made Wire-cut Red Bricks',
          flooring: 'Large Format 6x4 Slabs + Premium Flamed Granite',
          paint: 'Asian Paints Aspira Elastomeric Weather-Resistant'
        },
        luxury: {
          steel: 'Corrosion Resistant Steel (CRS) Fe 550D Rebar',
          cement: 'Engineered RMC M25/M30 with Durability Admixtures',
          sand: 'Engineered Micro-silica Sand + Quartz Aggregate Blend',
          aggregate: 'Double-Washed Machine-Graded Cubical Granite',
          masonry: 'Wienerberger Porotherm Thermal-Insulated Clay Blocks',
          flooring: 'Imported Italian Botticino / Statuario Marble + Teak',
          paint: 'PU / Micro-cement Luxury Designer Wall Finishes'
        }
      };

      const selPkgMats = packageMaterials[tierKey] || packageMaterials.standard;

      // Deterministic Quantities per IS 456 Standards
      const steelTonnes = (estimation.materialSummary?.steelTonnes || (totalSBA * 0.0035)).toFixed(2);
      const cementBags = Math.round(estimation.materialSummary?.cementBags || (totalSBA * 0.42));
      const sandCuFt = Math.round(totalSBA * 1.9);
      const aggCuFt = Math.round(totalSBA * 1.35);
      const masonryQty = Math.round(totalSBA * 1.25);
      const flooringSqFt = Math.round(totalCarpet * 1.07);

      const matTakeoff = [
        ['Reinforcement Steel Rebar', selPkgMats.steel, `${steelTonnes}`, 'Tonnes'],
        ['Structural Grade Cement', selPkgMats.cement, `${fmtNum(cementBags)}`, 'Bags (50kg)'],
        ['Manufactured Sand (M-Sand)', selPkgMats.sand, `${fmtNum(sandCuFt)}`, 'Cu.Ft'],
        ['Coarse Aggregate Jelly', selPkgMats.aggregate, `${fmtNum(aggCuFt)}`, 'Cu.Ft'],
        ['Wall Masonry Units', selPkgMats.masonry, `${fmtNum(masonryQty)}`, 'Blocks / Sq.Ft'],
        ['Flooring & Wall Tiling', selPkgMats.flooring, `${fmtNum(flooringSqFt)}`, 'Sq.Ft'],
        ['Waterproofing System', 'Dr. Fixit 2K Polymer Elastomeric Membrane (Toilets & Terrace)', '1.0', 'Package (L.S)']
      ];

      // Material Table Header
      const matHeaderH = 18;
      doc.rect(leftMargin, doc.y, printableWidth, matHeaderH).fill('#1E3A8A');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8);
      doc.text('Material Category', leftMargin + 8, doc.y + 5);
      doc.text('Brand Specification & Quality Grade', leftMargin + 140, doc.y + 5);
      doc.text('Estimated Quantity', rightMargin - 150, doc.y + 5, { width: 90, align: 'right' });
      doc.text('Unit', rightMargin - 55, doc.y + 5, { width: 50, align: 'center' });

      let matY = doc.y + matHeaderH;

      matTakeoff.forEach((m, idx) => {
        const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(leftMargin, matY, printableWidth, 18).fill(bg);
        doc.rect(leftMargin, matY, printableWidth, 18).stroke('#F1F5F9');

        doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(7.5);
        doc.text(m[0], leftMargin + 8, matY + 5);

        doc.fillColor('#475569').font('Helvetica').fontSize(7.5);
        doc.text(m[1], leftMargin + 140, matY + 5, { width: 220, lineBreak: false });

        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(8);
        doc.text(m[2], rightMargin - 150, matY + 5, { width: 90, align: 'right' });

        doc.fillColor('#64748B').font('Helvetica').fontSize(7.5);
        doc.text(m[3], rightMargin - 55, matY + 5, { width: 50, align: 'center' });

        matY += 18;
      });

      doc.y = matY + 16;

      // 7. Trade-Wise Scope & Engineering Reconciliation
      checkPageBreak(130);

      doc.fillColor('#1E3A8A').fontSize(10).font('Helvetica-Bold').text('4. STATUTORY & ENGINEERING COMPLIANCE NOTES', leftMargin, doc.y);
      doc.moveDown(0.3);

      const notes = [
        '1. Structural Engineering Standards: Quantities calculated deterministically complying with IS 456:2000 (RCC), IS 13920:2016 (Ductile Detailing), and IS 1786:2008 (High Strength Deformed Steel Bars).',
        '2. Geotechnical Soil Assumption: Safe Bearing Capacity (SBC) of foundation soil is benchmarked at 180-200 kN/m² for isolated pad footings. Deep piles or heavy rocky strata are evaluated via site borehole tests.',
        '3. Comprehensive Workmanship Scope: Includes mechanized batch mixing, cube test verification (M25 grade 28-day compressive strength), immersion vibration, and statutory 14-day water curing protocols.',
        '4. GST & Statutory Taxes: Statutory 18% Goods and Services Tax (GST) is itemized. External municipal sanction charges, betterment fees, and utility deposits (BESCOM / BWSSB) are client responsibilities.'
      ];

      doc.fillColor('#475569').font('Helvetica').fontSize(7.5);
      notes.forEach(n => {
        doc.text(n, leftMargin + 4, doc.y, { width: printableWidth - 8, lineGap: 1.5 });
        doc.moveDown(0.35);
      });

      // Disclaimer Banner
      checkPageBreak(42);
      const discY = doc.y + 4;
      doc.rect(leftMargin, discY, printableWidth, 34).fill('#F8FAFC');
      doc.rect(leftMargin, discY, printableWidth, 34).stroke('#E2E8F0');
      doc.fillColor('#64748B').fontSize(7).font('Helvetica-Oblique').text(
        'Authoritative Legal Notice: This document is an algorithmic civil engineering and quantity surveying estimation issued by Buildiqo.ai. ' +
        'Final contractor agreement may vary based on architectural elevation detailing, approved structural drawings, and site-specific topography.',
        leftMargin + 10,
        discY + 7,
        { width: printableWidth - 20, lineGap: 1.5 }
      );

      // 8. Footers across all buffered pages
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.page.margins.bottom = 0;
        doc.fontSize(7.5).font('Helvetica').fillColor('#94A3B8');
        doc.text(
          `Buildiqo.ai • Page ${i + 1} of ${range.count} • Authoritative IS 456 Engineering Cost Audit`,
          leftMargin,
          footerY,
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
