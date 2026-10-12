import React from 'react';
import {
  Menu,
  Building2,
  Bookmark,
  Share2,
  FileCheck2,
  Plus,
  FolderOpen,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { useEstimateStore, formatCurrency, formatNumber } from '../../store/useEstimateStore';

const ROUTE_TITLES = {
  dashboard: { title: 'Construction Portfolio', subtitle: 'Overview, KPIs & Recent Estimates' },
  planner: { title: '6-Step Planning Engine', subtitle: 'Deterministic Structural Estimation' },
  'commercial-boq': { title: 'Commercial BOQ Workspace', subtitle: 'Excel Workbook Takeoff & Contract Pricing' },
  'floor-plan': { title: 'AI Floor Plan Studio', subtitle: 'Parametric CAD & Topological Vector Solver' },
  report: { title: 'Executive Project Report', subtitle: 'Client Presentation & Formal Schedule' },
  admin: { title: 'Material Rates Administration', subtitle: 'Authoritative State Price Benchmarks' },
  leads: { title: 'Inquiries CRM', subtitle: 'Client Inquiries & Transaction Verification' },
  settings: { title: 'System Settings', subtitle: 'Units, Currency & Project Defaults' }
};

export function WorkspaceHeader({ currentRoute, setRoute, onOpenSavedModal, onOpenMobileMenu }) {
  const { state, estimation, saveCurrentProject, savedProjects } = useEstimateStore();
  const routeMeta = ROUTE_TITLES[currentRoute] || { title: 'Civil Workspace', subtitle: 'Buildiqo.AI Platform' };

  return (
    <header className="h-16 px-4 sm:px-6 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] flex items-center justify-between gap-3 sticky top-0 z-20 text-[#172033] shadow-2xs">
      
      {/* Left: Mobile Toggle & Workspace Title */}
      <div className="flex items-center space-x-3 overflow-hidden">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-slate-50 border border-[#CBD5E1] text-[#475569] hover:text-[#172033]"
          title="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-xs text-[#64748B]">
          <span className="hidden md:inline font-bold text-[#64748B] hover:text-[#172033] cursor-pointer" onClick={() => setRoute('dashboard')}>
            Buildiqo
          </span>
          <ChevronRight className="hidden md:inline w-3.5 h-3.5 text-[#94A3B8]" />
          <div className="flex flex-col">
            <h1 className="text-xs sm:text-sm font-black text-[#172033] tracking-tight leading-none truncate">
              {routeMeta.title}
            </h1>
            <span className="text-[10px] text-[#64748B] hidden sm:block truncate leading-tight mt-0.5">
              {routeMeta.subtitle}
            </span>
          </div>
        </div>
      </div>

      {/* Center / Right: Live Estimate Ticker & Quick Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        
        {/* Live Estimate Metric Ticker */}
        <div className="hidden sm:flex items-center space-x-3 bg-[#F0F5FF] border border-[#BFDBFE] px-3 py-1.5 rounded-xl shadow-2xs">
          <div className="flex items-baseline space-x-2">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#475569]">
              Est:
            </span>
            <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-[#172033]">
              {formatCurrency(estimation.estimatedCost || estimation.packageEstimate?.estimatedCost || 0)}
            </span>
            <span className="text-[10px] font-mono tabular-nums text-[#2563EB] font-bold bg-white border border-[#BFDBFE] px-1.5 py-0.2 rounded shadow-2xs">
              {formatCurrency(estimation.costPerSqFt || estimation.packageEstimate?.ratePerSqFt || 0)}/sq.ft
            </span>
          </div>
          <div className="h-4 w-px bg-blue-200" />
          <div className="text-[10px] font-mono text-[#64748B]">
            {formatNumber(estimation.totalBuiltupArea)} sq.ft SBA
          </div>
        </div>

        {/* Quick Action: New Estimate */}
        <button
          onClick={() => {
            setRoute('planner', 1);
          }}
          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center space-x-1.5 transition-all active:scale-[0.98]"
          title="Create New Project Estimate"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          <span className="hidden md:inline">New Estimate</span>
        </button>

        {/* Quick Action: Saved Projects */}
        <button
          onClick={onOpenSavedModal}
          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-[#CBD5E1] text-[#334155] hover:text-[#172033] font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-2xs"
          title="Browse Saved Estimates"
        >
          <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden lg:inline">Saved ({savedProjects?.length || 0})</span>
        </button>

        {/* Quick Action: Save Project */}
        <button
          onClick={() => saveCurrentProject(state.projectName)}
          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-[#CBD5E1] text-[#334155] hover:text-[#172033] font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-2xs"
          title="Save Active Estimate"
        >
          <Bookmark className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden xl:inline">Save</span>
        </button>

      </div>
    </header>
  );
}
