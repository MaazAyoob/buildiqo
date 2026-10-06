import React from 'react';
import { Building2, ArrowLeft, Compass } from 'lucide-react';

export function NotFoundPage({ setRoute }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-xs rounded-3xl p-8 border border-slate-200/90 shadow-card space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-200/60 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
          <Compass className="w-8 h-8 text-blue-600 animate-spin-slow" />
        </div>
        
        <div className="space-y-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/80">
            Error 404 • Workspace Missing
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            The architectural model, BOQ estimate, or planning tool you requested was not located on this coordinate.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={() => setRoute('home')}
            className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-xs shadow-brand flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4 text-sky-200" />
            <span>Return to Project Overview</span>
          </button>
        </div>
      </div>
    </div>
  );
}