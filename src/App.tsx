/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Marketplace } from './components/Marketplace';
import { Portfolio } from './components/Portfolio';
import { AQEI } from './components/AQEI';
import { Settings } from './components/Settings';
import { CompanyProfile } from './components/CompanyProfile';
import { CompanyOnboarding } from './components/CompanyOnboarding';
import { ActivityCenter } from './components/ActivityCenter';
import { AQXIntelligence } from './components/AQXIntelligence';
import { AQXAssistant } from './components/AQXAssistant';
import { PayoutsCenter } from './components/PayoutsCenter';
import { PerformanceAnalytics } from './components/PerformanceAnalytics';
import { GlobalSearch } from './components/GlobalSearch';
import { Trade } from './components/Trade';
import { SecondaryMarket } from './components/SecondaryMarket';
import { ForexMarket } from './components/ForexMarket';
import { Index } from './components/Index';
import { Wallet } from './components/Wallet';
import { AdminPanel } from './components/AdminPanel';
import { AuthPanel } from './components/AuthPanel';
import { Onboarding } from './components/Onboarding';
import { RoleOnboardingGate } from './components/RoleOnboardingGate';
import { LandingPage } from './components/LandingPage';
import { ReportViewer } from './components/ReportViewer';
import { TaxComplianceModule } from './components/TaxComplianceModule';
import { IPOLaunchHub } from './components/IPOLaunchHub';
import { AlgorithmicTradingDesk } from './components/AlgorithmicTradingDesk';
import { ValuationWorkbench } from './components/ValuationWorkbench';
import { InstitutionalIntegrationsHub } from './components/InstitutionalIntegrationsHub';
import { TokenisationHub } from './components/TokenisationHub';
import { KycKybCenter } from './components/KycKybCenter';
import { IssuerDashboard } from './components/IssuerDashboard';
import { ComplianceGovernanceHub } from './components/ComplianceGovernanceHub';
import { InitialLoader } from './components/InitialLoader';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { AnimatePresence } from 'motion/react';
import {
  canRoleAccessTab,
  getCompanyPositionMeta,
  getInvestorIdentityMeta,
  getStoredWorkspaceIdentity,
  type CompanyPosition,
  type InvestorIdentity,
  type WorkspaceRole,
} from './lib/roleAccess';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenIntro, setHasSeenIntro] = useState(() => localStorage.getItem('hasSeenIntro') === 'true');

  const [isUserOnboarded, setIsUserOnboarded] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const verifiedUserId = useRef<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [userRole, setUserRole] = useState<WorkspaceRole>('investor');
  const [investorIdentity, setInvestorIdentity] = useState<InvestorIdentity | null>(null);
  const [companyPosition, setCompanyPosition] = useState<CompanyPosition | null>(null);

  const syncFromStorage = () => {
    const identity = getStoredWorkspaceIdentity();
    setUserRole(identity.userRole);
    setInvestorIdentity(identity.investorIdentity);
    setCompanyPosition(identity.companyPosition);
  };

  useEffect(() => {
    const isLocalOnboarded = localStorage.getItem('isUserOnboarded') === 'true';
    if (isLocalOnboarded) {
      setIsUserOnboarded(true);
      syncFromStorage();
    }

    const handleAuthSync = () => syncFromStorage();
    window.addEventListener('nxg_auth_state_changed', handleAuthSync);

    if (!isSupabaseConfigured) {
      setAuthChecked(true);
      return () => window.removeEventListener('nxg_auth_state_changed', handleAuthSync);
    }

    let disposed = false;
    let generation = 0;
    const refreshIdentity = async () => {
      const request = ++generation;
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
          if (!disposed && request === generation) {
            setAuthChecked(true);
          }
          return;
        }
        const user = data.user;
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .single();
        if (disposed || request !== generation) return;
        verifiedUserId.current = user.id;
        setAuthError(null);
        const role: WorkspaceRole =
          profile?.role === 'admin' || profile?.role === 'company' ? profile.role : 'investor';
        setUserRole(role);
        setIsUserOnboarded(true);
        localStorage.setItem('isUserOnboarded', 'true');
        localStorage.setItem('userRole', role);
        if (user.email) localStorage.setItem('userEmail', user.email);
        if (profile?.full_name) localStorage.setItem('userName', profile.full_name);
        syncFromStorage();
      } catch (error) {
        console.warn('Could not verify remote Supabase session (continuing in prototype mode):', error);
      } finally {
        if (!disposed && request === generation) setAuthChecked(true);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        generation++;
        verifiedUserId.current = null;
        setIsUserOnboarded(false);
        setUserRole('investor');
        setInvestorIdentity(null);
        setCompanyPosition(null);
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('isUserOnboarded');
        localStorage.removeItem('investorIdentity');
        localStorage.removeItem('companyPosition');
        setAuthChecked(true);
      } else if (
        event !== 'TOKEN_REFRESHED' &&
        event !== 'INITIAL_SESSION' &&
        !(event === 'SIGNED_IN' && session?.user?.id === verifiedUserId.current)
      ) {
        setAuthChecked(false);
        setTimeout(() => {
          if (!disposed) void refreshIdentity();
        }, 0);
      }
    });

    void refreshIdentity();
    return () => {
      disposed = true;
      generation++;
      window.removeEventListener('nxg_auth_state_changed', handleAuthSync);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    if (!isUserOnboarded && activeTab !== 'auth' && activeTab !== 'aqei' && activeTab !== 'intro') {
      if (activeTab === 'admin') {
        setActiveTab('auth');
      } else if (hasSeenIntro) {
        setActiveTab('auth');
      } else {
        setActiveTab('intro');
      }
      return;
    }

    // Strict role-based route guard: redirect if current tab is not permitted for active workspace role
    if (isUserOnboarded && !canRoleAccessTab(userRole, activeTab)) {
      setActiveTab('dashboard');
    }
  }, [isUserOnboarded, activeTab, hasSeenIntro, userRole, authChecked]);

  const handleRoleChange = (role: WorkspaceRole) => {
    setUserRole(role);
    localStorage.setItem('userRole', role);
    if (role === 'investor') {
      const nextInv = investorIdentity || 'EQUITY_FUNDER';
      setInvestorIdentity(nextInv);
      localStorage.setItem('investorIdentity', nextInv);
      localStorage.setItem('aqxFineRole', getInvestorIdentityMeta(nextInv).platformRole);
    } else if (role === 'company') {
      const nextComp = companyPosition || 'STARTUP';
      setCompanyPosition(nextComp);
      localStorage.setItem('companyPosition', nextComp);
      localStorage.setItem('aqxFineRole', getCompanyPositionMeta(nextComp).platformRole);
    } else {
      localStorage.setItem('aqxFineRole', 'SUPER_ADMIN');
    }
    if (!canRoleAccessTab(role, activeTab)) {
      setActiveTab('dashboard');
    }
  };

  const handleUpdateSubRole = (sub: {
    investorIdentity?: InvestorIdentity;
    companyPosition?: CompanyPosition;
  }) => {
    if (sub.investorIdentity) {
      setInvestorIdentity(sub.investorIdentity);
      localStorage.setItem('investorIdentity', sub.investorIdentity);
      localStorage.setItem('aqxFineRole', getInvestorIdentityMeta(sub.investorIdentity).platformRole);
    }
    if (sub.companyPosition) {
      setCompanyPosition(sub.companyPosition);
      localStorage.setItem('companyPosition', sub.companyPosition);
      localStorage.setItem('aqxFineRole', getCompanyPositionMeta(sub.companyPosition).platformRole);
    }
    window.dispatchEvent(new Event('nxg_auth_state_changed'));
  };

  const handleRoleOnboardingComplete = (selection: {
    role: WorkspaceRole;
    investorIdentity: InvestorIdentity | null;
    companyPosition: CompanyPosition | null;
  }) => {
    setUserRole(selection.role);
    localStorage.setItem('userRole', selection.role);
    if (selection.role === 'investor' && selection.investorIdentity) {
      setInvestorIdentity(selection.investorIdentity);
      setCompanyPosition(null);
      localStorage.setItem('investorIdentity', selection.investorIdentity);
      localStorage.removeItem('companyPosition');
      localStorage.setItem('aqxFineRole', getInvestorIdentityMeta(selection.investorIdentity).platformRole);
    } else if (selection.role === 'company' && selection.companyPosition) {
      setCompanyPosition(selection.companyPosition);
      setInvestorIdentity(null);
      localStorage.setItem('companyPosition', selection.companyPosition);
      localStorage.removeItem('investorIdentity');
      localStorage.setItem('aqxFineRole', getCompanyPositionMeta(selection.companyPosition).platformRole);
    }
    setActiveTab('dashboard');
  };

  const handleNavigateToCompany = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setActiveTab('company-profile');
  };

  const handleIntroComplete = (tab?: string) => {
    setIsLoading(true);
    setHasSeenIntro(true);
    localStorage.setItem('hasSeenIntro', 'true');
    if (tab === 'aqei') {
      setActiveTab('aqei');
    } else {
      setActiveTab('auth');
    }
  };

  const handleNavigateToAuth = () => {
    setIsLoading(true);
    setHasSeenIntro(true);
    localStorage.setItem('hasSeenIntro', 'true');
    setActiveTab('auth');
  };

  const handleAuthComplete = () => {
    setIsLoading(true);
    setIsUserOnboarded(true);
    localStorage.setItem('isUserOnboarded', 'true');
    syncFromStorage();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('nxg_auth_state_changed'));
    }
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (err) {
        console.warn('Sign out local error:', err);
      }
    }
    setUserRole('investor');
    setInvestorIdentity(null);
    setCompanyPosition(null);
    localStorage.removeItem('userRole');
    localStorage.removeItem('investorIdentity');
    localStorage.removeItem('companyPosition');
    localStorage.removeItem('aqxFineRole');
    setIsUserOnboarded(false);
    setHasSeenIntro(false);
    localStorage.removeItem('isUserOnboarded');
    localStorage.removeItem('hasSeenIntro');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('nxg_auth_state_changed'));
    }
    setActiveTab('intro');
  };

  const needsSubRoleOnboarding =
    isUserOnboarded &&
    ((userRole === 'investor' && !investorIdentity) || (userRole === 'company' && !companyPosition));

  const renderContent = () => {
    if (!hasSeenIntro && !isUserOnboarded) {
      return <Onboarding onComplete={handleIntroComplete} />;
    }

    if (!isUserOnboarded) {
      if (activeTab === 'aqei') {
        return <AQEI />;
      }
      return (
        <AuthPanel
          onComplete={handleAuthComplete}
          authError={authError}
          onAuthAttempt={() => setAuthError(null)}
        />
      );
    }

    const effectiveTab = canRoleAccessTab(userRole, activeTab) ? activeTab : 'dashboard';

    if (effectiveTab.startsWith('market-forex-order-')) {
      const orderId = effectiveTab.replace('market-forex-order-', '');
      return <ForexMarket setActiveTab={setActiveTab} view="order" orderId={orderId} />;
    }

    switch (effectiveTab) {
      case 'landing':
        return (
          <LandingPage
            onNavigateToAuth={handleNavigateToAuth}
            onNavigateToDashboard={() => setActiveTab('dashboard')}
            onNavigateToAQEI={() => setActiveTab('aqei')}
          />
        );
      case 'dashboard':
        return (
          <Dashboard
            setActiveTab={setActiveTab}
            userRole={userRole}
            investorIdentity={investorIdentity}
            companyPosition={companyPosition}
          />
        );
      case 'tokenisation-hub':
        return <TokenisationHub setActiveTab={setActiveTab} />;
      case 'kyc-kyb':
        return <KycKybCenter />;
      case 'issuer-dashboard':
        return <IssuerDashboard setActiveTab={setActiveTab} />;
      case 'governance-audit':
        return <ComplianceGovernanceHub />;
      case 'integrations':
        return <InstitutionalIntegrationsHub setActiveTab={setActiveTab} />;
      case 'wallet':
        return <Wallet setActiveTab={setActiveTab} />;
      case 'portfolio':
        return <Portfolio setActiveTab={setActiveTab} />;
      case 'marketplace':
        return (
          <Marketplace
            onNavigateToCompany={handleNavigateToCompany}
            onNavigateToOnboarding={() => setActiveTab('company-onboarding')}
            setActiveTab={setActiveTab}
          />
        );
      case 'trade':
        return <Trade setActiveTab={setActiveTab} />;
      case 'ipo-launch':
        return <IPOLaunchHub setActiveTab={setActiveTab} />;
      case 'algo-trading':
        return <AlgorithmicTradingDesk setActiveTab={setActiveTab} />;
      case 'valuation-workbench':
        return <ValuationWorkbench setActiveTab={setActiveTab} />;
      case 'index':
        return <Index setActiveTab={setActiveTab} />;
      case 'aqei':
        return <AQEI />;
      case 'reports':
        return <ReportViewer setActiveTab={setActiveTab} />;
      case 'tax-compliance':
        return <TaxComplianceModule setActiveTab={setActiveTab} />;
      case 'settings':
        return (
          <Settings
            userRole={userRole}
            investorIdentity={investorIdentity}
            companyPosition={companyPosition}
            onRoleChange={handleRoleChange}
            onUpdateSubRole={handleUpdateSubRole}
            setActiveTab={setActiveTab}
          />
        );
      case 'company-profile':
        return (
          <CompanyProfile
            companyId={selectedCompanyId}
            onBack={() => setActiveTab('marketplace')}
            setActiveTab={setActiveTab}
          />
        );
      case 'company-onboarding':
        return (
          <CompanyOnboarding
            onBack={() => setActiveTab('marketplace')}
            setActiveTab={setActiveTab}
          />
        );
      case 'activity':
        return <ActivityCenter setActiveTab={setActiveTab} />;
      case 'intelligence-ngx':
        return <AQXIntelligence setActiveTab={setActiveTab} />;
      case 'intelligence-ngx-assistant':
        return <AQXAssistant setActiveTab={setActiveTab} />;
      case 'payouts':
        return <PayoutsCenter setActiveTab={setActiveTab} />;
      case 'payouts-q4':
        return <PayoutsCenter setActiveTab={setActiveTab} initialView="q4-dividend" />;
      case 'payouts-q3':
        return <PayoutsCenter setActiveTab={setActiveTab} initialView="q3-history" />;
      case 'performance':
        return <PerformanceAnalytics setActiveTab={setActiveTab} />;
      case 'performance-1M':
        return <PerformanceAnalytics setActiveTab={setActiveTab} initialRange="1M" />;
      case 'performance-3M':
        return <PerformanceAnalytics setActiveTab={setActiveTab} initialRange="3M" />;
      case 'performance-6M':
        return <PerformanceAnalytics setActiveTab={setActiveTab} initialRange="6M" />;
      case 'performance-1Y':
        return <PerformanceAnalytics setActiveTab={setActiveTab} initialRange="1Y" />;
      case 'performance-ALL':
        return <PerformanceAnalytics setActiveTab={setActiveTab} initialRange="ALL" />;
      case 'search':
        return (
          <GlobalSearch
            setActiveTab={setActiveTab}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onNavigateToCompany={handleNavigateToCompany}
          />
        );
      case 'market-secondary':
        return <SecondaryMarket setActiveTab={setActiveTab} initialView="hub" />;
      case 'market-secondary-asset-paystack':
        return <SecondaryMarket setActiveTab={setActiveTab} initialView="asset" assetSlug="paystack-payst" />;
      case 'market-secondary-trade-paystack':
        return <SecondaryMarket setActiveTab={setActiveTab} initialView="trade" assetSlug="paystack-payst" tradeType="buy" />;
      case 'market-secondary-confirmation':
        return <SecondaryMarket setActiveTab={setActiveTab} initialView="confirmation" />;
      case 'market-forex':
        return <ForexMarket setActiveTab={setActiveTab} view="hub" />;
      case 'market-forex-confirmation':
        return <ForexMarket setActiveTab={setActiveTab} view="confirmation" />;
      case 'market-forex-history':
        return <ForexMarket setActiveTab={setActiveTab} view="history" />;
      case 'market-forex-liquidity':
        return <ForexMarket setActiveTab={setActiveTab} view="liquidity" />;
      case 'market-forex-positions':
        return <ForexMarket setActiveTab={setActiveTab} view="positions" />;
      case 'market-forex-analytics':
        return <ForexMarket setActiveTab={setActiveTab} view="analytics" />;
      default:
        if (effectiveTab.startsWith('market-forex-pair-')) {
          const pairSlug = effectiveTab.replace('market-forex-pair-', '');
          return <ForexMarket setActiveTab={setActiveTab} view="pair" pairSlug={pairSlug} />;
        }
        if (effectiveTab.startsWith('market-forex-trade-')) {
          const pairSlug = effectiveTab.replace('market-forex-trade-', '');
          return <ForexMarket setActiveTab={setActiveTab} view="trade" pairSlug={pairSlug} />;
        }
        if (effectiveTab.startsWith('market-forex-order-')) {
          const orderId = effectiveTab.replace('market-forex-order-', '');
          return <ForexMarket setActiveTab={setActiveTab} view="order" orderId={orderId} />;
        }
        return (
          <Dashboard
            setActiveTab={setActiveTab}
            userRole={userRole}
            investorIdentity={investorIdentity}
            companyPosition={companyPosition}
          />
        );
    }
  };

  const mainContent = () => {
    if (!authChecked) return <div role="status" className="p-4 text-xs text-white">Checking session...</div>;
    if (needsSubRoleOnboarding) {
      return (
        <RoleOnboardingGate
          initialRole={userRole}
          onComplete={handleRoleOnboardingComplete}
        />
      );
    }
    if (activeTab === 'admin' && isUserOnboarded && userRole === 'admin') {
      return <AdminPanel onExit={() => setActiveTab('dashboard')} />;
    }

    if (!hasSeenIntro && !isUserOnboarded) {
      return renderContent();
    }

    return (
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        userRole={userRole}
        investorIdentity={investorIdentity}
        companyPosition={companyPosition}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isAuthenticated={isUserOnboarded}
      >
        {renderContent()}
      </Layout>
    );
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <InitialLoader key="initial-loader" onLoaded={() => setIsLoading(false)} />
        )}
      </AnimatePresence>
      <div role="status" className="relative z-[100] bg-amber-300 px-3 py-1 text-center text-[11px] font-semibold text-black">
        Prototype: some data and integrations are simulated. Trading, wallet operations and card funding are unavailable.
      </div>
      {mainContent()}
      <CookieConsentBanner />
    </>
  );
}
