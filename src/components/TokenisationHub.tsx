import React, { useEffect, useState } from 'react';
import {
  FileCheck2,
  ShieldCheck,
  Layers,
  Plus,
  ChevronDown,
  ChevronRight,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Cpu,
  ArrowRight,
  Building2,
} from 'lucide-react';
import {
  ASSET_WORKFLOW_STAGES,
  DOCUMENT_CATEGORIES,
  TOKEN_LIFECYCLE_STAGES,
  type AssetClass,
  type AssetWorkflowStage,
  type DocumentCategory,
  type RwaAsset,
  type SecondaryTransferModel,
  type SupportedCurrency,
  type TokenLifecycleStage,
} from '../types/rwa';
import { BLOCKCHAIN_ADAPTERS, INITIAL_DEMO_ASSETS } from '../services/rwaPlatformService';
import { formatCurrencyFromMinorUnits } from '../lib/financialMath';
import { rwaFetch } from '../lib/rwaApi';

interface TokenisationHubProps {
  setActiveTab?: (tab: string) => void;
}

const ASSET_CLASSES: AssetClass[] = [
  'Real Estate',
  'Energy',
  'Infrastructure',
  'Technology',
  'Healthcare',
  'Agriculture',
  'Company',
  'Equity',
  'Debt',
  'Commodity',
  'Fund',
  'Receivable',
  'Other',
];

const CURRENCIES: SupportedCurrency[] = ['ZAR', 'NGN', 'KES', 'GHS', 'AOA', 'RWF', 'EGP', 'MAD', 'USD', 'EUR', 'GBP'];

export function TokenisationHub({ setActiveTab }: TokenisationHubProps) {
  const [subTab, setSubTab] = useState<'onboarding' | 'passports' | 'verification' | 'design'>('passports');
  const [assets, setAssets] = useState<RwaAsset[]>(INITIAL_DEMO_ASSETS);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(INITIAL_DEMO_ASSETS[0].id);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type:'ok'|'err'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Onboarding form state
  const [appName, setAppName] = useState('');
  const [appClass, setAppClass] = useState<AssetClass>('Real Estate');
  const [appSector, setAppSector] = useState('Commercial Real Estate');
  const [appCountry, setAppCountry] = useState('South Africa');
  const [appJurisdiction, setAppJurisdiction] = useState('South Africa (FSCA Sandbox Scope)');
  const [appCurrency, setAppCurrency] = useState<SupportedCurrency>('ZAR');
  const [appIssuer, setAppIssuer] = useState('');
  const [appOwner, setAppOwner] = useState('');
  const [appValuation, setAppValuation] = useState('25000000');
  const [appTargetRaise, setAppTargetRaise] = useState('10000000');
  const [appUnitValue, setAppUnitValue] = useState('100');
  const [appLegalStructure, setAppLegalStructure] = useState('Ring-Fenced SPV Participation Note');
  const [appRegulatoryStatus, setAppRegulatoryStatus] = useState('DEMO — Pending Legal & Regulatory Review');
  const [appTokenName, setAppTokenName] = useState('');
  const [appTokenSymbol, setAppTokenSymbol] = useState('');
  const [appStandard, setAppStandard] = useState<'ERC-3643' | 'ERC-20' | 'ERC-721' | 'ERC-1155'>('ERC-3643');
  const [appAdapterId, setAppAdapterId] = useState(BLOCKCHAIN_ADAPTERS[0].id);
  const [appTransferModel, setAppTransferModel] = useState<SecondaryTransferModel>('ORDER_BOOK');

  // Document upload form state
  const [docCategory, setDocCategory] = useState<DocumentCategory>('Title Documents');
  const [docTitle, setDocTitle] = useState('');
  const [docExpiresAt, setDocExpiresAt] = useState('2028-12-31');

  // Multichain RPC telemetry state
  const [rpcStatus, setRpcStatus] = useState<{
    configured?: boolean;
    provider?: string;
    host?: string | null;
    health?: { connected?: boolean; mode?: string; latencyMs?: number; chainsReported?: number };
  } | null>(null);
  const [lookupAddress, setLookupAddress] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<{ totalBalanceUsd?: string; assets?: any[]; error?: string } | null>(null);

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) || assets[0];

  const loadAssets = async () => {
    try {
      const [res, rpcRes] = await Promise.all([
        rwaFetch<{ assets: RwaAsset[] }>('/assets'),
        rwaFetch<any>('/blockchain/status').catch(() => null),
      ]);
      if (res.assets?.length) {
        setAssets(res.assets);
      }
      if (rpcRes) {
        setRpcStatus(rpcRes);
      }
    } catch {
      // Fall back to local seed catalog if server unreachable
    }
  };

  useEffect(() => {
    void loadAssets();
  }, []);

  const handleLookupBalances = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = lookupAddress.trim();
    if (!trimmed) return;
    setLookupLoading(true);
    setLookupResult(null);
    try {
      const data = await rwaFetch<{ totalBalanceUsd?: string; assets?: any[] }>(
        `/blockchain/balances/${encodeURIComponent(trimmed)}?chains=eth,polygon,base`
      );
      setLookupResult(data);
    } catch (err) {
      setLookupResult({ error: (err as Error).message });
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim() || !appIssuer.trim()) {
      setStatusMessage({ type:'err', text:'Asset name and issuing entity are required.'});
      return;
    }
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await rwaFetch<{ asset: RwaAsset }>(
        '/assets',
        {
          method: 'POST',
          body: JSON.stringify({
            name: appName.trim(),
            shortSummary:`${appClass} instrument structured for ${appCountry} institutional & eligible participants.`,
            assetClass: appClass,
            sector: appSector,
            country: appCountry,
            jurisdiction: appJurisdiction,
            currency: appCurrency,
            issuer: appIssuer.trim(),
            assetOwner: appOwner.trim() || appIssuer.trim(),
            valuationMinorUnits: Math.round(Number(appValuation) * 100),
            targetRaiseMinorUnits: Math.round(Number(appTargetRaise) * 100),
            unitValueMinorUnits: Math.round(Number(appUnitValue) * 100),
            legalStructure: appLegalStructure,
            regulatoryStatus: appRegulatoryStatus,
            tokenName: appTokenName.trim() || `${appName.trim()} Unit`,
            tokenSymbol: appTokenSymbol.trim() || `AQX-${appName.slice(0, 4).toUpperCase()}`,
            tokenStandard: appStandard,
            blockchainNetworkId: appAdapterId,
            transferModelPermitted: appTransferModel,
          }),
        },
        'ISSUER'
      );
      setAssets((prev) => [res.asset, ...prev]);
      setSelectedAssetId(res.asset.id);
      setStatusMessage({
        type: 'ok',
        text:`Application created: ${res.asset.passport.passportId} (${res.asset.passport.offeringStatus}).`,
      });
      setAppName('');
      setSubTab('passports');
    } catch (err) {
      setStatusMessage({ type:'err', text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleTransitionStage = async (nextStage: AssetWorkflowStage) => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await rwaFetch<{ asset: RwaAsset }>(
        `/assets/${selectedAsset.id}/transition`,
        {
          method: 'POST',
          body: JSON.stringify({ nextStage }),
        },
        'COMPLIANCE_OFFICER'
      );
      setAssets((prev) => prev.map((a) => (a.id === res.asset.id ? res.asset : a)));
      setStatusMessage({ type:'ok', text:`${res.asset.passport.passportId} transitioned to ${nextStage}.`});
    } catch (err) {
      setStatusMessage({ type:'err', text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await rwaFetch<{ document: RwaAsset['documents'][0] }>(
        `/assets/${selectedAsset.id}/documents`,
        {
          method: 'POST',
          body: JSON.stringify({
            category: docCategory,
            title: docTitle.trim(),
            expiresAt: docExpiresAt || null,
            verificationStatus:'PENDING_REVIEW',
          }),
        },
        'ISSUER'
      );
      setAssets((prev) =>
        prev.map((a) => (a.id === selectedAsset.id ? { ...a, documents: [res.document, ...a.documents] } : a))
      );
      setDocTitle('');
      setStatusMessage({ type:'ok', text:`Document v${res.document.version} hashed (SHA-256) and queued for verification.`});
    } catch (err) {
      setStatusMessage({ type:'err', text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleTransitionToken = async (lifecycleStage: TokenLifecycleStage, transferModelPermitted?: SecondaryTransferModel) => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await rwaFetch<{ asset: RwaAsset }>(
        `/tokens/${selectedAsset.id}/lifecycle`,
        {
          method: 'POST',
          body: JSON.stringify({ lifecycleStage, transferModelPermitted }),
        },
        'ASSET_ADMINISTRATOR'
      );
      setAssets((prev) => prev.map((a) => (a.id === res.asset.id ? res.asset : a)));
      setStatusMessage({ type:'ok', text:`Unit registry moved to ${lifecycleStage}.`});
    } catch (err) {
      setStatusMessage({ type:'err', text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const currentStageIdx = ASSET_WORKFLOW_STAGES.indexOf(selectedAsset.passport.offeringStatus);
  const nextWorkflowStage =
    currentStageIdx >= 0 && currentStageIdx < ASSET_WORKFLOW_STAGES.length - 1
      ? ASSET_WORKFLOW_STAGES[currentStageIdx + 1]
      : null;

  return (
    <div className="space-y-3 bg-black text-white">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5">
        <div>
          <p className="text-xs font-medium text-zinc-400">
            Compliance-First Digital Securities · Investment Unit Infrastructure
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Asset Tokenisation Engine & Digital Asset Passports
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'passports', label: 'Asset Passports' },
            { id: 'onboarding', label: 'New Asset Application' },
            { id: 'verification', label: 'Document Verification' },
            { id: 'design', label: 'Unit & Structure Design' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as typeof subTab)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${ subTab === tab.id ?'bg-white text-black' : 'bg-neutral-900 text-zinc-300 hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Asset Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-950 rounded-xl p-4">
        <div className="flex items-center gap-3 min-w-0">
          <Building2 className="w-5 h-5 text-zinc-400 shrink-0"/>
          <div className="min-w-0">
            <label htmlFor="asset-passport-select" className="text-xs text-zinc-400 block">
              Selected Digital Asset Record
            </label>
            <select
              id="asset-passport-select"
              value={selectedAsset.id}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="mt-0.5 bg-neutral-900 rounded-lg px-3 py-1.5 text-sm font-semibold text-white focus:outline-none"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.passport.passportId} — {a.name} ({a.passport.offeringStatus}) {a.isDemo ?'[DEMO]' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-zinc-400 font-mono tabular-nums">
          <span>Stage: <strong className="text-white">{selectedAsset.passport.offeringStatus}</strong></span>
          <span aria-hidden="true">·</span>
          <span>Unit State: <strong className="text-emerald-400">{selectedAsset.token.lifecycleStage}</strong></span>
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('issuer-dashboard')}
              className="px-3 py-1.5 rounded-lg text-white hover:bg-white/10 text-xs font-sans font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              Issuer Console
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div
          role="status"
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 bg-white/[0.03] ${ statusMessage.type ==='ok'?'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}
        >
          {statusMessage.type ==='ok'? <CheckCircle2 className="w-4 h-4 shrink-0"/> : <AlertTriangle className="w-4 h-4 shrink-0"/>}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* TAB 1: DIGITAL ASSET PASSPORT */}
      {subTab === 'passports' && (
        <div className="space-y-3">
          {/* 13-Stage Compliance Workflow Pipeline */}
          <div className="bg-neutral-950 rounded-lg p-3.5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">13-Stage Onboarding & Compliance Workflow</h2>
                <p className="text-xs text-zinc-400">
                  Technical unit creation is gated by Legal Review, Valuation, Risk Review, and Compliance Authorisation.
                </p>
              </div>
              {nextWorkflowStage && (
                <button
                  onClick={() => void handleTransitionStage(nextWorkflowStage)}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <span>Advance to {nextWorkflowStage}</span>
                  <ArrowRight className="w-3.5 h-3.5"/>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {ASSET_WORKFLOW_STAGES.map((stage, idx) => {
                const done = idx < currentStageIdx;
                const current = idx === currentStageIdx;
                return (
                  <div
                    key={stage}
                    className={`p-2.5 rounded-lg text-[11px] font-medium bg-white/[0.03] ${ current ?'bg-white text-black font-bold': done ?'bg-emerald-500/10 text-emerald-300' : 'bg-neutral-900/70 text-zinc-500'}`}
                  >
                    <div className="font-mono text-[10px] opacity-75">Stage {idx + 1}</div>
                    <div className="truncate mt-0.5">{stage.replace(/_/g,'')}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Passport Core + Legal Separation Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 bg-neutral-950 rounded-lg p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4">
                <div>
                  <p className="text-xs text-zinc-400">
                    AQX Digital Asset Passport · {selectedAsset.passport.assetClass} · {selectedAsset.passport.country}
                    {selectedAsset.isDemo ? ' · DEMO' : ''}
                  </p>
                  <h2 className="text-xl font-bold text-white mt-1">
                    {selectedAsset.passport.passportId} — {selectedAsset.name}
                  </h2>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className="text-xs text-zinc-400">Valuation ({selectedAsset.passport.valuationDate})</div>
                  <div className="text-lg font-bold text-white">
                    {formatCurrencyFromMinorUnits(selectedAsset.passport.valuationMinorUnits, selectedAsset.passport.currency)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-zinc-400 block">Issuing Entity</span>
                  <span className="text-white font-semibold mt-0.5 block">{selectedAsset.passport.issuer}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Underlying Asset Owner</span>
                  <span className="text-white font-semibold mt-0.5 block">{selectedAsset.passport.assetOwner}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Jurisdiction</span>
                  <span className="text-white font-semibold mt-0.5 block">{selectedAsset.passport.jurisdiction}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Unit Value (Plain Capital Unit)</span>
                  <span className="text-white font-mono tabular-nums font-semibold mt-0.5 block">
                    {formatCurrencyFromMinorUnits(selectedAsset.token.unitValueMinorUnits, selectedAsset.passport.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Total Authorised Units</span>
                  <span className="text-white font-mono tabular-nums font-semibold mt-0.5 block">
                    {selectedAsset.token.totalSupplyDisplay}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Capital Funded / Target</span>
                  <span className="text-white font-mono tabular-nums font-semibold mt-0.5 block">
                    {formatCurrencyFromMinorUnits(selectedAsset.passport.fundedAmountMinorUnits, selectedAsset.passport.currency)} /{' '}
                    {formatCurrencyFromMinorUnits(selectedAsset.passport.targetRaiseMinorUnits, selectedAsset.passport.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Distribution Schedule</span>
                  <span className="text-white font-semibold mt-0.5 block">{selectedAsset.passport.distributionSchedule}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Risk Classification</span>
                  <span className="text-white font-mono font-semibold mt-0.5 block">
                    {selectedAsset.passport.riskRating} ({selectedAsset.passport.riskScore}/100)
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Liquidity Classification</span>
                  <span className="text-white font-semibold mt-0.5 block">
                    {selectedAsset.passport.liquidityClassification.replace(/_/g,'')}
                  </span>
                </div>
              </div>

              {/* Mandatory Legal & Regulatory Separation */}
              <div className="pt-4 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400"/>
                  Legal Ownership & Regulatory Authorisation Record
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-neutral-900/70">
                    <span className="text-zinc-400 block">Legal Structure</span>
                    <p className="text-white font-medium mt-1">{selectedAsset.passport.legalStructure}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-neutral-900/70">
                    <span className="text-zinc-400 block">Regulatory Status</span>
                    <p className="text-amber-300 font-medium mt-1">{selectedAsset.passport.regulatoryStatus}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-neutral-900/70">
                    <span className="text-zinc-400 block">Transfer Rules & Restrictions</span>
                    <p className="text-zinc-200 mt-1">{selectedAsset.passport.transferRules}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-neutral-900/70">
                    <span className="text-zinc-400 block">Investor Eligibility</span>
                    <p className="text-zinc-200 mt-1">{selectedAsset.passport.investorEligibility}</p>
                  </div>
                </div>
              </div>

              {/* Collapsible Technical Details (Blockchain & Custody separated from everyday UX) */}
              <div className="pt-3">
                <button
                  onClick={() => setShowTechDetails((prev) => !prev)}
                  className="flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
                >
                  {showTechDetails ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                  <span>Technical Details (Digital Asset Account, Registry Standard & Custody)</span>
                </button>
                {showTechDetails && (
                  <div className="mt-3 p-4 rounded-xl bg-neutral-900/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-zinc-400 block font-sans">Ledger Adapter</span>
                      <span className="text-white">
                        {BLOCKCHAIN_ADAPTERS.find((b) => b.id === selectedAsset.token.blockchainNetworkId)?.name ||
                          selectedAsset.token.blockchainNetworkId}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block font-sans">Registry Standard</span>
                      <span className="text-white">{selectedAsset.token.tokenStandard}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block font-sans">Registry Contract Reference</span>
                      <span className="text-zinc-200 break-all">{selectedAsset.token.contractAddress}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block font-sans">Custody & Key Posture</span>
                      <span className="text-emerald-300">{selectedAsset.passport.custodyStatus} (HSM-delegated)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: AQX Asset Score & Methodology */}
            <div className="bg-neutral-950 rounded-lg p-3.5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">AQX Asset Score</h3>
                <span className="font-mono tabular-nums text-2xl font-bold text-white">
                  {selectedAsset.aqxScore.overall}/100
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Confidence: <strong className="text-white">{selectedAsset.aqxScore.confidenceLevel}</strong> · Model:{''}
                <span className="font-mono">{selectedAsset.aqxScore.modelVersion}</span>
              </p>

              <div className="space-y-2.5 text-xs">
                {[
                  { label: 'Financial Strength', val: selectedAsset.aqxScore.financialStrength },
                  { label: 'Market Outlook', val: selectedAsset.aqxScore.marketOutlook },
                  { label: 'Governance', val: selectedAsset.aqxScore.governance },
                  { label: 'Liquidity', val: selectedAsset.aqxScore.liquidity },
                  { label: 'Risk Resilience', val: selectedAsset.aqxScore.risk },
                  { label: 'Data Quality', val: selectedAsset.aqxScore.dataQuality },
                ].map((dim) => (
                  <div key={dim.label} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-zinc-300">{dim.label}</span>
                      <span className="font-mono tabular-nums text-white font-semibold">{dim.val}/100</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                      <div className="h-full bg-white" style={{ width:`${dim.val}%`}} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 text-xs space-y-2">
                <p className="text-zinc-400">
                  <strong className="text-zinc-200">Methodology:</strong> {selectedAsset.aqxScore.methodology}
                </p>
                <p className="text-zinc-400">
                  <strong className="text-zinc-200">Data Sources:</strong> {selectedAsset.aqxScore.dataSources.join(',')}
                </p>
                <p className="text-zinc-400">
                  <strong className="text-zinc-200">Timestamp:</strong>{''}
                  <span className="font-mono">{selectedAsset.aqxScore.timestamp}</span>
                </p>
                <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-200">
                  <strong>Important Limitation:</strong> {selectedAsset.aqxScore.limitations[0]} Not a guaranteed return
                  forecast or regulated financial advice.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ASSET ONBOARDING FORM */}
      {subTab === 'onboarding' && (
        <form onSubmit={handleSubmitApplication} className="bg-neutral-950 rounded-lg p-3.5 space-y-3">
          <div>
            <h2 className="text-lg font-bold text-white">Submit Real-World Asset Application</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Submissions enter the 13-stage compliance review pipeline and receive a provisional AQX Digital Asset Passport.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-zinc-400 block mb-1">Asset / Offering Name *</label>
              <input
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g., Johannesburg Logistics Park SPV"
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Asset Class *</label>
              <select
                value={appClass}
                onChange={(e) => setAppClass(e.target.value as AssetClass)}
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white"
              >
                {ASSET_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Sector</label>
              <input
                value={appSector}
                onChange={(e) => setAppSector(e.target.value)}
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Primary Country *</label>
              <input
                value={appCountry}
                onChange={(e) => setAppCountry(e.target.value)}
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Legal Jurisdiction & Regime</label>
              <input
                value={appJurisdiction}
                onChange={(e) => setAppJurisdiction(e.target.value)}
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Settlement Currency</label>
              <select
                value={appCurrency}
                onChange={(e) => setAppCurrency(e.target.value as SupportedCurrency)}
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Issuing Entity (SPV / Company) *</label>
              <input
                value={appIssuer}
                onChange={(e) => setAppIssuer(e.target.value)}
                placeholder="e.g., Gauteng Property SPV (Pty) Ltd"
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Underlying Asset Owner</label>
              <input
                value={appOwner}
                onChange={(e) => setAppOwner(e.target.value)}
                placeholder="Optional if same as Issuer"
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Appraised Valuation ({appCurrency})</label>
              <input
                type="number"
                value={appValuation}
                onChange={(e) => setAppValuation(e.target.value)}
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Target Raise ({appCurrency})</label>
              <input
                type="number"
                value={appTargetRaise}
                onChange={(e) => setAppTargetRaise(e.target.value)}
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Unit Value ({appCurrency})</label>
              <input
                type="number"
                value={appUnitValue}
                onChange={(e) => setAppUnitValue(e.target.value)}
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Permitted Secondary Transfer Model</label>
              <select
                value={appTransferModel}
                onChange={(e) => setAppTransferModel(e.target.value as SecondaryTransferModel)}
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white"
              >
                <option value="ORDER_BOOK">Controlled Order Book</option>
                <option value="RFQ">Institutional RFQ</option>
                <option value="PEER_TO_PEER">Allowlisted P2P Transfer</option>
                <option value="ADMINISTRATOR_APPROVED">Administrator-Approved Only</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-zinc-400 block mb-1">Legal Structure Description *</label>
              <input
                value={appLegalStructure}
                onChange={(e) => setAppLegalStructure(e.target.value)}
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Regulatory Authorisation Status *</label>
              <input
                value={appRegulatoryStatus}
                onChange={(e) => setAppRegulatoryStatus(e.target.value)}
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Investment Unit Name</label>
              <input
                value={appTokenName}
                onChange={(e) => setAppTokenName(e.target.value)}
                placeholder="e.g., Gauteng Logistics Unit"
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Unit Ticker Symbol</label>
              <input
                value={appTokenSymbol}
                onChange={(e) => setAppTokenSymbol(e.target.value)}
                placeholder="AQX-GLOG"
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Digital Registry Standard & Adapter</label>
              <div className="flex gap-2">
                <select
                  value={appStandard}
                  onChange={(e) => setAppStandard(e.target.value as typeof appStandard)}
                  className="bg-neutral-900 rounded-lg px-2 py-2 text-white"
                >
                  <option value="ERC-3643">ERC-3643</option>
                  <option value="ERC-20">ERC-20</option>
                  <option value="ERC-721">ERC-721</option>
                  <option value="ERC-1155">ERC-1155</option>
                </select>
                <select
                  value={appAdapterId}
                  onChange={(e) => setAppAdapterId(e.target.value)}
                  className="flex-1 bg-neutral-900 rounded-lg px-2 py-2 text-white"
                >
                  {BLOCKCHAIN_ADAPTERS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-3.5 py-2.5 rounded-lg bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4"/>
              <span>Submit Asset Application</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: ASSET VERIFICATION & 14 DOCUMENT CATEGORIES */}
      {subTab === 'verification' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="bg-neutral-950 rounded-lg p-3.5 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-zinc-300"/>
              Register Verified Document
            </h2>
            <p className="text-xs text-zinc-400">
              All 14 institutional document categories support cryptographic SHA-256 hashing, version increments, expiration
              alerts, and mandatory human compliance sign-off.
            </p>
            <form onSubmit={handleUploadDoc} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Document Category (14 Categories)</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value as DocumentCategory)}
                  className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white"
                >
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Document Title / Reference</label>
                <input
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g., Audited_Financials_FY2026.pdf"
                  className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Expiration Date</label>
                <input
                  type="date"
                  value={docExpiresAt}
                  onChange={(e) => setDocExpiresAt(e.target.value)}
                  className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-white text-black font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Hash & Attach Document Version
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-neutral-950 rounded-lg p-3.5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-400"/>
                Verification Vault — {selectedAsset.passport.passportId}
              </h2>
              <span className="text-xs text-zinc-400 font-mono">{selectedAsset.documents.length} document(s)</span>
            </div>

            {selectedAsset.documents.length === 0 ? (
              <div className="p-4 text-center rounded-xl text-xs text-zinc-400 bg-white/[0.03]">
                No documents registered for this asset yet. Use the form on the left to attach ownership, legal, valuation,
                and offering records.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedAsset.documents.map((doc) => (
                  <div key={doc.id} className="p-4 rounded-xl bg-neutral-900/60 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-white">{doc.title}</span>
                        <span className="text-zinc-400 ml-2">
                          {doc.category} · v{doc.version}
                        </span>
                      </div>
                      <span
                        className={`font-semibold font-mono ${ doc.verificationStatus ==='VERIFIED'?'text-emerald-400' : 'text-amber-300'}`}
                      >
                        {doc.verificationStatus}
                      </span>
                    </div>
                    <p className="text-zinc-300">{doc.aiExtractionSummary}</p>
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400 font-mono">
                      <span>SHA-256: {doc.sha256Hash.slice(0, 22)}...</span>
                      <span>Reviewer: {doc.reviewerName || 'Unassigned'}</span>
                      <span>Expires: {doc.expiresAt || 'No expiry'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: TOKEN DESIGN ENGINE & TECHNICAL ADAPTERS */}
      {subTab === 'design' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-neutral-950 rounded-lg p-3.5 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-300"/>
              Investment Unit Design & Lifecycle Controls
            </h2>
            <p className="text-xs text-zinc-400">
              Authorised administrators manage Create Investment Units rules, lock-ups, redemption covenants, and
              secondary transfer models.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-neutral-900/60">
                <span className="text-zinc-400 block">Unit Name</span>
                <span className="text-white font-semibold mt-0.5 block">{selectedAsset.token.tokenName}</span>
              </div>
              <div className="p-3 rounded-lg bg-neutral-900/60">
                <span className="text-zinc-400 block">Instrument Ticker</span>
                <span className="text-white font-mono font-semibold mt-0.5 block">{selectedAsset.token.tokenSymbol}</span>
              </div>
              <div className="p-3 rounded-lg bg-neutral-900/60">
                <span className="text-zinc-400 block">Lock-Up Period</span>
                <span className="text-white font-mono font-semibold mt-0.5 block">{selectedAsset.token.lockupPeriodDays} days</span>
              </div>
              <div className="p-3 rounded-lg bg-neutral-900/60">
                <span className="text-zinc-400 block">Transfer Model</span>
                <span className="text-white font-semibold mt-0.5 block">
                  {selectedAsset.passport.transferModelPermitted.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <span className="text-xs text-zinc-400 block">Transition Unit Lifecycle State</span>
              <div className="flex flex-wrap gap-2">
                {TOKEN_LIFECYCLE_STAGES.map((stage) => (
                  <button
                    key={stage}
                    onClick={() => void handleTransitionToken(stage)}
                    disabled={loading}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono cursor-pointer bg-white/[0.03] ${ selectedAsset.token.lifecycleStage === stage ?'bg-white text-black font-bold' : 'bg-neutral-900 text-zinc-300 hover:text-white'}`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <span className="text-xs text-zinc-400 block">Configure Secondary Transfer Mechanism</span>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'ORDER_BOOK', label: 'Order Book' },
                    { id: 'RFQ', label: 'Institutional RFQ' },
                    { id: 'PEER_TO_PEER', label: 'Allowlisted P2P' },
                    { id: 'ADMINISTRATOR_APPROVED', label: 'Admin-Approved Only' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => void handleTransitionToken(selectedAsset.token.lifecycleStage, m.id)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer bg-white/[0.03] ${ selectedAsset.passport.transferModelPermitted === m.id ?'bg-emerald-500/15 text-emerald-300' : 'bg-neutral-900 text-zinc-300 hover:text-white'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-neutral-950 rounded-lg p-3.5 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-zinc-300"/>
              Technical Details: Multi-Chain BlockchainAdapter Registry
            </h2>
            <p className="text-xs text-zinc-400">
              AfriQuantX separates issuer/investor PII off-chain while delegating registry proofs to pluggable EVM, L2,
              and permissioned ledger adapters. No signing keys reside in application runtime.
            </p>
            <div className="space-y-2.5">
              {BLOCKCHAIN_ADAPTERS.map((adapter) => {
                const isSelected = selectedAsset.token.blockchainNetworkId === adapter.id;
                return (
                  <div
                    key={adapter.id}
                    className={`p-3 rounded-lg text-xs bg-white/[0.03] ${ isSelected ? 'bg-white/5' : 'bg-neutral-900/50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{adapter.name}</span>
                      <span className="text-zinc-400 font-mono">{adapter.networkType}</span>
                    </div>
                    <div className="text-zinc-300 mt-1">
                      Standards: {adapter.supportedStandards.join(', ')} · Finality: {adapter.finalityLabel}
                    </div>
                    <div className="text-zinc-400 mt-1 flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-emerald-400 shrink-0"/>
                      <span>{adapter.custodyKeyModel}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-lg bg-neutral-900/70 space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-white">Multichain RPC Node Inspection</span>
                <span className={`font-mono text-[11px] ${rpcStatus?.health?.connected ? 'text-emerald-400' : 'text-zinc-400'}`}>
                  {rpcStatus?.health?.connected
                    ? `CONNECTED (${rpcStatus.health.latencyMs}ms)`
                    : rpcStatus?.configured
                      ? 'DEGRADED'
                      : 'RPC UNCONFIGURED'}
                </span>
              </div>
              <form onSubmit={handleLookupBalances} className="flex gap-2">
                <input
                  type="text"
                  value={lookupAddress}
                  onChange={(e) => setLookupAddress(e.target.value)}
                  placeholder="0x... EVM treasury or holder address"
                  className="flex-1 bg-black/50 rounded-md px-2.5 py-1.5 text-xs text-white font-mono placeholder:text-zinc-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="px-3 py-1.5 rounded-md bg-white text-black text-xs font-semibold hover:bg-zinc-200 cursor-pointer disabled:opacity-50"
                >
                  {lookupLoading ? 'Querying...' : 'Verify On-Chain'}
                </button>
              </form>
              {lookupResult?.error && (
                <div className="text-[11px] font-mono text-amber-300">
                  {lookupResult.error}
                </div>
              )}
              {lookupResult && !lookupResult.error && (
                <div className="text-[11px] font-mono text-zinc-300 space-y-1">
                  <div>Total Verified Multichain USD: ${Number(lookupResult.totalBalanceUsd || 0).toLocaleString()}</div>
                  <div>Matched Token Balances: {lookupResult.assets?.length ?? 0}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
