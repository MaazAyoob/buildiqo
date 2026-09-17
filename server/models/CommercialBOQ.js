const mongoose = require('mongoose');

const rateHistorySchema = new mongoose.Schema({
  originalRate: { type: Number, default: 0 },
  updatedRate: { type: Number, required: true },
  rateSource: { type: String, required: true }, // ORIGINAL, STATE, NATIONAL, MANUAL
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changedAt: { type: Date, default: Date.now },
  reason: { type: String, default: '' }
}, { _id: false });

const boqRowSchema = new mongoose.Schema({
  id: { type: String, required: true },
  originalRowNumber: { type: Number, default: 0 },
  itemNo: { type: String, default: '', trim: true },
  description: { type: String, required: true, trim: true },
  specification: { type: String, default: '', trim: true },
  make: { type: String, default: '', trim: true },
  unit: { type: String, default: '', trim: true },

  // Quantity Management
  quantity: { type: Number, default: 0 },
  designQuantity: { type: Number, default: null },
  siteQuantity: { type: Number, default: null },
  quantityBasis: { 
    type: String, 
    enum: ['quantity', 'siteQuantity', 'designQuantity'], 
    default: 'quantity' 
  },

  // Commercial BOQ Rates & Calculation Authority
  originalRate: { type: Number, default: 0 },
  currentRate: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
  originalAmount: { type: Number, default: 0 },
  rateSource: { 
    type: String, 
    enum: ['ORIGINAL', 'STATE', 'NATIONAL', 'MANUAL', 'UNAVAILABLE'], 
    default: 'ORIGINAL' 
  },
  comments: { type: String, default: '', trim: true },
  originalFormula: { type: String, default: '' },

  // Material Intelligence Layer (Strictly Supplemental / Reference Only unless explicitly compatible)
  materialCode: { type: String, default: null },
  materialName: { type: String, default: '' },
  materialCategory: { type: String, default: '' },
  materialMatchConfidence: { type: Number, default: 0 },
  classificationStatus: { 
    type: String, 
    enum: ['MATCHED', 'NEEDS_REVIEW', 'UNMATCHED', 'MANUAL'], 
    default: 'UNMATCHED' 
  },
  itemType: { 
    type: String, 
    enum: ['DIRECT_MATERIAL', 'COMPOUND_WORK', 'UNKNOWN'], 
    default: 'UNKNOWN' 
  },
  compatibilityStatus: { 
    type: String, 
    enum: ['COMPATIBLE', 'REFERENCE_ONLY', 'INCOMPATIBLE'], 
    default: 'INCOMPATIBLE' 
  },

  // Authoritative Buildiqo Material Reference Pricing
  latestMaterialRate: { type: Number, default: null },
  latestMaterialRateUnit: { type: String, default: '' },
  materialRateSource: { 
    type: String, 
    enum: ['STATE', 'NATIONAL', 'UNAVAILABLE', null], 
    default: null 
  },
  materialPricingScope: { 
    type: String, 
    enum: ['STATE', 'NATIONAL', 'UNAVAILABLE', null], 
    default: null 
  },
  materialRateRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'MaterialRate', default: null },

  // Audit History
  rateHistory: [rateHistorySchema],

  // Raw Cell Metadata from Excel Import
  rawMetadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

const boqSectionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  code: { type: String, default: '', trim: true }, // e.g. "B]"
  name: { type: String, required: true, trim: true }, // e.g. "CONCRETING WORK"
  order: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  rows: [boqRowSchema]
}, { _id: false });

const boqSheetSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  order: { type: Number, default: 0 },
  isSummarySheet: { type: Boolean, default: false },
  hasDesignSiteQty: { type: Boolean, default: false },
  subtotal: { type: Number, default: 0 },
  sections: [boqSectionSchema]
}, { _id: false });

const commercialBOQSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  title: { type: String, required: true, trim: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number, default: 0 },
  mimeType: { type: String, default: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  
  // Pricing State Configuration
  pricingState: { type: String, default: 'Karnataka', index: true },
  pricingStateId: { type: String, default: 'karnataka', index: true },
  pricingScope: { type: String, default: 'STATE' },

  // Immutable snapshot of rates captured from pricingService
  pricingSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },

  // GST Configuration (0, 5, 12, 18, custom)
  gstRate: { type: Number, default: 18 },

  sheets: [boqSheetSchema],

  totals: {
    subtotal: { type: Number, default: 0 },
    gstRate: { type: Number, default: 18 },
    gstAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    summaryBreakdown: [{
      sheetName: String,
      sectionCode: String,
      sectionName: String,
      subtotal: Number
    }]
  },

  importWarnings: [{ type: String }],
  stats: {
    totalSheets: { type: Number, default: 0 },
    totalSections: { type: Number, default: 0 },
    totalRows: { type: Number, default: 0 },
    matchedRows: { type: Number, default: 0 },
    needsReviewRows: { type: Number, default: 0 },
    totalOriginalAmount: { type: Number, default: 0 },
    totalCurrentAmount: { type: Number, default: 0 }
  }
}, { timestamps: true });

commercialBOQSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.models.CommercialBOQ || mongoose.model('CommercialBOQ', commercialBOQSchema);
