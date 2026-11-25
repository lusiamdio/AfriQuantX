import React, { useState } from 'react';
import { ArrowRight, Briefcase, Building2, Check, Landmark, ShieldCheck, TrendingUp, UserCheck } from 'lucide-react';
import {
  COMPANY_POSITIONS,
  INVESTOR_IDENTITIES,
  type CompanyPosition,
  type InvestorIdentity,
  type WorkspaceRole,
} from '../lib/roleAccess';
import { cn } from '../lib/utils';

interface RoleOnboardingGateProps {
  initialRole: WorkspaceRole;
  onComplete: (selection: {
    role: WorkspaceRole;
    investorIdentity: InvestorIdentity | null;
    companyPosition: CompanyPosition | null;
  }) => void;
}

export function RoleOnboardingGate({ initialRole, onComplete }: RoleOnboardingGateProps) {
  const [selectedRole, setSelectedRole] = useState<'investor' | 'company'>(
    initialRole === 'company' ? 'company' : 'investor'
  );
  const [investorIdentity, setInvestorIdentity] = useState<InvestorIdentity | null>(null);
  const [companyPosition, setCompanyPosition] = useState<CompanyPosition | null>(null);

  const canContinue =
    selectedRole === 'investor' ? investorIdentity !== null : companyPosition !== null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canContinue) return;
    onComplete({
      role: selectedRole,
      investorIdentity: selectedRole === 'investor' ? investorIdentity : null,
      companyPosition: selectedRole === 'company' ? companyPosition : null,
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#07090E] text-slate-100 flex items-center justify-center p-3.5 md:p-4">
      <div className="w-full max-w-4xl bg-[#0D111A] rounded-lg p-3.5 md:p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="AfriQuantX Logo" className="w-9 h-9 object-contain" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Complete Workspace Onboarding</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Select your institutional workspace and classification to unlock role-specific capabilities.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-400 whitespace-nowrap shrink-0">
            Compliance-Gated Access
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {/* Primary Role Toggle */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-300">01. Select Account Role</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedRole('investor')}
                className={cn(
                  'text-left p-3 rounded-xl transition-colors cursor-pointer flex items-start gap-4 bg-white/[0.03]',
                  selectedRole === 'investor'
                    ? 'bg-white text-slate-950'
                    : 'bg-[#121723] text-slate-200'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                    selectedRole === 'investor' ? 'bg-slate-900 text-white' : 'bg-white/5 text-emerald-400'
                  )}
                >
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold">Investor Workspace</p>
                  <p
                    className={cn(
                      'text-xs mt-1 leading-relaxed',
                      selectedRole === 'investor' ? 'text-slate-700' : 'text-slate-400'
                    )}
                  >
                    Access RWA marketplace offerings, secondary execution desks, portfolio analytics, and yield payouts.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('company')}
                className={cn(
                  'text-left p-3 rounded-xl transition-colors cursor-pointer flex items-start gap-4 bg-white/[0.03]',
                  selectedRole === 'company'
                    ? 'bg-white text-slate-950'
                    : 'bg-[#121723] text-slate-200'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                    selectedRole === 'company' ? 'bg-slate-900 text-white' : 'bg-white/5 text-sky-400'
                  )}
                >
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold">Company Workspace</p>
                  <p
                    className={cn(
                      'text-xs mt-1 leading-relaxed',
                      selectedRole === 'company' ? 'text-slate-700' : 'text-slate-400'
                    )}
                  >
                    Structure asset tokenisations, manage KYB & data-room verification, run bookbuilding, and issue payouts.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Mandatory Sub-Role Choice */}
          {selectedRole === 'investor' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-300">
                  02. Identify as Investor Classification (Required)
                </p>
                <span className="text-xs text-slate-500">Choose one</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {INVESTOR_IDENTITIES.map((item) => {
                  const active = investorIdentity === item.id;
                  const Icon =
                    item.id === 'EQUITY_FUNDER'
                      ? Landmark
                      : item.id === 'VENTURE_CAPITAL'
                        ? TrendingUp
                        : UserCheck;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setInvestorIdentity(item.id)}
                      className={cn(
                        'p-3 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between gap-4 bg-white/[0.03]',
                        active
                          ? 'bg-emerald-500/15 text-white'
                          : 'bg-[#121723] text-slate-300'
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Icon className={cn('w-5 h-5', active ? 'text-emerald-400' : 'text-slate-400')} />
                          {active && <Check className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <p className="text-sm font-bold text-white">{item.label}</p>
                        <p className="text-xs text-emerald-400/90 mt-0.5 font-medium">{item.tagline}</p>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.focusSummary}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-300">
                  02. Choose Your Specific Company Position (Required)
                </p>
                <span className="text-xs text-slate-500">Startup or Hedge Fund</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {COMPANY_POSITIONS.map((item) => {
                  const active = companyPosition === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCompanyPosition(item.id)}
                      className={cn(
                        'p-3 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between gap-3 bg-white/[0.03]',
                        active
                          ? 'bg-sky-500/15 text-white'
                          : 'bg-[#121723] text-slate-300'
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <ShieldCheck className={cn('w-5 h-5', active ? 'text-sky-400' : 'text-slate-400')} />
                          {active && <Check className="w-4 h-4 text-sky-400" />}
                        </div>
                        <p className="text-base font-bold text-white">{item.label}</p>
                        <p className="text-xs text-sky-400 mt-0.5 font-medium">{item.tagline}</p>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.focusSummary}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-slate-400">
              Your workspace tools and navigation adapt strictly to your chosen role. You can update your classification later in Settings.
            </p>
            <button
              type="submit"
              disabled={!canContinue}
              className="px-3.5 py-3 rounded-xl bg-white text-slate-950 font-semibold text-sm hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Enter {selectedRole === 'investor' ? 'Investor' : 'Company'} Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
