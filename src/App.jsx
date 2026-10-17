import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AppSidebar } from './components/layout/AppSidebar';
import { WorkspaceHeader } from './components/layout/WorkspaceHeader';
import { SavedEstimatesModal } from './components/common/SavedEstimatesModal';
import { AIChatbot } from './components/common/AIChatbot';
import { LandingPage } from './pages/LandingPage';
import { PlannerPage } from './pages/PlannerPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';
import { ReportPage } from './pages/ReportPage';
import { PricingPage } from './pages/PricingPage';
import { AdminLeadsPage } from './pages/AdminLeadsPage';
import { AuthPage } from './pages/AuthPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { CommercialBOQPage } from './pages/CommercialBOQPage';
import { FloorPlanStudioPage } from './pages/FloorPlanStudioPage';
import { PaymentProcessingScreen } from './components/common/PaymentProcessingScreen';
import { useEstimateStore, ENABLE_SUBSCRIPTIONS } from './store/useEstimateStore';
import { Lock } from 'lucide-react';

export function App() {
  const parseRouteFromLocation = () => {
    if (typeof window === 'undefined') return 'home';
    const pathname = window.location.pathname.toLowerCase();
    if (pathname === '/admin' || pathname === '/admin/' || pathname === '/admin/rates') {
      return 'admin';
    }
    if (pathname === '/admin/leads' || pathname === '/admin-leads') {
      return 'leads';
    }
    const hash = window.location.hash.replace('#', '').trim().toLowerCase();
    const validRoutes = ['home', 'planner', 'floor-plan', 'dashboard', 'settings', 'report', 'pricing', 'commercial-boq', 'admin', 'leads'];
    if (validRoutes.includes(hash)) {
      return hash;
    }
    return 'home';
  };

  const [currentRoute, setCurrentRouteState] = useState(parseRouteFromLocation);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [forceAuthScreen, setForceAuthScreen] = useState(false);
  const [plannerInitialStep, setPlannerInitialStep] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { loadProject, currentUser, subscription, logout } = useEstimateStore();

  const setRoute = (route, step) => {
    const targetRoute = route;
    setCurrentRouteState(targetRoute);
    setMobileMenuOpen(false);
    if (step) {
      setPlannerInitialStep(step);
    }

    // Direct browser URL synchronization
    if (typeof window !== 'undefined') {
      if (targetRoute === 'admin') {
        if (window.location.pathname.toLowerCase() !== '/admin') {
          window.history.pushState(null, '', '/admin');
        }
      } else if (targetRoute === 'leads') {
        if (window.location.pathname.toLowerCase() !== '/admin/leads') {
          window.history.pushState(null, '', '/admin/leads');
        }
      } else {
        if (window.location.pathname.toLowerCase().startsWith('/admin')) {
          window.history.pushState(null, '', `/#${targetRoute}`);
        } else if (window.location.hash.replace('#', '') !== targetRoute) {
          window.location.hash = targetRoute;
        }
      }
    }
  };

  useEffect(() => {
    const handleLocationChange = () => {
      const parsed = parseRouteFromLocation();
      setCurrentRouteState(parsed);
    };
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const handleSelectSavedProject = (id) => {
    if (loadProject(id)) {
      setRoute('planner');
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentRoute, forceAuthScreen]);

  const isPublicRoute = currentRoute === 'home' || currentRoute === 'pricing';
  const isAdminRoute = currentRoute === 'admin' || currentRoute === 'leads';

  // 1. Unauthenticated access: Prompt for authentication
  if ((!currentUser && !isPublicRoute) || forceAuthScreen) {
    return (
      <AuthPage 
        initialAdminModal={isAdminRoute}
        onAuthSuccess={(user) => {
          setForceAuthScreen(false);
          if (user?.isAdmin) {
            setRoute(currentRoute === 'leads' ? 'leads' : 'admin');
          } else {
            setRoute('planner');
          }
        }} 
      />
    );
  }

  // 2. Strict authorization: Regular user or guest trying to access /admin
  if (currentUser && !currentUser.isAdmin && isAdminRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F5F7FB] text-[#172033] font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-200 shadow-xl text-center space-y-5 animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 mx-auto flex items-center justify-center shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-slate-900">Administrator Access Required</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              You are currently signed in as <strong>{currentUser.email || currentUser.name}</strong> ({currentUser.role || 'Standard User'}).
              The <span className="font-mono font-bold text-red-700">/admin</span> console requires platform administrator privileges.
            </p>
          </div>
          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => {
                logout();
                setForceAuthScreen(true);
              }}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors"
            >
              Sign In with Administrator Account
            </button>
            <button
              onClick={() => setRoute('home')}
              className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Return to Public Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (ENABLE_SUBSCRIPTIONS && currentUser && !currentUser.isAdmin && subscription?.paymentStatus === 'pending') {
    return <PaymentProcessingScreen onProceedFree={() => setRoute('planner')} />;
  }

  const isSubscriptionMandatory = ENABLE_SUBSCRIPTIONS && !!currentUser && !currentUser.isAdmin && !subscription?.isPlanConfirmed;
  const effectiveRoute = isSubscriptionMandatory 
    ? (currentRoute !== 'commercial-boq' ? 'pricing' : currentRoute)
    : currentRoute;

  // ==============================================================
  // CASE 1: PUBLIC LANDING PAGE (Dedicated full-bleed layout)
  // ==============================================================
  if (effectiveRoute === 'home') {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5F7FB] text-[#172033] font-sans selection:bg-blue-600 selection:text-white">
        <Navbar 
          currentRoute={effectiveRoute} 
          setRoute={setRoute} 
          onOpenSavedModal={() => setIsSavedModalOpen(true)}
          onOpenAuthModal={() => setForceAuthScreen(true)}
        />
        <main className="flex-1 w-full pt-0">
          <LandingPage setRoute={setRoute} />
        </main>
        <Footer setRoute={setRoute} />
        <AIChatbot onNavigateRoute={setRoute} />
        <SavedEstimatesModal
          isOpen={isSavedModalOpen}
          onClose={() => setIsSavedModalOpen(false)}
          onSelectProject={handleSelectSavedProject}
        />
      </div>
    );
  }

  // ==============================================================
  // CASE 1B: PUBLIC PRICING PAGE (Dedicated full-bleed layout with Navbar & Footer)
  // ==============================================================
  if (effectiveRoute === 'pricing' && (!currentUser || isPublicRoute)) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5F7FB] text-[#172033] font-sans selection:bg-blue-600 selection:text-white">
        <Navbar 
          currentRoute={effectiveRoute} 
          setRoute={setRoute} 
          onOpenSavedModal={() => setIsSavedModalOpen(true)}
          onOpenAuthModal={() => setForceAuthScreen(true)}
        />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <PricingPage setRoute={setRoute} isMandatoryGate={false} />
        </main>
        <Footer setRoute={setRoute} />
        <AIChatbot onNavigateRoute={setRoute} />
        <SavedEstimatesModal
          isOpen={isSavedModalOpen}
          onClose={() => setIsSavedModalOpen(false)}
          onSelectProject={handleSelectSavedProject}
        />
      </div>
    );
  }

  // ==============================================================
  // CASE 2: AUTHENTICATED COMMAND CENTER WORKSPACE (Left Sidebar)
  // ==============================================================
  return (
    <div className="min-h-screen flex bg-[#F5F7FB] text-[#172033] font-sans selection:bg-blue-600 selection:text-white antialiased">
      
      {/* 1. Desktop Persistent Left Sidebar */}
      <div className="hidden lg:flex sticky top-0 h-screen shrink-0">
        <AppSidebar
          currentRoute={effectiveRoute}
          setRoute={setRoute}
          onOpenSavedModal={() => setIsSavedModalOpen(true)}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
      </div>

      {/* 2. Mobile Drawer Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">
            <AppSidebar
              currentRoute={effectiveRoute}
              setRoute={setRoute}
              onOpenSavedModal={() => {
                setMobileMenuOpen(false);
                setIsSavedModalOpen(true);
              }}
              collapsed={false}
              setCollapsed={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 3. Main Workspace Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Workspace Top Header Bar */}
        <WorkspaceHeader
          currentRoute={effectiveRoute}
          setRoute={setRoute}
          onOpenSavedModal={() => setIsSavedModalOpen(true)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {effectiveRoute === 'planner' && (
            <PlannerPage 
              setRoute={setRoute} 
              initialStep={plannerInitialStep} 
              onOpenSavedModal={() => setIsSavedModalOpen(true)} 
            />
          )}
          {effectiveRoute === 'floor-plan' && (
            <FloorPlanStudioPage 
              setRoute={setRoute} 
              onOpenSavedModal={() => setIsSavedModalOpen(true)} 
            />
          )}
          {effectiveRoute === 'dashboard' && <DashboardPage setRoute={setRoute} />}
          {effectiveRoute === 'admin' && <AdminPage setRoute={setRoute} />}
          {effectiveRoute === 'settings' && <SettingsPage setRoute={setRoute} />}
          {effectiveRoute === 'report' && (
            <ReportPage 
              setRoute={setRoute} 
              onOpenSavedModal={() => setIsSavedModalOpen(true)} 
            />
          )}
          {effectiveRoute === 'pricing' && (
            <PricingPage 
              setRoute={setRoute} 
              isMandatoryGate={isSubscriptionMandatory} 
            />
          )}
          {effectiveRoute === 'leads' && <AdminLeadsPage setRoute={setRoute} />}
          {effectiveRoute === 'commercial-boq' && <CommercialBOQPage setRoute={setRoute} />}
          {!['planner', 'floor-plan', 'dashboard', 'admin', 'settings', 'report', 'pricing', 'leads', 'commercial-boq'].includes(effectiveRoute) && (
            <NotFoundPage setRoute={setRoute} />
          )}
        </main>

        {/* Floating Chatbot */}
        <AIChatbot onNavigateRoute={setRoute} />

        {/* Saved Estimates Modal */}
        <SavedEstimatesModal
          isOpen={isSavedModalOpen}
          onClose={() => setIsSavedModalOpen(false)}
          onSelectProject={handleSelectSavedProject}
        />

      </div>

    </div>
  );
}

export default App;