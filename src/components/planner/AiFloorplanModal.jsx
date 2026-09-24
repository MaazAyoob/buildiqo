/**
 * Buildiqo.AI - Phase 2.0 AI Floor Plan Generator Modal
 * Interactive requirements form, live SVG architectural plan viewer,
 * multi-floor tab switcher, structured warnings drawer, regenerate, refine,
 * DXF download, and mandatory human review before Step 2 application.
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  Compass,
  Ruler,
  Maximize2,
  RefreshCw,
  MessageSquare,
  Download,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  Plus,
  Minus,
  Trash2,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import {
  generateFloorPlanAI,
  regenerateFloorPlanAI,
  refineFloorPlanAI,
  downloadFloorPlanDXF
} from '../../services/aiFloorplanService';
import { useEstimateStore } from '../../store/useEstimateStore';


const AVAILABLE_ROOM_OPTIONS = [
  { type: 'living', name: 'Living Room', defaultCount: 1 },
  { type: 'kitchen', name: 'Kitchen', defaultCount: 1 },
  { type: 'dining', name: 'Dining Room', defaultCount: 1 },
  { type: 'master_bed', name: 'Master Bedroom', defaultCount: 1 },
  { type: 'regular_bed', name: 'Bedroom', defaultCount: 1 },
  { type: 'attached_bath', name: 'Attached Bathroom', defaultCount: 1 },
  { type: 'common_bath', name: 'Common Bathroom', defaultCount: 1 },
  { type: 'puja', name: 'Puja Room', defaultCount: 1 },
  { type: 'utility', name: 'Utility / Wash', defaultCount: 1 },
  { type: 'balcony', name: 'Balcony', defaultCount: 1 },
  { type: 'parking', name: 'Car Parking', defaultCount: 1 },
  { type: 'office', name: 'Home Office / Study', defaultCount: 1 }
];

export function AiFloorplanModal({ isOpen, onClose, state, onApplyToStep2 }) {
  const { loginAsGuest } = useEstimateStore();
  // Input form state pre-populated from Planner Step 1
  const [plotWidth, setPlotWidth] = useState(state.plotWidth || 30);
  const [plotLength, setPlotLength] = useState(state.plotLength || 40);
  const [numFloors, setNumFloors] = useState(state.numFloors || 1);
  const [plotFacing, setPlotFacing] = useState(state.facing ? state.facing.toLowerCase() : 'north');
  const [setback, setSetback] = useState(3);
  const [vastuCompliant, setVastuCompliant] = useState(true);
  const [budgetTier, setBudgetTier] = useState(state.tier || 'standard');
  const [stylePreference, setStylePreference] = useState('modern');

  // Room requirements list
  const [roomList, setRoomList] = useState([
    { type: 'living', count: 1 },
    { type: 'kitchen', count: 1 },
    { type: 'dining', count: 1 },
    { type: 'master_bed', count: 1 },
    { type: 'regular_bed', count: 1 },
    { type: 'common_bath', count: 1 },
    { type: 'attached_bath', count: 1 }
  ]);

  // Generation status and layout state
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [activeFloorIdx, setActiveFloorIdx] = useState(0);

  // Refinement input state
  const [refinementText, setRefinementText] = useState('');
  const [refining, setRefining] = useState(false);
  const [refinementClarification, setRefinementClarification] = useState(null);

  useEffect(() => {
    if (state.plotWidth) setPlotWidth(state.plotWidth);
    if (state.plotLength) setPlotLength(state.plotLength);
    if (state.numFloors) setNumFloors(state.numFloors);
    if (state.facing) setPlotFacing(state.facing.toLowerCase());
  }, [state]);

  if (!isOpen) return null;

  const handleAddRoomType = (type) => {
    const existing = roomList.find(r => r.type === type);
    if (existing) {
      setRoomList(prev => prev.map(r => r.type === type ? { ...r, count: r.count + 1 } : r));
    } else {
      setRoomList(prev => [...prev, { type, count: 1 }]);
    }
  };

  const handleUpdateRoomCount = (type, delta) => {
    setRoomList(prev => prev.map(r => {
      if (r.type !== type) return r;
      const newCount = r.count + delta;
      return newCount > 0 ? { ...r, count: newCount } : null;
    }).filter(Boolean));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setRefinementClarification(null);

    // Ensure valid session token exists before requesting AI floor plan generation
    let token = localStorage.getItem('buildiqo_token');
    if (!token || token === 'undefined' || token === 'null') {
      setLoadingStage('Establishing secure session...');
      try {
        const guestRes = await loginAsGuest();
        if (guestRes && guestRes.user) {
          token = localStorage.getItem('buildiqo_token');
        }
      } catch (authErr) {
        console.warn('Failed to establish guest session:', authErr.message);
      }
    }

    if (!token || token === 'undefined' || token === 'null') {
      setError('Authentication required: Please sign in or continue as Guest to generate AI floor plans.');
      setLoading(false);
      setLoadingStage('');
      return;
    }

    setLoadingStage('Generating room program & solving spatial constraints...');

    try {
      const payload = {
        plot_width_ft: Number(plotWidth),
        plot_length_ft: Number(plotLength),
        plot_facing: plotFacing,
        num_floors: Number(numFloors),
        setback_ft: Number(setback),
        rooms_required: roomList,
        budget_tier: budgetTier,
        style_preference: stylePreference,
        vastu_compliant: vastuCompliant
      };

      const data = await generateFloorPlanAI(payload);

      if (data && data.success) {
        setResult(data);
        setActiveFloorIdx(0);
      } else {
        setError(data?.error || 'Failed to generate floor plan.');
      }
    } catch (err) {
      setError(err.message || 'Error generating floor plan. Please verify requirements and try again.');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const handleRegenerate = async () => {
    if (!result?.generation_id) return;
    setLoading(true);
    setLoadingStage('Exploring alternative valid spatial layout...');
    setError(null);

    try {
      const data = await regenerateFloorPlanAI(result.generation_id);
      if (data && data.success) {
        setResult(data);
      } else {
        setError(data?.error || 'Failed to regenerate layout.');
      }
    } catch (err) {
      setError(err.message || 'Error regenerating layout.');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const handleRefine = async (instructionToUse) => {
    const text = instructionToUse || refinementText;
    if (!text || !result?.generation_id) return;

    setRefining(true);
    setError(null);
    setRefinementClarification(null);

    try {
      const data = await refineFloorPlanAI(result.generation_id, text);
      if (data.is_ambiguous) {
        setRefinementClarification(data);
      } else if (data.success) {
        setResult(data);
        setRefinementText('');
      } else {
        setError(data.error || 'Refinement could not be completed.');
      }
    } catch (err) {
      setError(err.message || 'Error refining layout.');
    } finally {
      setRefining(false);
    }
  };

  const handleDownloadDxf = async () => {
    if (!result?.generation_id) return;
    try {
      await downloadFloorPlanDXF(result.generation_id, activeFloorIdx);
    } catch (err) {
      setError('Failed to download CAD DXF file.');
    }
  };

  const handleApply = () => {
    if (!result || !result.floors) return;

    // Convert generated room geometry into normalized Step 2 room structure
    const updatedFloors = state.floors.map((existingFloor, fIdx) => {
      const generatedFloor = result.floors.find(f => f.floor === fIdx);
      if (!generatedFloor) return existingFloor;

      const convertedRooms = generatedFloor.rooms.map((r, idx) => ({
        id: `gen-${fIdx}-${idx}-${Date.now()}`,
        room_id: r.room_id,
        name: r.name,
        type: r.type,
        width: Number(r.width) || 12,
        length: Number(r.length) || 14,
        area: Number(r.area),
        area_sqft: Number(r.area),
        count: 1,
        floor: fIdx,
        x: r.x,
        y: r.y,
        rotation: r.rotation || 0,
        compass_zone: r.compass_zone,
        adjacent_to: r.adjacent_to || [],
        confidence: 'generated', // Strictly "generated" per specification
        area_method: 'POLYGON_AREA',
        dimension_method: 'MIN_ROTATED_BOUNDING_BOX',
        source: 'AI_GENERATION',
        geometry: {
          x: r.x,
          y: r.y,
          width: r.width,
          length: r.length,
          polygon: r.polygon || [],
          doors: r.doors || [],
          windows: r.windows || []
        }
      }));

      return {
        ...existingFloor,
        rooms: convertedRooms
      };
    });

    onApplyToStep2(updatedFloors);
    onClose();
  };

  const currentFloor = result?.floors?.find(f => f.floor === activeFloorIdx) || result?.floors?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                <span>AI Floor Plan Generator</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-extrabold">
                  Phase 2.0
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Generate deterministic, setback-compliant architectural layouts from your plot requirements.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Requirements Form */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <Ruler className="w-4 h-4 text-indigo-600" />
                <span>1. Plot & Site Parameters</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Width (ft)</label>
                  <input
                    type="number"
                    value={plotWidth}
                    onChange={(e) => setPlotWidth(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    min="15"
                    max="250"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Length (ft)</label>
                  <input
                    type="number"
                    value={plotLength}
                    onChange={(e) => setPlotLength(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    min="15"
                    max="250"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Facing</label>
                  <select
                    value={plotFacing}
                    onChange={(e) => setPlotFacing(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="north">North</option>
                    <option value="east">East</option>
                    <option value="south">South</option>
                    <option value="west">West</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Floors</label>
                  <select
                    value={numFloors}
                    onChange={(e) => setNumFloors(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value={1}>1 Floor (Ground)</option>
                    <option value={2}>2 Floors (G+1)</option>
                    <option value={3}>3 Floors (G+2)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Setback (ft)</label>
                  <input
                    type="number"
                    value={setback}
                    onChange={(e) => setSetback(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    min="0"
                    max="15"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Vastu Preferences</label>
                  <button
                    type="button"
                    onClick={() => setVastuCompliant(!vastuCompliant)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      vastuCompliant
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    {vastuCompliant ? '✓ Vastu Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>

            {/* Room Selector */}
            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>2. Required Room Program</span>
                </h3>
                <span className="text-[10px] font-bold text-slate-400">
                  {roomList.reduce((acc, r) => acc + r.count, 0)} Total
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {roomList.map((room) => {
                  const opt = AVAILABLE_ROOM_OPTIONS.find(o => o.type === room.type) || { name: room.type };
                  return (
                    <div key={room.type} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 text-xs">
                      <span className="font-semibold text-slate-800">{opt.name}</span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateRoomCount(room.type, -1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-bold text-slate-900">{room.count}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateRoomCount(room.type, 1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Room Dropdown */}
              <div className="pt-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddRoomType(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full text-xs font-semibold py-2 px-3 rounded-xl border border-dashed border-slate-300 bg-white text-slate-600 hover:border-indigo-500 cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>+ Add space to program...</option>
                  {AVAILABLE_ROOM_OPTIONS.map(opt => (
                    <option key={opt.type} value={opt.type}>{opt.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
                  <span>{loadingStage || 'Generating...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Generate Conceptual Floor Plan</span>
                </>
              )}
            </button>

            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2 text-rose-700 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Right Column: Interactive Plan Preview & Actions */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            
            {/* Review Banner - Mandatory per specification */}
            <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold">
                  AI-generated layout — review before finalizing.
                </span>
                <span className="hidden md:inline text-amber-700 font-normal">
                  (Click "Apply to Step 2" to commit rooms to the project estimator).
                </span>
              </div>
            </div>

            {/* Floor Switcher & Action Toolbar */}
            {result && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-100 rounded-2xl border border-slate-200">
                <div className="flex items-center space-x-1.5">
                  {result.floors.map((fl) => (
                    <button
                      key={fl.floor}
                      onClick={() => setActiveFloorIdx(fl.floor)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                        activeFloorIdx === fl.floor
                          ? 'bg-white text-indigo-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {fl.name}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRegenerate}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 flex items-center space-x-1.5 shadow-sm transition-all"
                    title="Generate another valid spatial arrangement with a new seed"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
                    <span>Regenerate</span>
                  </button>

                  <button
                    onClick={handleDownloadDxf}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 flex items-center space-x-1.5 shadow-sm transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Download DXF</span>
                  </button>
                </div>
              </div>
            )}

            {/* Live SVG Floor Plan Display */}
            <div className="flex-1 min-h-[380px] bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center p-4 overflow-hidden relative">
              {result?.svg ? (
                <div 
                  className="w-full h-full flex items-center justify-center max-h-[460px] select-none"
                  dangerouslySetInnerHTML={{ __html: result.svg }}
                />
              ) : (
                <div className="text-center py-16 text-slate-400 space-y-2">
                  <Maximize2 className="w-10 h-10 mx-auto opacity-30 text-indigo-400" />
                  <p className="text-sm font-semibold text-slate-500">
                    Your generated architectural layout will render here.
                  </p>
                  <p className="text-xs text-slate-400">
                    Configure plot dimensions and click "Generate Conceptual Floor Plan".
                  </p>
                </div>
              )}
            </div>

            {/* Warnings Drawer (Vastu, Circulation, Alignment) */}
            {result?.warnings && result.warnings.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 space-y-1 text-xs text-slate-600">
                <span className="font-bold text-slate-700 flex items-center space-x-1">
                  <Info className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Design & Zoning Notes:</span>
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {result.warnings.map((w, idx) => (
                    <li key={idx}>{w.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Conversational Refinement Bar */}
            {result && (
              <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={refinementText}
                    onChange={(e) => setRefinementText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                    placeholder='Refine plan (e.g., "Make kitchen 20% bigger", "Move master bedroom upstairs")...'
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={refining}
                  />
                  <button
                    onClick={() => handleRefine()}
                    disabled={refining || !refinementText.trim()}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs disabled:opacity-50 transition-all shrink-0"
                  >
                    {refining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Refine'}
                  </button>
                </div>

                {refinementClarification && (
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2 text-xs">
                    <p className="font-semibold text-indigo-900">{refinementClarification.clarification_message}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {refinementClarification.suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleRefine(sug)}
                          className="px-2.5 py-1 bg-white text-indigo-700 font-semibold rounded-lg border border-indigo-200 hover:bg-indigo-100/50 transition-all text-[11px]"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Final Action Footer */}
            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all"
              >
                Cancel / Discard
              </button>

              <button
                type="button"
                onClick={handleApply}
                disabled={!result || !result.floors}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all disabled:opacity-40"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Apply to Step 2</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
