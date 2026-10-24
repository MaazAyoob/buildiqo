import React, { useState, useEffect } from 'react';
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
  HardHat, 
  Calculator, 
  ArrowRight, 
  TrendingUp 
} from 'lucide-react';
import { CITIES, SOIL_TYPES } from '../../data/cities';
import { INDIAN_STATES, normalizeStateName } from '../../data/states';
import { TIER_BENCHMARKS } from '../../data/materials';
import { BUILDING_TYPES, CONSTRUCTION_TYPES, AREA_UNITS } from '../../data/defaults';
import { formatCurrency, formatNumber, useEstimateStore } from '../../store/useEstimateStore';

export function StepPlotDetails({ state, updateState, estimation }) {
  const [errors, setErrors] = useState({});

  // Local string states to allow free numeric typing, decimals (e.g. 9.5, 12.5), and backspacing
  const [localWidth, setLocalWidth] = useState(state.plotWidth !== undefined && state.plotWidth !== null ? String(state.plotWidth) : '30');
  const [localLength, setLocalLength] = useState(state.plotLength !== undefined && state.plotLength !== null ? String(state.plotLength) : '40');
  const [localRoadWidth, setLocalRoadWidth] = useState(state.roadWidth !== undefined && state.roadWidth !== null ? String(state.roadWidth) : '30');

  useEffect(() => {
    if (state.plotWidth !== undefined && state.plotWidth !== null && String(state.plotWidth) !== localWidth) {
      setLocalWidth(String(state.plotWidth));
    }
  }, [state.plotWidth]);

  useEffect(() => {
    if (state.plotLength !== undefined && state.plotLength !== null && String(state.plotLength) !== localLength) {
      setLocalLength(String(state.plotLength));
    }
  }, [state.plotLength]);

  useEffect(() => {
    if (state.roadWidth !== undefined && state.roadWidth !== null && String(state.roadWidth) !== localRoadWidth) {
      setLocalRoadWidth(String(state.roadWidth));
    }
  }, [state.roadWidth]);

  const plotPresets = [
    { label: '30 × 40', w: 30, l: 40, area: 1200, tag: '1,200 sq.ft' },
    { label: '30 × 50', w: 30, l: 50, area: 1500, tag: '1,500 sq.ft' },
    { label: '40 × 60', w: 40, l: 60, area: 2400, tag: '2,400 sq.ft' },
    { label: '50 × 80', w: 50, l: 80, area: 4000, tag: '4,000 sq.ft' }
  ];

  const handlePresetClick = (w, l) => {
    setLocalWidth(String(w));
    setLocalLength(String(l));
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

  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
  };

  const currentPlotArea = estimation.plotArea || ((Number(state.plotWidth) || 30) * (Number(state.plotLength) || 40));
  const displayCarpetArea = estimation.plotCarpetArea !== undefined 
    ? (Number(estimation.plotCarpetArea) % 1 !== 0 
        ? Number(estimation.plotCarpetArea).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) 
        : formatNumber(estimation.plotCarpetArea))
    : (Number(currentPlotArea * 0.7) % 1 !== 0
        ? Number(currentPlotArea * 0.7).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
        : formatNumber(Math.round(currentPlotArea * 0.7)));

  return (
    <div className="space-y-6 animate-fadeIn text-left text-[#172033]">
      
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#EEF4FF] text-[#2563EB] border border-[#BFDBFE] text-[10px] font-black uppercase tracking-wider">
              STEP 01
            </span>
            <h2 className="text-xl font-black text-[#172033] tracking-tight">Site &amp; Building Configuration</h2>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Configure project jurisdiction, plot geometry, building typology, and construction package tier.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 bg-[#F0FDF4] px-3.5 py-2 rounded-xl border border-[#BBF7D0] text-xs text-[#166534] font-semibold shrink-0">
          <ShieldCheck className="w-4 h-4 text-[#059669]" />
          <span>IS 456 &amp; NBC 2016 Compliant</span>
        </div>
      </div>

      {/* 2. Structured Group 1: Project Identity & Jurisdiction */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#172033] flex items-center space-x-2 pb-2 border-b border-[#F1F5F9]">
          <Building className="w-4 h-4 text-[#2563EB]" />
          <span>1. Project Identity &amp; Regional Pricing Jurisdiction</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-[#475569] mb-1.5 block">
              Project Name *
            </label>
            <input
              type="text"
              value={state.projectName || ''}
              onChange={(e) => {
                updateState({ projectName: e.target.value });
                clearError('projectName');
              }}
              placeholder="e.g. Prestige Green Villa"
              className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-white border border-[#CBD5E1] text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#475569] mb-1.5 flex items-center justify-between">
              <span>State (Pricing Authority) *</span>
              <span className="text-[10px] text-[#059669] font-mono font-bold">Live Benchmarks</span>
            </label>
            <select
              value={state.state || 'Karnataka'}
              onChange={(e) => updateState({ state: e.target.value })}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-white border border-[#CBD5E1] text-[#172033] focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              {INDIAN_STATES.map(s => (
                <option key={s.id} value={s.name}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#475569] mb-1.5 block">
              City / Physical Location
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
              placeholder="e.g. Bengaluru, Whitefield"
              className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-white border border-[#CBD5E1] text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      {/* 3. Structured Group 2: Plot Dimensions & Site Geometry */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#172033] flex items-center space-x-2 pb-2 border-b border-[#F1F5F9]">
          <Ruler className="w-4 h-4 text-[#2563EB]" />
          <span>2. Plot Dimensions &amp; Geometry</span>
        </h3>

        {/* Dimension Preset Chips */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-[#64748B]">Quick Plot Presets:</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {plotPresets.map((p) => {
              const isSelected = state.plotWidth === p.w && state.plotLength === p.l;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handlePresetClick(p.w, p.l)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-[#EEF4FF] border-[#2563EB] text-[#2563EB] shadow-xs ring-1 ring-[#2563EB]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className={`text-xs font-bold ${isSelected ? 'text-[#1D4ED8]' : 'text-[#172033]'}`}>{p.label} ft</div>
                  <div className={`text-[10px] font-mono ${isSelected ? 'text-[#2563EB] font-bold' : 'text-[#64748B]'}`}>{p.tag}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Plot Dimension Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
          <div>
            <label className="text-xs font-bold text-[#475569] mb-1.5 flex items-center justify-between">
              <span>Width (ft) *</span>
              <span className="text-[10px] text-[#64748B] font-mono">Feet</span>
            </label>
            <input
              type="number"
              min="10"
              max="500"
              step="any"
              value={localWidth}
              onChange={(e) => {
                const val = e.target.value;
                setLocalWidth(val);
                if (val !== '') {
                  const num = parseFloat(val);
                  if (!isNaN(num) && num > 0) {
                    updateState({ plotWidth: num });
                    clearError('dimensions');
                  }
                }
              }}
              onBlur={() => {
                const num = parseFloat(localWidth);
                const finalVal = (!isNaN(num) && num >= 10 && num <= 500) ? num : (isNaN(num) || num < 10 ? 30 : 500);
                setLocalWidth(String(finalVal));
                updateState({ plotWidth: finalVal });
              }}
              placeholder="30"
              className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-white border border-[#CBD5E1] text-[#172033] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#475569] mb-1.5 flex items-center justify-between">
              <span>Length (ft) *</span>
              <span className="text-[10px] text-[#64748B] font-mono">Feet</span>
            </label>
            <input
              type="number"
              min="10"
              max="500"
              step="any"
              value={localLength}
              onChange={(e) => {
                const val = e.target.value;
                setLocalLength(val);
                if (val !== '') {
                  const num = parseFloat(val);
                  if (!isNaN(num) && num > 0) {
                    updateState({ plotLength: num });
                    clearError('dimensions');
                  }
                }
              }}
              onBlur={() => {
                const num = parseFloat(localLength);
                const finalVal = (!isNaN(num) && num >= 10 && num <= 500) ? num : (isNaN(num) || num < 10 ? 40 : 500);
                setLocalLength(String(finalVal));
                updateState({ plotLength: finalVal });
              }}
              placeholder="40"
              className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-white border border-[#CBD5E1] text-[#172033] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#475569] mb-1.5 flex items-center justify-between">
              <span>Road Width (ft)</span>
              <span className="text-[10px] text-[#64748B] font-mono">Feet (e.g. 9.5)</span>
            </label>
            <input
              type="number"
              min="3"
              max="200"
              step="any"
              value={localRoadWidth}
              onChange={(e) => {
                const val = e.target.value;
                setLocalRoadWidth(val);
                if (val !== '') {
                  const num = parseFloat(val);
                  if (!isNaN(num) && num > 0) {
                    updateState({ roadWidth: num });
                  }
                }
              }}
              onBlur={() => {
                const num = parseFloat(localRoadWidth);
                const finalVal = (!isNaN(num) && num >= 3 && num <= 200) ? num : (isNaN(num) || num < 3 ? 30 : 200);
                setLocalRoadWidth(String(finalVal));
                updateState({ roadWidth: finalVal });
              }}
              placeholder="30"
              className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-white border border-[#CBD5E1] text-[#172033] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#475569] mb-1.5 block">Site Orientation</label>
            <select
              value={state.plotFacing || 'east'}
              onChange={(e) => updateState({ plotFacing: e.target.value })}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-white border border-[#CBD5E1] text-[#172033] focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="east">East Facing</option>
              <option value="north">North Facing</option>
              <option value="west">West Facing</option>
              <option value="south">South Facing</option>
            </select>
          </div>
        </div>

        {/* Live Area Rollup Block */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs font-mono">
          <div>
            <span className="text-[10px] text-[#64748B] font-sans block font-medium">Gross Plot Area</span>
            <span className="font-bold text-[#172033] text-sm">{formatNumber(currentPlotArea)} sq.ft</span>
            <span className="text-[9px] text-[#64748B] font-sans block mt-0.5">{state.plotWidth || 30} × {state.plotLength || 40} ft</span>
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] font-sans block font-medium">Carpet Area (70% Basis)</span>
            <span className="font-bold text-[#059669] text-sm">{displayCarpetArea} sq.ft</span>
            <span className="text-[9px] text-[#059669] font-sans block mt-0.5">70% of SBA ({formatNumber(estimation.totalBuiltupArea)} × 70%)</span>
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] font-sans block font-medium">Constructed Built-Up (SBA)</span>
            <span className="font-bold text-[#2563EB] text-sm">{formatNumber(estimation.totalBuiltupArea)} sq.ft</span>
            <span className="text-[9px] text-[#2563EB] font-sans block mt-0.5">
              {state.useTargetBua ? 'Manual SBA Override' : `Auto-calculated (${state.numFloors || 2} Floor${(state.numFloors || 2) > 1 ? 's' : ''})`}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] font-sans block font-medium">Floor Configuration</span>
            <span className="font-bold text-[#172033] text-sm">{state.numFloors || 2} Floors</span>
            <span className="text-[9px] text-[#64748B] font-sans block mt-0.5">G + {(state.numFloors || 2) - 1} Levels</span>
          </div>
        </div>
      </div>

      {/* 4. Structured Group 3: Floors & Target Built-Up Area Override */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#172033] flex items-center space-x-2 pb-2 border-b border-[#F1F5F9]">
          <Layers className="w-4 h-4 text-[#7C3AED]" />
          <span>3. Number of Floors &amp; Target BUA Override</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#475569] block">Number of Floors (G + N)</label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((fl) => (
                <button
                  key={fl}
                  type="button"
                  onClick={() => handleFloorsChange(fl)}
                  className={`w-12 h-10 rounded-xl font-mono font-bold text-xs border transition-all ${
                    (state.numFloors || 2) === fl
                      ? 'bg-[#2563EB] border-[#1D4ED8] text-white shadow-xs'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9]'
                  }`}
                >
                  G+{fl - 1}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#475569]">
                Constructed Super Built-Up Area (SBA) / Target BUA (sq.ft)
              </label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="checkbox"
                  id="targetBuaOverrideCheck"
                  checked={Boolean(state.useTargetBua)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    updateState({ 
                      useTargetBua: checked,
                      targetBuaInput: checked 
                        ? (state.targetBuaInput && Number(state.targetBuaInput) > 0 
                            ? state.targetBuaInput 
                            : (estimation.totalBuiltupArea || (currentPlotArea * (state.numFloors || 2))))
                        : ''
                    });
                  }}
                  className="rounded text-[#2563EB] focus:ring-[#2563EB] accent-[#2563EB]"
                />
                <label htmlFor="targetBuaOverrideCheck" className="text-[11px] font-bold text-[#64748B] cursor-pointer">
                  Manual SBA Override
                </label>
              </div>
            </div>

            <div className="relative">
              <input
                id="targetBuaInput"
                name="targetBuaInput"
                data-testid="target-bua-input"
                type="number"
                min="100"
                max="50000"
                step="10"
                value={state.useTargetBua ? (state.targetBuaInput !== undefined && state.targetBuaInput !== null ? state.targetBuaInput : '') : (estimation.totalBuiltupArea || '')}
                disabled={!state.useTargetBua}
                onChange={(e) => {
                  const val = e.target.value;
                  updateState({ targetBuaInput: val === '' ? '' : Math.max(0, parseFloat(val) || 0) });
                }}
                placeholder={state.useTargetBua ? 'Enter manual SBA' : 'Calculated automatically from plot dimensions'}
                className={`w-full px-3 py-2 pr-28 text-xs font-bold rounded-xl border font-mono transition-all ${
                  state.useTargetBua
                    ? 'bg-white border-[#2563EB] text-[#172033] focus:outline-none focus:ring-2 focus:ring-blue-100'
                    : 'bg-[#F0F5FF] border-[#BFDBFE] text-[#1E40AF] cursor-not-allowed font-black'
                }`}
              />
              <span className="absolute right-3 top-2 text-[10px] font-bold text-[#64748B] select-none">
                {state.useTargetBua ? 'sq.ft (Manual)' : 'sq.ft (Auto-calc)'}
              </span>
            </div>
            {!state.useTargetBua && (
              <span className="text-[10px] text-[#059669] font-medium flex items-center space-x-1">
                <span>✓ Auto-calculated SBA ({formatNumber(estimation.totalBuiltupArea)} sq.ft = {state.plotWidth || 30} × {state.plotLength || 40} ft × {state.numFloors || 2} Floor{(state.numFloors || 2) > 1 ? 's' : ''})</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 5. Structured Group 4: Construction Package Tier (Primary Driver) */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#172033] flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#D97706]" />
            <span>4. Construction Package Tier &amp; Rate per sq.ft</span>
          </h3>
          <span className="text-[10px] font-mono text-[#2563EB] font-semibold bg-[#EEF4FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
            Formula: Estimated Cost = SBA × Package Rate
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(TIER_BENCHMARKS).map(([tKey, tInfo]) => {
            const isSelected = !state.isCustomPackageRate && (state.tier || 'standard') === tKey;
            return (
              <div
                key={tKey}
                onClick={() => updateState({ tier: tKey, isCustomPackageRate: false })}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'bg-[#EEF4FF] border-[#2563EB] shadow-md ring-2 ring-[#2563EB]/20'
                    : 'bg-white border-[#E2E8F0] hover:border-[#93C5FD] shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                      isSelected 
                        ? 'bg-blue-100 text-blue-800 border-blue-200' 
                        : 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]'
                    }`}>
                      {tInfo.badge}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />}
                  </div>
                  <h4 className="text-sm font-black text-[#172033]">{tInfo.name}</h4>
                  <div className="mt-2 text-xl font-black font-mono text-[#2563EB]">
                    {formatCurrency(tInfo.ratePerSqFt)}
                    <span className="text-xs text-[#64748B] font-normal"> / sq.ft</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0] space-y-1 text-[11px] text-[#64748B]">
                  {tInfo.highlights.slice(0, 3).map((h, i) => (
                    <div key={i} className="truncate">• {h}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Negotiated Rate Option */}
        <div className="mt-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="customPkgRateCheck"
              checked={Boolean(state.isCustomPackageRate)}
              onChange={(e) => updateState({ isCustomPackageRate: e.target.checked })}
              className="rounded text-[#2563EB] focus:ring-[#2563EB] accent-[#2563EB]"
            />
            <label htmlFor="customPkgRateCheck" className="text-xs font-bold text-[#172033] cursor-pointer">
              Negotiated Custom Package Rate per sq.ft
            </label>
          </div>

          {state.isCustomPackageRate && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#64748B]">Custom Rate:</span>
              <input
                type="number"
                value={state.customPackageRate || 2000}
                onChange={(e) => updateState({ customPackageRate: Number(e.target.value) || 0 })}
                className="w-32 px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-[#CBD5E1] text-[#172033] font-mono"
              />
              <span className="text-xs text-[#64748B]">/ sq.ft</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}