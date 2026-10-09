const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

/**
 * Generates an Excel (.xlsx) workbook buffer from a commercial BOQ
 * Supports Mode A (Package Estimate) and Mode B (Detailed Multi-discipline BOQ).
 */
async function exportToExcel(boq) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Buildiqo.ai';
  workbook.created = new Date();

  const headerFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' } // Navy blue
  };

  const sectionFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2E8F0' } // Light slate
  };

  const totalFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1F5F9' }
  };

  const headerFont = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  const sectionFont = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  const boldFont = { name: 'Calibri', size: 10, bold: true };
  const regularFont = { name: 'Calibri', size: 10 };

  const isPackageMode = boq.mode === 'PACKAGE' || Boolean(boq.packageEstimate && (!boq.sheets || boq.sheets.length === 0));

  // ================= MODE A: PACKAGE ESTIMATE EXCEL =================
  if (isPackageMode && boq.packageEstimate) {
    const pkg = boq.packageEstimate;
    const ws = workbook.addWorksheet('Package Estimate');

    ws.mergeCells('A1:E1');
    ws.getCell('A1').value = 'BUILDIQO.AI — PACKAGE-BASED CONSTRUCTION ESTIMATE';
    ws.getCell('A1').font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };

    ws.getCell('A2').value = `Project: ${boq.title || 'Construction Estimate'} | Location: ${boq.pricingState || 'Karnataka'} | Mode: Mode A (Package Estimate) | Date: ${new Date().toLocaleDateString('en-IN')}`;
    ws.getCell('A2').font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF64748B' } };

    const hRow = ws.getRow(4);
    hRow.values = ['SL NO', 'ESTIMATE PARAMETER', 'UNIT SPECIFICATION', 'RATE / MEASURE (INR)', 'ESTIMATED TOTAL (INR)'];
    hRow.font = headerFont;
    hRow.fill = headerFill;

    let r = 5;
    const items = [
      [1, 'Total Built-up Area (SBA)', 'Sq.Ft', `${(pkg.totalBuiltupArea || 0).toLocaleString('en-IN')} sq.ft`, pkg.totalBuiltupArea || 0],
      [2, `Selected Construction Package: ${pkg.packageName || 'Package'}`, 'Per Sq.Ft Rate', pkg.ratePerSqFt || 0, pkg.estimatedCost || 0],
      [3, 'Base Construction Cost (SBA × Rate)', 'Direct Work Scope', '-', pkg.estimatedCost || 0],
      [4, `Applicable GST (${pkg.gstRate || 0}%)`, 'Statutory Tax', `${pkg.gstRate || 0}%`, pkg.gstAmount || 0],
      [5, 'Grand Total Investment (Incl. GST)', 'All Inclusive Cost', '-', pkg.grandTotal || 0]
    ];

    for (const it of items) {
      const row = ws.getRow(r++);
      row.values = it;
      row.font = regularFont;
      row.getCell(1).alignment = { horizontal: 'center' };
      if (typeof it[3] === 'number') {
        row.getCell(4).numFmt = '₹#,##0.00';
        row.getCell(4).alignment = { horizontal: 'right' };
      }
      row.getCell(5).numFmt = '₹#,##0.00';
      row.getCell(5).alignment = { horizontal: 'right' };
      if (it[0] === 5) {
        row.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1E3A8A' } };
        row.fill = totalFill;
      }
    }

    // Floor breakdown if available
    if (pkg.floors && pkg.floors.length > 0) {
      r += 2;
      const fHeader = ws.getRow(r++);
      fHeader.values = ['SL NO', 'FLOOR NAME', 'CARPET AREA (SQ.FT)', 'BUILT-UP AREA (SQ.FT)', 'ROOM COUNT'];
      fHeader.font = sectionFont;
      fHeader.fill = sectionFill;

      let fIdx = 1;
      for (const fl of pkg.floors) {
        const fRow = ws.getRow(r++);
        fRow.values = [fIdx++, fl.name || `Floor ${fl.floorNumber}`, fl.carpetArea || 0, fl.builtupArea || 0, fl.roomCount || 0];
        fRow.font = regularFont;
        fRow.getCell(1).alignment = { horizontal: 'center' };
        fRow.getCell(3).alignment = { horizontal: 'right' };
        fRow.getCell(4).alignment = { horizontal: 'right' };
        fRow.getCell(5).alignment = { horizontal: 'center' };
      }
    }

    ws.columns = [
      { width: 10 },
      { width: 45 },
      { width: 25 },
      { width: 25 },
      { width: 28 }
    ];

    // Add Material Intelligence Reference Sheet
    addMaterialIntelligenceSheet(workbook, boq, headerFont, headerFill, regularFont);
    return await workbook.xlsx.writeBuffer();
  }

  // ================= MODE B: DETAILED BOQ WORKBOOK =================

  // 1. BOQ Summary Sheet
  const summarySheet = workbook.addWorksheet('BOQ Summary', {
    views: [{ state: 'frozen', ySplit: 4 }]
  });

  // Title block
  summarySheet.mergeCells('A1:D1');
  summarySheet.getCell('A1').value = `COMMERCIAL BOQ SUMMARY — ${boq.title || 'Project'}`;
  summarySheet.getCell('A1').font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };

  summarySheet.getCell('A2').value = `Pricing Authority: ${boq.pricingState || 'Karnataka'} | File: ${boq.fileName || 'Original'} | Mode: Mode B (Detailed BOQ) | Date: ${new Date().toLocaleDateString('en-IN')}`;
  summarySheet.getCell('A2').font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF64748B' } };

  const summaryHeaders = ['SL NO', 'DISCIPLINE / SHEET', 'SECTION / TRADE', 'AMOUNT (INR)'];
  const summaryHeaderRow = summarySheet.getRow(4);
  summaryHeaderRow.values = summaryHeaders;
  summaryHeaderRow.font = headerFont;
  summaryHeaderRow.fill = headerFill;
  summaryHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

  let summaryRowIdx = 5;
  let sl = 1;

  if (boq.totals && boq.totals.summaryBreakdown) {
    for (const item of boq.totals.summaryBreakdown) {
      const row = summarySheet.getRow(summaryRowIdx++);
      row.values = [sl++, item.sheetName, `${item.sectionCode ? item.sectionCode + ' ' : ''}${item.sectionName}`, item.subtotal];
      row.getCell(4).numFmt = '₹#,##0.00';
      row.getCell(1).alignment = { horizontal: 'center' };
      row.getCell(4).alignment = { horizontal: 'right' };
      row.font = regularFont;
    }
  }

  // Summary Totals
  summaryRowIdx++;
  const subtotalRow = summarySheet.getRow(summaryRowIdx++);
  subtotalRow.values = ['', '', 'BOQ NET SUB-TOTAL', boq.totals ? boq.totals.subtotal : 0];
  subtotalRow.font = boldFont;
  subtotalRow.getCell(4).numFmt = '₹#,##0.00';
  subtotalRow.getCell(4).alignment = { horizontal: 'right' };

  const gstRate = boq.totals ? (boq.totals.gstRate !== undefined ? boq.totals.gstRate : 18) : (boq.gstRate || 18);
  const gstRow = summarySheet.getRow(summaryRowIdx++);
  gstRow.values = ['', '', `GST (${gstRate}%)`, boq.totals ? boq.totals.gstAmount : 0];
  gstRow.font = boldFont;
  gstRow.getCell(4).numFmt = '₹#,##0.00';
  gstRow.getCell(4).alignment = { horizontal: 'right' };

  const grandTotalRow = summarySheet.getRow(summaryRowIdx++);
  grandTotalRow.values = ['', '', 'GRAND TOTAL (INCL. GST)', boq.totals ? boq.totals.grandTotal : 0];
  grandTotalRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1E3A8A' } };
  grandTotalRow.fill = totalFill;
  grandTotalRow.getCell(4).numFmt = '₹#,##0.00';
  grandTotalRow.getCell(4).alignment = { horizontal: 'right' };

  summarySheet.columns = [
    { width: 10 },
    { width: 25 },
    { width: 45 },
    { width: 22 }
  ];

  // 2. Itemized Sheets
  for (const sheet of (boq.sheets || [])) {
    if (sheet.isSummarySheet) continue;

    const ws = workbook.addWorksheet(sheet.name.slice(0, 31), {
      views: [{ state: 'frozen', ySplit: 2 }]
    });

    const isElectrical = sheet.hasDesignSiteQty;
    const headers = isElectrical 
      ? ['ITEM NO', 'DESCRIPTION', 'SPECIFICATION', 'UNIT', 'DESIGN QTY', 'SITE QTY', 'CURRENT RATE', 'ORIGINAL RATE', 'RATE SOURCE', 'AMOUNT (INR)', 'COMMENTS']
      : ['ITEM NO', 'DESCRIPTION', 'SPECIFICATION / MAKE', 'UNIT', 'QUANTITY', 'CURRENT RATE', 'ORIGINAL RATE', 'RATE SOURCE', 'AMOUNT (INR)', 'COMMENTS'];

    const hRow = ws.getRow(2);
    hRow.values = headers;
    hRow.font = headerFont;
    hRow.fill = headerFill;
    hRow.alignment = { vertical: 'middle', horizontal: 'center' };

    let rIdx = 3;

    for (const section of (sheet.sections || [])) {
      // Section header row
      const sRow = ws.getRow(rIdx++);
      sRow.values = [`${section.code ? section.code + ' ' : ''}${section.name}`];
      sRow.font = sectionFont;
      sRow.fill = sectionFill;
      ws.mergeCells(rIdx - 1, 1, rIdx - 1, headers.length);

      for (const item of (section.rows || [])) {
        const row = ws.getRow(rIdx++);
        const values = isElectrical ? [
          item.itemNo,
          item.description,
          item.specification,
          item.unit,
          item.designQuantity !== null && item.designQuantity !== undefined ? item.designQuantity : '',
          item.siteQuantity !== null && item.siteQuantity !== undefined ? item.siteQuantity : item.quantity,
          item.currentRate !== undefined ? item.currentRate : item.originalRate,
          item.originalRate !== undefined ? item.originalRate : 0,
          item.rateSource || 'ORIGINAL',
          item.amount !== undefined ? item.amount : 0,
          item.comments || ''
        ] : [
          item.itemNo,
          item.description,
          item.specification,
          item.unit,
          item.quantity !== undefined ? item.quantity : 0,
          item.currentRate !== undefined ? item.currentRate : item.originalRate,
          item.originalRate !== undefined ? item.originalRate : 0,
          item.rateSource || 'ORIGINAL',
          item.amount !== undefined ? item.amount : 0,
          item.comments || ''
        ];

        row.values = values;
        row.font = regularFont;

        const currentRateColIdx = isElectrical ? 7 : 6;
        const origRateColIdx = isElectrical ? 8 : 7;
        const amtColIdx = isElectrical ? 10 : 9;

        row.getCell(currentRateColIdx).numFmt = '₹#,##0.00';
        row.getCell(origRateColIdx).numFmt = '₹#,##0.00';
        row.getCell(amtColIdx).numFmt = '₹#,##0.00';

        row.getCell(1).alignment = { horizontal: 'center' };
        row.getCell(4).alignment = { horizontal: 'center' };
        row.getCell(amtColIdx).alignment = { horizontal: 'right' };
      }

      // Section Subtotal row
      const subRow = ws.getRow(rIdx++);
      const subVals = new Array(headers.length).fill('');
      const amtColIndex = isElectrical ? 10 : 9;
      subVals[amtColIndex - 2] = 'Section Subtotal:';
      subVals[amtColIndex - 1] = section.subtotal;
      subRow.values = subVals;
      subRow.font = boldFont;
      subRow.getCell(amtColIndex).numFmt = '₹#,##0.00';
      subRow.getCell(amtColIndex).alignment = { horizontal: 'right' };
    }

    ws.columns = [
      { width: 12 },
      { width: 45 },
      { width: 28 },
      { width: 10 },
      { width: 14 },
      ...(isElectrical ? [{ width: 14 }] : []),
      { width: 16 },
      { width: 16 },
      { width: 16 },
      { width: 20 },
      { width: 25 }
    ];
  }

  // 3. Material Intelligence Sheet
  addMaterialIntelligenceSheet(workbook, boq, headerFont, headerFill, regularFont);

  return await workbook.xlsx.writeBuffer();
}

function addMaterialIntelligenceSheet(workbook, boq, headerFont, headerFill, regularFont) {
  const matSheet = workbook.addWorksheet('Material Intelligence');
  matSheet.mergeCells('A1:F1');
  matSheet.getCell('A1').value = 'BUILDIQO MATERIAL BENCHMARK INTELLIGENCE (REFERENCE ONLY)';
  matSheet.getCell('A1').font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF1E3A8A' } };

  const matHeaderRow = matSheet.getRow(3);
  matHeaderRow.values = ['MATERIAL CODE', 'MATERIAL NAME', 'CATEGORY', 'BUILDIQO RATE', 'UNIT', 'PRICING AUTHORITY'];
  matHeaderRow.font = headerFont;
  matHeaderRow.fill = headerFill;

  let mIdx = 4;
  if (boq.pricingSnapshot && boq.pricingSnapshot.rates) {
    for (const [code, rateInfo] of Object.entries(boq.pricingSnapshot.rates)) {
      const row = matSheet.getRow(mIdx++);
      row.values = [
        code,
        rateInfo.name || code,
        rateInfo.category || '',
        rateInfo.unitRate || rateInfo.rate || 0,
        rateInfo.unit || '',
        rateInfo.pricingScope === 'NATIONAL' ? 'Approved National Baseline' : ((boq.pricingState || 'Karnataka') + ' State Rate')
      ];
      row.getCell(4).numFmt = '₹#,##0.00';
      row.font = regularFont;
    }
  }

  matSheet.columns = [
    { width: 20 },
    { width: 35 },
    { width: 18 },
    { width: 16 },
    { width: 18 },
    { width: 30 }
  ];
}

/**
 * Generates a clean, multi-page PDF document buffer from a commercial BOQ.
 * Supports:
 * - Mode A (Package Estimate)
 * - Mode B (Detailed BOQ)
 * - Long descriptions with dynamic row height (no truncation or clipping)
 * - Repeated table headers across pages
 * - Page numbering ("Page X of Y")
 */
async function exportToPDF(boq) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
      const buffers = [];

      doc.on('data', b => buffers.push(b));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      const isPackageMode = boq.mode === 'PACKAGE' || Boolean(boq.packageEstimate && (!boq.sheets || boq.sheets.length === 0));

      // Header Banner
      doc.rect(40, 40, 515, 65).fill('#1E3A8A');
      doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold').text('Buildiqo.ai', 55, 52);
      doc.fontSize(10).font('Helvetica').text(
        isPackageMode 
          ? 'Package-Based Construction Cost Estimate (Mode A)'
          : 'Commercial Bill of Quantities (BOQ) Schedule (Mode B)',
        55, 74
      );
      doc.fontSize(8).text(
        `Pricing Authority: ${boq.pricingState || 'Karnataka'} | Ref: ${boq.fileName || boq.title || 'Estimate'}`,
        55, 90
      );

      doc.y = 120;

      // Project & Client Metadata Block
      doc.fillColor('#0F172A').fontSize(13).font('Helvetica-Bold').text(boq.title || 'Construction Estimate Report', 40, doc.y);
      doc.moveDown(0.2);

      const clientName = boq.clientInfo?.customerName || boq.customerName || 'Valued Client';
      const projectLoc = `${boq.clientInfo?.city || ''} ${boq.pricingState || 'Karnataka'}`.trim();
      doc.fontSize(8.5).font('Helvetica').fillColor('#64748B').text(
        `Client: ${clientName} | Location: ${projectLoc} | Generated: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`
      );
      doc.moveDown(1);

      // ================= MODE A: PACKAGE ESTIMATE PDF =================
      if (isPackageMode && boq.packageEstimate) {
        const pkg = boq.packageEstimate;

        doc.rect(40, doc.y, 515, 24).fill('#F1F5F9');
        doc.fillColor('#1E3A8A').fontSize(10).font('Helvetica-Bold').text(
          'PACKAGE CONSTRUCTION COST SUMMARY',
          50,
          doc.y + 7
        );
        doc.moveDown(1.5);

        // Parameters Table
        const params = [
          ['Total Built-up Area (SBA)', `${(pkg.totalBuiltupArea || 0).toLocaleString('en-IN')} sq.ft`],
          ['Floor Count', `${pkg.numFloors || 1} Floor(s)`],
          ['Selected Construction Package', pkg.packageName || 'Standard Package'],
          ['Package Rate per sq. ft.', `₹${(pkg.ratePerSqFt || 0).toLocaleString('en-IN')}/sq.ft`],
          ['Calculation Formula', pkg.formula || `${pkg.totalBuiltupArea} sq.ft × ₹${pkg.ratePerSqFt}/sq.ft`],
          ['Base Construction Cost (SBA × Rate)', `₹${(pkg.estimatedCost || 0).toLocaleString('en-IN')}`],
          [`Applicable GST (${pkg.gstRate || 0}%)`, `₹${(pkg.gstAmount || 0).toLocaleString('en-IN')}`],
          ['Grand Total Investment (Incl. GST)', `₹${(pkg.grandTotal || 0).toLocaleString('en-IN')}`]
        ];

        let curY = doc.y;
        for (let i = 0; i < params.length; i++) {
          const isGrand = i === params.length - 1;
          const bg = isGrand ? '#EFF6FF' : (i % 2 === 0 ? '#FFFFFF' : '#F8FAFC');
          doc.rect(40, curY, 515, 20).fill(bg);
          
          doc.fillColor(isGrand ? '#1E3A8A' : '#334155')
             .font(isGrand ? 'Helvetica-Bold' : 'Helvetica')
             .fontSize(8.5)
             .text(params[i][0], 50, curY + 6);

          doc.fillColor(isGrand ? '#1E3A8A' : '#0F172A')
             .font('Helvetica-Bold')
             .fontSize(isGrand ? 10 : 8.5)
             .text(params[i][1], 340, curY + (isGrand ? 5 : 6), { width: 200, align: 'right' });

          curY += 20;
        }

        doc.y = curY + 15;

        // Floor breakdown if available
        if (pkg.floors && pkg.floors.length > 0) {
          doc.fillColor('#1E3A8A').fontSize(10).font('Helvetica-Bold').text('FLOOR-WISE BUILT-UP AREA BREAKDOWN');
          doc.moveDown(0.4);

          doc.rect(40, doc.y, 515, 18).fill('#E2E8F0');
          doc.fillColor('#0F172A').fontSize(8).font('Helvetica-Bold');
          doc.text('#', 50, doc.y + 5);
          doc.text('Floor Name', 80, doc.y + 5);
          doc.text('Carpet Area', 280, doc.y + 5, { width: 80, align: 'right' });
          doc.text('Built-up Area', 380, doc.y + 5, { width: 80, align: 'right' });
          doc.text('Rooms', 480, doc.y + 5, { width: 50, align: 'right' });

          let fY = doc.y + 18;
          pkg.floors.forEach((fl, idx) => {
            const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
            doc.rect(40, fY, 515, 18).fill(bg);
            doc.fillColor('#334155').font('Helvetica').fontSize(8);
            doc.text(String(idx + 1), 50, fY + 5);
            doc.text(fl.name || `Floor ${fl.floorNumber}`, 80, fY + 5);
            doc.text(`${(fl.carpetArea || 0).toLocaleString('en-IN')} sq.ft`, 280, fY + 5, { width: 80, align: 'right' });
            doc.text(`${(fl.builtupArea || 0).toLocaleString('en-IN')} sq.ft`, 380, fY + 5, { width: 80, align: 'right' });
            doc.text(String(fl.roomCount || 0), 480, fY + 5, { width: 50, align: 'right' });
            fY += 18;
          });

          doc.y = fY + 20;
        }

        renderDisclaimerAndPageNumbers(doc);
        doc.end();
        return;
      }

      // ================= MODE B: DETAILED BOQ PDF =================
      const colX = [40, 75, 265, 315, 375, 455];
      const colW = [30, 185, 45, 55, 75, 95];

      function drawTableHeader(y) {
        doc.rect(40, y, 515, 18).fill('#1E3A8A');
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
        doc.text('Item', colX[0], y + 5);
        doc.text('Description & Specification', colX[1], y + 5);
        doc.text('Unit', colX[2], y + 5, { width: colW[2], align: 'center' });
        doc.text('Qty', colX[3], y + 5, { width: colW[3], align: 'right' });
        doc.text('Rate (INR)', colX[4], y + 5, { width: colW[4], align: 'right' });
        doc.text('Amount (INR)', colX[5], y + 5, { width: colW[5], align: 'right' });
        return y + 20;
      }

      for (const sheet of (boq.sheets || [])) {
        if (sheet.isSummarySheet) continue;

        if (doc.y > 680) doc.addPage();

        doc.fillColor('#1E3A8A').fontSize(11).font('Helvetica-Bold').text(`DISCIPLINE: ${sheet.name.toUpperCase()}`);
        doc.moveDown(0.4);

        for (const section of (sheet.sections || [])) {
          if (doc.y > 690) doc.addPage();

          // Section Bar
          doc.rect(40, doc.y, 515, 18).fill('#E2E8F0');
          doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text(
            `${section.code ? section.code + ' ' : ''}${section.name} (Subtotal: ₹${(section.subtotal || 0).toLocaleString('en-IN')})`,
            48,
            doc.y + 5
          );
          doc.moveDown(0.7);

          let curY = drawTableHeader(doc.y);

          // Section Rows
          for (const item of (section.rows || [])) {
            const desc = item.description || 'BOQ Line Item';
            const spec = item.specification ? `\nMake/Spec: ${item.specification}` : '';
            const fullDesc = `${desc}${spec}`;

            doc.font('Helvetica').fontSize(7.5);
            const textHeight = doc.heightOfString(fullDesc, { width: colW[1] });
            const rowHeight = Math.max(16, Math.ceil(textHeight) + 6);

            // Page break check
            if (curY + rowHeight > 760) {
              doc.addPage();
              doc.fillColor('#1E3A8A').fontSize(9).font('Helvetica-Bold').text(
                `DISCIPLINE: ${sheet.name.toUpperCase()} (Contd.)`, 40, 45
              );
              curY = drawTableHeader(60);
            }

            // Zebra stripe
            doc.rect(40, curY, 515, rowHeight).fill(curY % 2 === 0 ? '#FFFFFF' : '#F8FAFC');

            doc.fillColor('#334155').font('Helvetica').fontSize(7.5);
            doc.text(item.itemNo || '•', colX[0], curY + 4);
            doc.text(fullDesc, colX[1], curY + 4, { width: colW[1] });
            doc.text(item.unit || '-', colX[2], curY + 4, { width: colW[2], align: 'center' });
            
            const qtyVal = item.quantityBasis === 'designQuantity' ? (item.designQuantity ?? item.quantity) : (item.siteQuantity ?? item.quantity);
            doc.text(String(qtyVal ?? 0), colX[3], curY + 4, { width: colW[3], align: 'right' });
            doc.text(`₹${(item.currentRate || 0).toLocaleString('en-IN')}`, colX[4], curY + 4, { width: colW[4], align: 'right' });
            doc.text(`₹${(item.amount || 0).toLocaleString('en-IN')}`, colX[5], curY + 4, { width: colW[5], align: 'right' });

            curY += rowHeight;
          }

          doc.y = curY + 10;
        }
      }

      // Final Grand Summary Block
      if (doc.y > 660) doc.addPage();
      doc.moveDown(0.8);
      doc.rect(40, doc.y, 515, 2).fill('#1E3A8A');
      doc.moveDown(0.8);

      doc.fillColor('#1E3A8A').fontSize(11).font('Helvetica-Bold').text('FINAL COMMERCIAL ABSTRACT SUMMARY');
      doc.moveDown(0.4);

      const subtotal = boq.totals ? boq.totals.subtotal : 0;
      const gstRate = boq.totals ? (boq.totals.gstRate !== undefined ? boq.totals.gstRate : 18) : (boq.gstRate || 18);
      const gstAmount = boq.totals ? boq.totals.gstAmount : 0;
      const grandTotal = boq.totals ? boq.totals.grandTotal : 0;

      const summaryLines = [
        ['Net BOQ Taxable Subtotal', `₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        [`Goods & Services Tax (GST @ ${gstRate}%)`, `₹${gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        ['Grand Total Project Cost (All Inclusive)', `₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`]
      ];

      let sY = doc.y;
      for (let i = 0; i < summaryLines.length; i++) {
        const isGrand = i === summaryLines.length - 1;
        doc.rect(40, sY, 515, 20).fill(isGrand ? '#EFF6FF' : (i % 2 === 0 ? '#FFFFFF' : '#F8FAFC'));
        doc.fillColor(isGrand ? '#1E3A8A' : '#334155')
           .font(isGrand ? 'Helvetica-Bold' : 'Helvetica')
           .fontSize(8.5)
           .text(summaryLines[i][0], 50, sY + 6);
        doc.fillColor(isGrand ? '#1E3A8A' : '#0F172A')
           .font('Helvetica-Bold')
           .fontSize(isGrand ? 10 : 8.5)
           .text(summaryLines[i][1], 340, sY + (isGrand ? 5 : 6), { width: 200, align: 'right' });
        sY += 20;
      }

      doc.y = sY + 15;

      renderDisclaimerAndPageNumbers(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function renderDisclaimerAndPageNumbers(doc) {
  // Disclaimer Banner at the bottom of the last page
  if (doc.y > 720) doc.addPage();
  doc.rect(40, doc.y, 515, 38).fill('#F8FAFC');
  doc.fillColor('#64748B').fontSize(7).font('Helvetica-Oblique').text(
    'Commercial Notice: All figures deterministic and verified against active state baseline contracts. ' +
    'Direct contractor trade items represent all-inclusive execution rates. ' +
    'Raw material benchmark prices are maintained independently for reference and do not override contractor rates.',
    48,
    doc.y + 6,
    { width: 495 }
  );

  // Repeated page numbering across all pages in buffer
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(7.5).font('Helvetica').fillColor('#94A3B8');
    doc.text(
      `Buildiqo.ai • Page ${i + 1} of ${range.count} • Strict Mathematical Takeoff Engine`,
      40,
      805,
      { width: 515, align: 'center' }
    );
  }
}

module.exports = {
  exportToExcel,
  exportToPDF
};
