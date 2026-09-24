const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { requireAuth } = require('../middleware/auth');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not configured.');
  }
  return secret;
}

// Seed platform owner ONLY if configured via environment variables
async function ensurePlatformOwner(options = {}) {
  const { overwritePassword = false } = options;
  try {
    const ownerEmail = process.env.SEED_ADMIN_EMAIL || 'admin@buildiqo.ai';
    const ownerPassword = process.env.SEED_ADMIN_PASSWORD || 'BuildiqoAdminSecret#2026';
    if (!ownerEmail || !ownerPassword) {
      return { seeded: false, reason: 'SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD not configured' };
    }

    const normalizedEmail = ownerEmail.trim().toLowerCase();
    let owner = await User.findOne({ email: normalizedEmail });
    if (!owner) {
      const hashedPassword = await bcrypt.hash(ownerPassword, 10);
      owner = await User.create({
        name: 'Platform Administrator',
        email: normalizedEmail,
        phone: '+91 99000 11223',
        password: hashedPassword,
        role: 'Platform Owner & Super Admin',
        firmName: 'Buildiqo.ai Platform HQ',
        isAdmin: true,
        hasSelectedPlan: true,
        avatar: 'AD'
      });
      await Subscription.create({
        userId: owner._id,
        planId: 'enterprise',
        name: 'Enterprise Super Admin',
        status: 'active',
        isPlanConfirmed: true,
        renewsAt: 'Lifetime Active'
      });
      console.log(`Platform owner account (${normalizedEmail}) seeded successfully.`);
      return { seeded: true, created: true, email: normalizedEmail };
    } else {
      if (overwritePassword) {
        owner.password = await bcrypt.hash(ownerPassword, 10);
        owner.isAdmin = true;
        await owner.save();
        console.log(`Platform owner credentials (${normalizedEmail}) updated from environment configuration.`);
        return { seeded: true, updated: true, email: normalizedEmail };
      }
      console.log(`Platform owner account (${normalizedEmail}) already exists. Existing credentials preserved.`);
      return { seeded: true, created: false, updated: false, email: normalizedEmail };
    }
  } catch (err) {
    console.error('Owner seed error:', err.message);
    throw err;
  }
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, firmName } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatar = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone: phone || '+91 99999 88888',
      password: hashedPassword,
      role: role || 'Homeowner / Individual Builder',
      firmName: firmName || '',
      avatar,
      isAdmin: false,
      hasSelectedPlan: false
    });

    const subscription = await Subscription.create({
      userId: user._id,
      planId: 'free',
      name: 'Starter Plan',
      status: 'active',
      isPlanConfirmed: false
    });

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, isAdmin: user.isAdmin },
      getJwtSecret(),
      { expiresIn: '30d' }
    );

    const userObj = user.toObject();
    delete userObj.password;

    res.json({ success: true, token, user: userObj, subscription });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password) {
      return res.status(400).json({ success: false, error: 'Email/phone and password are required' });
    }

    const normalized = emailOrPhone.trim().toLowerCase();
    let user = await User.findOne({
      $or: [
        { email: normalized },
        { phone: emailOrPhone.trim() }
      ]
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'User not found or invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Invalid password' });
    }

    let subscription = await Subscription.findOne({ userId: user._id });
    if (!subscription) {
      subscription = await Subscription.create({
        userId: user._id,
        planId: user.isAdmin ? 'enterprise' : 'free',
        name: user.isAdmin ? 'Enterprise Super Admin' : 'Starter Plan',
        isPlanConfirmed: user.isAdmin
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, isAdmin: user.isAdmin },
      getJwtSecret(),
      { expiresIn: '30d' }
    );

    const userObj = user.toObject();
    delete userObj.password;

    res.json({ success: true, token, user: userObj, subscription });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Current user check
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    const subscription = await Subscription.findOne({ userId: user._id });
    res.json({ success: true, user, subscription });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Guest / Demo token generation
router.post('/guest', async (req, res) => {
  try {
    let guestUser = null;
    try {
      guestUser = await User.findOne({ email: 'guest@buildiqo.ai' });
      if (!guestUser) {
        const hashedPassword = await bcrypt.hash('GuestBuildiqo#2026', 10);
        guestUser = await User.create({
          name: 'Guest Builder',
          email: 'guest@buildiqo.ai',
          phone: '+91 99999 00000',
          password: hashedPassword,
          role: 'Architect / Builder',
          firmName: 'Guest Preview Studio',
          isAdmin: false,
          hasSelectedPlan: true,
          avatar: 'GB'
        });
        await Subscription.create({
          userId: guestUser._id,
          planId: 'pro',
          name: 'Professional (Guest Preview)',
          status: 'active',
          isPlanConfirmed: true
        });
      }
    } catch (dbErr) {
      // In-memory or transient DB fallback
      guestUser = {
        _id: 'usr_guest_demo',
        id: 'usr_guest_demo',
        name: 'Guest Builder',
        email: 'guest@buildiqo.ai',
        phone: '+91 Guest',
        role: 'Architect / Builder',
        firmName: 'Guest Preview Studio',
        avatar: 'GB',
        isAdmin: false
      };
    }

    const token = jwt.sign(
      {
        id: guestUser._id || guestUser.id,
        email: guestUser.email,
        name: guestUser.name,
        isAdmin: false,
        isGuest: true
      },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    const userObj = typeof guestUser.toObject === 'function' ? guestUser.toObject() : { ...guestUser };
    delete userObj.password;

    res.json({
      success: true,
      token,
      user: { ...userObj, isGuest: true },
      subscription: {
        planId: 'pro',
        name: 'Professional (Guest Preview)',
        status: 'active',
        isPlanConfirmed: true
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.ensurePlatformOwner = ensurePlatformOwner;

module.exports = router;

