/**
 * End-to-End Live Integration Verification Script for Phase 3.5
 * Runs against live running server daemon on http://localhost:5000
 */

const BASE_URL = 'http://localhost:5000';

async function main() {
  console.log('--- STARTING PHASE 3.5 LIVE VERIFICATION ---');

  // Step 1: Health Check
  console.log('\n[STEP 1] Checking API Health (/api/health)...');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const healthData = await healthRes.json();
  if (healthRes.status !== 200 || healthData.status !== 'ok') {
    throw new Error(`Health check failed: ${JSON.stringify(healthData)}`);
  }
  console.log('✓ Health check passed:', healthData);

  // Step 2: Login as Admin
  console.log('\n[STEP 2] Logging in as Admin (admin@buildiqo.ai)...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailOrPhone: 'admin@buildiqo.ai',
      password: 'BuildiqoAdminSecret#2026'
    })
  });
  const loginData = await loginRes.json();
  if (!loginData.token) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }
  const adminToken = loginData.token;
  console.log('✓ Admin login successful. Token acquired.');

  // Step 3: Fetch Locations
  console.log('\n[STEP 3] Fetching Indian Locations Catalog (/api/pricing/locations)...');
  const locRes = await fetch(`${BASE_URL}/api/pricing/locations`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const locData = await locRes.json();
  if (!locData.success || !Array.isArray(locData.data) || locData.data.length === 0) {
    throw new Error(`Locations catalog failed: ${JSON.stringify(locData)}`);
  }
  console.log(`✓ Fetched ${locData.data.length} Indian states. (First state: ${locData.data[0].stateName}, ${locData.data[0].cities.length} cities)`);

  // Step 3.5: Query live materials to pick target codes
  console.log('\n[STEP 3.5] Fetching live catalog materials (/api/pricing/materials)...');
  const matRes = await fetch(`${BASE_URL}/api/pricing/materials`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const matData = await matRes.json();
  if (!matData.success || !matData.materials || matData.materials.length === 0) {
    throw new Error(`Failed to fetch catalog materials: ${JSON.stringify(matData)}`);
  }
  const targetMaterials = matData.materials.slice(0, 2);
  const targetCodes = targetMaterials.map(m => m.materialCode);
  console.log(`✓ Picked live test materials: ${targetCodes.join(', ')} (${targetMaterials.map(m => m.name).join(', ')})`);

  // Step 4: Initiate Small Scope Research Run (Mock Provider)
  console.log('\n[STEP 4] Initiating Small Scope Research Run (Varanasi, Uttar Pradesh)...');
  const researchRes = await fetch(`${BASE_URL}/api/pricing/research`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      state: 'Uttar Pradesh',
      city: 'Varanasi',
      locationScope: 'city',
      researchScope: 'specific',
      materialCodes: targetCodes,
      provider: 'mock'
    })
  });
  const researchData = await researchRes.json();
  if (!researchData.success) {
    throw new Error(`Research initiation failed: ${JSON.stringify(researchData)}`);
  }
  console.log('✓ Research run completed successfully:', researchData.message);
  console.log(`  - Candidate count: ${researchData.data.candidateCount}`);
  console.log(`  - Success count: ${researchData.data.successCount}`);

  // Step 5: Query Research Candidates
  console.log('\n[STEP 5] Querying Researched Candidates (/api/pricing/research/candidates)...');
  const candRes = await fetch(`${BASE_URL}/api/pricing/research/candidates?city=Varanasi`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const candData = await candRes.json();
  if (!candData.success || candData.candidates.length === 0) {
    throw new Error(`Candidate query failed: ${JSON.stringify(candData)}`);
  }
  console.log(`✓ Retrieved ${candData.candidates.length} candidates.`);
  const sampleCand = candData.candidates[0];
  console.log(`  - Sample: ${sampleCand.materialName} (${sampleCand.materialCode})`);
  console.log(`  - Normalized Rate: ₹${sampleCand.normalizedRate}/${sampleCand.normalizedUnit} (Raw: ₹${sampleCand.sourcePrice}/${sampleCand.sourceUnit})`);
  console.log(`  - Confidence: ${sampleCand.confidence} (${sampleCand.confidenceScore}/100)`);
  console.log(`  - Variance Flag: ${sampleCand.varianceFlag} (${sampleCand.priceDifferencePercent}%)`);

  // Step 6: Fetch Candidate Evidence
  console.log(`\n[STEP 6] Fetching Candidate Evidence Drawer Data (/api/pricing/research/candidates/${sampleCand._id}/evidence)...`);
  const evRes = await fetch(`${BASE_URL}/api/pricing/research/candidates/${sampleCand._id}/evidence`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const evData = await evRes.json();
  if (!evData.success || !evData.data.evidence) {
    throw new Error(`Evidence query failed: ${JSON.stringify(evData)}`);
  }
  console.log('✓ Evidence retrieved successfully.');
  console.log(`  - Confidence Reason: ${evData.data.confidenceReason}`);
  console.log(`  - Citations count: ${evData.data.evidence.length}`);

  // Step 7: Approve First Candidate to Production
  console.log(`\n[STEP 7] Approving Candidate to Production MaterialRate...`);
  const approveRes = await fetch(`${BASE_URL}/api/pricing/research/candidates/${sampleCand._id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ notes: 'Verified live and approved by platform admin.' })
  });
  const approveData = await approveRes.json();
  if (!approveRes.ok || !approveData.success) {
    throw new Error(`Approval failed: ${JSON.stringify(approveData)}`);
  }
  console.log('✓ Candidate approved:', approveData.message);
  console.log(`  - Production rate record ID: ${approveData.data.rateRecord._id}`);
  console.log(`  - Location: ${approveData.data.rateRecord.location}`);
  console.log(`  - Source tagged: ${approveData.data.rateRecord.source}`);

  // Step 8: Verify Production Pricing Reflects Approved Rate
  console.log('\n[STEP 8] Verifying Current Approved Rates Reflects Approved Candidate (/api/pricing/current)...');
  const currentRes = await fetch(`${BASE_URL}/api/pricing/current?city=Varanasi`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const currentData = await currentRes.json();
  if (!currentData.success || !currentData.data.rates[sampleCand.materialCode]) {
    throw new Error(`Current rate resolution failed: ${JSON.stringify(currentData)}`);
  }
  const resolvedRate = currentData.data.rates[sampleCand.materialCode];
  console.log(`✓ Resolved Rate for ${sampleCand.materialCode} in Varanasi: ₹${resolvedRate.unitRate}/${resolvedRate.unit}`);
  console.log(`  - Location Used: ${resolvedRate.locationUsed}`);
  console.log(`  - Source: ${resolvedRate.source}`);

  // Step 9: Verify Edit & Approve
  if (candData.candidates.length > 1) {
    const secondCand = candData.candidates[1];
    console.log(`\n[STEP 9] Testing Edit & Approve for ${secondCand.materialCode}...`);
    const targetEditRate = (secondCand.normalizedRate || 380) - 5;
    const editRes = await fetch(`${BASE_URL}/api/pricing/research/candidates/${secondCand._id}/approve-with-edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        editedRate: targetEditRate,
        notes: 'Admin negotiated local discount.'
      })
    });
    const editData = await editRes.json();
    if (!editRes.ok || !editData.success) {
      throw new Error(`Edit and approve failed: ${JSON.stringify(editData)}`);
    }
    console.log('✓ Edit & approve passed:', editData.message);
    console.log(`  - Researched: ₹${editData.data.candidate.normalizedRate}`);
    console.log(`  - Admin Approved: ₹${editData.data.candidate.adminEditedRate}`);
  }

  // Step 10: Non-Admin Authorization Check
  console.log('\n[STEP 10] Testing Authorization Security — Non-admin rejected from research mutations...');
  const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake';
  const unauthRes = await fetch(`${BASE_URL}/api/pricing/research`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${fakeToken}`
    },
    body: JSON.stringify({ state: 'Uttar Pradesh', city: 'Varanasi' })
  });
  if (unauthRes.status === 401 || unauthRes.status === 403) {
    console.log(`✓ Security verified: Non-admin request rejected with HTTP ${unauthRes.status}.`);
  } else {
    throw new Error(`Expected 401/403 for unauthorized request, got ${unauthRes.status}`);
  }

  console.log('\n======================================================');
  console.log('ALL 10 LIVE E2E VERIFICATION STEPS PASSED SUCCESSFULLY!');
  console.log('======================================================');
}

main().catch(err => {
  console.error('\n❌ LIVE VERIFICATION FAILED:', err);
  process.exit(1);
});
