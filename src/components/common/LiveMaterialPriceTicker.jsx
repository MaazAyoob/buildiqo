import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  ShieldCheck, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { INDIAN_STATES, normalizeStateName } from '../../data/states';
import { formatCurrency } from '../../store/useEstimateStore';
import { apiRequest } from '../../utils/apiClient';

export function LiveMaterialPriceTicker({ 
  selectedState, 
  onStateChange,
  // Backward compatibility props
  selectedCity,
  onCityChange 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [rates, setRates] = useState(null);
  const [pricingStatus, setPricingStatus] = useState('LOADING');
  const [pricingScope, setPricingScope] = useState('STATE');
  const [lastUpdated, setLastUpdated] = useState(null);

  const activeState = normalizeStateName(selectedState || selectedCity || 'Karnataka');

  useEffect(() => {
    let isCancelled = false;
    const reqId = ++LiveMaterialPriceTicker.reqSeq;

    async function loadLiveRates() {
      setPricingStatus('LOADING');
      // Reset rates immediately so previous state's prices do not linger
      setRates(null);

      try {
        const res = await apiRequest(`/api/pricing/current?state=${encodeURIComponent(activeState)}`);
        if (isCancelled || reqId !== LiveMaterialPriceTicker.reqSeq) return;

        if (res.success && res.data && res.data.rates && Object.keys(res.data.rates).length > 0) {
          setRates(res.data.rates);
          setPricingStatus(res.data.pricingStatus === 'APPROVED' ? 'APPROVED' : (res.data.pricingStatus || 'PARTIAL'));
          setPricingScope(res.data.pricingScope || 'STATE');
          setLastUpdated(res.data.lastFetchedAt || new Date().toISOString());
        } else {
          setRates(null);
          setPricingStatus('UNAVAILABLE');
          setPricingScope('UNAVAILABLE');
        }
      } catch (err) {
        if (isCancelled || reqId !== LiveMaterialPriceTicker.reqSeq) return;
        setRates(null);
        setPricingStatus('UNAVAILABLE');
        setPricingScope('UNAVAILABLE');
      }
    }

    loadLiveRates();
    return () => {
      isCancelled = true;
    };
  }, [activeState]);

  const handleStateSelect = (e) => {
    const newState = e.target.value;
    if (onStateChange) onStateChange(newState);
    if (onCityChange) onCityChange(newState);
  };

  // Helper to extract material rate by key or category
  const getRate = (code, fallbackCategory) => {
    if (!rates) return null;
    if (rates[code]?.rate != null) return rates[code];
    const found = Object.values(rates).find(r => 
      r.category?.toLowerCase() === fallbackCategory?.toLowerCase()
    );
    return found || null;
  };

  const steelRate = getRate('st-jsw', 'steel');
  const cementRate = getRate('cm-ultratech-std', 'cement');
  const sandRate = getRate('sd-double', 'sand');
  const masonryRate = getRate('ms-aac', 'masonry');
  const flooringRate = getRate('fl-vitrified-gvt', 'flooring');
  const paintRate = getRate('pt-asian', 'painting') || getRate('pt-acrylic', 'painting');

  const keyCommodities = [
    {
      id: 'steel',
      name: steelRate?.name || 'JSW Fe 550D Rebar',
      category: 'Steel',
      rate: steelRate?.rate,
      unit: steelRate?.unit || '₹ / Tonne',
      badge: 'IS 1786',
      pricingScope: steelRate?.pricingScope || pricingScope
    },
    {
      id: 'cement',
      name: cementRate?.name || 'UltraTech PPC Cement',
      category: 'Cement',
      rate: cementRate?.rate,
      unit: cementRate?.unit || '₹ / Bag',
      badge: 'Grade 53',
      pricingScope: cementRate?.pricingScope || pricingScope
    },
    {
      id: 'sand',
      name: sandRate?.name || 'VSI Washed M-Sand',
      category: 'M-Sand',
      rate: sandRate?.rate,
      unit: sandRate?.unit || '₹ / Cu.Ft',
      badge: 'Zone II',
      pricingScope: sandRate?.pricingScope || pricingScope
    },
    {
      id: 'blocks',
      name: masonryRate?.name || 'AAC Light Blocks 6"',
      category: 'Masonry',
      rate: masonryRate?.rate,
      unit: masonryRate?.unit || '₹ / Sq.Ft',
      badge: 'Thermal Mass',
      pricingScope: masonryRate?.pricingScope || pricingScope
    },
    {
      id: 'tiles',
      name: flooringRate?.name || 'Kajaria 4x2 GVT Tiles',
      category: 'Flooring',
      rate: flooringRate?.rate,
      unit: flooringRate?.unit || '₹ / Sq.Ft',
      badge: 'Vitrified',
      pricingScope: flooringRate?.pricingScope || pricingScope
    },
    {
      id: 'paint',
      name: paintRate?.name || 'Asian Paints Royale',
      category: 'Paint',
      rate: paintRate?.rate,
      unit: paintRate?.unit || '₹ / Sq.Ft',
      badge: 'Emulsion',
      pricingScope: paintRate?.pricingScope || pricingScope
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all">
      
      {/* Compact Main Bar */}
      <div className="p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Title & State Dropdown */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className={`w-2 h-2 rounded-full ${pricingStatus === 'APPROVED' ? 'bg-green-500 animate-ping' : 'bg-amber-500'}`} />
            <span className="text-xs font-black text-gray-900 tracking-tight">
              Live Material Rates
            </span>
          </div>

          <span className="text-gray-300 text-xs hidden sm:inline">•</span>

          {/* State Selector Dropdown */}
          <div className="flex items-center space-x-1 bg-gray-100/90 px-2 py-1 rounded-lg border border-gray-200 shrink-0">
            <MapPin className="w-3 h-3 text-blue-600" />
            <span className="text-[10px] font-medium text-gray-500 hidden sm:inline">State:</span>
            <select
              value={activeState}
              onChange={handleStateSelect}
              className="text-[11px] font-bold text-gray-900 bg-transparent focus:outline-none cursor-pointer pr-1"
            >
              {INDIAN_STATES.map(s => (
                <option key={s.id} value={s.name}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Middle: Horizontal Mini Ticker Pills (Desktop) */}
        <div className="hidden lg:flex items-center space-x-3 text-[11px] font-semibold text-gray-700">
          {(pricingStatus === 'APPROVED' || pricingStatus === 'PARTIAL') && rates ? (
            <>
              <span className="flex items-center space-x-1">
                <span className="text-gray-400">Steel:</span>
                <span className="font-bold text-gray-900">
                  {steelRate?.rate != null ? (
                    <>
                      {formatCurrency(steelRate.rate)}/{steelRate.unit?.includes('Tonne') ? 'T' : 'kg'}
                      <span className="text-[10px] font-normal text-gray-400 ml-1">
                        · {steelRate.pricingScope === 'NATIONAL' ? 'National' : activeState}
                      </span>
                    </>
                  ) : 'Unavailable'}
                </span>
              </span>
              <span className="text-gray-200">|</span>
              <span className="flex items-center space-x-1">
                <span className="text-gray-400">Cement:</span>
                <span className="font-bold text-gray-900">
                  {cementRate?.rate != null ? (
                    <>
                      {formatCurrency(cementRate.rate)}/bag
                      <span className="text-[10px] font-normal text-gray-400 ml-1">
                        · {cementRate.pricingScope === 'NATIONAL' ? 'National' : activeState}
                      </span>
                    </>
                  ) : 'Unavailable'}
                </span>
              </span>
              <span className="text-gray-200">|</span>
              <span className="flex items-center space-x-1">
                <span className="text-gray-400">M-Sand:</span>
                <span className="font-bold text-gray-900">
                  {sandRate?.rate != null ? (
                    <>
                      {formatCurrency(sandRate.rate)}/cft
                      <span className="text-[10px] font-normal text-gray-400 ml-1">
                        · {sandRate.pricingScope === 'NATIONAL' ? 'National' : activeState}
                      </span>
                    </>
                  ) : 'Unavailable'}
                </span>
              </span>
              <span className="text-gray-200">|</span>
              <span className="flex items-center space-x-1">
                <span className="text-gray-400">Tiles:</span>
                <span className="font-bold text-gray-900">
                  {flooringRate?.rate != null ? (
                    <>
                      {formatCurrency(flooringRate.rate)}/sft
                      <span className="text-[10px] font-normal text-gray-400 ml-1">
                        · {flooringRate.pricingScope === 'NATIONAL' ? 'National' : activeState}
                      </span>
                    </>
                  ) : 'Unavailable'}
                </span>
              </span>
            </>
          ) : pricingStatus === 'LOADING' ? (
            <span className="text-gray-400 text-xs flex items-center space-x-1">
              <Clock className="w-3 h-3 animate-spin text-blue-600" />
              <span>Fetching live {activeState} rates...</span>
            </span>
          ) : (
            <span className="text-amber-700 text-xs flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>State pricing unavailable for {activeState}</span>
            </span>
          )}
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
          {pricingStatus === 'UNAVAILABLE' ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <p className="text-xs font-bold text-amber-800">
                Official approved production material rates are currently unavailable for {activeState}.
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Buildiqo strict single-source policy requires verified state or national rates before production quoting.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {keyCommodities.map((item) => {
                const hasRate = item.rate != null;
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
                      {hasRate ? (
                        <>
                          <span>{formatCurrency(item.rate)}</span>
                          <span className="text-[9px] text-gray-400 font-semibold">{item.unit.replace(/^₹\s*\/?\s*/, '/ ')}</span>
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-amber-600">Rate unavailable</span>
                      )}
                    </div>
                    {hasRate && (
                      <div className="text-[9px] font-bold text-gray-400 pt-0.5">
                        · {item.pricingScope === 'NATIONAL' ? 'National baseline' : `${activeState} rate`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              <span>
                {pricingScope === 'NATIONAL'
                  ? `Indexed to IS 456 & National baseline rates (fallback for ${activeState})`
                  : `Indexed to IS 456 & state-authorized procurement rates (${activeState})`}
              </span>
            </span>
            <span className="font-semibold text-gray-600">
              {lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleDateString()}` : 'Live server synced'}
            </span>
          </div>
        </div>
      )}

    </div>
  );
}

LiveMaterialPriceTicker.reqSeq = 0;