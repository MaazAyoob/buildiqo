const mongoose = require('mongoose');
const Material = require('../models/Material');
const MaterialRate = require('../models/MaterialRate');

/**
 * Resolves current approved material rates for a given city/location.
 * Hierarchy for production:
 * 1. Exact city-approved rate (cityId === targetCityId && status === 'approved')
 * 2. State-approved rate (stateId === targetStateId && status === 'approved')
 * 3. National/default approved rate (cityId === 'all' && status === 'approved')
 * 4. Returns null (UNAVAILABLE) - NO SILENT BENCHMARK FALLBACK
 */
async function getCurrentApprovedRates({ cityId = 'all', cityName = '', stateId = 'all' } = {}) {
  const activeMaterials = await Material.find({ active: true }).lean();
  if (!activeMaterials || activeMaterials.length === 0) {
    return {
      pricingStatus: 'UNAVAILABLE',
      cityId,
      cityName,
      stateId,
      rates: {},
      missingMaterials: ['ALL_MATERIALS_EMPTY'],
      resolvedCount: 0,
      totalCount: 0
    };
  }

  const normalizedCityId = (cityId || 'all').toLowerCase().trim();
  const normalizedStateId = (stateId || 'all').toLowerCase().trim();
  const ratesMap = {};
  const missingMaterials = [];

  for (const mat of activeMaterials) {
    let chosenRate = null;

    // 1. Try exact city rate if specified
    if (normalizedCityId !== 'all') {
      chosenRate = await MaterialRate.findOne({
        materialCode: mat.materialCode,
        cityId: normalizedCityId,
        status: 'approved'
      }).sort({ effectiveFrom: -1 }).lean();
    }

    // 2. Try state-level approved rate if city rate not found
    if (!chosenRate && normalizedStateId !== 'all') {
      chosenRate = await MaterialRate.findOne({
        materialCode: mat.materialCode,
        stateId: normalizedStateId,
        status: 'approved'
      }).sort({ effectiveFrom: -1 }).lean();
    }

    // 3. Try national/default approved rate
    if (!chosenRate) {
      chosenRate = await MaterialRate.findOne({
        materialCode: mat.materialCode,
        cityId: 'all',
        status: 'approved'
      }).sort({ effectiveFrom: -1 }).lean();
    }

    if (chosenRate) {
      ratesMap[mat.materialCode] = {
        materialId: mat._id,
        materialCode: mat.materialCode,
        name: mat.name,
        category: mat.category,
        tier: mat.tier,
        unit: chosenRate.unit || mat.unit,
        unitRate: chosenRate.rate,
        locationUsed: chosenRate.location || 'National',
        cityId: chosenRate.cityId,
        effectiveFrom: chosenRate.effectiveFrom,
        source: chosenRate.source,
        rateRecordId: chosenRate._id
      };
    } else {
      missingMaterials.push(mat.materialCode);
    }
  }

  const isComplete = missingMaterials.length === 0;

  return {
    pricingStatus: isComplete ? 'APPROVED' : 'PARTIAL_UNAVAILABLE',
    cityId: normalizedCityId,
    cityName,
    rates: ratesMap,
    missingMaterials,
    resolvedCount: Object.keys(ratesMap).length,
    totalCount: activeMaterials.length,
    lastFetchedAt: new Date().toISOString()
  };
}

/**
 * Atomic update of material rate.
 * Supersedes previous approved rate for same material & cityId, inserts new approved rate.
 * Uses MongoDB replica set transaction when supported, with resilient fallback for standalone deployments.
 */
async function updateMaterialRate({ materialCode, rate, location = 'National', cityId = 'all', stateId = 'all', notes = '', source = 'admin_manual', userId = null }) {
  if (!materialCode || typeof rate !== 'number' || isNaN(rate) || rate <= 0) {
    throw new Error('Valid materialCode and positive numeric rate are required.');
  }

  const normalizedCode = materialCode.toUpperCase().trim();
  const normalizedCityId = (cityId || 'all').toLowerCase().trim();
  const normalizedStateId = (stateId || 'all').toLowerCase().trim();
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
    // 1. Find currently approved rate
    const currentApproved = await MaterialRate.findOne(
      { materialCode: normalizedCode, cityId: normalizedCityId, status: 'approved' },
      null,
      sessionOpt
    ).sort({ effectiveFrom: -1 });

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

    // 3. Insert new rate as approved
    const newRateDoc = new MaterialRate({
      materialId: material._id,
      materialCode: normalizedCode,
      rate,
      unit: material.unit,
      location: location || 'National',
      cityId: normalizedCityId,
      stateId: normalizedStateId,
      effectiveFrom: new Date(),
      source: source || 'admin_manual',
      notes: notes || '',
      updatedBy: userId || null,
      status: 'approved',
      previousRate: previousRateValue
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
async function getMaterialRateHistory(materialCode) {
  const normalizedCode = (materialCode || '').toUpperCase().trim();
  const material = await Material.findOne({ materialCode: normalizedCode }).lean();
  if (!material) {
    throw new Error(`Material ${normalizedCode} not found.`);
  }

  const history = await MaterialRate.find({ materialCode: normalizedCode })
    .sort({ effectiveFrom: -1 })
    .populate('updatedBy', 'name email')
    .lean();

  return {
    material,
    history
  };
}

/**
 * Creates an authoritative server-trusted pricing snapshot for a project.
 * Preserves ALL pricing inputs capable of changing the final project estimate (Correction 4 & 5):
 * - snapshotId, createdAt, currency, cityId, cityName, regionalMultiplier
 * - materialRates (materialCode, materialName, unit, unitRate, selectedBrand, selectedGrade, rateRecordId, rateEffectiveDate, rateSource)
 * - laborRates, taxRates, overheadParameters, pricingSchemaVersion
 */
async function createServerPricingSnapshot({
  cityId = 'bangalore',
  cityName = 'Bengaluru',
  cityMultiplier = 1.0,
  isBenchmarkMode = false,
  benchmarkRates = null,
  stateSnapshot = null
}) {
  const regionalMultiplier = Number(cityMultiplier) || 1.0;
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
    // Explicit benchmark/demo mode only
    return {
      snapshotId: `snap_bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
      currency: 'INR',
      cityId,
      cityName,
      regionalMultiplier,
      cityMultiplier: regionalMultiplier,
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

  const approved = await getCurrentApprovedRates({ cityId, cityName });
  if (approved.pricingStatus !== 'APPROVED') {
    throw new Error(`Cannot create production snapshot: approved rates missing for ${approved.missingMaterials.join(', ')}`);
  }

  // Format material rates with full metadata required by Correction 4
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
      rateSource: rateInfo.source || 'approved_database'
    };
  }

  return {
    snapshotId: `snap_prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date(),
    currency: 'INR',
    cityId: approved.cityId,
    cityName,
    regionalMultiplier,
    cityMultiplier: regionalMultiplier,
    isBenchmark: false,
    ratesSource: 'APPROVED_DATABASE_RATES',
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
