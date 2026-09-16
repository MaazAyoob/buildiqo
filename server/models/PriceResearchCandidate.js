const mongoose = require('mongoose');

const evidenceItemSchema = new mongoose.Schema({
  sourceName: { type: String, default: '' },
  sourceUrl: { type: String, default: '' },
  sourceTitle: { type: String, default: '' },
  sourcePublishedDate: { type: String, default: '' },
  reportedPrice: { type: Number, default: 0 },
  reportedUnit: { type: String, default: '' },
  sourceType: {
    type: String,
    enum: ['government', 'manufacturer', 'authorized_dealer', 'market_publication', 'marketplace', 'commercial', 'other'],
    default: 'other'
  },
  taxStatus: {
    type: String,
    enum: ['inclusive', 'exclusive', 'unknown'],
    default: 'unknown'
  },
  freightStatus: {
    type: String,
    enum: ['included', 'excluded', 'unknown'],
    default: 'unknown'
  }
}, { _id: false });

const priceResearchCandidateSchema = new mongoose.Schema({
  runId: {
    type: String,
    required: true,
    index: true
  },
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true,
    index: true
  },
  materialCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true
  },
  materialName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  requestedLocation: {
    type: String,
    default: 'National'
  },
  state: {
    type: String,
    default: 'National',
    index: true
  },
  city: {
    type: String,
    default: 'All',
    index: true
  },
  researchLocation: {
    type: String,
    default: ''
  },
  evidenceLocation: {
    type: String,
    default: ''
  },
  locationScope: {
    type: String,
    enum: ['city', 'state', 'national'],
    default: 'city'
  },
  sourceName: {
    type: String,
    default: ''
  },
  sourceUrl: {
    type: String,
    default: ''
  },
  sourceTitle: {
    type: String,
    default: ''
  },
  sourcePublishedDate: {
    type: String,
    default: ''
  },
  sourceType: {
    type: String,
    enum: ['government', 'manufacturer', 'authorized_dealer', 'market_publication', 'marketplace', 'commercial', 'other'],
    default: 'other'
  },
  researchDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  sourcePrice: {
    type: Number,
    required: true
  },
  sourceUnit: {
    type: String,
    required: true
  },
  normalizedRate: {
    type: Number,
    default: null
  },
  normalizedUnit: {
    type: String,
    required: true
  },
  normalizationStatus: {
    type: String,
    enum: ['DIRECT', 'NORMALIZED', 'NORMALIZATION_REQUIRED'],
    default: 'DIRECT'
  },
  currency: {
    type: String,
    default: 'INR'
  },
  taxIncluded: {
    type: Boolean,
    default: null
  },
  taxRateIfKnown: {
    type: Number,
    default: null
  },
  taxStatus: {
    type: String,
    enum: ['inclusive', 'exclusive', 'unknown'],
    default: 'unknown'
  },
  freightIncluded: {
    type: Boolean,
    default: null
  },
  freightStatus: {
    type: String,
    enum: ['included', 'excluded', 'unknown'],
    default: 'unknown'
  },
  deliveryIncluded: {
    type: Boolean,
    default: null
  },
  deliveryStatus: {
    type: String,
    enum: ['included', 'excluded', 'unknown'],
    default: 'unknown'
  },
  minimumOrderQuantity: {
    type: String,
    default: ''
  },
  brand: {
    type: String,
    default: ''
  },
  grade: {
    type: String,
    default: ''
  },
  specification: {
    type: String,
    default: ''
  },
  evidence: [evidenceItemSchema],
  confidence: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM'
  },
  confidenceScore: {
    type: Number,
    default: 50
  },
  confidenceReason: {
    type: String,
    default: ''
  },
  varianceFlag: {
    type: String,
    enum: ['normal', 'review_recommended', 'large_change', 'high_variance'],
    default: 'normal'
  },
  currentApprovedRate: {
    type: Number,
    default: null
  },
  rateRevisionAtResearch: {
    type: String,
    default: ''
  },
  priceDifferencePercent: {
    type: Number,
    default: 0
  },
  specificationMatch: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'superseded'],
    default: 'pending',
    index: true
  },
  researchedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: String,
    default: 'google'
  },
  providerModel: {
    type: String,
    default: ''
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  adminEditedRate: {
    type: Number,
    default: null
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  approvalNotes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Compound indexes
priceResearchCandidateSchema.index({ materialCode: 1, city: 1, state: 1, status: 1 });
priceResearchCandidateSchema.index({ runId: 1, status: 1 });

module.exports = mongoose.models.PriceResearchCandidate || mongoose.model('PriceResearchCandidate', priceResearchCandidateSchema);
