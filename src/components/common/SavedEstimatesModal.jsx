import React, { useState } from 'react';
import { X, FolderKanban, Trash2, ArrowRight, Copy, Calendar, Building, Clock, Bookmark, Plus } from 'lucide-react';
import { useEstimateStore, formatCurrency, formatNumber } from '../../store/useEstimateStore';
import { StatusBadge } from '../ui/StatusBadge';

export function SavedEstimatesModal({ isOpen, onClose, onSelectProject }) {
  const { savedProjects, deleteProject, saveCurrentProject } = useEstimateStore();
  const [saveName, setSaveName] = useState('');
  const [isSavingCurrent, setIsSavingCurrent] = useState(false);

  if (!isOpen) return null;

  const handleSaveActive = (e) => {
    e.preventDefault();
    if (!saveName.trim()) return;
    saveCurrentProject(saveName.trim());
    setSaveName('');
    setIsSavingCurrent(false);
  };

  const getTierBadgeProps = (tier) => {
    const t = (tier || 'standard').toLowerCase();
    if (t === 'luxury') return { variant: 'violet', label: 'Luxury' };
    if (t === 'premium') return { variant: 'brand', label: 'Premium' };
    return { variant: 'emerald', label: 'Standard' };
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-blue-200/90 overflow-hidden text-left">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-brand">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-slate-900">Saved Estimations</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {savedProjects.length} Projects
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Manage and switch between your saved residential estimates</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Save Current Project Bar */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 rounded-2xl border border-blue-200/80">
          {!isSavingCurrent ? (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-900">Snapshot Current Estimate</p>
                <p className="text-[11px] text-blue-700 font-medium">Save active configuration to local storage</p>
              </div>
              <button
                onClick={() => setIsSavingCurrent(true)}
                className="btn-brand-primary text-xs py-2 px-3.5 shadow-brand"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Current</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveActive} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Enter estimate name (e.g. 30x40 North Facing G+1)"
                className="input-architect flex-1 py-2 text-xs"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="btn-brand-primary text-xs py-2 px-4 shadow-brand"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsSavingCurrent(false)}
                  className="btn-brand-secondary text-xs py-2 px-3"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Projects List */}
        <div className="mt-4 max-h-80 overflow-y-auto space-y-2.5 pr-1">
          {savedProjects.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <FolderKanban className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No saved estimations yet</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">Click "Save Current" to preserve your project configuration.</p>
            </div>
          ) : (
            savedProjects.map((p) => {
              const badge = getTierBadgeProps(p.tier);
              return (
                <div 
                  key={p.id}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50/40 transition-all flex items-center justify-between group"
                >
                  <div className="space-y-1 min-w-0 pr-3">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">{p.name}</h4>
                      <StatusBadge variant={badge.variant} size="sm">
                        {badge.label}
                      </StatusBadge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center space-x-1 font-mono">
                        <Building className="w-3.5 h-3.5 text-blue-600" />
                        <span>{formatNumber(p.builtupArea)} sq.ft ({p.numFloors}F)</span>
                      </span>
                      <span>•</span>
                      <span className="font-mono font-black text-slate-900">{formatCurrency(p.totalCost)}</span>
                      <span>•</span>
                      <span className="text-slate-400 text-[11px] font-mono">
                        {new Date(p.savedAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => {
                        onSelectProject(p.id);
                        onClose();
                      }}
                      className="btn-brand-primary text-xs py-1.5 px-3 shadow-xs"
                    >
                      <span>Load</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteProject(p.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete estimate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="btn-brand-secondary text-xs py-2 px-4"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

export default SavedEstimatesModal;