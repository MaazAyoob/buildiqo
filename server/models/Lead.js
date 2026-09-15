const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  projectTitle: { type: String },
  city: { type: String },
  plotDimensions: { type: String },
  builtupArea: { type: Number },
  tier: { type: String },
  estimatedBudget: { type: Number },
  pdfDownloaded: { type: Boolean, default: true },
  status: { type: String, default: 'New Inquiry' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.models.Lead || mongoose.model('Lead', leadSchema);
