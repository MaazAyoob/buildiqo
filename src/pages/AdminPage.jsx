import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  Save, 
  ShieldCheck, 
  MapPin, 
  History, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileText, 
  ArrowUpRight, 
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  Bot,
  TrendingUp,
  TrendingDown,
  Filter,
  CheckSquare,
  Square,
  XCircle,
  Info,
  Calendar,
  Building2,
  Cpu,
  Globe,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { apiRequest } from '../utils/apiClient';
import { useEstimateStore, formatCurrency } from '../store/useEstimateStore';
import { INDIAN_STATES } from '../data/states';

export function AdminPage() {
  const { currentUser } = useEstimateStore();
  const [activeTab, setActiveTab] = useState('rates'); // 'rates' | 'research'
  const [adminState, setAdminState] = useState('Karnataka');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Rate Update Modal State (Existing Phase 1.5)
  const [selectedMaterialForUpdate, setSelectedMaterialForUpdate] = useState(null);
  const [newRateValue, setNewRateValue] = useState('');
  const [newRateLocation, setNewRateLocation] = useState('National');
  const [newRateSource, setNewRateSource] = useState('Supplier Quote');
  const [newRateNotes, setNewRateNotes] = useState('');
  const [submittingRate, setSubmittingRate] = useState(false);

  // History Drawer State (Existing Phase 1.5)
  const [historyMaterial, setHistoryMaterial] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ==========================================
  // PHASE 3.5: AI PRICE RESEARCH STATE
  // ==========================================
  const [locations, setLocations] = useState([]);
  const [selectedState, setSelectedState] = useState('Uttar Pradesh');
  const [selectedCity, setSelectedCity] = useState('Varanasi');
  const [locationScope, setLocationScope] = useState('city'); // 'city' | 'state' | 'national'
  const [selectedProvider, setSelectedProvider] = useState('google'); // 'google' | 'openai' | 'mock'
  const [researchScope, setResearchScope] = useState('all'); // 'all' | 'category' | 'specific' | 'custom'
  const [researchCategory, setResearchCategory] = useState('steel');
  const [customResearchQuery, setCustomResearchQuery] = useState('');
  const [sourcePreferences, setSourcePreferences] = useState([
    'government', 'manufacturer', 'authorized_dealer', 'market_publication', 'marketplace'
  ]);
  const [researching, setResearching] = useState(false);
  const [researchProgress, setResearchProgress] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState(new Set());
  const [candidateFilterStatus, setCandidateFilterStatus] = useState('all');

  // Modals & Drawers
  const [evidenceCandidate, setEvidenceCandidate] = useState(null);
  const [editModalCandidate, setEditModalCandidate] = useState(null);
  const [editRateInput, setEditRateInput] = useState('');
  const [editRateNotes, setEditRateNotes] = useState('');
  const [rejectModalCandidate, setRejectModalCandidate] = useState(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

  const fetchMaterials = async (targetState = adminState) => {
    try {
      setLoading(true);
      const url = targetState ? `/api/pricing/materials?state=${encodeURIComponent(targetState)}` : '/api/pricing/materials';
      const res = await apiRequest(url);
      if (res.success && Array.isArray(res.materials)) {
        setMaterials(res.materials);
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to load materials catalog.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error connecting to pricing service.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await apiRequest('/api/pricing/locations');
      if (res.success && Array.isArray(res.data)) {
        setLocations(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch locations:', err);
    }
  };

  const fetchCandidates = async () => {
    try {
      setLoadingCandidates(true);
      const res = await apiRequest('/api/pricing/research/candidates');
      if (res.success && Array.isArray(res.candidates)) {
        setCandidates(res.candidates);
      }
    } catch (err) {
      console.warn('Could not fetch candidates:', err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  useEffect(() => {
    if (currentUser?.isAdmin) {
      fetchMaterials(adminState);
      fetchLocations();
      fetchCandidates();
    }
  }, [currentUser, adminState]);

  // Current cities for selected state
  const currentStateObj = locations.find(l => l.stateName?.toLowerCase() === selectedState?.toLowerCase() || l.stateId === selectedState);
  const availableCities = currentStateObj?.cities || [];

  // ==========================================
  // MANUAL RATE UPDATE HANDLERS
  // ==========================================
  const handleOpenRateUpdate = (mat) => {
    setSelectedMaterialForUpdate(mat);
    setNewRateValue(mat.currentApprovedRate || '');
    setNewRateLocation(adminState || 'Karnataka');
    setNewRateSource(mat.rateSource || 'Supplier Quote');
    setNewRateNotes('');
    setFeedback({ type: '', message: '' });
  };

  const handleCloseRateUpdate = () => {
    setSelectedMaterialForUpdate(null);
    setNewRateValue('');
    setNewRateNotes('');
  };

  const handleSubmitRateRevision = async (e) => {
    e.preventDefault();
    if (!selectedMaterialForUpdate) return;

    const rateNum = Number(newRateValue);
    if (isNaN(rateNum) || rateNum <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid positive rate amount.' });
      return;
    }

    try {
      setSubmittingRate(true);
      const res = await apiRequest('/api/pricing/rates', {
        method: 'POST',
        body: JSON.stringify({
          materialCode: selectedMaterialForUpdate.materialCode,
          rate: rateNum,
          state: newRateLocation,
          location: newRateLocation,
          cityId: newRateLocation.toLowerCase() === 'national' ? 'all' : 'all',
          source: newRateSource,
          notes: newRateNotes
        })
      });

      if (res.success) {
        setFeedback({ 
          type: 'success', 
          message: `Approved rate for ${selectedMaterialForUpdate.materialCode} (${selectedMaterialForUpdate.name}) in ${newRateLocation} successfully updated to ₹${rateNum}. Previous rate marked superseded.` 
        });
        handleCloseRateUpdate();
        await fetchMaterials(adminState);
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to submit rate revision.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Network error updating rate.' });
    } finally {
      setSubmittingRate(false);
    }
  };

  const handleOpenHistory = async (mat) => {
    setHistoryMaterial(mat);
    setLoadingHistory(true);
    try {
      const url = adminState
        ? `/api/pricing/materials/${encodeURIComponent(mat.materialCode)}/history?state=${encodeURIComponent(adminState)}`
        : `/api/pricing/materials/${encodeURIComponent(mat.materialCode)}/history`;
      const res = await apiRequest(url);
      if (res.success && res.data) {
        setHistoryRecords(res.data.history || []);
      } else {
        setHistoryRecords([]);
      }
    } catch (err) {
      setHistoryRecords([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCloseHistory = () => {
    setHistoryMaterial(null);
    setHistoryRecords([]);
  };

  // ==========================================
  // PHASE 3.5 RESEARCH HANDLERS
  // ==========================================
  const handleStartResearch = async () => {
    try {
      setResearching(true);
      setResearchProgress(`Initiating price research for ${selectedCity || selectedState}...`);
      setFeedback({ type: '', message: '' });

      const res = await apiRequest('/api/pricing/research', {
        method: 'POST',
        body: JSON.stringify({
          state: selectedState,
          city: locationScope === 'city' ? selectedCity : 'All',
          locationScope,
          researchScope,
          category: researchScope === 'category' ? researchCategory : null,
          searchQuery: researchScope === 'custom' ? customResearchQuery : null,
          sourcePreferences,
          provider: selectedProvider
        })
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Price research completed! Found ${res.data.candidateCount} candidates (${res.data.successCount} high/medium confidence, ${res.data.warningCount} needs review). Candidates held in pending approval queue.`
        });
        await fetchCandidates();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Research run failed.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error connecting to research service.' });
    } finally {
      setResearching(false);
      setResearchProgress('');
    }
  };

  const handleApproveCandidate = async (candidate) => {
    try {
      setActionInProgress(true);
      const res = await apiRequest(`/api/pricing/research/candidates/${candidate._id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ notes: 'Approved by administrator from candidate table.' })
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Candidate approved! Rate for ${candidate.materialCode} updated to ₹${candidate.normalizedRate}/${candidate.normalizedUnit}.`
        });
        await fetchCandidates();
        await fetchMaterials();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Approval failed.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error during approval.' });
    } finally {
      setActionInProgress(false);
    }
  };

  const handleOpenEditModal = (candidate) => {
    setEditModalCandidate(candidate);
    setEditRateInput(candidate.normalizedRate || candidate.sourcePrice || '');
    setEditRateNotes('');
  };

  const handleConfirmEditAndApprove = async (e) => {
    e.preventDefault();
    if (!editModalCandidate) return;

    const numRate = Number(editRateInput);
    if (isNaN(numRate) || numRate <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid positive numeric rate.' });
      return;
    }

    try {
      setActionInProgress(true);
      const res = await apiRequest(`/api/pricing/research/candidates/${editModalCandidate._id}/approve-with-edit`, {
        method: 'POST',
        body: JSON.stringify({
          editedRate: numRate,
          notes: editRateNotes || 'Adjusted and approved by admin.'
        })
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Candidate rate adjusted to ₹${numRate} and approved! Original researched rate (₹${editModalCandidate.normalizedRate}) preserved in audit trail.`
        });
        setEditModalCandidate(null);
        await fetchCandidates();
        await fetchMaterials();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Edit and approve failed.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error during edit & approve.' });
    } finally {
      setActionInProgress(false);
    }
  };

  const handleOpenRejectModal = (candidate) => {
    setRejectModalCandidate(candidate);
    setRejectReasonInput('');
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectModalCandidate) return;

    try {
      setActionInProgress(true);
      const res = await apiRequest(`/api/pricing/research/candidates/${rejectModalCandidate._id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReasonInput })
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Candidate for ${rejectModalCandidate.materialCode} rejected. Production rates were not modified.`
        });
        setRejectModalCandidate(null);
        await fetchCandidates();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Rejection failed.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error rejecting candidate.' });
    } finally {
      setActionInProgress(false);
    }
  };

  const handleToggleSelectCandidate = (id) => {
    const next = new Set(selectedCandidateIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCandidateIds(next);
  };

  const handleSelectAllPending = () => {
    const pendingIds = filteredCandidates.filter(c => c.status === 'pending').map(c => c._id);
    if (selectedCandidateIds.size === pendingIds.length && pendingIds.length > 0) {
      setSelectedCandidateIds(new Set());
    } else {
      setSelectedCandidateIds(new Set(pendingIds));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedCandidateIds.size === 0) return;
    try {
      setActionInProgress(true);
      const res = await apiRequest('/api/pricing/research/candidates/bulk-approve', {
        method: 'POST',
        body: JSON.stringify({ candidateIds: Array.from(selectedCandidateIds) })
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message
        });
        setSelectedCandidateIds(new Set());
        await fetchCandidates();
        await fetchMaterials();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Bulk approval failed.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error during bulk approval.' });
    } finally {
      setActionInProgress(false);
    }
  };

  // Filter materials for Rates Tab
  const categories = ['ALL', ...new Set(materials.map(m => m.category))];
  const filteredMaterials = materials.filter(m => {
    const matchesSearch = 
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.materialCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || m.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Filter candidates for Research Tab
  const filteredCandidates = candidates.filter(c => {
    if (candidateFilterStatus === 'all') return true;
    return c.status === candidateFilterStatus;
  });

  if (!currentUser?.isAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-red-200 text-red-700 shadow-sm">
        <Lock className="w-10 h-10 mx-auto text-red-500 mb-2" />
        <h2 className="text-xl font-bold">Administrator Access Required</h2>
        <p className="text-xs text-gray-500 mt-1">You must be logged in as an authorized Buildiqo Platform Administrator to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AUTHORITATIVE MATERIAL PRICING SYSTEM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Material Price Master & AI Regional Research
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Manage production procurement rates with append-only audit histories, or research regional Indian prices using Google Gemini Search Grounding. AI results produce unapproved candidates; only explicit admin approval updates production rates.
          </p>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center space-x-3 mt-6">
            <button
              onClick={() => setActiveTab('rates')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all ${
                activeTab === 'rates'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Current Approved Rates</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-blue-800/80 text-white">
                {materials.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('research')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all ${
                activeTab === 'research'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-cyan-300" />
              <span>AI Price Research</span>
              {candidates.filter(c => c.status === 'pending').length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black animate-pulse">
                  {candidates.filter(c => c.status === 'pending').length} Pending
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold animate-fadeIn ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-red-50 text-red-900 border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback({ type: '', message: '' })} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: CURRENT APPROVED RATES (Phase 1.5 Functional Core) */}
      {/* ========================================================================= */}
      {activeTab === 'rates' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {/* State Selector */}
              <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 w-full sm:w-auto shrink-0">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">State:</span>
                <select
                  value={adminState}
                  onChange={(e) => setAdminState(e.target.value)}
                  className="text-xs font-black text-slate-900 bg-transparent focus:outline-none cursor-pointer pr-2"
                >
                  <option value="National">National (Baseline)</option>
                  {INDIAN_STATES.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search code or material..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Materials Table */}
          {adminState === 'National' && (
            <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 flex items-center space-x-3 text-xs text-blue-950">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <span className="font-extrabold">National Baseline Scope:</span> Showing all-India baseline rates. These rates serve as the fallback for states without approved state rates. Revisions here update the national fallback without altering state-specific rates.
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-blue-700" />
                  <span>Approved Production Procurement Rates</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Showing {filteredMaterials.length} materials for {adminState}. Historical rates are append-only; revisions supersede older rates.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs font-bold text-gray-400">
                Loading materials from database...
              </div>
            ) : filteredMaterials.length === 0 ? (
              <div className="p-12 text-center text-xs font-bold text-gray-500">
                No materials found matching filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-5">Material & Code</th>
                      <th className="py-3.5 px-5">Category & Unit</th>
                      <th className="py-3.5 px-5">Grade / Brand</th>
                      <th className="py-3.5 px-5">Current Approved Rate</th>
                      <th className="py-3.5 px-5">Location & Scope</th>
                      <th className="py-3.5 px-5">Source</th>
                      <th className="py-3.5 px-5">Last Revision</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {filteredMaterials.map((mat) => (
                      <tr key={mat._id || mat.materialCode} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="font-extrabold text-slate-900">{mat.name}</div>
                          <div className="text-[10px] font-mono text-blue-700 uppercase">{mat.materialCode}</div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="font-bold text-slate-700">{mat.category}</span>
                          <div className="text-[10px] text-gray-400 font-mono">{mat.rateUnit || mat.unit}</div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="text-slate-900 font-bold">{mat.grade || mat.tier || 'Standard'}</div>
                          <div className="text-[10px] text-gray-500">{mat.brand || 'Multi-brand approved'}</div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="text-sm font-black text-slate-900">
                            {formatCurrency(mat.currentApprovedRate)}
                            <span className="text-[10px] text-gray-400 font-normal"> / {mat.rateUnit || mat.unit}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex flex-col items-start gap-1">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center space-x-1">
                              <MapPin className="w-2.5 h-2.5 text-blue-600" />
                              <span>{mat.rateLocation || 'National'}</span>
                            </span>
                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                              mat.pricingScope === 'NATIONAL' || mat.rateStateId === 'all'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {mat.pricingScope === 'NATIONAL' || mat.rateStateId === 'all' ? 'National Baseline' : 'State Rate'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="text-[11px] text-gray-600 font-semibold">{mat.rateSource || 'initial_seed'}</span>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="text-[11px] text-gray-700 font-bold">
                            {mat.lastRateUpdate ? new Date(mat.lastRateUpdate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Initial Seed'}
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenHistory(mat)}
                              title="View complete append-only audit history"
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center space-x-1 transition-colors"
                            >
                              <History className="w-3.5 h-3.5 text-blue-600" />
                              <span>Audit History</span>
                            </button>
                            <button
                              onClick={() => handleOpenRateUpdate(mat)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-slate-900 text-white font-bold text-[11px] flex items-center space-x-1 shadow-2xs transition-colors"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>Revise Rate</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AI PRICE RESEARCH (Phase 3.5 Engine) */}
      {/* ========================================================================= */}
      {activeTab === 'research' && (
        <div className="space-y-6">
          
          {/* Research Launcher Box */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-4 mb-5">
              <Bot className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-base font-extrabold text-slate-900">AI Regional Construction Price Research</h3>
                <p className="text-xs text-gray-500">
                  Search live market schedules, dealer lists, and publications across Indian states & cities. Output is held for review.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-3">
              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Research Engine</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                >
                  <option value="google">Google Gemini (Live Search)</option>
                  <option value="openai">OpenAI Web Research</option>
                  <option value="mock">Sandbox Mock (Offline Demo)</option>
                </select>
              </div>

              {/* State Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Indian State</label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    const stateObj = locations.find(l => l.stateName === e.target.value || l.stateId === e.target.value);
                    if (stateObj && stateObj.cities.length > 0) {
                      setSelectedCity(stateObj.cities[0].cityName);
                    } else {
                      setSelectedCity('All');
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                >
                  {locations.map(loc => (
                    <option key={loc.stateId} value={loc.stateName}>{loc.stateName}</option>
                  ))}
                </select>
              </div>

              {/* City Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">City (or State-Level)</label>
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setLocationScope(e.target.value === 'All' ? 'state' : 'city');
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                >
                  <option value="All">All Cities (State-Level Research)</option>
                  {availableCities.map(c => (
                    <option key={c.cityId} value={c.cityName}>{c.cityName} (Tier {c.tier})</option>
                  ))}
                </select>
              </div>

              {/* Research Scope */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Material Scope</label>
                <select
                  value={researchScope}
                  onChange={(e) => setResearchScope(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                >
                  <option value="all">All Materials in Catalog ({materials.length})</option>
                  <option value="category">By Specific Category</option>
                  <option value="custom">Physical Entry / Search Any Material</option>
                </select>
              </div>

              {/* Category Filter or Physical Entry Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {researchScope === 'custom' ? 'Physical Entry / Material Name' : 'Category Filter'}
                </label>
                {researchScope === 'custom' ? (
                  <input
                    type="text"
                    value={customResearchQuery}
                    onChange={(e) => setCustomResearchQuery(e.target.value)}
                    placeholder="Enter any material (e.g. Tata Tiscon 12mm, Ultratech PPC...)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <select
                    value={researchCategory}
                    disabled={researchScope !== 'category'}
                    onChange={(e) => setResearchCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white disabled:opacity-50"
                  >
                    {categories.filter(c => c !== 'ALL').map(c => (
                      <option key={c} value={c}>{c.toUpperCase()}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {selectedProvider === 'google' && (
              <div className="mb-4 px-3.5 py-2 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between text-[11px] text-blue-900">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>Google Gemini Search Engine:</strong> Requires <code>GOOGLE_GEMINI_API_KEY</code> in <code>server/.env</code>. To test candidate generation and approval without an API key, switch the engine above to <strong>"Sandbox Mock (Offline Demo)"</strong>.
                  </span>
                </div>
              </div>
            )}

            {selectedProvider === 'mock' && (
              <div className="mb-4 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-[11px] text-amber-900">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Sandbox Demonstration Mode Active:</strong> Ready to research without external API keys. Generates realistic regional candidates, deterministic normalizations, and multi-citation evidence.
                  </span>
                </div>
              </div>
            )}

            {/* Source Preferences */}
            <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Source Preferences:</span>
                {[
                  { id: 'government', label: 'Government / Public' },
                  { id: 'manufacturer', label: 'Manufacturers' },
                  { id: 'authorized_dealer', label: 'Authorized Dealers' },
                  { id: 'market_publication', label: 'Market Publications' },
                  { id: 'marketplace', label: 'Construction B2B' }
                ].map(sp => {
                  const isChecked = sourcePreferences.includes(sp.id);
                  return (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => {
                        if (isChecked) setSourcePreferences(sourcePreferences.filter(x => x !== sp.id));
                        else setSourcePreferences([...sourcePreferences, sp.id]);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                        isChecked
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}{sp.label}
                    </button>
                  );
                })}
              </div>

              {/* Primary Action Button */}
              <button
                onClick={handleStartResearch}
                disabled={researching}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-slate-900 text-white text-xs font-black flex items-center space-x-2 shadow-sm transition-all disabled:opacity-50"
              >
                {researching ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Researching Prices...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Research Current Prices</span>
                  </>
                )}
              </button>
            </div>

            {/* Live Progress Banner */}
            {researching && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center space-x-3 text-xs text-blue-900 font-bold animate-pulse">
                <Bot className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{researchProgress}</span>
              </div>
            )}
          </div>

          {/* Research Run Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Candidates</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">{candidates.length}</span>
              <span className="text-[10px] text-gray-500">Researched price schedule items</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Pending Review</span>
              <span className="text-xl font-black text-amber-600 mt-1 block">
                {candidates.filter(c => c.status === 'pending').length}
              </span>
              <span className="text-[10px] text-gray-500">Requires administrator decision</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">High Confidence</span>
              <span className="text-xl font-black text-emerald-600 mt-1 block">
                {candidates.filter(c => c.confidence === 'HIGH').length}
              </span>
              <span className="text-[10px] text-gray-500">Multiple verified citations</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Approved to Production</span>
              <span className="text-xl font-black text-blue-600 mt-1 block">
                {candidates.filter(c => c.status === 'approved').length}
              </span>
              <span className="text-[10px] text-gray-500">Active in MaterialRate ledger</span>
            </div>
          </div>

          {/* Filter Toolbar for Candidates */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500">Filter Status:</span>
              {['all', 'pending', 'approved', 'rejected', 'superseded'].map(st => (
                <button
                  key={st}
                  onClick={() => setCandidateFilterStatus(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                    candidateFilterStatus === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Select All Pending button */}
            <button
              onClick={handleSelectAllPending}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Select All Pending</span>
            </button>
          </div>

          {/* Candidates Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Researched Price Candidates Queue</h3>
                <p className="text-xs text-gray-500">
                  Showing {filteredCandidates.length} candidate rates. AI research never changes MaterialRate directly; only explicit approval commits to production.
                </p>
              </div>
            </div>

            {loadingCandidates ? (
              <div className="p-12 text-center text-xs font-bold text-gray-400">Loading candidate queue...</div>
            ) : filteredCandidates.length === 0 ? (
              <div className="p-12 text-center text-xs font-bold text-gray-500">
                No candidates found. Click "Research Current Prices" to begin regional procurement research.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 w-10">
                        <input
                          type="checkbox"
                          checked={selectedCandidateIds.size > 0 && selectedCandidateIds.size === filteredCandidates.filter(c => c.status === 'pending').length}
                          onChange={handleSelectAllPending}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="py-3.5 px-4">Material & Spec</th>
                      <th className="py-3.5 px-4">Target Location</th>
                      <th className="py-3.5 px-4">Current Approved</th>
                      <th className="py-3.5 px-4">Researched Rate</th>
                      <th className="py-3.5 px-4">Price Variance</th>
                      <th className="py-3.5 px-4">Confidence</th>
                      <th className="py-3.5 px-4">Source & Freshness</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {filteredCandidates.map(cand => {
                      const isPending = cand.status === 'pending';
                      const isSelected = selectedCandidateIds.has(cand._id);

                      // Variance styling
                      let varianceColor = 'bg-slate-100 text-slate-700';
                      if (cand.varianceFlag === 'normal') varianceColor = 'bg-emerald-100 text-emerald-800';
                      else if (cand.varianceFlag === 'review_recommended') varianceColor = 'bg-amber-100 text-amber-800';
                      else if (cand.varianceFlag === 'large_change') varianceColor = 'bg-orange-100 text-orange-800';
                      else if (cand.varianceFlag === 'high_variance') varianceColor = 'bg-red-100 text-red-800 font-black';

                      // Confidence styling
                      let confColor = 'bg-slate-100 text-slate-700';
                      if (cand.confidence === 'HIGH') confColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                      else if (cand.confidence === 'MEDIUM') confColor = 'bg-amber-100 text-amber-800 border-amber-300';
                      else if (cand.confidence === 'LOW') confColor = 'bg-red-100 text-red-800 border-red-300';

                      return (
                        <tr key={cand._id} className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                          <td className="py-3 px-4">
                            {isPending && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectCandidate(cand._id)}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-slate-900">{cand.materialName}</div>
                            <div className="text-[10px] font-mono text-blue-700 uppercase">{cand.materialCode}</div>
                            <div className="text-[10px] text-gray-500">{cand.specification || cand.grade}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center space-x-1">
                              <MapPin className="w-2.5 h-2.5 text-blue-600" />
                              <span>{cand.requestedLocation || cand.city || cand.state}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-700">
                              {cand.currentApprovedRate ? formatCurrency(cand.currentApprovedRate) : '₹0'}
                              <span className="text-[10px] text-gray-400 font-normal"> / {cand.normalizedUnit}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-sm font-black text-blue-900">
                              {cand.normalizedRate !== null ? formatCurrency(cand.normalizedRate) : 'Normalization Required'}
                              {cand.normalizedRate !== null && (
                                <span className="text-[10px] text-gray-400 font-normal"> / {cand.normalizedUnit}</span>
                              )}
                            </div>
                            {cand.sourceUnit && cand.sourceUnit !== cand.normalizedUnit && (
                              <div className="text-[10px] text-gray-400">
                                Raw: {formatCurrency(cand.sourcePrice)}/{cand.sourceUnit}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${varianceColor}`}>
                              {cand.priceDifferencePercent > 0 ? `+${cand.priceDifferencePercent}%` : `${cand.priceDifferencePercent}%`}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${confColor}`}>
                              {cand.confidence} ({cand.confidenceScore})
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 max-w-[150px] truncate" title={cand.sourceName}>
                              {cand.sourceName}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {new Date(cand.researchDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              cand.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                              cand.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              cand.status === 'superseded' ? 'bg-gray-100 text-gray-600' :
                              'bg-amber-100 text-amber-900'
                            }`}>
                              {cand.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* View Evidence */}
                              <button
                                onClick={() => setEvidenceCandidate(cand)}
                                title="View research evidence and citation details"
                                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition-colors"
                              >
                                <Info className="w-3.5 h-3.5 text-blue-600" />
                              </button>

                              {isPending && (
                                <>
                                  {/* Approve */}
                                  <button
                                    onClick={() => handleApproveCandidate(cand)}
                                    disabled={actionInProgress}
                                    title="Approve researched candidate rate directly"
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-colors"
                                  >
                                    Approve
                                  </button>

                                  {/* Edit & Approve */}
                                  <button
                                    onClick={() => handleOpenEditModal(cand)}
                                    disabled={actionInProgress}
                                    title="Adjust rate before approving"
                                    className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-2xs transition-colors"
                                  >
                                    Edit
                                  </button>

                                  {/* Reject */}
                                  <button
                                    onClick={() => handleOpenRejectModal(cand)}
                                    disabled={actionInProgress}
                                    title="Reject candidate rate"
                                    className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 font-bold text-[11px] transition-colors"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sticky Bulk Action Toolbar */}
          {selectedCandidateIds.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-4 border border-slate-700 z-50 animate-slideUp">
              <span className="text-xs font-bold">
                <span className="text-blue-400 font-extrabold">{selectedCandidateIds.size}</span> Candidates Selected
              </span>
              <button
                onClick={handleBulkApprove}
                disabled={actionInProgress}
                className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs transition-colors shadow-xs"
              >
                Approve Selected ({selectedCandidateIds.size})
              </button>
              <button
                onClick={() => setSelectedCandidateIds(new Set())}
                className="text-xs text-gray-400 hover:text-white underline font-semibold"
              >
                Clear
              </button>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REVISE RATE (Phase 1.5 Manual Revision) */}
      {/* ========================================================================= */}
      {selectedMaterialForUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">Revise Approved Material Rate</h3>
              </div>
              <button onClick={handleCloseRateUpdate} className="text-gray-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleSubmitRateRevision} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="font-extrabold text-slate-900">{selectedMaterialForUpdate.name}</div>
                <div className="text-[10px] font-mono text-blue-700 uppercase">{selectedMaterialForUpdate.materialCode}</div>
                <div className="text-gray-500 mt-1">
                  Current: <span className="font-bold text-slate-800">{formatCurrency(selectedMaterialForUpdate.currentApprovedRate)}</span> per {selectedMaterialForUpdate.rateUnit || selectedMaterialForUpdate.unit}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Approved Rate (₹)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={newRateValue}
                  onChange={(e) => setNewRateValue(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target State / Scope</label>
                  <select
                    value={newRateLocation}
                    onChange={(e) => setNewRateLocation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white cursor-pointer"
                  >
                    <option value="National">National (All States Baseline)</option>
                    {INDIAN_STATES.map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-500 mt-1">
                    {newRateLocation.toLowerCase() === 'national'
                      ? '⚠️ National Baseline serves strictly as fallback for states without approved state rates. Will not overwrite state-specific rates.'
                      : `✅ Applies exclusively to ${newRateLocation} and takes precedence over National Baseline.`}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rate Source</label>
                  <input
                    type="text"
                    value={newRateSource}
                    onChange={(e) => setNewRateSource(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Audit Notes / Rationale</label>
                <textarea
                  rows="2"
                  value={newRateNotes}
                  onChange={(e) => setNewRateNotes(e.target.value)}
                  placeholder="e.g. Revised based on quarterly supplier rate revision circular..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseRateUpdate}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRate}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-slate-900 text-white font-black text-xs shadow-sm transition-colors"
                >
                  {submittingRate ? 'Committing Revision...' : 'Commit Rate Revision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: RATE AUDIT HISTORY (Phase 1.5 Append-Only Ledger) */}
      {/* ========================================================================= */}
      {historyMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white h-full max-w-md w-full shadow-2xl p-6 flex flex-col justify-between border-l border-slate-200 animate-slideLeft">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <History className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Append-Only Audit History</h3>
                </div>
                <button onClick={handleCloseHistory} className="text-gray-400 hover:text-slate-600 text-lg">✕</button>
              </div>

              <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-extrabold text-slate-900 text-sm">{historyMaterial.name}</div>
                <div className="text-[10px] font-mono text-blue-700 uppercase">{historyMaterial.materialCode}</div>
              </div>

              {loadingHistory ? (
                <div className="text-center py-8 text-xs text-gray-400">Loading audit records...</div>
              ) : historyRecords.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500">No revisions recorded yet.</div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                  {historyRecords.map((rec, idx) => (
                    <div key={rec._id || idx} className={`p-3 rounded-xl border text-xs ${
                      rec.status === 'approved' 
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' 
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <div className="flex items-center justify-between font-extrabold">
                        <span className="text-sm">{formatCurrency(rec.rate)} / {rec.unit}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          rec.status === 'approved' ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {rec.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1 flex items-center justify-between">
                        <span>Loc: {rec.location || 'National'}</span>
                        <span>{new Date(rec.effectiveFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      {rec.notes && <div className="text-[11px] text-gray-600 mt-1 italic">"{rec.notes}"</div>}
                      <div className="text-[10px] text-gray-400 mt-1">Source: {rec.source}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleCloseHistory}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
            >
              Close Ledger
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: RESEARCH EVIDENCE & CITATION AUDIT (Phase 3.5) */}
      {/* ========================================================================= */}
      {evidenceCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white h-full max-w-lg w-full shadow-2xl p-6 flex flex-col justify-between border-l border-slate-200 overflow-y-auto animate-slideLeft">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Research Evidence & Audit Details</h3>
                </div>
                <button onClick={() => setEvidenceCandidate(null)} className="text-gray-400 hover:text-slate-600 text-lg">✕</button>
              </div>

              {/* Material & Candidate Summary */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-sm">{evidenceCandidate.materialName}</span>
                  <span className="font-mono text-[10px] text-blue-700 uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {evidenceCandidate.materialCode}
                  </span>
                </div>
                <div className="text-gray-600">Location: <span className="font-bold text-slate-800">{evidenceCandidate.requestedLocation}</span></div>
                <div className="text-gray-600">Provider: <span className="font-bold text-slate-800">{evidenceCandidate.provider} ({evidenceCandidate.providerModel})</span></div>
                <div className="text-gray-600">Researched Date: <span className="font-bold text-slate-800">{new Date(evidenceCandidate.researchDate).toLocaleString('en-IN')}</span></div>
              </div>

              {/* Rate & Normalization Details */}
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 text-xs space-y-2">
                <div className="text-blue-900 font-extrabold text-xs uppercase tracking-wider">Unit Normalization Trace</div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Raw Source Reported:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(evidenceCandidate.sourcePrice)} / {evidenceCandidate.sourceUnit}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Authoritative Canonical Rate:</span>
                  <span className="font-extrabold text-blue-900 text-sm">
                    {evidenceCandidate.normalizedRate !== null ? `${formatCurrency(evidenceCandidate.normalizedRate)} / ${evidenceCandidate.normalizedUnit}` : 'Normalization Required'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-bold text-slate-800">{evidenceCandidate.normalizationStatus}</span>
                </div>
              </div>

              {/* Confidence Score & Reason */}
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs space-y-2">
                <div className="text-emerald-900 font-extrabold text-xs uppercase tracking-wider">Confidence Calculation</div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Rating:</span>
                  <span className="font-black text-emerald-800 text-sm">{evidenceCandidate.confidence} ({evidenceCandidate.confidenceScore}/100)</span>
                </div>
                <div className="text-gray-700 text-[11px] leading-relaxed mt-1">
                  <span className="font-bold">Explainable Factor Trace:</span> {evidenceCandidate.confidenceReason || 'Standard verification criteria satisfied.'}
                </div>
              </div>

              {/* Source Evidence Citations */}
              <div>
                <div className="text-xs font-extrabold text-slate-900 mb-2 uppercase tracking-wider">Source Citations & Evidence</div>
                {evidenceCandidate.evidence && evidenceCandidate.evidence.length > 0 ? (
                  <div className="space-y-2.5">
                    {evidenceCandidate.evidence.map((ev, i) => (
                      <div key={i} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5 shadow-2xs">
                        <div className="font-extrabold text-slate-900 flex items-center justify-between">
                          <span>{ev.sourceName || 'Web Source'}</span>
                          <span className="text-[10px] uppercase font-bold text-gray-400">{ev.sourceType}</span>
                        </div>
                        <div className="text-[11px] text-gray-600">{ev.sourceTitle}</div>
                        {ev.sourceUrl && (
                          <a
                            href={ev.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-600 hover:underline flex items-center space-x-1 font-mono break-all"
                          >
                            <span>{ev.sourceUrl}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-slate-100">
                          <span>Reported: {formatCurrency(ev.reportedPrice)} / {ev.reportedUnit}</span>
                          <span>Tax: {ev.taxStatus || 'unknown'} • Freight: {ev.freightStatus || 'unknown'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-gray-500">
                    Primary source URL: <a href={evidenceCandidate.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-mono">{evidenceCandidate.sourceUrl}</a>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => setEvidenceCandidate(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                Close Evidence Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT & APPROVE (Phase 3.5) */}
      {/* ========================================================================= */}
      {editModalCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">Adjust & Approve Candidate Rate</h3>
              </div>
              <button onClick={() => setEditModalCandidate(null)} className="text-gray-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleConfirmEditAndApprove} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-extrabold text-slate-900">{editModalCandidate.materialName}</div>
                <div className="text-[10px] font-mono text-blue-700 uppercase">{editModalCandidate.materialCode}</div>
                <div className="text-gray-600">
                  AI Researched: <span className="font-bold text-slate-800">{formatCurrency(editModalCandidate.normalizedRate || editModalCandidate.sourcePrice)}</span> / {editModalCandidate.normalizedUnit}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Admin-Approved Rate (₹ per {editModalCandidate.normalizedUnit})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={editRateInput}
                  onChange={(e) => setEditRateInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:bg-white"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Original researched rate will be preserved in candidate record for auditing.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Approval Notes / Rationale</label>
                <textarea
                  rows="2"
                  value={editRateNotes}
                  onChange={(e) => setEditRateNotes(e.target.value)}
                  placeholder="e.g. Rounded down to local depot cash contract rate..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalCandidate(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-slate-900 text-white font-black text-xs shadow-sm transition-colors"
                >
                  {actionInProgress ? 'Saving...' : 'Approve Adjusted Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REJECT CANDIDATE (Phase 3.5) */}
      {/* ========================================================================= */}
      {rejectModalCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <h3 className="text-base font-extrabold text-slate-900">Reject Researched Candidate</h3>
              </div>
              <button onClick={() => setRejectModalCandidate(null)} className="text-gray-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <p className="text-xs text-gray-600">
                Rejecting this candidate will mark its status as <span className="font-bold text-red-700">rejected</span>. Production material rates will <span className="font-bold">NOT</span> be modified.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rejection Reason</label>
                <textarea
                  rows="3"
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                  placeholder="e.g. Unverified source citation, rate deviates significantly from verified depot invoices..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalCandidate(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-sm transition-colors"
                >
                  {actionInProgress ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}