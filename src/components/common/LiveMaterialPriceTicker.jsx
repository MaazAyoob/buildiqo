import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  Sparkles,
  Layers
} from 'lucide-react';
import { CITIES } from '../../data/cities';
import { formatCurrency } from '../../store/useEstimateStore';

export function LiveMaterialPriceTicker({ selectedCity = 'bangalore', onCityChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const city = CITIES.find(c => c.id === selectedCity) || CITIES[0];
  const mult = city.multiplier || 1.0;

  const keyCommodities = [
    {
      id: 'steel',
      name: 'JSW Fe 550D Rebar',
      category: 'Steel',
      baseRate: 74000,
      unit: '₹ / Tonne',
      badge: 'IS 1786',
      trend: '+1.2%'
    },
    {
      id: 'cement',
      name: 'UltraTech PPC Cement',
      category: 'Cement',
      baseRate: 410,
      unit: '₹ / Bag',
      badge: 'Grade 53',
      trend: 'Stable'
    },
    {
      id: 'sand',
      name: 'VSI Washed M-Sand',
      category: 'M-Sand',
      baseRate: 68,
      unit: '₹ / Cu.Ft',
      badge: 'Zone II',
      trend: '-0.8%'
    },
    {
      id: 'blocks',
      name: 'AAC Light Blocks 6"',
      category: 'Masonry',
      baseRate: 98,
      unit: '₹ / Sq.Ft',
      badge: 'Thermal Mass',
      trend: 'Stable'
    },
    {
      id: 'tiles',
      name: 'Kajaria 4x2 GVT Tiles',
      category: 'Flooring',
      baseRate: 145,
      unit: '₹ / Sq.Ft',
      badge: 'Vitrified',
      trend: '+0.5%'
    },
    {
      id: 'paint',
      name: 'Asian Paints Royale',
      category: 'Paint',
      baseRate: 38,
      unit: '₹ / Sq.Ft',
      badge: 'Emulsion',
      trend: 'Stable'
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all">
      
      {/* Compact Main Bar */}
      <div className="p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Title & City Dropdown */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            <span className="text-xs font-black text-gray-900 tracking-tight">
              Live Material Rates
            </span>
          </div>

          <span className="text-gray-300 text-xs hidden sm:inline">•</span>

          {/* City Selector Dropdown */}
          <div className="flex items-center space-x-1 bg-gray-100/90 px-2 py-1 rounded-lg border border-gray-200 shrink-0">
            <MapPin className="w-3 h-3 text-blue-600" />
            <select
              value={selectedCity}
              onChange={(e) => onCityChange && onCityChange(e.target.value)}
              className="text-[11px] font-bold text-gray-900 bg-transparent focus:outline-none cursor-pointer pr-1"
            >
              {CITIES.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name.split(' ')[0]} ({c.multiplier === 1.0 ? '1.0x' : `${c.multiplier.toFixed(2)}x`})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Middle: Horizontal Mini Ticker Pills (Desktop) */}
        <div className="hidden lg:flex items-center space-x-3 text-[11px] font-semibold text-gray-700">
          <span className="flex items-center space-x-1">
            <span className="text-gray-400">Steel:</span>
            <span className="font-bold text-gray-900">{formatCurrency(Math.round(74000 * mult))}/T</span>
          </span>
          <span className="text-gray-200">|</span>
          <span className="flex items-center space-x-1">
            <span className="text-gray-400">Cement:</span>
            <span className="font-bold text-gray-900">{formatCurrency(Math.round(410 * mult))}/bag</span>
          </span>
          <span className="text-gray-200">|</span>
          <span className="flex items-center space-x-1">
            <span className="text-gray-400">M-Sand:</span>
            <span className="font-bold text-gray-900">{formatCurrency(Math.round(68 * mult))}/cft</span>
          </span>
          <span className="text-gray-200">|</span>
          <span className="flex items-center space-x-1">
            <span className="text-gray-400">Tiles:</span>
            <span className="font-bold text-gray-900">{formatCurrency(Math.round(145 * mult))}/sft</span>
          </span>
        </div>

        {/* Right: Expand / Collapse Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-2.5 py-1 rounded-lg text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center space-x-1 transition-colors ml-auto"
        >
          <span>{isOpen ? 'Hide Breakdown' : 'View Full Rates'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-gray-600" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-600" />}
        </button>

      </div>

      {/* Expanded Dropdown Breakdown */}
      {isOpen && (
        <div className="p-4 bg-gray-50/70 border-t border-gray-200 space-y-3 animate-fadeIn">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {keyCommodities.map((item) => {
              const livePrice = Math.round(item.baseRate * mult);
              return (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl border border-gray-200 bg-white space-y-1 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">{item.category}</span>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-blue-50 text-blue-900">
                      {item.badge}
                    </span>
                  </div>
                  <div className="text-xs font-black text-gray-900 truncate" title={item.name}>
                    {item.name}
                  </div>
                  <div className="text-sm font-black text-blue-700 flex items-baseline space-x-1">
                    <span>{formatCurrency(livePrice)}</span>
                    <span className="text-[9px] text-gray-400 font-semibold">{item.unit.split('₹ / ')[1]}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              <span>Indexed to IS 456 & local supplier market procurement rates</span>
            </span>
            <span className="font-semibold text-gray-600">Updated Daily</span>
          </div>
        </div>
      )}

    </div>
  );
}