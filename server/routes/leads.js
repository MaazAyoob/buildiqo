const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAdmin, async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json({ success: true, leads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      email,
      phone,
      projectTitle,
      city,
      plotDimensions,
      builtupArea,
      tier,
      estimatedBudget,
      pdfDownloaded,
      notes
    } = req.body;

    if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
      return res.status(400).json({ success: false, error: 'Customer name is required' });
    }

    const sanitizedLead = {
      customerName: customerName.trim().slice(0, 100),
      email: typeof email === 'string' ? email.trim().slice(0, 100).toLowerCase() : '',
      phone: typeof phone === 'string' ? phone.trim().slice(0, 30) : '',
      projectTitle: typeof projectTitle === 'string' ? projectTitle.trim().slice(0, 150) : '',
      city: typeof city === 'string' ? city.trim().slice(0, 80) : '',
      plotDimensions: typeof plotDimensions === 'string' ? plotDimensions.trim().slice(0, 100) : '',
      builtupArea: Number(builtupArea) || 0,
      tier: typeof tier === 'string' ? tier.trim().slice(0, 50) : 'STANDARD PACKAGE',
      estimatedBudget: Number(estimatedBudget) || 0,
      pdfDownloaded: Boolean(pdfDownloaded),
      notes: typeof notes === 'string' ? notes.trim().slice(0, 2000) : '',
      status: 'New Inquiry'
    };

    if (req.user && req.user.id) {
      sanitizedLead.userId = req.user.id;
    }

    const lead = await Lead.create(sanitizedLead);
    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const lead = await Lead.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
