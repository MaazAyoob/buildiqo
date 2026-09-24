import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Layers,
  Compass,
  Maximize2,
  Download,
  RefreshCw,
  Sliders,
  FileCode,
  FolderKanban,
  Clock,
  Save,
  Plus,
  Minus,
  Trash2,
  Edit3,
  Check,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Info,
  ExternalLink,
  MessageSquare,
  Upload,
  X,
  Eye,
  Building,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { useEstimateStore } from '../store/useEstimateStore';
import {
  generateFloorPlanAI,
  regenerateFloorPlanAI,
  refineFloorPlanAI,
  downloadFloorPlanDXF
} from '../services/aiFloorplanService';
import { extractFloorPlanCAD } from '../services/floorplanService';
import {
  getRecentFloorplans,
  addRecentFloorplan,
  getSavedFloorplans,
  saveFloorplanToStorage,
  deleteSavedFloorplan,
  exportSvgToFile
} from '../services/floorplanStorage';

const AVAILABLE_ROOM_OPTIONS = [
  { type: 'living', name: 'Living Room', category: 'Public', defaultW: 14, defaultL: 16 },
  { type: 'dining', name: 'Dining Room', category: 'Public', defaultW: 12, defaultL: 12 },
  { type: 'kitchen', name: 'Kitchen', category: 'Service', defaultW: 10, defaultL: 10 },
  { type: 'master_bedroom', name: 'Master Bedroom', category: 'Private', defaultW: 14, defaultL: 14 },
  { type: 'bedroom', name: 'Bedroom', category: 'Private', defaultW: 12, defaultL: 12 },
  { type: 'bathroom', name: 'Bathroom / Toilet', category: 'Service', defaultW: 6, defaultL: 8 },
  { type: 'pooja', name: 'Pooja Room', category: 'Special', defaultW: 6, defaultL: 6 },
  { type: 'utility', name: 'Utility / Wash', category: 'Service', defaultW: 6, defaultL: 6 },
  { type: 'staircase', name: 'Staircase Core', category: 'Circulation', defaultW: 7, defaultL: 14 },
  { type: 'balcony', name: 'Balcony / Sitout', category: 'Outdoor', defaultW: 6, defaultL: 10 },
  { type: 'foyer', name: 'Entrance Foyer', category: 'Circulation', defaultW: 6, defaultL: 8 },
  { type: 'parking', name: 'Car Porch / Parking', category: 'Outdoor', defaultW: 10, defaultL: 16 }
];

export function FloorPlanStudioPage({ setRoute, onOpenSavedModal }) {
  const {
    state,
    updateState,
    savedProjects,
    currentUser,
    loginAsGuest
  } = useEstimateStore();

  // Project linkage
  const [selectedProjectId, setSelectedProjectId] = useState(state.projectName ? 'current' : 'standalone');

  // Plot & Site configuration
  const [plotWidth, setPlotWidth] = useState(state.plotWidth || 30);
  const [plotLength, setPlotLength] = useState(state.plotLength || 40);
  const [unit, setUnit] = useState('ft');
  const [facing, setFacing] = useState(state.plotFacing || 'east');
  const [setback, setSetback] = useState(state.setbacks?.front || 3);
  const [numFloors, setNumFloors] = useState(state.numFloors || 2);

  // Requirements / Room Program
  const [roomList, setRoomList] = useState([
    { type: 'living', count: 1 },
    { type: 'dining', count: 1 },
    { type: 'kitchen', count: 1 },
    { type: 'master_bedroom', count: 1 },
    { type: 'bedroom', count: 1 },
    { type: 'bathroom', count: 2 },
    { type: 'pooja', count: 1 },
    { type: 'staircase', count: 1 }
  ]);

  // Preferences
  const [vastuCompliant, setVastuCompliant] = useState(true);
  const [budgetTier, setBudgetTier] = useState(state.tier || 'standard');
  const [stylePreference, setStylePreference] = useState('contemporary');

  // Generator & UI State
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [activeFloorIdx, setActiveFloorIdx] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Regenerate Candidate A/B Comparison Modal State
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [candidateResult, setCandidateResult] = useState(null);

  // Refine Drawer / Dialog State
  const [isRefineOpen, setIsRefineOpen] = useState(false);
  const [refinementText, setRefinementText] = useState('');
  const [refining, setRefining] = useState(false);
  const [refinementClarification, setRefinementClarification] = useState(null);

  // CAD Import Modal State
  const [isCadModalOpen, setIsCadModalOpen] = useState(false);
  const [cadFile, setCadFile] = useState(null);
  const [cadExtracting, setCadExtracting] = useState(false);
  const [cadExtractResult, setCadExtractResult] = useState(null);
  const [cadError, setCadError] = useState(null);

  // Apply to Project Confirmation Modal State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState(null);

  // Save Plan Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [savePlanName, setSavePlanName] = useState('');
  const [isRecentDrawerOpen, setIsRecentDrawerOpen] = useState(false);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [recentList, setRecentList] = useState([]);
  const [savedList, setSavedList] = useState([]);

  // Room quick edit inline state
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [editRoomName, setEditRoomName] = useState('');
  const [editRoomW, setEditRoomW] = useState(12);
  const [editRoomL, setEditRoomL] = useState(14);

  const fileInputRef = useRef(null);

  // Load history on mount
  useEffect(() => {
    setRecentList(getRecentFloorplans());
    setSavedList(getSavedFloorplans());
  }, []);

  // Update selected room when active floor changes or room selected
  useEffect(() => {
    if (result?.floors) {
      const currentFloor = result.floors.find(f => f.floor === activeFloorIdx);
      if (currentFloor?.rooms?.length > 0) {
        if (!selectedRoom || !currentFloor.rooms.find(r => r.room_id === selectedRoom.room_id)) {
          setSelectedRoom(currentFloor.rooms[0]);
        }
      } else {
        setSelectedRoom(null);
      }
    }
  }, [result, activeFloorIdx]);

  // Sync quick edit fields when selected room changes
  useEffect(() => {
    if (selectedRoom) {
      setEditRoomName(selectedRoom.name);
      setEditRoomW(Number(selectedRoom.width) || 12);
      setEditRoomL(Number(selectedRoom.length) || 14);
      setIsEditingRoom(false);
    }
  }, [selectedRoom]);

  // Ensure authenticated session
  const ensureSession = async () => {
    let token = localStorage.getItem('buildiqo_token');
    if (!token && !currentUser) {
      try {
        const guestRes = await loginAsGuest();
        if (guestRes && guestRes.user) {
          token = localStorage.getItem('buildiqo_token');
        }
      } catch (e) {
        console.warn('Session init fallback:', e);
      }
    }
    return token;
  };

  // Handle Room Quantity update
  const handleUpdateRoomCount = (type, delta) => {
    setRoomList(prev => {
      const idx = prev.findIndex(r => r.type === type);
      if (idx === -1) {
        if (delta > 0) return [...prev, { type, count: delta }];
        return prev;
      }
      const newCount = prev[idx].count + delta;
      if (newCount <= 0) {
        return prev.filter(r => r.type !== type);
      }
      const updated = [...prev];
      updated[idx] = { ...updated[idx], count: newCount };
      return updated;
    });
  };

  const handleAddRoomType = (type) => {
    const existing = roomList.find(r => r.type === type);
    if (existing) {
      handleUpdateRoomCount(type, 1);
    } else {
      setRoomList(prev => [...prev, { type, count: 1 }]);
    }
  };

  // Main Generation Flow
  const handleGenerate = async () => {
    setLoading(true);
    setLoadingStage('Establishing solver connection & analyzing plot geometry...');
    setError(null);
    setSelectedRoom(null);

    try {
      await ensureSession();

      const payload = {
        plot_width_ft: Number(plotWidth) || 30,
        plot_length_ft: Number(plotLength) || 40,
        plot_facing: (facing || 'east').toLowerCase(),
        num_floors: Number(numFloors) || 1,
        setback_ft: Number(setback) || 3,
        rooms_required: roomList.filter(r => r.count > 0),
        budget_tier: budgetTier,
        style_preference: stylePreference,
        vastu_compliant: vastuCompliant
      };

      const data = await generateFloorPlanAI(payload);

      if (data && data.success) {
        setResult(data);
        setActiveFloorIdx(0);
        addRecentFloorplan(data);
        setRecentList(getRecentFloorplans());
      } else {
        setError(data?.error || 'Failed to generate floor plan. Please verify requirements and try again.');
      }
    } catch (err) {
      console.warn('[Studio] Generation error:', err);
      let userMsg = err?.message || 'Error generating floor plan.';
      if (err?.status === 401) {
        userMsg = 'Session authorization expired. Please refresh the page to renew session.';
      } else if (err?.status === 504) {
        userMsg = 'Generation timed out. The fallback engine is engaged; please try again.';
      }
      setError(userMsg);
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  // Regenerate Candidate (A/B comparison)
  const handleInitiateRegenerate = async () => {
    if (!result?.generation_id) return;
    setLoading(true);
    setLoadingStage('Computing alternative spatial layout candidate...');
    setError(null);

    try {
      await ensureSession();
      const nextSeed = Math.floor(Math.random() * 100000);
      const data = await regenerateFloorPlanAI(result.generation_id, nextSeed);

      if (data && data.success) {
        setCandidateResult(data);
        setIsCompareModalOpen(true);
      } else {
        setError(data?.error || 'Failed to generate layout candidate.');
      }
    } catch (err) {
      console.warn('[Studio] Regeneration error:', err);
      setError(err?.message || 'Error regenerating candidate layout.');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const handleApplyCandidate = () => {
    if (candidateResult) {
      setResult(candidateResult);
      addRecentFloorplan(candidateResult);
      setRecentList(getRecentFloorplans());
      setIsCompareModalOpen(false);
      setCandidateResult(null);
    }
  };

  // Natural Language Refinement
  const handleRefine = async (instructionToUse) => {
    const text = instructionToUse || refinementText;
    if (!text || !result?.generation_id) return;

    setRefining(true);
    setError(null);
    setRefinementClarification(null);

    try {
      await ensureSession();
      const data = await refineFloorPlanAI(result.generation_id, text);
      if (data?.is_ambiguous) {
        setRefinementClarification(data);
      } else if (data?.success) {
        setResult(data);
        setRefinementText('');
        setIsRefineOpen(false);
        addRecentFloorplan(data);
        setRecentList(getRecentFloorplans());
      } else {
        setError(data?.error || 'Refinement could not be completed.');
      }
    } catch (err) {
      console.warn('[Studio] Refinement error:', err);
      setError(err?.message || 'Error refining layout.');
    } finally {
      setRefining(false);
    }
  };

  // Export DXF
  const handleDownloadDxf = async () => {
    if (!result?.generation_id) return;
    try {
      await ensureSession();
      await downloadFloorPlanDXF(result.generation_id, activeFloorIdx);
    } catch (err) {
      setError('Failed to download CAD DXF file. Please retry.');
    }
  };

  // Export SVG
  const handleExportSvg = () => {
    if (!result?.svg) return;
    const filename = `buildiqo_floorplan_${result.generation_id || 'conceptual'}_floor_${activeFloorIdx}.svg`;
    exportSvgToFile(result.svg, filename);
  };

  // Save Plan to Storage
  const handleSavePlan = () => {
    if (!result) return;
    const name = savePlanName.trim() || `${plotWidth}×${plotLength} ft ${facing.toUpperCase()} Plan`;
    let projId = null;
    let projName = null;

    if (selectedProjectId === 'current' && state.projectName) {
      projId = 'current';
      projName = state.projectName;
    } else if (selectedProjectId !== 'standalone') {
      const p = savedProjects.find(sp => sp.id === selectedProjectId);
      if (p) {
        projId = p.id;
        projName = p.name;
      }
    }

    const saved = saveFloorplanToStorage(name, result, projId, projName);
    if (saved) {
      setSavedList(getSavedFloorplans());
      setIsSaveModalOpen(false);
      setSavePlanName('');
    }
  };

  // Apply Plan to Project with Confirmation
  const handleConfirmApplyToProject = () => {
    if (!result || !result.floors) return;

    // Build floor list ensuring every generated floor is represented
    const numFloorsNeeded = Math.max(state.floors?.length || 1, result.floors.length);
    const updatedFloors = [];

    for (let fIdx = 0; fIdx < numFloorsNeeded; fIdx++) {
      const existingFloor = state.floors?.[fIdx] || {
        id: `f-${fIdx}`,
        name: fIdx === 0 ? 'Ground Floor' : `${fIdx === 1 ? '1st' : fIdx === 2 ? '2nd' : `${fIdx}th`} Floor`,
        rooms: []
      };
      const generatedFloor = result.floors.find(f => f.floor === fIdx);

      if (!generatedFloor) {
        updatedFloors.push(existingFloor);
      } else {
        const convertedRooms = generatedFloor.rooms.map((r, idx) => ({
          id: `gen-${fIdx}-${idx}-${Date.now()}`,
          room_id: r.room_id,
          name: r.name,
          type: r.type,
          width: Number(r.width) || 12,
          length: Number(r.length) || 14,
          area: Number(r.area) || ((Number(r.width) || 12) * (Number(r.length) || 14)),
          area_sqft: Number(r.area) || ((Number(r.width) || 12) * (Number(r.length) || 14)),
          count: 1,
          floor: fIdx,
          x: r.x,
          y: r.y,
          rotation: r.rotation || 0,
          confidence: 'generated',
          source: 'AI_GENERATION'
        }));

        updatedFloors.push({
          ...existingFloor,
          name: generatedFloor.name || existingFloor.name,
          rooms: convertedRooms
        });
      }
    }

    updateState({
      floors: updatedFloors,
      numFloors: updatedFloors.length,
      plotWidth: Number(plotWidth) || state.plotWidth,
      plotLength: Number(plotLength) || state.plotLength,
      plotFacing: facing || state.plotFacing
    });

    setIsApplyModalOpen(false);
    setApplySuccessMsg(`Successfully applied architectural floor plan to ${targetProjectName}!`);
    setTimeout(() => setApplySuccessMsg(null), 6000);
  };

  // CAD Import Processing
  const handleCadFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCadFile(file);
      setCadError(null);
    }
  };

  const handleRunCadExtraction = async () => {
    if (!cadFile) return;
    setCadExtracting(true);
    setCadError(null);
    try {
      await ensureSession();
      const res = await extractFloorPlanCAD(cadFile);
      if (res && res.success) {
        setCadExtractResult(res);
      } else {
        setCadError(res?.error || 'CAD extraction failed to identify valid room boundaries.');
      }
    } catch (err) {
      setCadError(err.message || 'Error processing CAD file.');
    } finally {
      setCadExtracting(false);
    }
  };

  const handleApplyCadToStudio = () => {
    if (!cadExtractResult?.rooms) return;

    // Aggregate detected CAD rooms into requirements
    const counts = {};
    cadExtractResult.rooms.forEach(r => {
      const matchingType = AVAILABLE_ROOM_OPTIONS.find(o => 
        o.name.toLowerCase() === r.name?.toLowerCase() ||
        o.type.toLowerCase() === r.type?.toLowerCase()
      )?.type || 'living';
      counts[matchingType] = (counts[matchingType] || 0) + 1;
    });

    const newReqs = Object.entries(counts).map(([type, count]) => ({ type, count }));
    if (newReqs.length > 0) {
      setRoomList(newReqs);
    }

    setIsCadModalOpen(false);
    setCadExtractResult(null);
    setCadFile(null);
  };

  // Quick edit room in studio
  const handleSaveRoomEdit = () => {
    if (!selectedRoom || !result?.floors) return;

    const updatedFloors = result.floors.map(fl => {
      if (fl.floor !== activeFloorIdx) return fl;
      return {
        ...fl,
        rooms: fl.rooms.map(r => {
          if (r.room_id !== selectedRoom.room_id) return r;
          const w = Number(editRoomW) || r.width;
          const l = Number(editRoomL) || r.length;
          return {
            ...r,
            name: editRoomName || r.name,
            width: w,
            length: l,
            area: w * l
          };
        })
      };
    });

    const updatedRoom = {
      ...selectedRoom,
      name: editRoomName || selectedRoom.name,
      width: Number(editRoomW) || selectedRoom.width,
      length: Number(editRoomL) || selectedRoom.length,
      area: (Number(editRoomW) || selectedRoom.width) * (Number(editRoomL) || selectedRoom.length)
    };

    setResult({ ...result, floors: updatedFloors });
    setSelectedRoom(updatedRoom);
    setIsEditingRoom(false);
  };

  const handleRemoveRoomFromLayout = (roomId) => {
    if (!result?.floors) return;
    const updatedFloors = result.floors.map(fl => {
      if (fl.floor !== activeFloorIdx) return fl;
      return {
        ...fl,
        rooms: fl.rooms.filter(r => r.room_id !== roomId)
      };
    });
    setResult({ ...result, floors: updatedFloors });
    setSelectedRoom(null);
  };

  // Target project display name for Apply Modal
  const targetProjectName = selectedProjectId === 'current'
    ? (state.projectName || 'Active Estimate Project')
    : (savedProjects.find(p => p.id === selectedProjectId)?.name || 'Active Workspace Project');

  const activeFloor = result?.floors?.find(f => f.floor === activeFloorIdx) || result?.floors?.[0];

  return (
    <div className="space-y-4 pb-16 animate-fadeIn text-slate-800">

      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">AI Floor Plan Studio</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                  Buildiqo Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                AI-assisted residential floor planning & deterministic spatial zoning
              </p>
            </div>
          </div>
        </div>

        {/* Top Header Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setResult(null);
              setSelectedRoom(null);
              setError(null);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center space-x-1.5 transition-all"
            id="btn-new-floorplan"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            <span>New Floor Plan</span>
          </button>

          <button
            onClick={() => setIsSavedDrawerOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center space-x-1.5 transition-all"
            id="btn-saved-plans"
          >
            <FolderKanban className="w-3.5 h-3.5 text-blue-600" />
            <span>Saved Plans ({savedList.length})</span>
          </button>

          <button
            onClick={() => setIsRecentDrawerOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center space-x-1.5 transition-all"
            id="btn-recent-plans"
          >
            <Clock className="w-3.5 h-3.5 text-slate-600" />
            <span>Recent ({recentList.length})</span>
          </button>

          <button
            onClick={() => { setIsCadModalOpen(true); setCadError(null); }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center space-x-1.5 transition-all shadow-sm"
            id="btn-import-cad"
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import CAD Plan</span>
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {applySuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{applySuccessMsg}</span>
          </div>
          <button
            onClick={() => setRoute('planner')}
            className="px-3 py-1 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 text-xs font-extrabold flex items-center space-x-1"
          >
            <span>Open Step 2 Spaces</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900 font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Studio 3-Column Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* ========================================== */}
        {/* COLUMN 1: LEFT CONFIGURATION PANEL (4 Cols) */}
        {/* ========================================== */}
        <div className="lg:col-span-4 space-y-4">

          {/* Project & Scope Association */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                <span>Project Association</span>
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                {selectedProjectId === 'standalone' ? 'Unlinked Studio' : 'Linked Project'}
              </span>
            </div>

            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="standalone">Standalone Studio (Independent Session)</option>
              {state.projectName && (
                <option value="current">Current Estimate: {state.projectName}</option>
              )}
              {savedProjects.map(p => (
                <option key={p.id} value={p.id}>
                  Saved: {p.name} ({p.city || 'Project'})
                </option>
              ))}
            </select>
          </div>

          {/* Plot & Site Parameters */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5 pb-2 border-b border-slate-100">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Plot & Site Geometry</span>
            </h2>

            {/* Plot Dimensions */}
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] font-extrabold text-slate-500 block mb-1">Width (ft)</label>
                <input
                  type="number"
                  value={plotWidth}
                  onChange={(e) => setPlotWidth(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  min="15"
                  max="200"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 block mb-1">Length (ft)</label>
                <input
                  type="number"
                  value={plotLength}
                  onChange={(e) => setPlotLength(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  min="20"
                  max="300"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 block mb-1">Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 font-bold bg-slate-50 focus:outline-none"
                >
                  <option value="ft">Feet (ft)</option>
                  <option value="m" disabled>Meters (m)</option>
                </select>
              </div>
            </div>

            <div className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl flex items-center justify-between">
              <span>Gross Plot Area:</span>
              <span className="font-extrabold text-slate-800">
                {(Number(plotWidth) || 0) * (Number(plotLength) || 0)} sq.ft
              </span>
            </div>

            {/* Site Constraints */}
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] font-extrabold text-slate-500 block mb-1">Facing</label>
                <select
                  value={facing}
                  onChange={(e) => setFacing(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="east">East</option>
                  <option value="north">North</option>
                  <option value="west">West</option>
                  <option value="south">South</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 block mb-1">Setback (ft)</label>
                <input
                  type="number"
                  value={setback}
                  onChange={(e) => setSetback(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  min="0"
                  max="15"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 block mb-1">Floors</label>
                <select
                  value={numFloors}
                  onChange={(e) => setNumFloors(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value={1}>1 (Ground)</option>
                  <option value={2}>2 (G + 1)</option>
                  <option value={3}>3 (G + 2)</option>
                  <option value={4}>4 (G + 3)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Room Requirements / Spatial Program */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Room Program Requirements</span>
              </h2>
              <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                {roomList.reduce((acc, r) => acc + r.count, 0)} Total
              </span>
            </div>

            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {roomList.map((room) => {
                const opt = AVAILABLE_ROOM_OPTIONS.find(o => o.type === room.type) || { name: room.type, category: 'Room' };
                return (
                  <div
                    key={room.type}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs hover:border-slate-200 transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-800 block">{opt.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{opt.category}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateRoomCount(room.type, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-extrabold text-slate-900">{room.count}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateRoomCount(room.type, 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Add Room Selector */}
            <div className="pt-1">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddRoomType(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full text-xs font-bold py-2 px-3 rounded-xl border border-dashed border-slate-300 bg-white text-slate-600 hover:border-blue-600 cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled>+ Add Room to Program...</option>
                {AVAILABLE_ROOM_OPTIONS.filter(opt => !roomList.some(r => r.type === opt.type)).map(opt => (
                  <option key={opt.type} value={opt.type}>
                    + {opt.name} ({opt.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preferences & Architecture Style */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5 pb-2 border-b border-slate-100">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>Design Preferences</span>
            </h2>

            <div className="space-y-2.5">
              {/* Vastu Toggle */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Vastu Shastra Zoning</span>
                  <span className="text-[10px] text-slate-400">Align pooja NE, kitchen SE, master SW</span>
                </div>
                <button
                  type="button"
                  onClick={() => setVastuCompliant(!vastuCompliant)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                    vastuCompliant
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-white text-slate-500 border-slate-200'
                  }`}
                >
                  {vastuCompliant ? '✓ Active' : 'Off'}
                </button>
              </div>

              {/* Budget Tier & Style */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 block mb-1">Budget Tier</label>
                  <select
                    value={budgetTier}
                    onChange={(e) => setBudgetTier(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 font-bold focus:outline-none"
                  >
                    <option value="economy">Economy</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 block mb-1">Layout Style</label>
                  <select
                    value={stylePreference}
                    onChange={(e) => setStylePreference(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 font-bold focus:outline-none"
                  >
                    <option value="contemporary">Contemporary</option>
                    <option value="traditional">Traditional</option>
                    <option value="minimalist">Minimalist</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Primary Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md flex items-center justify-center space-x-2 transition-all mt-3 ${
                loading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-slate-900 shadow-blue-500/20 active:scale-[0.99]'
              }`}
              id="btn-generate-floorplan"
            >
              <Sparkles className={`w-4 h-4 text-amber-200 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Synthesizing Architecture...' : 'Generate Floor Plan'}</span>
            </button>
          </div>

        </div>

        {/* ========================================== */}
        {/* COLUMN 2: CENTER MAIN CANVAS (5 Cols)      */}
        {/* ========================================== */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3 min-h-[580px] flex flex-col justify-between">

            {/* Canvas Header & Floor Selector */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
                {result?.floors && result.floors.length > 0 ? (
                  result.floors.map((fl) => (
                    <button
                      key={fl.floor}
                      onClick={() => setActiveFloorIdx(fl.floor)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                        activeFloorIdx === fl.floor
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {fl.name}
                    </button>
                  ))
                ) : (
                  <span className="px-3 py-1 text-xs font-bold text-slate-500">
                    Ground Floor Preview
                  </span>
                )}
              </div>

              {/* Facing Compass Indicator */}
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700">
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                <span>Road: {facing.toUpperCase()}</span>
              </div>
            </div>

            {/* Interactive SVG Canvas Display */}
            <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200/80 p-3 flex flex-col items-center justify-center relative overflow-hidden min-h-[420px]">
              {loading ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-700 animate-pulse">
                    {loadingStage || 'Generating floor plan...'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Applying Vastu orientation and circulation graph
                  </p>
                </div>
              ) : result?.svg ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div
                    className="w-full max-h-[440px] flex items-center justify-center select-none"
                    dangerouslySetInnerHTML={{ __html: result.svg }}
                  />
                  <div className="mt-2 text-[10px] font-bold text-slate-400 flex items-center space-x-1">
                    <Info className="w-3 h-3 text-blue-500" />
                    <span>Click any room on the right panel to inspect or adjust dimensions</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400 space-y-2">
                  <Maximize2 className="w-10 h-10 mx-auto opacity-30 text-blue-500" />
                  <p className="text-xs font-bold text-slate-600">
                    No Floor Plan Generated Yet
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Select plot width, length, and room requirements on the left, then click "Generate Floor Plan".
                  </p>
                </div>
              )}
            </div>

            {/* Subtle Architectural Disclaimer */}
            <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-[10px] text-slate-500 leading-relaxed flex items-start space-x-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Notice:</strong> AI-generated conceptual floor plan. Review dimensions, access, local regulations, and structural requirements with a qualified professional before construction.
              </span>
            </div>

          </div>
        </div>

        {/* ========================================== */}
        {/* COLUMN 3: RIGHT INFORMATION PANEL (3 Cols) */}
        {/* ========================================== */}
        <div className="lg:col-span-3 space-y-4">

          {/* Selected Room Inspector Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Selected Space</span>
              </span>
              {selectedRoom && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700">
                  {selectedRoom.type}
                </span>
              )}
            </div>

            {selectedRoom ? (
              <div className="space-y-3">
                {isEditingRoom ? (
                  /* Edit Room Form */
                  <div className="space-y-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-500 block mb-0.5">Room Label</label>
                      <input
                        type="text"
                        value={editRoomName}
                        onChange={(e) => setEditRoomName(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 font-bold focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-extrabold text-slate-500 block mb-0.5">Width (ft)</label>
                        <input
                          type="number"
                          value={editRoomW}
                          onChange={(e) => setEditRoomW(e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 font-bold focus:outline-none"
                          min="4"
                          max="50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold text-slate-500 block mb-0.5">Length (ft)</label>
                        <input
                          type="number"
                          value={editRoomL}
                          onChange={(e) => setEditRoomL(e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 font-bold focus:outline-none"
                          min="4"
                          max="50"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-1.5 pt-1">
                      <button
                        onClick={handleSaveRoomEdit}
                        className="flex-1 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center space-x-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={() => setIsEditingRoom(false)}
                        className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-200 text-slate-700 hover:bg-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Room Details Display */
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{selectedRoom.name}</h3>
                      <div className="flex items-center space-x-2 text-xs text-slate-600 mt-0.5 font-bold">
                        <span>{selectedRoom.width} × {selectedRoom.length} ft</span>
                        <span>•</span>
                        <span className="text-blue-700 font-extrabold">{selectedRoom.area || (selectedRoom.width * selectedRoom.length)} sq.ft</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">Zone Category</span>
                        <span className="font-bold text-slate-800">
                          {AVAILABLE_ROOM_OPTIONS.find(o => o.type === selectedRoom.type)?.category || 'Space'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">Assigned Floor</span>
                        <span className="font-bold text-slate-800">
                          {activeFloor?.name || `Floor ${activeFloorIdx}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">Solver Status</span>
                        <span className="font-bold text-emerald-700">Validated</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">Confidence</span>
                        <span className="font-bold text-blue-700">Deterministic</span>
                      </div>
                    </div>

                    {/* Room Actions */}
                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setIsEditingRoom(true)}
                        className="flex-1 py-1.5 px-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center space-x-1 transition-colors"
                      >
                        <Edit3 className="w-3 h-3 text-slate-600" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleRemoveRoomFromLayout(selectedRoom.room_id)}
                        className="py-1.5 px-2 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 flex items-center justify-center space-x-1 transition-colors"
                        title="Remove room from layout"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs font-medium">
                Click a room below or generate a plan to inspect space details.
              </div>
            )}
          </div>

          {/* Current Floor Room Directory */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                {activeFloor?.name || 'Floor'} Spaces
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                {activeFloor?.rooms?.length || 0} Rooms
              </span>
            </div>

            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {activeFloor?.rooms?.map((rm) => {
                const isSelected = selectedRoom?.room_id === rm.room_id;
                return (
                  <button
                    key={rm.room_id}
                    onClick={() => setSelectedRoom(rm)}
                    className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-blue-50 border border-blue-200 text-blue-900 font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-transparent'
                    }`}
                  >
                    <div>
                      <span className="block truncate font-extrabold">{rm.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {rm.width} × {rm.length} ft
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-600">
                      {rm.area || (rm.width * rm.length)} sq.ft
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Layout Vastu & Zoning Warnings */}
          {result?.warnings && result.warnings.length > 0 && (
            <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-200 space-y-1.5 text-xs text-amber-900 shadow-sm">
              <span className="font-extrabold flex items-center space-x-1.5 text-amber-950">
                <Info className="w-3.5 h-3.5 text-amber-700" />
                <span>Zoning & Advisory Notes</span>
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                {result.warnings.map((w, idx) => (
                  <li key={idx}>{w.message}</li>
                ))}
              </ul>
            </div>
          )}

        </div>

      </div>

      {/* ========================================== */}
      {/* BOTTOM ACTION BAR                           */}
      {/* ========================================== */}
      <div className="sticky bottom-3 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Regenerate (Triggers A/B candidate) */}
          <button
            onClick={handleInitiateRegenerate}
            disabled={!result || loading}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center space-x-1.5 transition-all disabled:opacity-50"
            id="btn-bottom-regenerate"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>

          {/* Refine Layout */}
          <button
            onClick={() => setIsRefineOpen(true)}
            disabled={!result || refining}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center space-x-1.5 transition-all disabled:opacity-50"
            id="btn-bottom-refine"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Refine Layout</span>
          </button>

          {/* Download DXF */}
          <button
            onClick={handleDownloadDxf}
            disabled={!result}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center space-x-1.5 transition-all disabled:opacity-50"
            id="btn-bottom-dxf"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Download DXF</span>
          </button>

          {/* Export SVG */}
          <button
            onClick={handleExportSvg}
            disabled={!result?.svg}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center space-x-1.5 transition-all disabled:opacity-50"
            id="btn-bottom-svg"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export SVG</span>
          </button>

          {/* Save Plan */}
          <button
            onClick={() => setIsSaveModalOpen(true)}
            disabled={!result}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center space-x-1.5 transition-all disabled:opacity-50"
            id="btn-bottom-save"
          >
            <Save className="w-3.5 h-3.5 text-emerald-600" />
            <span>Save Floor Plan</span>
          </button>
        </div>

        {/* Primary Action: Apply to Project */}
        <div>
          <button
            onClick={() => setIsApplyModalOpen(true)}
            disabled={!result}
            className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-slate-900 text-white flex items-center space-x-2 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 active:scale-[0.99]"
            id="btn-bottom-apply"
          >
            <span>Apply to Project</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-200" />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: A/B REGENERATE CANDIDATE COMPARISON             */}
      {/* ======================================================== */}
      {isCompareModalOpen && candidateResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">Compare Layout Candidates</h3>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              A new valid deterministic layout candidate was generated with identical plot and room constraints. Compare and choose which arrangement you want to retain.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Current Approved Layout */}
              <div className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-700">Current Layout</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">Active</span>
                </div>
                <div
                  className="w-full h-56 bg-white rounded-xl border border-slate-200 p-2 flex items-center justify-center overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: result?.svg || '' }}
                />
                <div className="text-[11px] font-bold text-slate-600 flex justify-between pt-1">
                  <span>Floors: {result?.floors?.length || 1}</span>
                  <span>Rooms: {result?.floors?.[0]?.rooms?.length || 0}</span>
                </div>
                <button
                  onClick={() => setIsCompareModalOpen(false)}
                  className="w-full py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 border border-slate-300 text-slate-800"
                >
                  Keep Current Layout
                </button>
              </div>

              {/* Right: New Generated Candidate */}
              <div className="p-4 rounded-2xl border-2 border-blue-500 bg-blue-50/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-blue-800">New Generated Layout</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white">Candidate</span>
                </div>
                <div
                  className="w-full h-56 bg-white rounded-xl border border-blue-200 p-2 flex items-center justify-center overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: candidateResult?.svg || '' }}
                />
                <div className="text-[11px] font-bold text-blue-900 flex justify-between pt-1">
                  <span>Floors: {candidateResult?.floors?.length || 1}</span>
                  <span>Rooms: {candidateResult?.floors?.[0]?.rooms?.length || 0}</span>
                </div>
                <button
                  onClick={handleApplyCandidate}
                  className="w-full py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-slate-900 text-white shadow-sm flex items-center justify-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-amber-200" />
                  <span>Use New Layout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: NATURAL LANGUAGE REFINE DRAWER                  */}
      {/* ======================================================== */}
      {isRefineOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">Refine Layout with AI</h3>
              </div>
              <button
                onClick={() => setIsRefineOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Instruct the AI architectural assistant in plain English. The LLM translates your intent into deterministic geometric constraints while preserving structural feasibility.
            </p>

            <div className="space-y-2">
              <input
                type="text"
                value={refinementText}
                onChange={(e) => setRefinementText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                placeholder='e.g. "Move the kitchen closer to dining room"'
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600"
                disabled={refining}
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  'Move kitchen closer to dining',
                  'Make master bedroom larger',
                  'Place pooja room in northeast',
                  'Widen entrance foyer'
                ].map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setRefinementText(sug);
                      handleRefine(sug);
                    }}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200"
                  >
                    "{sug}"
                  </button>
                ))}
              </div>
            </div>

            {refinementClarification && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <span className="font-bold">{refinementClarification.question}</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {refinementClarification.suggestions?.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleRefine(s)}
                      className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-bold text-[10px]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsRefineOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRefine()}
                disabled={refining || !refinementText.trim()}
                className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${refining ? 'animate-spin' : ''}`} />
                <span>{refining ? 'Applying Refinement...' : 'Apply Refinement'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: CAD / DXF / DWG IMPORT MODAL                    */}
      {/* ======================================================== */}
      {isCadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileCode className="w-5 h-5 text-cyan-600" />
                <h3 className="text-base font-black text-slate-900">Import CAD Floor Plan</h3>
              </div>
              <button
                onClick={() => setIsCadModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Upload an AutoCAD <strong>.dxf</strong> or <strong>.dwg</strong> architectural plan. Buildiqo AI parses layer polylines and room boundaries into the studio.
            </p>

            {cadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold">
                {cadError}
              </div>
            )}

            {!cadExtractResult ? (
              <div className="space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-cyan-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 hover:bg-cyan-50/30 transition-colors"
                >
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <span className="text-xs font-bold text-slate-700 block">
                    {cadFile ? cadFile.name : 'Click to select DXF or DWG file'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Up to 25 MB • Standard architectural layers
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".dxf,.dwg"
                    onChange={handleCadFileSelect}
                    className="hidden"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    onClick={() => setIsCadModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRunCadExtraction}
                    disabled={!cadFile || cadExtracting}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 text-white flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <FileCode className={`w-3.5 h-3.5 text-cyan-400 ${cadExtracting ? 'animate-spin' : ''}`} />
                    <span>{cadExtracting ? 'Extracting Vector Rooms...' : 'Parse CAD Plan'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
                    <span>Detected {cadExtractResult.rooms?.length || 0} Rooms</span>
                    <span className="text-cyan-700 font-black">{cadExtractResult.total_usable_carpet_sqft || 0} sq.ft</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {cadExtractResult.rooms?.map((r, i) => (
                      <div key={i} className="flex justify-between text-[11px] p-1.5 bg-white rounded-lg border border-slate-100">
                        <span className="font-semibold text-slate-700">{r.name}</span>
                        <span className="font-bold text-slate-900">{r.width} × {r.length} ft</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    onClick={() => setCadExtractResult(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleApplyCadToStudio}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-cyan-700 hover:bg-cyan-800 text-white flex items-center space-x-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-amber-200" />
                    <span>Apply Rooms to Studio</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: APPLY TO PROJECT CONFIRMATION MODAL             */}
      {/* ======================================================== */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">Apply to Project</h3>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">Target Project</span>
              <p className="text-sm font-extrabold text-slate-900">
                "{targetProjectName}"
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                This will map the generated room geometry across all floors into the project's <strong>Step 2 Spaces & Layout</strong> schedule, updating carpet area and cost estimates.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApplyToProject}
                className="px-5 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-slate-900 text-white flex items-center space-x-1.5 shadow-md shadow-blue-500/20"
                id="btn-confirm-apply-project"
              >
                <Check className="w-3.5 h-3.5 text-amber-200" />
                <span>Confirm & Apply to Project</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: SAVE FLOOR PLAN MODAL                           */}
      {/* ======================================================== */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Save className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Save Floor Plan</h3>
              </div>
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Plan Title</label>
                <input
                  type="text"
                  value={savePlanName}
                  onChange={(e) => setSavePlanName(e.target.value)}
                  placeholder={`${plotWidth}×${plotLength} ft ${facing.toUpperCase()} Residential Layout`}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Plot Size:</span>
                  <span className="font-bold text-slate-800">{plotWidth} × {plotLength} ft</span>
                </div>
                <div className="flex justify-between">
                  <span>Floors:</span>
                  <span className="font-bold text-slate-800">{result?.floors?.length || numFloors}</span>
                </div>
                <div className="flex justify-between">
                  <span>Linked To:</span>
                  <span className="font-bold text-slate-800">{targetProjectName}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlan}
                className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 shadow-sm"
              >
                <Check className="w-3.5 h-3.5 text-amber-200" />
                <span>Save to Library</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER / MODAL 6: RECENT PLANS (History)                 */}
      {/* ======================================================== */}
      {isRecentDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-slate-600" />
                <h3 className="text-base font-black text-slate-900">Recent Plans History</h3>
              </div>
              <button
                onClick={() => setIsRecentDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {recentList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No recent plans recorded in this browser session.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {recentList.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{entry.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {entry.floorsCount} Floors • {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setResult(entry.plan);
                        setActiveFloorIdx(0);
                        setIsRecentDrawerOpen(false);
                      }}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-slate-900"
                    >
                      Open
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER / MODAL 7: SAVED PLANS LIBRARY                   */}
      {/* ======================================================== */}
      {isSavedDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FolderKanban className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">Saved Plans Library</h3>
              </div>
              <button
                onClick={() => setIsSavedDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {savedList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No saved plans yet. Generate a layout and click "Save Floor Plan" to store it here.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {savedList.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{entry.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {entry.floorsCount} Floors • {entry.totalCarpetSqft ? `${entry.totalCarpetSqft} sq.ft • ` : ''}{entry.projectName}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => {
                          setResult(entry.plan);
                          setActiveFloorIdx(0);
                          setIsSavedDrawerOpen(false);
                        }}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-slate-900"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => {
                          deleteSavedFloorplan(entry.id);
                          setSavedList(getSavedFloorplans());
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete saved plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default FloorPlanStudioPage;
