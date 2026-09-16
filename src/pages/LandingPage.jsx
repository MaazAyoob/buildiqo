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
      q: "How accurate is the Buildiqo.ai cost calculation?",
      a: "Our engine uses deterministic, quantity-based engineering algorithms aligned with IS 456 (Concrete) and IS 1786 (Steel). It calculates exact quantities of steel rebar in tonnes, cement bags, sand, masonry blocks, and trade labor rather than relying on rough flat rates, achieving within ±3-5% of real market tenders."
    },
    {
      q: "How does city location affect construction rates?",
      a: "Material logistics, aggregate quarry distances, and regional labor wage guidelines vary across India. For example, Mumbai has higher transport logistics and labor overheads (1.22x index), while Bengaluru is our baseline (1.00x) and Hyderabad benefits from competitive cement & steel hubs (0.96x)."
    },
    {
      q: "What is the difference between Carpet Area and Built-up Area (BUA)?",
      a: "Carpet Area is the actual usable net internal floor area within the walls of your rooms. Built-up Area (BUA) includes the external walls, column structural footprints, internal partitions, balconies, and staircase shafts (typically 15-20% higher than carpet area)."
    },
    {
      q: "Are statutory plan approval and architectural fees included?",
      a: "Yes! In Step 4 and the summary report, our system itemizes direct construction costs, architectural & structural design fees (2.5%), contractor supervision margin (10%), and a safety contingency buffer (4%)."
    },
    {
      q: "Can I save multiple project estimates?",
      a: "Yes. You can save, name, duplicate, and switch between multiple house configurations in your browser LocalStorage with zero sign-up required."
    }
  ];

  const activeCityObj = CITIES.find(c => c.id === state.city) || CITIES[0];

  return (
    <div className="space-y-20 animate-fadeIn pb-12">
      
      {/* Hero Section matching screenshot */}
      <section className="relative pt-6 sm:pt-12 pb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          {/* Top Pill Tag */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-blue-50/80 border border-blue-200 text-blue-700 text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-700" />
            <span>Buildiqo.ai QS Engine</span>
          </div>

          {/* Main Hero Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            Build your home <br className="hidden sm:inline" />
            with <span className="text-blue-800 underline decoration-blue-300 decoration-4">clarity</span>.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
            Plan your plot, spaces, materials and construction cost before you build.
          </p>

          {/* Hero Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              onClick={handleLaunchPlanner}
              className="px-6 sm:px-8 py-3.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs sm:text-sm hover:bg-slate-900 shadow-lg hover:shadow-xl transition-all flex items-center space-x-2 group"
            >
              <span>Start Free Estimate</span>
              <ArrowRight className="w-4 h-4 text-amber-200 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={handleLaunchPlanner}
              className="px-5 sm:px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-gray-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors flex items-center space-x-2"
            >
              <Play className="w-3.5 h-3.5 text-blue-800 fill-blue-600" />
              <span>See How It Works</span>
            </button>
          </div>

          {/* Checklist Row matching screenshot */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-2 text-xs font-bold text-gray-600">
            <span className="flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-blue-800" />
              <span>Formula-driven</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-blue-800" />
              <span>Quantity-based</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-blue-800" />
              <span>BOQ-ready</span>
            </span>
          </div>

        </div>

        {/* Live 3D Architectural Construction Phase Card matching screenshot */}
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

      {/* Live Regional Material Market Rates on Landing Page (User Requirement) */}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Deterministic BOQ Takeoff</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Calculates rebar cutting & lapping (5% IS 2502), cement hydration ratios, blockwork volume, and tile cutting wastages down to individual bags and tonnes.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Granular Space Planning</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Design room by room for each floor. The system automatically computes net carpet areas, circulation corridors, and ground coverage compliance against NBC 2016.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Stage-Wise Cashflow Schedule</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Clear 6-stage milestone disbursement plan (Excavation, Plinth, Slabs, Masonry, MEP, and Finishes) so you never overpay contractors in advance.
            </p>
          </div>

        </div>
      </section>

      {/* Material Packages Comparison Matrix */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900">Material Package Comparison</h2>
            <p className="text-xs text-gray-500">
              Compare specifications across all three residential quality standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(TIER_BENCHMARKS).map(([tierKey, tierInfo]) => (
              <div 
                key={tierKey}
                className="p-6 rounded-2xl border border-slate-200 hover:border-stone-900 bg-slate-50/50 hover:bg-blue-50/60/30 transition-all flex flex-col justify-between space-y-6"
              >
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-slate-100 text-gray-700">
                    {tierInfo.badge}
                  </span>
                  <h3 className="text-lg font-black text-slate-900">{tierInfo.name}</h3>
                  <div className="text-2xl font-black text-slate-900">
                    {formatCurrency(tierInfo.ratePerSqFt)} <span className="text-xs text-gray-500 font-normal">/ sq.ft</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{tierInfo.desc}</p>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-200">
                  {tierInfo.highlights.map((h, i) => (
                    <div key={i} className="flex items-center space-x-2 text-xs text-gray-700">
                      <Check className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    updateState({ tier: tierKey, customMaterials: {} });
                    setRoute('planner');
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-slate-900 shadow-sm"
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

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = !!faqOpen[idx];
            return (
              <div 
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div
                  onClick={() => toggleFaq(idx)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <h4 className="text-sm font-bold text-slate-900">{faq.q}</h4>
                  <div className="w-6 h-6 rounded-lg bg-slate-100/60 flex items-center justify-center text-gray-600 shrink-0 ml-4">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-gray-600 leading-relaxed border-t border-slate-100">
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
        <div className="bg-slate-950 text-white rounded-3xl p-8 sm:p-14 text-center space-y-6 relative overflow-hidden shadow-2xl">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Ready to plan your home with engineering clarity?
            </h2>
            <p className="text-xs sm:text-sm text-amber-200">
              Generate your detailed itemized BOQ, interactive 3D model, and milestone payment schedule in under 3 minutes.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleLaunchPlanner}
              className="px-8 py-4 rounded-2xl bg-white text-slate-900 font-extrabold text-sm hover:bg-slate-100/60 shadow-lg hover:shadow-xl transition-all inline-flex items-center space-x-2"
            >
              <span>Launch Cost Calculator Workspace</span>
              <ArrowRight className="w-4 h-4 text-blue-800" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}