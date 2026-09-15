import React from 'react';
import { Settings as SettingsIcon, Globe, DollarSign, Ruler, Check } from 'lucide-react';
import { useEstimateStore } from '../store/useEstimateStore';

export function SettingsPage() {
  const { settings, updateSettings } = useEstimateStore();

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto pb-16">
      
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Application Preferences</h1>
            <p className="text-xs text-gray-500">Configure currency display, measurement units, and calculation defaults</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        
        {/* Currency Selector */}
        <div className="space-y-3 pb-6 border-b border-slate-200">
          <label className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-blue-800" />
            <span>Currency Display</span>
          </label>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'INR', label: '₹ Indian Rupee (INR)', sym: '₹' },
              { id: 'USD', label: '$ US Dollar (USD)', sym: '$' },
              { id: 'EUR', label: '€ Euro (EUR)', sym: '€' },
              { id: 'AED', label: 'AED UAE Dirham', sym: 'AED' }
            ].map(c => (
              <button
                key={c.id}
                onClick={() => updateSettings({ currency: c.id, currencySymbol: c.sym })}
                className={`p-3.5 rounded-2xl border text-left text-xs font-bold transition-all ${
                  settings.currency === c.id 
                    ? 'border-stone-900 bg-blue-50/60 text-slate-900 ring-2 ring-stone-900/15' 
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-gray-700'
                }`}
              >
                <span className="block">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Measurement Units */}
        <div className="space-y-3 pb-6 border-b border-slate-200">
          <label className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Ruler className="w-4 h-4 text-blue-800" />
            <span>Measurement Unit System</span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => updateSettings({ unitSystem: 'sqft' })}
              className={`p-3.5 rounded-2xl border text-left text-xs font-bold transition-all ${
                settings.unitSystem === 'sqft' 
                  ? 'border-stone-900 bg-blue-50/60 text-slate-900 ring-2 ring-stone-900/15' 
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-gray-700'
              }`}
            >
              <span>Imperial (Feet / Sq.Ft / Cu.Ft)</span>
              <span className="block text-[10px] text-gray-500 mt-0.5">Indian standard residential construction norm</span>
            </button>

            <button
              onClick={() => updateSettings({ unitSystem: 'sqm' })}
              className={`p-3.5 rounded-2xl border text-left text-xs font-bold transition-all ${
                settings.unitSystem === 'sqm' 
                  ? 'border-stone-900 bg-blue-50/60 text-slate-900 ring-2 ring-stone-900/15' 
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-gray-700'
              }`}
            >
              <span>Metric (Meters / Sq.M / Cu.M)</span>
              <span className="block text-[10px] text-gray-500 mt-0.5">International standard SI units</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-gray-600">
          <p className="font-bold text-slate-900">Local Storage Active</p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Your preferences, custom material selections, and saved projects are stored securely in your browser.
          </p>
        </div>

      </div>

    </div>
  );
}