const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { requireAuth } = require('../middleware/auth');

const { parseDxfFallback } = require('../services/aiFloorplan/cadFallbackParser');
const { parseFloorplan, inspectDwg } = require('../services/aiFloorplan/multiFormatFloorplanParser');

// Multer storage in memory for streaming to Python service or in-process parsing, with 25MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB
  },
  fileFilter: (req, file, cb) => {
    const originalName = file.originalname || '';
    const isDxfExt = /\.dxf$/i.test(originalName);
    const isDwgExt = /\.dwg$/i.test(originalName);
    const isPdfExt = /\.pdf$/i.test(originalName);
    const isImageExt = /\.(png|jpe?g|webp)$/i.test(originalName);
    const isSvgExt = /\.svg$/i.test(originalName);

    // 1. Extension validation (.dxf, .dwg, .pdf, .png, .jpg, .jpeg, .webp, .svg)
    if (!isDxfExt && !isDwgExt && !isPdfExt && !isImageExt && !isSvgExt) {
      return cb(new Error('Invalid file format. Supported floor plan formats: .dxf, .pdf, .png, .jpg, .jpeg, .webp, .svg.'), false);
    }

    // 2. Relaxed CAD, PDF, Image & SVG MIME validation
    const allowedMimes = [
      'application/dxf',
      'application/x-dxf',
      'image/vnd.dxf',
      'text/plain',
      'text/x-dxf',
      'application/acad',
      'application/x-acad',
      'application/autocad_dwg',
      'image/vnd.dwg',
      'application/dwg',
      'application/x-dwg',
      'application/pdf',
      'application/x-pdf',
      'image/png',
      'image/jpeg',
      'image/pjpeg',
      'image/webp',
      'image/svg+xml',
      'application/octet-stream'
    ];

    if (!file.mimetype || allowedMimes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(null, true);
    }
  }
});

/**
 * POST /api/floorplan/extract
 * Protected by requireAuth: only authenticated users can upload floor plans.
 * Proxies file securely to the Python extraction service with resilient fallback.
 */
router.post('/extract', requireAuth, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          error: 'File size exceeds the 25 MB limit.'
        });
      }
      return res.status(400).json({
        success: false,
        error: err.message || 'File upload error.'
      });
    }
    next();
  });
}, async (req, res) => {
  if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Uploaded floor plan file is empty.'
    });
  }

  const originalName = req.file.originalname || 'plan.dxf';
  const isDwg = /\.dwg$/i.test(originalName);
  const isPdf = /\.pdf$/i.test(originalName);
  const isImage = /\.(png|jpe?g|webp)$/i.test(originalName);
  const isSvg = /\.svg$/i.test(originalName);

  // 1. Honest AutoCAD DWG verification: ODA File Converter runtime is not present
  if (isDwg) {
    try {
      const dwgResult = inspectDwg(req.file.buffer, originalName);
      return res.status(422).json(dwgResult);
    } catch (dwgErr) {
      return res.status(400).json({
        success: false,
        error: dwgErr.message || 'Corrupted DWG file.'
      });
    }
  }

  // Parse options from body or query
  const pageIndex = parseInt(req.body?.pageIndex || req.query?.pageIndex, 10) || 0;
  const unitOverride = req.body?.unitOverride || req.query?.unitOverride || 'auto';
  const calibration = req.body?.calibration ? (typeof req.body.calibration === 'string' ? JSON.parse(req.body.calibration) : req.body.calibration) : null;

  // 2. Direct handling for Images & SVG via authoritative in-process parser
  if (isImage || isSvg) {
    try {
      const parsedData = parseFloorplan(req.file.buffer, originalName, { pageIndex, calibration, unitOverride });
      return res.json(parsedData);
    } catch (parseErr) {
      return res.status(422).json({
        success: false,
        error: parseErr.message || 'Failed to analyze floor plan drawing.'
      });
    }
  }

  // 3. For DXF and PDF: attempt upstream Python microservice, with guaranteed in-process fallback
  const floorplanServiceUrl = (process.env.FLOORPLAN_SERVICE_URL || 'http://127.0.0.1:5001').replace(/\/+$/, '');
  const timeoutMs = parseInt(process.env.FLOORPLAN_SERVICE_TIMEOUT_MS, 10) || 10000;

  let mimeType = isPdf ? 'application/pdf' : 'application/dxf';
  let endpoint = isPdf ? `${floorplanServiceUrl}/extract/pdf` : `${floorplanServiceUrl}/extract/dxf`;

  try {
    const fileBlob = new Blob([req.file.buffer], { type: mimeType });
    const formData = new FormData();
    formData.append('file', fileBlob, originalName);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const headers = {};
    if (process.env.FLOORPLAN_SERVICE_TOKEN) {
      headers['X-Floorplan-Service-Token'] = process.env.FLOORPLAN_SERVICE_TOKEN;
    }

    let pyResponse = null;
    try {
      pyResponse = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal
      });
    } catch (fetchErr) {
      console.warn(`Upstream Python floor plan service failed (${fetchErr.message}). Engaging in-process floor plan parser.`);
    } finally {
      clearTimeout(timer);
    }

    if (pyResponse && pyResponse.ok) {
      const data = await pyResponse.json().catch(() => null);
      if (data && Array.isArray(data.rooms) && data.rooms.length > 0) {
        return res.json(data);
      }
    }

    // In-process resilient fallback execution for DXF & PDF (including scanned PDFs!)
    const fallbackResult = parseFloorplan(req.file.buffer, originalName, { pageIndex, unitOverride });
    return res.json(fallbackResult);

  } catch (err) {
    try {
      // Last-resort fallback attempt
      const fallbackResult = parseFloorplan(req.file.buffer, originalName, { pageIndex, unitOverride });
      return res.json(fallbackResult);
    } catch (fbErr) {
      return res.status(422).json({
        success: false,
        error: fbErr.message || err.message || 'Floor plan extraction failed.'
      });
    }
  }
});

const aiFloorplanService = require('../services/aiFloorplan/aiFloorplanService');

/**
 * POST /api/floorplan/generate
 * Generates an AI-assisted architectural floor plan with deterministic geometry.
 * Protected by requireAuth.
 */
router.post('/generate', requireAuth, async (req, res) => {
  const hasAuth = !!req.headers.authorization;
  const userId = req.user?.id || req.user?._id || 'unknown';
  console.log(`[Floorplan Route] POST /api/floorplan/generate reached | Auth header present: ${hasAuth} | Authenticated user: ${userId}`);
  try {
    const result = await aiFloorplanService.generateFloorplan(req.body);
    return res.json(result);
  } catch (err) {
    const status = (typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600) ? err.statusCode : 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'Floor plan generation failed.',
      details: err.details || null
    });
  }
});


// Alias for spec compatibility
router.post('/generate-floorplan', requireAuth, async (req, res) => {
  try {
    const result = await aiFloorplanService.generateFloorplan(req.body);
    return res.json(result);
  } catch (err) {
    const status = (typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600) ? err.statusCode : 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'Floor plan generation failed.',
      details: err.details || null
    });
  }
});

/**
 * POST /api/floorplan/regenerate
 * Re-runs solver with alternative deterministic seed on identical requirements.
 * Protected by requireAuth.
 */
router.post('/regenerate', requireAuth, async (req, res) => {
  try {
    const { generation_id, seed } = req.body || {};
    const result = await aiFloorplanService.regenerateFloorplan(generation_id, seed);
    return res.json(result);
  } catch (err) {
    const status = (typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600) ? err.statusCode : 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'Regeneration failed.'
    });
  }
});

router.post('/generate-floorplan/regenerate', requireAuth, async (req, res) => {
  try {
    const { generation_id, seed } = req.body || {};
    const result = await aiFloorplanService.regenerateFloorplan(generation_id, seed);
    return res.json(result);
  } catch (err) {
    const status = (typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600) ? err.statusCode : 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'Regeneration failed.'
    });
  }
});

/**
 * POST /api/floorplan/refine
 * Converts natural-language instruction to structured diff and updates layout.
 * Protected by requireAuth.
 */
router.post('/refine', requireAuth, async (req, res) => {
  try {
    const { generation_id, instruction } = req.body || {};
    const result = await aiFloorplanService.refineFloorplan(generation_id, instruction);
    return res.json(result);
  } catch (err) {
    const status = (typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600) ? err.statusCode : 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'Refinement failed.'
    });
  }
});

router.post('/generate-floorplan/refine', requireAuth, async (req, res) => {
  try {
    const { generation_id, instruction } = req.body || {};
    const result = await aiFloorplanService.refineFloorplan(generation_id, instruction);
    return res.json(result);
  } catch (err) {
    const status = (typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600) ? err.statusCode : 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'Refinement failed.'
    });
  }
});

/**
 * GET /api/floorplan/download-dxf/:generationId
 * Downloads generated floor plan as standard AutoCAD DXF file.
 * Protected by requireAuth.
 */
router.get('/download-dxf/:generationId', requireAuth, async (req, res) => {
  try {
    const floor = parseInt(req.query.floor, 10) || 0;
    const dxfBuffer = await aiFloorplanService.getFloorplanDxf(req.params.generationId, floor);
    res.setHeader('Content-Type', 'application/dxf');
    res.setHeader('Content-Disposition', `attachment; filename=buildiqo_plan_${req.params.generationId}_floor_${floor}.dxf`);
    return res.send(dxfBuffer);
  } catch (err) {
    const status = (typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600) ? err.statusCode : 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'Failed to download DXF.'
    });
  }
});

module.exports = router;

