const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const upload = require('../middleware/upload');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  try {
    let payments;
    if (req.user.isAdmin) {
      payments = await Payment.find().sort({ createdAt: -1 });
    } else {
      payments = await Payment.find({ userId: req.user.id }).sort({ createdAt: -1 });
    }
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', requireAuth, upload.single('screenshot'), async (req, res) => {
  try {
    const { planId, planName, amount, notes, upiId } = req.body;
    const screenshotUrl = req.file ? `/uploads/payments/${req.file.filename}` : (req.body.screenshotUrl || '');

    const payment = await Payment.create({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      planId: planId || 'pro',
      planName: planName || 'Professional Plan',
      amount: amount || '₹4,999',
      screenshotUrl,
      upiId: upiId || '8095586121@ybl',
      status: 'pending',
      notes: notes || 'UPI payment screenshot attached.'
    });

    await Subscription.findOneAndUpdate(
      { userId: req.user.id },
      {
        planId: payment.planId,
        name: payment.planName,
        paymentStatus: 'pending',
        isPlanConfirmed: false,
        pendingPayment: payment
      },
      { upsert: true }
    );

    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/:id/approve', requireAdmin, async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedAt: new Date() },
      { new: true }
    );

    if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });

    await Subscription.findOneAndUpdate(
      { userId: payment.userId },
      {
        planId: payment.planId,
        name: payment.planName,
        status: 'active',
        paymentStatus: 'approved',
        isPlanConfirmed: true,
        pendingPayment: null
      }
    );

    await User.findByIdAndUpdate(payment.userId, { hasSelectedPlan: true });

    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: reason || 'Payment verification failed', rejectedAt: new Date() },
      { new: true }
    );

    if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });

    await Subscription.findOneAndUpdate(
      { userId: payment.userId },
      {
        paymentStatus: 'rejected',
        'pendingPayment.status': 'rejected',
        'pendingPayment.rejectionReason': reason
      }
    );

    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
