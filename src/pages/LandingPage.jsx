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
  Boxes
} from 'lucide-react';
import { CITIES } from '../data/cities';
import { TIER_BENCHMARKS } from '../data/materials';
import { useEstimateStore, formatCurrency, formatNumber } from '../store/useEstimateStore';
import { Live3DConstructionViewer } from '../components/common/Live3DConstructionViewer';
import { LiveMaterialPriceTicker } from '../components/common/LiveMaterialPriceTicker';
import { BuildiqoLogo } from '../components/common/BuildiqoLogo';

export function LandingPage({ setRoute }) {
  const { state, updateState, estimation, resetToNewProject } = useEstimateStore();
  const [faqOpen, setFaqOpen] = useState({ 0: true, 1: true });

  const toggleFaq = (index) => {
    setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleLaunchPlanner = (step = 1) => {
    setRoute('planner', step);
  };

  const activeCityObj = CITIES.find(c => c.id === state.city) || CITIES[0];

  const faqs = [
    {
      q: "How does the Buildiqo.ai deterministic cost calculation engine work?",
      a: "Our engine uses deterministic, quantity-surveying algorithms calibrated to Indian Standards IS 456 (Plain & Reinforced Concrete) and IS 1786 (High-Strength Deformed Steel). It calculates physical structural rebar cutting weights in metric tonnes, 50kg cement bags, masonry blockwork volumes, sand/aggregate logistics, and trade labor derived directly from your plot boundaries, floor count, and room configurations."
    },
    {
      q: "How are regional city price indices calculated?",
      a: "Material freight logistics, river sand quarry distances, state GST nuances, and local union labor wage guidelines vary across Indian metropolitan zones. Buildiqo continuously tracks baseline benchmarks for Bengaluru, Mumbai, Delhi NCR, Hyderabad, Pune, and Chennai."
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
    <div className="w-full space-y-0 text-left selection:bg-blue-600 selection:text-white">
      
      {/* ============================================================== */}
      {/* 1. TOP ANNOUNCEMENT BAR (Deep Midnight with Amber Highlight)  */}
      {/* ============================================================== */}
      <div className="w-full bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white text-xs py-2.5 px-4 border-b border-blue-900/60 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="badge-amber text-[9px] py-0.5 px-2 bg-amber-400/20 text-amber-300 border-amber-400/40">
              ✦ BUILDIQO 2.0
            </span>
            <span className="text-slate-200 font-medium">
              Deterministic Civil Cost Estimator &amp; AI Floor Plan Studio with IS 456 BOQ Standards.
            </span>
          </div>
          <button 
            onClick={() => handleLaunchPlanner(1)}
            className="text-amber-400 hover:text-amber-300 font-bold text-xs inline-flex items-center gap-1.5 transition-colors group ml-auto sm:ml-0"
          >
            <span>Launch Quick Estimate</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. HERO SECTION (Light Blue Gradient & Ambient Cobalt Glow)   */}
      {/* ============================================================== */}
      <section className="w-full relative bg-gradient-to-b from-blue-100/75 via-indigo-50/60 to-slate-50 pt-12 sm:pt-16 pb-16 overflow-hidden border-b border-blue-200/80">
        
        {/* Soft Ambient Radial Glows */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[480px] pointer-events-none -z-0 opacity-90"
          style={{
            background: 'radial-gradient(circle at 50% 20%, rgba(37,99,235,0.22), rgba(99,102,241,0.12) 45%, transparent 70%)'
          }}
        />
        <div 
          className="absolute -top-24 right-10 w-96 h-96 pointer-events-none -z-0 opacity-50"
          style={{
            background: 'radial-gradient(circle, rgba(245,158,11,0.18), transparent 70%)'
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
          
          <div className="max-w-4xl mx-auto text-center space-y-6">
            
            {/* Brand Category Tag */}
            <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-white/95 border border-blue-200/90 shadow-2xs text-slate-800 text-[11px] font-semibold backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-slate-900 font-black tracking-tight">Buildiqo.AI Platform</span>
              <span className="text-blue-300">|</span>
              <span className="text-blue-700 font-bold uppercase tracking-wider text-[10px]">CIVIL COST ESTIMATOR &amp; 3D BOQ</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
              Engineering Precision for <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
                Residential &amp; Commercial
              </span> Construction.
            </h1>

            {/* Value Proposition */}
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
              Deterministic quantity takeoff, automated IS 456 steel &amp; cement engineering calculations, algorithmic floor planning, and commercial BOQ workbook management in one unified cloud workspace.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
              <button
                onClick={() => { resetToNewProject(); setRoute('planner'); }}
                className="btn-brand-primary text-sm py-3.5 px-7 shadow-brand hover:shadow-brand-hover active:scale-[0.98]"
                id="hero-start-estimate-btn"
              >
                <Calculator className="w-4 h-4" />
                <span>Launch Cost Calculator</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRoute('floor-plan')}
                className="py-3.5 px-6 rounded-xl bg-white/95 hover:bg-white text-slate-800 border border-blue-200/90 text-sm font-semibold transition-all shadow-sm hover:border-blue-400 hover:text-blue-600 flex items-center space-x-2 active:scale-[0.98]"
                id="hero-ai-floorplan-btn"
              >
                <Compass className="w-4 h-4 text-blue-600" />
                <span>Open AI Floor Plan Studio</span>
              </button>
              <button
                onClick={() => setRoute('commercial-boq')}
                className="py-3.5 px-6 rounded-xl bg-white/95 hover:bg-white text-slate-800 border border-blue-200/90 text-sm font-semibold transition-all shadow-sm hover:border-slate-400 flex items-center space-x-2 active:scale-[0.98]"
                id="hero-commercial-boq-btn"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span>Commercial BOQ</span>
              </button>
            </div>

            {/* Capability Feature Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 pt-3 text-xs font-semibold text-slate-700">
              <span className="flex items-center space-x-1.5 bg-white/80 border border-blue-100 px-3 py-1 rounded-full shadow-2xs">
                <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3] shrink-0" />
                <span>IS 456 &amp; IS 1786 Quantity Engine</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-white/80 border border-blue-100 px-3 py-1 rounded-full shadow-2xs">
                <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3] shrink-0" />
                <span>Deterministic Rebar &amp; Cement Takeoffs</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-white/80 border border-blue-100 px-3 py-1 rounded-full shadow-2xs">
                <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3] shrink-0" />
                <span>AutoCAD DXF &amp; SVG Exports</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-white/80 border border-blue-100 px-3 py-1 rounded-full shadow-2xs">
                <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3] shrink-0" />
                <span>Stage Milestone Cashflow</span>
              </span>
            </div>

            {/* Prominent Active Project Snapshot Card (Rich Tinted Surface) */}
            <div className="max-w-3xl mx-auto pt-4">
              <div className="bg-gradient-to-br from-blue-50/95 via-white to-sky-50/70 border border-blue-200/90 rounded-2xl p-5 sm:p-6 shadow-card text-left transition-all">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-blue-100">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Live Project Baseline</span>
                    <span className="badge-amber text-[9px]">
                      Auto-Calibrated
                    </span>
                  </div>
                  <button
                    onClick={() => handleLaunchPlanner(1)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 group"
                  >
                    <span>Open Planner Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white/80 p-3 rounded-xl border border-blue-100/80 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Estimated Cost</span>
                    <span className="font-mono tabular-nums text-lg sm:text-xl font-black text-blue-700 block pt-0.5">
                      {formatCurrency(estimation.grandTotalCost)}
                    </span>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-blue-100/80 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Built-Up Area</span>
                    <span className="font-mono tabular-nums text-lg sm:text-xl font-black text-slate-900 block pt-0.5">
                      {formatNumber(estimation.builtUpAreaSqFt)} <span className="text-xs font-normal text-slate-500">sq.ft</span>
                    </span>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-blue-100/80 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Regional Hub</span>
                    <span className="text-base sm:text-lg font-black text-slate-900 block pt-0.5 truncate">
                      {activeCityObj?.name?.split(' ')[0] || 'Bengaluru'}
                    </span>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-blue-100/80 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Material Tier</span>
                    <span className="text-base sm:text-lg font-black text-blue-900 block pt-0.5 capitalize">
                      {state.tier || 'Standard'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* 3D Architectural Viewer Viewport (Deep Navy Frame with Ambient Glow) */}
          <div className="max-w-5xl mx-auto rounded-3xl border border-blue-900/40 shadow-[0_20px_60px_-15px_rgba(37,99,235,0.22)] overflow-hidden">
            <Live3DConstructionViewer
              plotLength={state.plotLength || 40}
              plotWidth={state.plotWidth || 30}
              numFloors={state.numFloors || 2}
              cityName={activeCityObj?.name?.split(' ')[0] || 'Bengaluru'}
              estimation={estimation}
              onLaunchPlanner={() => handleLaunchPlanner(1)}
            />
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. LIVE MATERIAL TICKER (Tinted Blue Band)                     */}
      {/* ============================================================== */}
      <section className="w-full bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-blue-50/70 py-6 border-b border-blue-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LiveMaterialPriceTicker
            selectedState={state.state || 'Karnataka'}
            onStateChange={(newState) => updateState({ state: newState })}
          />
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. TRUST & CAPABILITIES (Cool Surface with Coordinated Cards)  */}
      {/* ============================================================== */}
      <section className="w-full bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50 py-16 sm:py-20 border-b border-blue-100/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="badge-brand">
              Engineering Precision vs Guesswork
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Built for Architects, Civil Engineers, and Serious Property Owners.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Generic square-foot estimates hide devastating material substitutions, non-standard rebar cutting wastages, and unbudgeted structural MEP. Buildiqo establishes line-item transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Light Blue Tinted */}
            <div className="bg-gradient-to-br from-blue-50/95 via-sky-50/50 to-white border border-blue-200/90 hover:border-blue-400 shadow-sm hover:shadow-card transition-all rounded-2xl p-7 space-y-4 border-t-4 border-t-blue-600 group">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-brand transition-transform group-hover:scale-105">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded">
                  IS 456 QUANTITY TAKEOFF
                </span>
                <h3 className="text-lg font-bold text-slate-900">Deterministic BOQ Takeoff</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Calculates structural steel rebar tonnage, cement bag requirements, masonry volumes, sand, aggregate, plumbing fittings, and trade labor directly from physical plot parameters.
              </p>
              <div className="pt-3 border-t border-blue-100 flex items-center justify-between text-xs font-bold text-blue-700">
                <span>IS 456 Concrete Schedule</span>
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
            </div>

            {/* Card 2: Pale Cobalt / Indigo Tinted */}
            <div className="bg-gradient-to-br from-indigo-50/95 via-blue-50/50 to-white border border-indigo-200/90 hover:border-indigo-400 shadow-sm hover:shadow-card transition-all rounded-2xl p-7 space-y-4 border-t-4 border-t-indigo-600 group">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-brand transition-transform group-hover:scale-105">
                <Compass className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded">
                  ALGORITHMIC SOLVER
                </span>
                <h3 className="text-lg font-bold text-slate-900">AI Floor Plan Studio</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Algorithmic architectural workspace that respects municipal setbacks, room adjacency graphs, circulation passages, and directional orientations. Generates instant CAD vector layouts.
              </p>
              <div className="pt-3 border-t border-indigo-100 flex items-center justify-between text-xs font-bold text-indigo-700">
                <span>AutoCAD DXF &amp; SVG Exports</span>
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              </div>
            </div>

            {/* Card 3: Pale Warm Amber Tinted */}
            <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white border border-amber-200/90 hover:border-amber-400 shadow-sm hover:shadow-card transition-all rounded-2xl p-7 space-y-4 border-t-4 border-t-amber-500 group">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-amber transition-transform group-hover:scale-105">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">
                  DISBURSEMENT SCHEDULE
                </span>
                <h3 className="text-lg font-bold text-slate-900">Stage Milestone Cashflow</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Structured 6-milestone payment release schedule (Substructure, Plinth, RCC Framing, Masonry &amp; Plaster, MEP, and Finishes) aligned with verified site inspections.
              </p>
              <div className="pt-3 border-t border-amber-100 flex items-center justify-between text-xs font-bold text-amber-800">
                <span>Progress-Linked Releases</span>
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. PROCESS WORKFLOW (Light-Blue Section Band with Step Cards)  */}
      {/* ============================================================== */}
      <section className="w-full bg-gradient-to-b from-blue-50/80 via-indigo-50/50 to-blue-50/70 py-16 sm:py-20 border-b border-blue-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="badge-brand">Workflow</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
              How the Buildiqo Platform Operates
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              From plot dimensions to bank-ready QS documentation in 4 structured steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            
            {/* Step 1 */}
            <div className="bg-white/95 border border-blue-200/90 rounded-2xl p-6 space-y-3.5 shadow-sm hover:shadow-card transition-all relative">
              <div className="flex items-center justify-between">
                <span className="font-mono text-2xl font-black text-blue-600 bg-blue-50 w-10 h-10 rounded-xl flex items-center justify-center border border-blue-100">
                  01
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Boundary</span>
              </div>
              <h4 className="text-base font-bold text-slate-900">Plot &amp; Setback Setup</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter plot width, length, facing direction, floor count, and front/rear municipal setbacks.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                <span>Configure Site Parameters</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white/95 border border-blue-200/90 rounded-2xl p-6 space-y-3.5 shadow-sm hover:shadow-card transition-all relative">
              <div className="flex items-center justify-between">
                <span className="font-mono text-2xl font-black text-blue-600 bg-blue-50 w-10 h-10 rounded-xl flex items-center justify-center border border-blue-100">
                  02
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Layout</span>
              </div>
              <h4 className="text-base font-bold text-slate-900">Spaces &amp; Floor Plan</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generate or configure room layouts, carpet area, wall partitions, and circulation corridors.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                <span>AI Architectural Solver</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white/95 border border-blue-200/90 rounded-2xl p-6 space-y-3.5 shadow-sm hover:shadow-card transition-all relative">
              <div className="flex items-center justify-between">
                <span className="font-mono text-2xl font-black text-blue-600 bg-blue-50 w-10 h-10 rounded-xl flex items-center justify-center border border-blue-100">
                  03
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Specification</span>
              </div>
              <h4 className="text-base font-bold text-slate-900">Specification &amp; Grade</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Select steel rebar grade (Fe 500D / 550D), cement brand, vitrified tiles, sanitary fixtures, and paint.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                <span>Material Benchmark Rates</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Step 4 (Highlighted with Amber Accent) */}
            <div className="bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 border-2 border-amber-400 rounded-2xl p-6 space-y-3.5 shadow-md hover:shadow-card transition-all relative">
              <div className="flex items-center justify-between">
                <span className="font-mono text-2xl font-black text-amber-700 bg-amber-100 w-10 h-10 rounded-xl flex items-center justify-center border border-amber-200">
                  04
                </span>
                <span className="badge-amber text-[9px] py-0.5 px-2">
                  FINAL QS AUDIT
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-900">BOQ Takeoff &amp; Reports</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Review itemized trade totals, cashflow releases, and download PDF / Excel QS reports instantly.
              </p>
              <div className="pt-2 text-[11px] font-bold text-amber-700 flex items-center gap-1">
                <span>Client &amp; Bank-Ready PDF</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. AI FLOOR PLAN STUDIO SHOWCASE (Dark Midnight/Cobalt Band)  */}
      {/* ============================================================== */}
      <section className="w-full bg-gradient-to-b from-slate-950 via-[#0B0F19] to-slate-950 text-white py-20 sm:py-24 border-y border-blue-900/60 relative overflow-hidden">
        
        {/* Ambient Cobalt Radial Glow behind CAD Preview */}
        <div 
          className="absolute top-1/2 right-10 -translate-y-1/2 w-[650px] h-[500px] pointer-events-none opacity-40 -z-0"
          style={{
            background: 'radial-gradient(circle at 60% 50%, rgba(37,99,235,0.3), rgba(29,78,216,0.15) 45%, transparent 70%)'
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="badge-amber">
                ✦ SPECIALIST ARCHITECTURAL WORKSPACE
              </div>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                AI Floor Plan Studio: <br />
                <span className="text-blue-400">Algorithmic Spatial</span> Planning.
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Stop starting from blank sketches. Our algorithmic solver places living rooms, master bedrooms, kitchens, and circulation stairs within your exact plot boundary and municipal setbacks.
              </p>
              
              <div className="space-y-3 pt-2 text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Directional facing and Vastu-compliant room allocations</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Multi-floor vertical zoning with staircase alignment</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Interactive room inspector with live dimension adjustments</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Export directly to vector SVG and AutoCAD DXF formats</span>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-3.5">
                <button
                  onClick={() => setRoute('floor-plan')}
                  className="btn-brand-primary text-xs py-3.5 px-7 shadow-brand hover:shadow-brand-hover"
                >
                  <Compass className="w-4 h-4" />
                  <span>Open AI Floor Plan Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleLaunchPlanner(2)}
                  className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-all shadow-sm"
                >
                  <span>Manual Space Program</span>
                </button>
              </div>
            </div>

            {/* Right: Technical CAD Blueprint Viewport */}
            <div className="lg:col-span-6">
              <div className="cad-dark-viewport p-6 sm:p-7 rounded-3xl border border-blue-500/40 shadow-[0_20px_60px_-15px_rgba(37,99,235,0.3)] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="text-[11px] font-mono text-slate-300 ml-2 font-semibold">CAD Viewport: 30 × 40 ft Plot</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                    GROUND FLOOR
                  </span>
                </div>

                {/* Vector Blueprint Mockup */}
                <div className="relative aspect-4/3 bg-slate-950/90 rounded-2xl border border-blue-900/60 p-4 flex items-center justify-center overflow-hidden">
                  <svg viewBox="0 0 400 300" className="w-full h-full text-slate-400" fill="none">
                    {/* Plot boundary */}
                    <rect x="20" y="20" width="360" height="260" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
                    <text x="25" y="16" fill="#64748B" fontSize="10" fontFamily="monospace">PLOT BOUNDARY: 30&apos; × 40&apos;</text>
                    
                    {/* Setbacks */}
                    <rect x="40" y="45" width="320" height="215" stroke="#2563EB" strokeWidth="2.5" fill="#1E293B" fillOpacity="0.4" />
                    
                    {/* Living Room */}
                    <rect x="45" y="50" width="170" height="120" stroke="#60A5FA" strokeWidth="1.5" fill="#1D4ED8" fillOpacity="0.25" />
                    <text x="75" y="110" fill="#93C5FD" fontSize="12" fontWeight="bold">LIVING ROOM</text>
                    <text x="85" y="125" fill="#64748B" fontSize="9" fontFamily="monospace">16&apos;0&quot; × 12&apos;0&quot;</text>
                    
                    {/* Kitchen */}
                    <rect x="220" y="50" width="140" height="95" stroke="#F59E0B" strokeWidth="1.5" fill="#D97706" fillOpacity="0.2" />
                    <text x="260" y="95" fill="#FCD34D" fontSize="11" fontWeight="bold">KITCHEN</text>
                    <text x="265" y="110" fill="#64748B" fontSize="9" fontFamily="monospace">10&apos;0&quot; × 8&apos;6&quot;</text>

                    {/* Master Bedroom */}
                    <rect x="45" y="175" width="190" height="80" stroke="#38BDF8" strokeWidth="1.5" fill="#0284C7" fillOpacity="0.2" />
                    <text x="75" y="215" fill="#BAE6FD" fontSize="11" fontWeight="bold">MASTER BEDROOM</text>
                    <text x="85" y="230" fill="#64748B" fontSize="9" fontFamily="monospace">14&apos;0&quot; × 11&apos;0&quot;</text>

                    {/* Toilet / Bath */}
                    <rect x="240" y="150" width="120" height="105" stroke="#A78BFA" strokeWidth="1.5" fill="#7C3AED" fillOpacity="0.2" />
                    <text x="270" y="200" fill="#DDD6FE" fontSize="11" fontWeight="bold">BATH &amp; WC</text>
                    <text x="275" y="215" fill="#64748B" fontSize="9" fontFamily="monospace">8&apos;0&quot; × 6&apos;0&quot;</text>
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono pt-1">
                  <span>Carpet: <strong className="text-white">890 sq.ft</strong></span>
                  <span>BUA: <strong className="text-white">1,112 sq.ft</strong></span>
                  <span className="text-emerald-400 font-bold">Vastu Compliance: 94%</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 7. COMMERCIAL BOQ (Pale Blue / Lavender-Tinted Band)          */}
      {/* ============================================================== */}
      <section className="w-full bg-gradient-to-b from-indigo-50/50 via-blue-50/40 to-slate-50 py-16 sm:py-20 border-b border-blue-100/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-blue-200/60">
            <div className="space-y-2">
              <span className="badge-brand">Commercial Quantity Surveying</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
                Commercial BOQ Workbook Module
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
                Multi-trade quantity takeoff with line-item editing, regional material rates, compound labor rates, GST calculations, and Excel exports.
              </p>
            </div>
            <button
              onClick={() => setRoute('commercial-boq')}
              className="btn-brand-primary text-xs py-3 px-6 shadow-brand self-start md:self-auto"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Open Commercial BOQ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Civil & Structural */}
            <div className="bg-gradient-to-br from-blue-50/90 to-white border border-blue-200 rounded-2xl p-5 space-y-3 shadow-xs hover:shadow-card transition-all">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                RCC
              </div>
              <h4 className="text-sm font-bold text-slate-900">Civil &amp; Structural</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Earthwork excavation, PCC, RCC column footing, plinth beams, slab casting, and reinforcement tie work.
              </p>
            </div>

            {/* Masonry & Plaster */}
            <div className="bg-gradient-to-br from-slate-100/80 to-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs hover:shadow-card transition-all">
              <div className="w-9 h-9 rounded-lg bg-slate-800 text-white flex items-center justify-center font-black text-xs shadow-xs">
                BLK
              </div>
              <h4 className="text-sm font-bold text-slate-900">Masonry &amp; Plaster</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                6&quot; and 4&quot; solid concrete blocks, red bricks, cement mortar 1:6, internal sponge finish, and external double coat.
              </p>
            </div>

            {/* Plumbing & Sanitary */}
            <div className="bg-gradient-to-br from-cyan-50/80 to-white border border-cyan-200 rounded-2xl p-5 space-y-3 shadow-xs hover:shadow-card transition-all">
              <div className="w-9 h-9 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                MEP
              </div>
              <h4 className="text-sm font-bold text-slate-900">Plumbing &amp; Sanitary</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                CPVC/UPVC water supply, SWR drainage stacks, inspection chambers, overhead storage, and bathroom fixtures.
              </p>
            </div>

            {/* Electrical & HVAC */}
            <div className="bg-gradient-to-br from-amber-50/80 to-white border border-amber-200 rounded-2xl p-5 space-y-3 shadow-xs hover:shadow-card transition-all">
              <div className="w-9 h-9 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs">
                ELE
              </div>
              <h4 className="text-sm font-bold text-slate-900">Electrical &amp; HVAC</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Concealed FRLS copper wiring, distribution boards, MCB protection, modular switches, and earthing pits.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 8. MATERIAL PACKAGES (Light Gradient Band with Distinct Tints) */}
      {/* ============================================================== */}
      <section className="w-full bg-gradient-to-b from-white via-blue-50/40 to-slate-50 py-16 sm:py-20 border-b border-blue-100/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="badge-brand">Standardized Tiers</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Material Specification Packages
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Compare structural and finish benchmarks calibrated across Indian residential construction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {Object.entries(TIER_BENCHMARKS).map(([tierKey, tierInfo]) => {
              const isPremium = tierKey === 'premium';
              const isLuxury = tierKey === 'luxury';

              return (
                <div 
                  key={tierKey}
                  className={`rounded-3xl p-7 flex flex-col justify-between space-y-6 transition-all relative ${
                    isPremium 
                      ? 'bg-gradient-to-b from-blue-50/95 via-sky-50/40 to-white border-2 border-blue-600 shadow-brand ring-4 ring-blue-500/10' 
                      : isLuxury 
                      ? 'bg-gradient-to-b from-amber-50/80 via-white to-amber-50/20 border-2 border-amber-300 shadow-sm'
                      : 'bg-gradient-to-b from-slate-50 via-white to-slate-50 border border-slate-300 shadow-sm'
                  }`}
                >
                  {isPremium && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-blue-600 text-white text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full shadow-xs">
                        MOST POPULAR SPECIFICATION
                      </span>
                    </div>
                  )}

                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded ${
                        isPremium ? 'bg-blue-600 text-white' : isLuxury ? 'badge-amber' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {tierInfo.badge}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-black text-slate-900">{tierInfo.name}</h3>
                    
                    <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 flex items-baseline">
                      {formatCurrency(tierInfo.ratePerSqFt)} 
                      <span className="text-xs text-slate-500 font-sans font-normal ml-1">/ sq.ft</span>
                    </div>
                    
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">{tierInfo.desc}</p>
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-slate-200/80">
                    {tierInfo.highlights.map((h, i) => (
                      <div key={i} className="flex items-center space-x-2 text-xs text-slate-700 font-semibold">
                        <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3] shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      updateState({ tier: tierKey, customMaterials: {} });
                      setRoute('planner', 3);
                    }}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.98] ${
                      isPremium 
                        ? 'btn-brand-primary' 
                        : 'bg-white border border-slate-300 text-slate-800 hover:border-blue-600 hover:text-blue-600'
                    }`}
                  >
                    Configure {tierInfo.name.split(' ')[0]} Tier
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 9. TECHNICAL FAQ (Cool Neutral / Pale Blue Band)               */}
      {/* ============================================================== */}
      <section className="w-full bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50 py-16 sm:py-20 border-b border-blue-100/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-3">
            <span className="badge-brand">Clarity &amp; Architecture</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Everything you need to know about engineering estimation, regional rates, and deliverables.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = !!faqOpen[idx];
              return (
                <div 
                  key={idx}
                  className={`rounded-2xl transition-all border overflow-hidden ${
                    isOpen 
                      ? 'bg-gradient-to-r from-blue-50/60 via-white to-indigo-50/40 border-blue-300 shadow-sm' 
                      : 'bg-white/90 border-blue-100/80 hover:border-blue-300 shadow-2xs'
                  }`}
                >
                  <div
                    onClick={() => toggleFaq(idx)}
                    className="p-4 sm:p-5 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{faq.q}</h4>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ml-4 transition-colors ${
                      isOpen ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-blue-100/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 10. FINAL CTA BANNER (Deep Midnight / Cobalt Gradient)         */}
      {/* ============================================================== */}
      <section className="w-full bg-gradient-to-b from-slate-900 to-slate-950 py-18 sm:py-24 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950 rounded-3xl p-8 sm:p-14 text-center space-y-6 relative overflow-hidden border border-blue-800/80 shadow-2xl">
            
            {/* Ambient Lighting Effect */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] pointer-events-none opacity-30"
              style={{
                background: 'radial-gradient(circle, rgba(37,99,235,0.4), transparent 70%)'
              }}
            />

            <div className="max-w-2xl mx-auto space-y-3 relative z-10">
              <span className="badge-amber bg-amber-400/20 text-amber-300 border-amber-400/40">
                ✦ INSTANT WORKSPACE ACCESS
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Start Planning Your Construction Project Today.
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                Generate itemized bill of quantities, architectural space solver layouts, and structured stage cashflow schedules with engineering confidence.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5 relative z-10">
              <button
                onClick={() => { resetToNewProject(); setRoute('planner'); }}
                className="btn-brand-primary text-sm py-4 px-8 shadow-brand hover:shadow-brand-hover active:scale-[0.98]"
              >
                <Calculator className="w-4 h-4" />
                <span>Launch Cost Calculator Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRoute('floor-plan')}
                className="px-6 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition-all inline-flex items-center space-x-2 active:scale-[0.98] shadow-sm"
              >
                <Compass className="w-4 h-4 text-blue-400" />
                <span>Open AI Floor Plan Studio</span>
              </button>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}

export default LandingPage;