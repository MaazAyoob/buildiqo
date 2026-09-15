const ResearchPolicy = require('./ResearchPolicy');

/**
 * Deterministic Confidence Scorer.
 * Returns HIGH (>=75), MEDIUM (50-74), or LOW (<50) with an explainable trace.
 */
function calculateConfidence({
  candidate,
  material,
  normalizationResult,
  validationResult
}) {
  let score = 0;
  const reasons = [];

  // 1. Recency
  let publishedAgeDays = null;
  if (candidate.sourcePublishedDate) {
    const pubDate = new Date(candidate.sourcePublishedDate);
    if (!isNaN(pubDate.getTime())) {
      publishedAgeDays = Math.floor((Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  if (publishedAgeDays !== null && publishedAgeDays <= ResearchPolicy.FRESHNESS.RECENT_DAYS) {
    score += 20;
    reasons.push(`Recent publication (${publishedAgeDays} days ago, +20)`);
  } else if (publishedAgeDays !== null && publishedAgeDays <= ResearchPolicy.FRESHNESS.MODERATE_DAYS) {
    score += 10;
    reasons.push(`Moderately fresh source (${publishedAgeDays} days ago, +10)`);
  } else {
    score += 5;
    reasons.push(`Source date unconfirmed or >90 days old (+5)`);
  }

  // 2. Location Match
  if (candidate.locationScope === 'city' && candidate.city && candidate.city !== 'All') {
    score += 25;
    reasons.push(`Exact city-level market rate for ${candidate.city} (+25)`);
  } else if (candidate.state && candidate.state !== 'National') {
    score += 15;
    reasons.push(`State-level regional rate for ${candidate.state} (+15)`);
  } else {
    score += 5;
    reasons.push('National default scope (+5)');
  }

  // 3. Specification & Grade Match
  if (validationResult && validationResult.specificationMatch === false) {
    score -= 25;
    reasons.push('Specification/grade mismatch flagged (-25)');
  } else {
    score += 20;
    reasons.push('Exact specification and grade match (+20)');
  }

  // 4. Unit Certainty & Normalization
  if (normalizationResult.normalizationStatus === 'DIRECT') {
    score += 15;
    reasons.push(`Direct canonical unit match '${normalizationResult.normalizedUnit}' (+15)`);
  } else if (normalizationResult.normalizationStatus === 'NORMALIZED') {
    score += 15;
    reasons.push(`Exact deterministic conversion to '${normalizationResult.normalizedUnit}' (+15)`);
  } else {
    score -= 30;
    reasons.push(`Ambiguous unit requires manual admin conversion (-30)`);
  }

  // 5. Source Quality & Type
  const sType = candidate.sourceType || 'other';
  const sourceWeight = ResearchPolicy.SOURCE_QUALITY_WEIGHTS[sType] || 5;
  score += sourceWeight;
  reasons.push(`Source category: ${sType.replace(/_/g, ' ')} (+${sourceWeight})`);

  // 6. Source URL Security
  if (candidate.sourceUrl && candidate.sourceUrl.startsWith('https://')) {
    score += 5;
  } else {
    score -= 10;
    reasons.push('Source URL missing or insecure (-10)');
  }

  // 7. Multi-Source Corroboration
  if (Array.isArray(candidate.evidence) && candidate.evidence.length > 1) {
    score += 10;
    reasons.push(`Corroborated by ${candidate.evidence.length} independent source citations (+10)`);
  }

  // Bound score 0 - 100
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  let confidence = 'LOW';
  if (finalScore >= 75) {
    confidence = 'HIGH';
  } else if (finalScore >= 50) {
    confidence = 'MEDIUM';
  }

  return {
    confidence,
    confidenceScore: finalScore,
    confidenceReason: reasons.join('; ')
  };
}

module.exports = {
  calculateConfidence
};
