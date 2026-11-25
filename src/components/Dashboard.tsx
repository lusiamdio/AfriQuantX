import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  DollarSign,
  Store,
  Briefcase,
  ChevronRight,
  Send,
  Globe,
  ArrowRightLeft,
  BarChart3,
  CheckCircle2,
  Bell,
  Settings,
  X,
  Building2,
  Layers,
  Rocket,
  ShieldCheck,
  Calculator,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  getCompanyPositionMeta,
  getInvestorIdentityMeta,
  type CompanyPosition,
  type InvestorIdentity,
  type WorkspaceRole,
} from '../lib/roleAccess';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  userRole?: WorkspaceRole;
  investorIdentity?: InvestorIdentity | null;
  companyPosition?: CompanyPosition | null;
}

const performanceSeries = [
  { name: 'Jan', value: 42000, investment: 22000 },
  { name: 'Feb', value: 46500, investment: 24000 },
  { name: 'Mar', value: 58200, investment: 32000 },
  { name: 'Apr', value: 64100, investment: 36000 },
  { name: 'May', value: 79400, investment: 45000 },
  { name: 'Jun', value: 94800, investment: 58000 },
  { name: 'Jul', value: 124500, investment: 80000 },
];

const companyCapitalSeries = [
  { name: 'Jan', raised: 380000, target: 500000 },
  { name: 'Feb', raised: 620000, target: 750000 },
  { name: 'Mar', raised: 940000, target: 1100000 },
  { name: 'Apr', raised: 1280000, target: 1400000 },
  { name: 'May', raised: 1620000, target: 1800000 },
  { name: 'Jun', raised: 1980000, target: 2200000 },
  { name: 'Jul', raised: 2450000, target: 2500000 },
];

const initialRecentActivity = [
  { id: 1, type: 'buy', title: 'Allocated Cape Urban Property Fund (AQX-CUPF)', amount: '$60,000.00', meta: 'Primary Allocation · Settled', date: '2h ago' },
  { id: 2, type: 'dividend', title: 'Standard Bank Q2 Distribution', amount: '+$1,240.50', meta: 'Pro-Rata Cash Yield', date: '1d ago' },
  { id: 3, type: 'trade', title: 'Secondary Transfer — SolarGrid Africa', amount: '+$105,250.00', meta: 'Allowlisted Counterparty', date: '2d ago' },
  { id: 4, type: 'invest', title: 'AfriLogistics Senior Secured Tranche', amount: '$22,000.00', meta: 'SPV Note · Verified', date: '3d ago' },
];

export function Dashboard({
  setActiveTab,
  userRole = 'investor',
  investorIdentity = null,
  companyPosition = null,
}: DashboardProps) {
  const [recentActivity, setRecentActivity] = useState<any[]>(initialRecentActivity);
  const [aiTone, setAiTone] = useState<'formal' | 'simplified'>('formal');
  const [askAi, setAskAi] = useState('');
  const [selectedRange, setSelectedRange] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('6M');
  const [showCustomizeAlerts, setShowCustomizeAlerts] = useState(false);
  const [marketIndices, setMarketIndices] = useState<any[]>([]);
  const [alertSettings, setAlertSettings] = useState({
    priceMovement: 5,
    newsSentiment: 'high',
    insiderActivity: true,
  });
  const [totalBalance, setTotalBalance] = useState(124500);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch('/api/market/massive/data');
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const result = await response.json();
            if (result.data) {
              setMarketIndices(result.data);
            }
          }
        }
      } catch (error) {
        console.warn('Market data polling unavailable:', error);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isSupabaseConfigured) {
        setRecentActivity(initialRecentActivity);
        return;
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setRecentActivity(initialRecentActivity);
          return;
        }

        const { data: wallets } = await supabase
          .from('wallets')
          .select('balance, currency')
          .eq('profile_id', user.id);

        if (wallets) {
          const usdWallet = wallets.find((w) => w.currency === 'USD');
          if (usdWallet) {
            setTotalBalance(Number(usdWallet.balance));
          }
        }

        const { data: transactions } = await supabase
          .from('transactions')
          .select('*')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false })
          .limit(4);

        if (transactions && transactions.length > 0) {
          const formatted = transactions.map((t) => ({
            id: t.id,
            type: t.type === 'deposit' || t.type === 'withdrawal' ? 'dividend' : t.type === 'trade' ? 'trade' : 'invest',
            title: t.reference || 'Transaction',
            amount: Number(t.amount).toLocaleString('en-US', { style:'currency', currency:'USD'}),
            meta: 'Recorded Ledger Entry',
            date: new Date(t.created_at).toLocaleDateString(),
          }));
          setRecentActivity(formatted);
        }
      } catch (err) {
        console.warn('Dashboard Supabase fetch error:', err);
      }
    };

    fetchDashboardData();
  }, []);

  // =========================================================================
  // COMPANY WORKSPACE DASHBOARD (Startup / Hedge Fund exclusive surface)
  // =========================================================================
  if (userRole === 'company') {
    const posMeta = getCompanyPositionMeta(companyPosition);
    const isHedgeFund = posMeta.id === 'HEDGE_FUND';

    return (
      <div className="space-y-4 text-slate-100">
        {/* Clean Top Workspace Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-2">
          <div>
            <p className="text-[11px] text-sky-400 font-medium mb-0.5">
              Company Workspace · {posMeta.label}
            </p>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">
              {isHedgeFund ?'Fund Structuring & AUM Command':'Issuer Capital & Tokenisation Command'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              {isHedgeFund
                ? 'Manage regulated fund unit issuances, LP subscriptions, institutional KYB verification, and NAV distribution schedules.'
                : 'Manage equity/SPV fundraising rounds, asset tokenisation workflows, audited document rooms, and investor payouts.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('tokenisation-hub')}
              className="px-3 py-1.5 rounded-lg bg-white text-slate-950 text-xs font-semibold hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isHedgeFund ? 'Structure Fund Units' : 'New Asset Application'}
            </button>
            <button
              onClick={() => setActiveTab('issuer-dashboard')}
              className="px-3 py-1.5 rounded-lg bg-[#121723] text-white text-xs font-semibold hover:bg-[#192030] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isHedgeFund ? 'Open Fund Console' : 'Open Issuer Console'}
            </button>
          </div>
        </div>

        {/* Key Institutional Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg bg-[#0D111A] p-3.5">
            <p className="text-[11px] text-slate-400">{isHedgeFund ?'Fund AUM Committed (DEMO)':'Capital Raised (DEMO)'}</p>
            <p className="text-lg font-bold font-mono text-white tabular-nums mt-1">$2,450,000</p>
            <p className="text-[11px] text-emerald-400 mt-1 font-mono tabular-nums">98.0% of target mandate</p>
          </div>
          <div className="rounded-lg bg-[#0D111A] p-3.5">
            <p className="text-[11px] text-slate-400">{isHedgeFund ?'Verified LP Allocators':'Allowlisted Investors'}</p>
            <p className="text-lg font-bold font-mono text-white tabular-nums mt-1">48</p>
            <p className="text-[11px] text-slate-400 mt-1">KYC Tier 2 & Institutional KYB</p>
          </div>
          <div className="rounded-lg bg-[#0D111A] p-3.5">
            <p className="text-[11px] text-slate-400">Compliance Readiness</p>
            <p className="text-lg font-bold font-mono text-emerald-400 tabular-nums mt-1">92%</p>
            <p className="text-[11px] text-slate-400 mt-1">SPV Deed · UBO Registry Verified</p>
          </div>
          <div className="rounded-lg bg-[#0D111A] p-3.5">
            <p className="text-[11px] text-slate-400">Next Payout Cycle</p>
            <p className="text-lg font-bold font-mono text-white tabular-nums mt-1">$84,200</p>
            <p className="text-[11px] text-slate-400 mt-1">Quarterly Pro-Rata Scheduled</p>
          </div>
        </div>

        {/* Company Quick Workflows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => setActiveTab('tokenisation-hub')}
            className="p-3 rounded-lg bg-[#0D111A] hover:bg-[#121723] transition-colors text-left cursor-pointer group"
          >
            <Layers className="w-4 h-4 text-sky-400 mb-2"/>
            <p className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors">Tokenisation Hub</p>
            <p className="text-[11px] text-slate-400 mt-0.5">13-stage workflow & 14-category vault</p>
          </button>
          <button
            onClick={() => setActiveTab('ipo-launch')}
            className="p-3 rounded-lg bg-[#0D111A] hover:bg-[#121723] transition-colors text-left cursor-pointer group"
          >
            <Rocket className="w-4 h-4 text-emerald-400 mb-2"/>
            <p className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
              {isHedgeFund ? 'Fundraise & LP Books' : 'IPO & Capital Bookbuilding'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Syndicate pricing & tranche allocations</p>
          </button>
          <button
            onClick={() => setActiveTab('kyc-kyb')}
            className="p-3 rounded-lg bg-[#0D111A] hover:bg-[#121723] transition-colors text-left cursor-pointer group"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400 mb-2"/>
            <p className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">Corporate KYB Center</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Beneficial owner & licensing verification</p>
          </button>
          <button
            onClick={() => setActiveTab('valuation-workbench')}
            className="p-3 rounded-lg bg-[#0D111A] hover:bg-[#121723] transition-colors text-left cursor-pointer group"
          >
            <Calculator className="w-4 h-4 text-slate-300 mb-2"/>
            <p className="text-xs font-semibold text-white group-hover:text-white transition-colors">Valuation Models</p>
            <p className="text-[11px] text-slate-400 mt-0.5">NAV, DCF & cap-table sensitivity</p>
          </button>
        </div>

        {/* Capital Trajectory Chart + Recent Issuance Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
          <div className="lg:col-span-2 rounded-lg bg-[#0D111A] p-3.5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  {isHedgeFund ? 'Cumulative Fund Commitment vs. Mandate Target' : 'Cumulative Capital Raised vs. Tranche Target'}
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Simulated primary commitment curve (USD equivalent)</p>
              </div>
              <button
                onClick={() => setActiveTab('issuer-dashboard')}
                className="text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                Distributions <ChevronRight className="w-3.5 h-3.5"/>
              </button>
            </div>
            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <AreaChart data={companyCapitalSeries} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="compRaised" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"stopColor="#38BDF8"stopOpacity={0.3} />
                      <stop offset="95%"stopColor="#38BDF8"stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0D111A', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="target" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={0} />
                  <Area type="monotone" dataKey="raised" stroke="#38BDF8" strokeWidth={2} fillOpacity={1} fill="url(#compRaised)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg bg-[#0D111A] p-3.5 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white mb-2.5">Issuance Milestones</h2>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 p-2 rounded-md bg-[#121723]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5"/>
                  <div>
                    <p className="text-xs font-semibold text-white">SPV Legal Entity & Deed Linked</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Passport metadata verified in vault</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-md bg-[#121723]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5"/>
                  <div>
                    <p className="text-xs font-semibold text-white">Corporate KYB & UBO Registry</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">All beneficial owners &gt;25% screened</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-md bg-[#121723]">
                  <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5"/>
                  <div>
                    <p className="text-xs font-semibold text-white">Q4 Pro-Rata Payout Ready</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Execute deterministically from Issuer Console</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('reports')}
              className="mt-3 w-full py-2 px-3 rounded-lg bg-[#121723] hover:bg-[#192030] text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              View Regulatory & Audit Reports
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // INVESTOR WORKSPACE DASHBOARD (Equity Funder / VC / Private Investor)
  // =========================================================================
  const invMeta = getInvestorIdentityMeta(investorIdentity);

  return (
    <div className="space-y-4 text-slate-100">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-2">
        <div>
          <p className="text-[11px] text-emerald-400 font-medium mb-0.5">
            Investor Workspace · {invMeta.label}
          </p>
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">
            Portfolio & Allocation Overview
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">{invMeta.focusSummary}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('marketplace')}
            className="px-3 py-1.5 rounded-lg bg-white text-slate-950 text-xs font-semibold hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Browse RWA Offerings
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className="px-3 py-1.5 rounded-lg bg-[#121723] text-white text-xs font-semibold hover:bg-[#192030] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Holdings
          </button>
        </div>
      </div>

      {/* Top Row: Portfolio Summary & Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        <div className="lg:col-span-1 rounded-lg bg-[#0D111A] p-3.5 flex flex-col justify-between gap-3.5">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Globe className="w-3.5 h-3.5 text-emerald-400"/>
                Multi-Asset Portfolio
              </span>
              <span className="font-mono text-emerald-400 tabular-nums">+12.5% YTD</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-mono text-white tracking-tight tabular-nums">
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2.5 bg-[#121723] rounded-md p-2.5">
            <div>
              <p className="text-[11px] text-slate-400">Active Positions</p>
              <p className="text-base font-bold font-mono text-white tabular-nums mt-0.5">5</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Q3 Distributions</p>
              <p className="text-base font-bold font-mono text-emerald-400 tabular-nums mt-0.5">$1,240</p>
            </div>
          </div>
        </div>

        {/* Portfolio Intelligence Panel */}
        <div className="lg:col-span-2 rounded-lg bg-[#0D111A] p-3.5 flex flex-col justify-between gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <span>AQX Intelligence Brief</span>
              <span aria-hidden="true"className="text-slate-600">·</span>
              <span className="text-slate-400 font-normal">Low Portfolio Concentration Risk</span>
            </div>

            <div className="flex items-center gap-1 bg-[#121723] p-0.5 rounded-md">
              <button
                onClick={() => setAiTone('formal')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${ aiTone ==='formal'?'bg-white text-slate-950':'text-slate-400 hover:text-white'}`}
              >
                Institutional
              </button>
              <button
                onClick={() => setAiTone('simplified')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${ aiTone ==='simplified'?'bg-white text-slate-950':'text-slate-400 hover:text-white'}`}
              >
                Summary
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm md:text-base font-bold text-white mb-1">
              {invMeta.id === 'VENTURE_CAPITAL'
                ? 'Series A & Infrastructure Tranches Showing Strong Institutional Demand'
                : invMeta.id === 'EQUITY_FUNDER'
                  ? 'Revenue-Backed SPV Allocations Within Target Yield Band'
                  : 'Diversified Yield & Secondary Liquidity Windows Active'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              {aiTone === 'formal'
                ? 'Cross-corridor exposure across Commercial Real Estate, Renewable Energy, and Healthcare RWA notes remains balanced. Upcoming quarterly pro-rata distribution records close at month-end.'
                : 'Your diversified RWA holdings across property, clean energy, and logistics are on schedule for their quarterly cash distributions.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={askAi}
                onChange={(e) => setAskAi(e.target.value)}
                onFocus={() => setActiveTab('intelligence-ngx-assistant')}
                placeholder="Ask portfolio research assistant..."
                className="w-full bg-[#121723] rounded-lg pl-3 pr-9 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
              <button
                onClick={() => setActiveTab('intelligence-ngx-assistant')}
                aria-label="Open Assistant"
                className="absolute right-1 p-1.5 bg-white text-slate-950 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              >
                <Send className="w-3 h-3"/>
              </button>
            </div>
            <button
              onClick={() => setActiveTab('intelligence-ngx')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Deep Analysis <ChevronRight className="w-3.5 h-3.5"/>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions (Strictly Investor Features) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab('marketplace')}
          className="p-3 rounded-lg bg-[#0D111A] hover:bg-[#121723] transition-colors flex items-center gap-2.5 text-left cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-md bg-[#141A26] flex items-center justify-center shrink-0 text-emerald-400">
            <Store className="w-3.5 h-3.5"/>
          </div>
          <div>
            <p className="text-xs font-semibold text-white">RWA Marketplace</p>
            <p className="text-[10px] text-slate-400">Primary offerings</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('market-secondary')}
          className="p-3 rounded-lg bg-[#0D111A] hover:bg-[#121723] transition-colors flex items-center gap-2.5 text-left cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-md bg-[#141A26] flex items-center justify-center shrink-0 text-sky-400">
            <ArrowRightLeft className="w-3.5 h-3.5"/>
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Secondary Desk</p>
            <p className="text-[10px] text-slate-400">Allowlisted transfers</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('index')}
          className="p-3 rounded-lg bg-[#0D111A] hover:bg-[#121723] transition-colors flex items-center gap-2.5 text-left cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-md bg-[#141A26] flex items-center justify-center shrink-0 text-amber-400">
            <BarChart3 className="w-3.5 h-3.5"/>
          </div>
          <div>
            <p className="text-xs font-semibold text-white">AQX RWA100</p>
            <p className="text-[10px] text-slate-400">Pan-African index</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('payouts')}
          className="p-3 rounded-lg bg-[#0D111A] hover:bg-[#121723] transition-colors flex items-center gap-2.5 text-left cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-md bg-[#141A26] flex items-center justify-center shrink-0 text-slate-200">
            <Briefcase className="w-3.5 h-3.5"/>
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Distributions</p>
            <p className="text-[10px] text-slate-400">Yield & tax records</p>
          </div>
        </button>
      </div>

      {/* Live Global Markets Strip if available */}
      {marketIndices.length > 0 && (
        <div className="rounded-lg bg-[#0D111A] p-3.5">
          <div className="flex justify-between items-center mb-2.5">
            <h2 className="text-xs font-semibold text-white">Reference Indices</h2>
            <span className="text-[11px] text-slate-400">Market Snapshot</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {marketIndices.map((idxItem) => (
              <div key={idxItem.id} className="p-2.5 rounded-md bg-[#121723] flex justify-between items-center">
                <div>
                  <p className="text-[11px] text-slate-400">{idxItem.name}</p>
                  <p className="text-sm font-bold font-mono text-white tabular-nums mt-0.5">
                    {idxItem.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <span className="text-[11px] font-mono font-semibold text-emerald-400 tabular-nums">{idxItem.change}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Chart */}
      <div className="rounded-lg bg-[#0D111A] p-3.5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-2.5">
          <div>
            <h2 className="text-sm font-semibold text-white">Net Portfolio Valuation vs. Capital Deployed</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Time-weighted valuation trajectory (USD)</p>
          </div>
          <div className="flex bg-[#121723] p-0.5 rounded-md">
            {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedRange(period)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${ selectedRange === period ?'bg-white text-slate-950':'text-slate-400 hover:text-white'}`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <AreaChart data={performanceSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue"x1="0"y1="0"x2="0"y2="1">
                  <stop offset="5%"stopColor="#10B981"stopOpacity={0.3} />
                  <stop offset="95%"stopColor="#10B981"stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0D111A', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="investment" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={0} />
              <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Grid: Activity & Upcoming Payouts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <div className="rounded-lg bg-[#0D111A] p-3.5">
          <div className="flex justify-between items-center mb-2.5">
            <h2 className="text-sm font-semibold text-white">Recent Allocations & Ledger Activity</h2>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowCustomizeAlerts(true)}
                className="text-[11px] font-medium text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3 h-3"/> Alert Rules
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 cursor-pointer"
              >
                View All <ChevronRight className="w-3 h-3"/>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="p-2 rounded-md bg-[#121723]/60 hover:bg-[#121723] transition-colors flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-[#141A26] flex items-center justify-center shrink-0 text-slate-300">
                    {activity.type === 'buy' ? (
                      <Store className="w-3.5 h-3.5 text-emerald-400"/>
                    ) : activity.type === 'dividend' ? (
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400"/>
                    ) : activity.type === 'trade' ? (
                      <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400"/>
                    ) : (
                      <Briefcase className="w-3.5 h-3.5 text-slate-300"/>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{activity.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {activity.meta} · {activity.date}
                    </p>
                  </div>
                </div>
                <p className="text-xs font-mono font-semibold text-white tabular-nums shrink-0">{activity.amount}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-[#0D111A] p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <h2 className="text-sm font-semibold text-white">Scheduled Distributions</h2>
              <button
                onClick={() => setActiveTab('payouts')}
                className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 cursor-pointer"
              >
                Distribution Schedule <ChevronRight className="w-3 h-3"/>
              </button>
            </div>

            <div className="p-3 rounded-lg bg-[#121723] mb-2.5">
              <p className="text-[11px] text-slate-400">Estimated Q4 Cash Entitlement (Illustrative)</p>
              <p className="text-xl font-bold font-mono text-white tabular-nums mt-1">$450.00</p>
              <div className="w-full bg-white/10 rounded-full h-1.5 my-2 overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full w-[75%]"/>
              </div>
              <p className="text-[11px] text-slate-400">Record snapshot in 14 days</p>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('payouts-q3')}
            className="p-2.5 rounded-lg bg-[#121723] hover:bg-[#171E2E] transition-colors cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0"/>
              <div>
                <p className="text-xs font-medium text-white">Q3 Settled Distribution</p>
                <p className="text-[11px] text-slate-400">Jul 31, 2026</p>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-400 tabular-nums">+$320.00</span>
          </div>
        </div>
      </div>

      {/* Customize Alerts Modal */}
      {showCustomizeAlerts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0D111A] rounded-xl p-4 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-3 pb-1">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-emerald-400"/>
                Portfolio Alert Preferences
              </h3>
              <button onClick={() => setShowCustomizeAlerts(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-3.5 h-3.5"/>
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>Price Movement Threshold</span>
                  <span className="font-mono text-white tabular-nums">{alertSettings.priceMovement}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={alertSettings.priceMovement}
                  onChange={(e) => setAlertSettings({ ...alertSettings, priceMovement: parseInt(e.target.value, 10) })}
                  className="w-full accent-emerald-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-300 block">Research Alert Sensitivity</label>
                <select
                  value={alertSettings.newsSentiment}
                  onChange={(e) => setAlertSettings({ ...alertSettings, newsSentiment: e.target.value })}
                  className="w-full bg-[#121723] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                >
                  <option value="all">All Material Filings</option>
                  <option value="medium">Medium & High Impact</option>
                  <option value="high">High Impact Only</option>
                </select>
              </div>

              <button
                onClick={() => setShowCustomizeAlerts(false)}
                className="w-full py-2 rounded-lg bg-white text-slate-950 font-semibold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
