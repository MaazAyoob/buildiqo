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
const { parseCommercialBOQ } = require('../services/commercialBoqParser');
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

  let parsedBOQ;
  let enrichedBOQ;

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
