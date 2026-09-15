const ResearchPolicy = require('./ResearchPolicy');

/**
 * Validates researched candidate rate data.
 */
function validateCandidateRate({
  material,
  candidate,
  currentApprovedRate = null
}) {
  const errors = [];
  const warnings = [];

  // 1. Material existence
  if (!material || !material.materialCode) {
    errors.push('Material specification is missing or invalid.');
  }

  // 2. Location
  if (!candidate.state) {
    errors.push('State location is required.');
  }

  // 3. Currency
  if (candidate.currency && candidate.currency.toUpperCase() !== 'INR') {
    errors.push(`Invalid currency '${candidate.currency}'. Only INR is supported.`);
  }

  // 4. Rate numeric & positive
  if (candidate.normalizedRate === null || candidate.normalizedRate === undefined) {
    warnings.push('Normalized rate is null. Normalization required before approval.');
  } else if (typeof candidate.normalizedRate !== 'number' || isNaN(candidate.normalizedRate) || candidate.normalizedRate <= 0) {
    errors.push(`Candidate rate must be a positive number. Received: ${candidate.normalizedRate}`);
  }

  // 5. Source URL Security (https only)
  if (candidate.sourceUrl) {
    try {
      const parsedUrl = new URL(candidate.sourceUrl);
      if (parsedUrl.protocol !== 'https:') {
        warnings.push(`Insecure source URL protocol '${parsedUrl.protocol}'. Only https:// is trusted.`);
      }
    } catch (e) {
      warnings.push(`Source URL '${candidate.sourceUrl}' is malformed.`);
    }
  } else {
    warnings.push('No direct source URL provided by research.');
  }

  // 6. Specification & Grade Matching
  let specificationMatch = true;
  const matGrade = (material.grade || '').toUpperCase().trim();
  const candGrade = (candidate.grade || candidate.specification || '').toUpperCase().trim();

  // Strict check for TMT steel grades (Fe500 != Fe500D)
  if (matGrade.includes('FE500D') && !candGrade.includes('500D')) {
    specificationMatch = false;
    warnings.push(`Specification mismatch: Material requires Fe500D (earthquake resistant ductile grade), but research reported '${candidate.grade || candidate.specification}'.`);
  } else if (matGrade.includes('FE550D') && !candGrade.includes('550D')) {
    specificationMatch = false;
    warnings.push(`Specification mismatch: Material requires Fe550D, but research reported '${candidate.grade || candidate.specification}'.`);
  }

  // Strict check for Cement grades (OPC 53 != OPC 43, OPC != PPC)
  if (matGrade.includes('53') && candGrade.includes('43')) {
    specificationMatch = false;
    warnings.push('Specification mismatch: Material is 53 Grade Cement, but source reported 43 Grade.');
  }
  const matNameUpper = (material.name || '').toUpperCase();
  if (matNameUpper.includes('OPC') && (candGrade.includes('PPC') || (candidate.sourceTitle || '').toUpperCase().includes('PPC'))) {
    specificationMatch = false;
    warnings.push('Specification mismatch: Material is OPC, but source reported PPC (Portland Pozzolana Cement).');
  }

  // 7. Price variance compared to current approved rate
  let priceDifferencePercent = 0;
  let varianceFlag = 'normal';

  if (currentApprovedRate && candidate.normalizedRate && currentApprovedRate > 0) {
    priceDifferencePercent = Math.round(((candidate.normalizedRate - currentApprovedRate) / currentApprovedRate) * 10000) / 100;
    varianceFlag = ResearchPolicy.getVarianceFlag(priceDifferencePercent);

    if (varianceFlag === 'high_variance') {
      warnings.push(`Large price deviation detected: ${priceDifferencePercent > 0 ? '+' : ''}${priceDifferencePercent}% from current approved rate (₹${currentApprovedRate} → ₹${candidate.normalizedRate}). High variance review required.`);
    } else if (varianceFlag === 'large_change') {
      warnings.push(`Notable price change: ${priceDifferencePercent > 0 ? '+' : ''}${priceDifferencePercent}% from current approved rate.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    varianceFlag,
    priceDifferencePercent,
    specificationMatch
  };
}

module.exports = {
  validateCandidateRate
};
