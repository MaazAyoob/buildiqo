const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CommercialBOQ = require('../models/CommercialBOQ');
const { parseCommercialBOQ } = require('../services/commercialBoqParser');
const { classifyBOQ } = require('../services/materialClassifier');
const {
  attachPricingIntelligence,
  recalculateBOQ,
  applyMaterialRateToRow
} = require('../services/commercialBoqPricingService');
const { exportToExcel, exportToPDF } = require('../services/commercialBoqExporter');
const { requireAuth } = require('../middleware/auth');

// Multer memory storage with security constraints
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB max
  },
  fileFilter: (req, file, cb) => {
    const isExcelMime = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream'
    ].includes(file.mimetype);

    const isExcelExt = /\.(xlsx|xls)$/i.test(file.originalname);

    if (isExcelMime || isExcelExt) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only .xlsx and .xls files are supported.'), false);
    }
  }
});

/**
 * Optional auth middleware for upload/preview: attaches user if token present
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  requireAuth(req, res, next);
}

/**
 * POST /api/commercial-boq/upload
 * Uploads, parses, classifies, attaches live pricing intelligence, and returns structured BOQ.
 */
router.post('/upload', optionalAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, error: 'No Excel file uploaded.' });
    }

    const pricingState = req.body.pricingState || 'Karnataka';
    const originalFileName = req.file.originalname || 'BOQ.xlsx';

    // 1. Parse Excel workbook
    const parsed = await parseCommercialBOQ(req.file.buffer, originalFileName);

    if (!parsed.sheets || parsed.sheets.length === 0) {
      return res.status(422).json({
        success: false,
        error: 'Unable to parse any valid sheets or tables from the uploaded workbook.'
      });
    }

    // 2. Classify materials & enforce compound vs direct separation
    const classified = classifyBOQ(parsed);

    // 3. Attach live Buildiqo material intelligence
    const enriched = await attachPricingIntelligence(classified, pricingState);

    // 4. Recalculate deterministic line amounts and totals
    const finalBoq = recalculateBOQ(enriched);

    finalBoq.title = req.body.title || originalFileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
    finalBoq.fileName = originalFileName;
    finalBoq.fileSize = req.file.size;
    finalBoq.mimeType = req.file.mimetype;
    finalBoq.gstRate = Number(req.body.gstRate) || 18;

    // If authenticated, persist to MongoDB
    if (req.user) {
      const doc = new CommercialBOQ({
        ...finalBoq,
        userId: req.user._id || req.user.id
      });
      await doc.save();
      return res.json({ success: true, data: doc });
    }

    // Guest / Draft response
    return res.json({
      success: true,
      data: {
        _id: `draft_${Date.now()}`,
        ...finalBoq
      }
    });
  } catch (err) {
    console.error('BOQ upload error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to process BOQ file.' });
  }
});

/**
 * POST /api/commercial-boq/sample
 * Loads and parses the bundled TWC Kasthuri Nagar acceptance fixture
 */
router.post('/sample', optionalAuth, async (req, res) => {
  try {
    const fixturePath = path.join(__dirname, '../tests/fixtures/TWC_KASTHURI_NAGAR_BOQ_Final_3-2-26.xlsx');
    if (!fs.existsSync(fixturePath)) {
      const { createTWCWorkbook } = require('../tests/fixtures/createTWCWorkbook');
      await createTWCWorkbook(fixturePath);
    }

    const buffer = fs.readFileSync(fixturePath);
    const parsed = await parseCommercialBOQ(buffer, 'TWC_KASTHURI_NAGAR_BOQ_Final_3-2-26.xlsx');
    const classified = classifyBOQ(parsed);
    const enriched = await attachPricingIntelligence(classified, 'Karnataka');
    const finalBoq = recalculateBOQ(enriched);

    finalBoq.title = 'TWC Kasthuri Nagar BOQ Final';
    finalBoq.fileName = 'TWC_KASTHURI_NAGAR_BOQ_Final_3-2-26.xlsx';
    finalBoq.fileSize = buffer.length;
    finalBoq.gstRate = 18;

    if (req.user) {
      const doc = new CommercialBOQ({
        ...finalBoq,
        userId: req.user._id || req.user.id
      });
      await doc.save();
      return res.json({ success: true, data: doc });
    }

    return res.json({
      success: true,
      data: {
        _id: `draft_${Date.now()}`,
        ...finalBoq
      }
    });
  } catch (err) {
    console.error('Sample BOQ load error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/commercial-boq
 * Lists all commercial BOQs for authenticated user
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const boqs = await CommercialBOQ.find({ userId: req.user._id || req.user.id })
      .select('title fileName pricingState totals stats updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ success: true, data: boqs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/commercial-boq/:id
 * Retrieves single commercial BOQ with fresh intelligence
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (id.startsWith('draft_')) {
      return res.status(404).json({ success: false, error: 'Draft BOQs are stored in-session.' });
    }

    const boq = await CommercialBOQ.findById(id);
    if (!boq) {
      return res.status(404).json({ success: false, error: 'Commercial BOQ not found.' });
    }

    // User ownership check if authenticated
    if (req.user && boq.userId.toString() !== (req.user._id || req.user.id).toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized access to this BOQ.' });
    }

    res.json({ success: true, data: boq });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/commercial-boq/:id
 * Updates BOQ details, row edits, pricing state, or GST rate
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let boq = await CommercialBOQ.findById(id);

    if (!boq) {
      return res.status(404).json({ success: false, error: 'Commercial BOQ not found.' });
    }

    if (boq.userId.toString() !== (req.user._id || req.user.id).toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized to modify this BOQ.' });
    }

    const { sheets, pricingState, gstRate, title } = req.body;

    if (title) boq.title = title;
    if (gstRate !== undefined) boq.gstRate = Number(gstRate);
    if (sheets) boq.sheets = sheets;

    // If pricing state changed, refresh intelligence
    if (pricingState && pricingState !== boq.pricingState) {
      await attachPricingIntelligence(boq, pricingState);
    }

    // Deterministically recalculate all amounts and subtotals
    recalculateBOQ(boq);

    await boq.save();
    res.json({ success: true, data: boq });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/commercial-boq/:id/refresh-rates
 * Refreshes Buildiqo material intelligence for current state without altering commercial rates
 */
router.post('/:id/refresh-rates', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const boq = await CommercialBOQ.findById(id);

    if (!boq) {
      return res.status(404).json({ success: false, error: 'Commercial BOQ not found.' });
    }

    if (boq.userId.toString() !== (req.user._id || req.user.id).toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized.' });
    }

    const targetState = req.body.pricingState || boq.pricingState || 'Karnataka';
    await attachPricingIntelligence(boq, targetState);

    // Save updated benchmarks
    await boq.save();

    res.json({
      success: true,
      message: 'Material benchmarks refreshed successfully.',
      data: boq
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/commercial-boq/:id/apply-rate
 * Explicitly applies approved Buildiqo material rate to an eligible compatible row
 */
router.post('/:id/apply-rate', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rowId } = req.body;

    if (!rowId) {
      return res.status(400).json({ success: false, error: 'Row ID is required.' });
    }

    const boq = await CommercialBOQ.findById(id);
    if (!boq) {
      return res.status(404).json({ success: false, error: 'Commercial BOQ not found.' });
    }

    if (boq.userId.toString() !== (req.user._id || req.user.id).toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized.' });
    }

    let targetRow = null;
    for (const sheet of boq.sheets) {
      for (const section of sheet.sections) {
        targetRow = section.rows.find(r => r.id === rowId);
        if (targetRow) break;
      }
      if (targetRow) break;
    }

    if (!targetRow) {
      return res.status(404).json({ success: false, error: 'Target row not found.' });
    }

    // Apply with safety checks
    applyMaterialRateToRow(targetRow, req.user);

    // Recalculate full BOQ
    recalculateBOQ(boq);
    await boq.save();

    res.json({
      success: true,
      message: `Rate updated to ₹${targetRow.currentRate} for "${targetRow.description}".`,
      data: boq
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/commercial-boq/:id/recalculate
 * Recalculates all line amounts and subtotals
 */
router.post('/:id/recalculate', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const boq = await CommercialBOQ.findById(id);

    if (!boq) {
      return res.status(404).json({ success: false, error: 'Commercial BOQ not found.' });
    }

    recalculateBOQ(boq);
    await boq.save();

    res.json({ success: true, data: boq });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/commercial-boq/save
 * Saves or updates a commercial BOQ from frontend JSON payload (drafts or edits)
 */
router.post('/save', optionalAuth, async (req, res) => {
  try {
    const boqData = req.body;
    if (!boqData || !boqData.sheets) {
      return res.status(400).json({ success: false, error: 'Invalid BOQ data provided.' });
    }

    const userId = req.user ? (req.user._id || req.user.id) : 'usr_guest';

    // If existing valid MongoDB ObjectId, update it
    if (boqData._id && !boqData._id.startsWith('draft_') && /^[0-9a-fA-F]{24}$/.test(boqData._id)) {
      const updated = await CommercialBOQ.findByIdAndUpdate(
        boqData._id,
        {
          ...boqData,
          updatedAt: new Date()
        },
        { new: true }
      );
      if (updated) {
        return res.json({ success: true, message: 'Commercial BOQ updated successfully.', data: updated });
      }
    }

    // Otherwise, create a new document
    const cleanBoq = { ...boqData };
    delete cleanBoq._id; // Remove draft ID to allow MongoDB to generate a real ObjectId
    cleanBoq.userId = userId;

    const newDoc = new CommercialBOQ(cleanBoq);
    await newDoc.save();

    res.json({
      success: true,
      message: 'Commercial BOQ saved successfully.',
      data: newDoc
    });
  } catch (err) {
    console.error('Error saving BOQ:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to save BOQ.' });
  }
});

/**
 * POST /api/commercial-boq/export/excel
 * Generates and downloads styled Excel export directly from client in-memory BOQ data.
 * Resolves bug where unsaved draft workbooks failed to open in Microsoft Excel.
 */
router.post('/export/excel', async (req, res) => {
  try {
    let boq = req.body.boqData || req.body;
    if (!boq || !boq.sheets) {
      return res.status(400).json({ success: false, error: 'No BOQ data provided for Excel export.' });
    }

    // Ensure totals are fresh and calculated
    boq = recalculateBOQ(boq);

    const excelBuffer = await exportToExcel(boq);
    const cleanFileName = (boq.fileName || 'Commercial_BOQ').replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${cleanFileName}_Buildiqo_Edited.xlsx"`);
    res.send(excelBuffer);
  } catch (err) {
    console.error('Excel export error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/commercial-boq/export/pdf
 * Generates and downloads styled PDF export directly from client in-memory BOQ data.
 * Resolves bug where unsaved draft workbooks failed to open in Adobe Acrobat.
 */
router.post('/export/pdf', async (req, res) => {
  try {
    let boq = req.body.boqData || req.body;
    if (!boq || !boq.sheets) {
      return res.status(400).json({ success: false, error: 'No BOQ data provided for PDF export.' });
    }

    // Ensure totals are fresh and calculated
    boq = recalculateBOQ(boq);

    const pdfBuffer = await exportToPDF(boq);
    const cleanFileName = (boq.fileName || 'Commercial_BOQ').replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${cleanFileName}_Buildiqo_Report.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF export error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/commercial-boq/:id/export/excel
 * Generates and downloads styled Excel export by document ID
 */
router.get('/:id/export/excel', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id.startsWith('draft_') || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ success: false, error: 'Draft workbooks must be exported via POST /export/excel with data payload.' });
    }

    const boq = await CommercialBOQ.findById(id);
    if (!boq) {
      return res.status(404).json({ success: false, error: 'Commercial BOQ not found.' });
    }

    const excelBuffer = await exportToExcel(boq);
    const cleanFileName = (boq.fileName || 'Commercial_BOQ.xlsx').replace(/\.[^/.]+$/, '');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${cleanFileName}_Buildiqo_Edited.xlsx"`);
    res.send(excelBuffer);
  } catch (err) {
    console.error('Excel export error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/commercial-boq/:id/export/pdf
 * Generates and downloads styled PDF export by document ID
 */
router.get('/:id/export/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id.startsWith('draft_') || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ success: false, error: 'Draft workbooks must be exported via POST /export/pdf with data payload.' });
    }

    const boq = await CommercialBOQ.findById(id);
    if (!boq) {
      return res.status(404).json({ success: false, error: 'Commercial BOQ not found.' });
    }

    const pdfBuffer = await exportToPDF(boq);
    const cleanFileName = (boq.fileName || 'Commercial_BOQ.pdf').replace(/\.[^/.]+$/, '');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${cleanFileName}_Buildiqo_Report.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF export error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
