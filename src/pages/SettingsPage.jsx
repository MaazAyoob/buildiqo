import React from 'react';
import { Settings as SettingsIcon, Globe, DollarSign, Ruler, Check, HardHat, ShieldCheck } from 'lucide-react';
import { useEstimateStore } from '../store/useEstimateStore';
import { PageHeader, StatusBadge } from '../components/ui';

export function SettingsPage() {
  const { settings, updateSettings } = useEstimateStore();

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto pb-20 text-left">
      
      {/* 1. Page Header */}
      <PageHeader
        icon={SettingsIcon}
        badge="ENGINEERING CONFIGURATION"
        badgeVariant="brand"
        title="Application Preferences"
        subtitle="Configure currency display, measurement units, and computational defaults across the platform."
      />

      {/* 2. Main Settings Card */}
      <div className="card-workspace p-6 sm:p-8 space-y-8">
        
        {/* Currency Selector */}
        <div className="space-y-4 pb-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <label className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span>Currency Display</span>
            </label>
            <StatusBadge variant="brand" size="sm">
              Active: {settings.currency || 'INR'}
            </StatusBadge>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'INR', label: '₹ Indian Rupee (INR)', sym: '₹', desc: 'Standard for India' },
              { id: 'USD', label: '$ US Dollar (USD)', sym: '$', desc: 'International USD' },
              { id: 'EUR', label: '€ Euro (EUR)', sym: '€', desc: 'Eurozone standard' },
              { id: 'AED', label: 'AED UAE Dirham', sym: 'AED', desc: 'Middle East GCC' }
            ].map(c => {
              const isActive = settings.currency === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => updateSettings({ currency: c.id, currencySymbol: c.sym })}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isActive 
                      ? 'border-blue-600 bg-blue-50/70 text-slate-900 ring-2 ring-blue-600/20 shadow-xs' 
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="block font-bold text-xs">{c.label}</span>
                  <span className="block text-[10px] text-slate-500 mt-1">{c.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Measurement Units */}
        <div className="space-y-4 pb-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <label className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
              <Ruler className="w-4 h-4 text-blue-600" />
              <span>Measurement Unit System</span>
            </label>
            <StatusBadge variant="emerald" size="sm">
              Active: {settings.unitSystem === 'sqm' ? 'Metric' : 'Imperial'}
            </StatusBadge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => updateSettings({ unitSystem: 'sqft' })}
              className={`p-4 rounded-2xl border text-left transition-all ${
                settings.unitSystem === 'sqft' 
                  ? 'border-blue-600 bg-blue-50/70 text-slate-900 ring-2 ring-blue-600/20 shadow-xs' 
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-900">Imperial (Feet / Sq.Ft)</span>
                {settings.unitSystem === 'sqft' && <Check className="w-4 h-4 text-blue-600" />}
              </div>
              <span className="block text-xs text-slate-500 mt-1 leading-relaxed">
                Indian residential standard: lengths in feet, carpet &amp; built-up area in square feet.
              </span>
            </button>

            <button
              onClick={() => updateSettings({ unitSystem: 'sqm' })}
              className={`p-4 rounded-2xl border text-left transition-all ${
                settings.unitSystem === 'sqm' 
                  ? 'border-blue-600 bg-blue-50/70 text-slate-900 ring-2 ring-blue-600/20 shadow-xs' 
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-900">Metric (Meters / Sq.M)</span>
                {settings.unitSystem === 'sqm' && <Check className="w-4 h-4 text-blue-600" />}
              </div>
              <span className="block text-xs text-slate-500 mt-1 leading-relaxed">
                International standard SI units: lengths in meters, area in square meters.
              </span>
            </button>
          </div>
        </div>

        {/* Local Persistence & Storage Notice */}
        <div className="p-4 bg-gradient-to-r from-blue-50/60 to-indigo-50/40 rounded-2xl border border-blue-200/80 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <p className="font-bold text-slate-900">Deterministic Local Storage Active</p>
            <p className="text-slate-600 leading-relaxed">
              Your unit choices, customized material specifications, saved calculations, and floor plans are preserved reliably in your browser's private local storage.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}

export default SettingsPage;