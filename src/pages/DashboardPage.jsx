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
  Compass
} from 'lucide-react';
import { useEstimateStore, formatCurrency, formatNumber } from '../store/useEstimateStore';
import { PageHeader, StatCard, StatusBadge, EmptyState } from '../components/ui';

export function DashboardPage({ setRoute }) {
  const { savedProjects, loadProject, deleteProject, resetToNewProject, saveCurrentProject } = useEstimateStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Top portfolio analytics
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
    setRoute('planner');
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

  const getTierBadgeProps = (tier) => {
    const t = (tier || 'standard').toLowerCase();
    if (t === 'luxury') return { variant: 'violet', label: 'Luxury Tier' };
    if (t === 'premium') return { variant: 'brand', label: 'Premium Tier' };
    return { variant: 'emerald', label: 'Standard Tier' };
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-20 text-left">
      
      {/* 1. Page Header */}
      <PageHeader
        icon={FolderKanban}
        badge="ENGINEERING WORKSPACE"
        badgeVariant="brand"
        title="Saved Project Estimations"
        subtitle="Manage, compare, and reopen your saved residential construction estimates and IS 456 BOQ takeoffs."
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setRoute('floor-plan')}
              className="btn-ai-action text-xs py-2 px-3.5"
            >
              <Compass className="w-4 h-4" />
              <span>AI Floor Plan</span>
            </button>
            <button
              onClick={handleStartNew}
              className="btn-brand-primary text-xs py-2 px-4 shadow-brand hover:shadow-brand-hover"
            >
              <PlusCircle className="w-4 h-4 text-amber-200" />
              <span>New Estimate</span>
            </button>
          </div>
        }
      />

      {/* 2. Portfolio Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          variant="blue"
          icon={Building}
          title="Saved Estimations"
          value={portfolioStats.count}
          subtitle="Active project models"
        />
        <StatCard
          variant="emerald"
          icon={TrendingUp}
          title="Total Portfolio Value"
          value={formatCurrency(portfolioStats.totalCost)}
          subtitle="Cumulative civil takeoff"
        />
        <StatCard
          variant="amber"
          icon={Layers}
          title="Avg Built-up Area"
          value={`${formatNumber(portfolioStats.avgBua)} sq.ft`}
          subtitle="Average floor layout size"
        />
        <StatCard
          variant="violet"
          icon={MapPin}
          title="Regional Markets"
          value={portfolioStats.uniqueCities || (savedProjects.length > 0 ? 1 : 0)}
          subtitle="IS 456 regional indices"
        />
      </div>

      {/* 3. Search, Filter & Sorting Bar */}
      <div className="card-workspace p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by project name or city..."
            className="input-architect w-full pl-9 pr-4 py-2 text-xs bg-slate-50/50 focus:bg-white"
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tier Filter Pills */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            {['ALL', 'standard', 'premium', 'luxury'].map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-3 py-1 rounded-lg font-bold capitalize transition-all ${
                  selectedTier === tier 
                    ? 'bg-white text-blue-700 shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-architect py-1.5 px-3 text-xs bg-white text-slate-700 font-semibold"
          >
            <option value="newest">Recently Saved</option>
            <option value="cost_desc">Highest Estimate</option>
            <option value="bua_desc">Largest Area (BUA)</option>
          </select>
        </div>

      </div>

      {/* 4. Projects Grid */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={savedProjects.length === 0 ? "No saved estimations yet" : "No matching estimates found"}
          description={
            savedProjects.length === 0
              ? "Start a new project estimate to configure plot dimensions, space program, materials, and generate IS 456 BOQ schedules."
              : "Try adjusting your search query or tier filters above."
          }
          actionLabel="Create Your First Estimate"
          onAction={handleStartNew}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p) => {
            const badgeProps = getTierBadgeProps(p.tier);
            return (
              <div
                key={p.id}
                className="card-workspace p-6 flex flex-col justify-between space-y-5 hover:border-blue-400 group transition-all"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge variant={badgeProps.variant} size="sm">
                      {badgeProps.label}
                    </StatusBadge>
                    <span className="text-[11px] text-slate-400 font-medium font-mono">
                      {new Date(p.savedAt || Date.now()).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {p.name}
                    </h3>
                    {p.city && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{p.city}</span>
                      </p>
                    )}
                  </div>

                  {/* Financial Snapshot Box */}
                  <div className="p-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 rounded-2xl border border-blue-100/80 space-y-2.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-500 font-medium">Estimated Cost:</span>
                      <span className="text-lg font-black font-mono text-slate-900 tabular-nums">
                        {formatCurrency(p.totalCost)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200/80">
                      <span className="font-semibold">{formatNumber(p.builtupArea)} sq.ft BUA</span>
                      <span className="font-mono text-blue-700 font-bold">{formatCurrency(p.costPerSqFt)} / sq.ft</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleLoad(p.id)}
                    className="btn-brand-primary text-xs py-2 px-3.5 shadow-xs hover:shadow-brand"
                  >
                    <span>Open Planner</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleDuplicate(p)}
                      className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Duplicate project"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteProject(p.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

export default DashboardPage;