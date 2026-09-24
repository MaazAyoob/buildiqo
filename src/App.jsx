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
import { useEstimateStore } from './store/useEstimateStore';

export function App() {
  const getInitialRoute = () => {
    const hash = window.location.hash.replace('#', '').trim();
    const validRoutes = ['home', 'planner', 'floor-plan', 'dashboard', 'admin', 'settings', 'report', 'pricing', 'leads', 'commercial-boq'];
    return validRoutes.includes(hash) ? hash : 'home';
  };

  const [currentRoute, setCurrentRouteState] = useState(getInitialRoute); // home, planner, dashboard, admin, settings, report, pricing, leads
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [forceAuthScreen, setForceAuthScreen] = useState(false);
  const { loadProject, currentUser, subscription } = useEstimateStore();

  const setRoute = (route) => {
    setCurrentRouteState(route);
    if (window.location.hash.replace('#', '') !== route) {
      window.location.hash = route;
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      const validRoutes = ['home', 'planner', 'floor-plan', 'dashboard', 'admin', 'settings', 'report', 'pricing', 'leads', 'commercial-boq'];
      if (validRoutes.includes(hash)) {
        setCurrentRouteState(hash);
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

  // If user is not logged in, or explicitly requested auth screen, render Auth gateway
  if (!currentUser || forceAuthScreen) {
    return (
      <AuthPage 
        onAuthSuccess={(user) => {
          setForceAuthScreen(false);
          // When customer logs in or registers: direct them straight to the pricing page
          // Once they select a subscription, they gain access to the application
          if (user?.isAdmin) {
            setRoute('leads');
          } else {
            setRoute('pricing');
          }
        }} 
      />
    );
  }

  // If customer has a pending payment submitted awaiting admin manual approval, show Processing screen
  if (!currentUser.isAdmin && subscription?.paymentStatus === 'pending') {
    return <PaymentProcessingScreen onProceedFree={() => setRoute('planner')} />;
  }

  // Gating condition: If customer has NOT yet selected/confirmed a subscription in this session, show ONLY Pricing page (no navbar)
  const isSubscriptionMandatory = !currentUser.isAdmin && !subscription?.isPlanConfirmed;
  const effectiveRoute = (isSubscriptionMandatory && currentRoute !== 'commercial-boq') ? 'pricing' : currentRoute;
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {effectiveRoute === 'home' && <LandingPage setRoute={setRoute} />}
        {effectiveRoute === 'planner' && <PlannerPage setRoute={setRoute} onOpenSavedModal={() => setIsSavedModalOpen(true)} />}
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