import React, { useState } from 'react';
import { 
  FolderKanban, 
  PlusCircle, 
  Trash2, 
  ArrowRight, 
  Copy, 
  Calendar, 
  Building, 
  Search, 
  Printer, 
  Layers,
  Sparkles
} from 'lucide-react';
import { useEstimateStore, formatCurrency, formatNumber } from '../store/useEstimateStore';

export function DashboardPage({ setRoute }) {
  const { savedProjects, loadProject, deleteProject, resetToNewProject, saveCurrentProject } = useEstimateStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = savedProjects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-16">
      
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Saved Project Estimations</h1>
              <p className="text-xs text-gray-500">Manage, compare, and reopen your saved home construction estimates</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleStartNew}
          className="px-5 py-3 rounded-2xl bg-blue-600 text-white font-extrabold text-xs hover:bg-slate-900 shadow-md flex items-center space-x-2 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-amber-200" />
          <span>New Project Estimate</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by project name or city..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
          />
        </div>

        <span className="text-xs font-bold text-gray-500">
          Showing {filteredProjects.length} of {savedProjects.length} projects
        </span>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200 space-y-4">
          <FolderKanban className="w-16 h-16 text-gray-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-700">No saved estimations found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              You haven't saved any construction estimates yet or no projects matched your search.
            </p>
          </div>
          <button
            onClick={handleStartNew}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-slate-900 shadow-sm"
          >
            Create Your First Estimate
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50/60 text-blue-700 border border-blue-200">
                    {p.tier || 'Standard'} Tier
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {new Date(p.savedAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {p.name}
                </h3>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-500">Estimated Cost:</span>
                    <span className="text-lg font-black text-slate-900">{formatCurrency(p.totalCost)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600 pt-1 border-t border-slate-200">
                    <span>{formatNumber(p.builtupArea)} sq.ft BUA</span>
                    <span>{formatCurrency(p.costPerSqFt)} / sq.ft</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => handleLoad(p.id)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-slate-900 flex items-center space-x-1.5 shadow-sm"
                >
                  <span>Open Planner</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleDuplicate(p)}
                    className="p-2 rounded-lg text-gray-400 hover:text-blue-700 hover:bg-slate-100/60"
                    title="Duplicate project"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteProject(p.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}