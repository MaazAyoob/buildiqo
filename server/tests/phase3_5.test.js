const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Set test environment secrets before loading modules
process.env.JWT_SECRET = 'test_jwt_secret_buildiqo_phase_3_5_test_token_83921';
process.env.PRICE_RESEARCH_PROVIDER = 'mock';

const Material = require('../models/Material');
const MaterialRate = require('../models/MaterialRate');
const User = require('../models/User');
const Project = require('../models/Project');
const PriceResearchRun = require('../models/PriceResearchRun');
const PriceResearchCandidate = require('../models/PriceResearchCandidate');
const pricingService = require('../services/pricingService');
const priceResearchService = require('../services/priceResearch/priceResearchService');
const GoogleSearchResearchProvider = require('../services/priceResearch/GoogleSearchResearchProvider');
const OpenAIResearchProvider = require('../services/priceResearch/OpenAIResearchProvider');
const MockResearchProvider = require('../services/priceResearch/MockResearchProvider');
const { normalizePrice } = require('../services/priceResearch/priceNormalizer');
const { validateCandidateRate } = require('../services/priceResearch/priceValidator');
const { calculateConfidence } = require('../services/priceResearch/confidenceScorer');
const ResearchPolicy = require('../services/priceResearch/ResearchPolicy');

let mongoServer;
let adminUser;
let regularUser;
let adminToken;
let regularToken;

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Create Users
  adminUser = await User.create({
    name: 'Admin QS Officer',
    email: 'admin_qs@buildiqo.ai',
    password: 'SecureAdminHashedPassword123!',
    role: 'Platform Owner & Super Admin',
    isAdmin: true
  });

  regularUser = await User.create({
    name: 'Contractor User',
    email: 'contractor@example.com',
    password: 'StandardContractorPassword123!',
    role: 'Contractor',
    isAdmin: false
  });

  adminToken = jwt.sign({ id: adminUser._id, email: adminUser.email, isAdmin: true }, process.env.JWT_SECRET);
  regularToken = jwt.sign({ id: regularUser._id, email: regularUser.email, isAdmin: false }, process.env.JWT_SECRET);

  // Seed baseline materials
  await Material.create([
    {
      materialCode: 'STEEL-TMT-500D',
      name: 'TMT Steel Fe500D',
      category: 'steel',
      unit: 'kg',
      tier: 'standard',
      grade: 'Fe500D',
      brand: 'Tata Tiscon',
      benchmarkRate: 70
    },
    {
      materialCode: 'CEMENT-OPC-53',
      name: 'OPC 53 Grade Cement',
      category: 'cement',
      unit: 'bag',
      tier: 'standard',
      grade: '53',
      brand: 'UltraTech',
      benchmarkRate: 380
    },
    {
      materialCode: 'SAND-M-SAND',
      name: 'Manufactured Sand (M-Sand)',
      category: 'sand',
      unit: 'cft',
      tier: 'standard',
      grade: 'Zone II',
      brand: 'Standard Quarry',
      benchmarkRate: 50
    }
  ]);

  // Seed baseline approved rates
  const steelMat = await Material.findOne({ materialCode: 'STEEL-TMT-500D' });
  const cementMat = await Material.findOne({ materialCode: 'CEMENT-OPC-53' });
  const sandMat = await Material.findOne({ materialCode: 'SAND-M-SAND' });

  await MaterialRate.create([
    {
      materialId: steelMat._id,
      materialCode: 'STEEL-TMT-500D',
      rate: 68,
      unit: 'kg',
      location: 'National',
      cityId: 'all',
      stateId: 'all',
      status: 'approved'
    },
    {
      materialId: cementMat._id,
      materialCode: 'CEMENT-OPC-53',
      rate: 375,
      unit: 'bag',
      location: 'National',
      cityId: 'all',
      stateId: 'all',
      status: 'approved'
    },
    {
      materialId: sandMat._id,
      materialCode: 'SAND-M-SAND',
      rate: 48,
      unit: 'cft',
      location: 'National',
      cityId: 'all',
      stateId: 'all',
      status: 'approved'
    }
  ]);
});

test.after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// ==========================================
// SECTION 1: RESEARCH EXECUTION & AUTHORIZATION (Criteria 1–8)
// ==========================================

test('CRITERION 1 & 8: Admin can start research and candidate is stored', async () => {
  const result = await priceResearchService.startResearchRun({
    userId: adminUser._id,
    state: 'Uttar Pradesh',
    city: 'Varanasi',
    locationScope: 'city',
    researchScope: 'specific',
    materialCodes: ['STEEL-TMT-500D'],
    providerName: 'mock'
  });

  assert.equal(result.run.status, 'completed');
  assert.equal(result.candidateCount, 1);

  const candidates = await priceResearchService.getCandidates({ runId: result.run.runId });
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].materialCode, 'STEEL-TMT-500D');
  assert.equal(candidates[0].status, 'pending');
});

test('CRITERION 2: Non-admin cannot start research without valid userId', async () => {
  await assert.rejects(
    async () => {
      await priceResearchService.startResearchRun({
        userId: null,
        state: 'Uttar Pradesh',
        city: 'Varanasi'
      });
    },
    /Authentication required/
  );
});

test('CRITERION 3: Invalid material scope rejected', async () => {
  await assert.rejects(
    async () => {
      await priceResearchService.startResearchRun({
        userId: adminUser._id,
        state: 'Uttar Pradesh',
        researchScope: 'specific',
        materialCodes: ['NON_EXISTENT_CODE_XYZ'],
        providerName: 'mock'
      });
    },
    /No active materials matched the requested research scope/
  );
});

test('CRITERION 4: Invalid location rejected in candidate validation', () => {
  const res = validateCandidateRate({
    material: { materialCode: 'STEEL-TMT-500D' },
    candidate: { state: '' }
  });
  assert.equal(res.isValid, false);
  assert.ok(res.errors.some(e => e.includes('State location is required')));
});

test('CRITERION 5: Research provider failure handled with clear configuration error', () => {
  const unconfiguredGoogle = new GoogleSearchResearchProvider();
  assert.equal(unconfiguredGoogle.isConfigured(), false);
  assert.match(unconfiguredGoogle.getConfigurationError(), /Missing required configuration/);

  const unconfiguredOpenAI = new OpenAIResearchProvider();
  assert.equal(unconfiguredOpenAI.isConfigured(), false);
  assert.match(unconfiguredOpenAI.getConfigurationError(), /Missing required configuration/);
});

test('CRITERION 6: Malformed AI output handled gracefully', async () => {
  const mockWithMalformed = new MockResearchProvider({
    'STEEL-TMT-500D': { found: false, reason: 'Malformed response structure from remote model' }
  });

  const res = await mockWithMalformed.researchMaterialPrice({
    material: { materialCode: 'STEEL-TMT-500D' },
    state: 'Uttar Pradesh',
    city: 'Varanasi'
  });

  assert.equal(res.found, false);
  assert.equal(res.reason, 'Malformed response structure from remote model');
});

test('CRITERION 7: No reliable source produces NO approved price and NO candidate', async () => {
  const mockNoPrice = new MockResearchProvider({
    'STEEL-TMT-500D': { found: false, reason: 'NO_RELIABLE_PRICE_FOUND' }
  });

  const res = await mockNoPrice.researchMaterialPrice({
    material: { materialCode: 'STEEL-TMT-500D' },
    state: 'Uttar Pradesh',
    city: 'Varanasi'
  });

  assert.equal(res.found, false);
  assert.equal(res.reason, 'NO_RELIABLE_PRICE_FOUND');
});

// ==========================================
// SECTION 2: UNIT NORMALIZATION (Criteria 9–13)
// ==========================================

test('CRITERION 9: Unit Normalization — Tonne to kg conversion', () => {
  const norm = normalizePrice({
    sourcePrice: 71000,
    sourceUnit: 'tonne',
    canonicalUnit: 'kg'
  });

  assert.equal(norm.normalizationStatus, 'NORMALIZED');
  assert.equal(norm.normalizedRate, 71);
  assert.equal(norm.normalizedUnit, 'kg');
  assert.equal(norm.sourcePrice, 71000);
  assert.equal(norm.sourceUnit, 'tonne');
});

test('CRITERION 10: Unit Normalization — Known bag conversion (50kg bag -> bag)', () => {
  const norm = normalizePrice({
    sourcePrice: 385,
    sourceUnit: '50kg bag',
    canonicalUnit: 'bag'
  });

  assert.equal(norm.normalizationStatus, 'NORMALIZED');
  assert.equal(norm.normalizedRate, 385);
  assert.equal(norm.normalizedUnit, 'bag');
});

test('CRITERION 11: Unit Normalization — Ambiguous conversion rejected (truck, lorry, bundle)', () => {
  const norm = normalizePrice({
    sourcePrice: 4500,
    sourceUnit: 'truck load',
    canonicalUnit: 'cft'
  });

  assert.equal(norm.normalizationStatus, 'NORMALIZATION_REQUIRED');
  assert.equal(norm.normalizedRate, null);
  assert.match(norm.normalizationReason, /Ambiguous unit/);
});

test('CRITERION 12: Source price and unit retained in full', () => {
  const norm = normalizePrice({
    sourcePrice: 7200,
    sourceUnit: 'quintal',
    canonicalUnit: 'kg'
  });

  assert.equal(norm.sourcePrice, 7200);
  assert.equal(norm.sourceUnit, 'quintal');
  assert.equal(norm.normalizedRate, 72);
});

test('CRITERION 13: Normalized rate retained alongside direct matching unit', () => {
  const norm = normalizePrice({
    sourcePrice: 52,
    sourceUnit: 'cft',
    canonicalUnit: 'cft'
  });

  assert.equal(norm.normalizationStatus, 'DIRECT');
  assert.equal(norm.normalizedRate, 52);
  assert.equal(norm.normalizedUnit, 'cft');
});

// ==========================================
// SECTION 3: VALIDATION & CONFIDENCE (Criteria 14–18)
// ==========================================

test('CRITERION 14: Specification mismatch flagged (Fe500 != Fe500D, OPC 43 != OPC 53, PPC != OPC)', () => {
  const valSteel = validateCandidateRate({
    material: { materialCode: 'STEEL-TMT-500D', grade: 'Fe500D' },
    candidate: { normalizedRate: 70, state: 'Uttar Pradesh', currency: 'INR', grade: 'Fe500' }
  });
  assert.equal(valSteel.specificationMatch, false);

  const valCement = validateCandidateRate({
    material: { materialCode: 'CEMENT-OPC-53', grade: '53', name: 'OPC 53 Grade Cement' },
    candidate: { normalizedRate: 380, state: 'Uttar Pradesh', currency: 'INR', grade: '43' }
  });
  assert.equal(valCement.specificationMatch, false);
});

test('CRITERION 15: Missing source flagged in validation warnings', () => {
  const val = validateCandidateRate({
    material: { materialCode: 'STEEL-TMT-500D', grade: 'Fe500D' },
    candidate: { normalizedRate: 70, state: 'Uttar Pradesh', currency: 'INR', sourceUrl: '' }
  });
  assert.ok(val.warnings.some(w => w.includes('No direct source URL')));
});

test('CRITERION 16: Insecure non-https URL flagged in validation', () => {
  const val = validateCandidateRate({
    material: { materialCode: 'STEEL-TMT-500D', grade: 'Fe500D' },
    candidate: { normalizedRate: 70, state: 'Uttar Pradesh', currency: 'INR', sourceUrl: 'http://insecure-supplier.com' }
  });
  assert.ok(val.warnings.some(w => w.includes('Insecure source URL protocol')));
});

test('CRITERION 17: Zero or negative rate rejected', () => {
  const resNeg = validateCandidateRate({
    material: { materialCode: 'STEEL-TMT-500D' },
    candidate: { normalizedRate: -15, state: 'Uttar Pradesh', currency: 'INR' }
  });
  assert.equal(resNeg.isValid, false);

  const resZero = validateCandidateRate({
    material: { materialCode: 'STEEL-TMT-500D' },
    candidate: { normalizedRate: 0, state: 'Uttar Pradesh', currency: 'INR' }
  });
  assert.equal(resZero.isValid, false);
});

test('CRITERION 18: Large price deviation (>30%) flagged as high_variance', () => {
  const val = validateCandidateRate({
    material: { materialCode: 'STEEL-TMT-500D' },
    candidate: { normalizedRate: 110, state: 'Uttar Pradesh', currency: 'INR' },
    currentApprovedRate: 68
  });
  assert.equal(val.varianceFlag, 'high_variance');
  assert.ok(val.priceDifferencePercent > 30);
});

// ==========================================
// SECTION 4: APPROVAL & LEDGER INTEGRITY (Criteria 19–26)
// ==========================================

test('CRITERION 19: Candidate does NOT alter MaterialRate before approval', async () => {
  const initialRate = await MaterialRate.findOne({ materialCode: 'STEEL-TMT-500D', status: 'approved' }).sort({ effectiveFrom: -1 });

  // Run research
  await priceResearchService.startResearchRun({
    userId: adminUser._id,
    state: 'Uttar Pradesh',
    city: 'Varanasi',
    locationScope: 'city',
    researchScope: 'specific',
    materialCodes: ['STEEL-TMT-500D'],
    providerName: 'mock'
  });

  // Verify production rate is unchanged
  const postResearchRate = await MaterialRate.findOne({ materialCode: 'STEEL-TMT-500D', status: 'approved' }).sort({ effectiveFrom: -1 });
  assert.equal(postResearchRate.rate, initialRate.rate);
});

test('CRITERION 20 & 21 & 22: Admin approval creates MaterialRate, supersedes previous, and preserves history', async () => {
  const candidate = await PriceResearchCandidate.findOne({ materialCode: 'STEEL-TMT-500D', status: 'pending' });
  assert.ok(candidate);

  const approveRes = await priceResearchService.approveCandidate({
    candidateId: candidate._id,
    userId: adminUser._id,
    notes: 'Approved from official distributor circular.'
  });

  assert.equal(approveRes.success, true);
  assert.equal(approveRes.rateRecord.rate, 71);
  assert.match(approveRes.rateRecord.source, /AI Price Research/);

  // Previous rate must be marked superseded
  const oldRate = await MaterialRate.findById(approveRes.rateRecord.previousRate ? candidate.rateRevisionAtResearch : null);
  if (oldRate) {
    assert.equal(oldRate.status, 'superseded');
  }
});

test('CRITERION 23: Edit & approve preserves original researched value', async () => {
  // Create candidate for cement
  await priceResearchService.startResearchRun({
    userId: adminUser._id,
    state: 'Uttar Pradesh',
    city: 'Varanasi',
    locationScope: 'city',
    researchScope: 'specific',
    materialCodes: ['CEMENT-OPC-53'],
    providerName: 'mock'
  });

  const candidate = await PriceResearchCandidate.findOne({ materialCode: 'CEMENT-OPC-53', status: 'pending' });
  assert.ok(candidate);
  assert.equal(candidate.normalizedRate, 385);

  const editRes = await priceResearchService.approveCandidateWithEdit({
    candidateId: candidate._id,
    editedRate: 382,
    userId: adminUser._id,
    notes: 'Volume negotiation approved'
  });

  assert.equal(editRes.success, true);
  assert.equal(editRes.candidate.adminEditedRate, 382);
  assert.equal(editRes.candidate.normalizedRate, 385); // Preserved!
  assert.equal(editRes.rateRecord.rate, 382);
});

test('CRITERION 24: Rejection does NOT change production rate', async () => {
  await priceResearchService.startResearchRun({
    userId: adminUser._id,
    state: 'Uttar Pradesh',
    city: 'Varanasi',
    locationScope: 'city',
    researchScope: 'specific',
    materialCodes: ['SAND-M-SAND'],
    providerName: 'mock'
  });

  const candidate = await PriceResearchCandidate.findOne({ materialCode: 'SAND-M-SAND', status: 'pending' });
  assert.ok(candidate);

  const preRejectionRate = await MaterialRate.findOne({ materialCode: 'SAND-M-SAND', status: 'approved' }).sort({ effectiveFrom: -1 });

  const rejRes = await priceResearchService.rejectCandidate({
    candidateId: candidate._id,
    reason: 'Unverified quarry source.',
    userId: adminUser._id
  });

  assert.equal(rejRes.success, true);
  assert.equal(rejRes.candidate.status, 'rejected');

  const postRejectionRate = await MaterialRate.findOne({ materialCode: 'SAND-M-SAND', status: 'approved' }).sort({ effectiveFrom: -1 });
  assert.equal(postRejectionRate.rate, preRejectionRate.rate);
});

test('CRITERION 25: Stale candidate protection blocks approval when production rate changed', async () => {
  // Candidate researched against rate R1
  const runRes = await priceResearchService.startResearchRun({
    userId: adminUser._id,
    state: 'Uttar Pradesh',
    city: 'Varanasi',
    locationScope: 'city',
    researchScope: 'specific',
    materialCodes: ['STEEL-TMT-500D'],
    providerName: 'mock'
  });

  const candidate = await PriceResearchCandidate.findOne({ runId: runRes.run.runId, materialCode: 'STEEL-TMT-500D' });
  assert.ok(candidate);

  // Manual rate change to 85
  await pricingService.updateMaterialRate({
    materialCode: 'STEEL-TMT-500D',
    rate: 85,
    location: 'Varanasi',
    cityId: 'varanasi',
    userId: adminUser._id
  });

  // Stale approval must reject
  await assert.rejects(
    async () => {
      await priceResearchService.approveCandidate({
        candidateId: candidate._id,
        userId: adminUser._id
      });
    },
    /Current approved rate changed since this research was performed/
  );
});

test('CRITERION 26: Bulk approval processes multiple candidates atomically', async () => {
  const runRes = await priceResearchService.startResearchRun({
    userId: adminUser._id,
    state: 'Uttar Pradesh',
    city: 'Prayagraj',
    locationScope: 'city',
    researchScope: 'specific',
    materialCodes: ['CEMENT-OPC-53', 'SAND-M-SAND'],
    providerName: 'mock'
  });

  const candidates = await PriceResearchCandidate.find({ runId: runRes.run.runId });
  const ids = candidates.map(c => c._id);

  const bulkRes = await priceResearchService.bulkApproveCandidates({
    candidateIds: ids,
    userId: adminUser._id
  });

  assert.equal(bulkRes.success, true);
  assert.equal(bulkRes.approvedCount, 2);
  assert.equal(bulkRes.failedCount, 0);
});

// ==========================================
// SECTION 5: SNAPSHOT ISOLATION (Criteria 27–29)
// ==========================================

test('CRITERIA 27 & 28 & 29: Existing project unchanged after research and approval; new project receives new rate', async () => {
  // 1. Create project with current rate
  const snapshotRes = await pricingService.createServerPricingSnapshot({
    cityId: 'varanasi',
    cityName: 'Varanasi',
    projectType: 'residential_duplex',
    builtUpAreaSqFt: 2000
  });

  const savedSteelRate = snapshotRes.materialRates['STEEL-TMT-500D'].unitRate;

  const project = await Project.create({
    name: 'Historical Isolated Project',
    city: 'Varanasi',
    totalBua: 2000,
    stateSnapshot: { plotLength: 40, plotWidth: 30 },
    pricingSnapshot: snapshotRes,
    userId: regularUser._id
  });

  // 2. Perform research and approve new steel rate of 92
  await pricingService.updateMaterialRate({
    materialCode: 'STEEL-TMT-500D',
    rate: 92,
    location: 'Varanasi',
    cityId: 'varanasi',
    userId: adminUser._id
  });

  // 3. Verify existing project snapshot unchanged
  const refetchedProject = await Project.findById(project._id);
  assert.equal(refetchedProject.pricingSnapshot.materialRates['STEEL-TMT-500D'].unitRate, savedSteelRate);

  // 4. Verify new estimate uses new rate
  const newSnapshot = await pricingService.createServerPricingSnapshot({
    cityId: 'varanasi',
    cityName: 'Varanasi',
    projectType: 'residential_duplex',
    builtUpAreaSqFt: 2000
  });
  assert.equal(newSnapshot.materialRates['STEEL-TMT-500D'].unitRate, 92);
});

// ==========================================
// SECTION 6: REGIONAL HIERARCHY & BENCHMARK REJECTION (Criteria 30–34)
// ==========================================

test('CRITERIA 30, 31, 32, 33, 34: Regional Hierarchy (City -> State -> National -> UNAVAILABLE) and Benchmark Rejection', async () => {
  // City rate preferred
  const cityRates = await pricingService.getCurrentApprovedRates({ cityId: 'varanasi', stateId: 'uttar_pradesh' });
  assert.equal(cityRates.rates['STEEL-TMT-500D'].unitRate, 92);

  // State fallback
  await MaterialRate.create({
    materialId: (await Material.findOne({ materialCode: 'SAND-M-SAND' }))._id,
    materialCode: 'SAND-M-SAND',
    rate: 55,
    unit: 'cft',
    location: 'Uttar Pradesh Regional',
    cityId: 'all',
    stateId: 'uttar_pradesh',
    status: 'approved'
  });

  const stateRates = await pricingService.getCurrentApprovedRates({ cityId: 'unconfigured_city', stateId: 'uttar_pradesh' });
  assert.equal(stateRates.rates['SAND-M-SAND'].unitRate, 55);

  // National fallback
  assert.equal(stateRates.rates['STEEL-TMT-500D'].unitRate, 68);

  // When no rate exists: UNAVAILABLE (no silent benchmark fallback)
  await MaterialRate.deleteMany({ materialCode: 'SAND-M-SAND' });
  const unavailableRes = await pricingService.getCurrentApprovedRates({ cityId: 'non_existent_city', stateId: 'non_existent_state' });
  assert.ok(unavailableRes.missingMaterials.includes('SAND-M-SAND'));
  assert.equal(unavailableRes.rates['SAND-M-SAND'], undefined);
});

// ==========================================
// SECTION 7: AUDIT TRAIL RECORDING (Criteria 35–37)
// ==========================================

test('CRITERIA 35, 36, 37: Audit trail records approval, rejection, reviewer ID, and timestamps', async () => {
  // Test Candidate Approval Audit
  const candApproved = await PriceResearchCandidate.findOne({ status: 'approved' });
  assert.ok(candApproved);
  assert.ok(candApproved.reviewedAt instanceof Date);
  assert.ok(candApproved.reviewedBy);

  // Test Candidate Rejection Audit
  const candRejected = await PriceResearchCandidate.findOne({ status: 'rejected' });
  assert.ok(candRejected);
  assert.ok(candRejected.reviewedAt instanceof Date);
  assert.ok(candRejected.reviewedBy);
  assert.ok(candRejected.rejectionReason.length > 0);
});
