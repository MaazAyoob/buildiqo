const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const pricingService = require('../services/pricingService');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json({ success: true, projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { id, name, state, stateId, city, tier, numFloors, totalCost, totalBua, ratePerSqFt, stateSnapshot, isBenchmarkMode, benchmarkRates } = req.body;
    const projectState = state || stateSnapshot?.state || 'Karnataka';
    let project = null;

    if (id && id.length === 24) {
      project = await Project.findOne({ _id: id, userId: req.user.id });
    }

    if (project) {
      // Existing project: UPDATE metadata and state, but strictly PRESERVE original pricingSnapshot!
      project.name = name || project.name;
      project.state = projectState;
      project.city = city || project.city;
      project.tier = tier || project.tier;
      project.numFloors = numFloors || project.numFloors;
      project.totalCost = totalCost || project.totalCost;
      project.totalBua = totalBua || project.totalBua;
      project.ratePerSqFt = ratePerSqFt || project.ratePerSqFt;
      project.stateSnapshot = stateSnapshot || project.stateSnapshot;
      // Do NOT replace pricingSnapshot!
      await project.save();
    } else {
      // NEW project: Server determines authoritative current rates snapshot for STATE
      let authoritativeSnapshot = null;
      try {
        authoritativeSnapshot = await pricingService.createServerPricingSnapshot({
          state: projectState,
          stateId: stateId || stateSnapshot?.stateId,
          city,
          cityId: city,
          isBenchmarkMode: Boolean(isBenchmarkMode),
          benchmarkRates: benchmarkRates || null,
          stateSnapshot: stateSnapshot || null
        });
      } catch (snapErr) {
        authoritativeSnapshot = {
          snapshotId: `snap_${Date.now()}`,
          createdAt: new Date(),
          currency: 'INR',
          stateId: 'karnataka',
          stateName: projectState,
          cityId: city || 'all',
          cityName: city || projectState,
          regionalMultiplier: 1.0,
          cityMultiplier: 1.0,
          isBenchmark: Boolean(isBenchmarkMode),
          ratesSource: isBenchmarkMode ? 'BENCHMARK_DEMO_MODE' : 'INITIAL_FALLBACK',
          pricingSchemaVersion: 1,
          schemaVersion: 1,
          materialRates: req.body.pricingSnapshot?.materialRates || req.body.pricingSnapshot?.rates || {},
          rates: req.body.pricingSnapshot?.materialRates || req.body.pricingSnapshot?.rates || {},
          laborRates: {
            structure: 280,
            masonryPlaster: 180,
            flooringTiling: 45,
            plumbingMEP: 65,
            electrical: 55,
            painting: 14
          },
          taxRates: { gstPct: 18, labourCessPct: 1 },
          overheadParameters: { architectureDesignFeesPct: 2.5, contractorMarginPct: 10, contingencyPct: 4 }
        };
      }

      project = await Project.create({
        userId: req.user.id,
        name: name || 'My Construction Project',
        state: projectState,
        city: city || 'Bengaluru',
        tier: tier || 'standard',
        numFloors: numFloors || 2,
        totalCost: totalCost || 0,
        totalBua: totalBua || 0,
        ratePerSqFt: ratePerSqFt || 0,
        stateSnapshot: stateSnapshot || {},
        pricingSnapshot: authoritativeSnapshot
      });
    }

    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await Project.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
