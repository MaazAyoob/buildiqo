const ResearchPolicy = require('./ResearchPolicy');

/**
 * Deterministic Unit Normalization Engine.
 * Converts reported source price and unit into canonical Material unit.
 * Ambiguous units (e.g. truck, lorry, bundle) are NEVER guessed.
 */
function normalizePrice({ sourcePrice, sourceUnit, canonicalUnit, materialSpecification = '' }) {
  const price = Number(sourcePrice);
  if (isNaN(price) || price <= 0) {
    return {
      normalizedRate: null,
      normalizedUnit: canonicalUnit,
      normalizationStatus: 'NORMALIZATION_REQUIRED',
      normalizationReason: 'Source price is not a positive number.',
      sourcePrice,
      sourceUnit
    };
  }

  const sUnit = (sourceUnit || '').toLowerCase().trim();
  const cUnit = (canonicalUnit || '').toLowerCase().trim();

  // Check for ambiguous units first (NEVER guess)
  for (const amb of ResearchPolicy.AMBIGUOUS_UNITS) {
    if (sUnit.includes(amb)) {
      return {
        normalizedRate: null,
        normalizedUnit: canonicalUnit,
        normalizationStatus: 'NORMALIZATION_REQUIRED',
        normalizationReason: `Ambiguous unit '${sourceUnit}' cannot be converted to '${canonicalUnit}' without verified capacity specification. Admin manual entry required.`,
        sourcePrice: price,
        sourceUnit
      };
    }
  }

  // 1. Direct unit match
  if (sUnit === cUnit || sUnit === cUnit.replace(/s$/, '') || sUnit.replace(/s$/, '') === cUnit) {
    return {
      normalizedRate: Math.round(price * 100) / 100,
      normalizedUnit: canonicalUnit,
      normalizationStatus: 'DIRECT',
      normalizationReason: `Direct matching unit (${sourceUnit} == ${canonicalUnit}).`,
      sourcePrice: price,
      sourceUnit
    };
  }

  // 2. Tonne / Metric Ton / MT -> kg
  const isTonne = /tonne|metric\s*ton|mt\b/i.test(sUnit);
  if (isTonne && cUnit === 'kg') {
    const ratePerKg = price / 1000;
    return {
      normalizedRate: Math.round(ratePerKg * 100) / 100,
      normalizedUnit: 'kg',
      normalizationStatus: 'NORMALIZED',
      normalizationReason: `Converted from ${sourceUnit} to kg using exact conversion: 1 tonne = 1,000 kg (₹${price} / 1000 = ₹${ratePerKg.toFixed(2)}/kg).`,
      sourcePrice: price,
      sourceUnit
    };
  }

  // 3. Quintal -> kg
  const isQuintal = /quintal|qtl/i.test(sUnit);
  if (isQuintal && cUnit === 'kg') {
    const ratePerKg = price / 100;
    return {
      normalizedRate: Math.round(ratePerKg * 100) / 100,
      normalizedUnit: 'kg',
      normalizationStatus: 'NORMALIZED',
      normalizationReason: `Converted from ${sourceUnit} to kg using exact conversion: 1 quintal = 100 kg (₹${price} / 100 = ₹${ratePerKg.toFixed(2)}/kg).`,
      sourcePrice: price,
      sourceUnit
    };
  }

  // 4. 50kg bag -> bag
  const is50kgBag = /50\s*kg\s*bag|50kg/i.test(sUnit);
  if (is50kgBag && (cUnit === 'bag' || cUnit === 'bags')) {
    return {
      normalizedRate: Math.round(price * 100) / 100,
      normalizedUnit: canonicalUnit,
      normalizationStatus: 'NORMALIZED',
      normalizationReason: `Standard 50kg cement bag matches canonical unit '${canonicalUnit}'.`,
      sourcePrice: price,
      sourceUnit
    };
  }

  // 5. Unmapped unit conversion -> NORMALIZATION_REQUIRED (no guessing)
  return {
    normalizedRate: null,
    normalizedUnit: canonicalUnit,
    normalizationStatus: 'NORMALIZATION_REQUIRED',
    normalizationReason: `No verified conversion factor between '${sourceUnit}' and '${canonicalUnit}'. Admin manual conversion required.`,
    sourcePrice: price,
    sourceUnit
  };
}

module.exports = {
  normalizePrice
};
