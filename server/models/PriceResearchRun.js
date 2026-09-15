const mongoose = require('mongoose');

const priceResearchRunSchema = new mongoose.Schema({
  runId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  provider: {
    type: String,
    required: true,
    enum: ['google', 'openai', 'mock'],
    default: 'google'
  },
  providerModel: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: 'National'
  },
  city: {
    type: String,
    default: 'All'
  },
  locationScope: {
    type: String,
    enum: ['city', 'state', 'national'],
    default: 'city'
  },
  materialCount: {
    type: Number,
    required: true,
    min: 1
  },
  sourcePreferences: [{
    type: String
  }],
  researchScope: {
    type: String,
    enum: ['all', 'category', 'specific'],
    default: 'all'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['queued', 'running', 'completed', 'partial', 'failed'],
    default: 'queued',
    index: true
  },
  successCount: {
    type: Number,
    default: 0
  },
  warningCount: {
    type: Number,
    default: 0
  },
  failureCount: {
    type: Number,
    default: 0
  },
  candidateIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PriceResearchCandidate'
  }],
  errorSummary: {
    type: String,
    default: ''
  }
}, { timestamps: true });

priceResearchRunSchema.index({ requestedBy: 1, createdAt: -1 });
priceResearchRunSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.models.PriceResearchRun || mongoose.model('PriceResearchRun', priceResearchRunSchema);
