/**
 * Buildiqo.AI - Phase 2.0 AI Floor Plan Generator Frontend Service
 * Handles API communication for floor plan generation, regeneration,
 * natural language refinement, and DXF export.
 */

import { apiRequest } from '../utils/apiClient';

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Generates an AI-assisted architectural floor plan layout.
 * @param {Object} payload - Plot dimensions, facing, num_floors, setback, rooms_required, vastu_compliant
 * @returns {Promise<Object>} Generated layout response including SVG, floors, and warnings
 */
export async function generateFloorPlanAI(payload) {
  return await apiRequest('/api/floorplan/generate', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * Re-runs the deterministic solver with a new seed on identical requirements.
 * @param {string} generationId
 * @param {number} [seed]
 */
export async function regenerateFloorPlanAI(generationId, seed) {
  return await apiRequest('/api/floorplan/regenerate', {
    method: 'POST',
    body: JSON.stringify({ generation_id: generationId, seed })
  });
}

/**
 * Refines the current layout through a natural language instruction.
 * @param {string} generationId
 * @param {string} instruction
 */
export async function refineFloorPlanAI(generationId, instruction) {
  return await apiRequest('/api/floorplan/refine', {
    method: 'POST',
    body: JSON.stringify({ generation_id: generationId, instruction })
  });
}

/**
 * Triggers a browser file download of the generated DXF document.
 * @param {string} generationId
 * @param {number} [floor=0]
 */
export async function downloadFloorPlanDXF(generationId, floor = 0) {
  const token = localStorage.getItem('buildiqo_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/api/floorplan/download-dxf/${generationId}?floor=${floor}`, {
    headers
  });

  if (!res.ok) {
    throw new Error(`Failed to download DXF: HTTP ${res.status}`);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `buildiqo_plan_${generationId}_floor_${floor}.dxf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
