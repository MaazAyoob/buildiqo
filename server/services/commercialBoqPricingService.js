const pricingService = require('./pricingService');
const { normalizeState } = require('../data/indianLocations');

/**
 * Resolves the applicable quantity for a row based on selected quantity basis
 */
function resolveQuantityBasis(row) {
  if (!row) return 0;
  if (row.quantityBasis === 'siteQuantity' && row.siteQuantity !== null && row.siteQuantity !== undefined) {
    return Number(row.siteQuantity) || 0;
  }
  if (row.quantityBasis === 'designQuantity' && row.designQuantity !== null && row.designQuantity !== undefined) {
    return Number(row.designQuantity) || 0;
  }
  return Number(row.quantity) || 0;
}

/**
 * Deterministically calculates line amount:
 * quantity × BOQ currentRate
 * Note: Material reference rate NEVER enters this equation automatically.
 */
function calculateLineAmount(row) {
  const qty = resolveQuantityBasis(row);
  const rate = Number(row.currentRate) || 0;
  return Math.round(qty * rate * 100) / 100;
}

/**
 * Attaches or refreshes Buildiqo material pricing intelligence without modifying commercial rates
 */
async function attachPricingIntelligence(boq, stateName = 'Karnataka') {
  const norm = normalizeState(stateName);
  const pricingResult = await pricingService.getCurrentApprovedRates({ state: norm.stateName, stateId: norm.stateId });

  boq.pricingState = norm.stateName;
  boq.pricingStateId = norm.stateId;
  boq.pricingScope = pricingResult.pricingScope || 'STATE';
  boq.pricingSnapshot = {
    stateId: norm.stateId,
    stateName: norm.stateName,
    pricingScope: pricingResult.pricingScope,
    pricingStatus: pricingResult.pricingStatus,
    rates: pricingResult.rates || {},
    capturedAt: new Date().toISOString()
  };

  const ratesMap = pricingResult.rates || {};

  // Enrich each row's material intelligence layer only
  for (const sheet of boq.sheets) {
    if (sheet.isSummarySheet) continue;

    for (const section of sheet.sections) {
      for (const row of section.rows) {
        if (row.materialCode && ratesMap[row.materialCode]) {
          const matched = ratesMap[row.materialCode];
          row.latestMaterialRate = matched.unitRate || matched.rate;
          row.latestMaterialRateUnit = matched.unit || '';
          row.materialRateSource = matched.pricingScope === 'NATIONAL' ? 'NATIONAL' : 'STATE';
          row.materialPricingScope = matched.pricingScope || 'STATE';
          row.materialRateRecordId = matched.rateRecordId || null;
        } else if (row.materialCode) {
          row.latestMaterialRate = null;
          row.materialRateSource = 'UNAVAILABLE';
          row.materialPricingScope = 'UNAVAILABLE';
        }
      }
    }
  }

  return boq;
}

/**
 * Recalculates all line amounts, section subtotals, sheet subtotals, BOQ subtotal, GST, and grand total
 */
function recalculateBOQ(boq) {
  let boqSubtotal = 0;
  const summaryBreakdown = [];

  for (const sheet of boq.sheets) {
    if (sheet.isSummarySheet) continue;

    let sheetSubtotal = 0;

    for (const section of sheet.sections) {
      let sectionSubtotal = 0;

      for (const row of section.rows) {
        row.amount = calculateLineAmount(row);
        sectionSubtotal = Math.round((sectionSubtotal + row.amount) * 100) / 100;
      }

      section.subtotal = sectionSubtotal;
      sheetSubtotal = Math.round((sheetSubtotal + sectionSubtotal) * 100) / 100;

      summaryBreakdown.push({
        sheetName: sheet.name,
        sectionCode: section.code || '',
        sectionName: section.name,
        subtotal: sectionSubtotal
      });
    }

    sheet.subtotal = sheetSubtotal;
    boqSubtotal = Math.round((boqSubtotal + sheetSubtotal) * 100) / 100;
  }

  const gstRate = boq.gstRate !== undefined ? Number(boq.gstRate) : 18;
  const gstAmount = Math.round(boqSubtotal * (gstRate / 100) * 100) / 100;
  const grandTotal = Math.round((boqSubtotal + gstAmount) * 100) / 100;

  boq.totals = {
    subtotal: boqSubtotal,
    gstRate,
    gstAmount,
    grandTotal,
    summaryBreakdown
  };

  if (boq.stats) {
    boq.stats.totalCurrentAmount = boqSubtotal;
  }

  return boq;
}

/**
 * Safely applies an approved Buildiqo material benchmark rate to an explicitly compatible BOQ row
 */
function applyMaterialRateToRow(row, user = null) {
  if (row.compatibilityStatus !== 'COMPATIBLE') {
    throw new Error(
      `Cannot apply material rate: Item "${row.description}" is flagged as "${row.compatibilityStatus}". ` +
      `Direct application is only permitted for compatible direct material supply items with matching units.`
    );
  }

  if (row.latestMaterialRate === null || row.latestMaterialRate === undefined) {
    throw new Error(`No valid Buildiqo benchmark rate is available for material ${row.materialCode}.`);
  }

  const prevRate = row.currentRate;
  const newRate = row.latestMaterialRate;

  // Append to audit trail
  if (!row.rateHistory) row.rateHistory = [];
  row.rateHistory.push({
    originalRate: prevRate,
    updatedRate: newRate,
    rateSource: row.materialRateSource || 'STATE',
    changedBy: user ? user._id : null,
    changedAt: new Date(),
    reason: `Explicitly applied Buildiqo ${row.materialRateSource || 'STATE'} benchmark rate`
  });

  row.currentRate = newRate;
  row.rateSource = row.materialRateSource || 'STATE';
  row.amount = calculateLineAmount(row);

  return row;
}

module.exports = {
  resolveQuantityBasis,
  calculateLineAmount,
  attachPricingIntelligence,
  recalculateBOQ,
  applyMaterialRateToRow
};
