import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'ai' | 'amber'
  size = 'md',        // 'xs' | 'sm' | 'md' | 'lg'
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  disabled = false,
  children,
  className = '',
  onClick,
  type = 'button',
  ...rest
}) {
  const sizeClasses = {
    xs: 'px-2.5 py-1 text-xs rounded-lg gap-1.5',
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl gap-2',
    lg: 'px-5 py-2.5 text-sm sm:text-base font-bold rounded-xl gap-2.5'
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-brand hover:shadow-brand-hover active:scale-[0.98]',
    secondary: 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs hover:border-slate-300 active:scale-[0.98]',
    outline: 'bg-transparent hover:bg-blue-50 text-blue-600 border border-blue-600/60 active:scale-[0.98]',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 active:bg-slate-200',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs active:scale-[0.98]',
    ai: 'btn-ai-action',
    amber: 'btn-brand-amber'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${className}`}
      {...rest}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children && <span>{children}</span>}
      {!loading && IconRight && <IconRight className="w-4 h-4 shrink-0" />}
    </button>
  );
}

export default Button;
