import React, { useMemo, useState } from 'react';
import { X, ShieldCheck, FileText, ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';
import type { InvestmentOrderRecord, RwaAsset } from '../types/rwa';
import {
  calculateInvestmentBreakdown,
  formatCurrencyFromMinorUnits,
} from '../lib/financialMath';
import { DEFAULT_FEE_RULES, BLOCKCHAIN_ADAPTERS } from '../services/rwaPlatformService';
import { rwaFetch } from '../lib/rwaApi';

interface AssetDetailModalProps {
  asset: RwaAsset;
  onClose: () => void;
  onInvestmentSuccess?: (order: InvestmentOrderRecord) => void;
}

export function AssetDetailModal({ asset, onClose, onInvestmentSuccess }: AssetDetailModalProps) {
  const [activeSection, setActiveSection] = useState<'overview' | 'financials' | 'legal' | 'invest'>('overview');
  const [amountInput, setAmountInput] = useState(
    String(Math.max(100, asset.token.minInvestmentMinorUnits / 100))
  );
  const [disclosuresAccepted, setDisclosuresAccepted] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<InvestmentOrderRecord | null>(null);

  const feeRule = DEFAULT_FEE_RULES[0];

  const breakdown = useMemo(() => {
    const parsedMinor = Math.round(Number(amountInput || 0) * 100);
    if (!Number.isFinite(parsedMinor) || parsedMinor <= 0) return null;
    try {
      return calculateInvestmentBreakdown({
        investmentMinorUnits: parsedMinor,
        unitPriceMinorUnits: asset.token.unitValueMinorUnits,
        totalSupplyUnitsScaled: asset.token.totalSupplyScaled,
        feeRule,
      });
    } catch {
      return null;
    }
  }, [amountInput, asset.token.unitValueMinorUnits, asset.token.totalSupplyScaled, feeRule]);

  const handleConfirmInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disclosuresAccepted) {
      setError('You must confirm eligibility, risk disclosures, and legal structure terms before subscribing.');
      return;
    }
    const amountMinorUnits = Math.round(Number(amountInput) * 100);
    setSubmitting(true);
    setError(null);
    const idempotencyKey =`aqx-inv-${asset.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    try {
      const res = await rwaFetch<{ order: InvestmentOrderRecord }>('/investments', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({
          assetId: asset.id,
          amountMinorUnits,
          disclosuresAccepted: true,
        }),
      });
      setReceipt(res.order);
      onInvestmentSuccess?.(res.order);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-neutral-950 rounded-lg shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-3.5 flex flex-wrap items-start justify-between gap-4 bg-white/[0.03]">
          <div>
            <p className="text-xs text-zinc-400 font-mono">
              {asset.passport.passportId} · {asset.passport.assetClass} · {asset.passport.country}
              {asset.isDemo ? ' · DEMO ASSET' : ''}
            </p>
            <h2 className="text-2xl font-bold text-white mt-1">{asset.name}</h2>
            <p className="text-xs text-zinc-300 mt-1 max-w-2xl">{asset.shortSummary}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Asset Detail"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-3.5 py-3 flex flex-wrap items-center justify-between gap-3 bg-black/40">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'overview', label: 'Overview & Thesis' },
              { id: 'financials', label: 'Financials & AI Intelligence' },
              { id: 'legal', label: 'Legal, Docs & Disclosures' },
              { id: 'invest', label: 'Subscribe / Invest' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveSection(t.id as typeof activeSection)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${ activeSection === t.id ?'bg-white text-black' : 'bg-neutral-900 text-zinc-300 hover:text-white'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="text-xs font-mono tabular-nums text-zinc-300">
            AQX Score: <strong className="text-white">{asset.aqxScore.overall}/100</strong> · Risk:{''}
            <strong className="text-white">{asset.passport.riskRating}</strong>
          </div>
        </div>

        {/* Body */}
        <div className="p-3.5 max-h-[70vh] overflow-y-auto space-y-3 text-xs">
          {activeSection === 'overview' && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl bg-neutral-900/60">
                  <span className="text-zinc-400 block">Unit Value</span>
                  <span className="text-base font-bold font-mono tabular-nums text-white">
                    {formatCurrencyFromMinorUnits(asset.token.unitValueMinorUnits, asset.passport.currency)}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-neutral-900/60">
                  <span className="text-zinc-400 block">Minimum Investment</span>
                  <span className="text-base font-bold font-mono tabular-nums text-white">
                    {formatCurrencyFromMinorUnits(asset.token.minInvestmentMinorUnits, asset.passport.currency)}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-neutral-900/60">
                  <span className="text-zinc-400 block">Target / Funded</span>
                  <span className="text-base font-bold font-mono tabular-nums text-white">
                    {Math.round((asset.passport.fundedAmountMinorUnits / Math.max(1, asset.passport.targetRaiseMinorUnits)) * 100)}%
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-neutral-900/60">
                  <span className="text-zinc-400 block">Liquidity Profile</span>
                  <span className="text-sm font-semibold text-white">
                    {asset.passport.liquidityClassification.replace(/_/g,'')}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white">Investment Thesis</h3>
                <p className="text-zinc-300 leading-relaxed">{asset.investmentThesis}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-neutral-900/60 space-y-1.5">
                  <h4 className="font-bold text-white">Distribution Schedule & Illustrative Yield</h4>
                  <p className="text-zinc-300">{asset.passport.distributionSchedule}</p>
                  <p className="text-zinc-400">{asset.passport.expectedYieldLabel}</p>
                </div>
                <div className="p-4 rounded-xl bg-neutral-900/60 space-y-1.5">
                  <h4 className="font-bold text-white">Ownership & Governance</h4>
                  <p className="text-zinc-300">Issuer: {asset.passport.issuer}</p>
                  <p className="text-zinc-400">{asset.token.votingRights}</p>
                </div>
              </div>

              {asset.faqs.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-sm font-bold text-white">Frequently Asked Questions</h3>
                  {asset.faqs.map((faq, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-neutral-900/40">
                      <p className="font-semibold text-white">{faq.question}</p>
                      <p className="text-zinc-400 mt-1">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setActiveSection('invest')}
                  className="px-3.5 py-2.5 rounded-lg bg-white text-black font-bold hover:bg-zinc-200 cursor-pointer"
                >
                  Proceed to Investment Disclosures
                </button>
              </div>
            </div>
          )}

          {activeSection === 'financials' && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-neutral-900/60 space-y-2">
                  <h3 className="text-sm font-bold text-white">Financials & Valuation Snapshot</h3>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Annual Revenue</span>
                    <span className="font-mono text-white">{asset.financialSummary.annualRevenueDisplay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">EBITDA</span>
                    <span className="font-mono text-white">{asset.financialSummary.ebitdaDisplay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Distributable Cash Flow</span>
                    <span className="font-mono text-white">{asset.financialSummary.cashFlowDisplay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Leverage</span>
                    <span className="font-mono text-white">{asset.financialSummary.debtToEquityDisplay}</span>
                  </div>
                  <div className="pt-2 text-zinc-400">
                    Valuation Basis: {asset.financialSummary.valuationBasis}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-900/60 space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white">AQX Asset Intelligence</h3>
                    <span className="font-mono font-bold text-base text-white">{asset.aqxScore.overall}/100</span>
                  </div>
                  <p className="text-zinc-300">{asset.aqxScore.methodology}</p>
                  <p className="text-zinc-400">Sources: {asset.aqxScore.dataSources.join(',')}</p>
                  <p className="text-zinc-400 font-mono">
                    Confidence: {asset.aqxScore.confidenceLevel} · {asset.aqxScore.timestamp}
                  </p>
                  <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-200">
                    Limitations: {asset.aqxScore.limitations.join(' ')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'legal' && (
            <div className="space-y-2.5">
              <div className="p-4 rounded-xl bg-neutral-900/60 space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400"/>
                  Legal Structure, Eligibility & Regulatory Disclosures
                </h3>
                <p className="text-zinc-300">
                  <strong>Legal Structure:</strong> {asset.passport.legalStructure}
                </p>
                <p className="text-amber-300">
                  <strong>Regulatory Status:</strong> {asset.passport.regulatoryStatus}
                </p>
                <p className="text-zinc-300">
                  <strong>Transfer Rules:</strong> {asset.passport.transferRules}
                </p>
                <p className="text-zinc-300">
                  <strong>Investor Eligibility:</strong> {asset.passport.investorEligibility}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4"/>
                  Verified Offering & Legal Documents
                </h3>
                {asset.documents.map((doc) => (
                  <div key={doc.id} className="p-3 rounded-lg bg-neutral-900/50 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{doc.title}</p>
                      <p className="text-zinc-400 font-mono text-[11px]">
                        {doc.category} · v{doc.version} · SHA-256: {doc.sha256Hash.slice(0, 16)}...
                      </p>
                    </div>
                    <span className="font-mono text-emerald-400">{doc.verificationStatus}</span>
                  </div>
                ))}
              </div>

              <div>
                <button
                  onClick={() => setShowTechDetails((p) => !p)}
                  className="flex items-center gap-1.5 text-zinc-300 hover:text-white font-semibold cursor-pointer"
                >
                  {showTechDetails ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                  <span>Technical Details (Digital Asset Account & Unit Registry)</span>
                </button>
                {showTechDetails && (
                  <div className="mt-2 p-3.5 rounded-xl bg-neutral-900/70 font-mono text-[11px] space-y-1">
                    <div>Registry Standard: {asset.token.tokenStandard}</div>
                    <div>
                      Ledger Adapter:{' '}
                      {BLOCKCHAIN_ADAPTERS.find((b) => b.id === asset.token.blockchainNetworkId)?.name ||
                        asset.token.blockchainNetworkId}
                    </div>
                    <div>Contract Reference: {asset.token.contractAddress}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'invest' && (
            <div className="space-y-2.5">
              {receipt ? (
                <div className="p-3.5 rounded-lg bg-emerald-500/10 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-300 text-base font-bold">
                    <CheckCircle2 className="w-5 h-5"/>
                    <span>Investment Subscription Confirmed (DEMO Ledger)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                    <div>
                      <span className="text-zinc-400 block font-sans">Order Reference</span>
                      <span className="text-white">{receipt.id}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block font-sans">Investment Units Allocated</span>
                      <span className="text-white font-bold">{receipt.unitsAllocatedDisplay} {asset.token.tokenSymbol}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block font-sans">Principal Subscribed</span>
                      <span className="text-white">{formatCurrencyFromMinorUnits(receipt.grossAmountMinorUnits, receipt.currency)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block font-sans">Administrative Fee</span>
                      <span className="text-white">{formatCurrencyFromMinorUnits(receipt.feeMinorUnits, receipt.currency)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-zinc-400 block font-sans">Audit Receipt Fingerprint</span>
                      <span className="text-zinc-200">{receipt.receiptHash}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleConfirmInvestment} className="space-y-4">
                  {/* Mandatory Disclosures before investment */}
                  <div className="p-4 rounded-xl bg-amber-500/10 space-y-2 text-amber-100">
                    <div className="font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-300"/>
                      <span>Pre-Investment Mandatory Disclosures</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Risk Warning: Private capital and real-world assets carry capital loss risk; no return is guaranteed.</li>
                      <li>Liquidity Limitation: {asset.passport.liquidityClassification.replace(/_/g,'')}; transfers restricted by {asset.token.lockupPeriodDays}-day lock-up.</li>
                      <li>Eligibility & Structure: {asset.passport.investorEligibility} · {asset.passport.legalStructure}.</li>
                      <li>Fee Disclosure: Standard {feeRule.percentageBps / 100}% subscription fee + base charge applies.</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-zinc-400 block mb-1">
                        Subscription Amount ({asset.passport.currency})
                      </label>
                      <input
                        type="number"
                        step="1"
                        min={asset.token.minInvestmentMinorUnits / 100}
                        value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value)}
                        className="w-full bg-neutral-900 rounded-lg px-3 py-2.5 text-base font-mono text-white"
                        required
                      />
                    </div>

                    {breakdown && (
                      <div className="p-3.5 rounded-xl bg-neutral-900/70 space-y-1.5 font-mono tabular-nums">
                        <div className="flex justify-between">
                          <span className="text-zinc-400 font-sans">Investment Units Allocated</span>
                          <span className="text-white font-bold">{breakdown.unitsAllocatedDisplay} units</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400 font-sans">Fee ({feeRule.percentageBps / 100}%)</span>
                          <span className="text-white">{formatCurrencyFromMinorUnits(breakdown.feeMinorUnits, asset.passport.currency)}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-zinc-400 font-sans">Total Commitment</span>
                          <span className="text-emerald-400 font-bold">
                            {formatCurrencyFromMinorUnits(breakdown.totalChargeMinorUnits, asset.passport.currency)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <label className="flex items-start gap-2.5 text-zinc-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={disclosuresAccepted}
                      onChange={(e) => setDisclosuresAccepted(e.target.checked)}
                      className="mt-0.5 rounded bg-neutral-900"
                    />
                    <span>
                      I confirm my KYC/KYB eligibility and accept the Risk Warning, Liquidity Warning, Fee Schedule,
                      Transfer Restrictions, and Offering Memorandum for {asset.passport.passportId}.
                    </span>
                  </label>

                  {error && (
                    <div className="p-3 rounded-lg bg-rose-500/10 text-rose-300">
                      {error}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400"/>
                      Idempotency-Key protected order submission
                    </span>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-3.5 py-2.5 rounded-lg bg-white text-black font-bold hover:bg-zinc-200 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? 'Allocating Units...' : 'Confirm Investment Subscription'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
