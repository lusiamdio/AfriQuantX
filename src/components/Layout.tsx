import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Store,
  BrainCircuit,
  Settings,
  LogOut,
  Bell,
  Search,
  User,
  Wallet,
  ArrowRightLeft,
  BarChart3,
  ShieldAlert,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Rocket,
  Cpu,
  Calculator,
  Layers,
  BellRing,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Zap,
  X,
  Scale,
  Building2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { CommandPalette } from './CommandPalette';
import { ThemeToggleSwitch } from'./ThemeToggleSwitch';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  canRoleAccessTab,
  getCompanyPositionMeta,
  getInvestorIdentityMeta,
  type CompanyPosition,
  type InvestorIdentity,
  type WorkspaceRole,
} from '../lib/roleAccess';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
  userRole?: WorkspaceRole;
  investorIdentity?: InvestorIdentity | null;
  companyPosition?: CompanyPosition | null;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  isAuthenticated?: boolean;
}

const allNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  // Investor & Market Discovery
  { id: 'marketplace', label: 'RWA Marketplace', icon: Store },
  { id: 'index', label: 'AQX RWA100 Index', icon: BarChart3 },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'wallet', label: 'NXG Wallet', icon: Wallet },
  { id: 'market-secondary', label: 'Secondary Market', icon: ArrowRightLeft },
  { id: 'market-forex', label: 'Forex Market', icon: TrendingUp },
  { id: 'trade', label: 'Execution Desk', icon: ArrowRightLeft },
  { id: 'algo-trading', label: 'Algo Execution', icon: Cpu },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
  // Company / Issuer Exclusive Structuring & Issuance
  { id: 'issuer-dashboard', label: 'Issuer Console', icon: Building2 },
  { id: 'tokenisation-hub', label: 'Tokenisation Hub', icon: Layers },
  { id: 'ipo-launch', label: 'Capital Raise & IPO', icon: Rocket },
  // Role-adapted Compliance, Valuation, Distributions & Reports
  { id: 'kyc-kyb', label: 'KYC / KYB Center', icon: ShieldCheck },
  { id: 'valuation-workbench', label: 'Valuation Models', icon: Calculator },
  { id: 'payouts', label: 'Distributions', icon: ArrowRightLeft },
  { id: 'tax-compliance', label: 'Tax & Compliance', icon: Scale },
  { id: 'reports', label: 'Reports & Audits', icon: BarChart3 },
  { id: 'integrations', label: 'Integrations Hub', icon: Layers },
  // Investor Intelligence
  { id: 'aqei', label: 'AQEI Intelligence', icon: BrainCircuit },
  // Governance & Admin
  { id: 'governance-audit', label: 'Governance & Audit', icon: ShieldCheck },
  { id: 'activity', label: 'Activity Center', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'admin', label: 'Admin Console', icon: ShieldAlert },
];

export function Layout({
  children,
  activeTab,
  setActiveTab,
  onLogout,
  userRole = 'investor',
  investorIdentity = null,
  companyPosition = null,
  isAuthenticated,
}: LayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const isAuthed = isAuthenticated === true;

  const currentUserName =
    typeof window !== 'undefined'
      ? localStorage.getItem('userName') ||
        (localStorage.getItem('userEmail') ? localStorage.getItem('userEmail')!.split('@')[0] : 'Participant')
      : 'Participant';

  const roleBadgeLabel =
    userRole === 'company'
      ? `Company · ${getCompanyPositionMeta(companyPosition).label}`
      : userRole === 'admin'
        ? 'Platform Administrator'
        : `Investor · ${getInvestorIdentityMeta(investorIdentity).label}`;

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      localStorage.setItem('sidebar_collapsed', (!prev).toString());
      return !prev;
    });
  };

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [toastNotification, setToastNotification] = useState<any | null>(null);

  useEffect(() => {
    setNotifications([
      {
        id: 'notif-init-1',
        title: 'Compliance Gateway Ready',
        message: 'KYC/KYB identity gates and SPV registries active across priority corridors.',
        time: 'Just now',
        read: false,
        type: 'info',
      },
      {
        id: 'notif-init-2',
        title: 'AQX RWA100 Update',
        message: 'Multi-sector benchmark recalculated across 8 African corridors.',
        time: '2m ago',
        read: false,
        type: 'market',
      },
    ]);
    setUnreadCount(2);

    const liveEventPool = [
      { title: 'Distribution Ledger Sync', message: 'Quarterly pro-rata calculation verified across active unit holders.', type: 'settlement' },
      { title: 'Bookbuilding Telemetry', message: 'Primary institutional allocation tranche updated in issuer vault.', type: 'ipo' },
      { title: 'Pre-Trade Risk Check', message: 'Allowlist & jurisdiction rules passed for settlement window.', type: 'risk' },
    ];

    let eventIdx = 0;
    const interval = setInterval(() => {
      const selected = liveEventPool[eventIdx % liveEventPool.length];
      eventIdx++;

      const newNotif = {
        id: `notif-live-${Date.now()}`,
        title: selected.title,
        message: selected.message,
        time: 'Just now',
        read: false,
        type: selected.type,
      };

      setNotifications((prev) => [newNotif, ...prev.slice(0, 19)]);
      setUnreadCount((prev) => prev + 1);
      setToastNotification(newNotif);
      setTimeout(() => {
        setToastNotification((curr: any) => (curr?.id === newNotif.id ? null : curr));
      }, 4500);
    }, 18000);

    let channel: any = null;
    if (isSupabaseConfigured) {
      try {
        channel = supabase
          .channel('realtime-notifications')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (payload) => {
            const newNotif = {
              id: payload.new.id,
              title: 'New Transaction',
              message: `A new ${payload.new.type} of ${payload.new.amount} was recorded.`,
              time: 'Just now',
              read: false,
              type: 'trade',
            };
            setNotifications((prev) => [newNotif, ...prev]);
            setUnreadCount((prev) => prev + 1);
            setToastNotification(newNotif);
            setTimeout(() => setToastNotification(null), 4000);
          })
          .subscribe();
      } catch (e) {
        console.warn('Realtime notifications channel unavailable:', e);
      }
    }

    const handlePriceAlert = (e: any) => {
      if (e.detail?.alert) {
        const alert = e.detail.alert;
        const actualPrice = e.detail.actualPrice ?? alert.targetPrice;
        const newNotif = {
          id: `price-alert-${alert.id}-${Date.now()}`,
          title: `Price Alert: ${alert.symbol}`,
          message: `${alert.assetName} crossed ${alert.currency} ${actualPrice.toFixed(2)}.`,
          time: 'Just now',
          read: false,
          type: 'alert',
        };
        setNotifications((prev) => [newNotif, ...prev.slice(0, 24)]);
        setUnreadCount((prev) => prev + 1);
        setToastNotification(newNotif);
        setTimeout(() => {
          setToastNotification((curr: any) => (curr?.id === newNotif.id ? null : curr));
        }, 6000);
      }
    };
    window.addEventListener('nxg_price_alert_triggered', handlePriceAlert);

    return () => {
      clearInterval(interval);
      window.removeEventListener('nxg_price_alert_triggered', handlePriceAlert);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (e) {}
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      } else if (e.key === '/' && document.activeElement !== searchInputRef.current && !isCommandPaletteOpen) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen]);

  const navItems = allNavItems
    .filter((item) => canRoleAccessTab(userRole, item.id))
    .map((item) => {
      if (userRole === 'company' && companyPosition === 'HEDGE_FUND') {
        if (item.id === 'issuer-dashboard') return { ...item, label: 'Fund Console' };
        if (item.id === 'ipo-launch') return { ...item, label: 'Fundraise & LP Books' };
      }
      if (userRole === 'investor' && investorIdentity === 'VENTURE_CAPITAL') {
        if (item.id === 'marketplace') return { ...item, label: 'Venture & RWA Deals' };
      }
      return item;
    });

  const mobileNavIds =
    userRole === 'company'
      ? ['dashboard', 'issuer-dashboard', 'tokenisation-hub', 'settings']
      : ['dashboard', 'marketplace', 'portfolio', 'settings'];

  const mobileNavItems = navItems.filter((item) => mobileNavIds.includes(item.id));

  return (
    <div className="flex h-screen bg-[#07090E] text-slate-100 overflow-hidden font-sans selection:bg-emerald-400/30">
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={setActiveTab}
        userRole={userRole}
      />

      {/* Sidebar (Desktop) */}
      <aside
        className={cn(
          'hidden md:flex flex-col bg-[#0A0D14] relative z-20 transition-all duration-200 shrink-0',
          isSidebarCollapsed ? 'w-14' : 'w-52'
        )}
      >
        <button
          onClick={toggleSidebar}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute top-4 -right-2.5 w-5 h-5 bg-[#131823] text-slate-200 rounded-full flex items-center justify-center hover:bg-white hover:text-slate-950 transition-colors cursor-pointer z-50"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-3 h-3"/> : <ChevronLeft className="w-3 h-3"/>}
        </button>

        {/* Brand */}
        <div
          className={cn(
            'flex items-center gap-2 transition-all duration-200',
            isSidebarCollapsed ? 'justify-center px-2 py-3' : 'px-3.5 py-3'
          )}
        >
          <img src="/logo.svg"alt="AfriQuantX Logo"className="w-6 h-6 object-contain shrink-0"/>
          {!isSidebarCollapsed && (
            <span className="font-bold text-sm tracking-tight text-white whitespace-nowrap">AfriQuantX</span>
          )}
        </div>

        {/* Search Bar on top of Dashboard link */}
        <div className={cn('pb-2 shrink-0', isSidebarCollapsed ?'px-1.5 flex justify-center':'px-2.5')}>
          {isSidebarCollapsed ? (
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="w-8 h-8 flex items-center justify-center bg-[#121723] hover:bg-[#192030] rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Search or jump to (⌘K)"
            >
              <Search className="w-3.5 h-3.5"/>
            </button>
          ) : (
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="w-full flex items-center gap-2 bg-[#121723] hover:bg-[#171E2C] rounded-lg px-2.5 py-1.5 text-slate-400 hover:text-white transition-colors text-[11px] cursor-pointer"
              title="Search or jump to (⌘K)"
            >
              <Search className="w-3 h-3 shrink-0"/>
              <span className="text-[11px] font-medium flex-1 text-left truncate">Search or jump...</span>
              <kbd className="px-1 py-0.5 bg-white/5 rounded text-[9px] font-mono text-slate-400">⌘K</kbd>
            </button>
          )}
        </div>

        {/* Extra-small clean navigation links */}
        <nav className="flex-1 px-2 py-0.5 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
'w-full flex items-center rounded-md transition-colors relative group text-[11px] font-medium cursor-pointer',
                  isSidebarCollapsed ? 'justify-center p-2' : 'px-2.5 py-1.5 gap-2',
                  isActive
                    ? 'bg-white text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                )}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <Icon className={cn('w-3.5 h-3.5 shrink-0', isActive ?'text-slate-950':'text-slate-400 group-hover:text-white')} />
                {!isSidebarCollapsed && (
                  <span className="truncate text-[11px] whitespace-nowrap">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section: Role Identity + Theme Toggle & Notifications Bell */}
        <div className="mt-auto flex flex-col bg-[#090C12] shrink-0">
          {isAuthed && (
            <div className={cn('p-2', isSidebarCollapsed ?'flex flex-col items-center gap-1.5':'space-y-1.5')}>
              {isSidebarCollapsed ? (
                <button
                  onClick={() => setActiveTab('settings')}
                  className="w-8 h-8 rounded-full bg-[#131823] flex items-center justify-center text-white hover:bg-[#192030] cursor-pointer"
                  title={`${currentUserName} (${roleBadgeLabel})`}
                >
                  <User className="w-3.5 h-3.5"/>
                </button>
              ) : (
                <div
                  onClick={() => setActiveTab('settings')}
                  className="p-2 rounded-lg bg-[#111622] cursor-pointer hover:bg-[#161D2C] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      {userRole === 'company' ? (
                        <Building2 className="w-3 h-3 text-sky-400"/>
                      ) : (
                        <User className="w-3 h-3 text-emerald-400"/>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-white truncate">{currentUserName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{roleBadgeLabel}</p>
                    </div>
                  </div>
                </div>
              )}

              {onLogout && (
                <button
                  onClick={onLogout}
                  className={cn(
'flex items-center justify-center bg-white/[0.03] hover:bg-rose-500/10 text-slate-400 hover:text-rose-300 transition-colors text-[11px] font-medium rounded-md cursor-pointer',
                    isSidebarCollapsed ? 'w-8 h-8 p-0' : 'w-full py-1 gap-1.5'
                  )}
                  title={isSidebarCollapsed ? 'Sign Out' : undefined}
                >
                  <LogOut className="w-3 h-3"/>
                  {!isSidebarCollapsed && <span>Sign Out</span>}
                </button>
              )}
            </div>
          )}

          {/* Theme Toggle & Notification Bell (Transparent background & no border) */}
          <div
            className={cn(
              'px-2.5 py-1.5 flex items-center justify-between gap-2',
              isSidebarCollapsed ? 'flex-col justify-center' : ''
            )}
          >
            <ThemeToggleSwitch scale={isSidebarCollapsed ?'micro':'compact'} id="sidebar-bottom-theme-toggle"/>

            <div className="relative"ref={notificationsRef}>
              <button
                onClick={handleNotificationClick}
                className="relative p-1.5 rounded-lg bg-transparent text-slate-400 hover:text-white transition-colors cursor-pointer focus:outline-none shadow-none"
                title="Notifications"
                aria-label="Toggle Notifications"
              >
                <Bell className="w-4 h-4"/>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"/>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.16 }}
                    className={cn(
                      'fixed z-[99999] bottom-12 w-72 sm:w-[340px] bg-[#0D111A] rounded-xl shadow-2xl overflow-hidden',
                      isSidebarCollapsed ? 'left-16' : 'left-54'
                    )}
                    style={{ backgroundColor:'#0D111A'}}
                  >
                    <div
                      className="p-2.5 flex justify-between items-center bg-[#121826]"
                      style={{ backgroundColor:'#121826'}}
                    >
                      <h3 className="font-semibold text-white text-xs">Notifications & Alerts</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                          {notifications.length} items
                        </span>
                        {notifications.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setNotifications([]);
                              setUnreadCount(0);
                            }}
                            title="Clear notifications"
                            className="text-slate-400 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3"/>
                          </button>
                        )}
                      </div>
                    </div>

                    <div
                      className="max-h-[280px] overflow-y-auto space-y-0.5 bg-[#0D111A]"
                      style={{ backgroundColor:'#0D111A'}}
                    >
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              setActiveTab('activity');
                              setShowNotifications(false);
                            }}
                            className="p-2.5 hover:bg-[#161D2C] transition-colors cursor-pointer"
                            style={{ backgroundColor: !notif.read ?'#101624':'#0D111A'}}
                          >
                            <div className="flex justify-between items-start mb-0.5 gap-2">
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                {notif.type === 'alert' ? (
                                  <BellRing className="w-3 h-3 text-amber-400 shrink-0"/>
                                ) : notif.type === 'trade' || notif.type === 'settlement' ? (
                                  <ArrowRightLeft className="w-3 h-3 text-emerald-400 shrink-0"/>
                                ) : notif.type === 'signal' ? (
                                  <Zap className="w-3 h-3 text-sky-400 shrink-0"/>
                                ) : notif.type === 'risk' ? (
                                  <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0"/>
                                ) : (
                                  <Bell className="w-3 h-3 text-slate-400 shrink-0"/>
                                )}
                                <h4 className="text-[11px] font-semibold text-white truncate">{notif.title}</h4>
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono shrink-0">{notif.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-snug pl-4.5">{notif.message}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-slate-400 text-xs">
                          <Bell className="w-5 h-5 text-slate-600 mx-auto mb-1.5"/>
                          No active notifications
                        </div>
                      )}
                    </div>

                    <div
                      className="p-2 bg-[#121826] flex items-center justify-between"
                      style={{ backgroundColor:'#121826'}}
                    >
                      <button
                        onClick={() => {
                          setUnreadCount(0);
                          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                        }}
                        className="text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <CheckCheck className="w-3 h-3 text-emerald-400"/>
                        Mark all read
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('activity');
                          setShowNotifications(false);
                        }}
                        className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        View Activity
                        <ChevronRight className="w-3 h-3"/>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#07090E]">
        <div className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-3 pb-16 md:pb-5 z-10 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${userRole}-${activeTab}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-[1220px] mx-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Real-time Notification Toast (Opaque, High Z-Index) */}
        <AnimatePresence>
          {toastNotification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="fixed top-4 right-4 z-[99999] max-w-xs w-[calc(100vw-2rem)] md:w-80 bg-[#0D111A] p-3 rounded-lg shadow-2xl flex items-start gap-2.5"
              style={{ backgroundColor:'#0D111A'}}
            >
              <Bell className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5"/>
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => {
                  setActiveTab('activity');
                  setToastNotification(null);
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="text-[11px] font-semibold text-white truncate">{toastNotification.title}</p>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{toastNotification.time}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">{toastNotification.message}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setToastNotification(null);
                }}
                className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Dismiss alert"
              >
                <X className="w-3.5 h-3.5"/>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-12 bg-[#0A0D14] z-50 px-2 flex items-center justify-around">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
'flex flex-col items-center justify-center px-2.5 py-1 rounded-md transition-colors cursor-pointer',
                isActive ? 'bg-white text-slate-950' : 'text-slate-400 hover:text-white'
              )}
            >
              <Icon className="w-3.5 h-3.5"/>
              <span className="text-[9px] font-medium mt-0.5 whitespace-nowrap">{item.label.split('')[0]}</span>
            </button>
          );
        })}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex flex-col items-center justify-center px-2.5 py-1 text-slate-400 hover:text-white cursor-pointer"
        >
          <Search className="w-3.5 h-3.5"/>
          <span className="text-[9px] font-medium mt-0.5">Search</span>
        </button>
      </nav>
    </div>
  );
}
