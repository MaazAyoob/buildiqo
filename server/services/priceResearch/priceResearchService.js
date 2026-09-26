const mongoose = require('mongoose');
const Material = require('../../models/Material');
const MaterialRate = require('../../models/MaterialRate');
const PriceResearchRun = require('../../models/PriceResearchRun');
const PriceResearchCandidate = require('../../models/PriceResearchCandidate');
const ResearchPolicy = require('./ResearchPolicy');
const { normalizePrice } = require('./priceNormalizer');
const { validateCandidateRate } = require('./priceValidator');
const { calculateConfidence } = require('./confidenceScorer');
const GoogleSearchResearchProvider = require('./GoogleSearchResearchProvider');
const OpenAIResearchProvider = require('./OpenAIResearchProvider');
const MockResearchProvider = require('./MockResearchProvider');
const pricingService = require('../pricingService');
const { normalizeState } = require('../../data/indianLocations');

class PriceResearchService {
  constructor() {
    this.providers = {
      google: new GoogleSearchResearchProvider(),
      openai: new OpenAIResearchProvider(),
      mock: new MockResearchProvider()
    };
  }

  getProvider(providerName) {
    const name = (providerName || process.env.PRICE_RESEARCH_PROVIDER || 'google').toLowerCase().trim();
    if (this.providers[name]) {
      return this.providers[name];
    }
    return this.providers.google;
  }

  /**
   * Start a research run across targeted materials and locations.
   */
  async startResearchRun({
    userId,
    state = 'National',
    city = 'All',
    locationScope = 'city',
    researchScope = 'all',
    category = null,
    materialCodes = [],
    sourcePreferences = [],
    providerName = null,
    searchQuery = ''
  }) {
    if (!userId) {
      throw new Error('Authentication required: userId is missing.');
    }

    // 1. Resolve targeted materials from DB
    const query = { active: true };
    if (researchScope === 'category' && category && category !== 'ALL') {
      query.category = category;
    } else if (researchScope === 'specific' && Array.isArray(materialCodes) && materialCodes.length > 0) {
      query.materialCode = { $in: materialCodes.map(c => c.toUpperCase().trim()) };
    } else if (researchScope === 'custom' || searchQuery) {
      const q = (searchQuery || '').trim();
      if (q) {
        query.$or = [
          { name: { $regex: q, $options: 'i' } },
          { materialCode: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { category: { $regex: q, $options: 'i' } }
        ];
      }
    }

    let materials = await Material.find(query).limit(ResearchPolicy.MAX_MATERIALS_PER_RUN).lean();
    if ((!materials || materials.length === 0) && searchQuery) {
      // Dynamic physical entry support: create a research target for user-entered query
      const cleanName = searchQuery.trim();
      const codeSuffix = cleanName.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 16);
      materials = [{
        materialCode: `ITEM_${codeSuffix}`,
        name: cleanName,
        category: 'custom',
        unit: 'unit',
        benchmarkRate: 1000,
        specificationStandard: 'Physical Entry Search',
        active: true,
        isCustom: true
      }];
    }

    if (!materials || materials.length === 0) {
      throw new Error('No active materials matched the requested research scope.');
    }

    const runId = `run_res_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const provider = this.getProvider(providerName);

    // 2. Create PriceResearchRun document
    const researchRun = new PriceResearchRun({
      runId,
      requestedBy: userId,
      provider: provider.name,
      providerModel: provider.model || '',
      state,
      city,
      locationScope,
      materialCount: materials.length,
      sourcePreferences,
      researchScope,
      startedAt: new Date(),
      status: 'running'
    });

    await researchRun.save();

    // 3. Check provider configuration
    if (!provider.isConfigured()) {
      researchRun.status = 'failed';
      researchRun.completedAt = new Date();
      researchRun.errorSummary = `Provider [${provider.name}] is not configured. Missing API credentials.`;
      await researchRun.save();
      throw new Error(`AI price research is not configured for provider '${provider.name}'. Please configure API credentials in server/.env.`);
    }

    // 4. Concurrently process materials in controlled chunks
    const candidateIds = [];
    let successCount = 0;
    let warningCount = 0;
    let failureCount = 0;
    const errors = [];

    const concurrency = ResearchPolicy.MAX_CONCURRENCY;
    for (let i = 0; i < materials.length; i += concurrency) {
      const chunk = materials.slice(i, i + concurrency);
      const promises = chunk.map(async (mat) => {
        try {
          // Fetch current approved rate and revision ID for stale protection
          const normState = normalizeState(state);
          let currentRateDoc = null;
          if (normState.stateId !== 'all') {
            currentRateDoc = await MaterialRate.findOne({
              materialCode: mat.materialCode,
              stateId: normState.stateId,
              status: 'approved'
            }).sort({ effectiveFrom: -1 }).lean();
          }

          if (!currentRateDoc) {
            currentRateDoc = await MaterialRate.findOne({
              materialCode: mat.materialCode,
              stateId: 'all',
              status: 'approved'
            }).sort({ effectiveFrom: -1 }).lean();
          }

          if (!currentRateDoc) {
            currentRateDoc = await MaterialRate.findOne({
              materialCode: mat.materialCode,
              cityId: 'all',
              status: 'approved'
            }).sort({ effectiveFrom: -1 }).lean();
          }

          const currentApprovedRate = currentRateDoc ? currentRateDoc.rate : mat.benchmarkRate;
          const rateRevisionAtResearch = currentRateDoc ? currentRateDoc._id.toString() : 'BENCHMARK_SEED';

          // Call provider
          const result = await provider.researchMaterialPrice({
            material: mat,
            state,
            city,
            locationScope,
            sourcePreferences,
            timeoutMs: ResearchPolicy.PROVIDER_TIMEOUT_MS
          });

          if (!result || !result.found) {
            failureCount++;
            errors.push(`${mat.materialCode}: ${result?.reason || 'No reliable price found'}`);
            return;
          }

          // Authoritative Normalization
          const norm = normalizePrice({
            sourcePrice: result.sourcePrice,
            sourceUnit: result.sourceUnit,
            canonicalUnit: mat.unit,
            materialSpecification: mat.grade || mat.name
          });

          // Candidate Object Construction (City preserved as research context, State is production scope)
          const candidateData = {
            runId,
            materialId: mat._id,
            materialCode: mat.materialCode,
            materialName: mat.name,
            category: mat.category,
            requestedLocation: locationScope === 'city' && city && city !== 'All' ? `${city}, ${state}` : state,
            state: normState.stateName || state,
            city,
            researchLocation: city && city !== 'All' ? city : normState.stateName,
            evidenceLocation: locationScope === 'city' && city && city !== 'All' ? `${city}, ${normState.stateName}` : normState.stateName,
            locationScope,
            sourceName: result.sourceName,
            sourceUrl: result.sourceUrl,
            sourceTitle: result.sourceTitle,
            sourcePublishedDate: result.sourcePublishedDate,
            sourceType: result.sourceType || 'other',
            researchDate: new Date(),
            sourcePrice: norm.sourcePrice,
            sourceUnit: norm.sourceUnit,
            normalizedRate: norm.normalizedRate,
            normalizedUnit: norm.normalizedUnit,
            normalizationStatus: norm.normalizationStatus,
            currency: 'INR',
            taxIncluded: result.taxIncluded,
            taxRateIfKnown: result.taxRateIfKnown,
            taxStatus: result.taxStatus,
            freightIncluded: result.freightIncluded,
            freightStatus: result.freightStatus,
            deliveryIncluded: result.deliveryIncluded,
            deliveryStatus: result.deliveryStatus,
            minimumOrderQuantity: result.minimumOrderQuantity || '',
            brand: result.brand || mat.brand || '',
            grade: result.grade || mat.grade || '',
            specification: result.specification || mat.grade || mat.name,
            evidence: result.evidence || [],
            currentApprovedRate,
            rateRevisionAtResearch,
            researchedBy: userId,
            provider: provider.name,
            providerModel: provider.model || '',
            status: 'pending'
          };

          // Validation
          const validation = validateCandidateRate({
            material: mat,
            candidate: candidateData,
            currentApprovedRate
          });

          candidateData.varianceFlag = validation.varianceFlag;
          candidateData.priceDifferencePercent = validation.priceDifferencePercent;
          candidateData.specificationMatch = validation.specificationMatch;

          // Confidence Scoring
          const conf = calculateConfidence({
            candidate: candidateData,
            material: mat,
            normalizationResult: norm,
            validationResult: validation
          });

          candidateData.confidence = conf.confidence;
          candidateData.confidenceScore = conf.confidenceScore;
          candidateData.confidenceReason = conf.confidenceReason;

          // Save candidate
          const candidateDoc = new PriceResearchCandidate(candidateData);
          await candidateDoc.save();
          candidateIds.push(candidateDoc._id);

          if (norm.normalizationStatus === 'NORMALIZATION_REQUIRED' || !validation.isValid || conf.confidence === 'LOW') {
            warningCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          failureCount++;
          errors.push(`${mat.materialCode}: ${err.message}`);
        }
      });

      await Promise.all(promises);
    }

    // 5. Finalize run status
    researchRun.completedAt = new Date();
    researchRun.candidateIds = candidateIds;
    researchRun.successCount = successCount;
    researchRun.warningCount = warningCount;
    researchRun.failureCount = failureCount;

    if (candidateIds.length === 0) {
      researchRun.status = 'failed';
    } else if (failureCount > 0) {
      researchRun.status = 'partial';
    } else {
      researchRun.status = 'completed';
    }

    if (errors.length > 0) {
      researchRun.errorSummary = errors.slice(0, 10).join(' | ');
    }

    await researchRun.save();

    return {
      run: researchRun.toObject(),
      candidateCount: candidateIds.length,
      successCount,
      warningCount,
      failureCount
    };
  }

  /**
   * Get past research runs.
   */
  async getRuns({ limit = 20 } = {}) {
    return await PriceResearchRun.find().sort({ createdAt: -1 }).limit(limit).lean();
  }

  /**
   * Get single research run by runId with populated candidates.
   */
  async getRunById(runId) {
    const run = await PriceResearchRun.findOne({ runId }).lean();
    if (!run) return null;

    const candidates = await PriceResearchCandidate.find({ runId }).sort({ materialCode: 1 }).lean();
    return {
      ...run,
      candidates
    };
  }

  /**
   * Get candidates with flexible filters.
   */
  async getCandidates({ runId, status, materialCode, state, city, limit = 100 } = {}) {
    const query = {};
    if (runId) query.runId = runId;
    if (status) query.status = status;
    if (materialCode) query.materialCode = materialCode.toUpperCase().trim();
    if (state && state !== 'All') query.state = state;
    if (city && city !== 'All') query.city = city;

    return await PriceResearchCandidate.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Get single candidate by ID.
   */
  async getCandidateById(candidateId) {
    return await PriceResearchCandidate.findById(candidateId).lean();
  }

  /**
   * Approve a researched candidate.
   * Promotes the rate to production MaterialRate using transaction-safe pricingService.
   */
  async approveCandidate({ candidateId, userId, notes = '' }) {
    if (!candidateId) throw new Error('Candidate ID is required.');
    const candidate = await PriceResearchCandidate.findById(candidateId);
    if (!candidate) throw new Error('Candidate not found.');

    if (candidate.status !== 'pending') {
      throw new Error(`Cannot approve candidate with status '${candidate.status}'. Only pending candidates can be approved.`);
    }

    if (candidate.normalizationStatus === 'NORMALIZATION_REQUIRED' || candidate.normalizedRate === null || candidate.normalizedRate <= 0) {
      throw new Error('Candidate requires manual unit normalization or rate adjustment before approval. Use "Edit & Approve".');
    }

    // Stale-Candidate Protection against active state rate
    const norm = normalizeState(candidate.state || candidate.requestedLocation);
    const targetStateId = norm.stateId;
    const targetStateName = norm.stateName;

    const currentApproved = await MaterialRate.findOne({
      materialCode: candidate.materialCode,
      stateId: targetStateId,
      status: 'approved'
    }).sort({ effectiveFrom: -1 });

    if (currentApproved) {
      const currentRevision = currentApproved._id.toString();
      if (candidate.rateRevisionAtResearch && candidate.rateRevisionAtResearch !== 'BENCHMARK_SEED' && candidate.rateRevisionAtResearch !== currentRevision) {
        // Revision changed! Check if rate changed
        if (currentApproved.rate !== candidate.currentApprovedRate) {
          throw new Error(`Approval blocked: Current approved rate changed since this research was performed (was ₹${candidate.currentApprovedRate}, now ₹${currentApproved.rate}). Please review the candidate again.`);
        }
      }
    }

    const finalRate = candidate.normalizedRate;

    // Commit to authoritative production MaterialRate as STATE rate (cityId is 'all')
    const updateResult = await pricingService.updateMaterialRate({
      materialCode: candidate.materialCode,
      rate: finalRate,
      state: targetStateName,
      stateId: targetStateId,
      location: targetStateName,
      cityId: 'all',
      source: `AI Price Research — ${candidate.sourceName || 'Verified Citation'}`,
      sourceType: 'research_approved',
      notes: notes || `Approved by admin from Research Run ${candidate.runId}. Researched in: ${candidate.city || candidate.requestedLocation}. Source: ${candidate.sourceUrl || 'N/A'}`,
      userId
    });

    // Mark previous candidates for same material & state as superseded
    await PriceResearchCandidate.updateMany(
      { materialCode: candidate.materialCode, state: candidate.state, status: 'approved' },
      { $set: { status: 'superseded' } }
    );

    // Update candidate status to approved while preserving city research context
    candidate.status = 'approved';
    candidate.researchLocation = candidate.city || targetStateName;
    candidate.evidenceLocation = candidate.requestedLocation || `${candidate.city}, ${targetStateName}`;
    candidate.reviewedAt = new Date();
    candidate.reviewedBy = userId;
    candidate.approvalNotes = notes;
    await candidate.save();

    return {
      success: true,
      candidate: candidate.toObject(),
      rateRecord: updateResult.rateRecord
    };
  }

  /**
   * Edit and approve candidate.
   * Preserves the original researched rate in candidate while publishing admin-edited rate to MaterialRate.
   */
  async approveCandidateWithEdit({ candidateId, editedRate, userId, notes = '' }) {
    if (!candidateId) throw new Error('Candidate ID ID is required.');
    const numRate = Number(editedRate);
    if (isNaN(numRate) || numRate <= 0) {
      throw new Error('Edited rate must be a positive number.');
    }

    const candidate = await PriceResearchCandidate.findById(candidateId);
    if (!candidate) throw new Error('Candidate not found.');

    if (candidate.status !== 'pending') {
      throw new Error(`Cannot approve candidate with status '${candidate.status}'. Only pending candidates can be approved.`);
    }

    // Stale protection against active state rate
    const norm = normalizeState(candidate.state || candidate.requestedLocation);
    const targetStateId = norm.stateId;
    const targetStateName = norm.stateName;

    const currentApproved = await MaterialRate.findOne({
      materialCode: candidate.materialCode,
      stateId: targetStateId,
      status: 'approved'
    }).sort({ effectiveFrom: -1 });

    if (currentApproved) {
      const currentRevision = currentApproved._id.toString();
      if (candidate.rateRevisionAtResearch && candidate.rateRevisionAtResearch !== 'BENCHMARK_SEED' && candidate.rateRevisionAtResearch !== currentRevision) {
        if (currentApproved.rate !== candidate.currentApprovedRate) {
          throw new Error(`Approval blocked: Current approved rate changed since this research was performed (was ₹${candidate.currentApprovedRate}, now ₹${currentApproved.rate}). Please review the candidate again.`);
        }
      }
    }

    // Commit edited rate to production MaterialRate as STATE rate
    const updateResult = await pricingService.updateMaterialRate({
      materialCode: candidate.materialCode,
      rate: numRate,
      state: targetStateName,
      stateId: targetStateId,
      location: targetStateName,
      cityId: 'all',
      source: `AI Price Research (Edited) — ${candidate.sourceName || 'Verified Citation'}`,
      sourceType: 'research_approved',
      notes: notes || `Admin adjusted rate from ₹${candidate.normalizedRate || candidate.sourcePrice} to ₹${numRate}. Researched in: ${candidate.city || candidate.requestedLocation}. Run: ${candidate.runId}`,
      userId
    });

    // Mark previous approved candidates as superseded
    await PriceResearchCandidate.updateMany(
      { materialCode: candidate.materialCode, state: candidate.state, status: 'approved' },
      { $set: { status: 'superseded' } }
    );

    // Save candidate with adminEditedRate, leaving normalizedRate and sourcePrice INTACT
    candidate.adminEditedRate = numRate;
    candidate.status = 'approved';
    candidate.researchLocation = candidate.city || targetStateName;
    candidate.evidenceLocation = candidate.requestedLocation || `${candidate.city}, ${targetStateName}`;
    candidate.reviewedAt = new Date();
    candidate.reviewedBy = userId;
    candidate.approvalNotes = notes || `Admin edited from ₹${candidate.normalizedRate || candidate.sourcePrice} to ₹${numRate}`;
    await candidate.save();

    return {
      success: true,
      candidate: candidate.toObject(),
      rateRecord: updateResult.rateRecord
    };
  }

  /**
   * Reject a researched candidate.
   * Does NOT modify production MaterialRate.
   */
  async rejectCandidate({ candidateId, reason = '', userId }) {
    if (!candidateId) throw new Error('Candidate ID is required.');
    const candidate = await PriceResearchCandidate.findById(candidateId);
    if (!candidate) throw new Error('Candidate not found.');

    candidate.status = 'rejected';
    candidate.rejectionReason = reason || 'Rejected by administrator.';
    candidate.reviewedAt = new Date();
    candidate.reviewedBy = userId;
    await candidate.save();

    return {
      success: true,
      candidate: candidate.toObject()
    };
  }

  /**
   * Bulk approve candidates.
   * Each candidate is processed independently and atomically.
   */
  async bulkApproveCandidates({ candidateIds = [], userId }) {
    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      throw new Error('At least one candidate ID must be provided for bulk approval.');
    }

    let approvedCount = 0;
    let failedCount = 0;
    const results = [];

    for (const id of candidateIds) {
      try {
        const res = await this.approveCandidate({ candidateId: id, userId, notes: 'Bulk approved by admin.' });
        approvedCount++;
        results.push({ candidateId: id, status: 'approved', rate: res.rateRecord.rate });
      } catch (err) {
        failedCount++;
        results.push({ candidateId: id, status: 'failed', error: err.message });
      }
    }

    return {
      success: true,
      total: candidateIds.length,
      approvedCount,
      failedCount,
      results
    };
  }
}

const priceResearchService = new PriceResearchService();
module.exports = priceResearchService;
