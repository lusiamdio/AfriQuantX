import React, { useEffect, useState } from 'react';
import { ShieldCheck, UserCheck, Building2, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import type { KycKybSubmission } from '../types/rwa';
import { INITIAL_KYC_SUBMISSIONS } from '../services/rwaPlatformService';
import { rwaFetch } from '../lib/rwaApi';

export function KycKybCenter() {
  const [profileType, setProfileType] = useState<'INDIVIDUAL_KYC' | 'CORPORATE_KYB'>('INDIVIDUAL_KYC');
  const [submissions, setSubmissions] = useState<KycKybSubmission[]>(INITIAL_KYC_SUBMISSIONS);
  const [subjectName, setSubjectName] = useState('');
  const [email, setEmail] = useState('');
  const [jurisdiction, setJurisdiction] = useState('South Africa');
  const [taxResidency, setTaxResidency] = useState('South Africa');
  const [registrationOrIdRef, setRegistrationOrIdRef] = useState('');
  const [sourceOfFunds, setSourceOfFunds] = useState('Operating Cashflows / Salary');
  const [riskToleranceOrActivity, setRiskToleranceOrActivity] = useState('Balanced Institutional Growth');
  const [beneficialOwnersCount, setBeneficialOwnersCount] = useState('1');
  const [pepDeclared, setPepDeclared] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await rwaFetch<{ submissions: KycKybSubmission[] }>('/kyc');
        if (res.submissions?.length) setSubmissions(res.submissions);
      } catch {
        // Fallback to seed list
      }
    };
    void load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim() || !registrationOrIdRef.trim()) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await rwaFetch<{ submission: KycKybSubmission }>('/kyc', {
        method: 'POST',
        body: JSON.stringify({
          profileType,
          subjectName: subjectName.trim(),
          email: email.trim() || 'applicant@afriquantx.demo',
          jurisdiction,
          taxResidency,
          registrationOrIdRef: registrationOrIdRef.trim(),
          sourceOfFunds,
          riskToleranceOrActivity,
          beneficialOwnersCount: Number(beneficialOwnersCount) || 1,
          pepDeclared,
          highRiskJurisdiction: false,
        }),
      });
      setSubmissions((prev) => [res.submission, ...prev]);
      setSubjectName('');
      setRegistrationOrIdRef('');
      setFeedback(
        `Submitted ${res.submission.id} — Computed Compliance Risk Score: ${res.submission.riskScore}/100 (${res.submission.riskBand}). External KYC/Sanctions provider attestation required for live onboarding.`
      );
    } catch (err) {
      setFeedback((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 bg-black text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5">
        <div>
          <p className="text-xs font-medium text-zinc-400">
            Off-Chain Privacy-Protected Registry · POPIA-Aligned Due Diligence
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            KYC / KYB Onboarding & Compliance Screening
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setProfileType('INDIVIDUAL_KYC')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${ profileType ==='INDIVIDUAL_KYC'?'bg-white text-black' : 'bg-neutral-900 text-zinc-300'}`}
          >
            Individual KYC
          </button>
          <button
            onClick={() => setProfileType('CORPORATE_KYB')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${ profileType ==='CORPORATE_KYB'?'bg-white text-black' : 'bg-neutral-900 text-zinc-300'}`}
          >
            Corporate KYB
          </button>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-neutral-950 flex items-start gap-3 text-xs text-zinc-300">
        <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/>
        <div>
          <strong className="text-white">Off-Chain Sensitive Data Boundary:</strong> All personal identity, tax
          residency, corporate beneficial ownership, and source-of-funds disclosures remain strictly off-chain. Automated
          rule scoring (0–100) supports compliance triage; live sanctions/PEP clearance requires an accredited external
          verification provider and officer sign-off.
        </div>
      </div>

      {feedback && (
        <div role="status" className="p-3.5 rounded-xl bg-emerald-500/10 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0"/>
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <form onSubmit={handleSubmit} className="lg:col-span-5 bg-neutral-950 rounded-lg p-3.5 space-y-4 text-xs">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            {profileType ==='INDIVIDUAL_KYC'? <UserCheck className="w-4 h-4"/> : <Building2 className="w-4 h-4"/>}
            <span>{profileType === 'INDIVIDUAL_KYC' ? 'Individual Investor KYC Dossier' : 'Corporate / Issuer KYB Dossier'}</span>
          </h2>

          <div>
            <label className="text-zinc-400 block mb-1">
              {profileType === 'INDIVIDUAL_KYC' ? 'Full Legal Name *' : 'Registered Legal Entity Name *'}
            </label>
            <input
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder={profileType === 'INDIVIDUAL_KYC' ? 'e.g., Amara Okafor' : 'e.g., Sahel Clean Energy (Pty) Ltd'}
              className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-400 block mb-1">Jurisdiction / Nationality</label>
              <input
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Tax Residency</label>
              <input
                value={taxResidency}
                onChange={(e) => setTaxResidency(e.target.value)}
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-400 block mb-1">
                {profileType === 'INDIVIDUAL_KYC' ? 'National ID / Passport Ref *' : 'Company Registration Number *'}
              </label>
              <input
                value={registrationOrIdRef}
                onChange={(e) => setRegistrationOrIdRef(e.target.value)}
                placeholder="ID / CIPC / CAC Ref"
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Primary Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="compliance@entity.com"
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-zinc-400 block mb-1">Source of Funds & Wealth</label>
            <input
              value={sourceOfFunds}
              onChange={(e) => setSourceOfFunds(e.target.value)}
              className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-400 block mb-1">
                {profileType === 'INDIVIDUAL_KYC' ? 'Risk Tolerance / Mandate' : 'Primary Business Activity'}
              </label>
              <input
                value={riskToleranceOrActivity}
                onChange={(e) => setRiskToleranceOrActivity(e.target.value)}
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Beneficial Owners Declared</label>
              <input
                type="number"
                min={1}
                value={beneficialOwnersCount}
                onChange={(e) => setBeneficialOwnersCount(e.target.value)}
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-zinc-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={pepDeclared}
              onChange={(e) => setPepDeclared(e.target.checked)}
              className="rounded bg-neutral-900"
            />
            <span>Subject or beneficial owner holds a Politically Exposed Person (PEP) status</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-white text-black font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            Submit for Risk Scoring & Compliance Review
          </button>
        </form>

        {/* Verification Registry */}
        <div className="lg:col-span-7 bg-neutral-950 rounded-lg p-3.5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400"/>
              Active KYC / KYB Verification Registry
            </h2>
            <span className="text-xs font-mono text-zinc-400">{submissions.length} record(s)</span>
          </div>

          <div className="space-y-3">
            {submissions.map((sub) => (
              <div key={sub.id} className="p-4 rounded-xl bg-neutral-900/60 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-white">{sub.subjectName}</span>
                    <span className="text-zinc-400 ml-2 font-mono">
                      {sub.id} · {sub.profileType === 'CORPORATE_KYB' ? 'KYB' : 'KYC'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono tabular-nums">
                    <span
                      className={
                        sub.riskBand === 'LOW'
                          ? 'text-emerald-400'
                          : sub.riskBand === 'MEDIUM'
                            ? 'text-amber-300'
                            : 'text-rose-400'
                      }
                    >
                      Risk: {sub.riskScore}/100 ({sub.riskBand})
                    </span>
                    <span className="text-white font-semibold">{sub.status}</span>
                  </div>
                </div>
                <div className="text-zinc-400">
                  {sub.jurisdiction} · Tax: {sub.taxResidency} · Sanctions: {sub.sanctionsScreen} · PEP: {sub.pepScreen}
                </div>
                <div className="text-zinc-300 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5"/>
                  <span>{sub.riskFactors.join(' · ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
