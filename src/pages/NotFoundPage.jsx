import React from 'react';
import { Building2, ArrowLeft } from 'lucide-react';

export function NotFoundPage({ setRoute }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-slate-900">Page Not Found</h1>
        <p className="text-xs text-gray-500">
          The planning workspace or report you are looking for does not exist or has been moved.
        </p>
        <button
          onClick={() => setRoute('home')}
          className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs hover:bg-slate-900 shadow-md inline-flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Homepage</span>
        </button>
      </div>
    </div>
  );
}