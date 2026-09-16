const mongoose = require('mongoose');

const materialRateSchema = new mongoose.Schema({
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
  rate: { 
    type: Number, 
    required: true 
  },
  unit: { 
    type: String, 
    required: true 
  },
  currency: {
    type: String,
    default: 'INR'
  },
  location: { 
    type: String, 
    default: 'National',
    index: true 
  },
  stateId: {
    type: String,
    default: 'all',
    index: true
  },
  cityId: { 
    type: String, 
    default: 'all', // Retained for compatibility / evidence context
    index: true 
  },
  effectiveFrom: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  source: { 
    type: String, 
    default: 'admin_manual' 
  },
  sourceType: {
    type: String,
    enum: ['admin_manual', 'research_approved', 'initial_seed', 'supplier_quote', 'other'],
    default: 'admin_manual'
  },
  notes: { 
    type: String, 
    default: '' 
  },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: { 
    type: String, 
    enum: ['approved', 'superseded'], 
    default: 'approved',
    index: true 
  },
  previousRate: { 
    type: Number, 
    default: null 
  },
  schemaVersion: {
    type: Number,
    default: 1
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

// Compound indexes for fast rate resolution
materialRateSchema.index({ materialCode: 1, stateId: 1, status: 1, effectiveFrom: -1 });
materialRateSchema.index({ materialCode: 1, cityId: 1, status: 1, effectiveFrom: -1 });

module.exports = mongoose.models.MaterialRate || mongoose.model('MaterialRate', materialRateSchema);
