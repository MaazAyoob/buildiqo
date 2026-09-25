import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Eye, 
  Layers, 
  Maximize2, 
  Sparkles, 
  Building, 
  ShieldCheck, 
  ChevronRight, 
  ArrowRight,
  Ruler,
  Compass,
  LayoutGrid
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../store/useEstimateStore';

export const CONSTRUCTION_PHASES = [
  {
    id: 1,
    name: 'Foundation & Footings',
    sub: 'Trench Excavation, PCC Bed & Column Footing Casting',
    desc: 'Machine excavation in medium soil, anti-termite chemical spray, 100mm PCC base, rebar mesh, and isolated column trapezoidal footings.',
    pct: '15%',
    badge: 'Phase 1'
  },
  {
    id: 2,
    name: 'Plinth Beam & Earthwork',
    sub: 'Plinth Tie-Beams, Backfilling & Sump Casting',
    desc: 'Casting RCC plinth beams with DPC (Damp Proof Course), compacted stone dust backfilling, underground RCC water storage sump.',
    pct: '25%',
    badge: 'Phase 2'
  },
  {
    id: 3,
    name: 'RCC Columns & Slabs',
    sub: 'Structural Superstructure & Roof Slab Casting',
    desc: 'High-strength M25 grade concrete columns, marine-ply shuttering, Fe 550D rebar beam cages, electrical conduit laying, and roof slab casting.',
    pct: '50%',
    badge: 'Phase 3'
  },
  {
    id: 4,
    name: 'Masonry & AAC Blocks',
    sub: 'External Envelope & Internal Room Partitions',
    desc: '6" AAC block external thermal envelope, 4" internal partition walls, RCC lintel bands with sunshades, and door/window structural framing.',
    pct: '65%',
    badge: 'Phase 4'
  },
  {
    id: 5,
    name: 'Plastering & MEP Lines',
    sub: 'Internal/External Plaster & Concealed MEP',
    desc: 'Dual-coat waterproof cement plastering, concealed CPVC water lines, drainage PVC shafts, fire-retardant wiring, and distribution switchboxes.',
    pct: '80%',
    badge: 'Phase 5'
  },
  {
    id: 6,
    name: 'Finished Residence',
    sub: 'Flooring, Exterior Texture Paint & Handover',
    desc: 'Vitrified large tile flooring, premium washable emulsion & exterior weathercoat paint, UPVC windows, designer entrance door, and handover inspection.',
    pct: '100%',
    badge: 'Phase 6'
  }
];

export function Live3DConstructionViewer({
  plotLength = 40,
  plotWidth = 30,
  numFloors = 2,
  cityName = 'Bengaluru',
  estimation = null,
  onLaunchPlanner
}) {
  const [currentPhase, setCurrentPhase] = useState(6);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWireframe, setIsWireframe] = useState(false);
  const [viewMode, setViewMode] = useState('3d'); // '3d' or 'top'
  const canvasRef = useRef(null);

  // Rotation angles
  const [yaw, setYaw] = useState(0.85);
  const [pitch, setPitch] = useState(0.42);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  // Auto-play timelapse loop
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentPhase(prev => (prev >= 6 ? 1 : prev + 1));
      }, 2200);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Handle View Mode switch (3D vs Top View)
  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    if (mode === 'top') {
      setPitch(1.57); // Look straight down from above (~90 degrees)
      setYaw(0);
    } else {
      setPitch(0.42);
      setYaw(0.85);
    }
  };

  // Canvas 3D Rendering Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Dark Specialist Architectural Background (#0B0F19 per Section 23)
      ctx.fillStyle = '#0B0F19';
      ctx.fillRect(0, 0, width, height);

      // Subtle drafting grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 3D Projection transformation
      const cx = width / 2;
      const cy = viewMode === 'top' ? height / 2 : height * 0.58;
      const scale = Math.min(width, height) / (viewMode === 'top' ? 220 : 250);

      const project = (x, y, z) => {
        if (viewMode === 'top') {
          // Orthographic Top View
          return {
            x: cx + x * scale * 1.3,
            y: cy + z * scale * 1.3
          };
        }

        // 3D Isometric / Perspective Projection
        const radY = yaw;
        const radP = pitch;

        // Rotate Y (Yaw)
        const x1 = x * Math.cos(radY) - z * Math.sin(radY);
        const z1 = x * Math.sin(radY) + z * Math.cos(radY);

        // Rotate X (Pitch)
        const y2 = y * Math.cos(radP) - z1 * Math.sin(radP);
        const z2 = y * Math.sin(radP) + z1 * Math.cos(radP);

        // Orthographic projection
        return {
          x: cx + x1 * scale,
          y: cy - y2 * scale
        };
      };

      // Draw Box Helper
      const drawBox = (x, y, z, w, h, d, colorTop, colorFront, colorSide, strokeColor = '#334155') => {
        const p0 = project(x, y, z);
        const p1 = project(x + w, y, z);
        const p2 = project(x + w, y, z + d);
        const p3 = project(x, y, z + d);

        const p4 = project(x, y + h, z);
        const p5 = project(x + w, y + h, z);
        const p6 = project(x + w, y + h, z + d);
        const p7 = project(x, y + h, z + d);

        if (viewMode === 'top') {
          // In Top View, draw clean 2D floor plan rectangles with room outlines
          ctx.fillStyle = isWireframe ? 'rgba(255,255,255,0.8)' : colorTop;
          ctx.beginPath();
          ctx.moveTo(p4.x, p4.y);
          ctx.lineTo(p5.x, p5.y);
          ctx.lineTo(p6.x, p6.y);
          ctx.lineTo(p7.x, p7.y);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          return;
        }

        // 3D Rendering (Top, Front, Side faces)
        if (!isWireframe) {
          // Bottom / Top
          ctx.fillStyle = colorTop;
          ctx.beginPath();
          ctx.moveTo(p4.x, p4.y);
          ctx.lineTo(p5.x, p5.y);
          ctx.lineTo(p6.x, p6.y);
          ctx.lineTo(p7.x, p7.y);
          ctx.closePath();
          ctx.fill();

          // Front
          ctx.fillStyle = colorFront;
          ctx.beginPath();
          ctx.moveTo(p3.x, p3.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p6.x, p6.y);
          ctx.lineTo(p7.x, p7.y);
          ctx.closePath();
          ctx.fill();

          // Right Side
          ctx.fillStyle = colorSide;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p6.x, p6.y);
          ctx.lineTo(p5.x, p5.y);
          ctx.closePath();
          ctx.fill();
        }

        // Outlines
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = isWireframe ? 1.2 : 0.8;
        ctx.beginPath();
        ctx.moveTo(p4.x, p4.y); ctx.lineTo(p5.x, p5.y);
        ctx.lineTo(p6.x, p6.y); ctx.lineTo(p7.x, p7.y); ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(p3.x, p3.y); ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p6.x, p6.y); ctx.lineTo(p7.x, p7.y); ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p6.x, p6.y); ctx.lineTo(p5.x, p5.y); ctx.closePath();
        ctx.stroke();
      };

      const plotW = 75;
      const plotL = 95;
      const bldgW = 55;
      const bldgL = 65;
      const bldgX = -bldgW / 2;
      const bldgZ = -bldgL / 2;
      const floorH = 26;

      // 1. Plot Base Slab / Ground
      drawBox(-plotW / 2, -4, -plotL / 2, plotW, 4, plotL, '#1E293B', '#0F172A', '#0B1329', '#334155');

      // 2. Setback Boundary Guides in Top View
      if (viewMode === 'top') {
        ctx.strokeStyle = '#3B82F6';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        const sp0 = project(-plotW / 2 + 5, 0, -plotL / 2 + 5);
        const sp1 = project(plotW / 2 - 5, 0, -plotL / 2 + 5);
        const sp2 = project(plotW / 2 - 5, 0, plotL / 2 - 5);
        const sp3 = project(-plotW / 2 + 5, 0, plotL / 2 - 5);
        ctx.beginPath();
        ctx.moveTo(sp0.x, sp0.y);
        ctx.lineTo(sp1.x, sp1.y);
        ctx.lineTo(sp2.x, sp2.y);
        ctx.lineTo(sp3.x, sp3.y);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // PHASE 1: Excavation & Footings
      if (currentPhase >= 1) {
        // Concrete footing pedestals
        const colsX = [bldgX + 2, bldgX + bldgW / 2 - 2, bldgX + bldgW - 6];
        const colsZ = [bldgZ + 2, bldgZ + bldgL / 2 - 2, bldgZ + bldgL - 6];

        colsX.forEach(cxPos => {
          colsZ.forEach(czPos => {
            // Footing Trapezoid & Column Starter
            drawBox(cxPos - 4, -8, czPos - 4, 12, 4, 12, '#94A3B8', '#64748B', '#475569', '#334155');
            drawBox(cxPos, -4, czPos, 4, 8, 4, '#CBD5E1', '#94A3B8', '#64748B', '#1E293B');
          });
        });
      }

      // PHASE 2: Plinth Beam & Sump
      if (currentPhase >= 2) {
        // Plinth Beams
        drawBox(bldgX, 0, bldgZ, bldgW, 6, bldgL, '#CBD5E1', '#94A3B8', '#64748B', '#475569');
        // Underground Sump Box in Corner
        drawBox(plotW / 2 - 24, -2, plotL / 2 - 24, 18, 4, 18, '#93C5FD', '#60A5FA', '#3B82F6', '#1D4ED8');
      }

      // PHASE 3: RCC Columns & Slabs
      if (currentPhase >= 3) {
        // Ground Floor Columns
        const colsX = [bldgX, bldgX + bldgW / 2 - 2, bldgX + bldgW - 4];
        const colsZ = [bldgZ, bldgZ + bldgL / 2 - 2, bldgZ + bldgL - 4];

        colsX.forEach(cxPos => {
          colsZ.forEach(czPos => {
            drawBox(cxPos, 6, czPos, 4, floorH, 4, '#94A3B8', '#64748B', '#475569', '#334155');
          });
        });

        // 1st Floor Slab
        drawBox(bldgX - 2, 6 + floorH, bldgZ - 2, bldgW + 4, 3, bldgL + 4, '#E2E8F0', '#CBD5E1', '#94A3B8', '#475569');

        if (numFloors >= 2) {
          // Upper Floor Columns
          colsX.forEach(cxPos => {
            colsZ.forEach(czPos => {
              drawBox(cxPos, 9 + floorH, czPos, 4, floorH, 4, '#94A3B8', '#64748B', '#475569', '#334155');
            });
          });

          // Roof Slab & Parapet
          drawBox(bldgX - 2, 9 + floorH * 2, bldgZ - 2, bldgW + 4, 3, bldgL + 4, '#E2E8F0', '#CBD5E1', '#94A3B8', '#475569');
        }
      }

      // PHASE 4: Masonry & AAC Blocks
      if (currentPhase >= 4) {
        // Ground Floor Walls
        drawBox(bldgX, 6, bldgZ, bldgW, floorH, 4, '#FDBA74', '#FB923C', '#EA580C', '#9A3412');
        drawBox(bldgX, 6, bldgZ, 4, floorH, bldgL, '#FDBA74', '#FB923C', '#EA580C', '#9A3412');
        drawBox(bldgX + bldgW - 4, 6, bldgZ, 4, floorH, bldgL, '#FDBA74', '#FB923C', '#EA580C', '#9A3412');
        drawBox(bldgX, 6, bldgZ + bldgL - 4, bldgW, floorH, 4, '#FDBA74', '#FB923C', '#EA580C', '#9A3412');

        if (numFloors >= 2) {
          // 1F Walls
          drawBox(bldgX, 9 + floorH, bldgZ, bldgW, floorH, 4, '#FDBA74', '#FB923C', '#EA580C', '#9A3412');
          drawBox(bldgX, 9 + floorH, bldgZ, 4, floorH, bldgL, '#FDBA74', '#FB923C', '#EA580C', '#9A3412');
          drawBox(bldgX + bldgW - 4, 9 + floorH, bldgZ, 4, floorH, bldgL, '#FDBA74', '#FB923C', '#EA580C', '#9A3412');
          drawBox(bldgX, 9 + floorH, bldgZ + bldgL - 4, bldgW, floorH, 4, '#FDBA74', '#FB923C', '#EA580C', '#9A3412');
        }
      }

      // PHASE 5: Plastering & MEP
      if (currentPhase >= 5) {
        // Smooth Plaster coat
        const plasterColor = '#E2E8F0';
        drawBox(bldgX, 6, bldgZ, bldgW, floorH, bldgL, plasterColor, '#CBD5E1', '#94A3B8', '#64748B');

        if (numFloors >= 2) {
          drawBox(bldgX, 9 + floorH, bldgZ, bldgW, floorH, bldgL, plasterColor, '#CBD5E1', '#94A3B8', '#64748B');
        }
      }

      // PHASE 6: Finished Residence
      if (currentPhase >= 6) {
        // Modern White & Architectural Blue Paint Finish
        const wallMain = '#FFFFFF';
        const wallFront = '#F8FAFC';
        const wallSide = '#E2E8F0';

        drawBox(bldgX, 6, bldgZ, bldgW, floorH, bldgL, wallMain, wallFront, wallSide, '#94A3B8');

        // Front Teak Entrance Door
        drawBox(bldgX + bldgW / 2 - 6, 6, bldgZ + bldgL, 12, 18, 1.5, '#B45309', '#92400E', '#78350F', '#451A03');

        // Tinted Glass Windows
        drawBox(bldgX + 8, 12, bldgZ + bldgL, 12, 10, 1.5, '#BAE6FD', '#38BDF8', '#0284C7', '#0369A1');
        drawBox(bldgX + bldgW - 20, 12, bldgZ + bldgL, 12, 10, 1.5, '#BAE6FD', '#38BDF8', '#0284C7', '#0369A1');

        if (numFloors >= 2) {
          drawBox(bldgX, 9 + floorH, bldgZ, bldgW, floorH, bldgL, wallMain, wallFront, wallSide, '#94A3B8');
          // Balcony & 1F Windows
          drawBox(bldgX + 8, 15 + floorH, bldgZ + bldgL, 14, 12, 1.5, '#BAE6FD', '#38BDF8', '#0284C7', '#0369A1');
          drawBox(bldgX + bldgW - 22, 15 + floorH, bldgZ + bldgL, 14, 12, 1.5, '#BAE6FD', '#38BDF8', '#0284C7', '#0369A1');
          // Balcony Glass Railing
          drawBox(bldgX + 4, 9 + floorH, bldgZ + bldgL, bldgW - 8, 8, 1.5, '#E0F2FE', '#7DD3FC', '#0284C7', '#0284C7');
        }

        // Rooftop Parapet Wall & Solar Panels
        const topH = numFloors >= 2 ? 12 + floorH * 2 : 9 + floorH;
        drawBox(bldgX, topH, bldgZ, bldgW, 5, bldgL, '#FFFFFF', '#F1F5F9', '#E2E8F0', '#94A3B8');
        drawBox(bldgX + 8, topH + 5, bldgZ + 10, 16, 2, 22, '#1E3A8A', '#1E40AF', '#1D4ED8', '#172554');
      }

      // In Top View, Draw Room Label Markers
      if (viewMode === 'top') {
        ctx.fillStyle = '#F8FAFC';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';

        const pLiving = project(0, 0, 10);
        ctx.fillText('Living & Dining', pLiving.x, pLiving.y);

        const pBed = project(-14, 0, -15);
        ctx.fillText('Master Bed', pBed.x, pBed.y);

        const pKit = project(14, 0, -15);
        ctx.fillText('Kitchen', pKit.x, pKit.y);

        const pFoyer = project(0, 0, 32);
        ctx.fillText('Entry Porch', pFoyer.x, pFoyer.y);
      }
    };

    render();
  }, [currentPhase, isWireframe, yaw, pitch, viewMode, numFloors]);

  // Mouse drag to orbit
  const handleMouseDown = (e) => {
    if (viewMode === 'top') return; // In top view, view is locked to top
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || viewMode === 'top') return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    setYaw(prev => prev + dx * 0.008);
    setPitch(prev => Math.max(0.1, Math.min(1.4, prev + dy * 0.008)));
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const activePhaseObj = CONSTRUCTION_PHASES.find(p => p.id === currentPhase) || CONSTRUCTION_PHASES[5];
  const totalCost = estimation ? formatCurrency(estimation.grandTotalCost) : '₹42.75 L';
  const totalBua = estimation ? formatNumber(estimation.totalBuiltupArea) : '1,900';
  const ratePerSqFt = estimation ? formatCurrency(estimation.costPerSqFt) : '₹2,250';

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden text-left transition-all">
      
      {/* 3D Card Header matching screenshot */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
              3D Architectural Reconstruction
            </h3>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              {plotWidth}' × {plotLength}' Plot
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            {cityName.toUpperCase()} RESIDENCE • {numFloors === 1 ? 'GROUND FLOOR' : `G+${numFloors - 1} STRUCTURE`}
          </p>
        </div>

        {/* View Controls Strip (3D Orbit, Top View, Wireframe, Play Timelapse) */}
        <div className="flex items-center space-x-2 flex-wrap gap-1.5">
          {/* Top View Toggle */}
          <button
            onClick={() => handleSetViewMode(viewMode === 'top' ? '3d' : 'top')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all flex items-center space-x-1.5 ${
              viewMode === 'top'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Switch between 3D Orbit and Top 2D/3D Plan View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{viewMode === 'top' ? 'Top View (Active)' : 'Top View (Plan)'}</span>
          </button>

          {/* Wireframe toggle */}
          <button
            onClick={() => setIsWireframe(!isWireframe)}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
              isWireframe
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isWireframe ? 'Solid View' : 'Wireframe'}
          </button>

          {/* Timelapse Play / Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 shadow-sm ${
              isPlaying 
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            <span>{isPlaying ? 'Pause Timelapse' : 'Play Timelapse'}</span>
          </button>

          {/* Reset View */}
          <button
            onClick={() => { setYaw(0.85); setPitch(0.42); setViewMode('3d'); }}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Reset 3D View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Area (Section 23 Specialist Dark Environment) */}
      <div 
        className="relative h-[320px] sm:h-[390px] bg-[#0B0F19] cursor-grab active:cursor-grabbing select-none overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={420}
          className="w-full h-full object-contain"
        />

        {/* View Mode & HUD Badges */}
        <div className="absolute top-3 left-3 flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/60 text-slate-300 font-mono text-[10px] font-semibold shadow-xs">
            {viewMode === 'top' ? '📐 Top Plan View' : '🔄 360° Orbit Drag'}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-600/90 text-white font-mono text-[10px] font-bold shadow-xs">
            {activePhaseObj.name} ({activePhaseObj.pct})
          </span>
        </div>
      </div>

      {/* Construction Phase Progress Stepper Bar */}
      <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200/90 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 font-semibold">
              {activePhaseObj.badge} of 6
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">{activePhaseObj.name}</h4>
            <p className="text-[11px] text-slate-500 font-normal">{activePhaseObj.sub}</p>
          </div>
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            {activePhaseObj.pct} Complete
          </span>
        </div>

        {/* Interactive Step Buttons */}
        <div className="grid grid-cols-6 gap-1.5 sm:gap-2 pt-1">
          {CONSTRUCTION_PHASES.map((p) => {
            const isCurrent = p.id === currentPhase;
            const isCompleted = p.id < currentPhase;
            return (
              <button
                key={p.id}
                onClick={() => { setCurrentPhase(p.id); setIsPlaying(false); }}
                className={`py-1.5 rounded-lg text-center font-mono font-semibold text-[10px] sm:text-xs transition-all border ${
                  isCurrent
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : isCompleted
                    ? 'bg-white text-slate-800 border-slate-300 hover:border-slate-400'
                    : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                }`}
              >
                P{p.id}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Live Metrics Strip */}
      <div className="p-3.5 sm:p-5 bg-white border-t border-slate-200/90 grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">Estimated Cost</span>
          <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-slate-900 block mt-0.5">{totalCost}</span>
          <span className="text-[10px] font-mono text-emerald-700 font-medium">IS 456 Quantities</span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">Built-Up Area</span>
          <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-slate-900 block mt-0.5">{totalBua} sq.ft</span>
          <span className="text-[10px] text-slate-500 font-normal">G+{numFloors - 1} Superstructure</span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">Rate / Sq.Ft</span>
          <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-slate-900 block mt-0.5">{ratePerSqFt}</span>
          <span className="text-[10px] text-slate-500 font-normal">{cityName.split(' ')[0]} Benchmark</span>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <button
            onClick={onLaunchPlanner}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs hover:shadow transition-all flex items-center justify-center space-x-1.5 active:scale-[0.98]"
          >
            <span>Open Planner & BOQ</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-200" />
          </button>
        </div>
      </div>

    </div>
  );
}
