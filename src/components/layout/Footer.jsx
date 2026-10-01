import React from 'react';
import { ShieldCheck, FileCheck2, Ruler, Award, CheckCircle2, ArrowRight } from 'lucide-react';
import { BuildiqoLogo } from '../common/BuildiqoLogo';

export function Footer({ setRoute }) {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 pt-14 pb-10 mt-24 no-print text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Engineering Standards Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pb-10 border-b border-slate-800/80 mb-10">
          <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">IS 456 : 2000</p>
              <p className="text-[11px] text-slate-400">Plain &amp; Reinforced Concrete</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <Award className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">IS 1786 : 2008</p>
              <p className="text-[11px] text-slate-400">High Strength Deformed Steel</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <Ruler className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">IS 2502 : 1963</p>
              <p className="text-[11px] text-slate-400">Bending &amp; Fixing Rebar Takeoff</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <FileCheck2 className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">NBC 2016 Standards</p>
              <p className="text-[11px] text-slate-400">National Building Code Guideline</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12">
          <div className="space-y-4">
            <div className="cursor-pointer" onClick={() => setRoute('home')}>
              <BuildiqoLogo 
                variant="horizontal" 
                theme="dark" 
                className="h-9" 
                markClassName="w-8 h-8 shrink-0"
              />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deterministic, quantity-based residential and commercial construction estimation and 3D BOQ generation platform for property owners, architects, civil engineers, and contractors.
            </p>
            <div className="pt-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">Calibrated Regional Markets</span>
              <p className="text-[11px] text-blue-400 font-medium">
                Bengaluru • Mumbai • Delhi NCR • Hyderabad • Pune • Chennai
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3.5">Planning Modules</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button onClick={() => setRoute('planner', 1)} className="hover:text-blue-400 transition-colors text-left">
                  Civil Cost Calculator
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('floor-plan')} className="hover:text-blue-400 transition-colors text-left flex items-center gap-1.5">
                  <span>AI Floor Plan Studio</span>
                  <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-300 font-bold rounded">AI</span>
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('planner', 2)} className="hover:text-blue-400 transition-colors text-left">
                  Carpet vs Built-up Space Planner
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('planner', 3)} className="hover:text-blue-400 transition-colors text-left">
                  Material Takeoff Customizer
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('commercial-boq')} className="hover:text-blue-400 transition-colors text-left">
                  Commercial BOQ Workbook
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('planner', 5)} className="hover:text-blue-400 transition-colors text-left">
                  3D Architectural Visualizer
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3.5">Engineering Benchmarks</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button onClick={() => setRoute('admin')} className="hover:text-blue-400 transition-colors text-left">
                  City Cost Multiplier Index
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('admin')} className="hover:text-blue-400 transition-colors text-left">
                  Approved Material Rate Management
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('admin')} className="hover:text-blue-400 transition-colors text-left">
                  Steel &amp; Cement Consumption Ratios
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('planner', 6)} className="hover:text-blue-400 transition-colors text-left">
                  QS Audit Reports &amp; Schedules
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3.5">Project Workspace</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button onClick={() => setRoute('dashboard')} className="hover:text-blue-400 transition-colors text-left">
                  Saved Estimations Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('settings')} className="hover:text-blue-400 transition-colors text-left">
                  Currency &amp; Unit Preferences
                </button>
              </li>
              <li className="pt-2">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Real-time Auto-Save Active</span>
                  </div>
                  <span>Estimates and floor plans persist continuously in local storage.</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Buildiqo.ai. All calculations are engineering estimates calibrated for planning and preliminary procurement.</p>
          <div className="flex items-center space-x-3 mt-3 sm:mt-0 font-medium">
            <span className="text-slate-400">CIVIL COST ESTIMATOR &amp; 3D BOQ</span>
            <span>•</span>
            <span className="text-blue-400">IS 456 Compliant</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;