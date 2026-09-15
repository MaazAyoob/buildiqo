import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Check, 
  Sparkles,
  HardHat,
  Briefcase
} from 'lucide-react';
import { useEstimateStore } from '../store/useEstimateStore';

export function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const { login, register, loginAsGuest } = useEstimateStore();

  // Login inputs
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register inputs
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState('Architect / Structural Designer');
  const [regFirmName, setRegFirmName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Admin Access Modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  // Status & Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [showRegisterSuccess, setShowRegisterSuccess] = useState(false);

  // Check if current selected role requires Firm Name
  const isFirmRequiredRole = (role) => {
    return (
      role === 'Architect / Structural Designer' ||
      role === 'Civil Contractor / Builder' ||
      role === 'Interior Designer / Decorator'
    );
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const res = await login(loginIdentifier, loginPassword);
    if (res.success) {
      if (onAuthSuccess) onAuthSuccess(res.user);
    } else {
      setErrorMsg(res.error || 'Invalid credentials. Please check and try again.');
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (isFirmRequiredRole(regRole) && !regFirmName.trim()) {
      setErrorMsg(`Please enter your Firm / Company Name for ${regRole}.`);
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('Please accept the Terms of Service to continue.');
      return;
    }

    const res = register({
      name: regName,
      email: regEmail,
      phone: regPhone,
      role: regRole,
      firmName: isFirmRequiredRole(regRole) ? regFirmName.trim() : '',
      password: regPassword
    });

    if (res.success) {
      setShowRegisterSuccess(true);
      setTimeout(() => {
        if (onAuthSuccess) onAuthSuccess(res.user);
      }, 1500);
    } else {
      setErrorMsg(res.error || 'Registration failed. Please try again.');
    }
  };

  const handleQuickDemo = (roleType) => {
    setErrorMsg('');
    if (roleType === 'architect') {
      setLoginIdentifier('rahul.architect@buildiqo.ai');
      setLoginPassword('password123');
      const res = login('rahul.architect@buildiqo.ai', 'password123');
      if (res.success && onAuthSuccess) onAuthSuccess(res.user);
    } else if (roleType === 'homeowner') {
      setLoginIdentifier('priya.patel@gmail.com');
      setLoginPassword('password123');
      const res = login('priya.patel@gmail.com', 'password123');
      if (res.success && onAuthSuccess) onAuthSuccess(res.user);
    }
  };

  const handleGuestEntry = () => {
    const res = loginAsGuest();
    if (res.success && onAuthSuccess) onAuthSuccess(res.user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50 selection:bg-blue-600 selection:text-white">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Brand Value Proposition (5 cols) */}
        <div className="lg:col-span-5 space-y-6 text-left">
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="font-black text-xl tracking-tight text-slate-900">Buildiqo<span className="text-blue-600">.ai</span></span>
                <span className="ml-1.5 text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  QS Engine
                </span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Engineering clarity for residential construction.
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Deterministic IS 456 quantities of steel rebar, structural cement, trade labor, 3D top view model, and formal BOQ schedule.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center space-x-2.5 text-xs text-slate-700 font-bold">
              <div className="w-5 h-5 rounded-md bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 border border-blue-200">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>Deterministic IS 456 & IS 1786 Quantity Takeoff</span>
            </div>
            <div className="flex items-center space-x-2.5 text-xs text-slate-700 font-bold">
              <div className="w-5 h-5 rounded-md bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 border border-blue-200">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>Interactive 3D & Top Plan View Layout Model</span>
            </div>
            <div className="flex items-center space-x-2.5 text-xs text-slate-700 font-bold">
              <div className="w-5 h-5 rounded-md bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 border border-blue-200">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>Real-Time Regional Material Procurement Rates</span>
            </div>
            <div className="flex items-center space-x-2.5 text-xs text-slate-700 font-bold">
              <div className="w-5 h-5 rounded-md bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 border border-blue-200">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>Milestone Cashflow Disbursement Schedule</span>
            </div>
          </div>

          {/* Trust Stat Strip */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between text-xs">
            <div>
              <span className="font-black text-slate-950 text-sm block">12,400+</span>
              <span className="text-[10px] text-slate-500 font-semibold">Homes Estimated</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="font-black text-blue-600 text-sm block">₹450 Cr+</span>
              <span className="text-[10px] text-slate-500 font-semibold">Tender Volume</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="font-black text-green-700 text-sm block">±3.5%</span>
              <span className="text-[10px] text-slate-500 font-semibold">Tender Accuracy</span>
            </div>
          </div>

        </div>

        {/* Right Side: Auth Card (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 text-left">
          
          {/* Auth Mode Toggle Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => { setMode('login'); setErrorMsg(''); }}
              className={`py-2.5 rounded-xl transition-all ${
                mode === 'login' 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In to Account
            </button>
            <button
              onClick={() => { setMode('register'); setErrorMsg(''); }}
              className={`py-2.5 rounded-xl transition-all ${
                mode === 'register' 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Free Account
            </button>
          </div>

          {/* Error Message Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-2 text-xs text-red-700 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fadeIn">
              
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1.5 flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Email Address or Mobile Number</span>
                </label>
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. rahul.architect@buildiqo.ai or +91 98765 43210"
                  className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Password</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Demo accounts: Password is "password123"')}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-bold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-600"
                  />
                  <span>Keep me signed in on this device</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-slate-900 text-white font-extrabold text-xs hover:bg-slate-800 shadow-md flex items-center justify-center space-x-2 group transition-all"
              >
                <span>Sign In & Open Workspace</span>
                <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Quick Demo Login Shortcuts */}
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block text-center">
                  Instant One-Click Demo Access
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('architect')}
                    className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-left transition-colors"
                  >
                    <span className="text-xs font-black text-slate-900 block">Ar. Rahul Sharma</span>
                    <span className="text-[10px] text-blue-800 font-semibold block truncate">Studio Vista Architects</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('homeowner')}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors"
                  >
                    <span className="text-xs font-black text-slate-900 block">Priya Patel</span>
                    <span className="text-[10px] text-slate-600 font-semibold">Homeowner Profile</span>
                  </button>
                </div>
              </div>

            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 animate-fadeIn">
              
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Full Name *</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Vikramaditya Reddy"
                    className="w-full pl-9 pr-3.5 py-2 text-xs font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1 block">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="vikram@example.com"
                      className="w-full pl-9 pr-3.5 py-2 text-xs font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1 block">Mobile Number (+91)</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3.5 py-2 text-xs font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                    />
                  </div>
                </div>
              </div>

              {/* Primary Role Selector */}
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1 block">Primary Role *</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="Architect / Structural Designer">Architect / Structural Designer</option>
                  <option value="Civil Contractor / Builder">Civil Contractor / Builder</option>
                  <option value="Interior Designer / Decorator">Interior Designer / Decorator</option>
                  <option value="Homeowner / Individual Builder">Homeowner / Individual Builder</option>
                </select>
              </div>

              {/* CONDITIONAL FIRM NAME FIELD: Only for Architect, Civil Contractor, and Interior Designer */}
              {isFirmRequiredRole(regRole) && (
                <div className="animate-fadeIn p-3 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-1">
                  <label className="text-xs font-extrabold text-blue-950 flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Firm / Company / Practice Name *</span>
                  </label>
                  <input
                    type="text"
                    value={regFirmName}
                    onChange={(e) => setRegFirmName(e.target.value)}
                    placeholder={
                      regRole === 'Architect / Structural Designer'
                        ? 'e.g. Studio Vista Architecture & Design'
                        : regRole === 'Civil Contractor / Builder'
                        ? 'e.g. Apex Civil Infra & Turnkey Projects'
                        : 'e.g. Luxe Living Interior Studio'
                    }
                    className="w-full px-3.5 py-2 text-xs font-bold text-slate-900 rounded-xl border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white shadow-2xs"
                    required
                  />
                  <span className="text-[10px] text-blue-700 font-medium block">
                    This firm name will appear on your customized BOQ schedules and architectural takeoffs.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1 block">Create Password *</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 text-xs font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1 block">Confirm Password *</label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3 py-2 text-xs font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                    required
                  />
                </div>
              </div>

              <label className="flex items-start space-x-2 text-[11px] text-slate-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-600 mt-0.5"
                />
                <span>I agree to the Buildiqo.ai Terms of Service and Privacy Policy.</span>
              </label>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-slate-900 text-white font-extrabold text-xs hover:bg-slate-800 shadow-md flex items-center justify-center space-x-2 group transition-all"
              >
                <span>Create Account & Choose Plan</span>
                <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
              </button>

            </form>
          )}

          {/* Guest Access Option & Secure Admin Portal Link */}
          <div className="pt-2 text-center space-y-2">
            <button
              onClick={handleGuestEntry}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 inline-flex items-center space-x-1 transition-colors"
            >
              <span>Or Explore as Guest (No Registration Needed) →</span>
            </button>
            <div>
              <button
                type="button"
                onClick={() => { setShowAdminModal(true); setAdminError(''); setAdminPasscode(''); }}
                className="text-[11px] text-slate-400 hover:text-blue-600 font-bold flex items-center justify-center space-x-1 mx-auto transition-colors"
              >
                <Lock className="w-3 h-3 text-slate-400" />
                <span>🔒 Authorized Admin & Owner Portal</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Secure Admin Passcode Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-fadeIn text-left">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Website Owner & Admin Authentication</h3>
                  <span className="text-[10px] text-slate-500 font-semibold">Protected Master Access</span>
                </div>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This portal is restricted to authorized platform administrators. Please authenticate with your <strong>Administrator Credentials</strong>.
            </p>

            {adminError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{adminError}</span>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setAdminError('');
                const res = await login(adminEmail, adminPassword);
                if (res.success) {
                  if (res.user && res.user.isAdmin) {
                    setShowAdminModal(false);
                    if (onAuthSuccess) onAuthSuccess(res.user);
                  } else {
                    setAdminError('Access Denied: This account does not have administrator privileges.');
                  }
                } else {
                  setAdminError(res.error || 'Invalid administrator email or password.');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1.5 block">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@buildiqo.ai"
                  className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 mb-1.5 block">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter administrator password..."
                  className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50"
                  required
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-md flex items-center justify-center space-x-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Verify & Unlock</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Registration Success Modal */}
      {showRegisterSuccess && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 animate-fadeIn border border-slate-200 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-700 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">Account Created Successfully!</h3>
            <p className="text-xs text-slate-600">
              Welcome to Buildiqo.ai. Taking you to the subscription plan selection...
            </p>
          </div>
        </div>
      )}

    </div>
  );
}