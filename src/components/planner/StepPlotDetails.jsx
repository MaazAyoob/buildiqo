import React, { useState } from 'react';
import { 
  MapPin, 
  Ruler, 
  Layers, 
  Sparkles, 
  Compass, 
  Trees, 
  ShieldCheck, 
  Check, 
  Plus,
  Trash2,
  Building,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  HardHat
} from 'lucide-react';
import { CITIES, SOIL_TYPES } from '../../data/cities';
import { INDIAN_STATES, normalizeStateName } from '../../data/states';
import { TIER_BENCHMARKS } from '../../data/materials';
import { BUILDING_TYPES, CONSTRUCTION_TYPES, AREA_UNITS } from '../../data/defaults';
import { formatCurrency, formatNumber, useEstimateStore } from '../../store/useEstimateStore';

export function StepPlotDetails({ state, updateState, estimation }) {
  const { subscription } = useEstimateStore();
  const isFreePlan = subscription?.planId === 'free';
  const [errors, setErrors] = useState({});

  const plotPresets = [
    { label: '30 × 40', w: 30, l: 40, area: 1200, tag: 'Standard 1200 sq.ft' },
    { label: '30 × 50', w: 30, l: 50, area: 1500, tag: 'Spacious 1500 sq.ft' },
    { label: '40 × 60', w: 40, l: 60, area: 2400, tag: 'Large 2400 sq.ft' },
    { label: '50 × 80', w: 50, l: 80, area: 4000, tag: 'Villa 4000 sq.ft' }
  ];

  const handlePresetClick = (w, l) => {
    updateState({ plotWidth: w, plotLength: l });
    clearError('dimensions');
  };

  const handleFloorsChange = (count) => {
    const numFloors = Math.max(1, Math.min(6, count));
    let newFloors = [...state.floors];
    
    if (numFloors > newFloors.length) {
      for (let i = newFloors.length; i < numFloors; i++) {
        const floorName = i === 1 ? '1st Floor' : i === 2 ? '2nd Floor' : i === 3 ? '3rd Floor' : `${i}th Floor`;
        newFloors.push({
          id: `floor-${i}`,
          name: floorName,
          floorNumber: i,
          targetBua: newFloors[0]?.targetBua || 950,
          rooms: [
            { id: `r-${i}-1`, type: 'master_bed', name: 'Master Suite', width: 14, length: 15, count: 1 },
            { id: `r-${i}-2`, type: 'attached_bath', name: 'En-suite Bath', width: 8, length: 5, count: 1 },
            { id: `r-${i}-3`, type: 'regular_bed', name: 'Guest Room', width: 12, length: 13, count: 1 },
            { id: `r-${i}-4`, type: 'living', name: 'Lounge / Balcony', width: 12, length: 12, count: 1 },
            { id: `r-${i}-5`, type: 'staircase', name: 'Staircase Area', width: 8, length: 12, count: 1 }
          ]
        });
      }
    } else if (numFloors < newFloors.length) {
      newFloors = newFloors.slice(0, numFloors);
    }

    updateState({ numFloors, floors: newFloors });
  };

  const handleAddFloor = () => {
    handleFloorsChange((state.numFloors || 2) + 1);
  };

  const handleRemoveFloor = () => {
    if ((state.numFloors || 2) > 1) {
      handleFloorsChange((state.numFloors || 2) - 1);
    }
  };

  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
  };

  const currentPlotArea = (state.plotWidth || 30) * (state.plotLength || 40);
  const currentUnit = AREA_UNITS.find(u => u.id === state.areaUnit) || AREA_UNITS[0];

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Banner / Heading */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider">
                Site setup
              </span>
              <h2 className="text-xl font-extrabold text-slate-900">Step 1: Site & Building Setup</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter site project details, plot dimensions, building typology, and target construction package.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-blue-50/60 px-3.5 py-2 rounded-xl border border-blue-200 shrink-0">
            <ShieldCheck className="w-5 h-5 text-blue-800" />
            <div>
              <span className="text-[11px] font-bold text-slate-900 block">IS 456 & NBC 2016 Compliant</span>
              <span className="text-[10px] text-blue-700">Deterministic Quantity Algorithm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Project identity and site location */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <Building className="w-4 h-4 text-blue-800" />
          <span>Project Identification & Site Location</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Project Name */}
          <div className="sm:col-span-1">
            <label className="text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
              <span>Project Name *</span>
              <span className="text-[10px] text-blue-800 font-semibold">Mandatory</span>
            </label>
            <input
              type="text"
              value={state.projectName || ''}
              onChange={(e) => {
                updateState({ projectName: e.target.value });
                clearError('projectName');
              }}
              placeholder="e.g. Skyline Residence / Green Villa"
              className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-slate-50/50"
            />
          </div>

          {/* State Selector (Authoritative Pricing Scope) */}
          <div className="sm:col-span-1">
            <label className="text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-800" />
                <span>State (Pricing Authority) *</span>
              </span>
              <span className="text-[10px] text-green-700 font-semibold bg-green-50 px-1.5 py-0.2 rounded">Live Verified</span>
            </label>
            <select
              value={state.state || 'Karnataka'}
              onChange={(e) => updateState({ state: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white cursor-pointer"
            >
              {INDIAN_STATES.map(s => (
                <option key={s.id} value={s.name}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Location Selector (Physical Custom Input) */}
          <div className="sm:col-span-1">
            <label className="text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Building className="w-3.5 h-3.5 text-gray-500" />
                <span>City / Site Location</span>
              </span>
              <span className="text-[10px] text-gray-500 font-semibold">Physical Entry</span>
            </label>
            <input
              type="text"
              value={state.city || 'Bengaluru'}
              onChange={(e) => {
                const cityVal = e.target.value;
                const autoState = normalizeStateName(cityVal);
                updateState({ 
                  city: cityVal, 
                  ...(autoState && !state.hasCustomState ? { state: autoState } : {}) 
                });
              }}
              placeholder="Enter your city (e.g. Bengaluru, Mumbai, Pune)"
              className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-slate-50/50"
            />
          </div>

          {/* Area Unit Selector */}
          <div className="sm:col-span-1">
            <label className="text-xs font-bold text-gray-700 mb-1.5 block">
              Measurement Unit
            </label>
            <select
              value={state.areaUnit || 'sqft'}
              onChange={(e) => updateState({ areaUnit: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
            >
              {AREA_UNITS.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Building and construction typology */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <HardHat className="w-4 h-4 text-blue-800" />
          <span>Building Typology & Structural Construction Type</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Building Type */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Building Type</label>
            <div className="space-y-2">
              {BUILDING_TYPES.map(bt => {
                const isSelected = (state.buildingType || 'villa_duplex') === bt.id;
                return (
                  <div
                    key={bt.id}
                    onClick={() => updateState({ buildingType: bt.id })}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start space-x-2.5 ${
                      isSelected ? 'border-blue-700 bg-blue-50/60/80 ring-2 ring-blue-700/20' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-stone-900 bg-blue-600 text-white' : 'border-gray-300'
                    }`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{bt.name}</p>
                      <p className="text-[10px] text-gray-500">{bt.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Construction Type */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Structural Construction Type</label>
            <div className="space-y-2">
              {CONSTRUCTION_TYPES.map(ct => {
                const isSelected = (state.constructionType || 'rcc_framed') === ct.id;
                return (
                  <div
                    key={ct.id}
                    onClick={() => updateState({ constructionType: ct.id })}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start space-x-2.5 ${
                      isSelected ? 'border-blue-700 bg-blue-50/60/80 ring-2 ring-blue-700/20' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-stone-900 bg-blue-600 text-white' : 'border-gray-300'
                    }`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{ct.name}</p>
                      <p className="text-[10px] text-gray-500">{ct.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Plot dimensions and floor count */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Plot Dimensions & Presets (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Ruler className="w-4 h-4 text-blue-800" />
              <span>Plot Geometry & Dimensions (L × W)</span>
            </h3>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
              {formatNumber(currentPlotArea)} sq.ft ({((currentPlotArea) / 9).toFixed(1)} sq.yd)
            </span>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Standard Plot Presets</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {plotPresets.map((p) => {
                const isActive = state.plotWidth === p.w && state.plotLength === p.l;
                return (
                  <button
                    key={p.label}
                    onClick={() => handlePresetClick(p.w, p.l)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isActive 
                        ? 'border-blue-700 bg-blue-50/60/80 ring-2 ring-blue-700/20' 
                        : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-extrabold text-slate-900 block">{p.label} ft</span>
                    <span className="text-[10px] text-gray-500">{p.tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom dimension inputs with validation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                <span>Plot Width (Frontage) *</span>
                <span className="text-[11px] text-gray-400">Feet (ft)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="15"
                  max="300"
                  value={state.plotWidth || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= 0) updateState({ plotWidth: val });
                    clearError('dimensions');
                  }}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-slate-50/50"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-gray-400 font-medium">ft</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                <span>Plot Depth (Length) *</span>
                <span className="text-[11px] text-gray-400">Feet (ft)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="20"
                  max="500"
                  value={state.plotLength || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= 0) updateState({ plotLength: val });
                    clearError('dimensions');
                  }}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-slate-50/50"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-gray-400 font-medium">ft</span>
              </div>
            </div>
          </div>

          {/* Road Width & Facing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 flex items-center space-x-1.5">
                <Compass className="w-3.5 h-3.5 text-blue-800" />
                <span>Plot Orientation Facing</span>
              </label>
              <select
                value={state.facing || 'North'}
                onChange={(e) => updateState({ facing: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
              >
                <option value="North">North Facing (Auspicious / Optimal Light)</option>
                <option value="East">East Facing (Morning Sun / Vastu Compliant)</option>
                <option value="South">South Facing</option>
                <option value="West">West Facing (Evening Breeze)</option>
                <option value="North-East">North-East Corner</option>
                <option value="South-East">South-East</option>
                <option value="North-West">North-West</option>
                <option value="South-West">South-West</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                Front Road Width (ft)
              </label>
              <select
                value={state.roadWidth || 30}
                onChange={(e) => updateState({ roadWidth: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
              >
                <option value="20">20 ft (Narrow Lane / FAR 1.5)</option>
                <option value="30">30 ft (Standard Residential / FAR 1.75)</option>
                <option value="40">40 ft (Wide Residential / FAR 2.25)</option>
                <option value="60">60 ft (Avenue / High FAR Access)</option>
                <option value="80">80+ ft (Main Arterial)</option>
              </select>
            </div>
          </div>

          {/* Number of Floors with Add & Remove Option */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-blue-800" />
                <span>Elevation Floors (Add / Remove Floors)</span>
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRemoveFloor}
                  disabled={(state.numFloors || 2) <= 1}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-gray-700 hover:bg-slate-100/60 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
                  title="Remove top floor"
                >
                  <span>- Remove Floor</span>
                </button>
                <button
                  onClick={handleAddFloor}
                  disabled={(state.numFloors || 2) >= 6}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
                  title="Add new floor"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Floor</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map((num) => {
                const isSelected = state.numFloors === num;
                return (
                  <button
                    key={num}
                    onClick={() => handleFloorsChange(num)}
                    className={`py-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white border-stone-900 shadow-sm'
                        : 'border-slate-200 text-gray-700 hover:bg-slate-100/60'
                    }`}
                  >
                    {num === 1 ? 'G Only' : `G + ${num - 1}`}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Location & Soil Conditions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Soil Condition Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Trees className="w-4 h-4 text-blue-800" />
              <span>Soil Strata & Foundation Type</span>
            </h3>

            <div className="space-y-2">
              {SOIL_TYPES.map((s) => {
                const isSelected = (state.soilType || 'medium') === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => updateState({ soilType: s.id })}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start space-x-2.5 ${
                      isSelected
                        ? 'border-blue-700 bg-blue-50/60/80 ring-2 ring-blue-700/20'
                        : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-stone-900 bg-blue-600 text-white' : 'border-gray-300'
                    }`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{s.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{s.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Built-up Area Target Mode */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Target Built-up Area (BUA)</span>
              <span className="text-[10px] font-bold text-blue-800">Auto / Override</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={state.targetBuaInput || ''}
                onChange={(e) => updateState({ targetBuaInput: Number(e.target.value) || 0 })}
                placeholder={`Auto: ${formatNumber(estimation.totalBuiltupArea)} sq.ft`}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-slate-50/50"
              />
              {state.targetBuaInput > 0 && (
                <button
                  onClick={() => updateState({ targetBuaInput: 0 })}
                  className="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-100 rounded-lg shrink-0"
                >
                  Reset Auto
                </button>
              )}
            </div>
            <p className="text-[10px] text-gray-500">
              Leave blank to automatically calculate BUA from individual room layouts in Step 2.
            </p>
          </div>

        </div>

      </div>

      {/* Quality Tier Selector (Full Width) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-blue-800" />
            <span>Select Construction Quality Tier</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Choose a curated material & finish tier. You can also customize individual items in Step 3.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(TIER_BENCHMARKS).map(([tierKey, tierInfo]) => {
            const isSelected = (state.tier || 'standard') === tierKey;
            return (
              <div
                key={tierKey}
                onClick={() => updateState({ tier: tierKey })}
                className={`relative rounded-2xl p-5 border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-stone-900 bg-blue-50/60/60 shadow-md ring-2 ring-stone-900/10'
                    : 'border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50/50'
                }`}
              >
                {isSelected && (
                  <div className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-amber-200" />
                    <span>Selected</span>
                  </div>
                )}

                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-gray-700 inline-block mb-2">
                    {tierInfo.badge}
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900">{tierInfo.name}</h4>
                  <div className="mt-2 text-slate-900 flex items-baseline space-x-1">
                    <span className="text-xl font-extrabold">{formatCurrency(tierInfo.ratePerSqFt)}</span>
                    <span className="text-xs text-gray-500 font-medium">/ sq.ft</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">{tierInfo.desc}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Key Specifications:</span>
                  {tierInfo.highlights.slice(0, 4).map((h, i) => (
                    <div key={i} className="flex items-center space-x-1.5 text-xs text-gray-700">
                      <Check className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ancillary Works & Extra Provisions (Add / Remove Options) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Building className="w-4 h-4 text-blue-800" />
            <span>Site Infrastructure & Ancillary Works (Add / Remove)</span>
          </h3>
          <span className="text-xs text-gray-500 font-semibold">Toggle items to add or remove from BOQ</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          
          <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
            state.includeCompoundWall !== false ? 'border-stone-900 bg-blue-50/60/50' : 'border-slate-200 bg-white opacity-70'
          }`}>
            <div>
              <p className="text-xs font-bold text-gray-900">Compound Boundary Wall</p>
              <p className="text-[11px] text-gray-500">5ft high wall + designer gate</p>
            </div>
            <input
              type="checkbox"
              checked={state.includeCompoundWall !== false}
              onChange={(e) => updateState({ includeCompoundWall: e.target.checked })}
              className="w-4 h-4 text-blue-800 rounded focus:ring-stone-900"
            />
          </label>

          <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
            state.includeSump !== false ? 'border-stone-900 bg-blue-50/60/50' : 'border-slate-200 bg-white opacity-70'
          }`}>
            <div>
              <p className="text-xs font-bold text-gray-900">Underground Water Sump</p>
              <p className="text-[11px] text-gray-500">8,000 Litres RCC Tank</p>
            </div>
            <input
              type="checkbox"
              checked={state.includeSump !== false}
              onChange={(e) => updateState({ includeSump: e.target.checked })}
              className="w-4 h-4 text-blue-800 rounded focus:ring-stone-900"
            />
          </label>

          <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
            state.includeOverheadTank !== false ? 'border-stone-900 bg-blue-50/60/50' : 'border-slate-200 bg-white opacity-70'
          }`}>
            <div>
              <p className="text-xs font-bold text-gray-900">Overhead Storage Tank</p>
              <p className="text-[11px] text-gray-500">2,000 Litres Multi-layer Tank</p>
            </div>
            <input
              type="checkbox"
              checked={state.includeOverheadTank !== false}
              onChange={(e) => updateState({ includeOverheadTank: e.target.checked })}
              className="w-4 h-4 text-blue-800 rounded focus:ring-stone-900"
            />
          </label>

          <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
            state.includeRainwaterHarvesting !== false ? 'border-stone-900 bg-blue-50/60/50' : 'border-slate-200 bg-white opacity-70'
          }`}>
            <div>
              <p className="text-xs font-bold text-gray-900">Rainwater Harvesting System</p>
              <p className="text-[11px] text-gray-500">Percolation pit & dual filters</p>
            </div>
            <input
              type="checkbox"
              checked={state.includeRainwaterHarvesting !== false}
              onChange={(e) => updateState({ includeRainwaterHarvesting: e.target.checked })}
              className="w-4 h-4 text-blue-800 rounded focus:ring-stone-900"
            />
          </label>

          <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
            !!state.includeSolarPower ? 'border-stone-900 bg-blue-50/60/50' : 'border-slate-200 bg-white opacity-70'
          }`}>
            <div>
              <p className="text-xs font-bold text-gray-900">Rooftop Solar Power System</p>
              <p className="text-[11px] text-gray-500">3 kW On-Grid Solar Plant</p>
            </div>
            <input
              type="checkbox"
              checked={!!state.includeSolarPower}
              onChange={(e) => updateState({ includeSolarPower: e.target.checked })}
              className="w-4 h-4 text-blue-800 rounded focus:ring-stone-900"
            />
          </label>

          <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
            !!state.includeBorewell ? 'border-stone-900 bg-blue-50/60/50' : 'border-slate-200 bg-white opacity-70'
          }`}>
            <div>
              <p className="text-xs font-bold text-gray-900">Borewell & Submersible Pump</p>
              <p className="text-[11px] text-gray-500">600 ft drilling + 3HP pump</p>
            </div>
            <input
              type="checkbox"
              checked={!!state.includeBorewell}
              onChange={(e) => updateState({ includeBorewell: e.target.checked })}
              className="w-4 h-4 text-blue-800 rounded focus:ring-stone-900"
            />
          </label>

        </div>
      </div>

    </div>
  );
}