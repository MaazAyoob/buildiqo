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
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider">
                Quantity schedule
              </span>
              <h2 className="text-xl font-extrabold text-slate-900">Step 4: Itemized Bill of Quantities (BOQ)</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Deterministic quantity takeoff, trade labor, add/remove scope items, and milestone cashflow schedule.
            </p>
          </div>

          <div className="bg-blue-600 text-white px-5 py-3 rounded-2xl shadow-sm text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-200 block">Grand Total Estimated Cost</span>
            <span className="text-2xl font-black">{formatCurrency(grandTotalCost)}</span>
            <span className="text-xs text-amber-200 block font-semibold">
              {formatCurrency(costPerSqFt)} / sq.ft ({formatNumber(totalBuiltupArea)} sq.ft BUA)
            </span>
          </div>
        </div>
      </div>

      {/* Cost Split Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-500 block">Direct Materials</span>
          <span className="text-lg font-black text-slate-900 block">{formatCurrency(directMaterialCost)}</span>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>IS standard materials</span>
            <span className="font-bold text-blue-800">
              {grandTotalCost > 0 ? Math.round((directMaterialCost / grandTotalCost) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-500 block">Trade Labor</span>
          <span className="text-lg font-black text-slate-900 block">{formatCurrency(totalLaborCost)}</span>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Skilled masonry & MEP</span>
            <span className="font-bold text-blue-800">
              {grandTotalCost > 0 ? Math.round((totalLaborCost / grandTotalCost) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-500 block">Site Amenities & Custom</span>
          <span className="text-lg font-black text-slate-900 block">{formatCurrency(ancillaryCost)}</span>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Sump, wall, custom items</span>
            <span className="font-bold text-blue-800">
              {grandTotalCost > 0 ? Math.round((ancillaryCost / grandTotalCost) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-500 block">Engineering & Margin</span>
          <span className="text-lg font-black text-slate-900 block">
            {formatCurrency(architectureFee + contractorMargin + contingencyBuffer)}
          </span>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Design, supervision, buffer</span>
            <span className="font-bold text-blue-800">
              {grandTotalCost > 0 ? Math.round(((architectureFee + contractorMargin + contingencyBuffer) / grandTotalCost) * 100) : 0}%
            </span>
          </div>
        </div>

      </div>

      {/* Category Breakdown Bars */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <PieChartIcon className="w-4 h-4 text-blue-800" />
          <span>Construction Category Cost Distribution</span>
        </h3>

        <div className="space-y-3 pt-2">
          {categoryTotals.map((cat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-900">{cat.name}</span>
                <span className="text-slate-900 font-extrabold">
                  {formatCurrency(cat.total)} ({cat.percentage}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-700 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(2, cat.percentage))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`rounded-2xl p-4 border ${estimation.tradePackageCheck.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold text-slate-900">Trade package reconciliation</p>
            <p className="text-[11px] text-gray-600">8 packages vs. materials + labor + amenities + supervision/buffer</p>
          </div>
          <span className={`text-xs font-black ${estimation.tradePackageCheck.passed ? 'text-green-700' : 'text-red-700'}`}>
            {estimation.tradePackageCheck.passed ? 'CHECK PASSED' : `CHECK FAILED: ${formatCurrency(estimation.tradePackageCheck.variance)}`}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Statutory cost lines</h3>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div><span className="text-gray-500 block">Works-contract GST ({estimation.gstRate}%)</span><span className="font-black">{formatCurrency(estimation.gst)}</span></div>
          <div><span className="text-gray-500 block">BOCW labour cess ({estimation.labourCessRate}%)</span><span className="font-black">{formatCurrency(estimation.labourCess)}</span></div>
          <div><span className="text-gray-500 block">Tax-inclusive estimate</span><span className="font-black text-blue-700">{formatCurrency(estimation.grandTotalCost)}</span></div>
        </div>
      </div>

      {/* Detailed Itemized BOQ Table with Add Custom Item Option */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-800" />
            <span>Itemized Work Packages (Add / Remove Items)</span>
          </h3>

          <button
            onClick={() => setIsAddCustomModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-slate-900 flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4 text-amber-200" />
            <span>Add Custom BOQ Item</span>
          </button>
        </div>

        {boqItems.map((group, groupIdx) => {
          const isExpanded = !!expandedCategories[groupIdx];
          const groupTotal = group.items.reduce((sum, item) => sum + item.total, 0);

          return (
            <div key={groupIdx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              
              {/* Group Header */}
              <div 
                onClick={() => toggleCategory(groupIdx)}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                    {groupIdx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">{group.category}</h4>
                    <span className="text-xs text-gray-500">{group.items.length} line items</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-sm font-black text-slate-900">{formatCurrency(groupTotal)}</span>
                  <div className="w-6 h-6 rounded-lg bg-slate-100/60 flex items-center justify-center text-gray-600">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              {isExpanded && (
                <div className="overflow-x-auto border-t border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-gray-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Item & Material Spec</th>
                        <th className="py-3 px-4 text-right">Quantity</th>
                        <th className="py-3 px-4 text-right">Unit</th>
                        <th className="py-3 px-4 text-right">Cost</th>
                        <th className="py-3 px-4 text-right">Labor</th>
                        <th className="py-3 px-4 text-right">Total Amount</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {group.items.map((item, itemIdx) => (
                        <tr key={itemIdx} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{item.name}</span>
                            <span className="text-[11px] text-gray-500 block">{item.spec}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-gray-800">
                            {formatNumber(item.qty)}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-500">{item.unit}</td>
                          <td className="py-3 px-4 text-right text-gray-700 font-medium">
                            {item.materialCost > 0 ? formatCurrency(item.materialCost) : '—'}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-700 font-medium">
                            {item.laborCost > 0 ? formatCurrency(item.laborCost) : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.isCustom ? (
                              <button
                                onClick={() => handleRemoveCustomItem(item.id)}
                                className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="Remove custom item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-medium">Core</span>
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
              <h3 className="text-base font-extrabold text-slate-900">Add Custom Scope Item to BOQ</h3>
              <button 
                onClick={() => setIsAddCustomModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomItem} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Item Title *</label>
                <input
                  type="text"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  placeholder="e.g. False Ceiling Gypsum Hall / EV Charger"
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-slate-50/50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Estimated Cost Amount (₹) *</label>
                <input
                  type="number"
                  value={customItemAmount}
                  onChange={(e) => setCustomItemAmount(e.target.value)}
                  placeholder="e.g. 85000"
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-slate-50/50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Specification / Brand Notes</label>
                <input
                  type="text"
                  value={customItemSpec}
                  onChange={(e) => setCustomItemSpec(e.target.value)}
                  placeholder="e.g. Saint-Gobain Gyproc with Philips COB LED downlights"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-slate-50/50"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-slate-100/60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-slate-900"
                >
                  Add to BOQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Milestone Payment Schedule Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-800" />
          <span>Construction Milestone Cash Flow & Payment Schedule</span>
        </h3>
        <p className="text-xs text-gray-500">
          Standard stage-wise disbursement schedule recommended for home building contracts.
        </p>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/60/70 text-gray-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Milestone Stage</th>
                <th className="py-3 px-4">Estimated Timeline</th>
                <th className="py-3 px-4 text-right">% Split</th>
                <th className="py-3 px-4 text-right">Payment Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {milestones.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4">
                    <span className="font-extrabold text-slate-900 block">{m.stage}</span>
                    <span className="text-[11px] text-gray-500">{m.desc}</span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-gray-700">{m.timeline}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-blue-800">{m.pct}%</td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900">
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