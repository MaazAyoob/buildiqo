import React from 'react';
import { 
  Building2, 
  Layers, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  FileSpreadsheet, 
  CheckCircle2, 
  Compass, 
  Ruler,
  Maximize2
} from 'lucide-react';
import { Live3DConstructionViewer } from '../common/Live3DConstructionViewer';
import { formatCurrency, formatNumber } from '../../store/useEstimateStore';

export function Step3DViewer({ state, estimation, onNavigateStep }) {
  const activeCity = estimation.city?.name?.split(' ')[0] || 'Bengaluru';

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200">
              Interactive 3D & Plan View
            </span>
            <h2 className="text-xl font-black text-slate-900">Step 5: 3D Architectural & Top Plan Viewer</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Rotate in full 3D, switch to Top View (Plan), and play the 6-phase construction timelapse.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => onNavigateStep && onNavigateStep(5)}
            className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md flex items-center space-x-1.5 transition-all"
          >
            <span>Proceed to Step 6 Summary</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-200" />
          </button>
        </div>
      </div>

      {/* Main 3D Construction & Top Plan Viewer Component */}
      <Live3DConstructionViewer
        plotLength={state.plotLength || 40}
        plotWidth={state.plotWidth || 30}
        numFloors={state.numFloors || 2}
        cityName={activeCity}
        estimation={estimation}
        onLaunchPlanner={() => onNavigateStep && onNavigateStep(5)}
      />

      {/* Structural Specifications Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-[10px] font-extrabold uppercase text-blue-600">IS 456 Concrete Frame</span>
          <h4 className="text-xs font-black text-slate-900">RCC Superstructure</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            M20/M25 design mix concrete for column footings, plinth beams, lintels, and roof slabs with minimum 21 days curing.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-[10px] font-extrabold uppercase text-blue-600">IS 1786 High-Yield Steel</span>
          <h4 className="text-xs font-black text-slate-900">Fe 550D TMT Rebar</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Corrosion-resistant earthquake-resistant rebar with 5% standard cutting and lap length allowance adhering to IS 2502.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-[10px] font-extrabold uppercase text-blue-600">NBC 2016 Guidelines</span>
          <h4 className="text-xs font-black text-slate-900">Top Plan & Setbacks</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Conforms to permissible ground coverage ratios, cross-ventilation window openings (min 15% carpet area), and ceiling heights.
          </p>
        </div>
      </div>

    </div>
  );
}
