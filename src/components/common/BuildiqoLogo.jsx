import React from 'react';

/**
 * Buildiqo.AI Official Brand Logo Component
 * Derived directly from the client's vector logo:
 * - Precision regular hexagon with slate-900 border
 * - 3 ascending estimation metric bars (Light Sky Blue, Royal Blue, Deep Cobalt Blue)
 * - Amber/orange intelligence dot over the tallest bar
 * - Modern geometric wordmark "build[i]qo" with royal blue "i"
 * - Architectural subtitle "CIVIL COST ESTIMATOR & 3D BOQ"
 */
export function BuildiqoLogo({ 
  variant = 'full', 
  theme = 'light', 
  className = '',
  markClassName = '',
  textClassName = '',
  subtitle = true,
  onClick
}) {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#0F172A';
  const subColor = isDark ? '#94A3B8' : '#475569';
  const hexBorder = isDark ? '#F8FAFC' : '#0F172A';

  // Standalone Mark (Hexagon Badge Only)
  if (variant === 'mark') {
    return (
      <svg 
        viewBox="0 0 128 128" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={className || "w-10 h-10 shrink-0"}
        onClick={onClick}
        role="img"
        aria-label="Buildiqo Icon"
      >
        <polygon 
          points="64,10 110,36 110,92 64,118 18,92 18,36" 
          stroke={hexBorder} 
          strokeWidth="9.5" 
          strokeLinejoin="round" 
          strokeLinecap="round" 
          fill="none"
        />
        <rect x="36" y="68" width="13" height="30" rx="2" fill="#93C5FD" />
        <rect x="58" y="44" width="13" height="54" rx="2" fill="#2563EB" />
        <rect x="80" y="26" width="13" height="72" rx="2" fill="#1D4ED8" />
        <circle cx="86.5" cy="15.5" r="7.5" fill="#F59E0B" />
      </svg>
    );
  }

  // Horizontal Compact (Mark + "buildiqo.ai")
  if (variant === 'horizontal') {
    return (
      <div 
        onClick={onClick} 
        className={`flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        <svg 
          viewBox="0 0 128 128" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className={markClassName || "w-9 h-9 shrink-0"}
          role="img"
          aria-label="Buildiqo Icon"
        >
          <polygon 
            points="64,10 110,36 110,92 64,118 18,92 18,36" 
            stroke={hexBorder} 
            strokeWidth="9.5" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
            fill="none"
          />
          <rect x="36" y="68" width="13" height="30" rx="2" fill="#93C5FD" />
          <rect x="58" y="44" width="13" height="54" rx="2" fill="#2563EB" />
          <rect x="80" y="26" width="13" height="72" rx="2" fill="#1D4ED8" />
          <circle cx="86.5" cy="15.5" r="7.5" fill="#F59E0B" />
        </svg>
        <div className="flex flex-col justify-center">
          <div className="flex items-center leading-none">
            <span className={`font-black text-xl tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} ${textClassName}`}>
              build<span className="text-blue-600">i</span>qo<span className="text-blue-600 font-extrabold text-sm ml-0.5">.ai</span>
            </span>
          </div>
          {subtitle && (
            <span className={`text-[9px] font-semibold tracking-wider uppercase mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Civil Estimator &amp; 3D BOQ
            </span>
          )}
        </div>
      </div>
    );
  }

  // Full Brand Logo SVG (True to PDF artwork)
  return (
    <svg 
      viewBox="0 0 560 140" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className || "h-11 w-auto max-w-full"}
      onClick={onClick}
      role="img"
      aria-label="Buildiqo.AI Civil Cost Estimator &amp; 3D BOQ"
    >
      {/* Hexagonal Brand Mark */}
      <polygon 
        points="76,14 124,42 124,98 76,126 28,98 28,42" 
        stroke={hexBorder} 
        strokeWidth="9.5" 
        strokeLinejoin="round" 
        strokeLinecap="round" 
        fill="none" 
      />
      {/* 3 Ascending Metric Bars */}
      <rect x="47" y="74" width="14" height="30" rx="2" fill="#93C5FD" />
      <rect x="69" y="50" width="14" height="54" rx="2" fill="#2563EB" />
      <rect x="91" y="32" width="14" height="72" rx="2" fill="#1D4ED8" />
      {/* Intelligence Amber Sun */}
      <circle cx="98" cy="21" r="7.5" fill="#F59E0B" />

      {/* Wordmark: buildiqo */}
      <g fontFamily="'Plus Jakarta Sans', 'Outfit', 'Inter', system-ui, sans-serif">
        <text x="156" y="80" fontSize="64" fontWeight="800" letterSpacing="-1.5">
          <tspan fill={textColor}>build</tspan><tspan fill="#2563EB">i</tspan><tspan fill={textColor}>qo</tspan>
        </text>
        
        {subtitle && (
          <text 
            x="158" 
            y="110" 
            fontSize="18.5" 
            fontWeight="600" 
            fill={subColor} 
            letterSpacing="4.5"
          >
            CIVIL COST ESTIMATOR &amp; 3D BOQ
          </text>
        )}
      </g>
    </svg>
  );
}

export default BuildiqoLogo;
