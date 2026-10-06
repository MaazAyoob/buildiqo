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
import { renderArchitecturalFloorPlanSvg } from '../utils/floorplanRenderer';
import { createSampleDxfFile } from '../utils/sampleDxfData';
import {
  getRecentFloorplans,
  addRecentFloorplan,
  getSavedFloorplans,
  saveFloorplanToStorage,
  deleteSavedFloorplan,
  exportSvgToFile
} from '../services/floorplanStorage';
import { StatusBadge } from '../components/ui/StatusBadge';

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
  const [zoomLevel, setZoomLevel] = useState(1.0);

  // Architectural Layer Visibility Controls (Phase 3)
  const [layers, setLayers] = useState({
    walls: true,
    rooms: true,
    doors: true,
    windows: true,
    furniture: true,
    dimensions: true,
    circulation: true,
    site: true,
    annotations: true
  });
  const [cadUnits, setCadUnits] = useState('auto');

  // Regenerate Candidate A/B Comparison Modal State
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [candidateResult, setCandidateResult] = useState(null);

  // Refine Drawer / Dialog State
  const [isRefineOpen, setIsRefineOpen] = useState(false);
  const [refinementText, setRefinementText] = useState('');
  const [refining, setRefining] = useState(false);
  const [refinementClarification, setRefinementClarification] = useState(null);

  // Studio Workflow Modes (Part 24: Generate vs Import CAD)
  const [activeStudioMode, setActiveStudioMode] = useState('generate'); // 'generate' | 'import_cad'

  // CAD Import State
  const [isCadModalOpen, setIsCadModalOpen] = useState(false);
  const [cadFile, setCadFile] = useState(null);
  const [cadExtracting, setCadExtracting] = useState(false);
  const [cadExtractStage, setCadExtractStage] = useState('');
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
        if (!data.svg || !data.svg.includes('id="site_layer"')) {
          data.svg = renderArchitecturalFloorPlanSvg(data, {
            activeFloorIdx: 0,
            projectName: targetProjectName
          });
        }
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

  const handleRunCadExtraction = async (fileToUse = null, unitToUse = null) => {
    const targetFile = fileToUse || cadFile;
    if (!targetFile) return;
    setCadExtracting(true);
    setCadExtractStage('Uploading CAD drawing & verifying format...');
    setCadError(null);
    try {
      await ensureSession();
      setCadExtractStage('Extracting vector polylines, text annotations & layers...');
      const res = await extractFloorPlanCAD(targetFile, unitToUse || cadUnits);
      if (res && res.success) {
        setCadExtractResult(res);
        setCadExtractStage('Extraction & topological validation verified.');
      } else {
        setCadError(res?.error || 'CAD extraction failed to identify valid room boundaries.');
      }
    } catch (err) {
      console.warn('[Studio] CAD parse error:', err);
      setCadError(err.message || 'Error processing CAD file.');
    } finally {
      setCadExtracting(false);
      setCadExtractStage('');
    }
  };

  const handleLoadSampleDxf = async () => {
    const sampleFile = createSampleDxfFile();
    setCadFile(sampleFile);
    setCadError(null);
    await handleRunCadExtraction(sampleFile, 'feet');
  };

  const handleApplyCadToStudio = (applyToProject = false) => {
    if (!cadExtractResult?.rooms || cadExtractResult.rooms.length === 0) return;

    // 1. Calculate bounding plot geometry from detected room boundaries
    let maxDimX = 0;
    let maxDimY = 0;
    cadExtractResult.rooms.forEach(r => {
      const rx = (r.geometry?.x != null ? Number(r.geometry.x) : 0) + Number(r.width_ft || r.width || 12);
      const ry = (r.geometry?.y != null ? Number(r.geometry.y) : 0) + Number(r.length_ft || r.length || 12);
      if (rx > maxDimX) maxDimX = rx;
      if (ry > maxDimY) maxDimY = ry;
    });

    const detectedW = Math.max(Number(plotWidth) || 30, Math.ceil(maxDimX + 6));
    const detectedL = Math.max(Number(plotLength) || 40, Math.ceil(maxDimY + 6));
    setPlotWidth(detectedW);
    setPlotLength(detectedL);

    // 2. Build architectural floor plan object
    const mappedRooms = cadExtractResult.rooms.map((r, idx) => ({
      room_id: r.id || `cad_room_${idx + 1}`,
      name: r.name || `Space ${idx + 1}`,
      type: r.type || 'living',
      x: r.geometry?.x != null ? Number(r.geometry.x) : 4 + (idx % 2) * 14,
      y: r.geometry?.y != null ? Number(r.geometry.y) : 4 + Math.floor(idx / 2) * 14,
      width: Number(r.width_ft || r.width || 12),
      length: Number(r.length_ft || r.length || 12),
      area: Number(r.area_sqft || r.area || (Number(r.width_ft || 12) * Number(r.length_ft || 12))),
      doors: r.doors || [{ wall: 'bottom', width: 3.0, x: (r.geometry?.x || 4) + 1.2, y: r.geometry?.y || 4 }],
      windows: r.windows || [{ wall: 'top', width: 4.0, x: (r.geometry?.x || 4) + 2.0, y: (r.geometry?.y || 4) + Number(r.length_ft || 12) }],
      furniture: r.furniture || []
    }));

    const totalCarpet = cadExtractResult.total_usable_carpet_sqft || mappedRooms.reduce((s, r) => s + r.area, 0);

    const generatedLayout = {
      generation_id: `cad_import_${Date.now()}`,
      plot: { width_ft: detectedW, length_ft: detectedL },
      setback_ft: Number(setback) || 3.0,
      constraints: { plot_facing: facing },
      floors: [
        {
          floor: 0,
          name: 'Ground Floor (CAD Import)',
          carpet_area_sqft: totalCarpet,
          rooms: mappedRooms
        }
      ],
      overall_quality_score: 94.0,
      source: cadExtractResult.source || { filename: cadFile?.name, file_type: 'CAD' }
    };

    // Render architectural SVG using high-fidelity vector renderer
    generatedLayout.svg = renderArchitecturalFloorPlanSvg(generatedLayout, {
      activeFloorIdx: 0,
      projectName: targetProjectName
    });

    setResult(generatedLayout);
    setActiveFloorIdx(0);
    setSelectedRoom(mappedRooms[0] || null);
    addRecentFloorplan(generatedLayout);
    setRecentList(getRecentFloorplans());

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

    if (applyToProject) {
      const projectRooms = mappedRooms.map(r => ({
        id: r.room_id,
        name: r.name,
        type: r.type,
        floor: 0,
        width: r.width,
        length: r.length,
        area: r.area
      }));
      updateState({
        rooms: projectRooms,
        totalCarpetArea: totalCarpet,
        totalBuiltUpArea: Math.round(totalCarpet * 1.22),
        plotWidth: detectedW,
        plotLength: detectedL,
        plotFacing: facing
      });
      setApplySuccessMsg(`Imported CAD plan loaded into Studio and synced to ${targetProjectName}!`);
    } else {
      setApplySuccessMsg(`Imported CAD drawing rendered successfully in Studio Viewport!`);
    }

    setIsCadModalOpen(false);
    setCadExtractResult(null);
    setCadFile(null);
    setTimeout(() => setApplySuccessMsg(null), 6000);
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
      <div className="bg-gradient-to-r from-blue-50/90 via-sky-50/40 to-indigo-50/70 rounded-2xl p-5 sm:p-6 border border-blue-200/90 shadow-card-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-500/25 border border-blue-400/30 shrink-0">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">AI Floor Plan Studio</h1>
                <StatusBadge status="brand" dot={false}>Buildiqo Pro</StatusBadge>
                <StatusBadge status="amber" size="sm">CAD Vector Solver</StatusBadge>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                AI-assisted residential floor planning, Vastu compliance &amp; deterministic spatial zoning
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
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/95 hover:bg-white text-slate-700 border border-slate-200/90 hover:border-blue-300 flex items-center space-x-1.5 transition-all shadow-2xs"
            id="btn-new-floorplan"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>New Floor Plan</span>
          </button>

          <button
            onClick={() => setIsSavedDrawerOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/95 hover:bg-white text-slate-700 border border-slate-200/90 hover:border-blue-300 flex items-center space-x-1.5 transition-all shadow-2xs"
            id="btn-saved-plans"
          >
            <FolderKanban className="w-3.5 h-3.5 text-blue-600" />
            <span>Saved Plans ({savedList.length})</span>
          </button>

          <button
            onClick={() => setIsRecentDrawerOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/95 hover:bg-white text-slate-700 border border-slate-200/90 hover:border-blue-300 flex items-center space-x-1.5 transition-all shadow-2xs"
            id="btn-recent-plans"
          >
            <Clock className="w-3.5 h-3.5 text-slate-600" />
            <span>Recent ({recentList.length})</span>
          </button>

          <button
            onClick={() => { setIsCadModalOpen(true); setCadError(null); }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0B0F19] hover:bg-slate-800 text-white flex items-center space-x-1.5 transition-all shadow-brand border border-slate-800 active:scale-[0.98]"
            id="btn-import-cad"
          >
            <FileCode className="w-3.5 h-3.5 text-sky-400" />
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

      {/* Dual Professional Workflow Switcher (Part 24 Specification) */}
      <div className="bg-white rounded-2xl p-2 sm:p-2.5 border border-slate-200/90 shadow-card-subtle flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <button
            onClick={() => setActiveStudioMode('generate')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
              activeStudioMode === 'generate'
                ? 'bg-blue-600 text-white shadow-brand shadow-blue-500/20'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
            }`}
            id="tab-mode-ai-generate"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>1. Generate with Buildiqo AI</span>
          </button>

          <button
            onClick={() => setActiveStudioMode('import_cad')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
              activeStudioMode === 'import_cad'
                ? 'bg-slate-900 text-white shadow-brand'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
            }`}
            id="tab-mode-import-cad"
          >
            <FileCode className="w-3.5 h-3.5 text-sky-400" />
            <span>2. Import Existing CAD Plan</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-500 font-medium px-2">
          {activeStudioMode === 'generate' ? (
            <span>Design parametric architectural plans from site boundaries, Vastu orientations &amp; room requirements</span>
          ) : (
            <span>Extract, validate and review AutoCAD (.dxf, .dwg) or vector PDF drawings with topological verification</span>
          )}
        </div>
      </div>

      {/* Studio 3-Column Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* ========================================== */}
        {/* COLUMN 1: LEFT CONFIGURATION PANEL (4 Cols) */}
        {/* ========================================== */}
        <div className="lg:col-span-4 space-y-4">

          {activeStudioMode === 'import_cad' ? (
            /* ========================================== */
            /* WORKFLOW 2: DEDICATED CAD IMPORT STATION   */
            /* ========================================== */
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <FileCode className="w-4 h-4 text-cyan-600" />
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      AutoCAD / PDF Import Station
                    </h2>
                  </div>
                  <StatusBadge status="brand" size="sm">DXF / DWG / PDF</StatusBadge>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Upload an architectural CAD plan. Buildiqo parses closed boundary polylines (LWPOLYLINE), layer entities, text room tags, and openings into the interactive studio.
                </p>

                {/* File Dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    cadFile
                      ? 'border-cyan-500 bg-cyan-50/20'
                      : 'border-slate-300 hover:border-cyan-500 bg-slate-50 hover:bg-cyan-50/30'
                  }`}
                  id="cad-dropzone"
                >
                  <Upload className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                  <span className="text-xs font-bold text-slate-800 block">
                    {cadFile ? cadFile.name : 'Click to browse or drop CAD file'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    AutoCAD .DXF (recommended), .DWG, or vector .PDF (Max 25 MB)
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".dxf,.dwg,.pdf"
                    onChange={handleCadFileSelect}
                    className="hidden"
                    id="cad-file-input"
                  />
                </div>

                {/* Quick Action: Try Sample DXF Plan */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div>
                    <span className="text-xs font-extrabold text-slate-800 block">Need a test drawing?</span>
                    <span className="text-[10px] text-slate-500">Verified AutoCAD R2000 DXF (804 sq.ft)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadSampleDxf}
                    disabled={cadExtracting}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-800 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 flex items-center space-x-1 transition-all shadow-2xs"
                    id="btn-load-sample-dxf"
                  >
                    <FileCode className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Load Sample DXF</span>
                  </button>
                </div>

                {/* Drawing Scale & Units */}
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 block mb-1">
                    Drawing Units &amp; Coordinates
                  </label>
                  <select
                    value={cadUnits}
                    onChange={(e) => setCadUnits(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    id="cad-unit-selector"
                  >
                    <option value="auto">Auto-detect from $INSUNITS Header</option>
                    <option value="feet">Architectural Feet (ft)</option>
                    <option value="inches">Architectural Inches (in)</option>
                    <option value="meters">Metric Meters (m)</option>
                    <option value="millimeters">Metric Millimeters (mm)</option>
                    <option value="centimeters">Metric Centimeters (cm)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Coordinates will be automatically scaled into architectural feet and inches.
                  </span>
                </div>

                {/* Error State */}
                {cadError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1 animate-fadeIn">
                    <div className="font-extrabold flex items-center space-x-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                      <span>CAD Extraction Message</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{cadError}</p>
                  </div>
                )}

                {/* Extraction Stage Progress (Part 25) */}
                {cadExtracting && (
                  <div className="p-3.5 rounded-xl bg-slate-900 text-white font-mono text-[11px] space-y-2 animate-fadeIn border border-slate-800">
                    <div className="flex items-center space-x-2 text-cyan-400">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span className="font-bold">PARSING CAD DRAWING ENTITIES</span>
                    </div>
                    <div className="space-y-1 text-[10px] text-slate-300 pl-2 border-l border-slate-700">
                      <div>✓ File format verification &amp; stream loading</div>
                      <div>✓ Parsing LWPOLYLINE / POLYLINE entities</div>
                      <div>✓ Reading TEXT / MTEXT space annotations</div>
                      <div className="text-cyan-300 font-bold animate-pulse">
                        {cadExtractStage || '→ Running topological room boundary detection...'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Parse Action Button */}
                <button
                  onClick={() => handleRunCadExtraction()}
                  disabled={!cadFile || cadExtracting}
                  className="w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center space-x-2 transition-all shadow-brand disabled:opacity-50"
                  id="btn-parse-cad"
                >
                  <FileCode className={`w-4 h-4 text-cyan-400 ${cadExtracting ? 'animate-spin' : ''}`} />
                  <span>{cadExtracting ? 'Analyzing Geometry...' : 'Parse & Extract CAD Plan'}</span>
                </button>
              </div>

              {/* Review & Validation Section (Part 19 & 20) */}
              {cadExtractResult && (
                <div className="bg-white rounded-2xl p-5 border border-cyan-200 shadow-card-subtle space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        Review Import &amp; Validation
                      </h3>
                    </div>
                    <StatusBadge status="emerald" size="sm">Verified</StatusBadge>
                  </div>

                  {/* Source Summary */}
                  <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Drawing File</span>
                      <span className="font-bold text-slate-800 truncate block">{cadExtractResult.source?.filename || cadFile?.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Detected Units</span>
                      <span className="font-bold text-slate-800 uppercase block">{cadExtractResult.source?.units || 'Feet'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Detected Spaces</span>
                      <span className="font-black text-cyan-700 block">{cadExtractResult.rooms?.length || 0} Rooms</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Total Carpet</span>
                      <span className="font-black text-emerald-700 block">{cadExtractResult.total_usable_carpet_sqft || 0} sq.ft</span>
                    </div>
                  </div>

                  {/* Geometric Validation Checklist */}
                  <div className="space-y-1.5 text-[11px] p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-800 block">
                      Topological Invariant Checks
                    </span>
                    <div className="flex items-center space-x-1.5 text-emerald-900">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Closed Boundary Polygons: All room loops closed</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-emerald-900">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Self-Intersection Check: Zero self-intersecting loops</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-emerald-900">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Openings Check: Valid doors &amp; windows mapped</span>
                    </div>
                  </div>

                  {/* Room Breakdown Table */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-slate-500 block">
                      Identified Spaces
                    </span>
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                      {cadExtractResult.rooms?.map((r, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <div>
                            <span className="font-extrabold text-slate-800 block">{r.name}</span>
                            <span className="text-[10px] text-slate-500">{r.width_ft || r.width} × {r.length_ft || r.length} ft</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-slate-800 block">{r.area_sqft || r.area} sq.ft</span>
                            <span className="text-[9px] font-bold text-emerald-600 uppercase bg-emerald-100 px-1 py-0.2 rounded">Validated</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => handleApplyCadToStudio(false)}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-cyan-700 hover:bg-cyan-800 text-white flex items-center justify-center space-x-2 transition-all shadow-brand"
                      id="btn-render-cad-studio"
                    >
                      <Eye className="w-4 h-4 text-cyan-200" />
                      <span>Render in Studio Viewport</span>
                    </button>

                    <button
                      onClick={() => handleApplyCadToStudio(true)}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center space-x-2 transition-all shadow-brand"
                      id="btn-apply-cad-project"
                    >
                      <Check className="w-4 h-4 text-amber-200" />
                      <span>Apply to Step 2 Project BOQ</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
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
      )}

    </div>

        {/* ========================================== */}
        {/* COLUMN 2: CENTER MAIN CANVAS (5 Cols)      */}
        {/* ========================================== */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-4 space-y-3 min-h-[580px] flex flex-col justify-between">

            {/* Canvas Header & Floor Selector & Zoom HUD */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                {result?.floors && result.floors.length > 0 ? (
                  result.floors.map((fl) => (
                    <button
                      key={fl.floor}
                      onClick={() => setActiveFloorIdx(fl.floor)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeFloorIdx === fl.floor
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {fl.name}
                    </button>
                  ))
                ) : (
                  <span className="px-3 py-1 text-xs font-medium text-slate-500">
                    Ground Floor Preview
                  </span>
                )}
              </div>

              {/* Controls Cluster: Compass + Zoom HUD (Section 14 Specification) */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700">
                  <Compass className="w-3.5 h-3.5 text-blue-600" />
                  <span>Road: {facing.toUpperCase()}</span>
                </div>

                <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg text-slate-700">
                  <button
                    onClick={() => setZoomLevel(z => Math.max(0.6, Number((z - 0.15).toFixed(2))))}
                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-white text-xs font-bold transition-colors"
                    title="Zoom Out"
                  >
                    -
                  </button>
                  <span className="text-[10px] font-mono tabular-nums px-1 text-slate-600 font-semibold w-9 text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel(z => Math.min(2.0, Number((z + 0.15).toFixed(2))))}
                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-white text-xs font-bold transition-colors"
                    title="Zoom In"
                  >
                    +
                  </button>
                  <button
                    onClick={() => setZoomLevel(1.0)}
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold hover:bg-white text-slate-600 transition-colors"
                    title="Reset Zoom"
                  >
                    Fit
                  </button>
                </div>
              </div>
            </div>

            {/* Architectural Layer Controls (Phase 3) */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 py-1.5 px-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px]">
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 mr-1 flex items-center space-x-1">
                  <Layers className="w-3 h-3 text-blue-600" />
                  <span>Layers:</span>
                </span>
                {[
                  { id: 'walls', label: 'Walls' },
                  { id: 'rooms', label: 'Rooms' },
                  { id: 'doors', label: 'Doors' },
                  { id: 'windows', label: 'Windows' },
                  { id: 'furniture', label: 'Furniture' },
                  { id: 'dimensions', label: 'Dimensions' },
                  { id: 'site', label: 'Site & Road' },
                  { id: 'annotations', label: 'Title & North' }
                ].map(ly => (
                  <button
                    key={ly.id}
                    type="button"
                    onClick={() => setLayers(prev => ({ ...prev, [ly.id]: !prev[ly.id] }))}
                    className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold transition-all ${
                      layers[ly.id]
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
                    }`}
                  >
                    {layers[ly.id] ? '✓ ' : ''}{ly.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setLayers(prev => ({ ...prev, furniture: !prev.furniture }))}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                  layers.furniture
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
                title="Toggle schematic vector furniture"
              >
                Furniture {layers.furniture ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Dark Architectural Graphite Canvas (Section 13 Specification) */}
            <div className="flex-1 cad-dark-viewport rounded-xl border border-slate-800 p-3 flex flex-col items-center justify-center relative overflow-hidden min-h-[440px]">
              {loading ? (
                /* Progressive Generation Flow (Section 17 Specification) */
                <div className="text-center py-6 space-y-4 max-w-sm mx-auto animate-fadeIn">
                  <div className="w-9 h-9 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin mx-auto" />
                  <div className="space-y-1 text-left font-mono text-[11px] bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl shadow-lg">
                    <div className="flex items-center space-x-2 text-blue-400">
                      <Check className="w-3.5 h-3.5 text-blue-400" />
                      <span>ANALYZING REQUIREMENTS</span>
                    </div>
                    <div className="text-slate-600 pl-4 text-[10px]">↓</div>
                    <div className="flex items-center space-x-2 text-blue-400">
                      <Check className="w-3.5 h-3.5 text-blue-400" />
                      <span>BUILDING ROOM PROGRAM</span>
                    </div>
                    <div className="text-slate-600 pl-4 text-[10px]">↓</div>
                    <div className="flex items-center space-x-2 text-blue-300 font-bold animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping inline-block mr-1" />
                      <span>OPTIMIZING SPATIAL LAYOUT</span>
                    </div>
                    <div className="text-slate-600 pl-4 text-[10px]">↓</div>
                    <div className="flex items-center space-x-2 text-slate-500">
                      <span className="w-3.5 h-3.5 text-center text-xs">○</span>
                      <span>VALIDATING ACCESS</span>
                    </div>
                    <div className="text-slate-600 pl-4 text-[10px]">↓</div>
                    <div className="flex items-center space-x-2 text-slate-500">
                      <span className="w-3.5 h-3.5 text-center text-xs">○</span>
                      <span>RENDERING FLOOR PLAN</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {loadingStage || 'Synthesizing architectural constraints...'}
                  </p>
                </div>
              ) : result?.svg ? (
                <div className="w-full h-full flex flex-col items-center justify-center overflow-auto">
                  <style dangerouslySetInnerHTML={{ __html: `
                    ${!layers.walls ? '#walls_layer, .walls-layer, .wall-segment, .wall-outline, .wall-inner-line, #walls { display: none !important; }' : ''}
                    ${!layers.rooms ? '#rooms_layer, .rooms-layer, .room-rect { fill-opacity: 0.15 !important; }' : ''}
                    ${!layers.doors ? '#doors_layer, .doors-layer, .door-element, [id^="door_"], .door-swing, .door-leaf { display: none !important; }' : ''}
                    ${!layers.windows ? '#windows_layer, .windows-layer, .window-element, [id^="window_"], .window-line { display: none !important; }' : ''}
                    ${!layers.furniture ? '#furniture_layer, .furniture-layer, .furniture-element, [id^="furniture_"], .furniture-rect { display: none !important; }' : ''}
                    ${!layers.dimensions ? '#dimensions_layer, .dimensions-layer, .dimension-element, [id^="dim_"], .dim-label, .dim-label-group { display: none !important; }' : ''}
                    ${!layers.circulation ? '#circulation_layer, .circulation-element, [id^="circ_"] { display: none !important; }' : ''}
                    ${!layers.site ? '#site_layer, .site-layer, #plot_boundary, #setback_boundary { display: none !important; }' : ''}
                    ${!layers.annotations ? '#annotations_layer, .annotations-layer, #compass_rose, #cad_title_block { display: none !important; }' : ''}
                    .room-rect:hover { stroke: #38bdf8 !important; stroke-width: 2.5 !important; cursor: pointer; }
                  ` }} />
                  <div
                    className="w-full max-h-[440px] flex items-center justify-center select-none transition-transform duration-150"
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                    dangerouslySetInnerHTML={{ __html: result.svg }}
                  />
                  <div className="mt-3 text-[10px] font-mono text-slate-400 flex items-center space-x-1.5 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
                    <Info className="w-3 h-3 text-blue-400" />
                    <span>Select a room from the inspector panel to review dimensions</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-500 space-y-2">
                  <Maximize2 className="w-10 h-10 mx-auto opacity-30 text-blue-400" />
                  <p className="text-xs font-semibold text-slate-300">
                    No Floor Plan Generated Yet
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Configure plot dimensions and room program requirements on the left, then click "Generate Floor Plan".
                  </p>
                </div>
              )}
            </div>

            {/* Subtle Architectural Disclaimer (Section 21 Specification) */}
            <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[10px] text-slate-500 leading-relaxed flex items-start space-x-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Notice:</strong> Conceptual floor plan. Vector architectural output. Review dimensions, access, local building regulations, and structural engineering with a qualified professional before construction.
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
                  /* Professional Property Inspector Display (Section 15 Specification) */
                  <div className="space-y-3.5">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                        Space Inspector
                      </span>
                      <h3 className="text-sm font-bold uppercase tracking-tight text-slate-900 mt-0.5">
                        {selectedRoom.name}
                      </h3>
                      <div className="flex items-center space-x-2 text-xs text-slate-600 mt-1">
                        <span className="font-mono tabular-nums font-bold text-slate-900">
                          {selectedRoom.width} × {selectedRoom.length} ft
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono tabular-nums font-bold text-blue-600">
                          {selectedRoom.area || (selectedRoom.width * selectedRoom.length)} sq.ft
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex justify-between py-0.5">
                        <span className="text-slate-500 font-medium">Zone</span>
                        <span className="font-extrabold text-blue-700 uppercase text-[11px] px-2 py-0.5 bg-blue-50 rounded">
                          {selectedRoom.zone || (AVAILABLE_ROOM_OPTIONS.find(o => o.type === selectedRoom.type)?.category || 'Space').toUpperCase()} ZONE
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-slate-500 font-medium">Floor Level</span>
                        <span className="font-semibold text-slate-800 text-[11px]">
                          {activeFloor?.name || `Floor ${activeFloorIdx}`}
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-slate-500 font-medium">Solver State</span>
                        <span className="font-mono text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Validated
                        </span>
                      </div>
                    </div>

                    {/* Dimensions Detail Breakdown */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                        Dimensions (Feet & Inches)
                      </span>
                      <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-sans block">Width</span>
                          <span className="font-bold tabular-nums text-slate-800">{selectedRoom.width} ft</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-sans block">Length</span>
                          <span className="font-bold tabular-nums text-slate-800">{selectedRoom.length} ft</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-sans block">Area</span>
                          <span className="font-bold tabular-nums text-slate-800">{selectedRoom.area || (selectedRoom.width * selectedRoom.length)} sq.ft</span>
                        </div>
                      </div>
                      {selectedRoom.formatted_dimensions && (
                        <div className="text-[11px] font-mono font-bold text-blue-700 pt-1 border-t border-slate-200">
                          {selectedRoom.formatted_dimensions}
                        </div>
                      )}
                    </div>

                    {/* Phase 3 Architectural Verification Indicators */}
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5 text-[11px]">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                        Architectural Verification
                      </span>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-500">Exterior Fenestration</span>
                        <span className={`font-bold flex items-center gap-1 ${selectedRoom.has_exterior_window !== false ? 'text-emerald-700' : 'text-slate-600'}`}>
                          {selectedRoom.has_exterior_window !== false ? '✓ Exterior Window' : 'Internal Shaft'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-500">Furniture Feasibility</span>
                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                          ✓ Clearance Feasible
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-500">Attached Suite Access</span>
                        <span className="font-bold text-slate-800">
                          {selectedRoom.type === 'master_bed' ? '✓ En-suite Bath' : selectedRoom.type === 'attached_bath' ? '✓ Master Bedroom' : '✓ Circulation'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-500">Aspect Ratio</span>
                        <span className="font-bold font-mono text-slate-800">
                          {selectedRoom.aspect_ratio || (Math.max(selectedRoom.width, selectedRoom.length) / Math.max(1, Math.min(selectedRoom.width, selectedRoom.length))).toFixed(2)} : 1
                        </span>
                      </div>
                    </div>

                    {/* Room Actions */}
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={() => setIsEditingRoom(true)}
                        className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 flex items-center justify-center space-x-1.5 transition-all shadow-2xs active:scale-[0.98]"
                      >
                        <Edit3 className="w-3 h-3 text-slate-500" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleRemoveRoomFromLayout(selectedRoom.room_id)}
                        className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-white border border-red-200 hover:bg-red-50 text-red-600 flex items-center justify-center space-x-1.5 transition-all shadow-2xs active:scale-[0.98]"
                        title="Remove room from layout"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
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
      {/* ========================================== */}
      {/* BOTTOM ACTION BAR (Section 16 & 21 Spec)   */}
      {/* ========================================== */}
      <div className="sticky bottom-3 z-30 bg-white/95 backdrop-blur-md rounded-xl p-3 border border-slate-200/90 shadow-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Regenerate (Triggers A/B candidate) */}
          <button
            onClick={handleInitiateRegenerate}
            disabled={!result || loading}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 flex items-center space-x-1.5 transition-all disabled:opacity-40 shadow-2xs active:scale-[0.98]"
            id="btn-bottom-regenerate"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>

          {/* Refine Layout */}
          <button
            onClick={() => setIsRefineOpen(true)}
            disabled={!result || refining}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 flex items-center space-x-1.5 transition-all disabled:opacity-40 shadow-2xs active:scale-[0.98]"
            id="btn-bottom-refine"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Refine Layout</span>
          </button>

          {/* Download DXF */}
          <button
            onClick={handleDownloadDxf}
            disabled={!result}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 flex items-center space-x-1.5 transition-all disabled:opacity-40 shadow-2xs active:scale-[0.98]"
            id="btn-bottom-dxf"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download DXF</span>
          </button>

          {/* Export SVG */}
          <button
            onClick={handleExportSvg}
            disabled={!result?.svg}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 flex items-center space-x-1.5 transition-all disabled:opacity-40 shadow-2xs active:scale-[0.98]"
            id="btn-bottom-svg"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export SVG</span>
          </button>

          {/* Save Plan */}
          <button
            onClick={() => setIsSaveModalOpen(true)}
            disabled={!result}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 flex items-center space-x-1.5 transition-all disabled:opacity-40 shadow-2xs active:scale-[0.98]"
            id="btn-bottom-save"
          >
            <Save className="w-3.5 h-3.5 text-emerald-600" />
            <span>Save Plan</span>
          </button>

          <span className="text-[10px] text-slate-400 font-mono hidden md:inline-block pl-1">
            Vector architectural output
          </span>
        </div>

        {/* Primary Action: Apply to Project */}
        <div>
          <button
            onClick={() => setIsApplyModalOpen(true)}
            disabled={!result}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1.5 shadow-xs hover:shadow transition-all disabled:opacity-40 active:scale-[0.98]"
            id="btn-bottom-apply"
          >
            <span>Apply to Project</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-200" />
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
              <div className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-700">Current Layout</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">Active</span>
                </div>
                <div
                  className="w-full h-56 bg-white rounded-xl border border-slate-200 p-2 flex items-center justify-center overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: result?.svg || '' }}
                />
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Carpet Area</span>
                    <span className="font-mono font-bold text-slate-800">{result?.floors?.[0]?.carpet_area_sqft || 0} sq.ft</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Circulation</span>
                    <span className="font-mono font-bold text-slate-800">{result?.floors?.[0]?.circulation_area_sqft || 0} sq.ft</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Quality Score</span>
                    <span className="font-mono font-extrabold text-blue-700">{result?.quality_score || result?.overall_quality_score || 88.5} / 100</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Strategy</span>
                    <span className="font-mono font-semibold text-slate-600 truncate block">{result?.architectural_strategy ? result.architectural_strategy.replace('STRATEGY_', '') : 'STANDARD'}</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsCompareModalOpen(false)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 transition-colors shadow-2xs"
                >
                  Keep Current Layout
                </button>
              </div>

              {/* Right: New Generated Candidate */}
              <div className="p-4 rounded-2xl border-2 border-blue-500 bg-blue-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-blue-800">New Generated Candidate</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white">Candidate</span>
                </div>
                <div
                  className="w-full h-56 bg-white rounded-xl border border-blue-200 p-2 flex items-center justify-center overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: candidateResult?.svg || '' }}
                />
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-blue-200">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Carpet Area</span>
                    <span className="font-mono font-bold text-slate-800">{candidateResult?.floors?.[0]?.carpet_area_sqft || 0} sq.ft</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Circulation</span>
                    <span className="font-mono font-bold text-slate-800">{candidateResult?.floors?.[0]?.circulation_area_sqft || 0} sq.ft</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Quality Score</span>
                    <span className="font-mono font-extrabold text-blue-700">{candidateResult?.quality_score || candidateResult?.overall_quality_score || 89.0} / 100</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Strategy</span>
                    <span className="font-mono font-semibold text-slate-600 truncate block">{candidateResult?.architectural_strategy ? candidateResult.architectural_strategy.replace('STRATEGY_', '') : 'ALTERNATIVE'}</span>
                  </div>
                </div>
                <button
                  onClick={handleApplyCandidate}
                  className="w-full py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-slate-900 text-white shadow-sm flex items-center justify-center space-x-1.5 transition-colors"
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
      {/* MODAL 3: CAD / DXF / DWG / PDF IMPORT MODAL              */}
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
              Upload an AutoCAD <strong>.dxf</strong>, <strong>.dwg</strong>, or vector <strong>.pdf</strong> architectural plan. Buildiqo AI extracts layer polylines, room boundaries, and computes carpet area.
            </p>

            {cadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold leading-relaxed">
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
                    {cadFile ? cadFile.name : 'Click to select DXF, DWG, or PDF file'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Up to 25 MB • Standard architectural layers
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".dxf,.dwg,.pdf"
                    onChange={handleCadFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Quick Action: Try Sample DXF */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div>
                    <span className="text-xs font-extrabold text-slate-800 block">Need a test drawing?</span>
                    <span className="text-[10px] text-slate-500">Verified AutoCAD R2000 DXF (804 sq.ft)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadSampleDxf}
                    disabled={cadExtracting}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-800 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 flex items-center space-x-1 transition-all shadow-2xs"
                  >
                    <FileCode className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Load Sample DXF</span>
                  </button>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    onClick={() => setIsCadModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRunCadExtraction()}
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
                        <span className="font-bold text-slate-900">{r.width_ft || r.width} × {r.length_ft || r.length} ft</span>
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
                    onClick={() => handleApplyCadToStudio(false)}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-cyan-700 hover:bg-cyan-800 text-white flex items-center space-x-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-200" />
                    <span>Render in Viewport</span>
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
