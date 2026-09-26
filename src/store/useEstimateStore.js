import { useState, useEffect } from 'react';
import { INITIAL_PROJECT_STATE } from '../data/defaults';
import { calculateEstimation } from '../utils/calculator';
import { apiRequest } from '../utils/apiClient';

const STORAGE_KEY_ACTIVE = 'buildiqo_ai_active_project';
const STORAGE_KEY_SAVED = 'buildiqo_ai_saved_list';
const STORAGE_KEY_SETTINGS = 'buildiqo_ai_user_settings';
const STORAGE_KEY_AUTH = 'buildiqo_ai_auth_user';
const STORAGE_KEY_USERS = 'buildiqo_ai_registered_users';
const STORAGE_KEY_LEADS = 'buildiqo_ai_customer_leads';
const STORAGE_KEY_SUB = 'buildiqo_ai_active_subscription';
const STORAGE_KEY_PAYMENTS = 'buildiqo_ai_customer_payments';

export function getInitialPayments() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PAYMENTS);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return [];
}

export function getInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return INITIAL_PROJECT_STATE;
}

export function getSavedProjects() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SAVED);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return [];
}

export function getSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return {
    currency: 'INR',
    currencySymbol: '₹',
    currencyRate: 1.0,
    unitSystem: 'sqft',
  };
}

export function getAuthUser() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_AUTH);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return null;
}

export function getRegisteredUsers() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_USERS);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return [
    {
      id: 'usr_owner',
      name: 'Raja (Platform Owner)',
      email: 'admin@buildiqo.ai',
      phone: '+91 99000 11223',
      role: 'Platform Owner & Super Admin',
      firmName: 'Buildiqo.ai Platform HQ',
      isAdmin: true,
      hasSelectedPlan: true
    }
  ];
}

export function getInitialLeads() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LEADS);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return [];
}

export function getActiveSubscription() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SUB);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return {
    planId: 'free',
    name: 'Starter Plan',
    billingCycle: 'yearly',
    status: 'active',
    renewsAt: 'Never (Free Forever)',
    isPlanConfirmed: false
  };
}

let globalState = getInitialState();
let globalSaved = getSavedProjects();
let globalSettings = getSettings();
let globalAuth = getAuthUser();
let globalUsers = getRegisteredUsers();
let globalLeads = getInitialLeads();
let globalSub = getActiveSubscription();
let globalPayments = getInitialPayments();
let globalPricingRates = null;
let globalPricingStatus = localStorage.getItem('buildiqo_benchmark_mode') === 'true' ? 'BENCHMARK' : 'CHECKING';
let globalPricingScope = null;
let globalPricingSource = null;
let globalIsBenchmarkMode = localStorage.getItem('buildiqo_benchmark_mode') === 'true';
let globalIsSnapshotMode = false;
let globalActiveSnapshot = null;
let listeners = [];
let fetchRatesSeq = 0;

async function fetchApprovedRates(stateName) {
  if (globalIsSnapshotMode) {
    return false; // Preserve immutable historical snapshot rates
  }
  const currentSeq = ++fetchRatesSeq;
  try {
    const targetState = stateName || globalState.state || 'Karnataka';
    const res = await apiRequest(`/api/pricing/current?state=${encodeURIComponent(targetState)}`);
    if (currentSeq !== fetchRatesSeq) return false; // Discard stale response

    if (res.success && res.data && res.data.rates && Object.keys(res.data.rates).length > 0) {
      globalPricingRates = res.data.rates;
      globalPricingStatus = res.data.pricingStatus === 'APPROVED' ? 'APPROVED' : (res.data.pricingStatus || 'PARTIAL');
      globalPricingScope = res.data.pricingScope || 'STATE';
      globalPricingSource = res.data.pricingSource || 'APPROVED_STATE_RATE';
      notify();
      return true;
    } else {
      globalPricingRates = null;
      globalPricingStatus = globalIsBenchmarkMode ? 'BENCHMARK' : 'UNAVAILABLE';
      globalPricingScope = 'UNAVAILABLE';
      globalPricingSource = 'UNAVAILABLE';
      notify();
      return false;
    }
  } catch (err) {
    if (currentSeq !== fetchRatesSeq) return false;
    globalPricingRates = null;
    globalPricingStatus = globalIsBenchmarkMode ? 'BENCHMARK' : 'UNAVAILABLE';
    globalPricingScope = 'UNAVAILABLE';
    globalPricingSource = 'UNAVAILABLE';
    notify();
    return false;
  }
}

function notify() {
  listeners.forEach(fn => fn({ 
    state: globalState, 
    saved: globalSaved, 
    settings: globalSettings,
    auth: globalAuth,
    users: globalUsers,
    leads: globalLeads,
    subscription: globalSub,
    payments: globalPayments,
    pricingRates: globalPricingRates,
    pricingStatus: globalPricingStatus,
    pricingScope: globalPricingScope,
    pricingSource: globalPricingSource,
    isBenchmarkMode: globalIsBenchmarkMode,
    isSnapshotMode: globalIsSnapshotMode,
    activeSnapshot: globalActiveSnapshot
  }));
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(globalState));
    localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(globalSaved));
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(globalSettings));
    if (globalAuth) {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(globalAuth));
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    }
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(globalUsers));
    localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(globalLeads));
    localStorage.setItem(STORAGE_KEY_SUB, JSON.stringify(globalSub));
    localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(globalPayments));
  } catch (e) {}
}

export function useEstimateStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    listeners.push(handler);
    return () => {
      listeners = listeners.filter(l => l !== handler);
    };
  }, []);

  // Sync with backend on component mount
  useEffect(() => {
    const syncWithBackend = async () => {
      // Always fetch approved live state rates, including for unauthenticated / guest visitors
      try {
        await fetchApprovedRates(globalState.state || 'Karnataka');
      } catch (err) {
        globalPricingStatus = globalIsBenchmarkMode ? 'BENCHMARK' : 'UNAVAILABLE';
        notify();
      }

      const token = localStorage.getItem('buildiqo_token');
      if (!token) return;

      try {
        const meRes = await apiRequest('/api/auth/me');
        if (meRes.success && meRes.user) {
          globalAuth = meRes.user;
          if (meRes.subscription) {
            globalSub = meRes.subscription;
          }
          notify();
        }

        // Fetch projects
        const projRes = await apiRequest('/api/projects');
        if (projRes.success && Array.isArray(projRes.projects)) {
          const mapped = projRes.projects.map(p => ({
            id: p._id || p.id,
            name: p.name,
            state: p.state || p.stateSnapshot?.state || 'Karnataka',
            city: p.city,
            tier: p.tier,
            totalCost: p.totalCost,
            totalBua: p.totalBua,
            ratePerSqFt: p.ratePerSqFt,
            numFloors: p.numFloors,
            savedAt: p.createdAt || p.updatedAt,
            stateSnapshot: p.stateSnapshot,
            pricingSnapshot: p.pricingSnapshot
          }));
          if (mapped.length > 0) {
            globalSaved = mapped;
            notify();
          }
        }

        // Fetch payments
        const payRes = await apiRequest('/api/payments');
        if (payRes.success && Array.isArray(payRes.payments)) {
          globalPayments = payRes.payments.map(p => ({
            ...p,
            id: p._id || p.id
          }));
          notify();
        }

        // Fetch leads if admin
        if (globalAuth?.isAdmin) {
          const leadRes = await apiRequest('/api/leads');
          if (leadRes.success && Array.isArray(leadRes.leads)) {
            globalLeads = leadRes.leads.map(l => ({
              ...l,
              id: l._id || l.id
            }));
            notify();
          }
        }
      } catch (err) {
        // Continue smoothly on network/local offline
      }
    };

    syncWithBackend();
  }, []);

  const estimation = calculateEstimation(globalState, {
    rates: globalPricingRates,
    isBenchmark: globalIsBenchmarkMode,
    isSnapshot: globalIsSnapshotMode,
    snapshot: globalActiveSnapshot,
    pricingScope: globalPricingScope,
    pricingSource: globalPricingSource
  });

  const updateState = (updater) => {
    const prevState = globalState;
    if (typeof updater === 'function') {
      globalState = updater(globalState);
    } else {
      globalState = { ...globalState, ...updater };
    }
    notify();

    // If state changed and not in snapshot mode, fetch new state's approved rates
    const stateChanged = (globalState.state && globalState.state !== prevState.state) ||
      (!globalState.state && globalState.city !== prevState.city);

    if (stateChanged && !globalIsSnapshotMode && !globalIsBenchmarkMode) {
      fetchApprovedRates(globalState.state || globalState.city);
    }
  };

  const updateSettings = (newSettings) => {
    globalSettings = { ...globalSettings, ...newSettings };
    notify();
  };

  // Auth Methods
  const login = async (emailOrPhone, password) => {
    try {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ emailOrPhone, password })
      });

      if (res.success && res.token) {
        localStorage.setItem('buildiqo_token', res.token);
        globalAuth = res.user;
        if (res.subscription) {
          globalSub = res.subscription;
        }
        notify();
        // Fetch approved rates for current user session
        fetchApprovedRates(globalState.state || 'Karnataka');
        return { success: true, user: res.user };
      }
      return { success: false, error: res.error || 'Invalid credentials' };
    } catch (err) {
      return { success: false, error: err.message || 'Invalid email/phone or password.' };
    }
  };

  const register = async (userData) => {
    try {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      if (res.success && res.token) {
        localStorage.setItem('buildiqo_token', res.token);
        globalAuth = res.user;
        if (res.subscription) {
          globalSub = res.subscription;
        }
        notify();
        return { success: true, user: res.user };
      }
    } catch (err) {
      // Offline fallback: save locally
      const existing = globalUsers.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
      if (existing) {
        return { success: false, error: 'An account with this email address already exists. Please sign in instead.' };
      }

      const newUser = {
        id: `usr_${Date.now()}`,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '+91 99999 88888',
        role: userData.role || 'Homeowner / Individual Builder',
        firmName: userData.firmName || '',
        password: userData.password,
        avatar: userData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
        isAdmin: false,
        hasSelectedPlan: false
      };

      globalUsers = [...globalUsers, newUser];
      globalAuth = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        firmName: newUser.firmName,
        avatar: newUser.avatar,
        isAdmin: false,
        hasSelectedPlan: false
      };
      globalSub = {
        ...globalSub,
        isPlanConfirmed: false
      };
      notify();
      return { success: true, user: globalAuth };
    }
  };

  const loginAsGuest = async () => {
    try {
      const res = await apiRequest('/api/auth/guest', {
        method: 'POST'
      });

      if (res && res.success && res.token) {
        localStorage.setItem('buildiqo_token', res.token);
        globalAuth = res.user;
        if (res.subscription) {
          globalSub = res.subscription;
        }
        notify();
        return { success: true, user: res.user };
      }
    } catch (e) {
      console.warn('Backend guest auth unavailable, using local guest fallback:', e.message);
    }

    const guestUser = {
      id: 'usr_guest',
      name: 'Guest Builder',
      email: 'guest@buildiqo.ai',
      phone: '+91 Guest',
      role: 'Architect / Builder',
      firmName: '',
      avatar: 'GB',
      isGuest: true,
      isAdmin: false,
      hasSelectedPlan: true
    };
    globalAuth = guestUser;
    globalSub = {
      planId: 'pro',
      name: 'Professional (Guest Preview)',
      billingCycle: 'monthly',
      status: 'active',
      renewsAt: 'Active Demo',
      isPlanConfirmed: true
    };
    notify();
    return { success: true, user: guestUser };
  };


  const logout = () => {
    localStorage.removeItem('buildiqo_token');
    globalAuth = null;
    globalSub = {
      ...globalSub,
      isPlanConfirmed: false
    };
    notify();
  };

  const captureCustomerLead = async (leadData = {}) => {
    const newLead = {
      id: `lead_${Date.now().toString().slice(-6)}`,
      customerName: leadData.name || globalAuth?.name || 'Customer (' + (globalState.projectName || 'New Project') + ')',
      email: leadData.email || globalAuth?.email || 'customer@buildiqo.ai',
      phone: leadData.phone || globalAuth?.phone || '+91 98' + Math.floor(10000000 + Math.random() * 90000000),
      projectTitle: globalState.projectName || 'My Dream Residence',
      city: estimation.city?.name || 'Bengaluru',
      plotDimensions: `${globalState.plotWidth} × ${globalState.plotLength} ft (${globalState.plotWidth * globalState.plotLength} sq.ft)`,
      builtupArea: estimation.totalBuiltupArea,
      tier: (globalState.tier || 'standard').toUpperCase() + ' PACKAGE',
      estimatedBudget: estimation.grandTotalCost,
      pdfDownloaded: true,
      status: 'New Inquiry',
      submittedAt: new Date().toISOString(),
      notes: leadData.notes || 'Customer downloaded formal QS BOQ PDF Report.'
    };

    globalLeads = [newLead, ...globalLeads];
    notify();

    try {
      await apiRequest('/api/leads', {
        method: 'POST',
        body: JSON.stringify(newLead)
      });
    } catch (e) {}

    return newLead;
  };

  const updateLeadStatus = async (leadId, newStatus) => {
    globalLeads = globalLeads.map(l => l.id === leadId ? { ...l, status: newStatus } : l);
    notify();

    try {
      await apiRequest(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {}
  };

  const deleteLead = async (leadId) => {
    globalLeads = globalLeads.filter(l => l.id !== leadId);
    notify();

    try {
      await apiRequest(`/api/leads/${leadId}`, {
        method: 'DELETE'
      });
    } catch (e) {}
  };

  const updateSubscription = async (planId, billingCycle = 'yearly') => {
    const planNames = {
      free: 'FREE Plan (₹0/mo)',
      pro: 'Professional Plan (₹4,999/mo)',
      pro_ai: 'Pro AI Plan (₹8,999/mo)',
      enterprise: 'Enterprise Plan'
    };
    globalSub = {
      planId,
      name: planNames[planId] || 'Professional Plan',
      billingCycle,
      status: 'active',
      renewsAt: billingCycle === 'yearly' ? 'September 1, 2027' : 'October 1, 2026',
      isPlanConfirmed: true
    };
    if (globalAuth) {
      globalAuth = { ...globalAuth, hasSelectedPlan: true };
    }
    notify();

    try {
      await apiRequest('/api/subscriptions/me', {
        method: 'PATCH',
        body: JSON.stringify({ planId, billingCycle })
      });
    } catch (e) {}
  };

  const submitPayment = async ({ planId, planName, amount, screenshotUrl, screenshotFile, notes }) => {
    let savedScreenshotUrl = screenshotUrl || '/payment-qr.jpg';

    // If real file, upload via FormData to backend
    if (screenshotFile) {
      try {
        const formData = new FormData();
        formData.append('screenshot', screenshotFile);
        formData.append('planId', planId || 'pro');
        formData.append('planName', planName || 'Professional Plan');
        formData.append('amount', amount || '₹4,999');
        formData.append('notes', notes || '');

        const res = await apiRequest('/api/payments', {
          method: 'POST',
          body: formData
        });

        if (res.success && res.payment) {
          const newPayment = { ...res.payment, id: res.payment._id || res.payment.id };
          globalPayments = [newPayment, ...globalPayments];
          globalSub = {
            ...globalSub,
            planId: newPayment.planId,
            name: newPayment.planName,
            paymentStatus: 'pending',
            isPlanConfirmed: false,
            pendingPayment: newPayment
          };
          notify();
          return newPayment;
        }
      } catch (e) {
        console.warn('Backend payment submission failed, falling back to local:', e.message);
      }
    }

    // Local fallback
    const newPayment = {
      id: `pay_${Date.now()}`,
      userId: globalAuth?.id || 'usr_guest',
      userName: globalAuth?.name || 'Valued Customer',
      userEmail: globalAuth?.email || 'customer@buildiqo.ai',
      userPhone: globalAuth?.phone || '+91 99999 88888',
      planId: planId || 'pro',
      planName: planName || (planId === 'pro_ai' ? 'Pro AI Plan (₹8,999/mo)' : 'Professional Plan (₹4,999/mo)'),
      amount: amount || (planId === 'pro_ai' ? '₹8,999' : '₹4,999'),
      screenshotUrl: savedScreenshotUrl,
      upiId: '8095586121@ybl',
      status: 'pending',
      submittedAt: new Date().toISOString(),
      notes: notes || 'UPI payment screenshot attached by customer.'
    };

    globalPayments = [newPayment, ...globalPayments];
    globalSub = {
      ...globalSub,
      planId: newPayment.planId,
      name: newPayment.planName,
      paymentStatus: 'pending',
      isPlanConfirmed: false,
      pendingPayment: newPayment
    };
    notify();
    return newPayment;
  };

  const approvePayment = async (paymentId) => {
    let approvedPayment = null;

    globalPayments = globalPayments.map(p => {
      if (p.id === paymentId || p._id === paymentId) {
        approvedPayment = { ...p, status: 'approved', approvedAt: new Date().toISOString() };
        return approvedPayment;
      }
      return p;
    });

    if (approvedPayment) {
      if (globalSub?.pendingPayment?.id === paymentId || globalSub?.pendingPayment?._id === paymentId || globalAuth?.id === approvedPayment.userId || !globalAuth?.isAdmin) {
        globalSub = {
          ...globalSub,
          planId: approvedPayment.planId,
          name: approvedPayment.planName,
          status: 'active',
          paymentStatus: 'approved',
          isPlanConfirmed: true,
          pendingPayment: null
        };
        if (globalAuth) {
          globalAuth = { ...globalAuth, hasSelectedPlan: true };
        }
      }

      if (approvedPayment.userId) {
        globalUsers = globalUsers.map(u => (u.id === approvedPayment.userId || u._id === approvedPayment.userId) ? { ...u, hasSelectedPlan: true } : u);
      }
    }

    notify();

    try {
      await apiRequest(`/api/payments/${paymentId}/approve`, {
        method: 'PATCH'
      });
    } catch (e) {}
  };

  const rejectPayment = async (paymentId, reason = 'Screenshot verification unsuccessful. Please re-upload or contact support.') => {
    globalPayments = globalPayments.map(p => {
      if (p.id === paymentId || p._id === paymentId) {
        return { ...p, status: 'rejected', rejectionReason: reason, rejectedAt: new Date().toISOString() };
      }
      return p;
    });

    if (globalSub?.pendingPayment?.id === paymentId || globalSub?.pendingPayment?._id === paymentId) {
      globalSub = {
        ...globalSub,
        paymentStatus: 'rejected',
        rejectionReason: reason
      };
    }
    notify();

    try {
      await apiRequest(`/api/payments/${paymentId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason })
      });
    } catch (e) {}
  };

  const cancelPendingPayment = () => {
    globalSub = {
      ...globalSub,
      paymentStatus: 'none',
      pendingPayment: null
    };
    notify();
  };

  const toggleBenchmarkMode = (enabled) => {
    globalIsBenchmarkMode = Boolean(enabled);
    localStorage.setItem('buildiqo_benchmark_mode', enabled ? 'true' : 'false');
    if (enabled) {
      globalPricingStatus = 'BENCHMARK';
    } else {
      globalPricingStatus = 'CHECKING';
      if (!globalIsSnapshotMode) {
        fetchApprovedRates(globalState.city);
      }
    }
    notify();
  };

  const saveCurrentProject = async (customName) => {
    const name = customName || globalState.projectName || 'My Home Estimation';
    const updatedState = { ...globalState, projectName: name };
    globalState = updatedState;
    
    const existingIndex = globalSaved.findIndex(p => p.id === globalState.id);
    const summary = {
      id: globalState.id || `proj_${Date.now()}`,
      name,
      state: globalState.state || 'Karnataka',
      city: globalState.city,
      tier: globalState.tier,
      totalCost: estimation.grandTotalCost,
      totalBua: estimation.totalBuiltupArea,
      ratePerSqFt: estimation.costPerSqFt,
      numFloors: globalState.numFloors,
      savedAt: new Date().toISOString(),
      stateSnapshot: JSON.parse(JSON.stringify(globalState)),
      pricingSnapshot: globalActiveSnapshot || null
    };

    if (existingIndex >= 0) {
      globalSaved[existingIndex] = summary;
    } else {
      summary.id = globalState.id || summary.id;
      globalState.id = summary.id;
      globalSaved = [summary, ...globalSaved];
    }
    notify();

    try {
      const res = await apiRequest('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          id: summary.id,
          name: summary.name,
          state: summary.state,
          city: summary.city,
          tier: summary.tier,
          numFloors: summary.numFloors,
          totalCost: summary.totalCost,
          totalBua: summary.totalBua,
          ratePerSqFt: summary.ratePerSqFt,
          stateSnapshot: summary.stateSnapshot,
          isBenchmarkMode: globalIsBenchmarkMode,
          benchmarkRates: globalPricingRates
        })
      });
      if (res.success && res.project) {
        summary.id = res.project._id || res.project.id;
        summary.pricingSnapshot = res.project.pricingSnapshot;
        globalState.id = summary.id;
        globalActiveSnapshot = res.project.pricingSnapshot;
        globalIsSnapshotMode = true;
        if (res.project.pricingSnapshot?.materialRates || res.project.pricingSnapshot?.rates) {
          globalPricingRates = res.project.pricingSnapshot.materialRates || res.project.pricingSnapshot.rates;
        }
        globalPricingStatus = 'SNAPSHOT_HISTORICAL';
        notify();
      }
    } catch (e) {}

    return summary;
  };

  const loadProject = (projectId) => {
    const found = globalSaved.find(p => p.id === projectId || p._id === projectId);
    if (found && found.stateSnapshot) {
      globalState = JSON.parse(JSON.stringify(found.stateSnapshot));
      if (found.pricingSnapshot) {
        globalActiveSnapshot = found.pricingSnapshot;
        globalPricingRates = found.pricingSnapshot.materialRates || found.pricingSnapshot.rates;
        globalIsSnapshotMode = true;
        globalIsBenchmarkMode = Boolean(found.pricingSnapshot.isBenchmark);
        globalPricingStatus = 'SNAPSHOT_HISTORICAL';
      } else {
        globalActiveSnapshot = null;
        globalIsSnapshotMode = false;
        fetchApprovedRates(globalState.state || 'Karnataka');
      }
      notify();
      return true;
    }
    return false;
  };

  const deleteProject = async (projectId) => {
    globalSaved = globalSaved.filter(p => p.id !== projectId && p._id !== projectId);
    notify();

    try {
      await apiRequest(`/api/projects/${projectId}`, {
        method: 'DELETE'
      });
    } catch (e) {}
  };

  const resetToNewProject = () => {
    globalActiveSnapshot = null;
    globalIsSnapshotMode = false;
    globalPricingStatus = globalIsBenchmarkMode ? 'BENCHMARK' : 'CHECKING';
    globalState = {
      ...INITIAL_PROJECT_STATE,
      id: `proj_${Date.now()}`,
      projectName: 'New Construction Project'
    };
    if (!globalIsBenchmarkMode) {
      fetchApprovedRates(INITIAL_PROJECT_STATE.state || 'Karnataka');
    }
    notify();
  };

  return {
    state: globalState,
    savedProjects: globalSaved,
    settings: globalSettings,
    currentUser: globalAuth,
    registeredUsers: globalUsers,
    leads: globalLeads,
    subscription: globalSub,
    estimation,
    updateState,
    updateSettings,
    login,
    register,
    loginAsGuest,
    logout,
    captureCustomerLead,
    updateLeadStatus,
    deleteLead,
    updateSubscription,
    payments: globalPayments,
    submitPayment,
    approvePayment,
    rejectPayment,
    cancelPendingPayment,
    saveCurrentProject,
    loadProject,
    deleteProject,
    resetToNewProject,
    pricingRates: globalPricingRates,
    pricingStatus: globalPricingStatus,
    pricingScope: globalPricingScope,
    pricingSource: globalPricingSource,
    isBenchmarkMode: globalIsBenchmarkMode,
    isSnapshotMode: globalIsSnapshotMode,
    activeSnapshot: globalActiveSnapshot,
    toggleBenchmarkMode,
    fetchApprovedRates
  };
}

export function formatCurrency(amount, currency = 'INR', currencySymbol = '₹') {
  if (typeof amount !== 'number' || isNaN(amount)) return `${currencySymbol}0`;
  
  if (amount >= 10000000) {
    const cr = (amount / 10000000).toFixed(2);
    return `${currencySymbol}${cr} Cr`;
  }
  if (amount >= 100000) {
    const l = (amount / 100000).toFixed(2);
    return `${currencySymbol}${l} L`;
  }
  return `${currencySymbol}${amount.toLocaleString('en-IN')}`;
}

export function formatNumber(num) {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  return num.toLocaleString('en-IN');
}
