const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  planId: { type: String, default: 'free' },
  name: { type: String, default: 'FREE Plan' },
  billingCycle: { type: String, default: 'monthly' },
  status: { type: String, default: 'active' },
  paymentStatus: { type: String, default: 'none' },
  isPlanConfirmed: { type: Boolean, default: false },
  renewsAt: { type: String, default: 'Never (Free Forever)' },
  pendingPayment: { type: mongoose.Schema.Types.Mixed, default: null }
}, { timestamps: true });

module.exports = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
