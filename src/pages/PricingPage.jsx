import React, { useState } from 'react';
import { 
  Check, 
  Sparkles, 
  Building2, 
  ArrowRight, 
  Crown,
  CheckCircle2,
  LogOut,
  Zap
} from 'lucide-react';
import { useEstimateStore } from '../store/useEstimateStore';
import { PaymentModal } from '../components/common/PaymentModal';

export function PricingPage({ setRoute, isMandatoryGate = false }) {
  const { subscription, updateSubscription, currentUser, logout } = useEstimateStore();
  const [subscribedModal, setSubscribedModal] = useState(false);
  const [selectedPlanName, setSelectedPlanName] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null);

  const handleSelectPlan = (plan) => {
    if (plan.id === 'free') {
      updateSubscription('free', 'monthly');
      setSelectedPlanName('FREE Plan');
      setSubscribedModal(true);
    } else {
      setSelectedPlanForPayment(plan);
      setPaymentModalOpen(true);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'FREE',
      price: '₹0',
      period: '/ month',
      subtag: 'For homeowners, students & first-time users',
      cta: 'Start for Free',
      popular: false,
      headerPlus: "WHAT'S INCLUDED",
      features: [
        {
          title: 'BOQ Overview',
          desc: 'Understand your project quantities and cost structure'
        },
        {
          title: 'Package Overview',
          desc: 'View construction packages and major work categories'
        },
        {
          title: 'Demo Walkthrough',
          desc: 'Guided introduction to BuildIQO'
        },
        {
          title: '6-Phase Construction Timelapse',
          desc: 'Visualize the construction journey from foundation to completion'
        },
        {
          title: 'Regional City Cost Multipliers',
          desc: 'Understand how location affects construction costs'
        }
      ]
    },
    {
      id: 'pro',
      name: 'Professional',
      price: '₹4,999',
      period: '/ month',
      subtag: 'For Contractors, Architects, QS Professionals & Builders',
      cta: 'Start Professional',
      popular: true,
      headerPlus: 'Everything in Free, plus:',
      features: [
        {
          title: '20 BOQ Generations / Month',
          desc: 'Generate detailed Bills of Quantities for your projects.'
        },
        {
          title: 'Custom Pricing',
          desc: 'Adjust material, labour and project rates based on your requirements.'
        },
        {
          title: 'Live Material Prices',
          desc: 'Access updated market prices for key construction materials.'
        },
        {
          title: 'Advanced BOQ',
          desc: 'Generate detailed quantities, rates, units and cost breakdowns.'
        },
        {
          title: 'Professional PDF Export',
          desc: 'Create client-ready construction estimates and BOQ reports.'
        },
        {
          title: 'Regional Pricing',
          desc: 'Apply location-specific construction and material pricing.'
        },
        {
          title: 'Rate Analysis',
          desc: 'Analyse material, labour and other cost components for better estimation.'
        }
      ]
    },
    {
      id: 'pro_ai',
      name: 'Pro AI',
      price: '₹8,999',
      period: '/ month',
      subtag: 'For Professional Builders, QS Teams & Construction Companies',
      cta: 'Start Pro AI',
      popular: false,
      headerPlus: 'Everything in Professional, plus:',
      features: [
        {
          title: '60 BOQ Generations / Month',
          desc: 'Create detailed BOQs at scale for multiple projects.'
        },
        {
          title: 'AI Construction Assistant',
          desc: 'Ask questions, analyse estimates and get AI-powered construction insights.'
        },
        {
          title: 'AI Drawing Takeoff',
          desc: 'Upload construction drawings and extract relevant quantities with AI assistance.'
        },
        {
          title: 'AI BOQ Generation',
          desc: 'Convert project information and drawings into structured BOQs faster.'
        },
        {
          title: 'Advanced Cost Analysis',
          desc: 'Understand project costs, variations and potential cost-saving opportunities.'
        },
        {
          title: 'Material & Labour Intelligence',
          desc: 'Analyse material and labour requirements to improve budgeting and project planning.'
        }
      ]
    }
  ];

  return (
    <div className="space-y-10 animate-fadeIn pb-16 text-left max-w-7xl mx-auto">
      
      {/* If mandatory gate (no navbar shown), show a clean header bar with logo & user info */}
      {isMandatoryGate && (
        <div className="flex items-center justify-between pb-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-xl tracking-tight text-slate-900">Buildiqo<span className="text-blue-600">.ai</span></span>
                <span className="text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  QS Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Civil Construction Planning & BOQ</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-black text-slate-900 block">{currentUser?.name}</span>
              <span className="text-[10px] text-slate-500 font-medium">{currentUser?.role}</span>
            </div>
            <button
              onClick={() => logout()}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 text-slate-700 hover:text-red-600 text-xs font-bold transition-all flex items-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Pricing Header Title */}
      <div className="max-w-3xl mx-auto text-center space-y-3 pt-2">
        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider border border-blue-200">
          Subscription Plans
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Choose your plan to start estimating.
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          Select a plan suited for homeowners, architects, quantity surveyors, or professional builders.
        </p>
      </div>

      {/* 3 Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-7xl mx-auto">
        {plans.map((plan) => {
          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-7 sm:p-8 bg-white border-2 flex flex-col justify-between transition-all relative ${
                plan.popular
                  ? 'border-blue-600 shadow-xl ring-4 ring-blue-600/10 scale-100 md:-translate-y-2'
                  : 'border-slate-200 shadow-sm hover:border-slate-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                  <span>Most Popular</span>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{plan.name}</h3>
                  <div className="flex items-baseline space-x-1.5 mt-2">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900">{plan.price}</span>
                    <span className="text-xs text-slate-500 font-bold">{plan.period}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 font-medium min-h-[32px] leading-relaxed">
                    {plan.subtag}
                  </p>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center space-x-2 shadow-sm ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 ring-2 ring-blue-600/30'
                      : plan.id === 'free'
                      ? 'bg-slate-900 hover:bg-slate-800 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <span>{plan.cta}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Features List */}
                <div className="space-y-3.5 pt-4 border-t border-slate-100 text-xs">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                    {plan.headerPlus}
                  </span>
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start space-x-2.5">
                      <div className="w-4 h-4 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 border border-blue-200">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 block leading-tight">
                          {feat.title}
                        </span>
                        {feat.desc && (
                          <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                            {feat.desc}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Subscription Success Modal -> Grants Free or Activated App Access */}
      {subscribedModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-2xl text-center space-y-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-700 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Subscription Confirmed!</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your account is now activated with the <strong>{selectedPlanName}</strong>. Step 1 (Plot & Setup) is unlocked for you to explore site parameters and dimensions.
            </p>
            <div className="pt-2">
              <button
                onClick={() => { setSubscribedModal(false); setRoute('planner'); }}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-2"
              >
                <span>Open Cost Planner & Workspace</span>
                <ArrowRight className="w-4 h-4 text-blue-200" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment QR Code Modal for Paid Plans */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        selectedPlan={selectedPlanForPayment}
        onPaymentSubmitted={() => {
          setPaymentModalOpen(false);
        }}
      />

    </div>
  );
}