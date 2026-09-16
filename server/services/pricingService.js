const mongoose = require('mongoose');
const Material = require('../models/Material');
const MaterialRate = require('../models/MaterialRate');
const { normalizeState } = require('../data/indianLocations');

/**
 * Resolves current approved material rates for a given state.
 * Strict Production Hierarchy:
 * 1. Approved STATE rate (stateId === targetStateId && status === 'approved')
 * 2. Approved NATIONAL rate fallback (stateId === 'all' && status === 'approved')
 * 3. UNAVAILABLE (pricingStatus = 'UNAVAILABLE' - NO city rate fallback, NO benchmark fallback)
 */
async function getCurrentApprovedRates({ state = '', stateId = '', city = '', cityId = '' } = {}) {
  const activeMaterials = await Material.find({ active: true }).lean();
  
  // Normalize to state location (city input only maps to its containing state for input resolution)
  const norm = normalizeState(state || stateId || city || cityId);
  const targetStateId = norm.stateId;
  const targetStateName = norm.stateName;

  if (!activeMaterials || activeMaterials.length === 0) {
    return {
      pricingStatus: 'UNAVAILABLE',
      pricingScope: 'UNAVAILABLE',
      pricingSource: 'UNAVAILABLE',
      stateId: targetStateId,
      stateName: targetStateName,
      location: targetStateName,
      rates: {},
      missingMaterials: ['ALL_MATERIALS_EMPTY'],
      resolvedCount: 0,
      totalCount: 0,
      lastFetchedAt: new Date().toISOString()
    };
  }

  const ratesMap = {};
  const missingMaterials = [];

  for (const mat of activeMaterials) {
    let chosenRate = null;
    let isStateRate = false;

    // 1. Try approved STATE rate (must be production state rate with cityId === 'all')
    if (targetStateId !== 'all') {
      chosenRate = await MaterialRate.findOne({
        materialCode: mat.materialCode,
        stateId: targetStateId,
        cityId: 'all',
        status: 'approved'
      }).sort({ effectiveFrom: -1 }).lean();
      if (chosenRate) {
        isStateRate = true;
      }
    }

    // 2. Try approved NATIONAL rate fallback (stateId === 'all' AND cityId === 'all')
    if (!chosenRate) {
      chosenRate = await MaterialRate.findOne({
        materialCode: mat.materialCode,
        stateId: 'all',
        cityId: 'all',
        status: 'approved'
      }).sort({ effectiveFrom: -1 }).lean();
    }

    // Also check legacy baseline seed where cityId was 'all' and stateId was unpopulated
    if (!chosenRate) {
      chosenRate = await MaterialRate.findOne({
        materialCode: mat.materialCode,
        cityId: 'all',
        $or: [{ stateId: 'all' }, { stateId: { $exists: false } }, { stateId: null }],
        status: 'approved'
      }).sort({ effectiveFrom: -1 }).lean();
    }

    // 3. ZERO city-rate fallback. Old city-level records never become current production pricing.

    if (chosenRate) {
      const isNational = !isStateRate;
      ratesMap[mat.materialCode] = {
        materialId: mat._id,
        materialCode: mat.materialCode,
        name: mat.name,
        category: mat.category,
        tier: mat.tier,
        unit: chosenRate.unit || mat.unit,
        unitRate: chosenRate.rate,
        rate: chosenRate.rate,
        locationUsed: isNational ? 'National' : (chosenRate.location || targetStateName),
        stateId: isNational ? 'all' : (chosenRate.stateId || targetStateId),
        cityId: 'all',
        pricingScope: isNational ? 'NATIONAL' : 'STATE',
        pricingSource: isNational ? 'APPROVED_NATIONAL_RATE' : 'APPROVED_STATE_RATE',
        effectiveFrom: chosenRate.effectiveFrom,
        source: chosenRate.source,
        rateRecordId: chosenRate._id
      };
    } else {
      missingMaterials.push(mat.materialCode);
    }
  }

  const resolvedKeys = Object.keys(ratesMap);
  const isComplete = missingMaterials.length === 0;

  let overallScope = 'UNAVAILABLE';
  let overallSource = 'UNAVAILABLE';

  if (resolvedKeys.length > 0) {
    const hasNational = resolvedKeys.some(k => ratesMap[k].pricingScope === 'NATIONAL');
    const hasState = resolvedKeys.some(k => ratesMap[k].pricingScope === 'STATE');
    if (hasState && !hasNational) {
      overallScope = 'STATE';
      overallSource = 'APPROVED_STATE_RATE';
    } else if (hasNational && !hasState) {
      overallScope = 'NATIONAL';
      overallSource = 'APPROVED_NATIONAL_RATE';
    } else {
      overallScope = 'HYBRID';
      overallSource = 'APPROVED_STATE_AND_NATIONAL_FALLBACK';
    }
  }

  return {
    pricingStatus: isComplete ? 'APPROVED' : (resolvedKeys.length > 0 ? 'PARTIAL_UNAVAILABLE' : 'UNAVAILABLE'),
    pricingScope: overallScope,
    pricingSource: overallSource,
    stateId: targetStateId,
    stateName: targetStateName,
    location: targetStateName,
    rates: ratesMap,
    missingMaterials,
    resolvedCount: resolvedKeys.length,
    totalCount: activeMaterials.length,
    lastFetchedAt: new Date().toISOString()
  };
}

/**
 * Atomic update of material rate for a STATE.
 * Supersedes previous approved rate for same material & stateId, inserts new approved rate.
 * Uses MongoDB replica set transaction when supported, with resilient fallback for standalone deployments.
 */
async function updateMaterialRate({
  materialCode,
  rate,
  state = '',
  stateId = '',
  location = '',
  cityId = 'all',
  notes = '',
  source = 'admin_manual',
  sourceType = 'admin_manual',
  userId = null
}) {
  if (!materialCode || typeof rate !== 'number' || isNaN(rate) || rate <= 0) {
    throw new Error('Valid materialCode and positive numeric rate are required.');
  }

  const normalizedCode = materialCode.toUpperCase().trim();
  const norm = normalizeState(state || stateId || location);
  const targetStateId = norm.stateId;
  const targetStateName = norm.stateName;

  const material = await Material.findOne({ materialCode: normalizedCode });
  if (!material) {
    throw new Error(`Material with code ${normalizedCode} does not exist.`);
  }

  // Determine if active MongoDB connection supports multi-document transactions (Replica Set)
  const topologyType = mongoose.connection?.client?.topology?.description?.type || '';
  const supportsTransactions = topologyType.includes('ReplicaSet') || topologyType === 'Sharded';

  let session = null;
  if (supportsTransactions) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (e) {
      session = null;
    }
  }

  const useTransactions = Boolean(session);
  const sessionOpt = useTransactions ? { session } : {};

  // For standalone rollback compensation
  let supersededDocId = null;
  let newDocId = null;

  try {
    // 1. Find currently approved rate for this material & state
    let currentApproved = await MaterialRate.findOne(
      { materialCode: normalizedCode, stateId: targetStateId, status: 'approved' },
      null,
      sessionOpt
    ).sort({ effectiveFrom: -1 });

    // If updating national rate and not found by stateId, check cityId: 'all'
    if (!currentApproved && targetStateId === 'all') {
      currentApproved = await MaterialRate.findOne(
        { materialCode: normalizedCode, cityId: 'all', status: 'approved' },
        null,
        sessionOpt
      ).sort({ effectiveFrom: -1 });
    }

    const previousRateValue = currentApproved ? currentApproved.rate : null;

    // 2. Mark previous as superseded
    if (currentApproved) {
      await MaterialRate.updateOne(
        { _id: currentApproved._id },
        { $set: { status: 'superseded' } },
        sessionOpt
      );
      supersededDocId = currentApproved._id;
    }

    // 3. Insert new rate as approved STATE rate (cityId is 'all')
    const newRateDoc = new MaterialRate({
      materialId: material._id,
      materialCode: normalizedCode,
      rate,
      unit: material.unit,
      currency: 'INR',
      location: targetStateName,
      stateId: targetStateId,
      cityId: 'all', // Production rates are strictly state-scoped
      effectiveFrom: new Date(),
      source: source || 'admin_manual',
      sourceType: sourceType || 'admin_manual',
      notes: notes || '',
      updatedBy: userId || null,
      approvedBy: userId || null,
      status: 'approved',
      previousRate: previousRateValue,
      schemaVersion: 1
    });

    await newRateDoc.save(sessionOpt);
    newDocId = newRateDoc._id;

    // 4. Touch material updatedAt
    await Material.updateOne(
      { _id: material._id },
      { $set: { updatedAt: new Date() } },
      sessionOpt
    );

    if (useTransactions && session) {
      await session.commitTransaction();
    }

    return {
      success: true,
      rateRecord: newRateDoc.toObject(),
      previousRate: previousRateValue,
      transactional: useTransactions,
      deploymentNote: useTransactions
        ? 'Transaction committed via MongoDB ACID replica set session.'
        : 'Standalone MongoDB deployment detected: atomic sequential execution with rollback compensation applied.'
    };
  } catch (error) {
    if (useTransactions && session) {
      try {
        await session.abortTransaction();
      } catch (_) {}
    } else if (!useTransactions) {
      // Standalone compensation rollback
      try {
        if (newDocId) {
          await MaterialRate.deleteOne({ _id: newDocId });
        }
        if (supersededDocId) {
          await MaterialRate.updateOne({ _id: supersededDocId }, { $set: { status: 'approved' } });
        }
      } catch (compensationErr) {
        console.error('Compensation rollback error:', compensationErr.message);
      }
    }
    throw error;
  } finally {
    if (session) {
      try {
        session.endSession();
      } catch (_) {}
    }
  }
}

/**
 * Returns complete rate revision history for audit display (append-only).
 */
async function getMaterialRateHistory(materialCode, stateId = null) {
  const normalizedCode = (materialCode || '').toUpperCase().trim();
  const material = await Material.findOne({ materialCode: normalizedCode }).lean();
  if (!material) {
    throw new Error(`Material ${normalizedCode} not found.`);
  }

  const query = { materialCode: normalizedCode };
  if (stateId && stateId !== 'all') {
    query.$or = [{ stateId }, { stateId: 'all' }];
  }

  const history = await MaterialRate.find(query)
    .sort({ effectiveFrom: -1 })
    .populate('updatedBy', 'name email')
    .populate('approvedBy', 'name email')
    .lean();

  return {
    material,
    history
  };
}

/**
 * Creates an authoritative server-trusted pricing snapshot for a project based on approved STATE pricing.
 * Preserves ALL pricing inputs capable of changing the final project estimate:
 * - snapshotId, createdAt, currency, stateId, stateName, location
 * - materialRates (materialCode, materialName, unit, unitRate, rateRecordId, rateEffectiveDate, rateSource)
 * - laborRates, taxRates, overheadParameters, pricingSchemaVersion
 * IMMUTABILITY GUARANTEE: Snapshot is saved once on estimate creation and remains unchanged.
 */
async function createServerPricingSnapshot({
  state = '',
  stateId = '',
  city = '',
  cityId = '',
  isBenchmarkMode = false,
  benchmarkRates = null,
  stateSnapshot = null
}) {
  const locInput = state || stateId || stateSnapshot?.state || stateSnapshot?.stateId || city || cityId || stateSnapshot?.city || 'Karnataka';
  const norm = normalizeState(locInput);
  const targetStateId = norm.stateId;
  const targetStateName = norm.stateName;

  const laborRates = stateSnapshot?.laborRates || {
    structure: 280,
    masonryPlaster: 180,
    flooringTiling: 45,
    plumbingMEP: 65,
    electrical: 55,
    painting: 14
  };
  const taxRates = {
    gstPct: stateSnapshot?.gstRate !== undefined ? Number(stateSnapshot.gstRate) : 18,
    labourCessPct: stateSnapshot?.labourCessRate !== undefined ? Number(stateSnapshot.labourCessRate) : 1
  };
  const overheadParameters = {
    architectureDesignFeesPct: stateSnapshot?.architectureDesignFeesPct !== undefined ? Number(stateSnapshot.architectureDesignFeesPct) : 2.5,
    contractorMarginPct: stateSnapshot?.contractorMarginPct !== undefined ? Number(stateSnapshot.contractorMarginPct) : 10,
    contingencyPct: stateSnapshot?.contingencyPct !== undefined ? Number(stateSnapshot.contingencyPct) : 4
  };

  if (isBenchmarkMode) {
    return {
      snapshotId: `snap_bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
      currency: 'INR',
      stateId: targetStateId,
      stateName: targetStateName,
      location: targetStateName,
      cityId: cityId || 'all',
      cityName: city || targetStateName,
      regionalMultiplier: 1.0,
      cityMultiplier: 1.0,
      isBenchmark: true,
      ratesSource: 'BENCHMARK_DEMO_MODE',
      pricingSchemaVersion: 1,
      schemaVersion: 1,
      materialRates: benchmarkRates || {},
      rates: benchmarkRates || {},
      laborRates,
      taxRates,
      overheadParameters
    };
  }

  const approved = await getCurrentApprovedRates({ state: targetStateName, stateId: targetStateId });
  if (approved.pricingStatus !== 'APPROVED') {
    throw new Error(`Cannot create production snapshot: approved rates missing for ${approved.missingMaterials.join(', ')}`);
  }

  const formattedMaterialRates = {};
  for (const [code, rateInfo] of Object.entries(approved.rates)) {
    const customOptionId = stateSnapshot?.customMaterials?.[rateInfo.category?.toLowerCase()] || null;
    formattedMaterialRates[code] = {
      materialId: rateInfo.materialId,
      materialCode: rateInfo.materialCode,
      materialName: rateInfo.name,
      category: rateInfo.category,
      unit: rateInfo.unit,
      unitRate: rateInfo.unitRate,
      rate: rateInfo.unitRate,
      selectedBrand: rateInfo.brand || '',
      selectedGrade: rateInfo.grade || '',
      selectedOptionId: customOptionId,
      rateRecordId: rateInfo.rateRecordId,
      rateEffectiveDate: rateInfo.effectiveFrom,
      rateSource: rateInfo.source || 'approved_database',
      pricingScope: rateInfo.pricingScope || approved.pricingScope,
      pricingSource: rateInfo.pricingSource || approved.pricingSource,
      stateId: rateInfo.stateId,
      locationUsed: rateInfo.locationUsed
    };
  }

  return {
    snapshotId: `snap_prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date(),
    currency: 'INR',
    stateId: approved.stateId,
    stateName: approved.stateName,
    state: approved.stateName,
    location: approved.location || approved.stateName,
    cityId: cityId || city || 'all',
    cityName: city || approved.stateName,
    regionalMultiplier: 1.0,
    cityMultiplier: 1.0,
    isBenchmark: false,
    ratesSource: approved.pricingScope === 'NATIONAL' ? 'APPROVED_NATIONAL_RATES' : 'APPROVED_STATE_RATES',
    pricingScope: approved.pricingScope,
    pricingSource: approved.pricingSource,
    pricingSchemaVersion: 1,
    schemaVersion: 1,
    materialRates: formattedMaterialRates,
    rates: formattedMaterialRates,
    laborRates,
    taxRates,
    overheadParameters
  };
}

module.exports = {
  getCurrentApprovedRates,
  updateMaterialRate,
  getMaterialRateHistory,
  createServerPricingSnapshot
};
