import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  FileText,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Plus,
} from 'lucide-react';
import type {
  ComplianceCaseRecord,
  GovernanceProposal,
  ImmutableAuditEvent,
  RwaAsset,
} from '../types/rwa';
import type { FeeRuleConfig } from '../lib/financialMath';
import {
  DEFAULT_FEE_RULES,
  INITIAL_AUDIT_EVENTS,
  INITIAL_COMPLIANCE_CASES,
  INITIAL_DEMO_ASSETS,
  INITIAL_GOVERNANCE_PROPOSALS,
} from '../services/rwaPlatformService';
import { rwaFetch } from '../lib/rwaApi';

export function ComplianceGovernanceHub() {
  const [subTab, setSubTab] = useState<'compliance' | 'governance' | 'fees' | 'health'>('compliance');
  const [cases, setCases] = useState<ComplianceCaseRecord[]>(INITIAL_COMPLIANCE_CASES);
  const [proposals, setProposals] = useState<GovernanceProposal[]>(INITIAL_GOVERNANCE_PROPOSALS);
  const [auditLogs, setAuditLogs] = useState<ImmutableAuditEvent[]>(INITIAL_AUDIT_EVENTS);
  const [feeRules, setFeeRules] = useState<FeeRuleConfig[]>(DEFAULT_FEE_RULES);
  const [assets, setAssets] = useState<RwaAsset[]>(INITIAL_DEMO_ASSETS);
  const [health, setHealth] = useState<any>(null);
  const [statusMsg, setStatusMsg] = useState<{ type:'ok'|'err'; text: string } | null>(null);

  // Proposal form
  const [propTitle, setPropTitle] = useState('');
  const [propCategory, setPropCategory] = useState<GovernanceProposal['category']>('POLICY_RULE');
  const [propDesc, setPropDesc] = useState('');

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [cRes, pRes, aRes, fRes, asRes, hRes] = await Promise.all([
          rwaFetch<{ cases: ComplianceCaseRecord[] }>('/compliance/cases', {}, 'COMPLIANCE_OFFICER'),
          rwaFetch<{ proposals: GovernanceProposal[] }>('/governance/proposals'),
          rwaFetch<{ auditLogs: ImmutableAuditEvent[] }>('/audit', {}, 'COMPLIANCE_OFFICER'),
          rwaFetch<{ feeRules: FeeRuleConfig[] }>('/fees'),
          rwaFetch<{ assets: RwaAsset[] }>('/assets'),
          rwaFetch<any>('/system/health'),
        ]);
        if (cRes.cases) setCases(cRes.cases);
        if (pRes.proposals) setProposals(pRes.proposals);
        if (aRes.auditLogs) setAuditLogs(aRes.auditLogs);
        if (fRes.feeRules) setFeeRules(fRes.feeRules);
        if (asRes.assets) setAssets(asRes.assets);
        if (hRes) setHealth(hRes);
      } catch {
        // Keep seeded state gracefully
      }
    };
    void loadAll();
  }, []);

  const handleCaseDecision = async (
    caseId: string,
    decision: 'APPROVED' | 'RESTRICTED' | 'ACCOUNT_FROZEN' | 'ENHANCED_REVIEW'
  ) => {
    setStatusMsg(null);
    try {
      const res = await rwaFetch<{ caseRecord: ComplianceCaseRecord }>(
        `/compliance/cases/${caseId}/decision`,
        {
          method: 'POST',
          body: JSON.stringify({
            decision,
            comment: `Compliance decision ${decision} recorded via Command Center`,
          }),
        },
        'COMPLIANCE_OFFICER'
      );
      setCases((prev) => prev.map((c) => (c.id === caseId ? res.caseRecord : c)));
      const aRes = await rwaFetch<{ auditLogs: ImmutableAuditEvent[] }>('/audit', {}, 'COMPLIANCE_OFFICER');
      setAuditLogs(aRes.auditLogs);
      setStatusMsg({ type:'ok', text:`Case ${caseId} updated to ${decision} and recorded in immutable audit trail.`});
    } catch (err) {
      setStatusMsg({ type:'err', text: (err as Error).message });
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propTitle.trim()) return;
    setStatusMsg(null);
    try {
      const res = await rwaFetch<{ proposal: GovernanceProposal }>(
        '/governance/proposals',
        {
          method: 'POST',
          body: JSON.stringify({
            title: propTitle.trim(),
            category: propCategory,
            description: propDesc.trim() || 'Dual-control governance change proposal',
          }),
        },
        'ASSET_ADMINISTRATOR'
      );
      setProposals((prev) => [res.proposal, ...prev]);
      setPropTitle('');
      setPropDesc('');
      setStatusMsg({ type:'ok', text:`Proposal ${res.proposal.id} opened. Requires a separate Checker admin approval.`});
    } catch (err) {
      setStatusMsg({ type:'err', text: (err as Error).message });
    }
  };

  const handleCheckerApprove = async (proposalId: string) => {
    setStatusMsg(null);
    try {
      const res = await rwaFetch<{ proposal: GovernanceProposal }>(
        `/governance/proposals/${proposalId}/approve`,
        {
          method: 'POST',
          headers: {
            'x-aqx-user-id': 'checker-super-admin-02',
            'x-aqx-user-name': 'Second Signatory Checker',
          },
        },
        'SUPER_ADMIN'
      );
      setProposals((prev) => prev.map((p) => (p.id === proposalId ? res.proposal : p)));
      const aRes = await rwaFetch<{ auditLogs: ImmutableAuditEvent[] }>('/audit', {}, 'COMPLIANCE_OFFICER');
      setAuditLogs(aRes.auditLogs);
      setStatusMsg({ type:'ok', text:`Multi-sig proposal ${proposalId} co-signed and executed.`});
    } catch (err) {
      setStatusMsg({ type:'err', text: (err as Error).message });
    }
  };

  const handleUpdateFeeBps = async (rule: FeeRuleConfig, deltaBps: number) => {
    const nextBps = Math.max(0, rule.percentageBps + deltaBps);
    try {
      const res = await rwaFetch<{ feeRule: FeeRuleConfig }>(
        `/fees/${rule.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ percentageBps: nextBps }),
        },
        'SUPER_ADMIN'
      );
      setFeeRules((prev) => prev.map((r) => (r.id === rule.id ? res.feeRule : r)));
      setStatusMsg({ type:'ok', text:`Updated ${rule.name} rate to ${(nextBps / 100).toFixed(2)}%.`});
    } catch (err) {
      setStatusMsg({ type:'err', text: (err as Error).message });
    }
  };

  return (
    <div className="space-y-3 bg-black text-white">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5">
        <div>
          <p className="text-xs font-medium text-zinc-400">
            Compliance, Dual-Control Multi-Sig Governance & Immutable Audit Trail
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            AQX Compliance, Governance & System Health Command
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'compliance', label: 'Compliance & AML Cases' },
            { id: 'governance', label: 'Maker / Checker Multi-Sig' },
            { id: 'fees', label: 'Configurable Fee Engine' },
            { id: 'health', label: 'System Health & Audit Trail' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as typeof subTab)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${ subTab === tab.id ?'bg-white text-black' : 'bg-neutral-900 text-zinc-300 hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tokenisation Command Center KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl bg-neutral-950">
          <span className="text-xs text-zinc-400 block">Registered RWA Assets</span>
          <span className="text-xl font-bold font-mono tabular-nums text-white">{assets.length} (DEMO)</span>
        </div>
        <div className="p-4 rounded-xl bg-neutral-950">
          <span className="text-xs text-zinc-400 block">Active Offerings</span>
          <span className="text-xl font-bold font-mono tabular-nums text-emerald-400">
            {assets.filter((a) => a.passport.offeringStatus ==='ACTIVE'|| a.passport.offeringStatus ==='PRIMARY_OFFERING').length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-neutral-950">
          <span className="text-xs text-zinc-400 block">Open Compliance Cases</span>
          <span className="text-xl font-bold font-mono tabular-nums text-amber-300">
            {cases.filter((c) => c.status ==='OPEN'|| c.status ==='ENHANCED_REVIEW').length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-neutral-950">
          <span className="text-xs text-zinc-400 block">Pending Checker Votes</span>
          <span className="text-xl font-bold font-mono tabular-nums text-white">
            {proposals.filter((p) => p.status ==='PENDING_CHECKER').length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-neutral-950">
          <span className="text-xs text-zinc-400 block">Immutable Audit Events</span>
          <span className="text-xl font-bold font-mono tabular-nums text-white">{auditLogs.length}</span>
        </div>
        <div className="p-4 rounded-xl bg-neutral-950">
          <span className="text-xs text-zinc-400 block">RPO / RTO Target</span>
          <span className="text-xl font-bold font-mono tabular-nums text-white">
            {health?.rpoMinutes ?? 15}m / {health?.rtoMinutes ?? 60}m
          </span>
        </div>
      </div>

      {statusMsg && (
        <div
          role="status"
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 bg-white/[0.03] ${ statusMsg.type ==='ok'?'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}
        >
          {statusMsg.type ==='ok'? <CheckCircle2 className="w-4 h-4 shrink-0"/> : <AlertTriangle className="w-4 h-4 shrink-0"/>}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* COMPLIANCE CASES */}
      {subTab === 'compliance' && (
        <div className="bg-neutral-950 rounded-lg p-3.5 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-300"/>
            Compliance Case Management (KYC / KYB / AML / Sanctions / PEP)
          </h2>

          <div className="space-y-3">
            {cases.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-neutral-900/60 space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-white">{c.subject}</span>
                    <span className="text-zinc-400 ml-2 font-mono">
                      {c.id} · {c.caseType} · Officer: {c.assignedOfficer}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span
                      className={
                        c.riskBand === 'LOW'
                          ? 'text-emerald-400'
                          : c.riskBand === 'MEDIUM'
                            ? 'text-amber-300'
                            : 'text-rose-400'
                      }
                    >
                      Score {c.riskScore}/100 ({c.riskBand})
                    </span>
                    <span className="text-white font-bold">{c.status}</span>
                  </div>
                </div>
                <p className="text-zinc-300">{c.evidence}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => void handleCaseDecision(c.id, 'APPROVED')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 font-semibold hover:bg-emerald-500/25 cursor-pointer"
                  >
                    Approve Subject
                  </button>
                  <button
                    onClick={() => void handleCaseDecision(c.id, 'ENHANCED_REVIEW')}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-200 font-semibold hover:bg-amber-500/25 cursor-pointer"
                  >
                    Request Enhanced Due Diligence
                  </button>
                  <button
                    onClick={() => void handleCaseDecision(c.id, 'RESTRICTED')}
                    className="px-3 py-1.5 rounded-lg bg-white/10 text-zinc-200 font-semibold hover:bg-white/20 cursor-pointer"
                  >
                    Restrict Transfers
                  </button>
                  <button
                    onClick={() => void handleCaseDecision(c.id, 'ACCOUNT_FROZEN')}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-300 font-semibold hover:bg-rose-500/25 cursor-pointer"
                  >
                    Freeze Account
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAKER / CHECKER GOVERNANCE */}
      {subTab === 'governance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <form onSubmit={handleCreateProposal} className="lg:col-span-5 bg-neutral-950 rounded-lg p-3.5 space-y-4 text-xs">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4"/>
              Initiate Maker Governance Proposal
            </h2>
            <p className="text-zinc-400">
              Enforces separation of duties: no administrator can self-approve critical minting, upgrade, fee, or policy changes.
            </p>
            <div>
              <label className="text-zinc-400 block mb-1">Proposal Category</label>
              <select
                value={propCategory}
                onChange={(e) => setPropCategory(e.target.value as GovernanceProposal['category'])}
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white"
              >
                <option value="POLICY_RULE">Compliance / Policy Version</option>
                <option value="TOKEN_MINT">Unit Issuance / Allowlist Rule</option>
                <option value="FEE_SCHEDULE">Fee Schedule Update</option>
                <option value="TREASURY_DISTRIBUTION">Large Treasury Distribution</option>
                <option value="CONTRACT_UPGRADE">Registry Contract Governance</option>
                <option value="AI_MODEL_GOVERNANCE">AI Model Version Sign-off</option>
              </select>
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Title *</label>
              <input
                value={propTitle}
                onChange={(e) => setPropTitle(e.target.value)}
                placeholder="e.g., Enable Q1 Redistribution Reserve Cap"
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Justification & Impact Scope</label>
              <textarea
                rows={3}
                value={propDesc}
                onChange={(e) => setPropDesc(e.target.value)}
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-lg bg-white text-black font-bold flex items-center justify-center gap-1.5 cursor-pointer">
              <Plus className="w-4 h-4"/>
              <span>Submit Maker Proposal</span>
            </button>
          </form>

          <div className="lg:col-span-7 bg-neutral-950 rounded-lg p-3.5 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400"/>
              Multi-Admin Approval Queue
            </h2>
            <div className="space-y-3">
              {proposals.map((prop) => (
                <div key={prop.id} className="p-4 rounded-xl bg-neutral-900/60 space-y-2 text-xs">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <span className="font-bold text-white">{prop.title}</span>
                    <span
                      className={`font-mono font-semibold ${ prop.status ==='APPROVED_EXECUTED'?'text-emerald-400' : 'text-amber-300'}`}
                    >
                      {prop.status} ({prop.approvalsCount}/{prop.requiredApprovals})
                    </span>
                  </div>
                  <p className="text-zinc-300">{prop.description}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400 font-mono">
                    <span>
                      Maker: {prop.makerId} ({prop.makerRole})
                      {prop.checkerId ? ` · Checker: ${prop.checkerId}` : ''}
                    </span>
                    {prop.status ==='PENDING_CHECKER'&& (
                      <button
                        onClick={() => void handleCheckerApprove(prop.id)}
                        className="px-3 py-1 rounded-lg bg-white text-black font-sans font-bold hover:bg-zinc-200 cursor-pointer"
                      >
                        Co-Sign as Checker
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONFIGURABLE FEE ENGINE */}
      {subTab === 'fees' && (
        <div className="bg-neutral-950 rounded-lg p-3.5 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4"/>
            Configurable Fee Engine (Zero Hard-Coded Schedules)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-zinc-400">
                  <th className="py-1.5 px-3">Fee Rule</th>
                  <th className="py-1.5 px-3">Category</th>
                  <th className="py-1.5 px-3">Jurisdiction / Class</th>
                  <th className="py-1.5 px-3">Percentage Rate</th>
                  <th className="py-1.5 px-3">Fixed Base</th>
                  <th className="py-1.5 px-3 text-right">Adjust</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {feeRules.map((r) => (
                  <tr key={r.id}>
                    <td className="py-1.5 px-3 font-sans font-semibold text-white">{r.name}</td>
                    <td className="py-1.5 px-3 text-zinc-300">{r.feeType}</td>
                    <td className="py-1.5 px-3 font-sans text-zinc-400">{r.jurisdiction} · {r.assetClass}</td>
                    <td className="py-1.5 px-3 text-white font-bold">{(r.percentageBps / 100).toFixed(2)}% ({r.percentageBps} bps)</td>
                    <td className="py-1.5 px-3 text-zinc-300">{(r.fixedMinorUnits / 100).toFixed(2)} {r.currency}</td>
                    <td className="py-1.5 px-3 text-right space-x-2">
                      <button
                        onClick={() => void handleUpdateFeeBps(r, -5)}
                        className="px-2 py-1 rounded bg-neutral-900 hover:bg-white/10 cursor-pointer"
                      >
                        -5 bps
                      </button>
                      <button
                        onClick={() => void handleUpdateFeeBps(r, 5)}
                        className="px-2 py-1 rounded bg-neutral-900 hover:bg-white/10 cursor-pointer"
                      >
                        +5 bps
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SYSTEM HEALTH & IMMUTABLE AUDIT TRAIL */}
      {subTab === 'health' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-5 bg-neutral-950 rounded-lg p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400"/>
                AQX System Health & Disaster Recovery
              </h2>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const hRes = await rwaFetch<any>('/system/health');
                    if (hRes) setHealth(hRes);
                  } catch {
                    // Ignore transient refresh failure
                  }
                }}
                className="px-2.5 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-[11px] font-medium text-zinc-200 cursor-pointer"
              >
                Probe Live
              </button>
            </div>
            {health?.infra && (
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-neutral-900/70">
                  <div className="text-zinc-400">Redis Store</div>
                  <div className="font-mono font-semibold text-white mt-0.5">
                    {health.infra.redis?.connected ? 'Connected' : health.infra.redis?.configured ? 'Degraded' : 'Fallback Mode'}
                  </div>
                  <div className="text-zinc-500 font-mono truncate">
                    {health.infra.redis?.endpoint || 'Set REDIS_URL in secrets'}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-900/70">
                  <div className="text-zinc-400">Multichain RPC</div>
                  <div className="font-mono font-semibold text-white mt-0.5">
                    {health.infra.multichainRpc?.connected ? 'Connected' : health.infra.multichainRpc?.configured ? 'Degraded' : 'Unconfigured'}
                  </div>
                  <div className="text-zinc-500 font-mono truncate">
                    {health.infra.multichainRpc?.host || 'Set BLOCKCHAIN_RPC_URL'}
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2 text-xs">
              {(health?.services || []).map((svc: any) => (
                <div key={svc.name} className="p-2.5 rounded-lg bg-neutral-900/60 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">{svc.name}</div>
                    <div className="text-[11px] font-mono text-zinc-400 truncate">{svc.mode}</div>
                  </div>
                  <span className="font-mono text-emerald-400 font-semibold shrink-0">{svc.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 bg-neutral-950 rounded-lg p-3.5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4"/>
                Immutable Append-Only Audit Trail
              </h2>
              <span className="text-xs text-zinc-400">Delete prohibited by architecture</span>
            </div>
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto text-xs font-mono">
              {auditLogs.map((ev) => (
                <div key={ev.id} className="p-3 rounded-xl bg-neutral-900/60 space-y-1">
                  <div className="flex justify-between gap-2">
                    <span className="font-bold text-white">{ev.event}</span>
                    <span className="text-emerald-400">{ev.result}</span>
                  </div>
                  <p className="font-sans text-zinc-300">{ev.details}</p>
                  <div className="text-[11px] text-zinc-400">
                    Actor: {ev.userId} ({ev.userRole}) · IP: {ev.ip} · {ev.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
