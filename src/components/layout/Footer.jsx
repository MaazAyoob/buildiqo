import React from 'react';
import { ShieldCheck, FileCheck2, Ruler, Award, CheckCircle2 } from 'lucide-react';
import { BuildiqoLogo } from '../common/BuildiqoLogo';

export function Footer({ setRoute }) {
  return (
    <footer className="bg-white text-[#475569] border-t border-[#E2E8F0] pt-14 pb-12 mt-20 no-print text-left relative overflow-hidden">
      {/* Decorative top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-amber-500 to-indigo-600 opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Engineering Standards Badges */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pb-10 border-b border-[#E2E8F0] mb-10">
          <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-blue-300 transition-colors shadow-2xs">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#172033] tracking-wide">IS 456 : 2000</p>
              <p className="text-[11px] text-[#64748B]">Plain &amp; Reinforced Concrete</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-blue-300 transition-colors shadow-2xs">
            <Award className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#172033] tracking-wide">IS 1786 : 2008</p>
              <p className="text-[11px] text-[#64748B]">High Strength Deformed Steel</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-blue-300 transition-colors shadow-2xs">
            <Ruler className="w-5 h-5 text-cyan-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#172033] tracking-wide">IS 2502 : 1963</p>
              <p className="text-[11px] text-[#64748B]">Bending &amp; Fixing Rebar Takeoff</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-blue-300 transition-colors shadow-2xs">
            <FileCheck2 className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#172033] tracking-wide">NBC 2016 Standards</p>
              <p className="text-[11px] text-[#64748B]">National Building Code Guideline</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12">
          <div className="space-y-4">
            <div className="cursor-pointer" onClick={() => setRoute('home')}>
              <BuildiqoLogo 
                variant="horizontal" 
                theme="light" 
                className="h-9" 
                markClassName="w-8 h-8 shrink-0"
              />
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Deterministic, quantity-based residential and commercial construction estimation and 3D BOQ generation platform for property owners, architects, civil engineers, and contractors.
            </p>
            <div className="pt-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] block mb-1">Calibrated Regional Markets</span>
              <p className="text-[11px] text-blue-600 font-semibold">
                Bengaluru • Mumbai • Delhi NCR • Hyderabad • Pune • Chennai
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#172033] mb-3.5">Planning Modules</h4>
            <ul className="space-y-2.5 text-xs text-[#64748B]">
              <li>
                <button onClick={() => setRoute('planner', 1)} className="hover:text-blue-600 transition-colors text-left">
                  Civil Cost Calculator
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('floor-plan')} className="hover:text-blue-600 transition-colors text-left flex items-center gap-1.5">
                  <span>AI Floor Plan Studio</span>
                  <span className="text-[9px] px-1 py-0.2 bg-amber-100 text-amber-800 font-bold rounded">AI</span>
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('planner', 2)} className="hover:text-blue-600 transition-colors text-left">
                  Carpet vs Built-up Space Planner
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('planner', 3)} className="hover:text-blue-600 transition-colors text-left">
                  Material Takeoff Customizer
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('commercial-boq')} className="hover:text-blue-600 transition-colors text-left">
                  Commercial BOQ Workbook
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('planner', 5)} className="hover:text-blue-600 transition-colors text-left">
                  3D Architectural Visualizer
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#172033] mb-3.5">Engineering Benchmarks</h4>
            <ul className="space-y-2.5 text-xs text-[#64748B]">
              <li>
                <button onClick={() => setRoute('planner', 1)} className="hover:text-blue-600 transition-colors text-left">
                  City Cost Multiplier Index
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('planner', 3)} className="hover:text-blue-600 transition-colors text-left">
                  Approved Material Rate Standards
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('planner', 4)} className="hover:text-blue-600 transition-colors text-left">
                  Steel &amp; Cement Consumption Ratios
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('planner', 6)} className="hover:text-blue-600 transition-colors text-left">
                  QS Audit Reports &amp; Schedules
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#172033] mb-3.5">Project Workspace</h4>
            <ul className="space-y-2.5 text-xs text-[#64748B]">
              <li>
                <button onClick={() => setRoute('dashboard')} className="hover:text-blue-600 transition-colors text-left">
                  Saved Estimations Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('settings')} className="hover:text-blue-600 transition-colors text-left">
                  Currency &amp; Unit Preferences
                </button>
              </li>
              <li className="pt-2">
                <div className="p-3 rounded-xl bg-[#F0F5FF] border border-[#BFDBFE] text-[11px] text-[#475569]">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Real-time Auto-Save Active</span>
                  </div>
                  <span>Estimates and floor plans persist continuously in local storage.</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#94A3B8] gap-3">
          <p>© {new Date().getFullYear()} Buildiqo.ai. All calculations are engineering estimates calibrated for planning and preliminary procurement.</p>
          <div className="flex items-center space-x-3 font-medium">
            <span className="text-[#64748B]">CIVIL COST ESTIMATOR &amp; 3D BOQ</span>
            <span>•</span>
            <span className="text-blue-600 font-bold">IS 456 Compliant</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;