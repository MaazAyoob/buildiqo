import { apiRequest } from '../utils/apiClient';

/**
 * Uploads an AutoCAD DXF or DWG floor plan file to the backend extraction endpoint.
 * Requires an authenticated user session.
 * 
 * @param {File} file - DXF or DWG File object
 * @returns {Promise<Object>} Normalized extraction response { success, source, rooms, warnings, total_usable_carpet_sqft }
 */
export async function extractFloorPlanDXF(file) {
  if (!file) {
    throw new Error('No file selected.');
  }

  // File extension validation: supports both DXF and DWG
  const isCad = /\.(dxf|dwg)$/i.test(file.name);
  if (!isCad) {
    throw new Error('Invalid file format. Please upload an AutoCAD .dxf or .dwg floor plan file.');
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

// Export alias for semantic clarity
export const extractFloorPlanCAD = extractFloorPlanDXF;
