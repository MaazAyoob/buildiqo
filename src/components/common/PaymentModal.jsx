import React, { useState, useRef } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Upload, 
  Image as ImageIcon, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  AlertCircle,
  Clock,
  Smartphone
} from 'lucide-react';
import { useEstimateStore } from '../../store/useEstimateStore';

export function PaymentModal({ isOpen, onClose, selectedPlan, onPaymentSubmitted }) {
  const { submitPayment, currentUser } = useEstimateStore();
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [screenshotName, setScreenshotName] = useState('');
  const [transactionNote, setTransactionNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const plan = selectedPlan || {
    id: 'pro',
    name: 'Professional Plan',
    price: '₹4,999',
    period: '/ month'
  };

  const upiId = '8095586121@ybl';

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    setError('');
    setScreenshotFile(file);
    setScreenshotName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!screenshotPreview) {
      setError('Please attach your payment screenshot before submitting for verification.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPayment({
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        screenshotUrl: screenshotPreview,
        screenshotFile: screenshotFile,
        notes: transactionNote || `Screenshot uploaded: ${screenshotName}`
      });

      if (onPaymentSubmitted) {
        onPaymentSubmitted();
      }
      if (onClose) {
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit payment. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-auto animate-fadeIn text-left">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block">
                UPI Instant Payment
              </span>
              <h3 className="text-lg font-black tracking-tight">Complete Plan Payment</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Plan Summary Banner */}
          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-blue-700 block">
                Selected Subscription
              </span>
              <span className="text-sm font-black text-slate-900">{plan.name}</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-blue-700">{plan.price}</span>
              <span className="text-[10px] font-bold text-slate-500 block">{plan.period || '/ month'}</span>
            </div>
          </div>

          {/* QR Code & UPI Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
            <span className="text-xs font-black text-slate-800 block">
              Scan QR Code to Pay with Any UPI App
            </span>

            {/* QR Image */}
            <div className="w-48 h-48 mx-auto bg-white p-2 rounded-2xl border-2 border-slate-200 shadow-md flex items-center justify-center overflow-hidden">
              <img 
                src="/payment-qr.jpg" 
                alt="Payment QR Code - SAMPURN" 
                className="w-full h-full object-contain"
              />
            </div>

            {/* UPI ID Display & Copy Button */}
            <div className="pt-1">
              <p className="text-[11px] font-bold text-slate-500 mb-1.5">Or Pay directly to UPI ID:</p>
              <div className="inline-flex items-center space-x-2 bg-white px-3.5 py-2 rounded-xl border border-slate-300 shadow-xs">
                <span className="text-xs font-black text-slate-900 font-mono tracking-wide">
                  UPI - 8095586121@ybl
                </span>
                <button
                  type="button"
                  onClick={handleCopyUPI}
                  className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center space-x-1 transition-colors border border-blue-200"
                  title="Copy UPI ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Screenshot Upload Section */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-black text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Attach Payment Screenshot *</span>
                </span>
                <span className="text-[10px] text-blue-700 font-bold">Mandatory for Admin Verification</span>
              </label>

              {/* Upload Drop Zone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 rounded-2xl border-2 border-dashed cursor-pointer text-center transition-all ${
                  screenshotPreview 
                    ? 'border-green-500 bg-green-50/40' 
                    : 'border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/30'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {screenshotPreview ? (
                  <div className="space-y-2">
                    <div className="w-24 h-24 mx-auto rounded-xl overflow-hidden border border-green-300 shadow-sm">
                      <img 
                        src={screenshotPreview} 
                        alt="Screenshot Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-center space-x-1.5 text-xs font-bold text-green-700">
                      <Check className="w-4 h-4" />
                      <span>{screenshotName || 'Screenshot attached'}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Click to replace image</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 py-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black text-slate-800 block">
                      Click to upload payment screenshot
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Upload PhonePe / GPay / Paytm payment receipt image (PNG, JPG)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Note / UTR Reference */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Transaction Reference / UTR (Optional)
              </label>
              <input
                type="text"
                value={transactionNote}
                onChange={(e) => setTransactionNote(e.target.value)}
                placeholder="e.g. UTR / Ref: 426890123456 or Sender Name"
                className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center space-x-2 text-xs font-bold text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Verification Notice */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-2 text-xs text-amber-900">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed font-medium">
                After uploading your screenshot, our administrator will manually verify the payment. Your screen will display <strong>"Payment in processing"</strong> until approved.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs shadow-md flex items-center justify-center space-x-2 transition-all"
              >
                <span>{isSubmitting ? 'Uploading & Submitting...' : 'Submit Payment for Admin Verification'}</span>
                <ArrowRight className="w-4 h-4 text-blue-200" />
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
}

export default PaymentModal;
