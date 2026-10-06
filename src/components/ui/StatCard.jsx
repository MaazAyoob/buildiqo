import React from 'react';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue', // 'blue' | 'amber' | 'emerald' | 'violet' | 'dark'
  trend,
  trendType = 'up', // 'up' | 'down' | 'neutral'
  className = '',
  onClick
}) {
  const variantStyles = {
    blue: {
      card: 'card-metric-blue',
      iconBg: 'bg-blue-100 text-blue-700',
      title: 'text-slate-600',
      val: 'text-slate-900',
      sub: 'text-blue-700/80'
    },
    amber: {
      card: 'card-metric-amber',
      iconBg: 'bg-amber-100 text-amber-800',
      title: 'text-amber-900/70',
      val: 'text-slate-900',
      sub: 'text-amber-800/80'
    },
    emerald: {
      card: 'card-metric-emerald',
      iconBg: 'bg-emerald-100 text-emerald-800',
      title: 'text-emerald-900/70',
      val: 'text-slate-900',
      sub: 'text-emerald-800/80'
    },
    violet: {
      card: 'card-metric-violet',
      iconBg: 'bg-violet-100 text-violet-800',
      title: 'text-violet-900/70',
      val: 'text-slate-900',
      sub: 'text-violet-800/80'
    },
    dark: {
      card: 'card-metric-dark',
      iconBg: 'bg-slate-800 text-blue-400 border border-slate-700',
      title: 'text-slate-400',
      val: 'text-white',
      sub: 'text-slate-400'
    }
  };

  const style = variantStyles[variant] || variantStyles.blue;

  return (
    <div 
      onClick={onClick}
      className={`${style.card} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={`text-[11px] font-bold uppercase tracking-wider ${style.title}`}>
            {title}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-xl sm:text-2xl font-black font-mono tracking-tight tabular-nums ${style.val}`}>
              {value}
            </span>
            {trend && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                trendType === 'up' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {trend}
              </span>
            )}
          </div>
          {subtitle && (
            <p className={`text-xs mt-1 font-medium truncate ${style.sub}`}>
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;
