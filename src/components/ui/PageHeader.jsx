import React from 'react';

export function PageHeader({
  badge,
  badgeVariant = 'brand',
  title,
  subtitle,
  icon: Icon,
  actions,
  className = ''
}) {
  return (
    <div className={`bg-gradient-to-r from-blue-50/95 via-sky-50/50 to-indigo-50/80 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-blue-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}>
      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
        {Icon && (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-blue-500/25 border border-blue-400/30 shrink-0">
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {title}
            </h1>
            {badge && (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                badgeVariant === 'amber' ? 'bg-amber-500 text-white shadow-2xs' :
                badgeVariant === 'emerald' ? 'bg-emerald-600 text-white shadow-2xs' :
                badgeVariant === 'violet' ? 'bg-violet-600 text-white shadow-2xs' :
                'bg-blue-600 text-white shadow-2xs'
              }`}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
