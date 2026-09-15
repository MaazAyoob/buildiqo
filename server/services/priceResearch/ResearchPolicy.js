/**
 * Centralized Research Policy Layer
 * Controls research constraints, freshness expectations, variance bands,
 * concurrency limits, and source quality weights.
 */

const ResearchPolicy = {
  // Concurrency & batch limits
  MAX_MATERIALS_PER_RUN: parseInt(process.env.PRICE_RESEARCH_MAX_MATERIALS, 10) || 100,
  MAX_CONCURRENCY: parseInt(process.env.PRICE_RESEARCH_MAX_CONCURRENCY, 10) || 3,
  PROVIDER_TIMEOUT_MS: parseInt(process.env.PRICE_RESEARCH_TIMEOUT_MS, 10) || 30000,

  // Variance Thresholds
  VARIANCE_BANDS: {
    NORMAL: 5,              // < 5%
    REVIEW_RECOMMENDED: 15, // 5% - 15%
    LARGE_CHANGE: 30        // 15% - 30%; > 30% is HIGH_VARIANCE
  },

  getVarianceFlag(diffPercent) {
    const absDiff = Math.abs(diffPercent || 0);
    if (absDiff < this.VARIANCE_BANDS.NORMAL) return 'normal';
    if (absDiff < this.VARIANCE_BANDS.REVIEW_RECOMMENDED) return 'review_recommended';
    if (absDiff <= this.VARIANCE_BANDS.LARGE_CHANGE) return 'large_change';
    return 'high_variance';
  },

  // Freshness thresholds (in days)
  FRESHNESS: {
    RECENT_DAYS: 30,
    MODERATE_DAYS: 90,
    STALE_DAYS: 180
  },

  // Source type credibility rankings
  SOURCE_TYPES: {
    GOVERNMENT: 'government',
    MANUFACTURER: 'manufacturer',
    AUTHORIZED_DEALER: 'authorized_dealer',
    MARKET_PUBLICATION: 'market_publication',
    MARKETPLACE: 'marketplace',
    COMMERCIAL: 'commercial',
    OTHER: 'other'
  },

  SOURCE_QUALITY_WEIGHTS: {
    government: 25,
    manufacturer: 22,
    authorized_dealer: 20,
    market_publication: 18,
    marketplace: 15,
    commercial: 10,
    other: 5
  },

  // Ambiguous units that must NEVER be guessed
  AMBIGUOUS_UNITS: [
    'truck', 'lorry', 'tractor', 'load', 'trip', 'trolley', 'bundle', 'vehicle', 'dumper'
  ]
};

module.exports = ResearchPolicy;
