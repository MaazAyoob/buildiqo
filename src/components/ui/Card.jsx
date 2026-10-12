import React from 'react';

export function Card({
  variant = 'default', // 'default' | 'interactive' | 'elevated' | 'glass' | 'dark'
  children,
  className = '',
  onClick,
  ...rest
}) {
  const variantClasses = {
    default: 'bg-white border border-slate-200/90 rounded-2xl shadow-card',
    interactive: 'card-architect-interactive',
    elevated: 'bg-white border border-slate-200/90 rounded-2xl shadow-card-elevated',
    glass: 'glass-card rounded-2xl',
    dark: 'bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-xl'
  };

  return (
    <div
      onClick={onClick}
      className={`${variantClasses[variant] || variantClasses.default} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  badge,
  action,
  icon: Icon,
  className = ''
}) {
  return (
    <div className={`p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 truncate">
              {title}
            </h3>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`p-4 sm:p-5 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl ${className}`}>
      {children}
    </div>
  );
}

export default Card;
