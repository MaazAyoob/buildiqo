const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

/**
 * Generates an Excel (.xlsx) workbook buffer from a commercial BOQ
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

  // ================= 1. BOQ Summary Sheet =================
  const summarySheet = workbook.addWorksheet('BOQ Summary', {
    views: [{ state: 'frozen', ySplit: 4 }]
  });

  // Title block
  summarySheet.mergeCells('A1:D1');
  summarySheet.getCell('A1').value = `COMMERCIAL BOQ SUMMARY — ${boq.title || 'Project'}`;
  summarySheet.getCell('A1').font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };

  summarySheet.getCell('A2').value = `Pricing Authority: ${boq.pricingState || 'Karnataka'} | File: ${boq.fileName || 'Original'} | Date: ${new Date().toLocaleDateString()}`;
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
  subtotalRow.values = ['', '', 'BOQ SUB-TOTAL', boq.totals ? boq.totals.subtotal : 0];
  subtotalRow.font = boldFont;
  subtotalRow.getCell(4).numFmt = '₹#,##0.00';
  subtotalRow.getCell(4).alignment = { horizontal: 'right' };

  const gstRate = boq.totals ? boq.totals.gstRate : 18;
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

  // ================= 2. Itemized Sheets =================
  for (const sheet of boq.sheets) {
    if (sheet.isSummarySheet) continue;

    const ws = workbook.addWorksheet(sheet.name.slice(0, 31), {
      views: [{ state: 'frozen', ySplit: 2 }]
    });

    const isElectrical = sheet.hasDesignSiteQty;
    const headers = isElectrical 
      ? ['ITEM NO', 'DESCRIPTION', 'SPECIFICATION', 'UNIT', 'DESIGN QTY', 'SITE QTY', 'ORIGINAL RATE', 'CURRENT RATE', 'RATE SOURCE', 'AMOUNT (INR)', 'COMMENTS']
      : ['ITEM NO', 'DESCRIPTION', 'SPECIFICATION / MAKE', 'UNIT', 'QUANTITY', 'ORIGINAL RATE', 'CURRENT RATE', 'RATE SOURCE', 'AMOUNT (INR)', 'COMMENTS'];

    const hRow = ws.getRow(2);
    hRow.values = headers;
    hRow.font = headerFont;
    hRow.fill = headerFill;
    hRow.alignment = { vertical: 'middle', horizontal: 'center' };

    let rIdx = 3;

    for (const section of sheet.sections) {
      // Section header row
      const sRow = ws.getRow(rIdx++);
      sRow.values = [`${section.code ? section.code + ' ' : ''}${section.name}`];
      sRow.font = sectionFont;
      sRow.fill = sectionFill;
      ws.mergeCells(rIdx - 1, 1, rIdx - 1, headers.length);

      for (const item of section.rows) {
        const row = ws.getRow(rIdx++);
        const values = isElectrical ? [
          item.itemNo,
          item.description,
          item.specification,
          item.unit,
          item.designQuantity !== null ? item.designQuantity : '',
          item.siteQuantity !== null ? item.siteQuantity : item.quantity,
          item.originalRate,
          item.currentRate,
          item.rateSource || 'ORIGINAL',
          item.amount,
          item.comments
        ] : [
          item.itemNo,
          item.description,
          item.specification,
          item.unit,
          item.quantity,
          item.originalRate,
          item.currentRate,
          item.rateSource || 'ORIGINAL',
          item.amount,
          item.comments
        ];

        row.values = values;
        row.font = regularFont;

        const rateColIdx = isElectrical ? 8 : 7;
        const origRateColIdx = isElectrical ? 7 : 6;
        const amtColIdx = isElectrical ? 10 : 9;

        row.getCell(origRateColIdx).numFmt = '₹#,##0.00';
        row.getCell(rateColIdx).numFmt = '₹#,##0.00';
        row.getCell(amtColIdx).numFmt = '₹#,##0.00';

        row.getCell(1).alignment = { horizontal: 'center' };
        row.getCell(4).alignment = { horizontal: 'center' };
        row.getCell(amtColIdx).alignment = { horizontal: 'right' };
      }

      // Section Subtotal row
      const subRow = ws.getRow(rIdx++);
      const subVals = new Array(headers.length).fill('');
      subVals[headers.length - 3] = 'Section Subtotal:';
      subVals[headers.length - 2] = section.subtotal;
      subRow.values = subVals;
      subRow.font = boldFont;
      subRow.getCell(headers.length - 1).numFmt = '₹#,##0.00';
      subRow.getCell(headers.length - 1).alignment = { horizontal: 'right' };
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

  // ================= 3. Material Intelligence Sheet =================
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
        rateInfo.pricingScope === 'NATIONAL' ? 'Approved National Baseline' : (boq.pricingState + ' State Rate')
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

  return await workbook.xlsx.writeBuffer();
}

/**
 * Generates a PDF document buffer from a commercial BOQ
 */
async function exportToPDF(boq) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', b => buffers.push(b));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header Banner
      doc.rect(40, 40, 515, 65).fill('#1E3A8A');
      doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold').text('Buildiqo.ai', 55, 52);
      doc.fontSize(10).font('Helvetica').text('Commercial Bill of Quantities (BOQ) Schedule', 55, 75);
      doc.fontSize(8).text(`Pricing Authority: ${boq.pricingState || 'Karnataka'} | Ref: ${boq.fileName || 'Original'}`, 55, 90);

      doc.moveDown(4);

      // Project Info
      doc.fillColor('#0F172A').fontSize(14).font('Helvetica-Bold').text(boq.title || 'Commercial BOQ Project');
      doc.fontSize(9).font('Helvetica').fillColor('#64748B').text(`Generated on: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`);
      doc.moveDown(1);

      // Section Tables
      for (const sheet of boq.sheets) {
        if (sheet.isSummarySheet) continue;

        doc.fillColor('#1E3A8A').fontSize(12).font('Helvetica-Bold').text(`DISCIPLINE: ${sheet.name.toUpperCase()}`);
        doc.moveDown(0.5);

        for (const section of sheet.sections) {
          if (doc.y > 700) doc.addPage();

          // Section Bar
          doc.rect(40, doc.y, 515, 20).fill('#F1F5F9');
          doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold').text(
            `${section.code ? section.code + ' ' : ''}${section.name} (Subtotal: ₹${(section.subtotal || 0).toLocaleString('en-IN')})`,
            45,
            doc.y - 15
          );
          doc.moveDown(0.8);

          // Table Header
          const colX = [40, 75, 260, 310, 360, 425, 485];
          doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold');
          doc.text('Item', colX[0], doc.y);
          doc.text('Description', colX[1], doc.y - 10);
          doc.text('Unit', colX[2], doc.y - 10);
          doc.text('Qty', colX[3], doc.y - 10);
          doc.text('Rate', colX[4], doc.y - 10);
          doc.text('Amount', colX[5], doc.y - 10);
          doc.moveDown(0.6);

          doc.strokeColor('#CBD5E1').lineWidth(0.5).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
          doc.moveDown(0.4);

          // Table Rows
          doc.font('Helvetica').fontSize(7.5).fillColor('#1E293B');

          for (const item of section.rows) {
            if (doc.y > 730) doc.addPage();

            const yPos = doc.y;
            const descTrunc = item.description.length > 42 ? item.description.substring(0, 40) + '...' : item.description;

            doc.text(item.itemNo || '•', colX[0], yPos);
            doc.text(descTrunc, colX[1], yPos, { width: 180 });
            doc.text(item.unit || '-', colX[2], yPos);
            doc.text(String(item.quantity || 0), colX[3], yPos);
            doc.text(`₹${(item.currentRate || 0).toLocaleString('en-IN')}`, colX[4], yPos);
            doc.text(`₹${(item.amount || 0).toLocaleString('en-IN')}`, colX[5], yPos);

            doc.moveDown(0.5);
          }

          doc.moveDown(0.8);
        }
      }

      // Final Summary & Totals
      if (doc.y > 600) doc.addPage();
      doc.moveDown(1);
      doc.rect(40, doc.y, 515, 2).fill('#1E3A8A');
      doc.moveDown(1);

      doc.fillColor('#1E3A8A').fontSize(12).font('Helvetica-Bold').text('FINAL COMMERCIAL SUMMARY');
      doc.moveDown(0.5);

      const subtotal = boq.totals ? boq.totals.subtotal : 0;
      const gstRate = boq.totals ? boq.totals.gstRate : 18;
      const gstAmount = boq.totals ? boq.totals.gstAmount : 0;
      const grandTotal = boq.totals ? boq.totals.grandTotal : 0;

      doc.fontSize(9).font('Helvetica').fillColor('#334155');
      doc.text(`BOQ Subtotal: ₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      doc.text(`Goods & Services Tax (GST @ ${gstRate}%): ₹${gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#0F172A').text(`Grand Total (Incl. GST): ₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);

      doc.moveDown(2);

      // Disclaimer Note (Strictly compliant with prompt requirement 20)
      doc.rect(40, doc.y, 515, 45).fill('#F8FAFC');
      doc.fillColor('#64748B').fontSize(7.5).font('Helvetica-Oblique').text(
        'Commercial Notice: Material price references are based on Buildiqo approved pricing data. ' +
        'State rates take precedence over approved national baseline rates where available. ' +
        'Commercial BOQ rates represent independent trade contracts and are not automatically substituted with raw materials.',
        48,
        doc.y - 40,
        { width: 500 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  exportToExcel,
  exportToPDF
};
