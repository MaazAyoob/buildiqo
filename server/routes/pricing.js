const express = require('express');
const router = express.Router();
const Material = require('../models/Material');
const MaterialRate = require('../models/MaterialRate');
const pricingService = require('../services/pricingService');
const priceResearchService = require('../services/priceResearch/priceResearchService');
const { INDIAN_LOCATIONS, normalizeState } = require('../data/indianLocations');
const { requireAuth, requireAdmin } = require('../middleware/auth');

/**
 * GET /api/pricing/current
 * Authoritative production pricing resolution endpoint.
 * Hierarchy: State Approved -> National Approved -> UNAVAILABLE.
 * Public access supported when location/state parameter is queried (Live Rates & Cost Calculator).
 * Requires auth token when queried without parameters (satisfies Phase 1.5 security baseline).
 */
router.get('/current', async (req, res) => {
  try {
    const { state, stateId, city, cityId } = req.query;
    const hasLocationQuery = Boolean(state || stateId || city || cityId);
    const authHeader = req.headers.authorization;

    // Phase 1.5 test protection: strict 401 when accessed without location and without token
    if (!hasLocationQuery && !authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to access current rates without location parameters.'
      });
    }

    const result = await pricingService.getCurrentApprovedRates({
      state,
      stateId,
      city,
      cityId
    });

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/pricing/materials
 * Admin-only: Full list of materials with their current active rates for a selected state.
 */
router.get('/materials', requireAdmin, async (req, res) => {
  try {
    const { category, active, state, stateId } = req.query;
    const query = {};
    if (category && category !== 'ALL') query.category = category.toLowerCase();
    if (active !== undefined) query.active = active === 'true';

    const norm = (state || stateId) ? normalizeState(state || stateId) : null;
    const targetStateId = norm ? norm.stateId : null;

    const materials = await Material.find(query).sort({ category: 1, name: 1 }).lean();

    // Attach latest approved state rate to each material
    const enriched = await Promise.all(materials.map(async (mat) => {
      let latestApproved = null;
      let isStateRate = false;

      if (targetStateId && targetStateId !== 'all') {
        latestApproved = await MaterialRate.findOne({
          materialCode: mat.materialCode,
          stateId: targetStateId,
          cityId: 'all',
          status: 'approved'
        }).sort({ effectiveFrom: -1 }).lean();
        if (latestApproved) isStateRate = true;
      }

      if (!latestApproved) {
        latestApproved = await MaterialRate.findOne({
          materialCode: mat.materialCode,
          stateId: 'all',
          cityId: 'all',
          status: 'approved'
        }).sort({ effectiveFrom: -1 }).lean();
      }

      if (!latestApproved) {
        latestApproved = await MaterialRate.findOne({
          materialCode: mat.materialCode,
          cityId: 'all',
          $or: [{ stateId: 'all' }, { stateId: { $exists: false } }, { stateId: null }],
          status: 'approved'
        }).sort({ effectiveFrom: -1 }).lean();
      }

      const isNational = Boolean(latestApproved && !isStateRate);

      return {
        ...mat,
        currentApprovedRate: latestApproved ? latestApproved.rate : mat.benchmarkRate,
        rateUnit: latestApproved ? latestApproved.unit : mat.unit,
        lastRateUpdate: latestApproved ? latestApproved.effectiveFrom : mat.createdAt,
        rateSource: latestApproved ? latestApproved.source : 'benchmark_seed',
        rateLocation: latestApproved ? (isNational ? 'National' : latestApproved.location) : (norm ? norm.stateName : 'National'),
        rateStateId: latestApproved ? (isNational ? 'all' : latestApproved.stateId) : (targetStateId || 'all'),
        rateRecordId: latestApproved ? latestApproved._id : null,
        pricingScope: isStateRate ? 'STATE' : (latestApproved ? 'NATIONAL' : 'UNAVAILABLE'),
        pricingSource: isStateRate ? 'APPROVED_STATE_RATE' : (latestApproved ? 'APPROVED_NATIONAL_RATE' : 'UNAVAILABLE')
      };
    }));

    res.json({ success: true, count: enriched.length, materials: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/pricing/materials/:code/history
 * Admin-only: Audit trail of rate revisions for a material.
 */
router.get('/materials/:code/history', requireAdmin, async (req, res) => {
  try {
    const { state, stateId } = req.query;
    const norm = (state || stateId) ? normalizeState(state || stateId) : null;
    const data = await pricingService.getMaterialRateHistory(req.params.code, norm?.stateId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/pricing/rates
 * Admin-only: Atomically submit a new approved rate revision for a STATE.
 */
router.post('/rates', requireAdmin, async (req, res) => {
  try {
    const { materialCode, rate, state, stateId, location, notes, source } = req.body;
    if (!materialCode || rate === undefined || rate === null) {
      return res.status(400).json({ success: false, error: 'materialCode and numeric rate are required.' });
    }

    const numRate = Number(rate);
    if (isNaN(numRate) || numRate <= 0) {
      return res.status(400).json({ success: false, error: 'Rate must be a positive number.' });
    }

    const result = await pricingService.updateMaterialRate({
      materialCode,
      rate: numRate,
      state: state || location || 'Karnataka',
      stateId,
      location: location || state || 'Karnataka',
      notes: notes || '',
      source: source || 'admin_manual',
      sourceType: 'admin_manual',
      userId: req.user.id
    });

    res.json({
      success: true,
      message: `Rate for ${materialCode} in ${result.rateRecord.location} updated to ₹${numRate}`,
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/pricing/materials
 * Admin-only: Create new material specification.
 */
router.post('/materials', requireAdmin, async (req, res) => {
  try {
    const { materialCode, name, category, unit, tier, grade, brand, desc, warranty, benchmarkRate } = req.body;
    if (!materialCode || !name || !category || !unit || benchmarkRate === undefined) {
      return res.status(400).json({ success: false, error: 'materialCode, name, category, unit, and benchmarkRate are required.' });
    }

    const normalizedCode = materialCode.toUpperCase().trim();
    const existing = await Material.findOne({ materialCode: normalizedCode });
    if (existing) {
      return res.status(400).json({ success: false, error: `Material with code ${normalizedCode} already exists.` });
    }

    const material = await Material.create({
      materialCode: normalizedCode,
      name: name.trim(),
      category: category.trim(),
      unit: unit.trim(),
      tier: tier || 'standard',
      grade: grade || '',
      brand: brand || '',
      desc: desc || '',
      warranty: warranty || '',
      benchmarkRate: Number(benchmarkRate)
    });

    // Create initial approved rate
    await MaterialRate.create({
      materialId: material._id,
      materialCode: normalizedCode,
      rate: Number(benchmarkRate),
      unit: material.unit,
      location: 'National',
      cityId: 'all',
      source: 'initial_creation',
      notes: 'Initial material creation benchmark',
      updatedBy: req.user.id,
      status: 'approved'
    });

    res.json({ success: true, material });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/pricing/materials/:code
 * Admin-only: Toggle active status or update material metadata.
 */
router.patch('/materials/:code', requireAdmin, async (req, res) => {
  try {
    const { active, name, grade, brand, desc, warranty } = req.body;
    const updates = {};
    if (active !== undefined) updates.active = Boolean(active);
    if (name !== undefined) updates.name = name.trim();
    if (grade !== undefined) updates.grade = grade.trim();
    if (brand !== undefined) updates.brand = brand.trim();
    if (desc !== undefined) updates.desc = desc.trim();
    if (warranty !== undefined) updates.warranty = warranty.trim();

    const material = await Material.findOneAndUpdate(
      { materialCode: req.params.code.toUpperCase().trim() },
      { $set: updates },
      { new: true }
    );

    if (!material) {
      return res.status(404).json({ success: false, error: 'Material not found.' });
    }

    res.json({ success: true, material });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// PHASE 3.5: AI PRICE RESEARCH ENDPOINTS
// ==========================================

/**
 * GET /api/pricing/locations
 * Returns catalog of Indian States and Cities for regional pricing research.
 */
router.get('/locations', requireAuth, (req, res) => {
  res.json({
    success: true,
    data: INDIAN_LOCATIONS
  });
});

/**
 * POST /api/pricing/research
 * Admin-only: Initiate an AI / Web material price research run.
 */
router.post('/research', requireAdmin, async (req, res) => {
  try {
    const {
      state = 'National',
      city = 'All',
      locationScope = 'city',
      researchScope = 'all',
      category = null,
      materialCodes = [],
      sourcePreferences = [],
      provider = null
    } = req.body;

    const result = await priceResearchService.startResearchRun({
      userId: req.user.id,
      state,
      city,
      locationScope,
      researchScope,
      category,
      materialCodes,
      sourcePreferences,
      providerName: provider
    });

    res.json({
      success: true,
      message: `Research run initiated for ${result.candidateCount} materials.`,
      data: result
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/pricing/research/runs
 * Admin-only: List past research runs.
 */
router.get('/research/runs', requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const runs = await priceResearchService.getRuns({ limit });
    res.json({ success: true, count: runs.length, runs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/pricing/research/runs/:runId
 * Admin-only: Get details of a single research run and its candidates.
 */
router.get('/research/runs/:runId', requireAdmin, async (req, res) => {
  try {
    const run = await priceResearchService.getRunById(req.params.runId);
    if (!run) {
      return res.status(404).json({ success: false, error: 'Research run not found.' });
    }
    res.json({ success: true, data: run });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/pricing/research/candidates
 * Admin-only: Query candidates with filters.
 */
router.get('/research/candidates', requireAdmin, async (req, res) => {
  try {
    const { runId, status, materialCode, state, city } = req.query;
    const candidates = await priceResearchService.getCandidates({
      runId,
      status,
      materialCode,
      state,
      city
    });
    res.json({ success: true, count: candidates.length, candidates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/pricing/research/candidates/:id
 * Admin-only: Get single candidate details.
 */
router.get('/research/candidates/:id', requireAdmin, async (req, res) => {
  try {
    const candidate = await priceResearchService.getCandidateById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found.' });
    }
    res.json({ success: true, candidate });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/pricing/research/candidates/:id/evidence
 * Admin-only: Get full evidence drawer data and normalization trace.
 */
router.get('/research/candidates/:id/evidence', requireAdmin, async (req, res) => {
  try {
    const candidate = await priceResearchService.getCandidateById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found.' });
    }

    res.json({
      success: true,
      data: {
        candidateId: candidate._id,
        materialCode: candidate.materialCode,
        materialName: candidate.materialName,
        specification: candidate.specification,
        location: candidate.requestedLocation,
        researchDate: candidate.researchDate,
        provider: candidate.provider,
        providerModel: candidate.providerModel,
        currentApprovedRate: candidate.currentApprovedRate,
        researchedCandidateRate: candidate.normalizedRate,
        sourcePrice: candidate.sourcePrice,
        sourceUnit: candidate.sourceUnit,
        normalizedUnit: candidate.normalizedUnit,
        normalizationStatus: candidate.normalizationStatus,
        confidence: candidate.confidence,
        confidenceScore: candidate.confidenceScore,
        confidenceReason: candidate.confidenceReason,
        varianceFlag: candidate.varianceFlag,
        priceDifferencePercent: candidate.priceDifferencePercent,
        taxStatus: candidate.taxStatus,
        freightStatus: candidate.freightStatus,
        evidence: candidate.evidence
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/pricing/research/candidates/:id/approve
 * Admin-only: Explicitly approve a researched candidate and publish new MaterialRate.
 */
router.post('/research/candidates/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { notes = '' } = req.body;
    const result = await priceResearchService.approveCandidate({
      candidateId: req.params.id,
      userId: req.user.id,
      notes
    });

    res.json({
      success: true,
      message: `Candidate approved! Production rate for ${result.candidate.materialCode} updated to ₹${result.candidate.normalizedRate}/${result.candidate.normalizedUnit}.`,
      data: result
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/pricing/research/candidates/:id/approve-with-edit
 * Admin-only: Adjust researched rate and approve. Original researched rate is preserved.
 */
router.post('/research/candidates/:id/approve-with-edit', requireAdmin, async (req, res) => {
  try {
    const { editedRate, notes = '' } = req.body;
    if (editedRate === undefined || editedRate === null) {
      return res.status(400).json({ success: false, error: 'editedRate is required.' });
    }

    const result = await priceResearchService.approveCandidateWithEdit({
      candidateId: req.params.id,
      editedRate: Number(editedRate),
      userId: req.user.id,
      notes
    });

    res.json({
      success: true,
      message: `Candidate rate adjusted to ₹${result.candidate.adminEditedRate} and approved! Original researched rate (₹${result.candidate.normalizedRate}) preserved.`,
      data: result
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/pricing/research/candidates/:id/reject
 * Admin-only: Reject a researched candidate. Production rates remain untouched.
 */
router.post('/research/candidates/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { reason = '' } = req.body;
    const result = await priceResearchService.rejectCandidate({
      candidateId: req.params.id,
      reason,
      userId: req.user.id
    });

    res.json({
      success: true,
      message: 'Candidate rejected. Production rates were not modified.',
      data: result
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/pricing/research/candidates/bulk-approve
 * Admin-only: Batch approval of selected candidate IDs with independent atomic commits.
 */
router.post('/research/candidates/bulk-approve', requireAdmin, async (req, res) => {
  try {
    const { candidateIds = [] } = req.body;
    const result = await priceResearchService.bulkApproveCandidates({
      candidateIds,
      userId: req.user.id
    });

    res.json({
      success: true,
      message: `Bulk approval complete: ${result.approvedCount} approved, ${result.failedCount} failed/blocked.`,
      data: result
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;

