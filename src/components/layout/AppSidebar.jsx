import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calculator,
  Ruler,
  Layers,
  Sparkles,
  FileSpreadsheet,
  Box,
  FileCheck2,
  Compass,
  FolderKanban,
  Sliders,
  Inbox,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { BuildiqoLogo } from '../common/BuildiqoLogo';
import { useEstimateStore, formatCurrency, formatNumber } from '../../store/useEstimateStore';

export function AppSidebar({ currentRoute, setRoute, onOpenSavedModal, collapsed, setCollapsed }) {
  const { state, estimation, currentUser, logout, savedProjects } = useEstimateStore();
  const [plannerExpanded, setPlannerExpanded] = useState(true);

  const plannerSteps = [
    { step: 1, label: '01 Plot & Setup', icon: Ruler },
    { step: 2, label: '02 Spaces & Layout', icon: Layers },
    { step: 3, label: '03 Specifications', icon: Sparkles },
    { step: 4, label: '04 BOQ Takeoff', icon: FileSpreadsheet },
    { step: 5, label: '05 3D Model View', icon: Box },
    { step: 6, label: '06 Summary Report', icon: FileCheck2 },
  ];

  const isActive = (route) => currentRoute === route;

  return (
    <aside
      className={`bg-white border-r border-[#E2E8F0] text-[#172033] flex flex-col justify-between transition-all duration-300 z-30 select-none shadow-xs ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Top Brand Area */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#E2E8F0]">
          <button
            onClick={() => setRoute('home')}
            className="flex items-center space-x-3 text-left focus:outline-none group overflow-hidden"
            title="Buildiqo.AI Home"
          >
            {collapsed ? (
              <BuildiqoLogo variant="mark" className="w-8 h-8 shrink-0 group-hover:scale-105 transition-transform" />
            ) : (
              <BuildiqoLogo 
                variant="horizontal" 
                className="h-9 group-hover:scale-[1.02] transition-transform" 
                markClassName="w-8 h-8 shrink-0" 
              />
            )}
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 border border-[#E2E8F0] text-[#64748B] hover:text-[#172033] items-center justify-center text-xs transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Live Project Chip in Sidebar (Desktop) */}
        {!collapsed && (
          <div className="mx-3 my-3 p-2.5 rounded-xl bg-[#F0F5FF] border border-[#BFDBFE] text-xs shadow-2xs">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#475569] mb-1">
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active Project</span>
              </span>
              <span className="font-mono text-blue-700 font-extrabold bg-blue-100/70 px-1.5 py-0.2 rounded">IS 456</span>
            </div>
            <div className="font-bold text-[#172033] text-xs truncate">
              {state.projectName || 'Residential Villa Estimate'}
            </div>
            <div className="flex items-center justify-between mt-1 pt-1 border-t border-blue-200/60 text-[11px] font-mono tabular-nums">
              <span className="text-[#64748B]">{formatNumber(estimation.totalBuiltupArea)} sq.ft</span>
              <span className="text-blue-600 font-bold">{formatCurrency(estimation.estimatedCost || 0)}</span>
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="px-2.5 py-2 space-y-4 overflow-y-auto max-h-[calc(100vh-270px)]">
          
          {/* Group 1: Workspace Core */}
          <div>
            {!collapsed && (
              <span className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-[#94A3B8] block mb-1">
                Workspace
              </span>
            )}
            <div className="space-y-1">
              <button
                onClick={() => setRoute('dashboard')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive('dashboard')
                    ? 'bg-[#EEF4FF] text-[#2563EB] font-extrabold border-r-2 border-[#2563EB] shadow-2xs'
                    : 'text-[#475569] hover:bg-[#EEF4FF]/70 hover:text-[#2563EB]'
                }`}
                title="Dashboard Overview"
              >
                <LayoutDashboard className="w-4 h-4 shrink-0 text-cyan-600" />
                {!collapsed && <span>Dashboard Overview</span>}
              </button>
            </div>
          </div>

          {/* Group 2: Planning & Calculations */}
          <div>
            {!collapsed && (
              <div className="flex items-center justify-between px-3 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#94A3B8] block">
                  Planning Engine
                </span>
                <button
                  onClick={() => setPlannerExpanded(!plannerExpanded)}
                  className="text-[#94A3B8] hover:text-[#475569]"
                >
                  <ChevronDown className={`w-3 h-3 transition-transform ${plannerExpanded ? '' : '-rotate-90'}`} />
                </button>
              </div>
            )}
            <div className="space-y-1">
              <button
                onClick={() => setRoute('planner')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive('planner')
                    ? 'bg-[#EEF4FF] text-[#2563EB] font-extrabold border-r-2 border-[#2563EB] shadow-2xs'
                    : 'text-[#475569] hover:bg-[#EEF4FF]/70 hover:text-[#2563EB]'
                }`}
                title="6-Step Planning Calculator"
              >
                <Calculator className="w-4 h-4 shrink-0 text-blue-600" />
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>Main Planner</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded font-mono font-bold">6 Steps</span>
                  </div>
                )}
              </button>

              {/* Sub-steps of Planner */}
              {!collapsed && plannerExpanded && (
                <div className="pl-6 space-y-0.5 border-l border-[#E2E8F0] ml-4 py-1">
                  {plannerSteps.map((s) => (
                    <button
                      key={s.step}
                      onClick={() => setRoute('planner', s.step)}
                      className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors text-left ${
                        isActive('planner')
                          ? 'text-[#334155] hover:text-blue-600 hover:bg-[#EEF4FF]/50'
                          : 'text-[#64748B] hover:text-blue-600 hover:bg-[#EEF4FF]/50'
                      }`}
                    >
                      <s.icon className="w-3 h-3 text-[#94A3B8] shrink-0" />
                      <span className="truncate">{s.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Group 3: Quantity Surveying & Contracts */}
          <div>
            {!collapsed && (
              <span className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-[#94A3B8] block mb-1">
                Commercial BOQ
              </span>
            )}
            <div className="space-y-1">
              <button
                onClick={() => setRoute('commercial-boq')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive('commercial-boq')
                    ? 'bg-[#ECFDF5] text-[#059669] font-extrabold border-r-2 border-[#059669] shadow-2xs'
                    : 'text-[#475569] hover:bg-[#ECFDF5]/70 hover:text-[#059669]'
                }`}
                title="Commercial BOQ Workspace"
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0 text-emerald-600" />
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>Commercial BOQ</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold">
                      EXCEL / QS
                    </span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Group 4: Architectural Studio */}
          <div>
            {!collapsed && (
              <span className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-[#94A3B8] block mb-1">
                CAD & Architect
              </span>
            )}
            <div className="space-y-1">
              <button
                onClick={() => setRoute('floor-plan')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive('floor-plan')
                    ? 'bg-[#F5F0FF] text-[#7C3AED] font-extrabold border-r-2 border-[#7C3AED] shadow-2xs'
                    : 'text-[#475569] hover:bg-[#F5F0FF]/70 hover:text-[#7C3AED]'
                }`}
                title="AI Floor Plan Studio"
              >
                <Compass className="w-4 h-4 shrink-0 text-violet-600" />
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>Floor Plan Studio</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-violet-100 text-violet-800 border border-violet-200 font-bold">
                      CAD AI
                    </span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Group 5: Projects & Output */}
          <div>
            {!collapsed && (
              <span className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-[#94A3B8] block mb-1">
                Project Files
              </span>
            )}
            <div className="space-y-1">
              <button
                onClick={onOpenSavedModal}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold text-[#475569] hover:bg-[#FFFBEB] hover:text-amber-700 transition-all text-left"
                title="Saved Estimates"
              >
                <FolderKanban className="w-4 h-4 shrink-0 text-amber-600" />
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>Saved Estimates</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-mono font-bold">
                      {savedProjects?.length || 0}
                    </span>
                  </div>
                )}
              </button>

              <button
                onClick={() => setRoute('report')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive('report')
                    ? 'bg-[#EEF4FF] text-[#2563EB] font-extrabold border-r-2 border-[#2563EB] shadow-2xs'
                    : 'text-[#475569] hover:bg-[#EEF4FF]/70 hover:text-[#2563EB]'
                }`}
                title="Formal Estimation Reports"
              >
                <FileCheck2 className="w-4 h-4 shrink-0 text-blue-600" />
                {!collapsed && <span>Formal Report</span>}
              </button>
            </div>
          </div>

        </nav>
      </div>

      {/* Bottom Profile & Settings Area */}
      <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="space-y-1">
          <button
            onClick={() => setRoute('settings')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              isActive('settings')
                ? 'bg-white border border-[#CBD5E1] text-[#172033] shadow-xs'
                : 'text-[#475569] hover:bg-slate-200/60 hover:text-[#172033]'
            }`}
            title="System Settings"
          >
            <Settings className="w-4 h-4 shrink-0 text-[#64748B]" />
            {!collapsed && <span>Settings & Units</span>}
          </button>

          {/* User Status / Role Card */}
          <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'B'}
              </div>
              {!collapsed && (
                <div className="truncate text-left leading-tight">
                  <div className="text-xs font-bold text-[#172033] truncate">
                    {currentUser?.name || 'Chief Estimator'}
                  </div>
                  <div className="text-[10px] text-blue-600 font-semibold flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-blue-600" />
                    <span>{currentUser?.isAdmin ? 'Platform Admin' : 'QS License'}</span>
                  </div>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                onClick={logout}
                className="w-7 h-7 rounded-lg hover:bg-slate-200/80 text-[#94A3B8] hover:text-rose-600 flex items-center justify-center transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
