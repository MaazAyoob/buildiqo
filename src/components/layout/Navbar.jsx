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
  Crown,
  Inbox,
  LogOut,
  ChevronDown,
  FileSpreadsheet,
  Compass,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useEstimateStore, formatCurrency } from '../../store/useEstimateStore';
import { BuildiqoLogo } from '../common/BuildiqoLogo';

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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] text-[#172033] shadow-2xs no-print transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo with official client badge and typography */}
          <div 
            onClick={() => setRoute('home')}
            className="flex items-center cursor-pointer group shrink-0"
            title="Buildiqo.AI - Civil Estimator & 3D BOQ Platform"
          >
            <BuildiqoLogo 
              variant="horizontal" 
              theme="light"
              className="h-10 transition-transform group-hover:scale-[1.02]" 
              markClassName="w-9 h-9 shrink-0 drop-shadow-xs"
            />
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
            
            {/* 1. Overview */}
            <button
              onClick={() => setRoute('home')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentRoute === 'home' 
                  ? 'bg-[#EEF4FF] text-[#2563EB] font-bold shadow-2xs' 
                  : 'text-[#475569] hover:text-[#2563EB] hover:bg-[#EEF4FF]'
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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  currentRoute === 'planner' || currentRoute === 'floor-plan' || planningDropdownOpen
                    ? 'bg-[#EEF4FF] text-[#2563EB] shadow-2xs font-bold' 
                    : 'text-[#475569] hover:text-[#2563EB] hover:bg-[#EEF4FF]'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-blue-600" />
                <span>Planning Modules</span>
                <ChevronDown className={`w-3.5 h-3.5 opacity-80 transition-transform duration-200 ${planningDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {planningDropdownOpen && (
                <div className="absolute left-0 mt-2 w-84 bg-white rounded-2xl border border-slate-200/90 shadow-xl py-2 z-50 animate-fadeIn text-left divide-y divide-slate-100">
                  <div className="px-4 py-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50 rounded-t-xl">
                    <span>Engineering Workspaces</span>
                    <span className="text-[9px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 font-bold">IS 456 / CAD</span>
                  </div>
                  
                  <div className="py-1">
                    {/* Cost Calculator Workspace */}
                    <button
                      onClick={() => { setRoute('planner', 1); setPlanningDropdownOpen(false); }}
                      className="w-full px-3.5 py-2 text-left text-xs text-slate-800 hover:bg-slate-50 hover:text-blue-600 flex items-start space-x-3 transition-colors group"
                    >
                      <span className="font-mono text-[11px] font-bold text-slate-400 group-hover:text-blue-600 pt-0.5 w-5 shrink-0">01</span>
                      <div className="flex-1 min-w-0">
                        <span className="block font-semibold text-slate-900 group-hover:text-blue-600">Construction Estimator</span>
                        <span className="text-[11px] text-slate-500 block truncate">Plot setup, structural & material calculator</span>
                      </div>
                    </button>

                    {/* AI Floor Plan Studio */}
                    <button
                      onClick={() => { setRoute('floor-plan'); setPlanningDropdownOpen(false); }}
                      className="w-full px-3.5 py-2 text-left text-xs bg-blue-50/60 hover:bg-blue-50 hover:text-blue-700 flex items-start space-x-3 transition-colors group my-0.5 border-y border-blue-100/50"
                      id="nav-planning-ai-floorplan"
                    >
                      <span className="font-mono text-[11px] font-bold text-blue-600 pt-0.5 w-5 shrink-0">02</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-blue-950 group-hover:text-blue-700">AI Floor Plan Studio</span>
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            ✦ AI SOLVER
                          </span>
                        </div>
                        <span className="text-[11px] text-blue-700/80 block truncate">Algorithmic architectural CAD planner</span>
                      </div>
                    </button>

                    {/* Floor Space & Room Layout */}
                    <button
                      onClick={() => { setRoute('planner', 2); setPlanningDropdownOpen(false); }}
                      className="w-full px-3.5 py-2 text-left text-xs text-slate-800 hover:bg-slate-50 hover:text-blue-600 flex items-start space-x-3 transition-colors group"
                    >
                      <span className="font-mono text-[11px] font-bold text-slate-400 group-hover:text-blue-600 pt-0.5 w-5 shrink-0">03</span>
                      <div className="flex-1 min-w-0">
                        <span className="block font-semibold text-slate-900 group-hover:text-blue-600">Spaces &amp; Room Layout</span>
                        <span className="text-[11px] text-slate-500 block truncate">Carpet vs built-up area schedules</span>
                      </div>
                    </button>

                    {/* Material Specifications */}
                    <button
                      onClick={() => { setRoute('planner', 3); setPlanningDropdownOpen(false); }}
                      className="w-full px-3.5 py-2 text-left text-xs text-slate-800 hover:bg-slate-50 hover:text-blue-600 flex items-start space-x-3 transition-colors group"
                    >
                      <span className="font-mono text-[11px] font-bold text-slate-400 group-hover:text-blue-600 pt-0.5 w-5 shrink-0">04</span>
                      <div className="flex-1 min-w-0">
                        <span className="block font-semibold text-slate-900 group-hover:text-blue-600">Material Takeoff &amp; Specs</span>
                        <span className="text-[11px] text-slate-500 block truncate">Steel rebar, cement, masonry &amp; finishing</span>
                      </div>
                    </button>

                    {/* Itemized BOQ Takeoff */}
                    <button
                      onClick={() => { setRoute('planner', 4); setPlanningDropdownOpen(false); }}
                      className="w-full px-3.5 py-2 text-left text-xs text-slate-800 hover:bg-slate-50 hover:text-blue-600 flex items-start space-x-3 transition-colors group"
                    >
                      <span className="font-mono text-[11px] font-bold text-slate-400 group-hover:text-blue-600 pt-0.5 w-5 shrink-0">05</span>
                      <div className="flex-1 min-w-0">
                        <span className="block font-semibold text-slate-900 group-hover:text-blue-600">Quantity Surveying BOQ</span>
                        <span className="text-[11px] text-slate-500 block truncate">Detailed trade labor and material rate sheet</span>
                      </div>
                    </button>

                    {/* 3D Model View */}
                    <button
                      onClick={() => { setRoute('planner', 5); setPlanningDropdownOpen(false); }}
                      className="w-full px-3.5 py-2 text-left text-xs text-slate-800 hover:bg-slate-50 hover:text-blue-600 flex items-start space-x-3 transition-colors group"
                    >
                      <span className="font-mono text-[11px] font-bold text-slate-400 group-hover:text-blue-600 pt-0.5 w-5 shrink-0">06</span>
                      <div className="flex-1 min-w-0">
                        <span className="block font-semibold text-slate-900 group-hover:text-blue-600">3D Architectural Visualizer</span>
                        <span className="text-[11px] text-slate-500 block truncate">Volumetric massing &amp; floor layers</span>
                      </div>
                    </button>

                    {/* QS Audit Summary Report */}
                    <button
                      onClick={() => { setRoute('planner', 6); setPlanningDropdownOpen(false); }}
                      className="w-full px-3.5 py-2 text-left text-xs text-slate-800 hover:bg-slate-50 hover:text-blue-600 flex items-start space-x-3 transition-colors group"
                    >
                      <span className="font-mono text-[11px] font-bold text-slate-400 group-hover:text-blue-600 pt-0.5 w-5 shrink-0">07</span>
                      <div className="flex-1 min-w-0">
                        <span className="block font-semibold text-slate-900 group-hover:text-blue-600">QS Audit Summary &amp; Export</span>
                        <span className="text-[11px] text-slate-500 block truncate">Client-ready PDF &amp; Excel takeoff files</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Commercial BOQ */}
            <button
              onClick={() => setRoute('commercial-boq')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                currentRoute === 'commercial-boq' 
                  ? 'bg-[#ECFDF5] text-[#059669] font-bold shadow-2xs border border-emerald-200' 
                  : 'text-[#475569] hover:text-[#059669] hover:bg-[#ECFDF5]'
              }`}
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 ${currentRoute === 'commercial-boq' ? 'text-emerald-600' : 'text-emerald-500'}`} />
              <span>Commercial BOQ</span>
            </button>

            {/* 4. Projects & Tools Dropdown */}
            <div className="relative" ref={managementRef}>
              <button
                onClick={() => {
                  setManagementDropdownOpen(!managementDropdownOpen);
                  setPlanningDropdownOpen(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  ['dashboard', 'pricing', 'settings'].includes(currentRoute) || managementDropdownOpen
                    ? 'bg-[#EEF4FF] text-[#2563EB] font-bold shadow-2xs' 
                    : 'text-[#475569] hover:text-[#2563EB] hover:bg-[#EEF4FF]'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5 text-amber-500" />
                <span>Projects &amp; Tools</span>
                <ChevronDown className={`w-3.5 h-3.5 opacity-80 transition-transform ${managementDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {managementDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl border border-[#E2E8F0] shadow-xl py-2 z-50 animate-fadeIn text-left divide-y divide-slate-100 text-[#172033]">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    Project Management &amp; Settings
                  </div>

                  <button
                    onClick={() => { setRoute('dashboard'); setManagementDropdownOpen(false); }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-800 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <FolderKanban className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold">Saved Estimations</span>
                    </div>
                    {savedProjects.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900">
                        {savedProjects.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => { setRoute('settings'); setManagementDropdownOpen(false); }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-800 hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2.5 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Currency &amp; Unit Settings</span>
                  </button>
                </div>
              )}
            </div>

          </nav>

          {/* Right Action buttons */}
          <div className="hidden sm:flex items-center space-x-2.5">
            {currentRoute === 'planner' && estimation && (
              <div className="hidden lg:flex items-center gap-2.5 px-3 py-1 bg-slate-50/90 border border-slate-200/90 rounded-xl mr-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div className="text-right">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-extrabold">Active Estimate</span>
                    <span className="text-[9px] font-mono text-slate-500 bg-white px-1 py-0.2 rounded border border-slate-200">Excl. GST</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xs font-mono font-black text-slate-900 tabular-nums">
                      {formatCurrency(estimation.estimatedCost || estimation.grandTotalCost || 0)}
                    </span>
                    <span className="text-[10px] font-mono text-blue-600 font-bold">
                      • {formatCurrency(estimation.costPerSqFt || 0)}/sq.ft
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={onOpenSavedModal}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5 text-slate-500" />
              <span>Saved</span>
              {savedProjects.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-blue-50 font-mono text-[10px] font-bold text-blue-700 border border-blue-100">
                  {savedProjects.length}
                </span>
              )}
            </button>
            
            <button
              onClick={handleStartNew}
              className="btn-brand-primary text-xs py-1.5 px-3.5 rounded-xl shadow-brand hover:shadow-brand-hover active:scale-[0.98] cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Estimate</span>
            </button>

            {/* User Profile Dropdown */}
            {currentUser ? (
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 pl-2 pr-2.5 py-1 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {currentUser.avatar || 'U'}
                  </div>
                  <div className="text-left hidden lg:block">
                    <span className="text-xs font-bold text-slate-900 block leading-tight truncate max-w-[120px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-slate-500 block leading-tight truncate max-w-[120px]">
                      {currentUser.firmName || (currentUser.role ? currentUser.role.split(' / ')[0] : 'Member')}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl py-2 z-50 animate-fadeIn text-left">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-900 block truncate">{currentUser.name}</span>
                      {currentUser.firmName && (
                        <span className="text-[11px] text-blue-700 font-semibold block truncate">
                          🏢 {currentUser.firmName}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 block truncate">{currentUser.email}</span>
                      <div className="mt-1.5 flex items-center space-x-1.5">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                          {currentUser.role}
                        </span>
                      </div>
                    </div>


                    <button
                      onClick={() => { setRoute('dashboard'); setUserDropdownOpen(false); }}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <FolderKanban className="w-4 h-4 text-slate-500" />
                      <span>My Estimations</span>
                    </button>


                    <button
                      onClick={() => { setRoute('settings'); setUserDropdownOpen(false); }}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span>Account Settings</span>
                    </button>

                    <div className="pt-1 mt-1 border-t border-slate-100">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center space-x-2"
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
                className="btn-brand-primary text-xs py-1.5 px-4 shadow-brand hover:shadow-brand-hover"
              >
                Sign In
              </button>
            )}

          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white/98 backdrop-blur-xl px-4 pt-3 pb-5 space-y-2 text-left shadow-xl animate-fadeIn">
          {currentUser && (
            <div className="p-3.5 bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-2xl border border-slate-200 flex items-center justify-between mb-3 shadow-2xs">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-xs">
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
                className="text-xs font-semibold text-rose-600 px-2.5 py-1 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}

          <div className="space-y-1">
            <button
              onClick={() => { setRoute('home'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                currentRoute === 'home' ? 'bg-blue-600 text-white font-bold shadow-brand' : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              <span>Platform Overview</span>
            </button>
            
            <button
              onClick={() => { setRoute('floor-plan'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition-colors ${
                currentRoute === 'floor-plan' ? 'bg-blue-600 text-white font-bold shadow-brand' : 'text-blue-700 bg-blue-50/60 hover:bg-blue-100'
              }`}
            >
              <Compass className="w-4 h-4 text-blue-600" />
              <span>AI Floor Plan Studio</span>
              <span className="ml-auto text-[9px] px-1.5 py-0.2 bg-amber-400/20 text-amber-800 font-bold rounded-md">✦ AI</span>
            </button>

            <button
              onClick={() => { setRoute('planner'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition-colors ${
                currentRoute === 'planner' ? 'bg-blue-600 text-white font-bold shadow-brand' : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Calculator className="w-4 h-4 text-blue-600" />
              <span>Civil Cost Planner Workspace</span>
            </button>

            <button
              onClick={() => { setRoute('commercial-boq'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition-colors ${
                currentRoute === 'commercial-boq' ? 'bg-blue-600 text-white font-bold shadow-brand' : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>Commercial BOQ Editor</span>
            </button>

            <button
              onClick={() => { setRoute('dashboard'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                currentRoute === 'dashboard' ? 'bg-blue-600 text-white font-bold shadow-brand' : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center space-x-2.5">
                <FolderKanban className="w-4 h-4 text-slate-500" />
                <span>Saved Projects</span>
              </span>
              {savedProjects.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900">{savedProjects.length}</span>
              )}
            </button>


            <button
              onClick={() => { setRoute('settings'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition-colors ${
                currentRoute === 'settings' ? 'bg-blue-600 text-white font-bold shadow-brand' : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Application Settings</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-200">
            <button
              onClick={handleStartNew}
              className="w-full py-2.5 rounded-xl text-xs font-bold btn-brand-primary cursor-pointer shadow-brand"
            >
              Start New Estimate
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;