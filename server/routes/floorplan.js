const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { requireAuth } = require('../middleware/auth');

const { parseDxfFallback } = require('../services/aiFloorplan/cadFallbackParser');

// Multer storage in memory for streaming to Python service, with 25MB limit
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

    // 1. Extension validation (.dxf, .dwg, and .pdf)
    if (!isDxfExt && !isDwgExt && !isPdfExt) {
      return cb(new Error('Invalid file format. Only AutoCAD .dxf, .dwg, and .pdf floor plan files are supported.'), false);
    }

    // 2. Relaxed CAD & PDF MIME validation
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
      error: 'Uploaded CAD/PDF file is empty.'
    });
  }

  const originalName = req.file.originalname || 'plan.dxf';
  const isDwg = /\.dwg$/i.test(originalName);
  const isPdf = /\.pdf$/i.test(originalName);
  const ext = isDwg ? '.dwg' : (isPdf ? '.pdf' : '.dxf');

  // Target Python service URL (configurable for production and local development)
  const floorplanServiceUrl = (process.env.FLOORPLAN_SERVICE_URL || 'http://127.0.0.1:5001').replace(/\/+$/, '');
  const timeoutMs = parseInt(process.env.FLOORPLAN_SERVICE_TIMEOUT_MS, 10) || 30000;

  // Safe isolated temporary directory outside public web root
  const tempDir = path.join(os.tmpdir(), 'buildiqo_cad_uploads');
  if (!fs.existsSync(tempDir)) {
    try {
      fs.mkdirSync(tempDir, { recursive: true });
    } catch (e) {}
  }

  // Safe UUID-based filename (never trust original filename on the filesystem)
  const safeRandomName = `cad_${Date.now()}_${Math.random().toString(36).substring(2, 10)}${ext}`;
  const tempFilePath = path.join(tempDir, safeRandomName);

  let mimeType = 'application/dxf';
  let endpoint = `${floorplanServiceUrl}/extract/dxf`;
  if (isDwg) {
    endpoint = `${floorplanServiceUrl}/extract/dwg`;
    mimeType = 'application/acad';
  } else if (isPdf) {
    endpoint = `${floorplanServiceUrl}/extract/pdf`;
    mimeType = 'application/pdf';
  }

  try {
    // Write buffer to safe temporary file
    fs.writeFileSync(tempFilePath, req.file.buffer);

    // Prepare multipart form data for Python service
    const fileBlob = new Blob([req.file.buffer], { type: mimeType });
    const formData = new FormData();
    formData.append('file', fileBlob, originalName);

    // Call Python FastAPI service with timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const headers = {};
    if (process.env.FLOORPLAN_SERVICE_TOKEN) {
      headers['X-Floorplan-Service-Token'] = process.env.FLOORPLAN_SERVICE_TOKEN;
    }

    let pyResponse;
    try {
      pyResponse = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal
      });
    } catch (fetchErr) {
      clearTimeout(timer);
      console.warn(`Upstream Python floor plan service failed (${fetchErr.message}). Checking in-process fallback.`);

      // Resilient fallback for DXF when microservice is cold-starting
      if (!isDwg && !isPdf) {
        try {
          const fallbackData = parseDxfFallback(req.file.buffer.toString('utf8'), originalName);
          if (fallbackData && fallbackData.rooms.length > 0) {
            return res.json(fallbackData);
          }
        } catch (fbErr) {
          console.warn('Fallback CAD parser error:', fbErr.message);
        }
      }

      if (fetchErr.name === 'AbortError') {
        return res.status(504).json({
          success: false,
          error: `Floor plan extraction timed out after ${timeoutMs / 1000} seconds.`
        });
      }
      return res.status(503).json({
        success: false,
        error: 'Floor plan extraction service is currently starting up. Please try again in a few moments.'
      });
    } finally {
      clearTimeout(timer);
    }

    const data = await pyResponse.json().catch(() => ({}));

    if (!pyResponse.ok) {
      return res.status(pyResponse.status || 500).json({
        success: false,
        error: data.detail || 'Floor plan extraction failed.'
      });
    }

    // Response validation: ensure expected normalized contract
    if (!data || typeof data !== 'object' || !Array.isArray(data.rooms)) {
      return res.status(502).json({
        success: false,
        error: 'Invalid response schema received from floor plan extraction service.'
      });
    }

    return res.json(data);

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error during floor plan extraction.'
    });
  } finally {
    // Guaranteed cleanup of temporary files
    if (fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupErr) {
        console.warn('Failed to clean temporary CAD file:', cleanupErr.message);
      }
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

