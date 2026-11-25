import React, { useState } from 'react';
import { InvestorSettings } from './settings/InvestorSettings';
import { CompanySettings } from './settings/CompanySettings';
import { Fingerprint, CheckCircle2, Briefcase, Building2, Check } from 'lucide-react';
import { BiometricAuthModal } from './BiometricAuthModal';
import {
  COMPANY_POSITIONS,
  INVESTOR_IDENTITIES,
  type CompanyPosition,
  type InvestorIdentity,
  type WorkspaceRole,
} from '../lib/roleAccess';
import { cn } from '../lib/utils';

interface SettingsProps {
  userRole: WorkspaceRole;
  investorIdentity: InvestorIdentity | null;
  companyPosition: CompanyPosition | null;
  onRoleChange: (role: WorkspaceRole) => void;
  onUpdateSubRole: (sub: {
    investorIdentity?: InvestorIdentity;
    companyPosition?: CompanyPosition;
  }) => void;
  setActiveTab: (tab: string) => void;
}

export function Settings({
  userRole,
  investorIdentity,
  companyPosition,
  onRoleChange,
  onUpdateSubRole,
  setActiveTab,
}: SettingsProps) {
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [biometricStatusMsg, setBiometricStatusMsg] = useState<string | null>(null);

  return (
    <div className="max-w-6xl mx-auto space-y-3.5 relative pb-20 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Settings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your workspace classification, compliance readiness, and security controls.
          </p>
        </div>

        {/* FIDO2 Biometrics Button */}
        <div className="flex items-center gap-3 shrink-0">
          {biometricStatusMsg && (
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> {biometricStatusMsg}
            </span>
          )}
          <button
            onClick={() => setIsBiometricModalOpen(true)}
            title="Hardware Biometric Security & Passkey Authentication (WebAuthn / FIDO2)"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#121723] text-white hover:bg-white hover:text-slate-950 transition-colors text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            <Fingerprint className="w-4 h-4 text-emerald-400" />
            <span>FIDO2 Biometrics</span>
          </button>
        </div>
      </div>

      {/* Role & Sub-Role Workspace Identity Section */}
      <div className="rounded-lg bg-[#0D111A] p-3.5 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Active Workspace & Classification</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Investors and Companies see strictly separated modules tailored to their role.
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-[#121723] p-1 rounded-xl self-start">
            <button
              type="button"
              onClick={() => onRoleChange('investor')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                userRole === 'investor' ? 'bg-white text-slate-950' : 'text-slate-400 hover:text-white'
              )}
            >
              <Briefcase className="w-3.5 h-3.5" /> Investor
            </button>
            <button
              type="button"
              onClick={() => onRoleChange('company')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                userRole === 'company' ? 'bg-white text-slate-950' : 'text-slate-400 hover:text-white'
              )}
            >
              <Building2 className="w-3.5 h-3.5" /> Company
            </button>
          </div>
        </div>

        {userRole === 'investor' && (
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-slate-300">Investor Identity</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {INVESTOR_IDENTITIES.map((item) => {
                const active = investorIdentity === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onUpdateSubRole({ investorIdentity: item.id })}
                    className={cn(
                      'p-4 rounded-xl text-left transition-colors cursor-pointer bg-white/[0.03]',
                      active
                        ? 'bg-emerald-500/15 text-white'
                        : 'bg-[#121723] text-slate-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{item.label}</span>
                      {active && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{item.tagline}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {userRole === 'company' && (
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-slate-300">Company Position</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {COMPANY_POSITIONS.map((item) => {
                const active = companyPosition === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onUpdateSubRole({ companyPosition: item.id })}
                    className={cn(
                      'p-4 rounded-xl text-left transition-colors cursor-pointer bg-white/[0.03]',
                      active
                        ? 'bg-sky-500/15 text-white'
                        : 'bg-[#121723] text-slate-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{item.label}</span>
                      {active && <Check className="w-4 h-4 text-sky-400" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{item.tagline}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Role-Specific Settings */}
      {userRole === 'company' ? (
        <CompanySettings setActiveTab={setActiveTab} />
      ) : (
        <InvestorSettings setActiveTab={setActiveTab} />
      )}

      {/* Hardware Biometric Security Gate Modal */}
      <BiometricAuthModal
        isOpen={isBiometricModalOpen}
        actionTitle="Institutional Passkey & Biometric Enrollment"
        actionDescription="Secure hardware authentication using Web Authentication API (WebAuthn / FIDO2) with biometric sensor or hardware security key."
        onSuccess={(result) => {
          setIsBiometricModalOpen(false);
          setBiometricStatusMsg(`Verified via ${result.methodUsed}`);
        }}
        onCancel={() => setIsBiometricModalOpen(false)}
      />
    </div>
  );
}
