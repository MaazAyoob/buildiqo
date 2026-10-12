import React, { useState, useMemo } from 'react';
import { 
  FolderKanban, 
  PlusCircle, 
  Trash2, 
  ArrowRight, 
  Copy, 
  Calendar, 
  Building, 
  Search, 
  Layers, 
  Sparkles, 
  TrendingUp, 
  MapPin, 
  Filter, 
  CheckCircle2, 
  HardHat, 
  Compass, 
  FileSpreadsheet,
  FileCheck2,
  Sliders,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Activity,
  Boxes
} from 'lucide-react';
import { useEstimateStore, formatCurrency, formatNumber } from '../store/useEstimateStore';

export function DashboardPage({ setRoute }) {
  const { savedProjects, loadProject, deleteProject, resetToNewProject, saveCurrentProject } = useEstimateStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Top portfolio analytics derived strictly from real saved projects
  const portfolioStats = useMemo(() => {
    const count = savedProjects.length;
    const totalCost = savedProjects.reduce((sum, p) => sum + (Number(p.totalCost) || 0), 0);
    const avgBua = count > 0 ? Math.round(savedProjects.reduce((sum, p) => sum + (Number(p.builtupArea) || 0), 0) / count) : 0;
    const uniqueCities = new Set(savedProjects.map(p => p.city).filter(Boolean)).size;
    return { count, totalCost, avgBua, uniqueCities };
  }, [savedProjects]);

  // Filter & Sort
  const filteredProjects = useMemo(() => {
    let result = savedProjects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTier = selectedTier === 'ALL' || (p.tier || 'standard').toLowerCase() === selectedTier.toLowerCase();
      return matchesSearch && matchesTier;
    });

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));
    } else if (sortBy === 'cost_desc') {
      result.sort((a, b) => (Number(b.totalCost) || 0) - (Number(a.totalCost) || 0));
    } else if (sortBy === 'bua_desc') {
      result.sort((a, b) => (Number(b.builtupArea) || 0) - (Number(a.builtupArea) || 0));
    }

    return result;
  }, [savedProjects, searchQuery, selectedTier, sortBy]);

  const handleStartNew = () => {
    resetToNewProject();
    setRoute('planner', 1);
  };

  const handleLoad = (id) => {
    if (loadProject(id)) {
      setRoute('planner');
    }
  };

  const handleDuplicate = (project) => {
    if (project && project.state) {
      loadProject(project.id);
      saveCurrentProject(`${project.name} (Copy)`);
    }
  };

  const getTierColor = (tier) => {
    const t = (tier || 'standard').toLowerCase();
    if (t === 'luxury') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (t === 'premium') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left pb-16 text-[#172033]">
      
      {/* 1. Portfolio Header Strip */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-sm relative overflow-hidden text-[#172033]">
        
        {/* Background Subtle Radial Glow */}
        <div 
          className="absolute -top-24 -right-10 w-96 h-96 pointer-events-none opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(37,99,235,0.08), rgba(8,145,178,0.04) 50%, transparent 70%)'
          }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black uppercase tracking-wider">
                PORTFOLIO COMMAND CENTER
              </span>
              <span className="text-[#94A3B8]">•</span>
              <span className="text-xs text-[#64748B] font-mono">IS 456 / NBC 2016 Compliant</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#172033] tracking-tight">
              Construction Portfolio Overview
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed font-normal">
              Manage saved engineering models, compare package costs, launch parametric CAD floor plans, and generate bank-ready quantity takeoff reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setRoute('floor-plan')}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#CBD5E1] text-[#172033] hover:text-purple-600 text-xs font-bold flex items-center space-x-2 transition-colors shadow-2xs"
            >
              <Compass className="w-4 h-4 text-purple-600" />
              <span>CAD Studio</span>
            </button>

            <button
              onClick={() => setRoute('commercial-boq')}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#CBD5E1] text-[#172033] hover:text-emerald-600 text-xs font-bold flex items-center space-x-2 transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Commercial BOQ</span>
            </button>

            <button
              onClick={handleStartNew}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-all active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>Create New Estimate</span>
            </button>
          </div>
        </div>

        {/* 2. Portfolio Analytics Metric Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-[#E2E8F0]">
          
          <div className="bg-white p-4.5 rounded-2xl border border-[#BAE6FD] border-t-4 border-t-cyan-500 shadow-xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] flex items-center justify-between">
              <span>Saved Projects</span>
              <Building className="w-3.5 h-3.5 text-cyan-600" />
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-[#172033] tabular-nums">
              {portfolioStats.count}
            </div>
            <span className="text-[11px] text-[#64748B] block">Active engineering models</span>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-[#BFDBFE] border-t-4 border-t-blue-600 shadow-xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] flex items-center justify-between">
              <span>Total Portfolio Value</span>
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-blue-600 tabular-nums">
              {formatCurrency(portfolioStats.totalCost)}
            </div>
            <span className="text-[11px] text-[#64748B] block">Cumulative estimated civil cost</span>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-[#A7F3D0] border-t-4 border-t-emerald-500 shadow-xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] flex items-center justify-between">
              <span>Average Built-Up Area</span>
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-[#172033] tabular-nums">
              {formatNumber(portfolioStats.avgBua)} <span className="text-xs font-normal text-[#64748B]">sq.ft</span>
            </div>
            <span className="text-[11px] text-[#64748B] block">Super built-up area (SBA)</span>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-[#DDD6FE] border-t-4 border-t-purple-500 shadow-xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] flex items-center justify-between">
              <span>Jurisdictions</span>
              <MapPin className="w-3.5 h-3.5 text-purple-600" />
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-purple-700 tabular-nums">
              {portfolioStats.uniqueCities || (savedProjects.length > 0 ? 1 : 0)}
            </div>
            <span className="text-[11px] text-[#64748B] block">State benchmarks resolved</span>
          </div>

        </div>

      </div>

      {/* 3. Filter Bar & Project Browser */}
      <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm space-y-6 text-[#172033]">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-base font-black text-[#172033] tracking-tight">
              Saved Estimation Models ({filteredProjects.length})
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Select any project to resume editing in the 6-step planning workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search project name or city..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-blue-600 w-52 sm:w-64"
              />
            </div>

            {/* Tier Filter */}
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-xs font-bold text-[#334155] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Tiers</option>
              <option value="standard">Standard Tier</option>
              <option value="premium">Premium Tier</option>
              <option value="luxury">Luxury Tier</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-xs font-bold text-[#334155] focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="cost_desc">Highest Cost</option>
              <option value="bua_desc">Largest Area</option>
            </select>
          </div>
        </div>

        {/* Project Cards Grid / Table */}
        {filteredProjects.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
              <FolderKanban className="w-7 h-7 text-blue-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#172033]">No Estimations Found</h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                {searchQuery ? 'No estimates match your search criteria.' : 'You have not saved any civil estimations yet. Start a new estimate to model construction costs.'}
              </p>
            </div>
            <button
              onClick={handleStartNew}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md inline-flex items-center space-x-2"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>Launch First Estimate</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((p) => {
              const tierClass = getTierColor(p.tier);
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl p-5 border border-[#E2E8F0] hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group shadow-2xs text-[#172033]"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${tierClass}`}>
                        {(p.tier || 'standard').toUpperCase()} TIER
                      </span>
                      <span className="text-[11px] text-[#94A3B8] font-mono">
                        {p.savedAt ? new Date(p.savedAt).toLocaleDateString() : 'Active'}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-[#172033] tracking-tight truncate group-hover:text-blue-600 transition-colors">
                      {p.name}
                    </h3>

                    <div className="flex items-center space-x-2 text-xs text-[#64748B]">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{p.city || 'Bengaluru'}, {p.state?.state || 'Karnataka'}</span>
                    </div>

                    {/* Metric Blocks */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E2E8F0] font-mono text-xs">
                      <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                        <span className="text-[10px] uppercase font-bold text-[#64748B] block font-sans">BUA (SBA)</span>
                        <span className="font-bold text-[#172033] tabular-nums">{formatNumber(p.builtupArea)} sq.ft</span>
                      </div>
                      <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                        <span className="text-[10px] uppercase font-bold text-[#64748B] block font-sans">Est. Cost</span>
                        <span className="font-black text-blue-600 tabular-nums">{formatCurrency(p.totalCost)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleDuplicate(p)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#64748B] hover:text-[#172033] transition-colors"
                        title="Duplicate Estimate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => deleteProject(p.id)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#64748B] hover:text-rose-600 transition-colors"
                        title="Delete Estimate"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleLoad(p.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-xs"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3 h-3 text-white" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}

export default DashboardPage;