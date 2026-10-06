import { apiRequest } from '../utils/apiClient';
import { parseDxfString, inspectDwgFile, inspectPdfFile } from '../utils/cadParser';

/**
 * Uploads an AutoCAD DXF, DWG, or architectural vector PDF floor plan file to the backend extraction endpoint.
 * Requires an authenticated user session. Resiliently engages client CAD engine if backend is offline.
 * 
 * @param {File} file - DXF, DWG, or PDF File object
 * @param {string} [unitOverride='auto'] - Optional unit override ('auto', 'ft', 'm', 'mm', 'cm', 'in')
 * @returns {Promise<Object>} Normalized extraction response { success, source, rooms, warnings, total_usable_carpet_sqft }
 */
export async function extractFloorPlanDXF(file, unitOverride = 'auto') {
  if (!file) {
    throw new Error('No file selected.');
  }

  // File extension validation: supports DXF, DWG, and PDF
  const lowerName = file.name.toLowerCase();
  const isDxf = lowerName.endsWith('.dxf');
  const isDwg = lowerName.endsWith('.dwg');
  const isPdf = lowerName.endsWith('.pdf');

  if (!isDxf && !isDwg && !isPdf) {
    throw new Error('Invalid file format. Please upload an AutoCAD .dxf, .dwg, or vector .pdf floor plan file.');
  }

  // File size validation (25 MB)
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('File size exceeds the 25 MB limit.');
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiRequest('/api/floorplan/extract', {
      method: 'POST',
      body: formData
    });

    if (response && response.success) {
      return response;
    }
  } catch (apiErr) {
    console.warn('[floorplanService] Upstream extraction API unavailable or errored:', apiErr.message);
    
    // Resilient local processing
    if (isDxf) {
      const text = await file.text();
      return parseDxfString(text, file.name, unitOverride);
    } else if (isDwg) {
      return await inspectDwgFile(file);
    } else if (isPdf) {
      return await inspectPdfFile(file);
    }
    throw apiErr;
  }
}

// Export aliases for semantic clarity
export const extractFloorPlanCAD = extractFloorPlanDXF;
export const extractFloorPlanPDF = extractFloorPlanDXF;
