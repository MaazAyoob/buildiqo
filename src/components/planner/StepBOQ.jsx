import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Calendar, 
  Layers, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../store/useEstimateStore';

export function StepBOQ({ state, updateState, estimation, onNavigateStep }) {
  const [expandedCategories, setExpandedCategories] = useState({ 0: true, 1: true, 2: true, 7: true });
  const [isAddCustomModalOpen, setIsAddCustomModalOpen] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemAmount, setCustomItemAmount] = useState('');
  const [customItemSpec, setCustomItemSpec] = useState('');

  const toggleCategory = (idx) => {
    setExpandedCategories(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleAddCustomItem = (e) => {
    e.preventDefault();
    if (!customItemName.trim() || !customItemAmount) return;

    const newItem = {
      id: `custom-boq-${Date.now()}`,
      name: customItemName.trim(),
      amount: Number(customItemAmount) || 0,
      qty: 1,
      unit: 'L.S',
      spec: customItemSpec.trim() || 'Custom Architectural Scope Addition'
    };

    updateState({
      customBoqItems: [...(state.customBoqItems || []), newItem]
    });

    setCustomItemName('');
    setCustomItemAmount('');
    setCustomItemSpec('');
    setIsAddCustomModalOpen(false);
  };

  const handleRemoveCustomItem = (itemId) => {
    updateState({
      customBoqItems: (state.customBoqItems || []).filter(i => i.id !== itemId)
    });
  };

  const {
    totalBuiltupArea,
    grandTotalCost,
    costPerSqFt,
    directMaterialCost,
    totalLaborCost,
    ancillaryCost,
    directConstructionCost,
    architectureFee,
    contractorMargin,
    contingencyBuffer,
    boqItems,
    categoryTotals,
    milestones
  } = estimation;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                Quantity schedule
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Step 4: Itemized Bill of Quantities (BOQ)</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Deterministic quantity takeoff, trade labor, add/remove scope items, and milestone cashflow schedule.
            </p>
          </div>

          <div className="bg-[#0B0F19] text-white px-6 py-4 rounded-xl border border-slate-800 shadow-md text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Grand Total Estimated Cost</span>
            <span className="font-mono tabular-nums text-2xl font-bold text-white tracking-tight block">{formatCurrency(grandTotalCost)}</span>
            <span className="font-mono tabular-nums text-xs text-blue-400 block font-medium mt-0.5">
              {formatCurrency(costPerSqFt)} / sq.ft ({formatNumber(totalBuiltupArea)} sq.ft BUA)
            </span>
          </div>
        </div>
      </div>

      {/* Cost Split Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-xl p-4.5 border border-slate-200/80 shadow-xs space-y-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Direct Materials</span>
          <span className="font-mono tabular-nums text-lg font-bold text-slate-900 block">{formatCurrency(directMaterialCost)}</span>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5 border-t border-slate-100">
            <span>IS standard materials</span>
            <span className="font-mono tabular-nums font-bold text-blue-600">
              {grandTotalCost > 0 ? Math.round((directMaterialCost / grandTotalCost) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4.5 border border-slate-200/80 shadow-xs space-y-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Trade Labor</span>
          <span className="font-mono tabular-nums text-lg font-bold text-slate-900 block">{formatCurrency(totalLaborCost)}</span>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5 border-t border-slate-100">
            <span>Skilled masonry & MEP</span>
            <span className="font-mono tabular-nums font-bold text-blue-600">
              {grandTotalCost > 0 ? Math.round((totalLaborCost / grandTotalCost) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4.5 border border-slate-200/80 shadow-xs space-y-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Site Amenities & Custom</span>
          <span className="font-mono tabular-nums text-lg font-bold text-slate-900 block">{formatCurrency(ancillaryCost)}</span>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5 border-t border-slate-100">
            <span>Sump, wall, custom items</span>
            <span className="font-mono tabular-nums font-bold text-blue-600">
              {grandTotalCost > 0 ? Math.round((ancillaryCost / grandTotalCost) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4.5 border border-slate-200/80 shadow-xs space-y-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Engineering & Margin</span>
          <span className="font-mono tabular-nums text-lg font-bold text-slate-900 block">
            {formatCurrency(architectureFee + contractorMargin + contingencyBuffer)}
          </span>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5 border-t border-slate-100">
            <span>Design, supervision, buffer</span>
            <span className="font-mono tabular-nums font-bold text-blue-600">
              {grandTotalCost > 0 ? Math.round(((architectureFee + contractorMargin + contingencyBuffer) / grandTotalCost) * 100) : 0}%
            </span>
          </div>
        </div>

      </div>

      {/* Category Breakdown Bars */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <PieChartIcon className="w-4 h-4 text-blue-600" />
          <span>Construction Category Cost Distribution</span>
        </h3>

        <div className="space-y-3 pt-1">
          {categoryTotals.map((cat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-800 font-medium">{cat.name}</span>
                <span className="font-mono tabular-nums text-slate-900 font-bold">
                  {formatCurrency(cat.total)} <span className="text-slate-400 font-normal">({cat.percentage}%)</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(2, cat.percentage))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`rounded-xl p-4 border ${estimation.tradePackageCheck.passed ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50'}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-slate-900">Trade package reconciliation</p>
            <p className="text-[11px] text-slate-500">8 packages vs. materials + labor + amenities + supervision/buffer</p>
          </div>
          <span className={`font-mono tabular-nums text-xs font-bold ${estimation.tradePackageCheck.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
            {estimation.tradePackageCheck.passed ? 'CHECK PASSED' : `CHECK FAILED: ${formatCurrency(estimation.tradePackageCheck.variance)}`}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900">Statutory cost lines</h3>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Works-contract GST ({estimation.gstRate}%)</span>
            <span className="font-mono tabular-nums text-base font-bold text-slate-900 mt-0.5 block">{formatCurrency(estimation.gst)}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">BOCW labour cess ({estimation.labourCessRate}%)</span>
            <span className="font-mono tabular-nums text-base font-bold text-slate-900 mt-0.5 block">{formatCurrency(estimation.labourCess)}</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
            <span className="text-blue-600 text-[10px] uppercase font-bold tracking-wider block">Tax-inclusive estimate</span>
            <span className="font-mono tabular-nums text-base font-bold text-blue-700 mt-0.5 block">{formatCurrency(estimation.grandTotalCost)}</span>
          </div>
        </div>
      </div>

      {/* Detailed Itemized BOQ Table with Add Custom Item Option */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <span>Itemized Work Packages (Add / Remove Items)</span>
          </h3>

          <button
            onClick={() => setIsAddCustomModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0B0F19] text-white hover:bg-slate-800 flex items-center space-x-1.5 shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            <span>Add Custom BOQ Item</span>
          </button>
        </div>

        {boqItems.map((group, groupIdx) => {
          const isExpanded = !!expandedCategories[groupIdx];
          const groupTotal = group.items.reduce((sum, item) => sum + item.total, 0);

          return (
            <div key={groupIdx} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              
              {/* Group Header */}
              <div 
                onClick={() => toggleCategory(groupIdx)}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 font-mono text-slate-700 flex items-center justify-center font-bold text-xs">
                    {groupIdx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{group.category}</h4>
                    <span className="text-xs text-slate-400">{group.items.length} line items</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="font-mono tabular-nums text-sm font-bold text-slate-900">{formatCurrency(groupTotal)}</span>
                  <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              {isExpanded && (
                <div className="overflow-x-auto border-t border-slate-200/80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4 text-left">Item & Specification</th>
                        <th className="py-2.5 px-4 text-right">Quantity</th>
                        <th className="py-2.5 px-4 text-center">Unit</th>
                        <th className="py-2.5 px-4 text-right">Material Cost</th>
                        <th className="py-2.5 px-4 text-right">Labor Cost</th>
                        <th className="py-2.5 px-4 text-right">Total Amount</th>
                        <th className="py-2.5 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.items.map((item, itemIdx) => (
                        <tr key={itemIdx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-4">
                            <span className="font-semibold text-slate-900 block">{item.name}</span>
                            <span className="text-[11px] text-slate-500 block font-normal">{item.spec}</span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-800">
                            {formatNumber(item.qty)}
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono text-slate-500 text-xs">{item.unit}</td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600 font-medium">
                            {item.materialCost > 0 ? formatCurrency(item.materialCost) : '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600 font-medium">
                            {item.laborCost > 0 ? formatCurrency(item.laborCost) : '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {item.isCustom ? (
                              <button
                                onClick={() => handleRemoveCustomItem(item.id)}
                                className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                title="Remove custom item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">Core</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Add Custom BOQ Item Modal */}
      {isAddCustomModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Add Custom Scope Item to BOQ</h3>
              <button 
                onClick={() => setIsAddCustomModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomItem} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Item Title *</label>
                <input
                  type="text"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  placeholder="e.g. False Ceiling Gypsum Hall / EV Charger"
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Estimated Cost Amount (₹) *</label>
                <input
                  type="number"
                  value={customItemAmount}
                  onChange={(e) => setCustomItemAmount(e.target.value)}
                  placeholder="e.g. 85000"
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Specification / Brand Notes</label>
                <input
                  type="text"
                  value={customItemSpec}
                  onChange={(e) => setCustomItemSpec(e.target.value)}
                  placeholder="e.g. Saint-Gobain Gyproc with Philips COB LED downlights"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700"
                >
                  Add to BOQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Milestone Payment Schedule Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span>Construction Milestone Cash Flow & Payment Schedule</span>
        </h3>
        <p className="text-xs text-slate-500">
          Standard stage-wise disbursement schedule recommended for home building contracts.
        </p>

        <div className="overflow-x-auto pt-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 text-left">Milestone Stage</th>
                <th className="py-2.5 px-4 text-left">Estimated Timeline</th>
                <th className="py-2.5 px-4 text-right">% Split</th>
                <th className="py-2.5 px-4 text-right">Payment Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {milestones.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{m.stage}</span>
                    <span className="text-[11px] text-slate-500">{m.desc}</span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-600">{m.timeline}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-blue-600">{m.pct}%</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                    {formatCurrency(m.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}