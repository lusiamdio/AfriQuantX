import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, ArrowRight, AlertCircle, Briefcase, Building2, Check, Shield } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { cn } from '../lib/utils';
import {
  COMPANY_POSITIONS,
  INVESTOR_IDENTITIES,
  getCompanyPositionMeta,
  getInvestorIdentityMeta,
  type CompanyPosition,
  type InvestorIdentity,
  type WorkspaceRole,
} from '../lib/roleAccess';

interface AuthPanelProps {
  onComplete: () => void;
  authError?: string | null;
  onAuthAttempt?: () => void;
}

type AuthMode = 'signin' | 'signup';

function MarketDepthPreview() {
  const [candles, setCandles] = useState<{ x: number; open: number; close: number; high: number; low: number }[]>([]);

  useEffect(() => {
    const initialCandles = [];
    let basePrice = 284;
    for (let i = 0; i < 24; i++) {
      const open = basePrice;
      const change = (Math.random() - 0.46) * 11;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * 4;
      const low = Math.min(open, close) - Math.random() * 4;
      initialCandles.push({ x: i, open, close, high, low });
      basePrice = close;
    }
    setCandles(initialCandles);
  }, []);

  const prices = candles.flatMap((c) => [c.high, c.low]);
  const maxPrice = prices.length ? Math.max(...prices) : 320;
  const minPrice = prices.length ? Math.min(...prices) : 240;
  const priceRange = maxPrice - minPrice || 1;
  const lastClose = candles.length ? candles[candles.length - 1].close : 292.4;

  return (
    <div className="w-full max-w-lg space-y-2.5 select-none">
      <div className="bg-[#0D111A] rounded-lg p-3.5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <span>AQX RWA100 Composite</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-mono text-emerald-400 tabular-nums">+1.84%</span>
          </div>
          <span className="text-xs font-mono text-slate-400">DEMO BENCHMARK</span>
        </div>

        <div className="relative h-44 w-full">
          <div className="absolute right-0 top-0 text-[11px] font-mono text-slate-500 tabular-nums">
            {maxPrice.toFixed(1)}
          </div>
          <div className="absolute right-0 bottom-1 text-[11px] font-mono text-slate-500 tabular-nums">
            {minPrice.toFixed(1)}
          </div>
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
            {candles.map((c, i) => {
              const w = 100 / Math.max(1, candles.length);
              const x = c.x * w + w / 2;
              const yHigh = ((maxPrice - c.high) / priceRange) * 100;
              const yLow = ((maxPrice - c.low) / priceRange) * 100;
              const yOpen = ((maxPrice - c.open) / priceRange) * 100;
              const yClose = ((maxPrice - c.close) / priceRange) * 100;
              const isUp = c.close >= c.open;
              const top = Math.min(yOpen, yClose);
              const h = Math.max(2, Math.abs(yOpen - yClose));

              return (
                <g key={i}>
                  <line x1={`${x}%`} y1={`${yHigh}%`} x2={`${x}%`} y2={`${yLow}%`} stroke={isUp ? '#34D399' : '#94A3B8'} strokeWidth={1.2} />
                  <rect
                    x={`${x - w * 0.28}%`}
                    y={`${top}%`}
                    width={`${w * 0.56}%`}
                    height={`${h}%`}
                    fill={isUp ? '#34D399' : 'transparent'}
                    stroke={isUp ? '#34D399' : '#94A3B8'}
                    strokeWidth={1.2}
                    rx={1}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4 pt-3 text-left font-mono">
          <div>
            <span className="text-[11px] text-slate-500 block font-sans">Index Level</span>
            <span className="text-sm font-semibold text-white tabular-nums">{lastClose.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-sans">Active Markets</span>
            <span className="text-sm font-semibold text-white tabular-nums">8 Corridors</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-sans">Settlement</span>
            <span className="text-sm font-semibold text-emerald-400">KYC-Gated</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0D111A] rounded-lg p-4">
          <p className="text-xs font-semibold text-white">For Investors</p>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Tailored views for Equity Funders, Venture Capital funds, and Private Investors.
          </p>
        </div>
        <div className="bg-[#0D111A] rounded-lg p-4">
          <p className="text-xs font-semibold text-white">For Companies</p>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Dedicated issuance & treasury controls for Startups and Hedge Funds.
          </p>
        </div>
      </div>
    </div>
  );
}

export function AuthPanel({ onComplete, authError, onAuthAttempt }: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<WorkspaceRole>('investor');
  const [investorIdentity, setInvestorIdentity] = useState<InvestorIdentity>('EQUITY_FUNDER');
  const [companyPosition, setCompanyPosition] = useState<CompanyPosition>('STARTUP');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const persistWorkspaceSelection = (
    role: WorkspaceRole,
    userEmail: string,
    userName: string
  ) => {
    localStorage.setItem('userEmail', userEmail);
    localStorage.setItem('userName', userName);
    localStorage.setItem('userRole', role);
    localStorage.setItem('isUserOnboarded', 'true');

    if (role === 'investor') {
      const meta = getInvestorIdentityMeta(investorIdentity);
      localStorage.setItem('investorIdentity', investorIdentity);
      localStorage.removeItem('companyPosition');
      localStorage.setItem('aqxFineRole', meta.platformRole);
    } else if (role === 'company') {
      const meta = getCompanyPositionMeta(companyPosition);
      localStorage.setItem('companyPosition', companyPosition);
      localStorage.removeItem('investorIdentity');
      localStorage.setItem('aqxFineRole', meta.platformRole);
    } else {
      localStorage.setItem('aqxFineRole', 'SUPER_ADMIN');
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('nxg_auth_state_changed'));
    }
  };

  const handleQuickDemo = (role: WorkspaceRole) => {
    setError(null);
    setNotice(null);
    const invLabel = getInvestorIdentityMeta(investorIdentity).label;
    const compLabel = getCompanyPositionMeta(companyPosition).label;
    const demoConfigs = {
      investor: {
        email: `${investorIdentity.toLowerCase()}@afriquantx.demo`,
        name: `Alex (${invLabel})`,
      },
      company: {
        email: `${companyPosition.toLowerCase()}@issuer-afriquantx.demo`,
        name: `Meridian ${compLabel}`,
      },
      admin: {
        email: 'admin@afriquantx.demo',
        name: 'Platform Administrator',
      },
    };
    const config = demoConfigs[role];
    persistWorkspaceSelection(role, config.email, config.name);
    onComplete();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    onAuthAttempt?.();
    setNotice(null);
    setLoading(true);

    const trimmedEmail = email.trim() || `${selectedRole}@afriquantx.demo`;
    const derivedName = trimmedEmail.split('@')[0] || 'Participant';

    try {
      if (isSupabaseConfigured) {
        try {
          if (mode === 'signup') {
            const { data, error: supaErr } = await supabase.auth.signUp({ email: trimmedEmail, password });
            if (supaErr) throw supaErr;
            setPassword('');
            if (!data.session) {
              setMode('signin');
              setNotice('Check your email to confirm your account, then sign in.');
              return;
            }
          } else {
            const { data, error: supaErr } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
            if (supaErr) throw supaErr;
            if (!data.session) throw new Error('No authenticated session was returned.');
            setPassword('');
          }
          persistWorkspaceSelection(selectedRole, trimmedEmail, derivedName);
          onComplete();
          return;
        } catch (supaErr: any) {
          const msg = supaErr?.message || String(supaErr ||'');
          const isNetworkError =
            msg.includes('Failed to fetch') ||
            msg.includes('NetworkError') ||
            msg.includes('fetch failed') ||
            msg.includes('Load failed') ||
            msg.includes('Network request failed');

          if (isNetworkError) {
            console.warn('Supabase remote endpoint unreachable; continuing in prototype mode:', supaErr);
            persistWorkspaceSelection(selectedRole, trimmedEmail, derivedName);
            onComplete();
            return;
          }
          throw supaErr;
        }
      } else {
        persistWorkspaceSelection(selectedRole, trimmedEmail, derivedName);
        onComplete();
        return;
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#07090E] text-slate-100 font-sans overflow-hidden">
      {/* Left Panel: Institutional Market Context */}
      <div className="hidden lg:flex flex-col w-1/2 bg-[#090C14] p-5 justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="AfriQuantX Logo" className="w-8 h-8 object-contain"/>
          <span className="font-bold text-lg tracking-tight text-white">AfriQuantX</span>
        </div>

        <div className="flex flex-col items-center justify-center my-6">
          <MarketDepthPreview />
        </div>

        <div className="space-y-2 max-w-md">
          <p className="text-xs font-semibold text-white">
            Africa&apos;s AI-Powered Real-World Asset Investment Infrastructure
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Strict separation between Investor allocation desks and Company asset tokenisation consoles, governed by SPV legal structures and off-chain compliance controls.
          </p>
        </div>
      </div>

      {/* Right Panel: Role Onboarding + Auth */}
      <div className="flex-1 flex flex-col justify-center items-center p-3.5 md:p-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg"
          >
            <div className="lg:hidden flex items-center gap-2.5 justify-center mb-3">
              <img src="/logo.svg" alt="AfriQuantX Logo" className="w-9 h-9 object-contain"/>
              <span className="text-xl font-bold text-white">AfriQuantX</span>
            </div>

            <div className="bg-[#0D111A] rounded-lg p-3.5 md:p-4 shadow-xl">
              <div className="flex items-center justify-between pb-4 mb-3">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {mode === 'signin' ? 'Sign In & Select Workspace' : 'Create Institutional Account'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Choose your role and participant classification to tailor platform access.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                    setError(null);
                    setNotice(null);
                    setPassword('');
                  }}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {mode === 'signin' ? 'Create account' : 'Sign in instead'}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-2.5">
                {notice && <p role="status" className="text-xs text-emerald-300 bg-emerald-500/10 rounded-xl p-3">{notice}</p>}
                {(error || authError) && (
                  <div className="p-3 bg-rose-500/10 rounded-xl space-y-2">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5"/>
                      <p role="alert" className="text-xs text-slate-100">{error || authError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuickDemo(selectedRole)}
                      className="w-full text-left text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                    >
                      Continue in Prototype Mode as {selectedRole} →
                    </button>
                  </div>
                )}

                {/* Step 1: Role Switcher */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">Account Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('investor')}
                      className={cn(
'py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-white/[0.03]',
                        selectedRole === 'investor'
                          ? 'bg-white text-slate-950'
                          : 'bg-[#121723] text-slate-300'
                      )}
                    >
                      <Briefcase className="w-3.5 h-3.5"/>
                      <span>Investor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('company')}
                      className={cn(
'py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-white/[0.03]',
                        selectedRole === 'company'
                          ? 'bg-white text-slate-950'
                          : 'bg-[#121723] text-slate-300'
                      )}
                    >
                      <Building2 className="w-3.5 h-3.5"/>
                      <span>Company</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('admin')}
                      className={cn(
'py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-white/[0.03]',
                        selectedRole === 'admin'
                          ? 'bg-white text-slate-950'
                          : 'bg-[#121723] text-slate-300'
                      )}
                    >
                      <Shield className="w-3.5 h-3.5"/>
                      <span>Admin</span>
                    </button>
                  </div>
                </div>

                {/* Step 2: Mandatory Sub-Role Choice */}
                {selectedRole === 'investor' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-300">
                      Identify as (Investor Classification)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {INVESTOR_IDENTITIES.map((item) => {
                        const active = investorIdentity === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setInvestorIdentity(item.id)}
                            className={cn(
'p-3 rounded-xl text-left transition-colors cursor-pointer bg-white/[0.03]',
                              active
                                ? 'bg-emerald-500/15 text-white'
                                : 'bg-[#121723] text-slate-300'
                            )}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold">{item.label}</span>
                              {active && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0"/>}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{item.tagline}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedRole === 'company' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-300">
                      Company Position Onboarding
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {COMPANY_POSITIONS.map((item) => {
                        const active = companyPosition === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setCompanyPosition(item.id)}
                            className={cn(
'p-3.5 rounded-xl text-left transition-colors cursor-pointer bg-white/[0.03]',
                              active
                                ? 'bg-sky-500/15 text-white'
                                : 'bg-[#121723] text-slate-300'
                            )}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold">{item.label}</span>
                              {active && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0"/>}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">{item.tagline}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Email & Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#121723] rounded-xl py-2.5 pl-10 pr-3 text-white placeholder:text-slate-600 focus:outline-none text-sm"
                        placeholder="name@institution.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                      <input
                        type="password"
                        minLength={mode === 'signup' ? 8 : undefined}
                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#121723] rounded-xl py-2.5 pl-10 pr-3 text-white placeholder:text-slate-600 focus:outline-none text-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-white text-slate-950 hover:bg-slate-200 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <span>{loading ? 'Authenticating...' : mode === 'signin' ? 'Sign In to Workspace' : 'Create Account'}</span>
                  {!loading && <ArrowRight className="w-4 h-4"/>}
                </button>

                {/* Instant 1-Click Workspace Access matching selected sub-role */}
                <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs text-slate-400">
                    Prototype quick entry as{' '}
                    <strong className="text-white">
                      {selectedRole === 'investor'
                        ? `Investor · ${getInvestorIdentityMeta(investorIdentity).label}`
                        : selectedRole === 'company'
                          ? `Company · ${getCompanyPositionMeta(companyPosition).label}`
                          : 'Admin'}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo(selectedRole)}
                    className="py-2 px-4 bg-[#121723] hover:bg-white/10 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Launch Demo Session →
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
