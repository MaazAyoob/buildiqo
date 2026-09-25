import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  Bookmark, 
  CheckCircle2, 
  FileCheck2, 
  Share2, 
  Layers, 
  Calendar, 
  ShieldCheck, 
  Check, 
  Copy,
  Edit3,
  HardHat
} from 'lucide-react';
import { formatCurrency, formatNumber, useEstimateStore } from '../../store/useEstimateStore';
import { ExportOptionsBar } from '../common/ExportOptionsBar';

export function StepReport({ state, estimation, onOpenSavedModal, onNavigateStep }) {
  const { saveCurrentProject, captureCustomerLead, currentUser, subscription } = useEstimateStore();
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const isFreePlan = subscription?.planId === 'free';
  const displayPrice = (val) => isFreePlan ? '₹00' : formatCurrency(val);

  const handleSave = () => {
    saveCurrentProject(state.projectName || 'My Dream Residence');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handlePrint = () => {
    // Automatically capture customer requirement lead in the Website Owner inbox
    try {
      captureCustomerLead({
        name: currentUser?.name || state.projectName + ' Homeowner',
        email: currentUser?.email || 'customer@buildiqo.ai',
        phone: currentUser?.phone || '+91 98765 43210',
        notes: 'Customer generated and downloaded formal IS 456 BOQ PDF Report.'
      });
    } catch (e) {}
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const {
    plotArea,
    totalCarpetArea,
    totalBuiltupArea,
    costPerSqFt,
    directMaterialCost,
    totalLaborCost,
    ancillaryCost,
    directConstructionCost,
    architectureFee,
    contractorMargin,
    contingencyBuffer,
    grandTotalCost,
    materialSummary,
    boqItems,
    milestones,
    city,
    soil,
    tier,
    buildingType,
    constructionType,
    coverageCheck,
    tradePackageCheck,
    gst,
    gstRate,
    labourCess,
    labourCessRate,
    statutoryTaxes
  } = estimation;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Action Bar (No-Print) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider">
                Estimate report
              </span>
              <h2 className="text-xl font-extrabold text-slate-900">Step 6: Construction Estimate Summary & Report</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Review your complete project inputs, building specifications, material takeoff, and formal BOQ schedule.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-slate-900 shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <Printer className="w-4 h-4 text-amber-200" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={handleSave}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1.5 ${
                savedSuccess
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : 'bg-white border-slate-200 text-gray-700 hover:bg-slate-100/60'
              }`}
            >
              {savedSuccess ? <Check className="w-4 h-4 text-green-700" /> : <Bookmark className="w-4 h-4 text-blue-800" />}
              <span>{savedSuccess ? 'Saved to Projects!' : 'Save Estimation'}</span>
            </button>

            <button
              onClick={handleShare}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100/60 hover:bg-slate-100 text-gray-700 flex items-center space-x-1.5 transition-colors"
              title="Copy shareable link"
            >
              <Share2 className="w-3.5 h-3.5 text-gray-600" />
              <span>{copiedLink ? 'Copied Link!' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Export Options Bar (PDF, Excel, DXF, WhatsApp) - matching UI reference */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-3 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
              <span>Export Estimation Files</span>
              <span className="text-[10px] text-blue-700 font-bold px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200">
                Instant Download
              </span>
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Download formal PDF report, itemized Excel BOQ, AutoCAD DXF architectural floor plan, or share summary to WhatsApp.
            </p>
          </div>
          <span className="text-[10px] text-slate-400 font-mono hidden md:block">
            IS 456:2000 & IS 13920:2016 Compliant
          </span>
        </div>

        {/* 4 Export Buttons (PDF, Excel, DXF, WhatsApp) */}
        <ExportOptionsBar state={state} estimation={estimation} />
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200/90 shadow-sm space-y-10">
        
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="flex items-center space-x-3.5">
            <img src="/buildiqo-logo.svg" alt="Buildiqo" className="w-28 h-10 object-contain object-left" />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Buildiqo.ai</h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                  QS Audit Report
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Residential Construction Quantity & Cost Estimation</p>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1 text-xs text-slate-600">
            <p className="font-mono font-bold text-slate-900">Ref: BQ-{Date.now().toString().slice(-6)}</p>
            <p className="text-slate-500">Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="text-[11px] text-slate-400 font-mono">IS 456 / IS 1786 / NBC 2016 Benchmarks</p>
          </div>
        </div>

        {/* Project and building configuration inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50/70 rounded-xl border border-slate-200/80">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Project Title</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">{state.projectName || 'My Residence'}</span>
            <span className="text-xs text-slate-500">{city?.name} ({city?.state})</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Plot Dimensions & Area</span>
            <span className="font-mono tabular-nums text-sm font-bold text-slate-900 mt-0.5 block">{state.plotWidth} × {state.plotLength} ft</span>
            <span className="font-mono tabular-nums text-xs text-slate-500">{formatNumber(plotArea)} sq.ft ({state.facing} Facing)</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Building & Structural Type</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">{buildingType?.name}</span>
            <span className="text-xs text-slate-500">{constructionType?.name}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Massing & Quality Tier</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block uppercase">{tier} Package</span>
            <span className="font-mono tabular-nums text-xs text-slate-500">{formatNumber(totalBuiltupArea)} sq.ft BUA ({state.numFloors} Floors)</span>
          </div>
        </div>

        {/* Grand Total Cost Highlight Banner */}
        <div className="bg-[#0B0F19] text-white rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-slate-800 shadow-md">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block">
              Estimated Total Construction Investment
            </span>
            <span className="font-mono tabular-nums text-3xl sm:text-4xl font-bold tracking-tight text-white mt-1 block">
              {formatCurrency(grandTotalCost)}
            </span>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              {formatCurrency(costPerSqFt)} / sq.ft ({formatNumber(totalBuiltupArea)} sq.ft Built-Up Area)
            </p>
          </div>

          <div className="space-y-2 shrink-0 sm:border-l sm:border-slate-800 sm:pl-8">
            <div className="flex justify-between sm:justify-start sm:space-x-4 text-xs">
              <span className="text-slate-400">Direct Materials:</span>
              <span className="font-mono tabular-nums font-bold text-white">{formatCurrency(directMaterialCost)}</span>
            </div>
            <div className="flex justify-between sm:justify-start sm:space-x-4 text-xs">
              <span className="text-slate-400">Trade Labor:</span>
              <span className="font-mono tabular-nums font-bold text-white">{formatCurrency(totalLaborCost)}</span>
            </div>
            <div className="flex justify-between sm:justify-start sm:space-x-4 text-xs">
              <span className="text-slate-400">Site Amenities:</span>
              <span className="font-mono tabular-nums font-bold text-white">{formatCurrency(ancillaryCost)}</span>
            </div>
            <div className="flex justify-between sm:justify-start sm:space-x-4 text-xs">
              <span className="text-slate-400">Supervision & Buffer:</span>
              <span className="font-mono tabular-nums font-bold text-white">{formatCurrency(architectureFee + contractorMargin + contingencyBuffer)}</span>
            </div>
            <div className="flex justify-between sm:justify-start sm:space-x-4 text-xs">
              <span className="text-slate-400">GST ({gstRate}%):</span>
              <span className="font-mono tabular-nums font-bold text-white">{formatCurrency(gst)}</span>
            </div>
            <div className="flex justify-between sm:justify-start sm:space-x-4 text-xs">
              <span className="text-slate-400">BOCW Cess ({labourCessRate}%):</span>
              <span className="font-mono tabular-nums font-bold text-white">{formatCurrency(labourCess)}</span>
            </div>
          </div>
        </div>

        <div className={`rounded-xl border p-4 ${coverageCheck.isOverLimit ? 'border-amber-300 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
          <p className="text-xs font-extrabold text-slate-900">Ground coverage / setback sanity check</p>
          <p className="text-[11px] text-gray-700 mt-1">{coverageCheck.message}</p>
        </div>

        {/* Primary Material Takeoff Table */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span>Key Material Quantity Takeoff & IS Standards</span>
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-200/90">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Material Category</th>
                  <th className="py-2.5 px-4 text-right">Estimated Quantity</th>
                  <th className="py-2.5 px-4">Engineering Benchmark</th>
                  <th className="py-2.5 px-4">Standard Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materialSummary.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{m.label}</td>
                    <td className="py-2.5 px-4 font-mono tabular-nums font-bold text-blue-700 text-right">{m.qty}</td>
                    <td className="py-2.5 px-4 text-slate-600">{m.benchmark}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-400 text-xs">{m.standard}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`rounded-xl border p-4 ${tradePackageCheck.passed ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50'}`}>
          <p className="text-xs font-bold text-slate-900">Cost-head reconciliation</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{tradePackageCheck.passed ? 'Passed: the eight trade packages equal materials + labor + site amenities + supervision/buffer.' : `Failed: variance ${formatCurrency(tradePackageCheck.variance)}.`}</p>
        </div>

        {/* Floor-wise spaces schedule summary */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>Floor-by-Floor Space & Room Configuration Schedule</span>
          </h3>

          <div className="space-y-3">
            {state.floors.map((floor, fIdx) => {
              const floorDetail = estimation.floorDetails[fIdx] || { carpetArea: 0, builtupArea: 0 };
              return (
                <div key={floor.id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{floor.name}</span>
                    <span className="font-mono tabular-nums text-xs font-bold text-blue-700">
                      {formatNumber(floorDetail.carpetArea)} sq.ft Carpet • {formatNumber(floorDetail.builtupArea)} sq.ft BUA
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {floor.rooms.map(r => (
                      <span key={r.id} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700 font-medium">
                        {r.name} <span className="font-mono text-slate-500">({r.width}×{r.length} ft{r.count > 1 ? ` × ${r.count}` : ''})</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Full BOQ Trade Schedule Summary */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>Trade-Wise Construction Work Packages</span>
          </h3>

          <div className="space-y-2.5">
            {boqItems.map((group, gIdx) => {
              const groupTotal = group.items.reduce((sum, item) => sum + item.total, 0);
              return (
                <div key={gIdx} className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900">{gIdx + 1}. {group.category}</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {group.items.map(i => i.name.split('(')[0]).slice(0, 3).join(', ')}...
                    </span>
                  </div>
                  <span className="font-mono tabular-nums text-sm font-bold text-slate-900">{formatCurrency(groupTotal)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestone Schedule */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Stage-Wise Payment Disbursement Schedule</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {milestones.map((m, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{m.stage}</span>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">{m.pct}%</span>
                </div>
                <div className="font-mono tabular-nums text-sm font-bold text-slate-900">{formatCurrency(m.amount)}</div>
                <p className="text-[11px] text-slate-400">{m.timeline} • {m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Engineering Disclaimer & Verification Sign-off */}
        <div className="pt-8 border-t border-slate-200 text-xs text-gray-500 space-y-2">
          <p className="font-semibold text-gray-700">Engineering & Statutory Notes:</p>
          <ul className="list-disc pl-4 space-y-1 text-[11px]">
            <li>Quantities are calculated based on IS 456 code provisions with standard allowances for laps, hooks, bends, and cutting wastages (5% steel, 7% tile).</li>
            <li>Actual site structural rebar requirements may vary based on structural engineer foundation design and soil test SBC results. GST and BOCW cess are shown separately above; statutory applicability must be confirmed for the contract.</li>
            <li>Rates reflect current regional material and labor averages and are subject to market commodity fluctuations.</li>
          </ul>
        </div>

      </div>

      {/* Bottom Export Options Bar (No-Print) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-3 no-print">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-800">
            Export or Share This Estimation
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Available in PDF, Excel, DXF & WhatsApp
          </span>
        </div>
        <ExportOptionsBar state={state} estimation={estimation} />
      </div>

    </div>
  );
}
