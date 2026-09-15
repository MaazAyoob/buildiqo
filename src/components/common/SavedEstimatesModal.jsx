import React, { useState } from 'react';
import { X, FolderKanban, Trash2, ArrowRight, Copy, Calendar, Building, Clock } from 'lucide-react';
import { useEstimateStore, formatCurrency, formatNumber } from '../../store/useEstimateStore';

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Saved Estimations</h3>
              <p className="text-xs text-gray-500">Manage and switch between your saved residential estimates</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-slate-100/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Save Current Project Bar */}
        <div className="mt-4 p-3.5 bg-blue-50/60 rounded-xl border border-blue-50">
          {!isSavingCurrent ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Want to snapshot the current estimate?</p>
                <p className="text-[11px] text-blue-800">Save current configuration to local storage</p>
              </div>
              <button
                onClick={() => setIsSavingCurrent(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-slate-900"
              >
                Save Current
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveActive} className="flex space-x-2">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Enter estimate name (e.g. 30x40 North Facing G+1)"
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-slate-900"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsSavingCurrent(false)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-gray-600 hover:bg-slate-100/60"
              >
                Cancel
              </button>
            </form>
          )}
        </div>

        {/* Projects List */}
        <div className="mt-4 max-h-80 overflow-y-auto space-y-2.5 pr-1">
          {savedProjects.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <FolderKanban className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">No saved estimations yet</p>
              <p className="text-xs text-gray-500 mt-0.5">Click "Save Current" to create your first saved project</p>
            </div>
          ) : (
            savedProjects.map((p) => (
              <div 
                key={p.id}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/60/30 transition-all flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-slate-900">{p.name}</h4>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-gray-700">
                      {p.tier}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Building className="w-3.5 h-3.5 text-blue-800" />
                      <span>{formatNumber(p.builtupArea)} sq.ft ({p.numFloors} Floors)</span>
                    </span>
                    <span>•</span>
                    <span className="font-bold text-blue-700">{formatCurrency(p.totalCost)}</span>
                    <span>•</span>
                    <span className="text-gray-400 text-[11px] flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(p.savedAt || Date.now()).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      onSelectProject(p.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-slate-900 flex items-center space-x-1 shadow-sm"
                  >
                    <span>Load</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteProject(p.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete estimate"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold border border-slate-200 text-gray-700 hover:bg-slate-100/60"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}