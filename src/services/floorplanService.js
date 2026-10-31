import { apiRequest } from '../utils/apiClient';
import {
  parseDxfString,
  inspectDwgFile,
  inspectPdfFile,
  parseImageFloorplan,
  parseSvgFloorplan
} from '../utils/cadParser';

/**
 * Uploads an architectural floor plan file (DXF, PDF, Image, SVG) to the extraction endpoint.
 * Supports vector PDFs, scanned blueprints, images (PNG, JPG, WEBP), and CAD drawings.
 * Resiliently engages client analysis engine if backend is offline.
 * 
 * @param {File} file - Floor plan File object
 * @param {Object} [options={}] - Optional settings: { unitOverride, pageIndex, calibration }
 * @returns {Promise<Object>} Normalized extraction response
 */
export async function extractFloorPlanCAD(file, options = {}) {
  if (!file) {
    throw new Error('No file selected.');
  }

  const opts = typeof options === 'string' ? { unitOverride: options } : (options || {});
  const unitOverride = opts.unitOverride || 'auto';
  const pageIndex = opts.pageIndex || 0;
  const calibration = opts.calibration || null;

  // File extension validation
  const lowerName = file.name.toLowerCase();
  const isDxf = lowerName.endsWith('.dxf');
  const isDwg = lowerName.endsWith('.dwg');
  const isPdf = lowerName.endsWith('.pdf');
  const isImage = /\.(png|jpe?g|webp)$/i.test(lowerName);
  const isSvg = lowerName.endsWith('.svg');

  if (!isDxf && !isDwg && !isPdf && !isImage && !isSvg) {
    throw new Error(
      'Invalid file format. Supported architectural formats: AutoCAD .dxf, PDF (.pdf), Images (.png, .jpg, .webp), and Vector .svg.'
    );
  }

  // File size validation (25 MB)
  if (file.size > 25 * 1024 * 1024) {
    throw new Error(`File size exceeds the 25 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
  }

  // Honest DWG handling before upload
  if (isDwg) {
    return await inspectDwgFile(file);
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    if (pageIndex) formData.append('pageIndex', String(pageIndex));
    if (unitOverride && unitOverride !== 'auto') formData.append('unitOverride', unitOverride);
    if (calibration) formData.append('calibration', JSON.stringify(calibration));

    const response = await apiRequest('/api/floorplan/extract', {
      method: 'POST',
      body: formData
    });

    if (response && response.success) {
      return response;
    }
    if (response && response.error) {
      throw new Error(response.error);
    }
  } catch (apiErr) {
    console.warn('[floorplanService] Backend extraction API error or unavailable:', apiErr.message);

    // Resilient client-side fallback processing
    if (isDxf) {
      const text = await file.text();
      return parseDxfString(text, file.name, unitOverride);
    } else if (isPdf) {
      return await inspectPdfFile(file, { pageIndex, calibration });
    } else if (isImage) {
      return await parseImageFloorplan(file, { calibration });
    } else if (isSvg) {
      return await parseSvgFloorplan(file);
    }
    throw apiErr;
  }
}

// Export aliases for backwards compatibility
export const extractFloorPlanDXF = extractFloorPlanCAD;
export const extractFloorPlanPDF = extractFloorPlanCAD;
