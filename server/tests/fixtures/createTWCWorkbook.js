const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function createTWCWorkbook(outputPath) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'TWC Kasthuri Nagar BOQ Team';
  workbook.created = new Date('2026-02-03');

  // ================= 1. Summary Sheet =================
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.addRow(['PROJECT: TWC KASTHURI NAGAR — COMMERCIAL BOQ FINAL']);
  summarySheet.addRow(['DATE: 03-02-2026']);
  summarySheet.addRow([]);
  summarySheet.addRow(['Sl No', 'Work Category / Discipline', 'Amount (Rs)']);
  summarySheet.addRow([1, 'Civil + Interior Work', 272000]);
  summarySheet.addRow([2, 'Plumbing Work', 50600]);
  summarySheet.addRow([3, 'Electrical Work', 32875]);
  summarySheet.addRow([]);
  summarySheet.addRow(['', 'Total Estimated Cost', 355475]);

  // ================= 2. Civil + Interior Sheet =================
  const civilSheet = workbook.addWorksheet('Civil + Interior');
  // Top Title banner
  civilSheet.mergeCells('A1:H1');
  civilSheet.getCell('A1').value = 'TWC KASTHURI NAGAR — CIVIL & INTERIOR SCHEDULE OF QUANTITIES';

  // Blank spacer row
  civilSheet.addRow([]);

  // Header row
  const civilHeaders = ['SR. NO', 'DESCRIPTION', 'Specs/ makes', 'UNIT', 'Qty', 'Rate', 'Amount', 'COMMENTS'];
  civilSheet.addRow(civilHeaders);

  // Section A
  civilSheet.addRow(['A] DEMOLITION WORK']);
  civilSheet.addRow(['1)', 'Demolition of existing 9 inch brick masonry wall including carting away debris', 'Site specification', 'Cu.Ft', 150, 40, 6000, 'Care to be taken near conduits']);
  civilSheet.addRow([]); // Blank spacer row

  // Section B
  civilSheet.addRow(['B] CONCRETING WORK']);
  // Compound Work Item: RCC Lintel (Bag unit mismatch with R.ft)
  civilSheet.addRow(['12)', 'Providing and constructing RCC lintel including concrete, reinforcement, shuttering and labour', 'OPC 53 grade cement, Fe 500D TMT steel', 'R.ft', 40, 850, 34000, 'As per structural drawing']);
  // Direct Material Supply Item: OPC 53 Cement
  civilSheet.addRow(['13)', 'Supply of OPC 53 grade cement for site store', 'UltraTech / ACC Gold', 'Bag', 100, 390, 39000, 'Direct store delivery']);
  // Direct Material Supply Item: TMT Steel
  civilSheet.addRow(['14)', 'Supply of JSW Fe 550D TMT steel reinforcement', 'JSW Neosteel Fe 550D', 'Tonne', 2, 72000, 144000, 'Mill test certificate required']);
  // Flooring Item
  civilSheet.addRow(['15)', 'Providing and laying 2x2 vitrified flooring tiles', 'Kajaria double charged vitrified', 'Sq.Ft', 500, 98, 49000, 'Grouting included']);

  // Section Subtotal row
  civilSheet.addRow(['', 'Sub Total Concreting & Masonry', '', '', '', '', 266000, '']);
  civilSheet.addRow([]);

  // ================= 3. Plumbing Sheet =================
  const plumbingSheet = workbook.addWorksheet('Plumbing');
  plumbingSheet.addRow(['TWC KASTHURI NAGAR — PLUMBING & SANITARY']);
  plumbingSheet.addRow([]);
  plumbingSheet.addRow(['SR. NO', 'DESCRIPTION', 'Specs/ makes', 'UNIT', 'Qty', 'Rate', 'Amount', 'COMMENTS']);

  // Section M
  plumbingSheet.addRow(['M] PLUMBING WORK']);
  plumbingSheet.addRow(['1)', 'Providing & fixing CPVC pipes 25mm SDR 11', 'Astral / Supreme CPVC', 'Rmt', 120, 280, 33600, 'Concealed in wall']);
  plumbingSheet.addRow(['2)', 'Supply and fixing Jaquar CP brass bib taps', 'Jaquar Continental', 'Nos', 10, 1200, 12000, 'Chrome finish']);
  plumbingSheet.addRow([]);

  // Section G
  plumbingSheet.addRow(['G] OTHER PLUMBING']);
  plumbingSheet.addRow(['3)', 'Testing of entire plumbing line with hydraulic pressure test pump', 'IS benchmark', 'L.S.', 1, 5000, 5000, 'Acceptance test']);

  // ================= 4. Electrical Sheet =================
  const electricalSheet = workbook.addWorksheet('Electrical');
  electricalSheet.addRow(['TWC KASTHURI NAGAR — ELECTRICAL SCHEDULE']);
  electricalSheet.addRow([]);
  // Electrical unique columns with Design Qty and Site Qty
  electricalSheet.addRow(['Sr.No.', 'Description', 'Unit', 'Design Qty', 'Site Qty', 'Rate', 'Amount']);

  electricalSheet.addRow(['SECTION 1 - CONDUITING & CABLING']);
  electricalSheet.addRow(['1.1', 'Supplying and laying 25mm heavy duty PVC conduit with MS accessories', 'Rmt', 200, 220, 85, 18700]);
  electricalSheet.addRow(['1.2', 'Supplying and drawing 2.5 sqmm FRLS copper wire in conduits', 'Rmt', 300, 315, 45, 14175]);

  const targetDir = path.dirname(outputPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  await workbook.xlsx.writeFile(outputPath);
  console.log('TWC Kasthuri Nagar BOQ fixture created at:', outputPath);
  return outputPath;
}

if (require.main === module) {
  const defaultPath = path.join(__dirname, 'TWC_KASTHURI_NAGAR_BOQ_Final_3-2-26.xlsx');
  createTWCWorkbook(defaultPath).catch(err => {
    console.error('Error generating TWC workbook:', err);
    process.exit(1);
  });
}

module.exports = { createTWCWorkbook };
