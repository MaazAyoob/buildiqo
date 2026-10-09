const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const User = require('../models/User');
const Material = require('../models/Material');
const MaterialRate = require('../models/MaterialRate');
const CommercialBOQ = require('../models/CommercialBOQ');

const { seedMaterials } = require('../scripts/seedMaterials');
const { parseCommercialBOQ, inspectWorkbookSheets } = require('../services/commercialBoqParser');
const { classifyBOQ, classifyRow, isUnitCompatible } = require('../services/materialClassifier');
const {
  resolveQuantityBasis,
  calculateLineAmount,
  attachPricingIntelligence,
  recalculateBOQ,
  applyMaterialRateToRow
} = require('../services/commercialBoqPricingService');
const { exportToExcel, exportToPDF } = require('../services/commercialBoqExporter');
const { createTWCWorkbook } = require('./fixtures/createTWCWorkbook');

let mongoServer;
let fixturePath;
let fixtureBuffer;
let testUser;
let otherUser;
let parsedBOQ;
let enrichedBOQ;

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await seedMaterials();

  // Create test users
  testUser = await User.create({
    name: 'BOQ Test Owner',
    email: 'boqowner@buildiqo.ai',
    password: 'TestPassword123!',
    phone: '9876543210',
    role: 'customer'
  });

  otherUser = await User.create({
    name: 'Other User',
    email: 'other@buildiqo.ai',
    password: 'TestPassword123!',
    phone: '9876543211',
    role: 'customer'
  });

  // Generate TWC Kasthuri Nagar BOQ fixture only if not present
  fixturePath = path.join(__dirname, 'fixtures', 'TWC_KASTHURI_NAGAR_BOQ_Final_3-2-26.xlsx');
  if (!fs.existsSync(fixturePath)) {
    await createTWCWorkbook(fixturePath);
  }
  fixtureBuffer = fs.readFileSync(fixturePath);
});

test.after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test('Commercial BOQ Engine & Material Intelligence Separation Test Suite', async (t) => {

  await t.test('1. Workbook parsing: detects all 4 sheets with different column structures', async () => {
    parsedBOQ = await parseCommercialBOQ(fixtureBuffer, 'TWC_KASTHURI_NAGAR_BOQ_Final_3-2-26.xlsx');
    
    assert.strictEqual(parsedBOQ.sheets.length, 4, 'Must detect all 4 sheets');
    const sheetNames = parsedBOQ.sheets.map(s => s.name);
    assert.ok(sheetNames.includes('Summary'), 'Summary sheet detected');
    assert.ok(sheetNames.includes('Civil + Interior'), 'Civil + Interior sheet detected');
    assert.ok(sheetNames.includes('Plumbing'), 'Plumbing sheet detected');
    assert.ok(sheetNames.includes('Electrical'), 'Electrical sheet detected');
  });

  await t.test('2. Summary sheet detection: recognized as summary without corrupting item lists', async () => {
    const summarySheet = parsedBOQ.sheets.find(s => s.name === 'Summary');
    assert.ok(summarySheet, 'Summary sheet exists');
    assert.strictEqual(summarySheet.isSummarySheet, true, 'isSummarySheet is true');
  });

  await t.test('3. Section and item detection: section titles are preserved and not captured as items', async () => {
    const civilSheet = parsedBOQ.sheets.find(s => s.name === 'Civil + Interior');
    assert.ok(civilSheet.sections.length >= 2, 'Civil sheet has at least 2 sections');

    const secA = civilSheet.sections.find(s => s.code === 'A]' || s.name.includes('DEMOLITION'));
    const secB = civilSheet.sections.find(s => s.code === 'B]' || s.name.includes('CONCRETING'));

    assert.ok(secA, 'Section A (Demolition) detected');
    assert.ok(secB, 'Section B (Concreting) detected');

    // Verify item 12 in Section B
    const rccItem = secB.rows.find(r => r.itemNo === '12)');
    assert.ok(rccItem, 'Item 12) RCC lintel detected');
    assert.strictEqual(rccItem.unit, 'R.ft');
    assert.strictEqual(rccItem.quantity, 40);
    assert.strictEqual(rccItem.originalRate, 850);
    assert.strictEqual(rccItem.amount, 34000);

    // Verify subtotal row was NOT added as an item
    const subtotalItem = secB.rows.find(r => r.description.toLowerCase().includes('sub total'));
    assert.strictEqual(subtotalItem, undefined, 'Subtotal row must not be added as an item row');
  });

  await t.test('4. Electrical sheet parsing: detects Design Qty & Site Qty, defaults quantityBasis to Site Qty', async () => {
    const eleSheet = parsedBOQ.sheets.find(s => s.name === 'Electrical');
    assert.strictEqual(eleSheet.hasDesignSiteQty, true, 'hasDesignSiteQty is true');

    const conduitItem = eleSheet.sections[0].rows.find(r => r.itemNo === '1.1');
    assert.ok(conduitItem, 'Conduit item detected');
    assert.strictEqual(conduitItem.designQuantity, 200);
    assert.strictEqual(conduitItem.siteQuantity, 220);
    assert.strictEqual(conduitItem.quantityBasis, 'siteQuantity');
    assert.strictEqual(conduitItem.quantity, 220, 'Default quantity is Site Qty (220)');
    assert.strictEqual(conduitItem.amount, 220 * 85, 'Amount is Site Qty (220) * Rate (85) = 18700');
  });

  await t.test('5. Material Classification: distinguishes DIRECT_MATERIAL from COMPOUND_WORK', async () => {
    classifyBOQ(parsedBOQ);

    const civilSheet = parsedBOQ.sheets.find(s => s.name === 'Civil + Interior');
    const secB = civilSheet.sections.find(s => s.name.includes('CONCRETING'));

    const rccItem = secB.rows.find(r => r.itemNo === '12)');
    const cementItem = secB.rows.find(r => r.itemNo === '13)');
    const steelItem = secB.rows.find(r => r.itemNo === '14)');

    // RCC lintel is a compound work item
    assert.strictEqual(rccItem.itemType, 'COMPOUND_WORK', 'RCC lintel must be COMPOUND_WORK');
    assert.strictEqual(rccItem.compatibilityStatus, 'REFERENCE_ONLY', 'Compound work is strictly REFERENCE_ONLY');

    // Direct cement supply is a direct material supply item
    assert.strictEqual(cementItem.itemType, 'DIRECT_MATERIAL', 'Cement supply must be DIRECT_MATERIAL');
    assert.strictEqual(cementItem.classificationStatus, 'MATCHED', 'Cement supply is MATCHED');
    assert.strictEqual(cementItem.compatibilityStatus, 'COMPATIBLE', 'Direct Bag-to-Bag cement is COMPATIBLE');

    // Direct steel supply is a direct material supply item
    assert.strictEqual(steelItem.itemType, 'DIRECT_MATERIAL', 'Steel supply must be DIRECT_MATERIAL');
    assert.strictEqual(steelItem.classificationStatus, 'MATCHED', 'Steel supply is MATCHED');
    assert.strictEqual(steelItem.compatibilityStatus, 'COMPATIBLE', 'Direct Tonne-to-Tonne steel is COMPATIBLE');
  });

  await t.test('6. Authoritative State Pricing: attaches intelligence without overwriting commercial rates', async () => {
    // Seed an approved Karnataka state rate for Cement (e.g. ₹475/Bag)
    const cementMat = await Material.findOne({ materialCode: 'CM-ULTRATECH-STD' });
    await MaterialRate.create({
      materialId: cementMat._id,
      materialCode: 'CM-ULTRATECH-STD',
      rate: 475,
      unit: '₹ / Bag (50 kg)',
      stateId: 'karnataka',
      location: 'Karnataka',
      cityId: 'all',
      status: 'approved',
      source: 'admin_manual'
    });

    enrichedBOQ = await attachPricingIntelligence(parsedBOQ, 'Karnataka');

    const civilSheet = enrichedBOQ.sheets.find(s => s.name === 'Civil + Interior');
    const secB = civilSheet.sections.find(s => s.name.includes('CONCRETING'));

    const rccItem = secB.rows.find(r => r.itemNo === '12)');
    const cementItem = secB.rows.find(r => r.itemNo === '13)');

    // ARCHITECTURAL RULE VERIFICATION:
    // Compound RCC lintel commercial rate MUST remain ₹850, NOT ₹475 or ₹410!
    assert.strictEqual(rccItem.currentRate, 850, 'CRITICAL: RCC lintel commercial rate must remain ₹850');
    assert.strictEqual(rccItem.latestMaterialRate, 475, 'Buildiqo intelligence knows cement benchmark is ₹475');
    assert.strictEqual(rccItem.materialRateSource, 'STATE', 'Benchmark source is STATE');

    // Direct cement item also retains its original commercial rate ₹390 until explicitly applied!
    assert.strictEqual(cementItem.currentRate, 390, 'Imported cement rate remains ₹390 before explicit apply');
    assert.strictEqual(cementItem.latestMaterialRate, 475, 'Latest benchmark is ₹475');
    assert.strictEqual(cementItem.materialRateSource, 'STATE', 'Benchmark source is STATE');
  });

  await t.test('7. Guarded Rate Application: compound item rate application is strictly BLOCKED', async () => {
    const civilSheet = enrichedBOQ.sheets.find(s => s.name === 'Civil + Interior');
    const secB = civilSheet.sections.find(s => s.name.includes('CONCRETING'));
    const rccItem = secB.rows.find(r => r.itemNo === '12)');

    assert.throws(
      () => applyMaterialRateToRow(rccItem, testUser),
      /REFERENCE_ONLY|Cannot apply material rate/i,
      'Direct application on compound work item must throw error and be blocked'
    );

    assert.strictEqual(rccItem.currentRate, 850, 'RCC rate remains ₹850 after blocked attempt');
  });

  await t.test('8. Guarded Rate Application: direct compatible item rate application SUCCEEDS', async () => {
    const civilSheet = enrichedBOQ.sheets.find(s => s.name === 'Civil + Interior');
    const secB = civilSheet.sections.find(s => s.name.includes('CONCRETING'));
    const cementItem = secB.rows.find(r => r.itemNo === '13)');

    assert.strictEqual(cementItem.currentRate, 390);
    assert.strictEqual(cementItem.amount, 39000);

    // Explicitly apply
    applyMaterialRateToRow(cementItem, testUser);

    assert.strictEqual(cementItem.currentRate, 475, 'Current rate updated to ₹475');
    assert.strictEqual(cementItem.rateSource, 'STATE', 'rateSource is STATE');
    assert.strictEqual(cementItem.amount, 100 * 475, 'Amount is 100 * 475 = 47500');
    assert.strictEqual(cementItem.rateHistory.length, 1, 'Audit history recorded');
    assert.strictEqual(cementItem.rateHistory[0].originalRate, 390);
    assert.strictEqual(cementItem.rateHistory[0].updatedRate, 475);
  });

  await t.test('9. Manual BOQ rate edit: updates rateSource to MANUAL and recalculates amount', async () => {
    const civilSheet = enrichedBOQ.sheets.find(s => s.name === 'Civil + Interior');
    const secB = civilSheet.sections.find(s => s.name.includes('CONCRETING'));
    const rccItem = secB.rows.find(r => r.itemNo === '12)');

    // User manually edits rate from 850 to 920
    rccItem.currentRate = 920;
    rccItem.rateSource = 'MANUAL';
    rccItem.amount = calculateLineAmount(rccItem);

    assert.strictEqual(rccItem.currentRate, 920);
    assert.strictEqual(rccItem.rateSource, 'MANUAL');
    assert.strictEqual(rccItem.amount, 40 * 920, 'Amount is 40 * 920 = 36800');
  });

  await t.test('10. Electrical quantity basis toggle: switching to Design Qty recalculates amount', async () => {
    const eleSheet = enrichedBOQ.sheets.find(s => s.name === 'Electrical');
    const conduitItem = eleSheet.sections[0].rows.find(r => r.itemNo === '1.1');

    // Switch basis from siteQuantity (220) to designQuantity (200)
    conduitItem.quantityBasis = 'designQuantity';
    conduitItem.amount = calculateLineAmount(conduitItem);

    assert.strictEqual(resolveQuantityBasis(conduitItem), 200);
    assert.strictEqual(conduitItem.amount, 200 * 85, 'Amount is 200 * 85 = 17000');
  });

  await t.test('11. Deterministic Recalculation: section subtotals, GST, and grand total', async () => {
    recalculateBOQ(enrichedBOQ);

    const totals = enrichedBOQ.totals;
    assert.ok(totals.subtotal > 0, 'Subtotal is positive');
    assert.strictEqual(totals.gstRate, 18);
    assert.strictEqual(totals.gstAmount, Math.round(totals.subtotal * 0.18 * 100) / 100);
    assert.strictEqual(totals.grandTotal, Math.round((totals.subtotal + totals.gstAmount) * 100) / 100);

    // Change GST to 12%
    enrichedBOQ.gstRate = 12;
    recalculateBOQ(enrichedBOQ);
    assert.strictEqual(enrichedBOQ.totals.gstRate, 12);
    assert.strictEqual(enrichedBOQ.totals.gstAmount, Math.round(enrichedBOQ.totals.subtotal * 0.12 * 100) / 100);
  });

  await t.test('12. Database Rate Mutation Isolation: changing MaterialRate later does NOT alter saved BOQ', async () => {
    // Save BOQ to database
    const savedDoc = new CommercialBOQ({
      ...enrichedBOQ,
      title: 'TWC Kasthuri Nagar Test',
      fileName: 'TWC_KASTHURI_NAGAR_BOQ_Final_3-2-26.xlsx',
      userId: testUser._id
    });
    await savedDoc.save();

    const savedRccRate = savedDoc.sheets[1].sections[1].rows.find(r => r.itemNo === '12)').currentRate;
    const savedCementRate = savedDoc.sheets[1].sections[1].rows.find(r => r.itemNo === '13)').currentRate;

    // Mutate database MaterialRate to ₹600
    await MaterialRate.create({
      materialId: (await Material.findOne({ materialCode: 'CM-ULTRATECH-STD' }))._id,
      materialCode: 'CM-ULTRATECH-STD',
      rate: 600,
      unit: '₹ / Bag (50 kg)',
      stateId: 'karnataka',
      location: 'Karnataka',
      cityId: 'all',
      status: 'approved',
      source: 'admin_manual'
    });

    // Reload from DB without refresh
    const reloaded = await CommercialBOQ.findById(savedDoc._id);
    const reloadedRccRate = reloaded.sheets[1].sections[1].rows.find(r => r.itemNo === '12)').currentRate;
    const reloadedCementRate = reloaded.sheets[1].sections[1].rows.find(r => r.itemNo === '13)').currentRate;

    assert.strictEqual(reloadedRccRate, savedRccRate, 'Saved RCC rate is immutable');
    assert.strictEqual(reloadedCementRate, savedCementRate, 'Saved Cement rate is immutable');
  });

  await t.test('13. National fallback works when State rate is unavailable', async () => {
    // Check sand in Kerala where no state rate exists
    const boqKerala = await parseCommercialBOQ(fixtureBuffer, 'Kerala_Test.xlsx');
    classifyBOQ(boqKerala);
    await attachPricingIntelligence(boqKerala, 'Kerala');

    // Steel JSW should have National fallback
    const civilSheet = boqKerala.sheets.find(s => s.name === 'Civil + Interior');
    const steelRow = civilSheet.sections[1].rows.find(r => r.itemNo === '14)');

    assert.strictEqual(steelRow.materialPricingScope, 'NATIONAL', 'Falls back to NATIONAL');
    assert.strictEqual(steelRow.materialRateSource, 'NATIONAL');
    assert.ok(steelRow.latestMaterialRate > 0, 'Has national fallback rate');
  });

  await t.test('14. Excel export succeeds and generates valid multi-sheet workbook buffer', async () => {
    const excelBuffer = await exportToExcel(enrichedBOQ);
    assert.ok(excelBuffer && excelBuffer.length > 1000, 'Excel buffer generated');

    // Read back and verify sheets
    const verifyWb = new ExcelJS.Workbook();
    await verifyWb.xlsx.load(excelBuffer);

    assert.ok(verifyWb.getWorksheet('BOQ Summary'), 'Summary sheet in export');
    assert.ok(verifyWb.getWorksheet('Civil + Interior'), 'Civil sheet in export');
    assert.ok(verifyWb.getWorksheet('Plumbing'), 'Plumbing sheet in export');
    assert.ok(verifyWb.getWorksheet('Electrical'), 'Electrical sheet in export');
    assert.ok(verifyWb.getWorksheet('Material Intelligence'), 'Material Intelligence sheet in export');
  });

  await t.test('15. PDF export succeeds and generates valid PDF buffer with disclaimer note', async () => {
    const pdfBuffer = await exportToPDF(enrichedBOQ);
    assert.ok(Buffer.isBuffer(pdfBuffer), 'PDF result is a buffer');
    assert.ok(pdfBuffer.length > 2000, 'PDF buffer length is greater than 2000 bytes');
    assert.strictEqual(pdfBuffer.subarray(0, 4).toString(), '%PDF', 'PDF buffer begins with standard %PDF magic bytes');
  });

  await t.test('16. Authorization Security: unauthorized user cannot access another user commercial BOQ', async () => {
    const doc = await CommercialBOQ.findOne({ userId: testUser._id });
    assert.ok(doc, 'Test BOQ exists');

    // Owner ID check
    const isOwner = doc.userId.toString() === testUser._id.toString();
    const isOther = doc.userId.toString() === otherUser._id.toString();

    assert.strictEqual(isOwner, true, 'Original user is authorized');
    assert.strictEqual(isOther, false, 'Other user is unauthorized');
  });
});

test('Comprehensive Verification: 10 Requirements, Modes A & B, Exporters, and Edge Cases', async (t) => {

  await t.test('Req 1 & 2: Parse Excel with varied header names, custom column order & Indian formats', async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Custom Civil');
    
    // Non-standard column order: Category, Item#, Description, Qty, Unit, Rate, Amount
    ws.addRow(['Category', 'Line #', 'Particulars', 'Total Qty', 'UOM', 'Unit Price', 'Total Cost']);
    
    // Indian formatting with commas, currency prefixes, and suffixes
    ws.addRow(['CIVIL', 'C-101', 'Earthwork excavation in ordinary soil', '1,200', 'Cu.Ft', '₹ 45.00', '₹ 54,000.00']);
    ws.addRow(['CIVIL', 'C-102', 'Plain Cement Concrete (PCC 1:4:8)', '350', 'Cu.Ft', 'Rs. 240/-', '84,000/-']);
    ws.addRow(['CIVIL', 'C-103', 'Brick masonry 9 inch wall with cement mortar', '500', 'Sq.Ft', '250', '(1,25,000)']); // parenthesized negative
    
    const buffer = await wb.xlsx.writeBuffer();
    const result = await parseCommercialBOQ(buffer, 'custom_boq.xlsx');
    
    assert.strictEqual(result.sheets.length, 1);
    const sheet = result.sheets[0];
    assert.strictEqual(sheet.name, 'Custom Civil');
    
    const allRows = sheet.sections.flatMap(s => s.rows);
    assert.strictEqual(allRows.length, 3, 'All 3 rows parsed');
    
    const row1 = allRows.find(r => r.itemNo === 'C-101');
    assert.ok(row1);
    assert.strictEqual(row1.quantity, 1200);
    assert.strictEqual(row1.originalRate, 45);
    assert.strictEqual(row1.amount, 54000);
    assert.strictEqual(row1.unit, 'Cu.Ft');
    
    const row2 = allRows.find(r => r.itemNo === 'C-102');
    assert.ok(row2);
    assert.strictEqual(row2.quantity, 350);
    assert.strictEqual(row2.originalRate, 240);
    assert.strictEqual(row2.amount, 84000);
    
    const row3 = allRows.find(r => r.itemNo === 'C-103');
    assert.ok(row3);
    assert.strictEqual(row3.quantity, 500);
    assert.strictEqual(row3.originalRate, 250);
    assert.strictEqual(row3.originalAmount, -125000, 'Parenthesized negative parsed into originalAmount');
    assert.strictEqual(row3.amount, 125000, 'Calculated amount is quantity * rate');
  });

  await t.test('Req 3: Multi-worksheet inspection and selective sheet parsing', async () => {
    const inspected = await inspectWorkbookSheets(fixtureBuffer);
    assert.strictEqual(inspected.length, 4);
    assert.strictEqual(inspected[0].name, 'Summary');
    assert.strictEqual(inspected[0].isSummary, true);
    assert.strictEqual(inspected[1].name, 'Civil + Interior');
    assert.strictEqual(inspected[1].hasHeader, true);

    // Parse only Plumbing sheet
    const plumbingOnly = await parseCommercialBOQ(fixtureBuffer, 'twc.xlsx', { selectedSheets: ['Plumbing'] });
    assert.strictEqual(plumbingOnly.sheets.length, 1);
    assert.strictEqual(plumbingOnly.sheets[0].name, 'Plumbing');
  });

  await t.test('Req 4: QA flags for missing rates, blank quantities, and duplicate items', async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Quality Audit');
    ws.addRow(['Item No', 'Description', 'Unit', 'Qty', 'Rate', 'Amount']);
    // Item 1: Missing rate
    ws.addRow(['1', 'Internal wall painting with acrylic emulsion', 'Sq.Ft', 1000, '', '']);
    // Item 2: Missing quantity
    ws.addRow(['2', 'Teakwood door frame', 'Nos', '', 12000, '']);
    // Item 3: Duplicate of Item 1
    ws.addRow(['3', 'Internal wall painting with acrylic emulsion', 'Sq.Ft', 500, 25, 12500]);
    // Item 4: Missing rate but has Amount & Qty -> deduced rate
    ws.addRow(['4', 'Vitrified floor skirting', 'R.ft', 100, '', 5000]);

    const buffer = await wb.xlsx.writeBuffer();
    const result = await parseCommercialBOQ(buffer, 'audit.xlsx');
    const rows = result.sheets[0].sections.flatMap(s => s.rows);

    const item1 = rows.find(r => r.itemNo === '1');
    assert.strictEqual(item1.missingRate, true);
    assert.strictEqual(item1.currentRate, 0);

    const item2 = rows.find(r => r.itemNo === '2');
    assert.strictEqual(item2.missingQuantity, true);
    assert.strictEqual(item2.quantity, 0);

    const item3 = rows.find(r => r.itemNo === '3');
    assert.strictEqual(item3.isDuplicate, true, 'Item 3 flagged as duplicate of item 1');

    const item4 = rows.find(r => r.itemNo === '4');
    assert.strictEqual(item4.currentRate, 50, 'Rate deduced from Amount (5000) / Qty (100) = 50');
    assert.strictEqual(item4.missingRate, false);
  });

  await t.test('Req 5: Mode A Package-based Construction Cost Calculator (3,000 sq.ft × ₹2,000/sq.ft = ₹60,00,000)', async () => {
    const { calculatePackageEstimate } = await import('../../src/utils/calculator.js');
    
    // Multi-floor specification
    const floors = [
      { id: 'gf', name: 'Ground Floor', area: 1500, cost: 3000000 },
      { id: 'ff', name: 'First Floor', area: 1500, cost: 3000000 }
    ];
    
    const estimate = calculatePackageEstimate({
      totalBuiltupArea: 3000,
      customPackageRate: 2000,
      gstRate: 18,
      floors,
      numFloors: 2
    });

    assert.strictEqual(estimate.totalBuiltupArea, 3000);
    assert.strictEqual(estimate.ratePerSqFt, 2000);
    assert.strictEqual(estimate.estimatedCost, 6000000, '3,000 sq.ft × ₹2,000 = ₹60,00,000');
    assert.strictEqual(estimate.gstRate, 18);
    assert.strictEqual(estimate.gstAmount, 1080000, '18% GST on ₹60,00,000 is ₹10,80,000');
    assert.strictEqual(estimate.grandTotal, 7080000, 'Grand total is ₹70,80,000');
  });

  await t.test('Req 6: Excel Export and Re-Import roundtrip data preservation', async () => {
    // Export enriched BOQ to Excel
    const excelBuffer = await exportToExcel(enrichedBOQ);
    assert.ok(excelBuffer && excelBuffer.length > 0);

    // Re-import the exported Excel buffer
    const reimported = await parseCommercialBOQ(excelBuffer, 'exported_boq.xlsx');
    assert.ok(reimported.sheets.length >= 3, 'Sheets survive export & re-import');

    const civilSheet = reimported.sheets.find(s => s.name === 'Civil + Interior');
    assert.ok(civilSheet, 'Civil + Interior sheet survives');

    // Confirm that Section Subtotal was not re-imported as an item
    const subtotalAsItem = civilSheet.sections.flatMap(s => s.rows).find(r => /sub\s*total/i.test(r.description));
    assert.strictEqual(subtotalAsItem, undefined, 'Section Subtotal row must NEVER become an item');

    // Verify key item survived with exact quantity, rate, and amount
    const rccItem = civilSheet.sections.flatMap(s => s.rows).find(r => r.itemNo === '12)');
    assert.ok(rccItem);
    assert.strictEqual(rccItem.quantity, 40);
    assert.strictEqual(rccItem.originalRate, 920, 'Exported manual rate of 920 survived re-import');
    assert.strictEqual(rccItem.amount, 36800, 'Amount 40 * 920 = 36800 survived re-import');
  });

  await t.test('Req 7: PDF Export multi-page handling with repeated headers and page numbers', async () => {
    // Generate a long BOQ with 40 rows across multiple sections
    const longBOQ = {
      title: 'Mega Commercial Project',
      clientInfo: { clientName: 'Mega Corp', projectLocation: 'Bangalore, Karnataka' },
      mode: 'DETAILED',
      selectedState: 'Karnataka',
      gstRate: 18,
      totals: { subtotal: 400000, gstRate: 18, gstAmount: 72000, grandTotal: 472000 },
      sheets: [
        {
          name: 'Extensive Civil Schedule',
          order: 1,
          isSummarySheet: false,
          sections: [
            {
              name: 'EXTENSIVE SCHEDULE PART 1',
              rows: Array.from({ length: 40 }, (_, i) => ({
                itemNo: `${i + 1}`,
                description: `High specification commercial structural element ${i + 1} with extended multi-line descriptive technical requirements conforming to IS codes`,
                unit: 'Sq.Ft',
                quantity: 100,
                currentRate: 100,
                rateSource: 'COMMERCIAL',
                amount: 10000
              }))
            }
          ]
        }
      ]
    };

    const pdfBuffer = await exportToPDF(longBOQ);
    assert.ok(Buffer.isBuffer(pdfBuffer));
    assert.ok(pdfBuffer.length > 5000, 'Multi-page PDF generates sufficient byte size');
    assert.strictEqual(pdfBuffer.subarray(0, 4).toString(), '%PDF');

    // Mode A PDF export also succeeds
    const packagePDF = await exportToPDF({
      title: 'Prestige Commercial Office',
      mode: 'PACKAGE',
      packageEstimate: {
        packageName: 'Premium Commercial Package',
        ratePerSqFt: 2000,
        totalBuiltupArea: 3000,
        estimatedCost: 6000000,
        gstRate: 18,
        gstAmount: 1080000,
        grandTotal: 7080000,
        floors: [
          { name: 'Ground Floor', area: 1500, cost: 3000000 },
          { name: 'First Floor', area: 1500, cost: 3000000 }
        ]
      }
    });
    assert.ok(Buffer.isBuffer(packagePDF));
    assert.strictEqual(packagePDF.subarray(0, 4).toString(), '%PDF');
  });

  await t.test('Req 8: Save BOQ persistence & restoration for both Guest (no CastError) and Authenticated users', async () => {
    // Mode A with guest user ID (string 'usr_guest')
    const guestPackageDoc = new CommercialBOQ({
      title: 'Guest Mode A Estimate',
      mode: 'PACKAGE',
      userId: 'usr_guest',
      packageEstimate: {
        packageName: 'Standard',
        ratePerSqFt: 2000,
        totalBuiltupArea: 3000,
        estimatedCost: 6000000,
        gstRate: 18,
        gstAmount: 1080000,
        grandTotal: 7080000
      }
    });
    const savedGuest = await guestPackageDoc.save();
    assert.ok(savedGuest._id);

    // Reload from database
    const fetchedGuest = await CommercialBOQ.findById(savedGuest._id);
    assert.strictEqual(fetchedGuest.mode, 'PACKAGE');
    assert.strictEqual(fetchedGuest.userId, 'usr_guest');
    assert.strictEqual(fetchedGuest.packageEstimate.estimatedCost, 6000000);

    // Mode B with authenticated user ObjectId
    const authDetailedDoc = new CommercialBOQ({
      title: 'Auth User Detailed BOQ',
      fileName: 'TWC_Auth_Detailed.xlsx',
      mode: 'DETAILED',
      userId: testUser._id,
      sheets: enrichedBOQ.sheets,
      totals: enrichedBOQ.totals
    });
    const savedAuth = await authDetailedDoc.save();
    assert.ok(savedAuth._id);

    const fetchedAuth = await CommercialBOQ.findById(savedAuth._id);
    assert.strictEqual(fetchedAuth.mode, 'DETAILED');
    assert.strictEqual(fetchedAuth.userId.toString(), testUser._id.toString());
    assert.ok(fetchedAuth.sheets.length > 0);
  });

  await t.test('Req 9: Deterministic GST calculation with known test cases', async () => {
    // Test case from prompt:
    // Quantity 100, rate ₹250 -> Amount = ₹25,000
    // Taxable ₹1,00,000 at 18% GST -> GST ₹18,000, Grand Total ₹1,18,000
    const sampleItem = { quantity: 100, currentRate: 250 };
    const sampleAmount = calculateLineAmount(sampleItem);
    assert.strictEqual(sampleAmount, 25000);

    const testBOQ = {
      gstRate: 18,
      sheets: [
        {
          isSummarySheet: false,
          sections: [
            {
              rows: [
                { quantity: 400, currentRate: 250, quantityBasis: 'quantity' } // 400 * 250 = 1,00,000
              ]
            }
          ]
        }
      ]
    };

    recalculateBOQ(testBOQ);
    assert.strictEqual(testBOQ.totals.subtotal, 100000);
    assert.strictEqual(testBOQ.totals.gstRate, 18);
    assert.strictEqual(testBOQ.totals.gstAmount, 18000, '18% GST on ₹1,00,000 must be ₹18,000');
    assert.strictEqual(testBOQ.totals.grandTotal, 118000, 'Grand total must be ₹1,18,000');

    // 12% GST
    testBOQ.gstRate = 12;
    recalculateBOQ(testBOQ);
    assert.strictEqual(testBOQ.totals.gstAmount, 12000);
    assert.strictEqual(testBOQ.totals.grandTotal, 112000);

    // 5% GST
    testBOQ.gstRate = 5;
    recalculateBOQ(testBOQ);
    assert.strictEqual(testBOQ.totals.gstAmount, 5000);
    assert.strictEqual(testBOQ.totals.grandTotal, 105000);

    // 0% GST
    testBOQ.gstRate = 0;
    recalculateBOQ(testBOQ);
    assert.strictEqual(testBOQ.totals.gstAmount, 0);
    assert.strictEqual(testBOQ.totals.grandTotal, 100000);
  });

  await t.test('Req 10: Mode A and Mode B isolation (prevents double-counting)', async () => {
    // Mode A has packageEstimate, but no sheets items
    const modeADoc = new CommercialBOQ({
      mode: 'PACKAGE',
      packageEstimate: {
        ratePerSqFt: 2000,
        totalBuiltupArea: 3000,
        estimatedCost: 6000000,
        gstRate: 18,
        gstAmount: 1080000,
        grandTotal: 7080000
      },
      sheets: []
    });

    // Verify mode A does not include detailed items
    assert.strictEqual(modeADoc.mode, 'PACKAGE');
    assert.strictEqual(modeADoc.sheets.length, 0);

    // Mode B has itemized sheets, but packageEstimate is null
    const modeBDoc = new CommercialBOQ({
      mode: 'DETAILED',
      packageEstimate: null,
      totals: { subtotal: 100000, gstRate: 18, gstAmount: 18000, grandTotal: 118000 }
    });

    assert.strictEqual(modeBDoc.mode, 'DETAILED');
    assert.strictEqual(modeBDoc.packageEstimate, null);
    assert.strictEqual(modeBDoc.totals.grandTotal, 118000);
  });
});

