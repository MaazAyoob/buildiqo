const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { seedMaterials } = require('../scripts/seedMaterials');
const Material = require('../models/Material');
const MaterialRate = require('../models/MaterialRate');
const { parseCommercialBOQ } = require('../services/commercialBoqParser');
const { classifyBOQ } = require('../services/materialClassifier');
const {
  attachPricingIntelligence,
  recalculateBOQ,
  applyMaterialRateToRow
} = require('../services/commercialBoqPricingService');
const { exportToExcel, exportToPDF } = require('../services/commercialBoqExporter');

async function runAcceptanceVerification() {
  console.log('--- STARTING COMMERCIAL BOQ ACCEPTANCE VERIFICATION ---');

  // 1. Setup in-memory MongoDB and seed materials
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await seedMaterials();

  // Set an approved Karnataka state rate for Cement to ₹475/Bag
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

  // 2. Load TWC Kasthuri Nagar BOQ Workbook
  const fixturePath = path.join(__dirname, 'fixtures', 'TWC_KASTHURI_NAGAR_BOQ_Final_3-2-26.xlsx');
  console.log('[1/7] Reading fixture:', fixturePath);
  const buffer = fs.readFileSync(fixturePath);

  // 3. Parse workbook
  const parsed = await parseCommercialBOQ(buffer, 'TWC_KASTHURI_NAGAR_BOQ_Final_3-2-26.xlsx');
  console.log(`[2/7] Parsed successfully: ${parsed.sheets.length} sheets detected:`, parsed.sheets.map(s => s.name));

  // 4. Classify materials & enforce compound separation
  const classified = classifyBOQ(parsed);
  console.log(`[3/7] Material classification complete: ${classified.stats.matchedRows} matches detected.`);

  // 5. Attach live Karnataka pricing benchmarks
  const enriched = await attachPricingIntelligence(classified, 'Karnataka');
  recalculateBOQ(enriched);
  console.log('[4/7] Attached Karnataka pricing intelligence.');

  // Validate critical architectural rule:
  const civilSheet = enriched.sheets.find(s => s.name === 'Civil + Interior');
  const concretingSec = civilSheet.sections.find(s => s.name.includes('CONCRETING'));
  const rccLintel = concretingSec.rows.find(r => r.itemNo === '12)');
  const cementSupply = concretingSec.rows.find(r => r.itemNo === '13)');

  console.log('\n--- ARCHITECTURAL VERIFICATION ---');
  console.log('Item 12) RCC Lintel:');
  console.log(`  Description: ${rccLintel.description.substring(0, 45)}...`);
  console.log(`  BOQ Commercial Rate: ₹${rccLintel.currentRate} / ${rccLintel.unit}`);
  console.log(`  Item Type: ${rccLintel.itemType}`);
  console.log(`  Compatibility: ${rccLintel.compatibilityStatus}`);
  console.log(`  Latest Cement Benchmark: ₹${rccLintel.latestMaterialRate} / ${rccLintel.latestMaterialRateUnit}`);

  if (rccLintel.currentRate !== 850) {
    throw new Error(`FAIL: RCC lintel rate was corrupted! Expected 850, got ${rccLintel.currentRate}`);
  }
  if (rccLintel.compatibilityStatus !== 'REFERENCE_ONLY') {
    throw new Error(`FAIL: RCC lintel compatibility must be REFERENCE_ONLY, got ${rccLintel.compatibilityStatus}`);
  }
  console.log('  -> PASS: RCC compound commercial rate remained untouched at ₹850.');

  console.log('\nItem 13) Direct Cement Supply:');
  console.log(`  Description: ${cementSupply.description}`);
  console.log(`  Original BOQ Rate: ₹${cementSupply.originalRate} / ${cementSupply.unit}`);
  console.log(`  Item Type: ${cementSupply.itemType}`);
  console.log(`  Compatibility: ${cementSupply.compatibilityStatus}`);
  console.log(`  Latest Karnataka Rate: ₹${cementSupply.latestMaterialRate}`);

  if (cementSupply.compatibilityStatus !== 'COMPATIBLE') {
    throw new Error(`FAIL: Direct cement supply must be COMPATIBLE, got ${cementSupply.compatibilityStatus}`);
  }
  console.log('  -> PASS: Direct cement supply recognized as COMPATIBLE.');

  // Apply benchmark to compatible cement row
  console.log('\n[5/7] Applying Karnataka state rate (₹475) to direct cement row...');
  applyMaterialRateToRow(cementSupply);
  recalculateBOQ(enriched);

  console.log(`  Updated Rate: ₹${cementSupply.currentRate}`);
  console.log(`  Rate Source: ${cementSupply.rateSource}`);
  console.log(`  Recalculated Amount: ₹${cementSupply.amount}`);
  if (cementSupply.currentRate !== 475 || cementSupply.amount !== 47500) {
    throw new Error(`FAIL: Cement rate application failed. Rate: ${cementSupply.currentRate}, Amount: ${cementSupply.amount}`);
  }

  // 6. Test Excel Export
  console.log('\n[6/7] Testing Excel (.xlsx) export...');
  const excelBuffer = await exportToExcel(enriched);
  const outExcelPath = path.join(__dirname, 'fixtures', 'acceptance_exported.xlsx');
  fs.writeFileSync(outExcelPath, excelBuffer);
  console.log(`  -> Generated Excel export (${excelBuffer.length} bytes) at: ${outExcelPath}`);

  // 7. Test PDF Export
  console.log('\n[7/7] Testing PDF export...');
  const pdfBuffer = await exportToPDF(enriched);
  const outPdfPath = path.join(__dirname, 'fixtures', 'acceptance_exported.pdf');
  fs.writeFileSync(outPdfPath, pdfBuffer);
  console.log(`  -> Generated PDF export (${pdfBuffer.length} bytes) at: ${outPdfPath}`);

  await mongoose.disconnect();
  await mongoServer.stop();

  console.log('\n======================================================');
  console.log('ALL ACCEPTANCE VERIFICATION CHECKS PASSED WITH ZERO ERRORS!');
  console.log('======================================================\n');
}

runAcceptanceVerification().catch(err => {
  console.error('Acceptance verification failed:', err);
  process.exit(1);
});
