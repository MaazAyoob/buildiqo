const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  state: { type: String, default: 'Karnataka' },
  stateId: { type: String, default: 'karnataka' },
  city: { type: String },
  tier: { type: String },
  numFloors: { type: Number },
  totalCost: { type: Number },
  totalBua: { type: Number },
  ratePerSqFt: { type: Number },
  stateSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
  pricingSnapshot: {
    snapshotId: { type: String },
    createdAt: { type: Date, default: Date.now },
    currency: { type: String, default: 'INR' },
    stateId: { type: String, default: 'karnataka' },
    stateName: { type: String, default: 'Karnataka' },
    cityId: { type: String },
    cityName: { type: String },
    location: { type: String, default: 'Karnataka' },
    regionalMultiplier: { type: Number, default: 1.0 },
    cityMultiplier: { type: Number, default: 1.0 },
    state: { type: String, default: 'Karnataka' },
    pricingScope: { type: String },
    pricingSource: { type: String },
    ratesSource: { type: String },
    pricingSchemaVersion: { type: Number, default: 1 },
    schemaVersion: { type: Number, default: 1 },
    materialRates: { type: mongoose.Schema.Types.Mixed },
    rates: { type: mongoose.Schema.Types.Mixed },
    laborRates: { type: mongoose.Schema.Types.Mixed },
    taxRates: { type: mongoose.Schema.Types.Mixed },
    overheadParameters: { type: mongoose.Schema.Types.Mixed }
  }
}, { timestamps: true });

module.exports = mongoose.models.Project || mongoose.model('Project', projectSchema);
