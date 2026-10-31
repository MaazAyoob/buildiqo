const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const pricingService = require('../services/pricingService');
const { requireAuth } = require('../middleware/auth');
const { generatePlannerPDF } = require('../services/plannerReportExporter');

/**
 * Optional auth helper: attaches req.user if a valid Bearer token is provided.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  requireAuth(req, res, next);
}

/**
 * GET /api/projects
 * Returns only the authenticated user's projects.
 * Newly registered users see an empty project list.
 * Legacy unowned records are never returned to normal users.
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const projects = await Project.find({ userId: currentUserId }).sort({ updatedAt: -1 });
    res.json({ success: true, projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/projects/:id
 * Retrieves a single project.
 * Enforces ownership: only owner or platform admin can view.
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const currentUserId = (req.user._id || req.user.id).toString();
    const ownerId = project.userId ? project.userId.toString() : null;

    if (ownerId !== currentUserId && !req.user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized: You do not have permission to view this project.' });
    }

    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/projects/:id
 * Updates an existing project.
 * Enforces ownership: only owner or platform admin can update.
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const currentUserId = (req.user._id || req.user.id).toString();
    const ownerId = project.userId ? project.userId.toString() : null;

    if (ownerId !== currentUserId && !req.user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized: You do not have permission to modify this project.' });
    }

    const { name, state, city, tier, numFloors, totalCost, totalBua, ratePerSqFt, stateSnapshot } = req.body;
    if (name) project.name = name;
    if (state) project.state = state;
    if (city) project.city = city;
    if (tier) project.tier = tier;
    if (numFloors) project.numFloors = numFloors;
    if (totalCost !== undefined) project.totalCost = totalCost;
    if (totalBua !== undefined) project.totalBua = totalBua;
    if (ratePerSqFt !== undefined) project.ratePerSqFt = ratePerSqFt;
    if (stateSnapshot) project.stateSnapshot = stateSnapshot;

    await project.save();
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/projects
 * Creates or updates a project for the authenticated user.
 * Strictly verifies ownership if an existing project ID is supplied.
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { id, name, state, stateId, city, tier, numFloors, totalCost, totalBua, ratePerSqFt, stateSnapshot, isBenchmarkMode, benchmarkRates } = req.body;
    const projectState = state || stateSnapshot?.state || 'Karnataka';
    const currentUserId = (req.user._id || req.user.id).toString();
    let project = null;

    if (id && /^[0-9a-fA-F]{24}$/.test(id)) {
      const existing = await Project.findById(id);
      if (existing) {
        const ownerId = existing.userId ? existing.userId.toString() : null;
        if (ownerId !== currentUserId && !req.user.isAdmin) {
          return res.status(403).json({ success: false, error: 'Unauthorized: Cannot modify project belonging to another user.' });
        }
        project = existing;
      }
    }

    if (project) {
      // Existing project: UPDATE metadata and state, but strictly PRESERVE original pricingSnapshot!
      project.name = name || project.name;
      project.state = projectState;
      project.city = city || project.city;
      project.tier = tier || project.tier;
      project.numFloors = numFloors || project.numFloors;
      project.totalCost = totalCost !== undefined ? totalCost : project.totalCost;
      project.totalBua = totalBua !== undefined ? totalBua : project.totalBua;
      project.ratePerSqFt = ratePerSqFt !== undefined ? ratePerSqFt : project.ratePerSqFt;
      project.stateSnapshot = stateSnapshot || project.stateSnapshot;
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
        userId: req.user._id || req.user.id,
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

/**
 * DELETE /api/projects/:id
 * Deletes a project. Enforces ownership: only owner or platform admin can delete.
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const currentUserId = (req.user._id || req.user.id).toString();
    const ownerId = project.userId ? project.userId.toString() : null;

    if (ownerId !== currentUserId && !req.user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized: Cannot delete project belonging to another user.' });
    }

    await Project.findByIdAndDelete(id);
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/projects/:id/export/pdf
 * Generates and downloads PDF export by project ID.
 * Enforces ownership: only owner or admin can export.
 */
router.get('/:id/export/pdf', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    if (project.userId) {
      const currentUserId = req.user ? (req.user._id || req.user.id).toString() : null;
      if (project.userId.toString() !== currentUserId && !req.user?.isAdmin) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Cannot export project belonging to another user.' });
      }
    }

    const state = project.stateSnapshot || {
      projectName: project.name,
      numFloors: project.numFloors,
      tier: project.tier,
      city: project.city,
      state: project.state
    };

    const estimation = {
      totalBuiltupArea: project.totalBua,
      grandTotalCost: project.totalCost,
      costPerSqFt: project.ratePerSqFt,
      packageEstimate: {
        ratePerSqFt: project.ratePerSqFt,
        estimatedCost: Math.round(project.totalBua * project.ratePerSqFt),
        grandTotal: project.totalCost
      }
    };

    const pdfBuffer = await generatePlannerPDF(state, estimation);
    const projectName = (project.name || 'Buildiqo_Estimate').replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${projectName}_Estimate_Report.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Project PDF export error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/projects/export/pdf
 * Generates and downloads a dedicated professional PDF estimate report.
 * If projectId is supplied, enforces ownership.
 */
router.post('/export/pdf', optionalAuth, async (req, res) => {
  try {
    const { state, estimation, projectId } = req.body;
    if (!state && !estimation && !projectId) {
      return res.status(400).json({ success: false, error: 'No estimation data provided for PDF export.' });
    }

    if (projectId && /^[0-9a-fA-F]{24}$/.test(projectId)) {
      const project = await Project.findById(projectId);
      if (project && project.userId) {
        const currentUserId = req.user ? (req.user._id || req.user.id).toString() : null;
        if (project.userId.toString() !== currentUserId && !req.user?.isAdmin) {
          return res.status(403).json({ success: false, error: 'Unauthorized: Cannot export project belonging to another user.' });
        }
      }
    }

    const pdfBuffer = await generatePlannerPDF(state || {}, estimation || {});
    const projectName = (state?.projectName || 'Buildiqo_Estimate').replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${projectName}_Estimate_Report.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Planner PDF export error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
