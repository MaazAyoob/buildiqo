const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  materialCode: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true, 
    trim: true,
    index: true 
  },
  name: { 
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
  unit: { 
    type: String, 
    required: true, 
    trim: true 
  },
  tier: { 
    type: String, 
    enum: ['essential', 'standard', 'premium', 'luxury'],
    default: 'standard' 
  },
  grade: { 
    type: String, 
    default: '' 
  },
  brand: { 
    type: String, 
    default: '' 
  },
  desc: { 
    type: String, 
    default: '' 
  },
  warranty: { 
    type: String, 
    default: '' 
  },
  active: { 
    type: Boolean, 
    default: true,
    index: true 
  },
  benchmarkRate: { 
    type: Number, 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.models.Material || mongoose.model('Material', materialSchema);
