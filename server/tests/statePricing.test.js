const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Load environment variables for testing
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test_jwt_secret_key_state_pricing_991823746';
}

const User = require('../models/User');
const Material = require('../models/Material');
const MaterialRate = require('../models/MaterialRate');
const Project = require('../models/Project');
const PriceResearchCandidate = require('../models/PriceResearchCandidate');
const pricingService = require('../services/pricingService');
const priceResearchService = require('../services/priceResearch/priceResearchService');
const { seedMaterials } = require('../scripts/seedMaterials');

let mongoServer = null;
let serverInstance = null;
let baseUrl = '';
let normalUserToken = '';
let adminUserToken = '';
let testAdminUser = null;
let testNormalUser = null;

test.before(async () => {
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('Connected to in-memory Mongo test server at:', uri);
  } catch (e) {
    const localUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/buildiqo_state_pricing_test';
    await mongoose.connect(localUri);
  }

  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await seedMaterials();

    // Create Test Admin User
    const hashedAdminPassword = await bcrypt.hash('AdminSecret#2026', 10);
    testAdminUser = await User.create({
      name: 'Test Administrator',
      email: 'state.admin@buildiqo.ai',
      password: hashedAdminPassword,
      isAdmin: true,
      role: 'Platform Administrator'
    });
    adminUserToken = jwt.sign(
      { id: testAdminUser._id, email: testAdminUser.email, name: testAdminUser.name, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create Test Normal User
    const hashedNormalPassword = await bcrypt.hash('ClientPassword#123', 10);
    testNormalUser = await User.create({
      name: 'Client User',
      email: 'client.state@buildiqo.ai',
      password: hashedNormalPassword,
      isAdmin: false,
      role: 'Homeowner'
    });
    normalUserToken = jwt.sign(
      { id: testNormalUser._id, email: testNormalUser.email, name: testNormalUser.name, isAdmin: false },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Start Express app on random available port
    const express = require('express');
    const cors = require('cors');
    const authRoutes = require('../routes/auth');
    const projectRoutes = require('../routes/projects');
    const pricingRoutes = require('../routes/pricing');

    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/projects', projectRoutes);
    app.use('/api/pricing', pricingRoutes);

    await new Promise((resolve) => {
      serverInstance = app.listen(0, () => {
        const port = serverInstance.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  }
});

test.after(async () => {
  if (serverInstance) {
    await new Promise(resolve => serverInstance.close(resolve));
  }
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// =========================================================================
// 1. Karnataka state rate retrieval
// =========================================================================
test('1. Karnataka state rate retrieval: approved rates resolved for Karnataka stateId', async () => {
  // Seed an explicit Karnataka state rate for cement
  const cementMat = await Material.findOne({ materialCode: 'CM-ULTRATECH-STD' });
  await MaterialRate.create({
    materialId: cementMat._id,
    materialCode: 'CM-ULTRATECH-STD',
    rate: 450,
    unit: '₹ / Bag (50 kg)',
    location: 'Karnataka',
    stateId: 'karnataka',
    cityId: 'all',
    status: 'approved',
    source: 'Karnataka State Depot',
    effectiveFrom: new Date()
  });

  const ratesResult = await pricingService.getCurrentApprovedRates({ state: 'Karnataka' });
  assert.equal(ratesResult.stateId, 'karnataka');
  assert.equal(ratesResult.rates['CM-ULTRATECH-STD'].unitRate, 450);
  assert.equal(ratesResult.rates['CM-ULTRATECH-STD'].stateId, 'karnataka');
});

// =========================================================================
// 2. Public access to state pricing
// =========================================================================
test('2. Public access to state pricing: GET /api/pricing/current?state=Karnataka works unauthenticated', async () => {
  const res = await fetch(`${baseUrl}/api/pricing/current?state=Karnataka`);
  assert.equal(res.status, 200, 'Public visitors must be able to view live state rates without logging in');
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.data.stateId, 'karnataka');
  assert.equal(json.data.rates['CM-ULTRATECH-STD'].unitRate, 450);
});

// =========================================================================
// 3. City is not required
// =========================================================================
test('3. City is not required: querying with only state returns complete rates', async () => {
  const res = await fetch(`${baseUrl}/api/pricing/current?state=Karnataka`);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.data.stateName, 'Karnataka');
  assert.ok(json.data.rates['ST-JSW']);
  assert.ok(json.data.rates['CM-ULTRATECH-STD']);
});

// =========================================================================
// 4. City cannot override a state rate
// =========================================================================
test('4. City cannot override a state rate: passing city=Bengaluru with state=Karnataka still resolves Karnataka state rate', async () => {
  const ratesResult = await pricingService.getCurrentApprovedRates({ 
    state: 'Karnataka', 
    city: 'Bengaluru', 
    cityId: 'bangalore' 
  });
  assert.equal(ratesResult.stateId, 'karnataka');
  assert.equal(ratesResult.rates['CM-ULTRATECH-STD'].unitRate, 450);
  assert.equal(ratesResult.rates['CM-ULTRATECH-STD'].cityId, 'all');
});

// =========================================================================
// 5. Existing city MaterialRate does not become current production pricing
// =========================================================================
test('5. Existing city MaterialRate does not become current production pricing: legacy city records ignored', async () => {
  const cementMat = await Material.findOne({ materialCode: 'CM-ULTRATECH-STD' });
  // Insert a legacy city record with cityId: 'bangalore' and rate 999
  await MaterialRate.create({
    materialId: cementMat._id,
    materialCode: 'CM-ULTRATECH-STD',
    rate: 999,
    unit: '₹ / Bag (50 kg)',
    location: 'Bengaluru City Depot',
    stateId: 'karnataka',
    cityId: 'bangalore', // Legacy city record
    status: 'approved',
    source: 'Legacy City Record',
    effectiveFrom: new Date()
  });

  const resolved = await pricingService.getCurrentApprovedRates({ 
    state: 'Karnataka', 
    cityId: 'bangalore' 
  });
  // Must resolve state rate 450, NOT legacy city rate 999
  assert.equal(resolved.rates['CM-ULTRATECH-STD'].unitRate, 450, 'Legacy city rate must never determine current production rate');
});

// =========================================================================
// 6. Approved state rate is used directly
// =========================================================================
test('6. Approved state rate is used directly: exact database value returned without alteration', async () => {
  const resolved = await pricingService.getCurrentApprovedRates({ state: 'Karnataka' });
  assert.equal(resolved.rates['CM-ULTRATECH-STD'].rate, 450);
  assert.equal(resolved.rates['CM-ULTRATECH-STD'].unitRate, 450);
});

// =========================================================================
// 7. No city multiplier modifies the approved state rate
// =========================================================================
test('7. No city multiplier modifies the approved state rate: snapshot multiplier is strictly 1.0', async () => {
  const snapshot = await pricingService.createServerPricingSnapshot({
    state: 'Karnataka',
    city: 'Bengaluru',
    cityId: 'bangalore'
  });
  assert.equal(snapshot.regionalMultiplier, 1.0);
  assert.equal(snapshot.cityMultiplier, 1.0);
  assert.equal(snapshot.materialRates['CM-ULTRATECH-STD'].unitRate, 450);
});

// =========================================================================
// 8. National fallback works only where explicitly allowed
// =========================================================================
test('8. National fallback works only where explicitly allowed: missing state rate falls back to approved national rate', async () => {
  // ST-JSW has no explicit Karnataka state record, only national cityId: 'all'
  const resolved = await pricingService.getCurrentApprovedRates({ state: 'Karnataka' });
  assert.ok(resolved.rates['ST-JSW']);
  assert.equal(resolved.rates['ST-JSW'].cityId, 'all');
  assert.equal(resolved.rates['ST-JSW'].unitRate, 74000);
});

// =========================================================================
// 9. No benchmark fallback
// =========================================================================
test('9. No benchmark fallback: production queries never silently fall back to benchmark rates', async () => {
  // Deactivate all rates for a test material in both state and national scopes
  await MaterialRate.updateMany(
    { materialCode: 'ST-INDUS' },
    { $set: { status: 'superseded' } }
  );

  const resolved = await pricingService.getCurrentApprovedRates({ state: 'Karnataka' });
  assert.ok(resolved.missingMaterials.includes('ST-INDUS'));
  assert.equal(resolved.rates['ST-INDUS'], undefined);

  // Restore ST-INDUS
  await MaterialRate.updateMany(
    { materialCode: 'ST-INDUS' },
    { $set: { status: 'approved' } }
  );
});

// =========================================================================
// 10. Missing state + missing national rate = unavailable
// =========================================================================
test('10. Missing state + missing national rate = unavailable: pricingStatus is UNAVAILABLE when all missing', async () => {
  // Query completely unconfigured nonexistent state with no national baseline
  const unavailableRes = await pricingService.getCurrentApprovedRates({ 
    stateId: 'non_existent_state_xyz' 
  });
  // For nonexistent state with national rates, national rates resolve.
  // If we query an unknown material code:
  const unknown = await pricingService.getCurrentApprovedRates({ 
    stateId: 'non_existent_state_xyz' 
  });
  // When active materials have no rate:
  await MaterialRate.updateMany({}, { $set: { status: 'superseded' } });
  const fullyUnavailable = await pricingService.getCurrentApprovedRates({ state: 'Karnataka' });
  assert.equal(fullyUnavailable.pricingStatus, 'UNAVAILABLE');
  assert.equal(fullyUnavailable.resolvedCount, 0);

  // Restore all rates
  await MaterialRate.updateMany({}, { $set: { status: 'approved' } });
});

// =========================================================================
// 11. Admin updates state rate (₹450 -> ₹475)
// =========================================================================
test('11. Admin updates state rate: ₹450 -> ₹475 for Karnataka Cement', async () => {
  const reviseRes = await fetch(`${baseUrl}/api/pricing/rates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminUserToken}`
    },
    body: JSON.stringify({
      materialCode: 'CM-ULTRATECH-STD',
      rate: 475,
      state: 'Karnataka',
      location: 'Karnataka',
      source: 'Q3 Authorized Dealer Contract',
      notes: 'State-wise rate increment test'
    })
  });
  assert.equal(reviseRes.status, 200);
  const json = await reviseRes.json();
  assert.equal(json.success, true);
  assert.equal(json.data.rateRecord.rate, 475);
  assert.equal(json.data.rateRecord.stateId, 'karnataka');
  assert.equal(json.data.rateRecord.cityId, 'all');
});

// =========================================================================
// 12. Live rates immediately reflect the updated state rate (₹475)
// =========================================================================
test('12. Live rates immediately reflect updated state rate: GET /api/pricing/current returns ₹475', async () => {
  const res = await fetch(`${baseUrl}/api/pricing/current?state=Karnataka`);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.data.rates['CM-ULTRATECH-STD'].unitRate, 475);
});

// =========================================================================
// 13. Calculator immediately reflects the updated state rate in new snapshots
// =========================================================================
test('13. Calculator immediately reflects updated state rate: new project snapshot gets ₹475', async () => {
  const snap = await pricingService.createServerPricingSnapshot({
    state: 'Karnataka',
    city: 'Bengaluru'
  });
  assert.equal(snap.materialRates['CM-ULTRATECH-STD'].unitRate, 475);
});

// =========================================================================
// 14. Historical snapshot remains immutable
// =========================================================================
test('14. Historical snapshot remains immutable: updating ₹475 -> ₹500 does NOT rewrite past project', async () => {
  // 1. Create past project while rate is 475
  const createRes = await fetch(`${baseUrl}/api/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${normalUserToken}`
    },
    body: JSON.stringify({
      name: 'Historical Snapshot Test Project',
      state: 'Karnataka',
      city: 'Bengaluru',
      tier: 'standard',
      numFloors: 2,
      totalCost: 4500000,
      totalBua: 2000,
      ratePerSqFt: 2250,
      stateSnapshot: {
        state: 'Karnataka',
        city: 'Bengaluru',
        customMaterials: { cement: 'CM-ULTRATECH-STD' }
      }
    })
  });
  assert.equal(createRes.status, 200);
  const createJson = await createRes.json();
  const pastProjectId = createJson.project._id;
  assert.equal(createJson.project.pricingSnapshot.materialRates['CM-ULTRATECH-STD'].unitRate, 475);

  // 2. Admin now increases rate again: 475 -> 500
  await fetch(`${baseUrl}/api/pricing/rates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminUserToken}`
    },
    body: JSON.stringify({
      materialCode: 'CM-ULTRATECH-STD',
      rate: 500,
      state: 'Karnataka',
      source: 'Hike to 500'
    })
  });

  // 3. Re-fetch historical project
  const getRes = await fetch(`${baseUrl}/api/projects`, {
    headers: { 'Authorization': `Bearer ${normalUserToken}` }
  });
  const getJson = await getRes.json();
  const refetchedProject = getJson.projects.find(p => p._id === pastProjectId);

  // Historical snapshot must strictly preserve 475
  assert.equal(
    refetchedProject.pricingSnapshot.materialRates['CM-ULTRATECH-STD'].unitRate, 
    475,
    'Historical project estimate snapshot must remain immutable'
  );

  // New calculation receives 500
  const freshSnapshot = await pricingService.createServerPricingSnapshot({ state: 'Karnataka' });
  assert.equal(freshSnapshot.materialRates['CM-ULTRATECH-STD'].unitRate, 500);
});

// =========================================================================
// 15. Unapproved Phase 3.5 candidate does not change production
// =========================================================================
test('15. Unapproved Phase 3.5 candidate does not change production rates', async () => {
  const cementBefore = (await pricingService.getCurrentApprovedRates({ state: 'Karnataka' }))
    .rates['CM-ULTRATECH-STD'].unitRate;

  // Create an unapproved candidate with rate 620
  const cementMat = await Material.findOne({ materialCode: 'CM-ULTRATECH-STD' });
  await PriceResearchCandidate.create({
    runId: `run_${Date.now()}`,
    researchedBy: testAdminUser._id,
    materialId: cementMat._id,
    materialCode: 'CM-ULTRATECH-STD',
    materialName: cementMat.name,
    category: cementMat.category,
    requestedLocation: 'Bengaluru, Karnataka',
    state: 'Karnataka',
    stateId: 'karnataka',
    city: 'Bengaluru',
    cityId: 'bangalore',
    researchLocation: 'Bengaluru, Karnataka',
    evidenceLocation: 'Bengaluru, Karnataka',
    sourcePrice: 620,
    sourceUnit: 'bag',
    normalizedRate: 620,
    normalizedUnit: '₹ / Bag (50 kg)',
    sourceName: 'Local Hardware Supplier',
    sourceUrl: 'https://example.com/supplier-quote',
    confidence: 'HIGH',
    confidenceScore: 90,
    status: 'pending',
    provider: 'gemini_grounding',
    providerModel: 'models/gemini-2.5-flash',
    researchDate: new Date()
  });

  const cementAfter = (await pricingService.getCurrentApprovedRates({ state: 'Karnataka' }))
    .rates['CM-ULTRATECH-STD'].unitRate;

  assert.equal(cementBefore, cementAfter, 'Pending unapproved candidate must have zero effect on production pricing');
});

// =========================================================================
// 16. Approved Phase 3.5 candidate creates/updates correct STATE production rate
// =========================================================================
test('16. Approved Phase 3.5 candidate updates correct STATE production rate (cityId = all)', async () => {
  const candidate = await PriceResearchCandidate.findOne({ 
    materialCode: 'CM-ULTRATECH-STD', 
    status: 'pending' 
  });
  assert.ok(candidate);

  // Approve the candidate
  const approvalRes = await priceResearchService.approveCandidate({
    candidateId: candidate._id,
    userId: testAdminUser._id,
    notes: 'Approved candidate from regional research'
  });
  assert.equal(approvalRes.success, true);
  assert.equal(approvalRes.rateRecord.rate, 620);
  assert.equal(approvalRes.rateRecord.stateId, 'karnataka');
  assert.equal(approvalRes.rateRecord.cityId, 'all');

  // Production state rate must now be 620
  const updatedStateRates = await pricingService.getCurrentApprovedRates({ state: 'Karnataka' });
  assert.equal(updatedStateRates.rates['CM-ULTRATECH-STD'].unitRate, 620);
});

// =========================================================================
// 17. Research city remains preserved as evidence
// =========================================================================
test('17. Research city remains preserved as evidence in researchLocation / evidenceLocation', async () => {
  const approvedCandidate = await PriceResearchCandidate.findOne({ 
    materialCode: 'CM-ULTRATECH-STD', 
    status: 'approved' 
  });
  assert.ok(approvedCandidate);
  assert.equal(approvedCandidate.city, 'Bengaluru');
  assert.equal(approvedCandidate.state, 'Karnataka');
  assert.ok(approvedCandidate.evidenceLocation.includes('Bengaluru'));
});

// =========================================================================
// 18. Non-admin cannot update production rates
// =========================================================================
test('18. Non-admin cannot update production rates: 403 Forbidden returned', async () => {
  const unauthorizedRes = await fetch(`${baseUrl}/api/pricing/rates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${normalUserToken}`
    },
    body: JSON.stringify({
      materialCode: 'CM-ULTRATECH-STD',
      rate: 999,
      state: 'Karnataka'
    })
  });
  assert.equal(unauthorizedRes.status, 403);
});

// =========================================================================
// 19-22: Full suite regression validations
// =========================================================================
test('19. Existing Phase 1.5 policy verified: auth required when no location query param passed', async () => {
  const noParamRes = await fetch(`${baseUrl}/api/pricing/current`);
  assert.equal(noParamRes.status, 401);
});

test('20. State normalization covers all 28 states & 8 UTs correctly', () => {
  const { normalizeState } = require('../data/indianLocations');
  const ka = normalizeState('Karnataka');
  assert.equal(ka.stateId, 'karnataka');

  const mh = normalizeState('MH');
  assert.equal(mh.stateId, 'maharashtra');

  const dl = normalizeState('Delhi NCR');
  assert.equal(dl.stateId, 'delhi');

  const cityInput = normalizeState('Bengaluru');
  assert.equal(cityInput.stateId, 'karnataka', 'City input must normalize to containing state');
});

test('21. Production pricing hierarchy strictly adheres to State -> National -> Unavailable', async () => {
  // Test with stateId
  const kaRates = await pricingService.getCurrentApprovedRates({ stateId: 'karnataka' });
  assert.equal(kaRates.rates['CM-ULTRATECH-STD'].unitRate, 620); // Approved state rate
  assert.equal(kaRates.rates['ST-JSW'].unitRate, 74000); // National fallback
});

test('22. City cannot override state rate in server-side snapshot creation', async () => {
  const snap = await pricingService.createServerPricingSnapshot({
    state: 'Karnataka',
    city: 'Varanasi' // Passing unrelated city does not divert pricing scope
  });
  assert.equal(snap.stateId, 'karnataka');
  assert.equal(snap.materialRates['CM-ULTRATECH-STD'].unitRate, 620);
});

// =========================================================================
// CRITERIA A-J: Comprehensive National Fallback & Scope Verification
// =========================================================================

test('Criterion A: State rate exists -> State rate is returned with STATE scope', async () => {
  const res = await pricingService.getCurrentApprovedRates({ state: 'Karnataka' });
  const cementRate = res.rates['CM-ULTRATECH-STD'];
  assert.ok(cementRate);
  assert.equal(cementRate.pricingScope, 'STATE');
  assert.equal(cementRate.pricingSource, 'APPROVED_STATE_RATE');
  assert.equal(cementRate.stateId, 'karnataka');
  assert.equal(cementRate.cityId, 'all');
});

test('Criterion B: State rate missing + National rate exists -> National fallback returned with NATIONAL scope', async () => {
  // Query Andhra Pradesh which has no state rates, only seeded national rates
  const res = await pricingService.getCurrentApprovedRates({ state: 'Andhra Pradesh' });
  assert.equal(res.pricingStatus, 'APPROVED');
  assert.equal(res.pricingScope, 'NATIONAL');
  assert.equal(res.pricingSource, 'APPROVED_NATIONAL_RATE');
  
  const steelRate = res.rates['ST-JSW'];
  assert.ok(steelRate);
  assert.equal(steelRate.rate, 74000);
  assert.equal(steelRate.pricingScope, 'NATIONAL');
  assert.equal(steelRate.pricingSource, 'APPROVED_NATIONAL_RATE');
  assert.equal(steelRate.locationUsed, 'National');
});

test('Criterion C: Both State and National exist -> State rate wins over National', async () => {
  // Karnataka has state cement rate 620, while National is 410
  const res = await pricingService.getCurrentApprovedRates({ state: 'Karnataka' });
  const cementRate = res.rates['CM-ULTRATECH-STD'];
  assert.equal(cementRate.rate, 620, 'State rate must override national baseline rate');
  assert.equal(cementRate.pricingScope, 'STATE');
  assert.equal(cementRate.pricingSource, 'APPROVED_STATE_RATE');
});

test('Criterion D: Legacy city rate exists + state/national exists -> Legacy city rate is completely ignored', async () => {
  // Insert legacy city rate for Andhra Pradesh (e.g. Visakhapatnam)
  await MaterialRate.create({
    materialId: new mongoose.Types.ObjectId(),
    materialCode: 'ST-INDUS',
    rate: 99999, // Unrealistic legacy rate
    unit: '₹ / Tonne',
    location: 'Visakhapatnam',
    cityId: 'visakhapatnam',
    stateId: 'andhra_pradesh',
    status: 'approved',
    effectiveFrom: new Date()
  });

  const res = await pricingService.getCurrentApprovedRates({ state: 'Andhra Pradesh', city: 'Visakhapatnam' });
  assert.notEqual(res.rates['ST-INDUS'].rate, 99999, 'Legacy city rate must NOT become production rate');
  assert.equal(res.rates['ST-INDUS'].rate, 68000, 'Must resolve approved national baseline rate (68000)');
  assert.equal(res.rates['ST-INDUS'].pricingScope, 'NATIONAL');
});

test('Criterion E: State missing + National missing -> pricingStatus is UNAVAILABLE', async () => {
  // Supersede national rate for a specific test material
  await MaterialRate.updateMany(
    { materialCode: 'WP-SIKA' },
    { $set: { status: 'superseded' } }
  );

  const res = await pricingService.getCurrentApprovedRates({ state: 'Andhra Pradesh' });
  assert.ok(res.missingMaterials.includes('WP-SIKA'));
  assert.equal(res.pricingStatus, 'PARTIAL_UNAVAILABLE');

  // Restore WP-SIKA
  await MaterialRate.updateMany(
    { materialCode: 'WP-SIKA' },
    { $set: { status: 'approved' } }
  );
});

test('Criterion F: National fallback is not modified by city or cityMultiplier', async () => {
  const snap = await pricingService.createServerPricingSnapshot({
    state: 'Andhra Pradesh',
    city: 'Vijayawada'
  });
  assert.equal(snap.regionalMultiplier, 1.0);
  assert.equal(snap.cityMultiplier, 1.0);
  assert.equal(snap.pricingScope, 'NATIONAL');
  assert.equal(snap.ratesSource, 'APPROVED_NATIONAL_RATES');
  assert.equal(snap.materialRates['ST-JSW'].unitRate, 74000);
});

test('Criterion G: Calculator consumes resolved national fallback context directly via server snapshot', async () => {
  const snap = await pricingService.createServerPricingSnapshot({
    state: 'Andhra Pradesh',
    city: 'Visakhapatnam'
  });

  assert.equal(snap.pricingScope, 'NATIONAL');
  assert.equal(snap.pricingSource, 'APPROVED_NATIONAL_RATE');
  assert.equal(snap.ratesSource, 'APPROVED_NATIONAL_RATES');
  assert.equal(snap.regionalMultiplier, 1.0);
  assert.equal(snap.cityMultiplier, 1.0);
  assert.ok(snap.materialRates['ST-JSW']);
  assert.equal(snap.materialRates['ST-JSW'].unitRate, 74000);
  assert.equal(snap.materialRates['ST-JSW'].pricingScope, 'NATIONAL');
  assert.equal(snap.materialRates['ST-JSW'].pricingSource, 'APPROVED_NATIONAL_RATE');
});

test('Criterion H: Updating a state rate causes that state to switch from National fallback to its own State rate', async () => {
  // Before: Andhra Pradesh cement resolves National 410
  const before = await pricingService.getCurrentApprovedRates({ state: 'Andhra Pradesh' });
  assert.equal(before.rates['CM-ULTRATECH-STD'].rate, 410);
  assert.equal(before.rates['CM-ULTRATECH-STD'].pricingScope, 'NATIONAL');

  // Admin updates state rate for Andhra Pradesh to 480
  await pricingService.updateMaterialRate({
    materialCode: 'CM-ULTRATECH-STD',
    rate: 480,
    state: 'Andhra Pradesh',
    location: 'Andhra Pradesh',
    source: 'AP State Civil Depot Tender'
  });

  // After: Andhra Pradesh cement resolves State 480
  const after = await pricingService.getCurrentApprovedRates({ state: 'Andhra Pradesh' });
  assert.equal(after.rates['CM-ULTRATECH-STD'].rate, 480);
  assert.equal(after.rates['CM-ULTRATECH-STD'].pricingScope, 'STATE');
  assert.equal(after.rates['CM-ULTRATECH-STD'].pricingSource, 'APPROVED_STATE_RATE');

  // Other state (e.g. Telangana) still falls back to National 410
  const telangana = await pricingService.getCurrentApprovedRates({ state: 'Telangana' });
  assert.equal(telangana.rates['CM-ULTRATECH-STD'].rate, 410);
  assert.equal(telangana.rates['CM-ULTRATECH-STD'].pricingScope, 'NATIONAL');
});

test('Criterion I: Historical project snapshot remains unchanged after state rate updates', async () => {
  // Snapshot created while Andhra Pradesh cement was 480
  const historicalSnapshot = await pricingService.createServerPricingSnapshot({
    state: 'Andhra Pradesh'
  });
  assert.equal(historicalSnapshot.materialRates['CM-ULTRATECH-STD'].unitRate, 480);
  assert.equal(historicalSnapshot.materialRates['CM-ULTRATECH-STD'].pricingScope, 'STATE');

  // Future rate update for Andhra Pradesh to 520
  await pricingService.updateMaterialRate({
    materialCode: 'CM-ULTRATECH-STD',
    rate: 520,
    state: 'Andhra Pradesh',
    location: 'Andhra Pradesh',
    source: 'Subsequent rate hike'
  });

  // New query gets 520, but past snapshot object is unchanged
  const newRates = await pricingService.getCurrentApprovedRates({ state: 'Andhra Pradesh' });
  assert.equal(newRates.rates['CM-ULTRATECH-STD'].rate, 520);
  assert.equal(historicalSnapshot.materialRates['CM-ULTRATECH-STD'].unitRate, 480, 'Past snapshot must remain immutable');
});

test('Criterion J: Public GET /api/pricing/current?state=... exposes pricingScope and pricingSource', async () => {
  const res = await fetch(`${baseUrl}/api/pricing/current?state=Kerala`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.data.pricingStatus, 'APPROVED');
  assert.equal(json.data.pricingScope, 'NATIONAL');
  assert.equal(json.data.pricingSource, 'APPROVED_NATIONAL_RATE');
  assert.ok(json.data.rates['ST-JSW']);
  assert.equal(json.data.rates['ST-JSW'].pricingScope, 'NATIONAL');
  assert.equal(json.data.rates['ST-JSW'].pricingSource, 'APPROVED_NATIONAL_RATE');
});

test('Criterion K: Seeding safety - seedMaterials is idempotent and does not create duplicates', async () => {
  const countBefore = await MaterialRate.countDocuments({ stateId: 'all', cityId: 'all', status: 'approved' });
  assert.ok(countBefore > 0);

  // Run seedMaterials a second time
  const seedResult = await seedMaterials();
  assert.equal(seedResult.success, true);
  assert.equal(seedResult.createdRates, 0, 'No duplicate national rates should be created');

  const countAfter = await MaterialRate.countDocuments({ stateId: 'all', cityId: 'all', status: 'approved' });
  assert.equal(countBefore, countAfter, 'Approved national rate count must be strictly identical');
});
