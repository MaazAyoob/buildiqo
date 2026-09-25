import React, { useState, useRef, useEffect } from 'react';
import { 
  Calculator, 
  FolderKanban, 
  Sliders, 
  Settings, 
  PlusCircle, 
  Bookmark, 
  Menu, 
  X,
  HardHat,
  Crown,
  Inbox,
  User,
  LogOut,
  ChevronDown,
  Layers,
  Sparkles,
  FileSpreadsheet,
  Box,
  FileCheck2,
  Home,
  CheckCircle2,
  Compass
} from 'lucide-react';
import { useEstimateStore, formatCurrency } from '../../store/useEstimateStore';

export function Navbar({ currentRoute, setRoute, onOpenSavedModal, onOpenAuthModal }) {
  const { savedProjects, estimation, resetToNewProject, currentUser, logout, subscription } = useEstimateStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [planningDropdownOpen, setPlanningDropdownOpen] = useState(false);
  const [managementDropdownOpen, setManagementDropdownOpen] = useState(false);

  const planningRef = useRef(null);
  const managementRef = useRef(null);
  const userRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (planningRef.current && !planningRef.current.contains(e.target)) {
        setPlanningDropdownOpen(false);
      }
      if (managementRef.current && !managementRef.current.contains(e.target)) {
        setManagementDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartNew = () => {
    resetToNewProject();
    setRoute('planner');
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    if (onOpenAuthModal) onOpenAuthModal();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div 
            onClick={() => setRoute('home')}
            className="flex items-center space-x-3 cursor-pointer group shrink-0"
          >
            <img src="/buildiqo-logo.svg" alt="Buildiqo" className="w-12 h-10 object-contain" />
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-lg tracking-tight text-slate-900">Buildiqo<span className="text-blue-600">.ai</span></span>
                <span className="text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">QS Engine</span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Civil Construction Planning & BOQ</p>
            </div>
          </div>

          {/* Desktop Nav Links organized as Modern Dropdown Sections */}
          <nav className="hidden md:flex items-center space-x-2">
            
            {/* 1. Overview */}
            <button
              onClick={() => setRoute('home')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                currentRoute === 'home' 
                  ? 'bg-blue-50 text-blue-700 font-extrabold shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Overview
            </button>

            {/* 2. Planning Modules Dropdown */}
            <div className="relative" ref={planningRef}>
              <button
                onClick={() => {
                  setPlanningDropdownOpen(!planningDropdownOpen);
                  setManagementDropdownOpen(false);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  currentRoute === 'planner' || currentRoute === 'floor-plan' || planningDropdownOpen
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Planning Modules</span>
                <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${planningDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {planningDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl border border-slate-200/90 shadow-xl py-2 z-50 animate-fadeIn text-left divide-y divide-slate-100">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Planning Modules
                  </div>
                  
                  <div className="py-1">
                    {/* 01 Cost Calculator Workspace */}
                    <button
                      onClick={() => { setRoute('planner', 1); setPlanningDropdownOpen(false); }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-800 hover:bg-slate-50 hover:text-blue-600 flex items-start space-x-3 transition-colors group"
                    >
                      <span className="font-mono text-[11px] font-semibold text-slate-400 group-hover:text-blue-600 pt-0.5 w-5 shrink-0">01</span>
                      <div className="flex-1 min-w-0">
                        <span className="block font-semibold text-slate-900 group-hover:text-blue-600">Cost Calculator Workspace</span>
                        <span className="text-[11px] text-slate-500 font-normal block truncate">Plot dimensions & structure setup</span>
                      </div>
                    </button>

                    {/* 02 AI Floor Plan Studio */}
                    <button
                      onClick={() => { setRoute('floor-plan'); setPlanningDropdownOpen(false); }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-800 bg-blue-50/40 hover:bg-blue-50 hover:text-blue-700 flex items-start space-x-3 transition-colors group my-0.5"
                      id="nav-planning-ai-floorplan"
                    >
                      <span className="font-mono text-[11px] font-bold text-blue-600 pt-0.5 w-5 shrink-0">02</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-blue-900 group-hover:text-blue-700">AI Floor Plan Studio</span>
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800 tracking-wide">
                            ✦ AI
                          </span>
                        </div>
                        <span className="text-[11px] text-blue-700/80 font-normal block truncate">Architectural layout & space solver</span>
                      </div>
                    </button>

                    {/* 03 Floor Space & Room Layout */}
                    <button
                      onClick={() => { setRoute('planner', 2); setPlanningDropdownOpen(false); }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-800 hover:bg-slate-50 hover:text-blue-600 flex items-start space-x-3 transition-colors group"
                    >
                      <span className="font-mono text-[11px] font-semibold text-slate-400 group-hover:text-blue-600 pt-0.5 w-5 shrink-0">03</span>
                      <div className="flex-1 min-w-0">
                        <span className="block font-semibold text-slate-900 group-hover:text-blue-600">Floor Space & Room Layout</span>
                        <span className="text-[11px] text-slate-500 font-normal block truncate">Carpet & built-up area configuration</span>
                      </div>
                    </button>

                    {/* 04 Material Specifications */}
                    <button
                      onClick={() => { setRoute('planner', 3); setPlanningDropdownOpen(false); }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-800 hover:bg-slate-50 hover:text-blue-600 flex items-start space-x-3 transition-colors group"
                    >
                      <span className="font-mono text-[11px] font-semibold text-slate-400 group-hover:text-blue-600 pt-0.5 w-5 shrink-0">04</span>
                      <div className="flex-1 min-w-0">
                        <span className="block font-semibold text-slate-900 group-hover:text-blue-600">Material Specifications</span>
                        <span className="text-[11px] text-slate-500 font-normal block truncate">Steel, cement, bricks & tiles</span>
                      </div>
                    </button>

                    {/* 05 Itemized BOQ Takeoff */}
                    <button
                      onClick={() => { setRoute('planner', 4); setPlanningDropdownOpen(false); }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-800 hover:bg-slate-50 hover:text-blue-600 flex items-start space-x-3 transition-colors group"
                    >
                      <span className="font-mono text-[11px] font-semibold text-slate-400 group-hover:text-blue-600 pt-0.5 w-5 shrink-0">05</span>
                      <div className="flex-1 min-w-0">
                        <span className="block font-semibold text-slate-900 group-hover:text-blue-600">Itemized BOQ Takeoff</span>
                        <span className="text-[11px] text-slate-500 font-normal block truncate">Trade labor & material cost schedule</span>
                      </div>
                    </button>

                    {/* 06 3D Model View */}
                    <button
                      onClick={() => { setRoute('planner', 5); setPlanningDropdownOpen(false); }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-800 hover:bg-slate-50 hover:text-blue-600 flex items-start space-x-3 transition-colors group"
                    >
                      <span className="font-mono text-[11px] font-semibold text-slate-400 group-hover:text-blue-600 pt-0.5 w-5 shrink-0">06</span>
                      <div className="flex-1 min-w-0">
                        <span className="block font-semibold text-slate-900 group-hover:text-blue-600">3D Model View</span>
                        <span className="text-[11px] text-slate-500 font-normal block truncate">Architectural visualization</span>
                      </div>
                    </button>

                    {/* 07 QS Audit Summary Report */}
                    <button
                      onClick={() => { setRoute('planner', 6); setPlanningDropdownOpen(false); }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-800 hover:bg-slate-50 hover:text-blue-600 flex items-start space-x-3 transition-colors group"
                    >
                      <span className="font-mono text-[11px] font-semibold text-slate-400 group-hover:text-blue-600 pt-0.5 w-5 shrink-0">07</span>
                      <div className="flex-1 min-w-0">
                        <span className="block font-semibold text-slate-900 group-hover:text-blue-600">QS Audit Summary Report</span>
                        <span className="text-[11px] text-slate-500 font-normal block truncate">Formal print & export schedule</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Management & Benchmarks Dropdown */}
            <div className="relative" ref={managementRef}>
              <button
                onClick={() => {
                  setManagementDropdownOpen(!managementDropdownOpen);
                  setPlanningDropdownOpen(false);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  ['dashboard', 'pricing', 'admin', 'settings', 'leads'].includes(currentRoute)
                    ? 'bg-blue-50 text-blue-700 font-extrabold shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>Projects & Tools</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${managementDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {managementDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-2xl py-2 z-50 animate-fadeIn text-left">
                  <div className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Project Management & Pricing
                  </div>

                  <button
                    onClick={() => { setRoute('dashboard'); setManagementDropdownOpen(false); }}
                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <FolderKanban className="w-4 h-4 text-blue-600" />
                      <span>Saved Estimations</span>
                    </div>
                    {savedProjects.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-blue-100 text-blue-900">
                        {savedProjects.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => { setRoute('commercial-boq'); setManagementDropdownOpen(false); }}
                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2.5 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                    <span>Commercial BOQ Editor</span>
                  </button>

                  <button
                    onClick={() => { setRoute('pricing'); setManagementDropdownOpen(false); }}
                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2.5 transition-colors"
                  >
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span>Subscription Plans & Pricing</span>
                  </button>

                  <button
                    onClick={() => { setRoute('admin'); setManagementDropdownOpen(false); }}
                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2.5 transition-colors"
                  >
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <span>Regional Multipliers & Rates</span>
                  </button>

                  <button
                    onClick={() => { setRoute('settings'); setManagementDropdownOpen(false); }}
                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2.5 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Currency & Unit Settings</span>
                  </button>

                  {currentUser?.isAdmin && (
                    <div className="pt-1 mt-1 border-t border-slate-100">
                      <button
                        onClick={() => { setRoute('leads'); setManagementDropdownOpen(false); }}
                        className="w-full px-3.5 py-2 text-left text-xs font-black text-amber-950 bg-amber-100/70 hover:bg-amber-200 flex items-center space-x-2.5 transition-colors"
                      >
                        <Inbox className="w-4 h-4 text-amber-800" />
                        <span>Customer Leads Inbox (Admin)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Pricing Direct Tab */}
            <button
              onClick={() => setRoute('pricing')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                currentRoute === 'pricing' 
                  ? 'bg-blue-50 text-blue-700 font-extrabold shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-blue-600" />
              <span>Pricing</span>
            </button>

            {/* 5. Commercial BOQ */}
            <button
              onClick={() => setRoute('commercial-boq')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                currentRoute === 'commercial-boq' 
                  ? 'bg-blue-600 text-white font-black shadow-xs' 
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 ${currentRoute === 'commercial-boq' ? 'text-white' : 'text-blue-600'}`} />
              <span>Commercial BOQ</span>
            </button>

          </nav>

          {/* Right Action buttons */}
          <div className="hidden sm:flex items-center space-x-2">
            {currentRoute === 'planner' && (
              <div className="text-right mr-3 hidden lg:block">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Active Estimate</span>
                <span className="text-xs font-mono tabular-nums font-bold text-slate-900">
                  {subscription?.planId === 'free' ? '₹00' : formatCurrency(estimation.grandTotalCost)}
                </span>
              </div>
            )}
            
            <button
              onClick={onOpenSavedModal}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 flex items-center space-x-1.5 transition-all shadow-xs"
            >
              <Bookmark className="w-3.5 h-3.5 text-slate-500" />
              <span>Saved</span>
              {savedProjects.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-slate-100 font-mono text-[10px] font-semibold text-slate-600">
                  {savedProjects.length}
                </span>
              )}
            </button>
            
            <button
              onClick={handleStartNew}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-xs hover:shadow-sm flex items-center space-x-1.5 transition-all active:scale-[0.98]"
            >
              <PlusCircle className="w-3.5 h-3.5 text-blue-200" />
              <span>New Estimate</span>
            </button>

            {/* User Profile Dropdown */}
            {currentUser ? (
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                    {currentUser.avatar || 'U'}
                  </div>
                  <div className="text-left hidden lg:block">
                    <span className="text-xs font-extrabold text-slate-900 block leading-tight truncate max-w-[120px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-slate-500 block leading-tight truncate max-w-[120px]">
                      {currentUser.firmName || (currentUser.role ? currentUser.role.split(' / ')[0] : 'Member')}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-fadeIn text-left">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-900 block truncate">{currentUser.name}</span>
                      {currentUser.firmName && (
                        <span className="text-[11px] text-blue-700 font-extrabold block truncate">
                          🏢 {currentUser.firmName}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 block truncate">{currentUser.email}</span>
                      <div className="mt-1 flex items-center space-x-1">
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                          {currentUser.role}
                        </span>
                        {subscription && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                            {subscription.planId.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    {currentUser.isAdmin && (
                      <button
                        onClick={() => { setRoute('leads'); setUserDropdownOpen(false); }}
                        className="w-full px-4 py-2 text-left text-xs font-black text-amber-950 bg-amber-100/80 hover:bg-amber-200 flex items-center space-x-2 border-b border-amber-300"
                      >
                        <Inbox className="w-4 h-4 text-amber-700" />
                        <span>Customer Leads Inbox</span>
                      </button>
                    )}

                    <button
                      onClick={() => { setRoute('dashboard'); setUserDropdownOpen(false); }}
                      className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <FolderKanban className="w-4 h-4 text-slate-500" />
                      <span>My Estimations</span>
                    </button>

                    <button
                      onClick={() => { setRoute('pricing'); setUserDropdownOpen(false); }}
                      className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span>Manage Subscription</span>
                    </button>

                    <button
                      onClick={() => { setRoute('settings'); setUserDropdownOpen(false); }}
                      className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span>Account Settings</span>
                    </button>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              >
                Sign In
              </button>
            )}

          </div>

          {/* Mobile menu toggle button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2 text-left">
          {currentUser && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                  {currentUser.avatar || 'U'}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{currentUser.name}</span>
                  {currentUser.firmName && (
                    <span className="text-[10px] text-blue-700 font-bold block">{currentUser.firmName}</span>
                  )}
                  <span className="text-[10px] text-slate-500 block">{currentUser.role}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-red-600 px-2 py-1 bg-red-50 rounded-lg"
              >
                Sign Out
              </button>
            </div>
          )}

          <button
            onClick={() => { setRoute('home'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100"
          >
            Overview
          </button>
          
          <button
            onClick={() => { setRoute('floor-plan'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 flex items-center space-x-2"
          >
            <Compass className="w-4 h-4 text-blue-600" />
            <span>AI Floor Plan Studio</span>
          </button>

          <button
            onClick={() => { setRoute('planner'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white flex items-center space-x-2"
          >
            <Calculator className="w-4 h-4" />
            <span>Cost Planner Workspace</span>
          </button>

          <button
            onClick={() => { setRoute('pricing'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100 flex items-center space-x-2"
          >
            <Crown className="w-4 h-4 text-blue-600" />
            <span>Subscription Pricing</span>
          </button>

          <button
            onClick={() => { setRoute('commercial-boq'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100 flex items-center space-x-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>Commercial BOQ Editor</span>
          </button>

          <button
            onClick={() => { setRoute('dashboard'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100 flex items-center justify-between"
          >
            <span className="flex items-center space-x-2">
              <FolderKanban className="w-4 h-4" />
              <span>Saved Projects</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-900">{savedProjects.length}</span>
          </button>

          {currentUser?.isAdmin && (
            <button
              onClick={() => { setRoute('leads'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-xl text-sm font-black bg-amber-200 text-amber-950 flex items-center space-x-2"
            >
              <Inbox className="w-4 h-4 text-amber-800" />
              <span>Customer Leads Inbox</span>
            </button>
          )}

          <button
            onClick={() => { setRoute('admin'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100 flex items-center space-x-2"
          >
            <Sliders className="w-4 h-4" />
            <span>Rates & Benchmarks</span>
          </button>

          <button
            onClick={() => { setRoute('settings'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100 flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

          <div className="pt-2 border-t border-slate-200 flex space-x-2">
            <button
              onClick={handleStartNew}
              className="flex-1 py-2.5 rounded-xl text-xs font-black bg-blue-600 text-white text-center"
            >
              Start New Estimate
            </button>
          </div>
        </div>
      )}
    </header>
  );
}