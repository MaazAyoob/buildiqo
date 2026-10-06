import React from 'react';

export function LoadingSkeleton({ variant = 'card', count = 1, className = '' }) {
  const items = Array.from({ length: count });

  if (variant === 'metric') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {items.map((_, i) => (
          <div key={i} className="card-architect p-5 space-y-3 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="h-3 bg-slate-200 rounded w-1/3" />
              <div className="w-8 h-8 bg-slate-200 rounded-xl" />
            </div>
            <div className="h-7 bg-slate-200 rounded w-1/2" />
            <div className="h-3 bg-slate-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`card-architect p-6 space-y-4 animate-pulse ${className}`}>
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="flex gap-4 items-center py-2 border-b border-slate-100">
              <div className="h-4 bg-slate-200 rounded w-1/5" />
              <div className="h-4 bg-slate-100 rounded w-1/4" />
              <div className="h-4 bg-slate-100 rounded w-1/6" />
              <div className="h-4 bg-slate-200 rounded w-1/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((_, i) => (
        <div key={i} className="card-architect p-6 space-y-3 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-3 bg-slate-100 rounded w-2/3" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default LoadingSkeleton;
