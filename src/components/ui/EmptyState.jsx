import React from 'react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = ''
}) {
  return (
    <div className={`bg-white rounded-3xl p-10 sm:p-14 text-center border border-dashed border-slate-200/90 shadow-2xs space-y-4 max-w-xl mx-auto my-6 ${className}`}>
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600 shadow-2xs">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <div className="space-y-1.5">
        <h3 className="text-base font-extrabold text-slate-800">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {(onAction || onSecondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          {onAction && actionLabel && (
            <button
              onClick={onAction}
              className="btn-brand-primary text-xs py-2 px-4 shadow-brand hover:shadow-brand-hover"
            >
              {actionLabel}
            </button>
          )}
          {onSecondaryAction && secondaryActionLabel && (
            <button
              onClick={onSecondaryAction}
              className="btn-brand-secondary text-xs py-2 px-4"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
