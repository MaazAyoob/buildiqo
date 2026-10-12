import React, { useState, useEffect } from 'react';
import { 
  Ruler, 
  Layers, 
  Sparkles, 
  FileSpreadsheet, 
  Box, 
  FileCheck2, 
  ArrowLeft, 
  ArrowRight, 
  Bookmark, 
  Printer, 
  RotateCcw,
  CheckCircle2,
  Lock,
  Crown,
  ShieldCheck,
  Building2,
  Compass,
  MapPin,
  TrendingUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEstimateStore, formatCurrency, formatNumber, ENABLE_SUBSCRIPTIONS } from '../store/useEstimateStore';
import { StepPlotDetails } from '../components/planner/StepPlotDetails';
import { StepSpaces } from '../components/planner/StepSpaces';
import { StepMaterials } from '../components/planner/StepMaterials';
import { StepBOQ } from '../components/planner/StepBOQ';
import { Step3DViewer } from '../components/planner/Step3DViewer';
import { StepReport } from '../components/planner/StepReport';
import { PaymentModal } from '../components/common/PaymentModal';

class StepErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Planner Step Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#0F172A] rounded-2xl p-8 border border-red-500/50 shadow-xl text-center space-y-4 max-w-xl mx-auto my-8 text-white">
          <div className="w-12 h-12 rounded-full bg-red-950 text-red-400 flex items-center justify-center mx-auto font-bold text-lg border border-red-800">
            !
          </div>
          <h3 className="text-base font-bold text-white">Summary Report Encountered an Issue</h3>
          <p className="text-xs text-slate-400">
            {this.state.error?.message || 'A runtime issue occurred while loading this section.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function PlannerPage({ setRoute, onOpenSavedModal, initialStep }) {
  const { state, updateState, estimation, saveCurrentProject, subscription, currentUser } = useEstimateStore();
  const [currentStep, setCurrentStep] = useState(initialStep || 1);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null);

  useEffect(() => {
    if (initialStep && initialStep >= 1 && initialStep <= 6) {
      setCurrentStep(initialStep);
    }
  }, [initialStep]);

  const isFreePlan = ENABLE_SUBSCRIPTIONS && subscription?.planId === 'free' && !currentUser?.isGuest && !currentUser?.isAdmin;

  const allSteps = [
    { id: 1, stepNum: '01', name: 'Plot & Setup', icon: Ruler, desc: 'Land dimensions & location' },
    { id: 2, stepNum: '02', name: 'Spaces & Layout', icon: Layers, desc: 'Rooms & carpet area' },
    { id: 3, stepNum: '03', name: 'Specifications', icon: Sparkles, desc: 'Materials & finishes' },
    { id: 4, stepNum: '04', name: 'BOQ Breakdown', icon: FileSpreadsheet, desc: 'Itemized quantities' },
    { id: 5, stepNum: '05', name: '3D Model View', icon: Box, desc: 'Architectural massing' },
    { id: 6, stepNum: '06', name: 'Summary Report', icon: FileCheck2, desc: 'Print & export schedule' }
  ];

  const steps = isFreePlan 
    ? [
        { id: 1, stepNum: '01', name: 'Plot & Setup', icon: Ruler, desc: 'Land dimensions & location' },
        { id: 6, stepNum: '02', name: 'Summary Report', icon: FileCheck2, desc: 'Print & export schedule' }
      ]
    : allSteps;

  const handleStepClick = (stepId) => {
    if (isFreePlan && stepId !== 1 && stepId !== 6) {
      setShowUpgradeModal(true);
      return;
    }
    setCurrentStep(stepId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = () => {
    if (isFreePlan && currentStep === 1) {
      setCurrentStep(6);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
      return;
    }
    if (currentStep < 6) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (nextStep === 6) {
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch (e) {}
      }
    }
  };

  const handlePrev = () => {
    if (isFreePlan && currentStep === 6) {
      setCurrentStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 pb-32 animate-fadeIn text-left">
      
      {/* 1. Project Header Strip */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-sm no-print text-[#172033]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
              <Box className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm sm:text-base font-black text-[#172033] tracking-tight">
                  {state.projectName || 'Residential Villa Engineering Estimate'}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                  IS 456 Verified
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-[#64748B] mt-0.5">
                <span className="font-semibold text-blue-600">{state.city || 'Bengaluru'}</span>
                <span>•</span>
                <span className="capitalize">{state.state || 'Karnataka'}</span>
                <span>•</span>
                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[#475569] font-bold text-[10px] uppercase font-mono">
                  {state.tier || 'standard'} Tier
                </span>
              </div>
            </div>
          </div>

          {/* Quick Engineering Metric Counters */}
          <div className="flex items-center flex-wrap sm:flex-nowrap gap-2.5 sm:gap-3">
            <div className="bg-[#F8FAFC] px-3.5 py-2 rounded-xl border border-[#E2E8F0] text-left sm:text-right min-w-[110px]">
              <span className="text-[10px] text-[#64748B] uppercase tracking-wider block font-extrabold">Usable Carpet</span>
              <span className="text-xs sm:text-sm font-mono tabular-nums font-bold text-[#172033]">
                {formatNumber(estimation.totalCarpetArea)} <span className="text-[10px] font-sans font-normal text-[#64748B]">sq.ft</span>
              </span>
            </div>

            <div className="bg-[#F8FAFC] px-3.5 py-2 rounded-xl border border-[#E2E8F0] text-left sm:text-right min-w-[110px]">
              <span className="text-[10px] text-[#64748B] uppercase tracking-wider block font-extrabold">Built-Up (SBA)</span>
              <span className="text-xs sm:text-sm font-mono tabular-nums font-bold text-blue-700">
                {formatNumber(estimation.totalBuiltupArea)} <span className="text-[10px] font-sans font-normal text-[#64748B]">sq.ft</span>
              </span>
            </div>

            <div className="bg-[#EEF4FF] border border-[#BFDBFE] text-[#172033] px-4 py-2 rounded-xl text-left sm:text-right shadow-2xs min-w-[150px]">
              <span className="text-[10px] text-blue-700 uppercase tracking-wider block font-extrabold">Package Estimate</span>
              <span className="text-xs sm:text-sm font-mono tabular-nums font-black text-[#172033] tracking-tight">
                {estimation.packageEstimate?.isPricingUnavailable 
                  ? 'Review Required' 
                  : (isFreePlan && currentStep === 6) 
                    ? '₹00' 
                    : formatCurrency(estimation.estimatedCost || estimation.packageEstimate?.estimatedCost || 0)}
              </span>
              <span className="text-[9px] text-[#64748B] block">Excl. GST (SBA × Rate)</span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Six-Step Stepper Navigation */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-[#E2E8F0] shadow-xs no-print">
        <div className={`grid gap-2 relative ${isFreePlan ? 'grid-cols-2 max-w-lg mx-auto' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'}`}>
          {steps.map((step) => {
            const isCompleted = isFreePlan ? (currentStep === 6 && step.id === 1) : (currentStep > step.id);
            const isCurrent = currentStep === step.id;

            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(step.id)}
                className={`p-2.5 sm:p-3 rounded-xl text-left transition-all flex items-center space-x-2.5 border group relative ${
                  isCurrent
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25'
                    : isCompleted
                    ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#064E3B] hover:border-emerald-400'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:text-[#172033] hover:border-slate-300'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-all ${
                  isCurrent
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : isCompleted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-[#CBD5E1] text-[#64748B]'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    step.stepNum
                  )}
                </div>
                <div className="overflow-hidden flex-1 min-w-0">
                  <span className={`text-xs font-bold block truncate ${isCurrent ? 'text-white' : isCompleted ? 'text-emerald-950 font-extrabold' : 'text-[#334155]'}`}>
                    {step.name}
                  </span>
                  <span className={`text-[10px] block truncate ${isCurrent ? 'text-blue-100' : isCompleted ? 'text-emerald-700 font-medium' : 'text-[#94A3B8]'}`}>
                    {step.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Active Step Component Workspace */}
      <div className="min-h-[500px]">
        {currentStep === 1 && (
          <StepPlotDetails 
            state={state} 
            updateState={updateState} 
            estimation={estimation} 
          />
        )}

        {currentStep === 2 && (
          <StepSpaces 
            state={state} 
            updateState={updateState} 
            estimation={estimation} 
            setRoute={setRoute}
          />
        )}

        {currentStep === 3 && (
          <StepMaterials 
            state={state} 
            updateState={updateState} 
            estimation={estimation} 
          />
        )}

        {currentStep === 4 && (
          <StepBOQ 
            state={state} 
            updateState={updateState} 
            estimation={estimation}
            onNavigateStep={setCurrentStep}
          />
        )}

        {currentStep === 5 && (
          <Step3DViewer 
            state={state} 
            estimation={estimation} 
          />
        )}

        {currentStep === 6 && (
          <StepErrorBoundary>
            <StepReport 
              state={state} 
              estimation={estimation}
              onOpenSavedModal={onOpenSavedModal}
            />
          </StepErrorBoundary>
        )}
      </div>

      {/* 4. Light Floating Sticky Bottom Engineering Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] py-3 px-4 sm:px-8 shadow-xl text-[#172033] no-print">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Active Live Price Ticker */}
          <div className="flex items-center space-x-4">
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-extrabold block">
                  Estimated Construction Cost
                </span>
                <span className="text-[9px] font-bold text-[#0891B2] bg-[#ECFEFF] px-1.5 py-0.2 rounded border border-[#A5F3FC]">
                  Excl. GST
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl sm:text-2xl font-black font-mono tabular-nums text-[#172033] tracking-tight">
                  {estimation.packageEstimate?.isPricingUnavailable 
                    ? 'Review Required' 
                    : (isFreePlan && currentStep === 6) 
                      ? '₹00' 
                      : formatCurrency(estimation.estimatedCost || estimation.packageEstimate?.estimatedCost || 0)}
                </span>
                <span className="text-xs font-mono tabular-nums text-[#2563EB] font-bold bg-[#EEF4FF] px-2 py-0.5 rounded-md border border-[#BFDBFE]">
                  {estimation.packageEstimate?.isPricingUnavailable 
                    ? 'Rate Unavailable' 
                    : (isFreePlan && currentStep === 6) 
                      ? '₹00' 
                      : `${formatCurrency(estimation.costPerSqFt || estimation.packageEstimate?.ratePerSqFt || 0)} / sq.ft`}
                </span>
              </div>
              <div className="text-[10px] text-[#64748B] font-medium">
                Incl. {estimation.gstRate || 18}% GST: <span className="font-mono font-bold text-[#059669]">{formatCurrency(estimation.grandTotalCost || estimation.packageEstimate?.grandTotal || 0)}</span>
              </div>
            </div>

            <div className="hidden md:block h-10 w-px bg-[#E2E8F0]" />

            <div className="hidden md:block text-xs text-[#475569]">
              <span className="font-bold text-[#172033] font-mono tabular-nums block">
                {formatNumber(estimation.totalBuiltupArea)} sq.ft SBA
              </span>
              <span className="text-[11px] text-[#64748B]">
                {estimation.city?.name || state.city || 'Bengaluru'} ({estimation.city?.state || state.state || 'Karnataka'}) • {(state.tier || 'standard').toUpperCase()} Tier
              </span>
            </div>
          </div>

          {/* Stepper Action Buttons */}
          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
            {currentStep > 1 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#475569] hover:bg-slate-50 hover:text-[#172033] font-bold text-xs flex items-center space-x-1.5 transition-all active:scale-[0.98] shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            )}

            <button
              onClick={() => saveCurrentProject(state.projectName)}
              className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#475569] hover:bg-slate-50 hover:text-[#172033] font-bold text-xs flex items-center space-x-1.5 transition-all hidden sm:flex active:scale-[0.98] shadow-2xs"
              title="Save project"
            >
              <Bookmark className="w-3.5 h-3.5 text-[#0891B2]" />
              <span>Save</span>
            </button>

            {currentStep < 6 ? (
              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3457E5] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-black text-xs shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-all active:scale-[0.98]"
              >
                <span>Continue to {allSteps[currentStep]?.name}</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-100" />
              </button>
            ) : (
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3457E5] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-black text-xs shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-all active:scale-[0.98]"
              >
                <Printer className="w-4 h-4 text-blue-100" />
                <span>Print Formal Report</span>
              </button>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}