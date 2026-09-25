import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Award, 
  Check, 
  HelpCircle,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { MATERIAL_CATEGORIES, TIER_BENCHMARKS } from '../../data/materials';
import { formatCurrency, formatNumber, useEstimateStore } from '../../store/useEstimateStore';

export function StepMaterials({ state, updateState, estimation }) {
  const { toggleBenchmarkMode, isBenchmarkMode, isSnapshotMode, pricingStatus } = useEstimateStore();
  const [openCategories, setOpenCategories] = useState({
    steel: true,
    cement: true,
    flooring: true,
    bathroom: true
  });

  const toggleCategory = (catId) => {
    setOpenCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleSelectMaterial = (categoryId, optionId) => {
    const custom = { ...(state.customMaterials || {}), [categoryId]: optionId };
    updateState({ customMaterials: custom });
  };

  const handleResetToTier = () => {
    updateState({ customMaterials: {} });
  };

  const hasCustomSelections = Object.keys(state.customMaterials || {}).length > 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Pricing Status & Authority Banner (Correction 1) */}
      {isSnapshotMode ? (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-blue-900 font-bold">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
            <div>
              <span className="font-extrabold uppercase tracking-wide">Historical Project Pricing Snapshot</span>
              <p className="text-[11px] text-blue-700 font-medium mt-0.5">
                Estimates are locked to the authoritative rate snapshot captured at project creation. Future rate revisions do not modify this project.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-[10px] uppercase font-black shrink-0">
            Locked Snapshot
          </span>
        </div>
      ) : isBenchmarkMode ? (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 font-bold">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <div>
              <span className="font-extrabold uppercase tracking-wide">Benchmark Mode Active</span>
              <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                Displaying reference catalog benchmark rates. This is NOT live market or approved contractor pricing.
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleBenchmarkMode(false)}
            className="px-3 py-1.5 rounded-xl bg-amber-200/70 hover:bg-amber-200 text-amber-950 text-[11px] font-black shrink-0 transition-colors"
          >
            Switch to Live Approved Pricing
          </button>
        </div>
      ) : estimation.pricingStatus === 'UNAVAILABLE' ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-900 font-bold">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
            <div>
              <span className="font-extrabold uppercase tracking-wide">Production Pricing Unavailable</span>
              <p className="text-[11px] text-red-700 font-medium mt-0.5">
                Approved rates for one or more materials are unavailable in {state.state || 'Karnataka'}. Production estimates will not silently fall back to benchmark rates.
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleBenchmarkMode(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black shrink-0 transition-colors shadow-xs"
          >
            Enable Benchmark Mode
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-emerald-900 font-bold">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <div>
              <span className="font-extrabold uppercase tracking-wide">
                {estimation.pricingScope === 'NATIONAL'
                  ? 'Live Approved Rates Applied (National Baseline Fallback)'
                  : 'Live Approved Rates Applied'}
              </span>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                {estimation.pricingScope === 'NATIONAL'
                  ? `Material pricing resolved from approved National Baseline rates (fallback for ${state.state || 'Karnataka'}).`
                  : `All material pricing resolved from authoritative approved database rates for ${state.state || 'Karnataka'}.`}
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleBenchmarkMode(true)}
            className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-black shrink-0 transition-colors"
          >
            Switch to Benchmark Mode
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Step 3: Materials & Specifications</h2>
            <p className="text-xs text-gray-500 mt-1">
              Select brands, grades, finishes, and warranties. Customize individual materials or apply package presets.
            </p>
          </div>

          {hasCustomSelections && (
            <button
              onClick={handleResetToTier}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100/60 hover:bg-slate-100 text-slate-900 flex items-center space-x-1.5 transition-colors shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-800" />
              <span>Reset to {TIER_BENCHMARKS[state.tier]?.name || 'Standard'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Package Benchmark Cards Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {Object.entries(TIER_BENCHMARKS).map(([tierKey, tierInfo]) => {
          const isSelected = state.tier === tierKey && !hasCustomSelections;
          return (
            <button
              key={tierKey}
              onClick={() => {
                updateState({ tier: tierKey, customMaterials: {} });
              }}
              className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/30 shadow-xs ring-1 ring-blue-600/30'
                  : 'border-slate-200/90 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 inline-block mb-1">
                  {tierInfo.badge}
                </span>
                <h4 className="text-xs font-bold text-slate-900">{tierInfo.name}</h4>
                <div className="text-slate-900 font-mono tabular-nums font-bold text-sm mt-1">
                  {formatCurrency(tierInfo.ratePerSqFt)} <span className="text-[10px] text-slate-400 font-normal">/ sq.ft</span>
                </div>
              </div>
              
              <p className="text-[10px] text-slate-500 mt-2 line-clamp-2">{tierInfo.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Category-by-Category Specifications Accordion */}
      <div className="space-y-4">
        {MATERIAL_CATEGORIES.map((cat) => {
          const isOpen = !!openCategories[cat.id];
          const selectedOption = estimation.selectedMaterials[cat.id] || cat.options[0];

          return (
            <div 
              key={cat.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all"
            >
              {/* Category Bar Header */}
              <div 
                onClick={() => toggleCategory(cat.id)}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 font-semibold">
                        {selectedOption?.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{cat.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-mono tabular-nums font-bold text-slate-900">
                      {selectedOption?.unitRate > 0 ? `${formatCurrency(selectedOption?.unitRate)} ${cat.unit}` : 'Rate Unavailable'}
                    </div>
                    <div className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                      {selectedOption?.rateSource === 'UNAVAILABLE'
                        ? 'Rate Unavailable'
                        : isBenchmarkMode
                          ? 'Benchmark Mode'
                          : isSnapshotMode
                            ? 'Historical Snapshot'
                            : 'Approved Rate'}
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Options Grid when Expanded */}
              {isOpen && (
                <div className="p-4 sm:p-6 bg-slate-50/40 border-t border-slate-200/80">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {cat.options.map((opt) => {
                      const isOptionSelected = selectedOption?.id === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleSelectMaterial(cat.id, opt.id)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                            isOptionSelected
                              ? 'border-blue-600 bg-white shadow-xs ring-1 ring-blue-600/30'
                              : 'border-slate-200/90 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                {opt.tier}
                              </span>
                              {isOptionSelected && (
                                <span className="text-[10px] font-bold text-blue-600 flex items-center space-x-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Selected</span>
                                </span>
                              )}
                            </div>

                            <h4 className="text-xs font-bold text-slate-900">{opt.name}</h4>
                            <div className="text-sm font-mono tabular-nums font-bold text-slate-900 mt-1">
                              {formatCurrency(opt.unitRate)} <span className="text-[10px] text-slate-400 font-normal">{cat.unit}</span>
                            </div>
                            
                            {opt.grade && (
                              <p className="text-[10px] text-blue-600 font-semibold mt-1">Grade: {opt.grade}</p>
                            )}
                            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">{opt.desc}</p>
                          </div>

                          {opt.warranty && (
                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center space-x-1 text-[10px] text-blue-600 font-semibold">
                              <Award className="w-3 h-3 text-blue-600 shrink-0" />
                              <span>{opt.warranty}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}