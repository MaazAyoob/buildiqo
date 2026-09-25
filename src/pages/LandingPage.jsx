import React, { useState } from 'react';
import { 
  Building2, 
  Calculator, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Layers, 
  TrendingDown, 
  FileSpreadsheet, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Award, 
  Compass, 
  Ruler,
  Clock,
  Check,
  Play
} from 'lucide-react';
import { CITIES } from '../data/cities';
import { TIER_BENCHMARKS } from '../data/materials';
import { useEstimateStore, formatCurrency, formatNumber } from '../store/useEstimateStore';
import { Live3DConstructionViewer } from '../components/common/Live3DConstructionViewer';
import { LiveMaterialPriceTicker } from '../components/common/LiveMaterialPriceTicker';

export function LandingPage({ setRoute }) {
  const { state, updateState, estimation, resetToNewProject } = useEstimateStore();
  const [faqOpen, setFaqOpen] = useState({ 0: true });

  const toggleFaq = (index) => {
    setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleLaunchPlanner = () => {
    setRoute('planner');
  };

  const faqs = [
    {
      q: "How does the Buildiqo.ai cost calculation engine work?",
      a: "Our engine uses deterministic, quantity-based engineering algorithms aligned with IS 456 (Concrete) and IS 1786 (Steel). It calculates physical quantities of structural steel rebar in tonnes, cement bags, masonry blocks, sand, and trade labor derived from your plot dimensions and floor space configurations."
    },
    {
      q: "How does city location affect construction rates?",
      a: "Material logistics, aggregate quarry distances, and regional labor wage guidelines vary across Indian states. The system applies location-based material rate benchmarks calibrated to active market supply dynamics."
    },
    {
      q: "What is the difference between Carpet Area and Built-up Area (BUA)?",
      a: "Carpet Area is the actual usable net internal floor area within the walls of your rooms. Built-up Area (BUA) includes the external walls, column structural footprints, internal partitions, balconies, and staircase shafts (typically 15-20% higher than carpet area)."
    },
    {
      q: "Are statutory fees and supervision margins included?",
      a: "Yes. In the planner and summary report, the system itemizes direct construction costs, architectural & structural design fees, contractor supervision margin, and an explicit safety contingency buffer."
    },
    {
      q: "Can I save multiple project estimates?",
      a: "Yes. You can save, name, duplicate, and switch between multiple configurations in your browser workspace with zero sign-up required."
    }
  ];

  const activeCityObj = CITIES.find(c => c.id === state.city) || CITIES[0];

  return (
    <div className="space-y-16 animate-fadeIn pb-16">
      
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-10 pb-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          {/* Top Pill Tag */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/90 text-slate-800 text-[11px] font-semibold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-slate-900 font-bold">Buildiqo.ai</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600 font-medium">Construction Intelligence Platform</span>
          </div>

          {/* Main Hero Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
            Plan smarter.<br />
            Estimate accurately.<br />
            <span className="text-blue-600">Build with confidence.</span>
          </h1>

          {/* Supporting Text */}
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Buildiqo brings together plot planning, AI floor planning, material intelligence, itemized BOQ calculation, 3D visualization, and formal QS reporting in one cohesive engineering workspace.
          </p>

          {/* Hero Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => { resetToNewProject(); setRoute('planner'); }}
              className="px-6 sm:px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs hover:shadow transition-all flex items-center space-x-2 active:scale-[0.98]"
            >
              <span>Start New Estimate</span>
              <ArrowRight className="w-4 h-4 text-blue-200" />
            </button>
            <button
              onClick={() => setRoute('floor-plan')}
              className="px-5 sm:px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center space-x-2 active:scale-[0.98] shadow-xs"
            >
              <Compass className="w-4 h-4 text-blue-600" />
              <span>Explore AI Floor Plan</span>
            </button>
          </div>

          {/* Factual Feature Bar */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-3 text-[11px] font-medium text-slate-500">
            <span className="flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>AI Floor Planning</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>CAD Import</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Material Intelligence</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>BOQ Intelligence</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Regional Pricing</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>3D Visualization</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>QS Reporting</span>
            </span>
          </div>

          {/* Refined Project Snapshot / Metric Panel (Actual App Data) */}
          <div className="max-w-3xl mx-auto pt-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs text-left">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Project Snapshot</span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-mono text-slate-600">Active Workspace</span>
                </div>
                <button
                  onClick={handleLaunchPlanner}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  <span>Open Planner</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-[11px] text-slate-500 block">Estimated Cost</span>
                  <span className="font-mono tabular-nums text-lg sm:text-xl font-bold text-slate-900 block pt-0.5">
                    {formatCurrency(estimation.grandTotalCost)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Built-Up Area</span>
                  <span className="font-mono tabular-nums text-lg sm:text-xl font-bold text-slate-900 block pt-0.5">
                    {formatNumber(estimation.builtUpAreaSqFt)} <span className="text-xs font-normal text-slate-500">sq.ft</span>
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Regional Hub</span>
                  <span className="text-base sm:text-lg font-bold text-slate-900 block pt-0.5 truncate">
                    {activeCityObj?.name?.split(' ')[0] || 'Bengaluru'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Specification</span>
                  <span className="text-base sm:text-lg font-bold text-slate-900 block pt-0.5 capitalize">
                    {state.tier || 'Standard'}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Live 3D Architectural Construction Phase Card */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <Live3DConstructionViewer
            plotLength={state.plotLength || 40}
            plotWidth={state.plotWidth || 30}
            numFloors={state.numFloors || 2}
            cityName={activeCityObj?.name?.split(' ')[0] || 'Bengaluru'}
            estimation={estimation}
            onLaunchPlanner={handleLaunchPlanner}
          />
        </div>
      </section>

      {/* Live Regional Material Market Rates */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <LiveMaterialPriceTicker
          selectedState={state.state || 'Karnataka'}
          onStateChange={(newState) => updateState({ state: newState })}
        />
      </section>

      {/* Why Planning Matters / Feature Matrix Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-800 bg-blue-50 px-3 py-1 rounded-full">
            Engineering Precision
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            From plot dimensions to structured construction certainty
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Thumb-rule square foot quotes hide major material substitutions, cutting wastages, and unaccounted structural plumbing. Buildiqo.ai gives you full control.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-xs space-y-3.5 hover:border-slate-300 hover:shadow-card transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-blue-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Deterministic BOQ Takeoff</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Calculates structural rebar cutting schedules, cement bags, masonry blockwork volumes, and finish allowances derived from engineering formulas.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-xs space-y-3.5 hover:border-slate-300 hover:shadow-card transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-blue-600">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Granular Space Planning</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Configure room programs per floor. Computes net usable carpet area, circulation zones, wall thicknesses, and built-up area footprints.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-xs space-y-3.5 hover:border-slate-300 hover:shadow-card transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Milestone Cashflow Schedule</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Structured 6-stage payment distribution (Substructure, Plinth, Slabs, Masonry, MEP, and Finishes) aligned with physical site progress.
            </p>
          </div>

        </div>
      </section>

      {/* Material Packages Comparison Matrix */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-7 sm:p-10 border border-slate-200 shadow-card space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Material Specification Packages</h2>
            <p className="text-xs text-slate-500">
              Compare structural and finish benchmarks across residential standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {Object.entries(TIER_BENCHMARKS).map(([tierKey, tierInfo]) => (
              <div 
                key={tierKey}
                className="p-6 rounded-xl border border-slate-200 hover:border-blue-600/40 bg-slate-50/40 hover:bg-white transition-all flex flex-col justify-between space-y-5 shadow-2xs hover:shadow-card"
              >
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
                    {tierInfo.badge}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{tierInfo.name}</h3>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                    {formatCurrency(tierInfo.ratePerSqFt)} <span className="text-xs text-slate-500 font-sans font-normal">/ sq.ft</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">{tierInfo.desc}</p>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-200/80">
                  {tierInfo.highlights.map((h, i) => (
                    <div key={i} className="flex items-center space-x-2 text-xs text-slate-700 font-medium">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    updateState({ tier: tierKey, customMaterials: {} });
                    setRoute('planner', 3);
                  }}
                  className="w-full py-2.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-2xs active:scale-[0.98]"
                >
                  Configure {tierInfo.name.split(' ')[0]}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
          <p className="text-xs text-gray-500">Everything you need to know about home construction estimation</p>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = !!faqOpen[idx];
            return (
              <div 
                key={idx}
                className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
              >
                <div
                  onClick={() => toggleFaq(idx)}
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors"
                >
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900">{faq.q}</h4>
                  <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 ml-4">
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0B0F19] text-white rounded-2xl p-8 sm:p-12 text-center space-y-6 relative overflow-hidden border border-slate-800 shadow-xl">
          <div className="max-w-2xl mx-auto space-y-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-blue-400 font-semibold">Ready to start</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Plan your build with engineering clarity.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              Generate itemized bill of quantities, architectural space solver layouts, and structured stage cashflow schedules.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => { resetToNewProject(); setRoute('planner'); }}
              className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs hover:shadow transition-all inline-flex items-center space-x-2 active:scale-[0.98]"
            >
              <span>Launch Cost Calculator Workspace</span>
              <ArrowRight className="w-4 h-4 text-blue-200" />
            </button>
            <button
              onClick={() => setRoute('floor-plan')}
              className="px-5 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs sm:text-sm transition-all inline-flex items-center space-x-2 active:scale-[0.98]"
            >
              <Compass className="w-4 h-4 text-blue-400" />
              <span>AI Floor Plan Studio</span>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}