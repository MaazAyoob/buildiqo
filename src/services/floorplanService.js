import { apiRequest } from '../utils/apiClient';

/**
 * Uploads an AutoCAD DXF, DWG, or architectural vector PDF floor plan file to the backend extraction endpoint.
 * Requires an authenticated user session.
 * 
 * @param {File} file - DXF, DWG, or PDF File object
 * @returns {Promise<Object>} Normalized extraction response { success, source, rooms, warnings, total_usable_carpet_sqft }
 */
export async function extractFloorPlanDXF(file) {
  if (!file) {
    throw new Error('No file selected.');
  }

  // File extension validation: supports DXF, DWG, and PDF
  const isValidFormat = /\.(dxf|dwg|pdf)$/i.test(file.name);
  if (!isValidFormat) {
    throw new Error('Invalid file format. Please upload an AutoCAD .dxf, .dwg, or vector .pdf floor plan file.');
  }

  // File size validation (25 MB)
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('File size exceeds the 25 MB limit.');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await apiRequest('/api/floorplan/extract', {
    method: 'POST',
    body: formData
  });

  return response;
}

// Export aliases for semantic clarity
export const extractFloorPlanCAD = extractFloorPlanDXF;
export const extractFloorPlanPDF = extractFloorPlanDXF;
