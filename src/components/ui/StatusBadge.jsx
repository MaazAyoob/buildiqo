import React from 'react';

export function StatusBadge({ 
  variant = 'neutral', 
  children, 
  size = 'md',
  dot = true,
  className = '' 
}) {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-[11px] px-2.5 py-1',
    lg: 'text-xs px-3 py-1.5'
  };

  const variants = {
    brand: {
      wrap: 'bg-blue-50 text-blue-700 border-blue-200/80',
      dot: 'bg-blue-600'
    },
    amber: {
      wrap: 'bg-amber-50 text-amber-800 border-amber-200/80',
      dot: 'bg-amber-500'
    },
    emerald: {
      wrap: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
      dot: 'bg-emerald-500'
    },
    violet: {
      wrap: 'bg-violet-50 text-violet-800 border-violet-200/80',
      dot: 'bg-violet-500'
    },
    rose: {
      wrap: 'bg-rose-50 text-rose-800 border-rose-200/80',
      dot: 'bg-rose-500'
    },
    neutral: {
      wrap: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400'
    },
    dark: {
      wrap: 'bg-slate-900 text-slate-100 border-slate-700',
      dot: 'bg-blue-400'
    }
  };

  const config = variants[variant] || variants.neutral;

  return (
    <span className={`inline-flex items-center font-bold tracking-tight rounded-md border shadow-2xs ${sizeClasses[size] || sizeClasses.md} ${config.wrap} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${config.dot}`} />
      )}
      {children}
    </span>
  );
}

export default StatusBadge;
