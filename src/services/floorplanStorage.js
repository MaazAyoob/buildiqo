/**
 * Buildiqo.AI - Floor Plan Studio Storage & History Helper
 * Manages saved plans, generation history, and export helpers.
 */

const STORAGE_KEY_RECENT = 'buildiqo_ai_recent_floorplans';
const STORAGE_KEY_SAVED = 'buildiqo_ai_saved_floorplans';

export function getRecentFloorplans() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECENT);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load recent floorplans from storage:', e);
  }
  return [];
}

export function addRecentFloorplan(plan) {
  if (!plan || !plan.generation_id) return;
  try {
    const existing = getRecentFloorplans();
    const entry = {
      id: plan.generation_id,
      title: `${plan.plot?.width_ft || 30}×${plan.plot?.length_ft || 40} ft ${plan.constraints?.plot_facing ? plan.constraints.plot_facing.toUpperCase() : 'NORTH'}`,
      plot: plan.plot,
      floorsCount: plan.floors?.length || 1,
      createdAt: new Date().toISOString(),
      plan
    };
    // Keep max 10 recent plans, unique by generation_id
    const filtered = [entry, ...existing.filter(p => p.id !== entry.id)].slice(0, 10);
    localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to record recent floorplan:', e);
  }
}

export function getSavedFloorplans() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load saved floorplans from storage:', e);
  }
  return [];
}

export function saveFloorplanToStorage(name, plan, projectId = null, projectName = null) {
  if (!plan) return null;
  try {
    const existing = getSavedFloorplans();
    const entry = {
      id: `saved_plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name || `${plan.plot?.width_ft || 30}×${plan.plot?.length_ft || 40} Residential Plan`,
      generation_id: plan.generation_id,
      projectId: projectId || null,
      projectName: projectName || (projectId ? 'Linked Project' : 'Standalone'),
      plot: plan.plot,
      floorsCount: plan.floors?.length || 1,
      totalCarpetSqft: (plan.floors || []).reduce((acc, f) => acc + (f.carpet_area_sqft || 0), 0),
      createdAt: new Date().toISOString(),
      plan
    };
    const updated = [entry, ...existing];
    localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(updated));
    return entry;
  } catch (e) {
    console.warn('Failed to save floorplan:', e);
    return null;
  }
}

export function deleteSavedFloorplan(id) {
  try {
    const existing = getSavedFloorplans();
    const updated = existing.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.warn('Failed to delete saved floorplan:', e);
    return false;
  }
}

export function exportSvgToFile(svgContent, filename = 'buildiqo_conceptual_plan.svg') {
  if (!svgContent) return;
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
