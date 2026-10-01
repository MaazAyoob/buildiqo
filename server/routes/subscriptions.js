const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

router.get('/me', requireAuth, async (req, res) => {
  try {
    let sub = await Subscription.findOne({ userId: req.user.id });
    if (!sub) {
      sub = await Subscription.create({
        userId: req.user.id,
        planId: 'free',
        name: 'Free Platform Access',
        status: 'active',
        isPlanConfirmed: true
      });
    } else if (!sub.isPlanConfirmed) {
      sub = await Subscription.findOneAndUpdate(
        { userId: req.user.id },
        { isPlanConfirmed: true, status: 'active' },
        { new: true }
      );
    }
    res.json({ success: true, subscription: sub });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/me', requireAuth, async (req, res) => {
  try {
    const { planId, billingCycle } = req.body;
    const planNames = {
      free: 'FREE Plan',
      pro: 'Professional Plan (₹4,999/mo)',
      pro_ai: 'Pro AI Plan (₹8,999/mo)',
      enterprise: 'Enterprise Plan'
    };

    const sub = await Subscription.findOneAndUpdate(
      { userId: req.user.id },
      {
        planId,
        name: planNames[planId] || 'Professional Plan',
        billingCycle: billingCycle || 'yearly',
        status: 'active',
        isPlanConfirmed: true
      },
      { new: true, upsert: true }
    );

    await User.findByIdAndUpdate(req.user.id, { hasSelectedPlan: true });

    res.json({ success: true, subscription: sub });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
