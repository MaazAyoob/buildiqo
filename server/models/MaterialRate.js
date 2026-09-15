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
  location: { 
    type: String, 
    default: 'National',
    index: true 
  },
  cityId: { 
    type: String, 
    default: 'all', // 'all' represents national/default baseline
    index: true 
  },
  stateId: {
    type: String,
    default: 'all',
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
  notes: { 
    type: String, 
    default: '' 
  },
  updatedBy: { 
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
  }
}, { timestamps: true });

// Compound index for fast approved rate resolution
materialRateSchema.index({ materialCode: 1, cityId: 1, status: 1, effectiveFrom: -1 });

module.exports = mongoose.models.MaterialRate || mongoose.model('MaterialRate', materialRateSchema);
