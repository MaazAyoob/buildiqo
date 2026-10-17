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
  FileCheck2,
  Sparkles,
  Calculator,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  Briefcase
} from 'lucide-react';
import { useEstimateStore } from '../store/useEstimateStore';
import { BuildiqoLogo } from '../components/common/BuildiqoLogo';

export function AuthPage({ onAuthSuccess, initialAdminModal = false }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const { login, register } = useEstimateStore();

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

  // Forgot password inputs
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Admin Access Modal
  const [showAdminModal, setShowAdminModal] = useState(
    initialAdminModal || 
    (typeof window !== 'undefined' && window.location.pathname.toLowerCase().startsWith('/admin'))
  );
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  // Status & Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [showRegisterSuccess, setShowRegisterSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Discrete Admin Portal access via /admin route or #admin hash or Ctrl+Alt+A keyboard shortcut
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (
        window.location.hash === '#admin' || 
        window.location.hash === '#owner' ||
        window.location.pathname.toLowerCase().startsWith('/admin')
      ) {
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

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }
    setErrorMsg('');
    setForgotSubmitted(true);
  };

  const handleQuickDemo = async (roleType) => {
    setErrorMsg('');
    const targetEmail = roleType === 'architect' ? 'rahul.architect@buildiqo.ai' : 'priya.patel@gmail.com';
    setLoginIdentifier(targetEmail);
    setLoginPassword('password123');

    setIsLoading(true);
    try {
      const res = await login(targetEmail, 'password123');
      if (res && res.success && onAuthSuccess) {
        onAuthSuccess(res.user);
      } else {
        setErrorMsg('Demo sign-in failed. Please verify credentials or register a new account.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F4F7FC] text-[#111827] selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      
      {/* ========================================================================= */}
      {/* LEFT PANEL: CONSTRUCTION VISUAL EXPERIENCE (40-45% Desktop Viewport)      */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[42%] xl:w-[40%] relative flex flex-col justify-between shrink-0 overflow-hidden min-h-[380px] lg:min-h-screen bg-[#0B2545]">
        
        {/* Background Photograph with Cover Sizing */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
          style={{ backgroundImage: `url('/construction-site-bg.jpg')` }}
          aria-hidden="true"
        />

        {/* Deep Navy-Blue Overlay & Subtle Emerald/Cyan Lighting Accents */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B2545]/90 via-[#0B2545]/85 to-[#0B2545]/95 backdrop-blur-[1px]" />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 p-6 sm:p-8 lg:p-12 xl:p-14 flex flex-col justify-between h-full space-y-8 text-left">
          
          {/* Top Header: Official Buildiqo Logo */}
          <div className="flex items-center justify-between">
            <BuildiqoLogo 
              variant="horizontal" 
              theme="dark" 
              className="h-10 sm:h-11 drop-shadow-md" 
            />
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-emerald-300 border border-white/15 backdrop-blur-md">
              ✦ IS 456 &amp; IS 1786 ENGINE
            </span>
          </div>

          {/* Main Visual Message */}
          <div className="space-y-6 my-auto">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[42px] font-black tracking-tight text-white leading-[1.15]">
                Plan Smart.<br />
                Build Better.<br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                  Build with Confidence.
                </span>
              </h1>
            </div>

            <p className="text-xs sm:text-sm xl:text-[15px] text-slate-200/90 leading-relaxed max-w-lg font-normal">
              Your intelligent construction planning and estimation workspace — from built-up area calculations and material specifications to detailed BOQs and architectural floor plans.
            </p>

            {/* Four Compact Feature Highlights with Translucent Navy Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 backdrop-blur-md transition-all">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                  <Calculator className="w-4 h-4 text-emerald-300" />
                </div>
                <div className="leading-tight">
                  <span className="text-xs font-bold text-white block">Cost Estimation</span>
                  <span className="text-[10px] text-slate-300">Package rates &amp; IS formulas</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 backdrop-blur-md transition-all">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                </div>
                <div className="leading-tight">
                  <span className="text-xs font-bold text-white block">Material Takeoff &amp; BOQ</span>
                  <span className="text-[10px] text-slate-300">Steel, cement &amp; state rates</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 backdrop-blur-md transition-all">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                  <Compass className="w-4 h-4 text-emerald-300" />
                </div>
                <div className="leading-tight">
                  <span className="text-xs font-bold text-white block">AI Floor Plan Studio</span>
                  <span className="text-[10px] text-slate-300">Parametric CAD &amp; DXF solver</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 backdrop-blur-md transition-all">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-4 h-4 text-emerald-300" />
                </div>
                <div className="leading-tight">
                  <span className="text-xs font-bold text-white block">Reports &amp; Exports</span>
                  <span className="text-[10px] text-slate-300">Client-ready Excel &amp; PDF</span>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Trust Statement */}
          <div className="pt-4 border-t border-white/10">
            <div className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white/[0.08] border border-white/15 backdrop-blur-md text-xs text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold text-[11px] sm:text-xs">
                Built for smarter construction decisions.
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT PANEL: AUTHENTICATION CARD (55-60% Desktop Viewport)                */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[58%] xl:w-[60%] flex items-center justify-center p-4 sm:p-8 lg:p-12 xl:p-16 relative">
        
        {/* Soft Colorful Radial Gradients for Background Depth */}
        <div className="absolute inset-0 bg-[#F4F7FC] pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-500/[0.06] blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/[0.05] blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-10 w-72 h-72 rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />

        {/* Polished White Authentication Card */}
        <div className="relative z-10 w-full max-w-[480px] bg-white rounded-3xl sm:rounded-[28px] border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.08)] p-6 sm:p-9 xl:p-10 text-left space-y-6">
          
          {/* Card Top: Official Logo Mark & Header */}
          <div className="text-center space-y-2">
            <div className="inline-block mx-auto">
              <BuildiqoLogo variant="mark" className="w-12 h-12 mx-auto drop-shadow-xs" />
            </div>
            <div>
              <span className="text-lg font-black text-slate-900 tracking-tight block">
                Buildiqo<span className="text-blue-600">.AI</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                Construction Intelligence Workspace
              </span>
            </div>

            <div className="pt-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {mode === 'login' && 'Welcome Back!'}
                {mode === 'register' && 'Create Your Account'}
                {mode === 'forgot' && 'Reset Password'}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {mode === 'login' && 'Sign in to continue to your construction workspace.'}
                {mode === 'register' && 'Join architects, builders & engineers estimating with precision.'}
                {mode === 'forgot' && 'Enter your registered email address to receive password instructions.'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs (Sign In / Create Account) */}
          {mode !== 'forgot' && (
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
                Sign In
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
          )}

          {/* Error Message Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-xs text-rose-700 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* 1. LOGIN FORM                                             */}
          {/* ========================================================= */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fadeIn">
              
              {/* Email / Mobile Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Mobile Number / Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Enter mobile number or email"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-xs font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white placeholder:text-slate-400 transition-all shadow-2xs"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setErrorMsg(''); setForgotSubmitted(false); }}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-bold hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 sm:py-3 text-xs font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white placeholder:text-slate-400 transition-all shadow-2xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Keep Me Signed In */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                  />
                  <span>Keep me signed in on this device</span>
                </label>
              </div>

              {/* Primary Login Button with Royal Blue to Indigo Gradient */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white font-extrabold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span>{isLoading ? 'Signing In...' : 'Login'}</span>
                <ArrowRight className="w-4 h-4 text-white/90" />
              </button>

              {/* Instant One-Click Demo Access Shortcuts */}
              <div className="pt-3 border-t border-slate-200/80 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block text-center">
                  Instant One-Click Demo Profiles
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('architect')}
                    className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-left transition-colors cursor-pointer group shadow-2xs"
                  >
                    <span className="text-xs font-bold text-slate-900 block truncate group-hover:text-blue-700">
                      Ar. Rahul Sharma
                    </span>
                    <span className="text-[10px] text-blue-700 font-semibold block truncate">
                      Studio Vista Architects
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('homeowner')}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors cursor-pointer group shadow-2xs"
                  >
                    <span className="text-xs font-bold text-slate-900 block truncate group-hover:text-slate-950">
                      Priya Patel
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold block truncate">
                      Homeowner Profile
                    </span>
                  </button>
                </div>
              </div>

            </form>
          )}

          {/* ========================================================= */}
          {/* 2. REGISTRATION FORM                                      */}
          {/* ========================================================= */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 animate-fadeIn">
              
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Full Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Vikramaditya Reddy"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white placeholder:text-slate-400 shadow-2xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Email Address *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="vikram@example.com"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white placeholder:text-slate-400 shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Mobile Number (+91)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white placeholder:text-slate-400 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Primary Profession Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Primary Profession / Role *</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white shadow-2xs cursor-pointer"
                >
                  <option value="Architect / Structural Designer">Architect / Structural Designer</option>
                  <option value="Civil Contractor / Builder">Civil Contractor / Builder</option>
                  <option value="Interior Designer / Decorator">Interior Designer / Decorator</option>
                  <option value="Homeowner / Individual Builder">Homeowner / Individual Builder</option>
                </select>
              </div>

              {/* Conditional Firm Name */}
              {isFirmRequiredRole(regRole) && (
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1 animate-fadeIn">
                  <label className="text-xs font-bold text-blue-950 flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Firm / Studio / Company Name *</span>
                  </label>
                  <input
                    type="text"
                    value={regFirmName}
                    onChange={(e) => setRegFirmName(e.target.value)}
                    placeholder={
                      regRole === 'Architect / Structural Designer'
                        ? 'e.g. Studio Vista Architecture & Design'
                        : regRole === 'Civil Contractor / Builder'
                        ? 'e.g. Apex Civil Infra Projects'
                        : 'e.g. Luxe Living Interior Studio'
                    }
                    className="w-full px-3.5 py-2 text-xs font-semibold text-slate-900 rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white placeholder:text-slate-400"
                    required
                  />
                  <span className="text-[10px] text-blue-700 block">
                    Will appear on your generated BOQ takeoff schedules and architectural exports.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Password *</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white pr-8 placeholder:text-slate-400 shadow-2xs"
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
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Confirm Password *</label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white placeholder:text-slate-400 shadow-2xs"
                    required
                  />
                </div>
              </div>

              <label className="flex items-start space-x-2 text-[11px] text-slate-600 cursor-pointer pt-1 select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-600 mt-0.5 accent-blue-600"
                />
                <span>I agree to Buildiqo.ai Terms of Service and Privacy Policy.</span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white font-extrabold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span>{isLoading ? 'Creating Account...' : 'Create Account & Open Workspace'}</span>
                <ArrowRight className="w-4 h-4 text-white/90" />
              </button>

            </form>
          )}

          {/* ========================================================= */}
          {/* 3. FORGOT PASSWORD FLOW                                   */}
          {/* ========================================================= */}
          {mode === 'forgot' && (
            <div className="space-y-4 animate-fadeIn">
              {!forgotSubmitted ? (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="Enter your registered email"
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-xs font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white placeholder:text-slate-400 shadow-2xs"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    <KeyRound className="w-4 h-4 text-white/90" />
                    <span>Send Password Reset Instructions</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMode('login'); setErrorMsg(''); }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                </form>
              ) : (
                <div className="text-center space-y-4 py-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">Recovery Instructions Sent</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      If an account exists for <strong>{forgotEmail}</strong>, password reset instructions have been forwarded. For demo testing, you can sign in directly with password: <code className="font-mono font-bold text-blue-600">password123</code>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setErrorMsg(''); setForgotSubmitted(false); }}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    Return to Sign In
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Privacy & Terms Trust Badge (Matched to reference design) */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center space-x-2.5 text-[11px] text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="leading-snug">
              By continuing, you agree to our <strong>Terms of Service</strong> and <strong>Privacy Policy</strong>.
            </span>
          </div>

          {/* Bottom Switcher & Support Links */}
          <div className="pt-2 border-t border-slate-100 text-center space-y-2 text-xs">
            {mode === 'login' && (
              <p className="text-slate-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setErrorMsg(''); }}
                  className="font-bold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Sign Up
                </button>
              </p>
            )}

            {mode === 'register' && (
              <p className="text-slate-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMsg(''); }}
                  className="font-bold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}

            <p className="text-[11px] text-slate-400">
              Need help?{' '}
              <a href="mailto:support@buildiqo.ai" className="text-slate-600 hover:underline font-semibold">
                Contact Support
              </a>
            </p>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* DISCRETE ADMIN CREDENTIALS MODAL (Protected /admin access)                */}
      {/* ========================================================================= */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-architect p-6 sm:p-8 max-w-md w-full border-slate-200 shadow-2xl space-y-5 animate-fadeIn text-left">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
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
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl btn-brand-primary text-xs font-bold shadow-brand cursor-pointer"
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