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
  Crown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEstimateStore, formatCurrency, formatNumber } from '../store/useEstimateStore';
import { StepPlotDetails } from '../components/planner/StepPlotDetails';
import { StepSpaces } from '../components/planner/StepSpaces';
import { StepMaterials } from '../components/planner/StepMaterials';
import { StepBOQ } from '../components/planner/StepBOQ';
import { Step3DViewer } from '../components/planner/Step3DViewer';
import { StepReport } from '../components/planner/StepReport';
import { PaymentModal } from '../components/common/PaymentModal';

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

  const isFreePlan = subscription?.planId === 'free' && !currentUser?.isGuest && !currentUser?.isAdmin;

  const allSteps = [
    { id: 1, stepNum: '01', name: 'Plot & Setup', icon: Ruler, desc: 'Land dimensions & location' },
    { id: 2, stepNum: '02', name: 'Spaces & Layout', icon: Layers, desc: 'Rooms & carpet area' },
    { id: 3, stepNum: '03', name: 'Specifications', icon: Sparkles, desc: 'Materials & finishes' },
    { id: 4, stepNum: '04', name: 'BOQ Breakdown', icon: FileSpreadsheet, desc: 'Itemized quantities' },
    { id: 5, stepNum: '05', name: '3D Model View', icon: Box, desc: 'Architectural massing' },
    { id: 6, stepNum: '06', name: 'Summary Report', icon: FileCheck2, desc: 'Print & export schedule' }
  ];

  // For Free plan: only Plot & Setup and Summary Report are visible to the customer
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
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
      return;
    }
    if (currentStep < 6) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (nextStep === 6) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
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

  const openPaymentForPlan = (plan) => {
    setSelectedPlanForPayment(plan);
    setPaymentModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-32 animate-fadeIn">
      
      {/* Compact Engineering Metrics Strip (Section 12 Specification) */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="text-xs font-bold text-slate-900 tracking-tight">{state.projectName || 'Residential Villa Estimate'}</span>
            <span className="text-slate-300">|</span>
            <span className="text-[11px] text-slate-500 font-medium">{state.city || 'Bengaluru'} ({state.tier || 'Standard'})</span>
          </div>

          <div className="flex items-center space-x-6 sm:space-x-8 text-right">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Total Usable Carpet</span>
              <span className="text-xs sm:text-sm font-mono tabular-nums font-bold text-slate-900">
                {formatNumber(estimation.totalCarpetArea)} <span className="text-[10px] font-sans font-normal text-slate-500">sq.ft</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Total Built-Up Area</span>
              <span className="text-xs sm:text-sm font-mono tabular-nums font-bold text-slate-900">
                {formatNumber(estimation.totalBuiltupArea)} <span className="text-[10px] font-sans font-normal text-slate-500">sq.ft</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Estimated Cost</span>
              <span className="text-xs sm:text-sm font-mono tabular-nums font-bold text-blue-600">
                {(isFreePlan && currentStep === 6) ? '₹00' : formatCurrency(estimation.grandTotalCost)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Project-Progress Stepper (Section 11 Specification) */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs no-print">
        <div className="relative">
          {/* Connecting line behind step circles */}
          <div className="hidden lg:block absolute top-1/2 left-6 right-6 -translate-y-1/2 h-0.5 bg-slate-100 -z-0" />
          
          <div className={`grid gap-2 sm:gap-3 relative z-10 ${isFreePlan ? 'grid-cols-2 max-w-lg mx-auto' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'}`}>
            {steps.map((step, sIdx) => {
              const isCompleted = isFreePlan ? (currentStep === 6 && step.id === 1) : (currentStep > step.id);
              const isCurrent = currentStep === step.id;

              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(step.id)}
                  className={`p-2.5 sm:p-3 rounded-lg text-left transition-all flex items-center space-x-2.5 border group ${
                    isCurrent
                      ? 'bg-blue-50/70 border-blue-600 text-blue-900 shadow-2xs'
                      : isCompleted
                      ? 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'
                      : 'bg-slate-50/60 border-slate-200/70 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-all ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isCompleted
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-white border border-slate-200 text-slate-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    ) : (
                      step.stepNum
                    )}
                  </div>
                  <div className="overflow-hidden flex-1 min-w-0">
                    <span className={`text-xs font-semibold block truncate ${isCurrent ? 'text-blue-900 font-bold' : isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>
                      {step.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {step.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Step Workspace Component */}
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
          <StepReport 
            state={state} 
            estimation={estimation}
            onOpenSavedModal={onOpenSavedModal}
          />
        )}
      </div>

      {/* Sticky Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-3 px-4 sm:px-8 shadow-card no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Active Price Ticker */}
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                Estimated Construction Cost
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold font-mono tabular-nums text-slate-900">
                  {(isFreePlan && currentStep === 6) ? '₹00' : formatCurrency(estimation.grandTotalCost)}
                </span>
                <span className="text-xs font-mono tabular-nums text-slate-500">
                  ({(isFreePlan && currentStep === 6) ? '₹00' : formatCurrency(estimation.costPerSqFt)} / sq.ft)
                </span>
              </div>
            </div>

            <div className="hidden md:block h-7 w-px bg-slate-200" />

            <div className="hidden md:block text-xs text-slate-500">
              <span className="font-semibold text-slate-700 font-mono tabular-nums block">{formatNumber(estimation.totalBuiltupArea)} sq.ft BUA</span>
              <span className="text-[11px]">{estimation.city?.name} • {state.tier} tier</span>
            </div>
          </div>

          {/* Stepper Actions Buttons */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {currentStep > 1 && (
              <button
                onClick={handlePrev}
                className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-semibold text-xs flex items-center space-x-1.5 transition-all active:scale-[0.98]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            )}

            <button
              onClick={() => saveCurrentProject(state.projectName)}
              className="px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-semibold text-xs flex items-center space-x-1.5 transition-all hidden sm:flex active:scale-[0.98]"
              title="Save project"
            >
              <Bookmark className="w-3.5 h-3.5 text-blue-600" />
              <span>Save</span>
            </button>

            {currentStep < 6 ? (
              <button
                onClick={handleNext}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold text-xs shadow-xs hover:shadow flex items-center space-x-1.5 transition-all active:scale-[0.98]"
              >
                {isFreePlan && currentStep === 1 ? (
                  <>
                    <FileCheck2 className="w-3.5 h-3.5 text-blue-200" />
                    <span>View Summary Report</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-200" />
                  </>
                ) : (
                  <>
                    <span>Continue to {allSteps[currentStep]?.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-200" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold text-xs shadow-xs hover:shadow flex items-center space-x-1.5 transition-all active:scale-[0.98]"
              >
                <Printer className="w-3.5 h-3.5 text-blue-200" />
                <span>Print Formal Report</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Choose your plan to start estimating Modal (Triggered when Free user clicks next steps) */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 text-left animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200">
                  Plan Required
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  Choose your plan to start estimating.
                </h2>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are currently on the <strong>FREE Plan</strong> which allows configuration of Step 1 (Plot & Setup) only. To unlock room layouts, 3D Orbit model, material benchmarks, and full BOQ quantities, choose your plan:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Professional Plan Card */}
              <div className="p-5 rounded-2xl border-2 border-blue-600 bg-blue-50/30 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900 uppercase">Professional</span>
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[9px] font-black uppercase">Popular</span>
                  </div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-black text-slate-900">₹4,999</span>
                    <span className="text-xs text-slate-500 font-bold">/ month</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Full access to all 6 estimation steps, live material rates, custom pricing, and PDF export.
                  </p>
                </div>

                <button
                  onClick={() => openPaymentForPlan({ id: 'pro', name: 'Professional Plan', price: '₹4,999', period: '/ month' })}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-sm flex items-center justify-center space-x-2"
                >
                  <span>Pay ₹4,999 with QR</span>
                  <ArrowRight className="w-4 h-4 text-blue-200" />
                </button>
              </div>

              {/* Pro AI Plan Card */}
              <div className="p-5 rounded-2xl border-2 border-slate-200 bg-white hover:border-slate-300 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900 uppercase">Pro AI</span>
                    <Crown className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-black text-slate-900">₹8,999</span>
                    <span className="text-xs text-slate-500 font-bold">/ month</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Includes all Professional features plus AI Assistant, Drawing Takeoff, and 60 BOQ reports / mo.
                  </p>
                </div>

                <button
                  onClick={() => openPaymentForPlan({ id: 'pro_ai', name: 'Pro AI Plan', price: '₹8,999', period: '/ month' })}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-sm flex items-center justify-center space-x-2"
                >
                  <span>Pay ₹8,999 with QR</span>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </button>
              </div>

            </div>

            <div className="p-3.5 bg-slate-100 rounded-xl text-center text-xs text-slate-500 font-medium">
              Payment via UPI QR code or ID (<code className="font-bold text-slate-800">8095586121@ybl</code>). Verified by admin before activation.
            </div>
          </div>
        </div>
      )}

      {/* Payment QR Code Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        selectedPlan={selectedPlanForPayment}
        onPaymentSubmitted={() => {
          setPaymentModalOpen(false);
          setShowUpgradeModal(false);
        }}
      />

    </div>
  );
}