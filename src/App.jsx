import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
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

export function App() {
  const getInitialRoute = () => {
    const hash = window.location.hash.replace('#', '').trim();
    const validRoutes = ['home', 'planner', 'floor-plan', 'dashboard', 'admin', 'settings', 'report', 'pricing', 'leads', 'commercial-boq'];
    return validRoutes.includes(hash) ? hash : 'home';
  };

  const [currentRoute, setCurrentRouteState] = useState(getInitialRoute); // home, planner, dashboard, admin, settings, report, pricing, leads
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [forceAuthScreen, setForceAuthScreen] = useState(false);
  const [plannerInitialStep, setPlannerInitialStep] = useState(1);
  const { loadProject, currentUser, subscription } = useEstimateStore();

  const setRoute = (route, step) => {
    // If subscriptions are disabled, divert any navigation to pricing toward planner
    const targetRoute = (!ENABLE_SUBSCRIPTIONS && route === 'pricing') ? 'planner' : route;
    setCurrentRouteState(targetRoute);
    if (step) {
      setPlannerInitialStep(step);
    }
    if (window.location.hash.replace('#', '') !== targetRoute) {
      window.location.hash = targetRoute;
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      const validRoutes = ['home', 'planner', 'floor-plan', 'dashboard', 'admin', 'settings', 'report', 'pricing', 'leads', 'commercial-boq'];
      if (validRoutes.includes(hash)) {
        const targetRoute = (!ENABLE_SUBSCRIPTIONS && hash === 'pricing') ? 'planner' : hash;
        setCurrentRouteState(targetRoute);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectSavedProject = (id) => {
    if (loadProject(id)) {
      setRoute('planner');
    }
  };

  // Scroll to top on route switch
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentRoute, forceAuthScreen]);

  // Public route check
  const isPublicRoute = currentRoute === 'home';

  // If user explicitly requested auth screen, or trying to access protected workspace without session, render Auth gateway
  if ((!currentUser && !isPublicRoute) || forceAuthScreen) {
    return (
      <AuthPage 
        onAuthSuccess={(user) => {
          setForceAuthScreen(false);
          // Free Platform: Direct registered/logged-in users directly to their engineering workspace
          if (user?.isAdmin) {
            setRoute('leads');
          } else {
            setRoute('planner');
          }
        }} 
      />
    );
  }

  // If customer has a pending payment submitted awaiting admin manual approval, show Processing screen (only if subscriptions active)
  if (ENABLE_SUBSCRIPTIONS && currentUser && !currentUser.isAdmin && subscription?.paymentStatus === 'pending') {
    return <PaymentProcessingScreen onProceedFree={() => setRoute('planner')} />;
  }

  // Gating condition: If logged-in customer has NOT yet selected/confirmed a subscription, show ONLY Pricing page (disabled on free platform)
  const isSubscriptionMandatory = ENABLE_SUBSCRIPTIONS && !!currentUser && !currentUser.isAdmin && !subscription?.isPlanConfirmed;
  const effectiveRoute = isSubscriptionMandatory 
    ? (currentRoute !== 'commercial-boq' ? 'pricing' : currentRoute)
    : (currentRoute === 'pricing' ? 'planner' : currentRoute);
  const hideNavbar = isSubscriptionMandatory && currentRoute !== 'commercial-boq';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Navigation Header */}
      {!hideNavbar && (
        <Navbar 
          currentRoute={effectiveRoute} 
          setRoute={setRoute} 
          onOpenSavedModal={() => setIsSavedModalOpen(true)}
          onOpenAuthModal={() => setForceAuthScreen(true)}
        />
      )}

      {/* Main Content Area */}
      <main className={`flex-1 w-full ${effectiveRoute === 'home' ? 'pt-0' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6'}`}>
        {effectiveRoute === 'home' && <LandingPage setRoute={setRoute} />}
        {effectiveRoute === 'planner' && <PlannerPage setRoute={setRoute} initialStep={plannerInitialStep} onOpenSavedModal={() => setIsSavedModalOpen(true)} />}
        {effectiveRoute === 'floor-plan' && <FloorPlanStudioPage setRoute={setRoute} onOpenSavedModal={() => setIsSavedModalOpen(true)} />}
        {effectiveRoute === 'dashboard' && <DashboardPage setRoute={setRoute} />}
        {effectiveRoute === 'admin' && <AdminPage setRoute={setRoute} />}
        {effectiveRoute === 'settings' && <SettingsPage setRoute={setRoute} />}
        {effectiveRoute === 'report' && <ReportPage setRoute={setRoute} onOpenSavedModal={() => setIsSavedModalOpen(true)} />}
        {effectiveRoute === 'pricing' && <PricingPage setRoute={setRoute} isMandatoryGate={isSubscriptionMandatory} />}
        {effectiveRoute === 'leads' && <AdminLeadsPage setRoute={setRoute} />}
        {effectiveRoute === 'commercial-boq' && <CommercialBOQPage setRoute={setRoute} />}
        {!['home', 'planner', 'floor-plan', 'dashboard', 'admin', 'settings', 'report', 'pricing', 'leads', 'commercial-boq'].includes(effectiveRoute) && (
          <NotFoundPage setRoute={setRoute} />
        )}
      </main>

      {/* Footer */}
      {!isSubscriptionMandatory && <Footer setRoute={setRoute} />}

      {/* AI Construction & Cost Chatbot Assistant (Hidden during onboarding) */}
      {!isSubscriptionMandatory && <AIChatbot onNavigateRoute={setRoute} />}

      {/* Saved Estimations Modal */}
      <SavedEstimatesModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        onSelectProject={handleSelectSavedProject}
      />

    </div>
  );
}

export default App;