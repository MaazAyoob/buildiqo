import React, { useState } from 'react';
import { 
  Building2, 
  Clock, 
  CheckCircle2, 
  LogOut, 
  ShieldCheck, 
  Image as ImageIcon, 
  ExternalLink,
  RefreshCw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useEstimateStore } from '../../store/useEstimateStore';

export function PaymentProcessingScreen({ onProceedFree }) {
  const { subscription, currentUser, logout, updateSubscription } = useEstimateStore();
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);

  const pending = subscription?.pendingPayment;
  const planName = pending?.planName || subscription?.name || 'Professional Plan';
  const amount = pending?.amount || '₹4,999';
  const submittedTime = pending?.submittedAt 
    ? new Date(pending.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    : 'Just now';
  const screenshotUrl = pending?.screenshotUrl;

  const handleUseFreePlan = () => {
    updateSubscription('free');
    if (onProceedFree) onProceedFree();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 text-left">
      
      {/* Top Bar with Logo & Sign Out */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-xl tracking-tight text-slate-900">
                Buildiqo<span className="text-blue-600">.ai</span>
              </span>
              <span className="text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Payment Verification
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Civil Construction Planning & BOQ</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-black text-slate-900 block">{currentUser?.name}</span>
            <span className="text-[10px] text-slate-500 font-medium">{currentUser?.email}</span>
          </div>
          <button
            onClick={() => logout()}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 text-slate-700 hover:text-red-600 text-xs font-bold transition-all flex items-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Status Container */}
      <main className="max-w-xl w-full mx-auto my-8 space-y-6 animate-fadeIn">
        
        {/* Status Card */}
        <div className="bg-white rounded-3xl p-7 sm:p-9 border border-slate-200 shadow-xl text-center space-y-6">
          
          {/* Animated Processing Icon */}
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-amber-400/20 animate-ping" />
            <div className="relative w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner">
              <Clock className="w-9 h-9 animate-pulse" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-[11px] font-black uppercase tracking-wider inline-flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Payment in processing</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Payment Under Verification
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
              Your UPI payment screenshot has been uploaded and sent to our administration team for manual verification. Once approved, your account will instantly unlock full access to the entire website.
            </p>
          </div>

          {/* Verification Details Table */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3">
            <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-200">
              <span className="text-slate-500 font-bold">Requested Plan</span>
              <span className="font-black text-slate-900">{planName}</span>
            </div>

            <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-200">
              <span className="text-slate-500 font-bold">Amount Paid</span>
              <span className="font-black text-blue-700 text-sm">{amount}</span>
            </div>

            <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-200">
              <span className="text-slate-500 font-bold">Paid To UPI ID</span>
              <span className="font-mono font-bold text-slate-900">8095586121@ybl</span>
            </div>

            <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-200">
              <span className="text-slate-500 font-bold">Submitted At</span>
              <span className="font-bold text-slate-800">{submittedTime}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-bold">Current Status</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-[10px] uppercase">
                Pending Admin Review
              </span>
            </div>
          </div>

          {/* Screenshot Preview */}
          {screenshotUrl && (
            <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200 flex items-center justify-between text-left">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0">
                  <img src={screenshotUrl} alt="Receipt thumbnail" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 block">Payment Screenshot</span>
                  <span className="text-[10px] text-blue-700 font-semibold">Attached for verification</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScreenshotModal(true)}
                className="px-3 py-1.5 rounded-xl bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold transition-colors"
              >
                View
              </button>
            </div>
          )}

          {/* Live Sync Reminder */}
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-[11px] font-medium flex items-center justify-center space-x-2">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            <span>Automatic live sync active. You will gain access as soon as admin approves.</span>
          </div>

          {/* Option to use Free Plan in meantime */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleUseFreePlan}
              className="text-xs font-bold text-slate-600 hover:text-blue-700 transition-colors"
            >
              Or explore Step 1 (Plot & Setup) on Free Plan →
            </button>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 max-w-xl mx-auto">
        <p>Buildiqo.ai Civil Engineering & BOQ Engine • For urgent verification call +91 80955 86121</p>
      </footer>

      {/* Screenshot Modal */}
      {showScreenshotModal && screenshotUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 border border-slate-200 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-black text-slate-900">Uploaded Payment Receipt</span>
              <button
                onClick={() => setShowScreenshotModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold px-2"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-2xl border border-slate-200">
              <img src={screenshotUrl} alt="Full screenshot" className="w-full object-contain" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default PaymentProcessingScreen;
