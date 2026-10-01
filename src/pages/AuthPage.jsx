import React, { useState, useEffect } from 'react';
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
  Compass,
  FileSpreadsheet,
  Layers,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useEstimateStore } from '../store/useEstimateStore';
import { BuildiqoLogo } from '../components/common/BuildiqoLogo';

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
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Admin Access Modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  // Status & Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [showRegisterSuccess, setShowRegisterSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Discrete Admin Portal access via #admin hash or Ctrl+Alt+A keyboard shortcut
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#admin' || window.location.hash === '#owner') {
        setShowAdminModal(true);
      }
      const handleKeyDown = (e) => {
        if (e.ctrlKey && e.altKey && (e.key === 'a' || e.key === 'A')) {
          setShowAdminModal(true);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

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
    setIsLoading(true);
    try {
      const res = await login(loginIdentifier, loginPassword);
      if (res.success) {
        if (onAuthSuccess) onAuthSuccess(res.user);
      } else {
        setErrorMsg(res.error || 'Invalid credentials. Please check your email and password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
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

    setIsLoading(true);
    try {
      const res = await register({
        name: regName,
        email: regEmail,
        phone: regPhone,
        role: regRole,
        firmName: isFirmRequiredRole(regRole) ? regFirmName.trim() : '',
        password: regPassword
      });

      if (res && res.success) {
        setShowRegisterSuccess(true);
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(res.user);
        }, 1200);
      } else {
        setErrorMsg(res?.error || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (roleType) => {
    setErrorMsg('');
    const targetEmail = roleType === 'architect' ? 'rahul.architect@buildiqo.ai' : 'priya.patel@gmail.com';
    setLoginIdentifier(targetEmail);
    setLoginPassword('password123');

    setIsLoading(true);
    try {
      let res = await login(targetEmail, 'password123');
      if (!res || !res.success) {
        res = await loginAsGuest();
      }

      if (res && res.success && onAuthSuccess) {
        onAuthSuccess(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestEntry = async () => {
    setIsLoading(true);
    try {
      const res = await loginAsGuest();
      if (res && res.success && onAuthSuccess) {
        onAuthSuccess(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-slate-50 selection:bg-blue-600 selection:text-white">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Brand Visual Identity (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950 text-white p-7 sm:p-9 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between space-y-6 text-left relative overflow-hidden">
          <div className="space-y-6">
            
            {/* Official Logo (Dark Theme Variant) */}
            <div className="pt-1">
              <BuildiqoLogo 
                variant="full" 
                theme="dark" 
                className="h-12 w-auto max-w-full drop-shadow-sm" 
              />
            </div>

            <div className="space-y-2.5">
              <span className="badge-amber">
                ✦ IS 456 STANDARDS ENGINE
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                Deterministic construction intelligence for professionals.
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Physical quantities of structural steel rebar, cement bags, sand, masonry blocks, 3D architectural massing, and client-ready BOQ schedules.
              </p>
            </div>

            {/* Feature Checkpoints */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2.5 text-xs text-slate-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Deterministic IS 456 &amp; IS 1786 Quantity Takeoff</span>
              </div>
              <div className="flex items-center space-x-2.5 text-xs text-slate-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>AI Architectural Floor Plan Studio &amp; CAD Export</span>
              </div>
              <div className="flex items-center space-x-2.5 text-xs text-slate-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Regional Material Rates (Bengaluru, Mumbai, Delhi, etc.)</span>
              </div>
              <div className="flex items-center space-x-2.5 text-xs text-slate-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>6-Stage Milestone Cashflow Release Schedule</span>
              </div>
            </div>

          </div>

          {/* Bottom Trust Stat Bar */}
          <div className="pt-6 border-t border-slate-800/90 grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="font-mono text-base font-black text-white block">12,400+</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Estimates</span>
            </div>
            <div className="border-x border-slate-800">
              <span className="font-mono text-base font-black text-blue-400 block">₹450 Cr+</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Tracked</span>
            </div>
            <div>
              <span className="font-mono text-base font-black text-emerald-400 block">±3.5%</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Accuracy</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card (7 cols) */}
        <div className="lg:col-span-7 card-architect p-6 sm:p-9 border-slate-200/90 shadow-xl space-y-6 text-left flex flex-col justify-between">
          <div className="space-y-5">
            
            {/* Auth Mode Toggle Segmented Control */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); }}
                className={`py-2 rounded-lg transition-all ${
                  mode === 'login' 
                    ? 'bg-white text-slate-900 shadow-2xs font-extrabold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In to Account
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMsg(''); }}
                className={`py-2 rounded-lg transition-all ${
                  mode === 'register' 
                    ? 'bg-white text-slate-900 shadow-2xs font-extrabold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Create Account
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
                    className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
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
                      onClick={() => alert('Demo account password: "password123"')}
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
                      className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      aria-label="Toggle password visibility"
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
                  disabled={isLoading}
                  className="w-full btn-brand-primary py-3 text-xs shadow-brand hover:shadow-brand-hover active:scale-[0.98]"
                >
                  <span>{isLoading ? 'Signing In...' : 'Sign In & Open Workspace'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Quick Demo Access Shortcuts */}
                <div className="pt-4 border-t border-slate-200/80 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block text-center">
                    Instant One-Click Demo Access
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDemo('architect')}
                      className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-left transition-colors"
                    >
                      <span className="text-xs font-bold text-slate-900 block truncate">Ar. Rahul Sharma</span>
                      <span className="text-[10px] text-blue-800 font-semibold block truncate">Studio Vista Architects</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemo('homeowner')}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors"
                    >
                      <span className="text-xs font-bold text-slate-900 block truncate">Priya Patel</span>
                      <span className="text-[10px] text-slate-600 font-semibold block truncate">Homeowner Profile</span>
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
                      className="w-full pl-9 pr-3.5 py-2 text-xs font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
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
                        className="w-full pl-9 pr-3.5 py-2 text-xs font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
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
                        className="w-full pl-9 pr-3.5 py-2 text-xs font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Primary Role Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1 block">Primary Profession / Role *</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="Architect / Structural Designer">Architect / Structural Designer</option>
                    <option value="Civil Contractor / Builder">Civil Contractor / Builder</option>
                    <option value="Interior Designer / Decorator">Interior Designer / Decorator</option>
                    <option value="Homeowner / Individual Builder">Homeowner / Individual Builder</option>
                  </select>
                </div>

                {/* Conditional Firm Name */}
                {isFirmRequiredRole(regRole) && (
                  <div className="animate-fadeIn p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1">
                    <label className="text-xs font-bold text-blue-950 flex items-center space-x-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Firm / Studio / Practice Name *</span>
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
                      className="w-full px-3.5 py-2 text-xs font-semibold text-slate-900 rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                      required
                    />
                    <span className="text-[10px] text-blue-700 block">
                      This firm name will appear on your generated BOQ schedules and architectural exports.
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 mb-1 block">Create Password *</label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-3 py-2 text-xs font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white pr-8"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                        aria-label="Toggle password"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 mb-1 block">Confirm Password *</label>
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
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
                  <span>I agree to Buildiqo.ai Terms of Service and Privacy Policy.</span>
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-brand-primary py-3 text-xs shadow-brand hover:shadow-brand-hover active:scale-[0.98]"
                >
                  <span>{isLoading ? 'Creating Account...' : 'Create Account & Choose Plan'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

              </form>
            )}

          </div>

          {/* Guest Access Option */}
          <div className="pt-3 text-center border-t border-slate-100">
            <button
              type="button"
              onClick={handleGuestEntry}
              className="text-xs font-bold text-slate-500 hover:text-blue-600 inline-flex items-center space-x-1.5 transition-colors group"
            >
              <span>Explore as Guest (Instant Preview Workspace)</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

        </div>

      </div>

      {/* Discrete Admin Credentials Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-architect p-6 sm:p-8 max-w-md w-full border-slate-200 shadow-2xl space-y-5 animate-fadeIn text-left">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Administrator Access</h3>
                  <span className="text-[10px] text-slate-500 font-semibold">Protected Master Portal</span>
                </div>
              </div>
              <button
                type="button"
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
                  className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
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
                  className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  required
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl btn-brand-primary text-xs font-bold shadow-brand"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span>Verify &amp; Unlock</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Registration Success Feedback Modal */}
      {showRegisterSuccess && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-architect p-8 max-w-sm w-full text-center space-y-4 animate-fadeIn border-slate-200 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-xs">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="text-base font-black text-slate-900">Account Created Successfully!</h3>
            <p className="text-xs text-slate-600">
              Welcome to Buildiqo.ai. Connecting you to your engineering workspace...
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

export default AuthPage;