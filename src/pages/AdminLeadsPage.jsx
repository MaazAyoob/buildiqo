import React, { useState } from 'react';
import { 
  Inbox, 
  Search, 
  Filter, 
  Download, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Sparkles,
  RefreshCw,
  CreditCard,
  Check,
  X,
  Eye,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { useEstimateStore, formatCurrency, formatNumber } from '../store/useEstimateStore';

export function AdminLeadsPage({ setRoute }) {
  const { 
    leads, 
    updateLeadStatus, 
    deleteLead, 
    currentUser, 
    payments = [], 
    approvePayment, 
    rejectPayment 
  } = useEstimateStore();

  const [activeTab, setActiveTab] = useState('payments'); // 'payments' or 'leads'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState(null);
  const [viewingPaymentScreenshot, setViewingPaymentScreenshot] = useState(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  const pendingPaymentsCount = payments.filter(p => p.status === 'pending').length;
  const approvedPaymentsCount = payments.filter(p => p.status === 'approved').length;

  const handleApprove = (paymentId, customerName) => {
    approvePayment(paymentId);
    setActionSuccessMessage(`Payment for ${customerName} approved! Customer now has full website access.`);
    if (viewingPaymentScreenshot?.id === paymentId) {
      setViewingPaymentScreenshot(prev => ({ ...prev, status: 'approved' }));
    }
    setTimeout(() => setActionSuccessMessage(''), 3500);
  };

  const handleReject = (paymentId, customerName) => {
    rejectPayment(paymentId, 'Screenshot could not be validated. Please provide a clear UPI transaction receipt.');
    setActionSuccessMessage(`Payment for ${customerName} marked as rejected.`);
    if (viewingPaymentScreenshot?.id === paymentId) {
      setViewingPaymentScreenshot(prev => ({ ...prev, status: 'rejected' }));
    }
    setTimeout(() => setActionSuccessMessage(''), 3500);
  };

  // Filter payments
  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      (p.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.userPhone || '').includes(searchTerm) ||
      (p.planName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = paymentStatusFilter === 'all' || p.status === paymentStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter leads
  const filteredLeads = leads.filter(l => {
    const matchesSearch = 
      l.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone.includes(searchTerm) ||
      l.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.projectTitle.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalInquiriesValue = leads.reduce((sum, l) => sum + (Number(l.estimatedBudget) || 0), 0);

  return (
    <div className="space-y-8 animate-fadeIn pb-16 text-left max-w-7xl mx-auto">
      
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200">
              Admin Portal
            </span>
            <h1 className="text-2xl font-black text-slate-900">
              Platform Administration & Verification Portal
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Logged in as <strong>{currentUser?.name || 'Platform Owner (admin@buildiqo.ai)'}</strong>. Manually review UPI payment screenshots and customer inquiries.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => { setActiveTab('payments'); setSearchTerm(''); }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 ${
              activeTab === 'payments'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payment Verifications</span>
            {pendingPaymentsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950 animate-pulse">
                {pendingPaymentsCount} Pending
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('leads'); setSearchTerm(''); }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 ${
              activeTab === 'leads'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Customer Inquiries</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900">
              {leads.length}
            </span>
          </button>
        </div>
      </div>

      {/* Success Banner Alert */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-2xl bg-green-50 border border-green-200 flex items-center space-x-3 text-green-800 text-xs font-bold animate-fadeIn shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 1: PAYMENT VERIFICATIONS SECTION */}
      {/* ============================================================ */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          
          {/* Metrics Row for Payments */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Payments Submitted</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{payments.length}</span>
              <span className="text-[10px] text-blue-700 font-semibold">UPI QR Code & ID Flow</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-300 bg-amber-50/40 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-amber-700 block">Pending Admin Verification</span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">
                {pendingPaymentsCount}
              </span>
              <span className="text-[10px] text-amber-800 font-semibold">Requires screenshot review</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-green-300 bg-green-50/40 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-green-700 block">Approved Subscriptions</span>
              <span className="text-2xl font-black text-green-700 mt-1 block">
                {approvedPaymentsCount}
              </span>
              <span className="text-[10px] text-green-800 font-semibold">Full access granted</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Target UPI ID</span>
              <span className="text-base font-black text-slate-900 mt-1 block font-mono">8095586121@ybl</span>
              <span className="text-[10px] text-slate-500">Beneficiary: SAMPURN</span>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by customer, email, plan, or UTR..."
                className="w-full pl-9 pr-3.5 py-2 text-xs font-bold text-slate-900 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
              {[
                { id: 'all', label: 'All Payments' },
                { id: 'pending', label: 'Pending Review' },
                { id: 'approved', label: 'Approved' },
                { id: 'rejected', label: 'Rejected' }
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setPaymentStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    paymentStatusFilter === st.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-4 px-5">Customer Details</th>
                    <th className="py-4 px-5">Plan & Amount</th>
                    <th className="py-4 px-5">UPI Payment Screenshot</th>
                    <th className="py-4 px-5">Submitted At</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5 text-center">Admin Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((payment) => {
                    const isPending = payment.status === 'pending';
                    const isApproved = payment.status === 'approved';
                    const isRejected = payment.status === 'rejected';

                    return (
                      <tr key={payment.id} className="hover:bg-slate-50/60 transition-colors">
                        
                        {/* Customer Info */}
                        <td className="py-4 px-5">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center shrink-0">
                              {(payment.userName || 'U').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-900 block text-xs">
                                {payment.userName}
                              </span>
                              <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                                <span>{payment.userEmail}</span>
                                <span>•</span>
                                <span>{payment.userPhone}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Plan & Amount */}
                        <td className="py-4 px-5">
                          <span className="font-extrabold text-slate-900 block">
                            {payment.planName}
                          </span>
                          <span className="text-sm font-black text-blue-700 block mt-0.5">
                            {payment.amount}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            To: {payment.upiId || '8095586121@ybl'}
                          </span>
                        </td>

                        {/* Screenshot Thumbnail */}
                        <td className="py-4 px-5">
                          {payment.screenshotUrl ? (
                            <div className="flex items-center space-x-2.5">
                              <div 
                                onClick={() => setViewingPaymentScreenshot(payment)}
                                className="w-14 h-14 rounded-xl overflow-hidden border-2 border-slate-200 hover:border-blue-500 cursor-pointer shadow-xs bg-slate-100 shrink-0 group relative"
                              >
                                <img 
                                  src={payment.screenshotUrl} 
                                  alt="Payment Receipt" 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <Eye className="w-4 h-4" />
                                </div>
                              </div>
                              <div>
                                <button
                                  onClick={() => setViewingPaymentScreenshot(payment)}
                                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition-colors flex items-center space-x-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View Receipt</span>
                                </button>
                                {payment.notes && (
                                  <span className="text-[10px] text-slate-400 block truncate max-w-[140px] mt-0.5">
                                    {payment.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">No screenshot attached</span>
                          )}
                        </td>

                        {/* Submission Time */}
                        <td className="py-4 px-5 text-slate-500 text-xs">
                          {payment.submittedAt ? new Date(payment.submittedAt).toLocaleString() : 'Recent'}
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-5">
                          {isPending && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-black text-[10px] uppercase inline-flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>Pending Review</span>
                            </span>
                          )}
                          {isApproved && (
                            <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-900 border border-green-300 font-black text-[10px] uppercase inline-flex items-center space-x-1">
                              <Check className="w-3 h-3" />
                              <span>Approved & Active</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-900 border border-red-300 font-black text-[10px] uppercase inline-flex items-center space-x-1">
                              <X className="w-3 h-3" />
                              <span>Rejected</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-center">
                          {isPending ? (
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleApprove(payment.id, payment.userName)}
                                className="px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black text-xs flex items-center space-x-1 shadow-sm transition-all"
                                title="Approve payment screenshot and grant full access"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleReject(payment.id, payment.userName)}
                                className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center space-x-1 border border-red-200 transition-all"
                                title="Reject screenshot"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : isApproved ? (
                            <span className="text-green-700 font-black text-xs inline-flex items-center space-x-1">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span>Access Unlocked</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleApprove(payment.id, payment.userName)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                            >
                              Re-Approve
                            </button>
                          )}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredPayments.length === 0 && (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <CreditCard className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold">No payment submissions found matching your search.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: CUSTOMER LEADS & INQUIRIES SECTION */}
      {/* ============================================================ */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          
          {/* Metrics Row for Leads */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Customer Inquiries</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{leads.length}</span>
              <span className="text-[10px] text-blue-700 font-semibold">100% PDF Download Captured</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">New Unread Leads</span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">
                {leads.filter(l => l.status === 'New Inquiry').length}
              </span>
              <span className="text-[10px] text-slate-500">Requires follow-up</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Contacted & Quotes Sent</span>
              <span className="text-2xl font-black text-blue-700 mt-1 block">
                {leads.filter(l => l.status === 'Contacted' || l.status === 'Quote Sent').length}
              </span>
              <span className="text-[10px] text-slate-500">In tender negotiations</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Average Project Budget</span>
              <span className="text-2xl font-black text-green-700 mt-1 block">
                {leads.length > 0 ? formatCurrency(Math.round(totalInquiriesValue / leads.length)) : '₹0'}
              </span>
              <span className="text-[10px] text-slate-500">Residential Turnkey</span>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by customer, phone, city, or project..."
                className="w-full pl-9 pr-3.5 py-2 text-xs font-bold text-slate-900 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
              {['all', 'New Inquiry', 'Contacted', 'Quote Sent', 'Contract Signed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'all' ? 'All Inquiries' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Leads Table Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-4 px-5">Customer & Contact</th>
                    <th className="py-4 px-5">Project & Location</th>
                    <th className="py-4 px-5 text-right">Built-Up Area</th>
                    <th className="py-4 px-5 text-right">Estimated Budget</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center shrink-0">
                            {lead.customerName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block text-xs">{lead.customerName}</span>
                            <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                              <span>{lead.email}</span>
                              <span>•</span>
                              <span>{lead.phone}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <span className="font-extrabold text-slate-900 block">{lead.projectTitle}</span>
                        <span className="text-[11px] text-slate-500 block">
                          {lead.city} • {lead.plotDimensions}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right font-extrabold text-slate-800">
                        {formatNumber(lead.builtupArea)} sq.ft
                        <span className="text-[10px] text-slate-400 block font-normal">{lead.tier}</span>
                      </td>

                      <td className="py-4 px-5 text-right font-black text-slate-900 text-sm">
                        {formatCurrency(lead.estimatedBudget)}
                      </td>

                      <td className="py-4 px-5">
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black border focus:outline-none cursor-pointer ${
                            lead.status === 'New Inquiry'
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : lead.status === 'Contacted'
                              ? 'bg-blue-50 text-blue-900 border-blue-300'
                              : lead.status === 'Quote Sent'
                              ? 'bg-purple-50 text-purple-900 border-purple-300'
                              : 'bg-green-50 text-green-900 border-green-300'
                          }`}
                        >
                          <option value="New Inquiry">New Inquiry</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Quote Sent">Quote Sent</option>
                          <option value="Contract Signed">Contract Signed</option>
                        </select>
                      </td>

                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => deleteLead(lead.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredLeads.length === 0 && (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <Inbox className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold">No customer requirements found matching your search.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Payment Screenshot Verification Full Lightbox Modal */}
      {viewingPaymentScreenshot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-fadeIn text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-600">
                  Verification Review • #{viewingPaymentScreenshot.id}
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {viewingPaymentScreenshot.userName} — {viewingPaymentScreenshot.planName} ({viewingPaymentScreenshot.amount})
                </h3>
              </div>
              <button
                onClick={() => setViewingPaymentScreenshot(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Customer Email</span>
                <span className="font-bold text-slate-800">{viewingPaymentScreenshot.userEmail}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Phone</span>
                <span className="font-bold text-slate-800">{viewingPaymentScreenshot.userPhone}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">UPI ID Paid</span>
                <span className="font-mono font-bold text-slate-800">{viewingPaymentScreenshot.upiId || '8095586121@ybl'}</span>
              </div>
            </div>

            {/* Enlarged Screenshot Image */}
            <div className="max-h-[55vh] overflow-auto rounded-2xl border-2 border-slate-200 bg-slate-950 flex items-center justify-center p-2">
              <img 
                src={viewingPaymentScreenshot.screenshotUrl} 
                alt="Payment Receipt Large" 
                className="max-h-[50vh] max-w-full object-contain rounded-lg"
              />
            </div>

            {/* Action Buttons inside Lightbox */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500">
                Status: <strong className="uppercase">{viewingPaymentScreenshot.status}</strong>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleReject(viewingPaymentScreenshot.id, viewingPaymentScreenshot.userName)}
                  className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-black text-xs border border-red-200 transition-all"
                >
                  Reject Receipt
                </button>
                <button
                  onClick={() => handleApprove(viewingPaymentScreenshot.id, viewingPaymentScreenshot.userName)}
                  className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black text-xs shadow-md flex items-center space-x-1.5 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Grant Full Access</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Customer Requirement Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 shadow-2xl space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                  Lead Ref: #{selectedLead.id}
                </span>
                <h3 className="text-lg font-black text-slate-900">{selectedLead.customerName}</h3>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Email</span>
                <p className="font-extrabold text-slate-900">{selectedLead.email}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</span>
                <p className="font-extrabold text-slate-900">{selectedLead.phone}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Project Title</span>
                <p className="font-extrabold text-slate-900">{selectedLead.projectTitle}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Estimated Budget</span>
                <p className="font-black text-blue-700 text-sm">{formatCurrency(selectedLead.estimatedBudget)}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Plot & Location</span>
                <p className="font-extrabold text-slate-900">{selectedLead.city}</p>
                <p className="text-[11px] text-slate-500">{selectedLead.plotDimensions}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Built-Up Area</span>
                <p className="font-extrabold text-slate-900">{formatNumber(selectedLead.builtupArea)} sq.ft</p>
                <p className="text-[11px] text-slate-500">{selectedLead.tier}</p>
              </div>
            </div>

            <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 text-xs space-y-1">
              <span className="text-[10px] font-bold text-blue-900 uppercase">Inquiry Notes</span>
              <p className="text-slate-700 leading-relaxed font-medium">{selectedLead.notes}</p>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <a
                href={`tel:${selectedLead.phone}`}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-700 text-white flex items-center space-x-1.5 shadow-sm"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Customer</span>
              </a>
              <a
                href={`mailto:${selectedLead.email}?subject=Buildiqo.ai Quotation for ${encodeURIComponent(selectedLead.projectTitle)}`}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1.5 shadow-sm"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Quotation Email</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminLeadsPage;