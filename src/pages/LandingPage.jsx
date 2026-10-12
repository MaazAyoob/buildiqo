import React, { useState } from 'react';
import { 
  Building2, 
  Calculator, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Layers, 
  FileSpreadsheet, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Award, 
  Compass, 
  Ruler, 
  Clock, 
  Check, 
  FileCheck2, 
  HardHat, 
  Sliders, 
  Download, 
  Share2, 
  Maximize2, 
  ArrowUpRight, 
  TrendingUp, 
  Cpu, 
  Boxes,
  MapPin,
  CheckCircle,
  FileCode,
  Shield,
  Activity,
  Play,
  Zap,
  FolderOpen,
  Package,
  BarChart3,
  Hammer,
  Truck,
  Sun,
  Flame,
  Droplets,
  Wind,
  Eye
} from 'lucide-react';
import { CITIES } from '../data/cities';
import { TIER_BENCHMARKS } from '../data/materials';
import { useEstimateStore, formatCurrency, formatNumber } from '../store/useEstimateStore';

export function LandingPage({ setRoute }) {
  const { state, updateState, estimation } = useEstimateStore();
  const [faqOpen, setFaqOpen] = useState({ 0: true, 1: true });
  const [activeTierPreview, setActiveTierPreview] = useState('premium');
  const [interactiveBua, setInteractiveBua] = useState(3200);
  const [heroSimulatorTab, setHeroSimulatorTab] = useState('cost'); // 'cost' | 'materials' | 'floorplan'
  const [hoveredRoom, setHoveredRoom] = useState(null);

  const toggleFaq = (index) => {
    setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const selectedTierData = TIER_BENCHMARKS[activeTierPreview] || TIER_BENCHMARKS.standard;
  const calculatedCost = interactiveBua * selectedTierData.ratePerSqFt;
  const gstCost = Math.round(calculatedCost * 0.18);
  const totalCost = calculatedCost + gstCost;

  // Real-time IS 456 Structural Material Estimations for Hero Simulator
  const cementBags = Math.round(interactiveBua * 0.42);
  const steelTons = (interactiveBua * 3.8 / 1000).toFixed(2);
  const concreteCuM = Math.round(interactiveBua * 0.13);
  const sandCuFt = Math.round(interactiveBua * 1.85);
  const blocksCount = Math.round(interactiveBua * 8.6);
  const laborDays = Math.round(interactiveBua * 0.72);

  const faqs = [
    {
      q: "How does the Buildiqo.AI deterministic cost calculation engine work?",
      a: "Our engine uses deterministic, quantity-surveying algorithms calibrated to Indian Standards IS 456 (Plain & Reinforced Concrete) and IS 1786 (High-Strength Deformed Steel). It calculates physical structural rebar cutting weights, 50kg cement bags, masonry blockwork volumes, aggregate logistics, and trade labor derived directly from plot boundaries, floor count, and built-up area (SBA)."
    },
    {
      q: "What is the package-based estimation formula?",
      a: "Estimated Construction Cost = Total Built-up Area (SBA) × Applicable Construction Package Rate per sq.ft. The rate adapts to Standard (₹1,950/sq.ft), Premium (₹2,250/sq.ft), or Luxury (₹2,650/sq.ft) packages, or custom negotiated contracts."
    },
    {
      q: "What is the difference between Net Carpet Area and Built-up Area (BUA)?",
      a: "Carpet Area is the actual usable net internal floor area within room perimeter walls. Built-up Area (BUA) includes exterior load-bearing walls, structural columns, internal partitions, balconies, and staircase shafts—typically 15% to 22% higher than carpet area."
    },
    {
      q: "Can I export formal documents for bank loan approval and contractor tenders?",
      a: "Yes. The platform generates standardized QS Audit Reports with trade-wise BOQ breakups, concrete takeoff schedules, milestone stage cashflow releases, and contractor fee margins, exportable in both PDF and Excel formats."
    },
    {
      q: "Does the AI Floor Plan Studio produce usable CAD layouts?",
      a: "Yes. The algorithmic solver arranges habitable spaces, bathrooms, circulation corridors, and staircases based on setback boundaries, Vastu orientations, and room adjacency constraints, and exports clean SVG and DXF files for AutoCAD and Revit."
    }
  ];

  return (
    <div className="w-full bg-[#F5F7FB] text-[#172033] selection:bg-blue-600 selection:text-white">
      
      {/* ============================================================== */}
      {/* 1. TOP ANNOUNCEMENT BAR                                       */}
      {/* ============================================================== */}
      <div className="w-full bg-[#EEF4FF] text-[#1E40AF] text-xs py-2.5 px-4 border-b border-[#BFDBFE]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white text-blue-700 border border-blue-200 shadow-2xs">
              ⚡ WORKSPACE V2
            </span>
            <span className="text-[#334155] font-semibold">
              Deterministic Civil Cost Estimator, CAD Floor Plan Studio &amp; IS 456 BOQ Engine.
            </span>
          </div>
          <button 
            onClick={() => setRoute('planner', 1)}
            className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1 transition-colors text-xs ml-auto sm:ml-0"
          >
            <span>Launch Quick Estimate</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. COLORFUL, VIBRANT ARCHITECTURAL HERO (TWO-COLUMN DESKTOP)   */}
      {/* ============================================================== */}
      <section className="relative pt-10 pb-16 lg:pt-14 lg:pb-20 overflow-hidden border-b border-indigo-100 bg-[#F8FAFC]">
        
        {/* Layer 1: Layered Multicolor Gradient Field Across Entire Hero */}
        <div 
          className="absolute -top-24 -left-20 w-[650px] h-[650px] pointer-events-none rounded-full blur-3xl opacity-80"
          style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.22) 0%, rgba(124,58,237,0.12) 45%, transparent 70%)' }}
        />
        <div 
          className="absolute -top-32 -right-24 w-[750px] h-[750px] pointer-events-none rounded-full blur-3xl opacity-85"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.25) 0%, rgba(37,99,235,0.14) 45%, transparent 70%)' }}
        />
        <div 
          className="absolute bottom-0 left-1/4 w-[700px] h-[450px] pointer-events-none rounded-full blur-3xl opacity-60"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.16) 0%, rgba(249,115,22,0.09) 40%, transparent 70%)' }}
        />
        <div 
          className="absolute -bottom-20 right-1/4 w-[500px] h-[350px] pointer-events-none rounded-full blur-3xl opacity-50"
          style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.18) 0%, rgba(16,185,129,0.08) 45%, transparent 70%)' }}
        />

        {/* Layer 2: Architectural Drafting Grid (Coordinate System) */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(99, 102, 241, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(99, 102, 241, 0.08) 1px, transparent 1px),
              linear-gradient(to right, rgba(37, 99, 235, 0.15) 1.5px, transparent 1.5px),
              linear-gradient(to bottom, rgba(37, 99, 235, 0.15) 1.5px, transparent 1.5px)
            `,
            backgroundSize: '40px 40px, 40px 40px, 200px 200px, 200px 200px'
          }}
        />

        {/* Layer 3: Architectural Drafting Vector Elements */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30 select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cadGridCrosses" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 50 45 L 50 55 M 45 50 L 55 50" stroke="#4F46E5" strokeWidth="1" strokeOpacity="0.45" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cadGridCrosses)" />
          <line x1="6%" y1="0" x2="6%" y2="100%" stroke="#2563EB" strokeWidth="1" strokeDasharray="6 4" strokeOpacity="0.3" />
          <line x1="94%" y1="0" x2="94%" y2="100%" stroke="#06B6D4" strokeWidth="1" strokeDasharray="6 4" strokeOpacity="0.3" />
          <line x1="0" y1="10%" x2="100%" y2="10%" stroke="#7C3AED" strokeWidth="1" strokeDasharray="6 4" strokeOpacity="0.25" />
          <line x1="0" y1="90%" x2="100%" y2="90%" stroke="#F59E0B" strokeWidth="1" strokeDasharray="6 4" strokeOpacity="0.25" />
        </svg>

        {/* Header Precision Drafting Marks */}
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 mb-5 hidden md:flex items-center justify-between text-[10px] font-mono text-slate-500 select-none relative z-10">
          <div className="flex items-center space-x-2 bg-white/90 px-3 py-1 rounded-full border border-indigo-100 shadow-2xs backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="font-bold text-slate-700">CAD COORD: 12.9716°N, 77.5946°E</span>
            <span className="text-slate-300">|</span>
            <span>BENGALURU QS DESK</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/90 px-3 py-1 rounded-full border border-cyan-100 shadow-2xs backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            <span className="font-bold text-cyan-800">IS 456:2000 &amp; IS 1786 COMPLIANT CALCULATIONS</span>
          </div>
        </div>

        {/* Main Hero Container: Distinctive Two-Column Composition */}
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 items-start lg:items-center">
            
            {/* ========================================================== */}
            {/* LEFT COLUMN: BRAND VALUE PROPOSITION & DIRECT ACTIONS      */}
            {/* ========================================================== */}
            <div className="lg:col-span-5 space-y-5 text-left">
              
              {/* Product Identification Badge */}
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-indigo-200 shadow-xs text-xs backdrop-blur-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 animate-pulse" />
                <span className="font-black text-[#111827]">Buildiqo.AI</span>
                <span className="text-slate-300">|</span>
                <span className="text-indigo-700 font-extrabold uppercase tracking-wider text-[10px]">
                  Civil Construction Intelligence
                </span>
                <span className="ml-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                  100% Free
                </span>
              </div>

              {/* Bold Typography with Rich Multi-Color Gradient Treatment */}
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-5xl xl:text-6xl font-black text-[#111827] tracking-tight leading-[1.08]">
                  Civil Construction <br className="hidden sm:inline" />
                  Estimation, <br />
                  <span className="bg-gradient-to-r from-[#4F46E5] via-[#2563EB] via-[#7C3AED] to-[#06B6D4] bg-clip-text text-transparent">
                    Engineered in High Definition.
                  </span>
                </h1>
                
                <p className="text-sm sm:text-base text-[#334155] leading-relaxed font-normal max-w-xl">
                  Deterministic quantity surveying calibrated to Indian Standards IS 456 &amp; IS 1786. Calculate structural concrete, rebar cutting weights, commercial package rates, and vector CAD floor plans without black-box guesswork.
                </p>
              </div>

              {/* Primary & Secondary Action Buttons */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <button
                    onClick={() => setRoute('planner', 1)}
                    className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#2563EB] via-[#4F46E5] to-[#7C3AED] hover:from-[#1D4ED8] hover:to-[#6D28D9] text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] group cursor-pointer"
                  >
                    <Calculator className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
                    <span>Start Construction Estimate</span>
                    <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => setRoute('commercial-boq')}
                    className="px-4 py-3.5 rounded-xl bg-white hover:bg-emerald-50/80 border-2 border-emerald-300 text-emerald-800 font-bold text-xs shadow-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Commercial BOQ</span>
                  </button>

                  <button
                    onClick={() => setRoute('floor-plan')}
                    className="px-4 py-3.5 rounded-xl bg-white hover:bg-purple-50/80 border-2 border-purple-300 text-purple-800 font-bold text-xs shadow-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-purple-600" />
                    <span>AI Floor Plan</span>
                  </button>
                </div>
              </div>

              {/* Short Row of Truthful Product Capabilities */}
              <div className="pt-2 border-t border-slate-200/80">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Deterministic Verified Standards
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/95 border border-blue-200/90 text-blue-950 flex items-center space-x-2 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    <span className="font-bold text-[11px] truncate">IS 456 Concrete Mix</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/95 border border-cyan-200/90 text-cyan-950 flex items-center space-x-2 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                    <span className="font-bold text-[11px] truncate">IS 1786 Fe 550D Rebar</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/95 border border-amber-200/90 text-amber-950 flex items-center space-x-2 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="font-bold text-[11px] truncate">NBC 2016 Coverage</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/95 border border-emerald-200/90 text-emerald-950 flex items-center space-x-2 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                    <span className="font-bold text-[11px] truncate">28 States Approved Rates</span>
                  </div>
                </div>
              </div>

            </div>

            {/* ========================================================== */}
            {/* RIGHT COLUMN: LARGE POLISHED PRODUCT SHOWCASE SIMULATOR    */}
            {/* ========================================================== */}
            <div className="lg:col-span-7">
              <div className="relative rounded-3xl bg-white/95 border-2 border-indigo-200/90 shadow-2xl shadow-indigo-950/15 p-4 sm:p-6 backdrop-blur-md text-[#111827] overflow-hidden">
            
            {/* Window Chrome Header Bar with Live State Ticker */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-3">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-400 inline-block shadow-xs" />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow-xs" />
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block shadow-xs" />
                <span className="ml-2 font-mono text-xs text-[#64748B]">buildiqo-engine // live-civil-simulator.boq</span>
              </div>
              
              <div className="flex items-center space-x-2 text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[10px] font-black flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>DETERMINISTIC SIMULATOR ACTIVE</span>
                </span>
                <span className="text-slate-500 text-xs hidden md:inline font-mono">Karnataka State Benchmark (1.00x)</span>
              </div>
            </div>

            {/* 3 Interactive Mode Navigation Tabs */}
            <div className="flex items-center gap-2 pt-4 pb-2 overflow-x-auto border-b border-slate-100">
              <button
                onClick={() => setHeroSimulatorTab('cost')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 shrink-0 ${
                  heroSimulatorTab === 'cost'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-600/30'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>1. Package Cost Engine</span>
              </button>

              <button
                onClick={() => setHeroSimulatorTab('materials')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 shrink-0 ${
                  heroSimulatorTab === 'materials'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/25 ring-2 ring-cyan-600/30'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>2. Structural Material Takeoff (IS 456)</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-700 text-white font-bold">Live</span>
              </button>

              <button
                onClick={() => setHeroSimulatorTab('floorplan')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 shrink-0 ${
                  heroSimulatorTab === 'floorplan'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25 ring-2 ring-purple-600/30'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>3. Parametric CAD &amp; Vastu Zoning</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-700 text-white font-bold">2D Vector</span>
              </button>
            </div>

            {/* ========================================================== */}
            {/* TAB 1 CONTENT: PACKAGE COST ENGINE                         */}
            {/* ========================================================== */}
            {heroSimulatorTab === 'cost' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5 animate-fadeIn">
                
                {/* Left Column: Interactive Controls */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center justify-between">
                      <span>Select Construction Tier</span>
                      <span className="text-[10px] text-blue-600 font-mono">Karnataka Rates</span>
                    </label>

                    {/* 3 Colorful Package Tier Cards */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* Standard */}
                      <button
                        onClick={() => setActiveTierPreview('standard')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          activeTierPreview === 'standard'
                            ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-[10px] font-bold uppercase text-emerald-700">Economy</div>
                        <div className="text-xs font-black text-slate-900">Standard</div>
                        <div className="text-[11px] font-mono font-bold text-emerald-800 mt-1">₹1,950/sq.ft</div>
                      </button>

                      {/* Premium */}
                      <button
                        onClick={() => setActiveTierPreview('premium')}
                        className={`p-2.5 rounded-xl border text-left transition-all relative ${
                          activeTierPreview === 'premium'
                            ? 'bg-blue-50/90 border-blue-600 text-blue-950 ring-2 ring-blue-600/30 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className="absolute -top-2 right-1 px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-blue-600 text-white">
                          Popular
                        </span>
                        <div className="text-[10px] font-bold uppercase text-blue-700">Recommended</div>
                        <div className="text-xs font-black text-slate-900">Premium</div>
                        <div className="text-[11px] font-mono font-bold text-blue-700 mt-1">₹2,250/sq.ft</div>
                      </button>

                      {/* Luxury */}
                      <button
                        onClick={() => setActiveTierPreview('luxury')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          activeTierPreview === 'luxury'
                            ? 'bg-purple-50/80 border-purple-600 text-purple-950 ring-2 ring-purple-600/20 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-[10px] font-bold uppercase text-purple-700">Bespoke</div>
                        <div className="text-xs font-black text-slate-900">Luxury</div>
                        <div className="text-[11px] font-mono font-bold text-purple-800 mt-1">₹2,650/sq.ft</div>
                      </button>
                    </div>
                  </div>

                  {/* Built-Up Area Slider */}
                  <div className="space-y-2 bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#172033] flex items-center space-x-1.5">
                        <Ruler className="w-3.5 h-3.5 text-blue-600" />
                        <span>Built-Up Area (SBA)</span>
                      </span>
                      <span className="font-mono font-extrabold text-blue-700 text-sm bg-white px-2.5 py-0.5 rounded-md border border-blue-200 shadow-2xs">
                        {formatNumber(interactiveBua)} sq.ft
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1200"
                      max="10000"
                      step="100"
                      value={interactiveBua}
                      onChange={(e) => setInteractiveBua(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>1,200 sq.ft</span>
                      <span className="text-blue-600 font-bold">5,000 sq.ft</span>
                      <span>10,000 sq.ft</span>
                    </div>
                  </div>

                  {/* Formula Callout */}
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50/60 rounded-xl border border-blue-200 text-[11px] text-blue-900 font-mono space-y-1">
                    <div className="text-blue-700 font-bold flex items-center space-x-1">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>Deterministic Engineering Formula:</span>
                    </div>
                    <div>Base Cost = SBA ({formatNumber(interactiveBua)} sq.ft) × Rate (₹{selectedTierData.ratePerSqFt}/sq.ft)</div>
                  </div>
                </div>

                {/* Right Column: Live Output & Architectural Breakdown */}
                <div className="lg:col-span-7 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between space-y-5">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-white/20 text-xs">
                      <span className="text-blue-100 font-bold uppercase tracking-wider">Estimated Construction Budget</span>
                      <span className="text-cyan-200 font-mono font-extrabold px-2 py-0.5 rounded bg-white/10">
                        ₹{selectedTierData.ratePerSqFt} / sq.ft
                      </span>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
                      <div>
                        <span className="text-3xl sm:text-5xl font-black font-mono tracking-tight text-white block">
                          {formatCurrency(calculatedCost)}
                        </span>
                        <span className="text-xs text-blue-200 block mt-1">
                          Base Civil &amp; Architectural Finishes Cost (Excl. GST)
                        </span>
                      </div>

                      <div className="sm:text-right font-mono text-xs text-blue-100 bg-white/10 p-3 rounded-xl border border-white/15">
                        <div>+ 18% GST: <span className="font-bold text-white">{formatCurrency(gstCost)}</span></div>
                        <div className="text-emerald-300 font-black text-base mt-1">
                          Grand Total: {formatCurrency(totalCost)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Key Material Inclusions */}
                  <div className="space-y-2 pt-3 border-t border-white/15">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-200 block">
                      Approved Package Specification Highlights
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {selectedTierData.highlights.slice(0, 6).map((h, i) => (
                        <div key={i} className="p-2 rounded-lg bg-white/10 border border-white/20 text-white text-[11px] flex items-center space-x-1.5 truncate backdrop-blur-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                          <span className="truncate">{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Action inside Preview */}
                  <button
                    onClick={() => setRoute('planner', 1)}
                    className="w-full py-3 rounded-xl bg-white hover:bg-slate-50 text-blue-700 font-black text-xs flex items-center justify-center space-x-2 transition-all shadow-md active:scale-[0.99]"
                  >
                    <span>Load Configuration in 6-Step Planning Engine</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-700" />
                  </button>
                </div>

              </div>
            )}

            {/* ========================================================== */}
            {/* TAB 2 CONTENT: STRUCTURAL MATERIAL TAKEOFF (IS 456)        */}
            {/* ========================================================== */}
            {heroSimulatorTab === 'materials' && (
              <div className="pt-5 space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs pb-3 border-b border-slate-100 gap-2">
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-[#172033] block">
                      IS 456 &amp; IS 1786 Physical Quantity Takeoff Breakdown
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Mathematically computed based on <strong className="text-blue-700">{formatNumber(interactiveBua)} sq.ft Built-Up Area (SBA)</strong>.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold text-slate-500">Adjust SBA:</span>
                    <input
                      type="range"
                      min="1200"
                      max="10000"
                      step="100"
                      value={interactiveBua}
                      onChange={(e) => setInteractiveBua(Number(e.target.value))}
                      className="w-32 accent-cyan-600 cursor-pointer"
                    />
                    <span className="font-mono text-xs font-bold text-cyan-700">{formatNumber(interactiveBua)} sq.ft</span>
                  </div>
                </div>

                {/* 6 Colorful Calculated Material Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {/* 1. Cement */}
                  <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200 text-cyan-950 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-900">UltraTech / ACC Cement</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-200 text-cyan-900">IS 12269</span>
                    </div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-2xl font-black font-mono text-[#172033]">{formatNumber(cementBags)}</span>
                      <span className="text-xs font-bold text-slate-600">Bags (50 kg)</span>
                    </div>
                    <div className="text-[11px] text-cyan-800 flex items-center justify-between border-t border-cyan-200/80 pt-1.5">
                      <span>Rate: ₹420 / bag</span>
                      <span className="font-mono font-bold">{formatCurrency(cementBags * 420)}</span>
                    </div>
                  </div>

                  {/* 2. Steel */}
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-950 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900">Fe 550D TMT Rebar (Steel)</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-200 text-blue-900">IS 1786</span>
                    </div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-2xl font-black font-mono text-[#172033]">{steelTons}</span>
                      <span className="text-xs font-bold text-slate-600">Metric Tonnes</span>
                    </div>
                    <div className="text-[11px] text-blue-800 flex items-center justify-between border-t border-blue-200/80 pt-1.5">
                      <span>Rate: ₹68 / kg</span>
                      <span className="font-mono font-bold">{formatCurrency(Math.round(interactiveBua * 3.8 * 68))}</span>
                    </div>
                  </div>

                  {/* 3. Concrete */}
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900">Ready-Mix Concrete (M20/M25)</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900">IS 456</span>
                    </div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-2xl font-black font-mono text-[#172033]">{formatNumber(concreteCuM)}</span>
                      <span className="text-xs font-bold text-slate-600">Cubic Metres (m³)</span>
                    </div>
                    <div className="text-[11px] text-emerald-800 flex items-center justify-between border-t border-emerald-200/80 pt-1.5">
                      <span>Rate: ₹4,600 / m³</span>
                      <span className="font-mono font-bold">{formatCurrency(concreteCuM * 4600)}</span>
                    </div>
                  </div>

                  {/* 4. Sand */}
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900">M-Sand &amp; Coarse Aggregates</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">Zone II</span>
                    </div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-2xl font-black font-mono text-[#172033]">{formatNumber(sandCuFt)}</span>
                      <span className="text-xs font-bold text-slate-600">Cubic Feet (ft³)</span>
                    </div>
                    <div className="text-[11px] text-amber-800 flex items-center justify-between border-t border-amber-200/80 pt-1.5">
                      <span>Rate: ₹58 / ft³</span>
                      <span className="font-mono font-bold">{formatCurrency(sandCuFt * 58)}</span>
                    </div>
                  </div>

                  {/* 5. Blocks */}
                  <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-purple-950 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-900">Solid AAC Masonry Blocks</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-200 text-purple-900">600×200×150</span>
                    </div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-2xl font-black font-mono text-[#172033]">{formatNumber(blocksCount)}</span>
                      <span className="text-xs font-bold text-slate-600">Masonry Units</span>
                    </div>
                    <div className="text-[11px] text-purple-800 flex items-center justify-between border-t border-purple-200/80 pt-1.5">
                      <span>Rate: ₹62 / unit</span>
                      <span className="font-mono font-bold">{formatCurrency(blocksCount * 62)}</span>
                    </div>
                  </div>

                  {/* 6. Labor */}
                  <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 text-rose-950 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-900">Structural Trades &amp; Masons</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-900">Direct Labour</span>
                    </div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-2xl font-black font-mono text-[#172033]">{formatNumber(laborDays)}</span>
                      <span className="text-xs font-bold text-slate-600">Man-Days</span>
                    </div>
                    <div className="text-[11px] text-rose-800 flex items-center justify-between border-t border-rose-200/80 pt-1.5">
                      <span>Daily Wage: ₹750</span>
                      <span className="font-mono font-bold">{formatCurrency(laborDays * 750)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <span className="text-slate-600">
                    Want complete bill of quantities with itemized bar-bending schedules and rate analysis?
                  </span>
                  <button
                    onClick={() => setRoute('planner', 4)}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shrink-0 flex items-center space-x-1.5 transition-colors shadow-xs"
                  >
                    <span>View Step 4 BOQ Takeoff</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* TAB 3 CONTENT: PARAMETRIC CAD & VASTU ZONING               */}
            {/* ========================================================== */}
            {heroSimulatorTab === 'floorplan' && (
              <div className="pt-5 space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs pb-3 border-b border-slate-100 gap-2">
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-[#172033] block">
                      Vastu-Compliant Residential Layout Matrix
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Algorithmic room orientation solving setback buffers, wind orientation &amp; solar radiation.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-200 text-[10px]">
                      Parametric Vastu Spatial Matrix (East-Facing Layout)
                    </span>
                  </div>
                </div>

                {/* Interactive Vastu Mini Canvas */}
                <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200 p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    
                    {/* Zone 1: Master Suite (SW / Earth) */}
                    <div 
                      onMouseEnter={() => setHoveredRoom('Master Bedroom')}
                      onMouseLeave={() => setHoveredRoom(null)}
                      className="p-4 rounded-xl bg-amber-50/80 border-2 border-amber-300 hover:border-amber-500 transition-all cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-amber-950 flex items-center space-x-1.5">
                          <Sun className="w-3.5 h-3.5 text-amber-600" />
                          <span>Master Bed Suite (SW)</span>
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-200 text-amber-900">
                          Prithvi (Earth)
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-1">16'0" × 14'0" (224 sq.ft) • Attached Bath &amp; Walk-in Dresser</p>
                      <div className="text-[10px] text-slate-500 mt-2 font-mono">Positioned in South-West for stability &amp; authority.</div>
                    </div>

                    {/* Zone 2: Kitchen (SE / Fire) */}
                    <div 
                      onMouseEnter={() => setHoveredRoom('Kitchen')}
                      onMouseLeave={() => setHoveredRoom(null)}
                      className="p-4 rounded-xl bg-rose-50/80 border-2 border-rose-300 hover:border-rose-500 transition-all cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-rose-950 flex items-center space-x-1.5">
                          <Flame className="w-3.5 h-3.5 text-rose-600" />
                          <span>Modular Kitchen (SE)</span>
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-200 text-rose-900">
                          Agni (Fire)
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-800 mt-1">12'0" × 10'0" (120 sq.ft) • East-Facing Cooking Hob &amp; Utility</p>
                      <div className="text-[10px] text-slate-500 mt-2 font-mono">South-East corner aligns with natural solar ventilation.</div>
                    </div>

                    {/* Zone 3: Living & Foyer (NE / Water) */}
                    <div 
                      onMouseEnter={() => setHoveredRoom('Living')}
                      onMouseLeave={() => setHoveredRoom(null)}
                      className="p-4 rounded-xl bg-sky-50/80 border-2 border-sky-300 hover:border-sky-500 transition-all cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-sky-950 flex items-center space-x-1.5">
                          <Droplets className="w-3.5 h-3.5 text-sky-600" />
                          <span>Formal Living &amp; Pooja (NE)</span>
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-sky-200 text-sky-900">
                          Ishanya (Water)
                        </span>
                      </div>
                      <p className="text-[11px] text-sky-800 mt-1">18'0" × 16'0" (288 sq.ft) • Double-Height Entry &amp; Foyer</p>
                      <div className="text-[10px] text-slate-500 mt-2 font-mono">Lightest structural loading allocated to North-East.</div>
                    </div>

                    {/* Zone 4: Guest Bedroom (NW / Air) */}
                    <div 
                      onMouseEnter={() => setHoveredRoom('Guest Bedroom')}
                      onMouseLeave={() => setHoveredRoom(null)}
                      className="p-4 rounded-xl bg-emerald-50/80 border-2 border-emerald-300 hover:border-emerald-500 transition-all cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-emerald-950 flex items-center space-x-1.5">
                          <Wind className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Guest Suite &amp; Study (NW)</span>
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-200 text-emerald-900">
                          Vayu (Air)
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 mt-1">14'0" × 12'0" (168 sq.ft) • Cross-Ventilated French Windows</p>
                      <div className="text-[10px] text-slate-500 mt-2 font-mono">North-West breezes provide optimal evening cooling.</div>
                    </div>

                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <span className="text-slate-600">
                    Need customized plot setbacks, floor count allocation, or DXF CAD file exports?
                  </span>
                  <button
                    onClick={() => setRoute('floor-plan')}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shrink-0 flex items-center space-x-1.5 transition-colors shadow-xs"
                  >
                    <Compass className="w-3.5 h-3.5 text-white" />
                    <span>Open CAD Floor Plan Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. SECTION: 6-STEP PLANNING FLOW                              */}
      {/* ============================================================== */}
      <section className="py-20 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 inline-block">
              ENGINEERING METHODOLOGY
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#172033] tracking-tight">
              Six Deterministic Steps to Bank-Ready Quantity Takeoffs
            </h2>
            <p className="text-sm text-[#64748B]">
              Zero black-box guesses. Physical quantities derived mathematically from site boundaries and architectural floor count.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                step: '01',
                title: 'Plot & Site Geometry',
                desc: 'Setback buffers, soil bearing capacity, floor allocation, and target BUA calculated without confusing plot area with SBA.',
                icon: Ruler,
                color: 'text-blue-600',
                bg: 'bg-[#EEF4FF]',
                border: 'border-blue-200'
              },
              {
                step: '02',
                title: 'Spaces & Layouts',
                desc: 'Living, master bedrooms, kitchen, utility, balconies, and circulation cores with aggregate carpet area calculations.',
                icon: Layers,
                color: 'text-cyan-600',
                bg: 'bg-[#ECFEFF]',
                border: 'border-cyan-200'
              },
              {
                step: '03',
                title: 'Material Specifications',
                desc: 'Cement grades, Fe 550D TMT steel brands, vitrified tiles, sanitaryware, and electrical finishes with live state price resolution.',
                icon: Sparkles,
                color: 'text-purple-600',
                bg: 'bg-[#F5F0FF]',
                border: 'border-purple-200'
              },
              {
                step: '04',
                title: 'Itemized BOQ Schedule',
                desc: 'Substructure earthwork, RCC superstructure, masonry blockwork, plastering, waterproofing, and cashflow milestone schedule.',
                icon: FileSpreadsheet,
                color: 'text-emerald-600',
                bg: 'bg-[#ECFDF5]',
                border: 'border-emerald-200'
              },
              {
                step: '05',
                title: '3D Orbit Massing',
                desc: 'Interactive 3D building envelope viewer with 6-stage construction sequence animation and 2D architectural top plan projection.',
                icon: Boxes,
                color: 'text-amber-600',
                bg: 'bg-[#FFFBEB]',
                border: 'border-amber-200'
              },
              {
                step: '06',
                title: 'Formal QS Audit Report',
                desc: 'Standardized schedule with plot dimensions, trade-wise breakups, pre-GST totals, and instant Excel / PDF export.',
                icon: FileCheck2,
                color: 'text-rose-600',
                bg: 'bg-[#FFF1F2]',
                border: 'border-rose-200'
              }
            ].map((st, i) => (
              <div 
                key={i} 
                className={`p-6 rounded-2xl bg-[#F8FAFC] border ${st.border} space-y-3 hover:border-blue-400 hover:shadow-md transition-all text-[#172033]`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl ${st.bg} flex items-center justify-center ${st.color}`}>
                    <st.icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xl font-black text-[#94A3B8]">{st.step}</span>
                </div>
                <h3 className="text-base font-black text-[#172033]">{st.title}</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. SECTION: COMMERCIAL BOQ WORKSPACE SPOTLIGHT                 */}
      {/* ============================================================== */}
      <section className="py-20 bg-[#F0F5FF] border-b border-[#BFDBFE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-5 space-y-5">
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 inline-block">
                QUANTITY SURVEYING SUITE
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#172033] tracking-tight leading-tight">
                Commercial BOQ &amp; Contract Workbooks.
              </h2>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Import contractor tender spreadsheets (.xlsx), extract work items, and benchmark rates against approved Indian state prices. Export formatted spreadsheets and PDF schedules with one click.
              </p>

              <div className="space-y-2.5 pt-2">
                {[
                  'Dual Mode: Mode A (Package SBA Engine) & Mode B (Detailed Itemized Takeoff)',
                  'Three Prominent Actions: Export Excel · Export PDF · Save BOQ',
                  'Live Material Intelligence: Approved State vs National Fallback rates',
                  'Price Search Engine with multi-state rate comparisons'
                ].map((feat, idx) => (
                  <div key={idx} className="flex items-center space-x-2.5 text-xs text-[#334155] font-semibold">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setRoute('commercial-boq')}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-500/20 flex items-center space-x-2 transition-all active:scale-[0.98]"
                >
                  <FileSpreadsheet className="w-4 h-4 text-white" />
                  <span>Launch Commercial BOQ Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Visual BOQ Terminal Mockup (Light Spreadsheet) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-[#CBD5E1] shadow-xl space-y-4 text-[#172033]">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] text-xs">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono text-[10px]">
                    MODE B WORKBOOK
                  </span>
                  <span className="font-bold text-[#172033]">Commercial_Plaza_Tender_Rev3.xlsx</span>
                </div>
                <span className="text-[#64748B] font-mono text-[11px] font-bold">Subtotal: ₹1,48,20,500</span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div className="grid grid-cols-12 text-[10px] text-[#64748B] font-bold uppercase pb-1 border-b border-[#E2E8F0]">
                  <span className="col-span-1">No</span>
                  <span className="col-span-5">Trade Item Description</span>
                  <span className="col-span-2 text-right">Qty</span>
                  <span className="col-span-2 text-right">Rate</span>
                  <span className="col-span-2 text-right">Amount</span>
                </div>

                {[
                  { id: '1.1', desc: 'Earthwork excavation in foundation trenches', qty: '840 m³', rate: '₹340', amt: '₹2,85,600' },
                  { id: '1.2', desc: 'PCC 1:4:8 under column footings (M10)', qty: '120 m³', rate: '₹4,850', amt: '₹5,82,000' },
                  { id: '2.1', desc: 'RCC M25 design mix in column footings', qty: '310 m³', rate: '₹7,200', amt: '₹22,32,000' },
                  { id: '2.2', desc: 'Fe 550D TMT rebar bending & fixing', qty: '42.5 MT', rate: '₹68,500', amt: '₹29,11,250' },
                  { id: '3.1', desc: '200mm solid concrete block masonry in CM 1:6', qty: '1,450 m²', rate: '₹1,250', amt: '₹18,12,500' }
                ].map((row, rIdx) => (
                  <div key={rIdx} className="grid grid-cols-12 py-1.5 border-b border-[#F1F5F9] text-[#334155] text-[11px] items-center">
                    <span className="col-span-1 text-[#94A3B8] font-bold">{row.id}</span>
                    <span className="col-span-5 font-sans font-medium text-[#172033] truncate">{row.desc}</span>
                    <span className="col-span-2 text-right text-blue-600 font-bold">{row.qty}</span>
                    <span className="col-span-2 text-right text-[#475569]">{row.rate}</span>
                    <span className="col-span-2 text-right font-bold text-emerald-700">{row.amt}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 text-xs font-mono text-[#64748B]">
                <span>Net Subtotal + 18% GST Calculated Deterministically</span>
                <span className="text-emerald-700 font-black">Grand Total: ₹1,74,88,190</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. SECTION: AI FLOOR PLAN CAD STUDIO                           */}
      {/* ============================================================== */}
      <section className="py-20 bg-[#FFF8EE] border-b border-[#FDE68A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200 inline-block">
              ARCHITECTURAL VECTOR SOLVER
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#172033] tracking-tight">
              AI Floor Plan Studio &amp; CAD Import
            </h2>
            <p className="text-sm text-[#64748B]">
              Parametric spatial layout engine with Vastu Shastra zoning and closed polyline AutoCAD (.dxf, .dwg) extraction.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 shadow-sm">
            
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#F5F0FF] text-purple-700 flex items-center justify-center font-bold">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-[#172033]">Algorithmic Spatial Zoning</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Generates complete 2D architectural room topologies honoring minimum carpet areas, cross-ventilation window openings, and Vastu alignments (Pooja Northeast, Kitchen Southeast, Master Bedroom Southwest).
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#ECFEFF] text-cyan-700 flex items-center justify-center font-bold">
                <FileCode className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-[#172033]">AutoCAD &amp; DXF Parser</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Upload existing architectural drawings. Our topological extraction pipeline detects room tags, polyline boundaries, door openings, and applies them straight into your project budget.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] text-blue-700 flex items-center justify-center font-bold">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-[#172033]">Vector DXF &amp; SVG Exports</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Download generated layouts as layered AutoCAD DXF or clean SVG files ready for structural engineers, draftsmen, and municipal building sanction applications.
              </p>
            </div>

          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => setRoute('floor-plan')}
              className="px-7 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md shadow-purple-500/20 inline-flex items-center space-x-2 transition-all active:scale-[0.98]"
            >
              <Compass className="w-4 h-4 text-white" />
              <span>Open AI Floor Plan Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. FAQ SECTION                                                 */}
      {/* ============================================================== */}
      <section className="py-20 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#172033] tracking-tight">
              Engineering Calculations &amp; Platform Capabilities
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] overflow-hidden transition-colors shadow-2xs"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left text-xs sm:text-sm font-bold text-[#172033] hover:text-blue-600"
                >
                  <span>{faq.q}</span>
                  {faqOpen[idx] ? <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#94A3B8] shrink-0" />}
                </button>
                {faqOpen[idx] && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-[#475569] leading-relaxed border-t border-[#E2E8F0] pt-3 bg-white">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 7. FINAL CALL TO ACTION BANNER                                */}
      {/* ============================================================== */}
      <section className="py-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-5">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Ready to Plan Your Next Construction Project?
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto">
            Experience deterministic civil estimation, 6-step planning, commercial BOQ spreadsheets, and AI floor plan layouts with zero setup fee.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setRoute('planner', 1)}
              className="px-8 py-3.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-black text-sm shadow-xl shadow-blue-900/20 inline-flex items-center space-x-2 transition-all active:scale-[0.98]"
            >
              <span>Launch Buildiqo.AI Workspace</span>
              <ArrowRight className="w-4 h-4 text-blue-900" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}

export default LandingPage;