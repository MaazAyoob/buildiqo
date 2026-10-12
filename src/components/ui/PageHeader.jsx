import React from 'react';

export function PageHeader({
  badge,
  badgeVariant = 'brand',
  title,
  subtitle,
  icon: Icon,
  actions,
  breadcrumbs,
  className = ''
}) {
  const badgeColors = {
    amber: 'bg-amber-500 text-white shadow-2xs',
    emerald: 'bg-emerald-600 text-white shadow-2xs',
    violet: 'bg-violet-600 text-white shadow-2xs',
    cyan: 'bg-cyan-600 text-white shadow-2xs',
    teal: 'bg-teal-600 text-white shadow-2xs',
    rose: 'bg-rose-600 text-white shadow-2xs',
    brand: 'bg-blue-600 text-white shadow-2xs'
  };

  return (
    <div className={`bg-gradient-to-r from-blue-50/90 via-sky-50/40 to-indigo-50/70 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-blue-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}>
      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
        {Icon && (
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-blue-500/20 border border-blue-400/30 shrink-0">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        )}
        <div className="min-w-0">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mb-1">
              {breadcrumbs.map((b, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-slate-400">/</span>}
                  {b.onClick ? (
                    <button onClick={b.onClick} className="hover:text-blue-600 transition-colors">
                      {b.label}
                    </button>
                  ) : (
                    <span className="text-slate-700 font-semibold">{b.label}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              {title}
            </h1>
            {badge && (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${badgeColors[badgeVariant] || badgeColors.brand}`}>
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
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 pt-2 sm:pt-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
