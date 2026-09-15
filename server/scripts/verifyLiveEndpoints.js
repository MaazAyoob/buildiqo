const http = require('http');

const BASE_URL = 'http://localhost:5000';

async function req(urlPath, options = {}) {
  const url = new URL(urlPath, BASE_URL);
  const headers = options.headers || {};
  let body = options.body;
  if (body && typeof body === 'object') {
    body = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url.href, {
    method: options.method || 'GET',
    headers,
    body
  });

  const status = response.status;
  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    data = await response.text();
  }
  return { status, data };
}

async function runLiveVerification() {
  console.log('================================================================');
  console.log('BUILDIQO.AI PHASE 1.5 — LIVE ENDPOINT INTEGRATION VERIFICATION');
  console.log('================================================================\n');

  // STEP 4: Test /api/health
  console.log('--- STEP 4: Testing /api/health ---');
  const health = await req('/api/health');
  console.log('Status:', health.status);
  console.log('Response:', JSON.stringify(health.data, null, 2));
  if (health.status !== 200 || health.data.status !== 'ok') {
    throw new Error('Health check failed');
  }
  console.log('✅ STEP 4 PASSED\n');

  // STEP 5: Test Authenticated Pricing
  console.log('--- STEP 5: Testing Authenticated Pricing Hierarchy ---');
  // 5a. Unauthenticated GET /api/pricing/current must return 401
  const unauthPricing = await req('/api/pricing/current');
  console.log('Unauthenticated GET /api/pricing/current status:', unauthPricing.status);
  if (unauthPricing.status !== 401) {
    throw new Error('Unauthenticated pricing request did not return 401');
  }

  // Register a normal user to obtain JWT
  const normalUserEmail = `client_${Date.now()}@buildiqo.ai`;
  const registerNormal = await req('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Rohan Sharma',
      email: normalUserEmail,
      password: 'ClientPassword#2026',
      role: 'Homeowner'
    }
  });
  console.log('Normal User Registered, Token obtained:', Boolean(registerNormal.data.token));
  const normalToken = registerNormal.data.token;

  // 5b. Authenticated normal user GET /api/pricing/current?city=bangalore must return 200
  const authPricing = await req('/api/pricing/current?city=bangalore', {
    headers: { 'Authorization': `Bearer ${normalToken}` }
  });
  console.log('Authenticated GET /api/pricing/current status:', authPricing.status);
  console.log('Pricing Status:', authPricing.data.data?.pricingStatus);
  console.log('Resolved Rates Count:', Object.keys(authPricing.data.data?.rates || {}).length);
  console.log('Sample Steel Rate (ST-JSW):', authPricing.data.data?.rates?.['ST-JSW']);
  if (authPricing.status !== 200 || authPricing.data.data?.pricingStatus !== 'APPROVED') {
    throw new Error('Authenticated pricing resolution failed');
  }
  console.log('✅ STEP 5 PASSED\n');

  // STEP 6: Test Admin Rate Update
  console.log('--- STEP 6: Testing Admin Rate Update ---');
  // Login as seeded platform owner to get admin JWT
  const loginAdmin = await req('/api/auth/login', {
    method: 'POST',
    body: {
      emailOrPhone: 'admin@buildiqo.ai',
      password: 'BuildiqoAdminSecret#2026'
    }
  });
  if (loginAdmin.status !== 200 || !loginAdmin.data.token || !loginAdmin.data.user?.isAdmin) {
    throw new Error('Failed to login as seeded platform owner');
  }
  const adminToken = loginAdmin.data.token;
  console.log('Admin login verified. isAdmin:', loginAdmin.data.user.isAdmin);

  // Normal user attempting to POST /api/pricing/rates must be rejected with 403
  const normalUpdateAttempt = await req('/api/pricing/rates', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${normalToken}` },
    body: { materialCode: 'ST-JSW', rate: 99999 }
  });
  console.log('Normal user POST /api/pricing/rates status (expected 403):', normalUpdateAttempt.status);
  if (normalUpdateAttempt.status !== 403) {
    throw new Error('Normal user was not forbidden from updating rate');
  }

  // Admin posts approved rate revision
  const newRateValue = 76500;
  const adminUpdate = await req('/api/pricing/rates', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: {
      materialCode: 'ST-JSW',
      rate: newRateValue,
      location: 'National',
      cityId: 'all',
      source: 'Q3 Supplier Quote',
      notes: 'Live verification test revision'
    }
  });
  console.log('Admin rate update status:', adminUpdate.status);
  console.log('Admin rate update message:', adminUpdate.data.message);
  console.log('Previous Rate was:', adminUpdate.data.data?.previousRate);
  console.log('New Rate is:', adminUpdate.data.data?.rateRecord?.rate);
  console.log('Deployment note:', adminUpdate.data.data?.deploymentNote);
  if (adminUpdate.status !== 200 || adminUpdate.data.data?.rateRecord?.rate !== newRateValue) {
    throw new Error('Admin rate update failed');
  }
  console.log('✅ STEP 6 PASSED\n');

  // STEP 7: Test Rate History (Append-Only)
  console.log('--- STEP 7: Testing Append-Only Rate Audit History ---');
  const historyRes = await req('/api/pricing/materials/ST-JSW/history', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('Rate history endpoint status:', historyRes.status);
  const historyEntries = historyRes.data.data?.history || [];
  console.log(`Total history revisions found for ST-JSW: ${historyEntries.length}`);
  historyEntries.slice(0, 3).forEach((h, idx) => {
    console.log(`  [Revision ${idx + 1}] Rate: ₹${h.rate}/${h.unit} | Status: ${h.status} | Loc: ${h.location} | Source: ${h.source} | By: ${h.updatedBy?.name || 'Admin'} | Notes: "${h.notes || ''}"`);
  });
  if (historyRes.status !== 200 || historyEntries.length < 2) {
    throw new Error('History does not contain append-only revisions');
  }
  const hasApproved = historyEntries.some(h => h.status === 'approved');
  const hasSuperseded = historyEntries.some(h => h.status === 'superseded');
  if (!hasApproved || !hasSuperseded) {
    throw new Error('History must contain both approved current rate and superseded previous rates');
  }
  console.log('✅ STEP 7 PASSED\n');

  // STEP 8: Test Project Snapshot Creation
  console.log('--- STEP 8: Testing Server-Trusted Project Snapshot ---');
  const projectCreateRes = await req('/api/projects', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${normalToken}` },
    body: {
      name: 'Bangalore Contemporary Villa',
      city: 'bangalore',
      tier: 'standard',
      numFloors: 2,
      totalCost: 6850000,
      totalBua: 2800,
      ratePerSqFt: 2446,
      stateSnapshot: {
        city: 'bangalore',
        tier: 'standard',
        builtupArea: 2800,
        customMaterials: { steel: 'ST-JSW', cement: 'CM-ULTRATECH-STD' }
      }
    }
  });
  console.log('Project creation status:', projectCreateRes.status);
  const createdProject = projectCreateRes.data.project;
  const snapshot = createdProject.pricingSnapshot;
  console.log('Project ID:', createdProject._id);
  console.log('Snapshot ID:', snapshot?.snapshotId);
  console.log('Snapshot Currency:', snapshot?.currency);
  console.log('Snapshot City:', snapshot?.cityName);
  console.log('Snapshot Regional Multiplier:', snapshot?.regionalMultiplier);
  console.log('Snapshot Schema Version:', snapshot?.pricingSchemaVersion);
  console.log('Snapshot ST-JSW Unit Rate:', snapshot?.materialRates?.['ST-JSW']?.unitRate);
  console.log('Snapshot Labor Rates:', JSON.stringify(snapshot?.laborRates));
  console.log('Snapshot Tax Rates:', JSON.stringify(snapshot?.taxRates));
  console.log('Snapshot Overheads:', JSON.stringify(snapshot?.overheadParameters));

  if (!snapshot || !snapshot.snapshotId || !snapshot.materialRates?.['ST-JSW']) {
    throw new Error('Authoritative server pricing snapshot was not properly created');
  }
  console.log('✅ STEP 8 PASSED\n');

  // STEP 9: Change a rate and verify an old project remains unchanged
  console.log('--- STEP 9: Rate Mutation Isolation (Historical Immutability) ---');
  const rateBeforeHike = snapshot.materialRates['ST-JSW'].unitRate;
  console.log(`Original ST-JSW Rate inside saved project: ₹${rateBeforeHike}`);

  // Admin updates steel rate to a drastically different price (e.g. ₹92,000)
  const rateHikeRes = await req('/api/pricing/rates', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: {
      materialCode: 'ST-JSW',
      rate: 92000,
      location: 'Bangalore',
      cityId: 'bangalore',
      source: 'Major Market Spike',
      notes: 'Testing historical project isolation'
    }
  });
  console.log('Admin posted new market rate of ₹92,000. Status:', rateHikeRes.status);

  // Fetch current live pricing to confirm database rate changed
  const currentPricingAfterHike = await req('/api/pricing/current?city=bangalore', {
    headers: { 'Authorization': `Bearer ${normalToken}` }
  });
  const liveSteelRateNow = currentPricingAfterHike.data.data?.rates?.['ST-JSW']?.unitRate;
  console.log(`Current live database approved rate for ST-JSW is now: ₹${liveSteelRateNow}`);

  // Re-fetch the saved project
  const userProjectsRes = await req('/api/projects', {
    headers: { 'Authorization': `Bearer ${normalToken}` }
  });
  const refetchedProject = userProjectsRes.data.projects.find(p => p._id === createdProject._id);
  const preservedSnapshotRate = refetchedProject.pricingSnapshot.materialRates['ST-JSW'].unitRate;
  console.log(`Rate inside retrieved project pricing snapshot: ₹${preservedSnapshotRate}`);

  if (preservedSnapshotRate !== rateBeforeHike) {
    throw new Error(`VIOLATION: Historical project pricing changed from ₹${rateBeforeHike} to ₹${preservedSnapshotRate}`);
  }
  if (preservedSnapshotRate === liveSteelRateNow) {
    throw new Error('VIOLATION: Historical project snapshot was contaminated by live rate change!');
  }
  console.log(`SUCCESS: Saved project retains original rate (₹${preservedSnapshotRate}) despite live rate becoming ₹${liveSteelRateNow}.`);
  console.log('✅ STEP 9 PASSED\n');

  // STEP 10: Verify existing planner, payments, leads, subscriptions, BOQ
  console.log('--- STEP 10: Verifying Payments, Leads, Subscriptions Endpoints ---');
  
  // Leads API
  const leadRes = await req('/api/leads', {
    method: 'POST',
    body: {
      customerName: 'Vikram Sengupta',
      email: 'vikram.s@example.com',
      phone: '+91 98765 43210',
      city: 'Bengaluru',
      builtupArea: 2400,
      estimatedBudget: 5500000,
      notes: 'Testing lead intake integrity'
    }
  });
  console.log('Lead submission status:', leadRes.status, '| Lead ID:', leadRes.data.lead?._id);
  if (leadRes.status !== 200 || !leadRes.data.lead?._id) {
    throw new Error('Lead creation failed');
  }

  // Admin reads leads
  const adminLeads = await req('/api/leads', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('Admin leads read status:', adminLeads.status, '| Leads count:', adminLeads.data.leads?.length);
  if (adminLeads.status !== 200) {
    throw new Error('Admin leads query failed');
  }

  // Subscription API
  const subRes = await req('/api/subscriptions/me', {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${normalToken}` },
    body: { planId: 'pro', billingCycle: 'yearly' }
  });
  console.log('Subscription update status:', subRes.status, '| Active plan:', subRes.data.subscription?.planId);
  if (subRes.status !== 200 || subRes.data.subscription?.planId !== 'pro') {
    throw new Error('Subscription update failed');
  }

  // Payments API
  const payRes = await req('/api/payments', {
    headers: { 'Authorization': `Bearer ${normalToken}` }
  });
  console.log('Payments query status:', payRes.status);
  if (payRes.status !== 200) {
    throw new Error('Payments query failed');
  }

  console.log('✅ STEP 10 PASSED\n');

  console.log('================================================================');
  console.log('ALL PHASE 1.5 INTEGRATION TESTS COMPLETED SUCCESSFULLY (10/10)');
  console.log('================================================================');
  process.exit(0);
}

runLiveVerification().catch(err => {
  console.error('LIVE VERIFICATION ERROR:', err);
  process.exit(1);
});
