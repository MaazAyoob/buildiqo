const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const { requireAuth } = require('../middleware/auth');

// Multer storage in memory for streaming to Python service, with 25MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB
  },
  fileFilter: (req, file, cb) => {
    // 1. Extension validation (.dxf)
    const isDxfExt = /\.dxf$/i.test(file.originalname || '');
    if (!isDxfExt) {
      return cb(new Error('Invalid file format. Only AutoCAD .dxf files are supported.'), false);
    }

    // 2. Relaxed MIME validation (accept generic octet-stream, text/plain, etc.)
    const allowedMimes = [
      'application/dxf',
      'application/x-dxf',
      'image/vnd.dxf',
      'application/octet-stream',
      'text/plain',
      'text/x-dxf'
    ];

    if (!file.mimetype || allowedMimes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      // If MIME is completely unrecognized but extension is .dxf, allow ezdxf to be authoritative
      cb(null, true);
    }
  }
});

/**
 * POST /api/floorplan/extract
 * Protected by requireAuth: only authenticated users can upload floor plans.
 * Proxies file securely to the Python extraction service.
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
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({
      success: false,
      error: 'No DXF file uploaded.'
    });
  }

  // Target Python service URL (configurable for production and local development)
  const floorplanServiceUrl = (process.env.FLOORPLAN_SERVICE_URL || 'http://127.0.0.1:5001').replace(/\/+$/, '');
  const timeoutMs = parseInt(process.env.FLOORPLAN_SERVICE_TIMEOUT_MS, 10) || 15000;

  // Safe isolated temporary directory outside public web root
  const tempDir = path.join(os.tmpdir(), 'buildiqo_cad_uploads');
  if (!fs.existsSync(tempDir)) {
    try {
      fs.mkdirSync(tempDir, { recursive: true });
    } catch (e) {}
  }

  // Safe UUID-based filename (never trust original filename on the filesystem)
  const safeRandomName = `cad_${Date.now()}_${Math.random().toString(36).substring(2, 10)}.dxf`;
  const tempFilePath = path.join(tempDir, safeRandomName);

  try {
    // Write buffer to safe temporary file
    fs.writeFileSync(tempFilePath, req.file.buffer);

    // Prepare multipart form data for Python service
    const fileBlob = new Blob([req.file.buffer], { type: 'application/dxf' });
    const formData = new FormData();
    formData.append('file', fileBlob, req.file.originalname || 'plan.dxf');

    // Call Python FastAPI service with timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let pyResponse;
    try {
      pyResponse = await fetch(`${floorplanServiceUrl}/extract/dxf`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
    } catch (fetchErr) {
      if (fetchErr.name === 'AbortError') {
        return res.status(504).json({
          success: false,
          error: `Floor plan extraction timed out after ${timeoutMs / 1000} seconds.`
        });
      }
      return res.status(503).json({
        success: false,
        error: 'Floor plan extraction service is currently unavailable. Please verify service configuration.'
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

module.exports = router;
