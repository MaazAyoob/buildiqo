import React from 'react';
import { Building2, ShieldCheck, FileCheck2, Ruler, Award } from 'lucide-react';

export function Footer({ setRoute }) {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-8 mt-20 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Engineering Standards Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-10 border-b border-slate-800 mb-10">
          <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
            <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">IS 456 : 2000</p>
              <p className="text-[11px] text-slate-400">Plain & Reinforced Concrete</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
            <Award className="w-6 h-6 text-blue-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">IS 1786 : 2008</p>
              <p className="text-[11px] text-slate-400">High Strength Deformed Steel</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
            <Ruler className="w-6 h-6 text-blue-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">IS 2502 : 1963</p>
              <p className="text-[11px] text-slate-400">Bending & Fixing Rebar</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
            <FileCheck2 className="w-6 h-6 text-blue-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">NBC 2016</p>
              <p className="text-[11px] text-slate-400">National Building Code Standards</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10">
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="font-black text-lg text-white">Buildiqo<span className="text-blue-400">.ai</span></span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deterministic, quantity-based residential construction planning and BOQ generation platform for homeowners, engineers, and architects.
            </p>
            <p className="text-[11px] text-blue-400 font-medium">
              Bengaluru • Mumbai • Delhi NCR • Hyderabad • Pune • Chennai
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Planning Tools</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => setRoute('planner')} className="hover:text-white transition-colors">
                  Interactive Cost Calculator
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('planner')} className="hover:text-white transition-colors">
                  Floor Space & Carpet Area Planner
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('planner')} className="hover:text-white transition-colors">
                  Material Specification Customizer
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('planner')} className="hover:text-white transition-colors">
                  Itemized BOQ & Cashflow Schedule
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('planner')} className="hover:text-white transition-colors">
                  3D & Top View Architectural Viewer
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Engineering Benchmarks</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => setRoute('admin')} className="hover:text-white transition-colors">
                  City Cost Multiplier Index
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('admin')} className="hover:text-white transition-colors">
                  Live Material Price Overrides
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('admin')} className="hover:text-white transition-colors">
                  Steel & Cement Consumption Ratios
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('admin')} className="hover:text-white transition-colors">
                  Tile & Masonry Wastage Allowances
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Saved & Management</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => setRoute('dashboard')} className="hover:text-white transition-colors">
                  Project Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => setRoute('settings')} className="hover:text-white transition-colors">
                  Currency & Unit Preferences
                </button>
              </li>
              <li>
                <span className="text-slate-500">Continuous LocalStorage Auto-save Enabled</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Buildiqo.ai Platform. All calculations are engineering estimates for planning purposes.</p>
          <div className="flex space-x-4 mt-3 sm:mt-0">
            <span>Professional White & Blue Theme</span>
            <span>•</span>
            <span>Deterministic QS Engine</span>
          </div>
        </div>

      </div>
    </footer>
  );
}