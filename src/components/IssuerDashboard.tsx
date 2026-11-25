import React, { useEffect, useState } from 'react';
import { Building2, Users, Layers, Coins, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { DistributionBatchRecord, RwaAsset } from '../types/rwa';
import { INITIAL_DEMO_ASSETS } from '../services/rwaPlatformService';
import { formatCurrencyFromMinorUnits } from '../lib/financialMath';
import { rwaFetch } from '../lib/rwaApi';

export function IssuerDashboard({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const [assets, setAssets] = useState<RwaAsset[]>(INITIAL_DEMO_ASSETS);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(INITIAL_DEMO_ASSETS[0].id);
  const [distributions, setDistributions] = useState<DistributionBatchRecord[]>([]);
  const [distAmount, setDistAmount] = useState('420000');
  const [distType, setDistType] = useState<DistributionBatchRecord['distributionType']>('RENTAL');
  const [withholdingBps, setWithholdingBps] = useState('1500');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, dRes] = await Promise.all([
          rwaFetch<{ assets: RwaAsset[] }>('/assets'),
          rwaFetch<{ distributions: DistributionBatchRecord[] }>('/distributions'),
        ]);
        if (aRes.assets?.length) setAssets(aRes.assets);
        if (dRes.distributions) setDistributions(dRes.distributions);
      } catch {
        // Fallback smoothly
      }
    };
    void load();
  }, []);

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) || assets[0];

  const handleIssueDistribution = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalDeclaredMinorUnits = Math.round(Number(distAmount) * 100);
    if (!Number.isFinite(totalDeclaredMinorUnits) || totalDeclaredMinorUnits <= 0) return;

    setLoading(true);
    setStatusMsg(null);
    const idempotencyKey = `dist-${selectedAsset.id}-${Date.now()}`;
    try {
      const res = await rwaFetch<{ batch: DistributionBatchRecord }>(
        '/distributions',
        {
          method: 'POST',
          headers: { 'Idempotency-Key': idempotencyKey },
          body: JSON.stringify({
            assetId: selectedAsset.id,
            distributionType: distType,
            totalDeclaredMinorUnits,
            withholdingTaxBps: Number(withholdingBps) || 1500,
          }),
        },
        'ISSUER'
      );
      setDistributions((prev) => [res.batch, ...prev]);
      setStatusMsg(
        `Distribution ${res.batch.id} executed across ${res.batch.entitlementCount} verified holder(s) with deterministic pro-rata rounding.`
      );
    } catch (err) {
      setStatusMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 bg-black text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5">
        <div>
          <p className="text-xs text-zinc-400">
            Issuer Command · Offering & Pro-Rata Distribution Management (DEMO)
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            {selectedAsset.passport.issuer}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedAsset.id}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            className="bg-neutral-900 rounded-lg px-3 py-2 text-xs font-semibold text-white"
          >
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.passport.passportId})
              </option>
            ))}
          </select>
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('tokenisation-hub')}
              className="px-4 py-2 rounded-lg bg-white text-black text-xs font-bold hover:bg-zinc-200 cursor-pointer whitespace-nowrap"
            >
              Manage Passport & Docs
            </button>
          )}
        </div>
      </div>

      {/* Issuer KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl bg-neutral-950">
          <span className="text-xs text-zinc-400 block">Total Capital Raised</span>
          <span className="text-lg font-bold font-mono tabular-nums text-white mt-1 block">
            {formatCurrencyFromMinorUnits(selectedAsset.passport.fundedAmountMinorUnits, selectedAsset.passport.currency)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-neutral-950">
          <span className="text-xs text-zinc-400 block">Active Investors</span>
          <span className="text-lg font-bold font-mono tabular-nums text-white mt-1 block">1,284</span>
        </div>
        <div className="p-4 rounded-xl bg-neutral-950">
          <span className="text-xs text-zinc-400 block">Outstanding Units</span>
          <span className="text-lg font-bold font-mono tabular-nums text-white mt-1 block">
            {selectedAsset.token.totalSupplyDisplay}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-neutral-950">
          <span className="text-xs text-zinc-400 block">Distributions Issued</span>
          <span className="text-lg font-bold font-mono tabular-nums text-white mt-1 block">
            {distributions.length > 0
              ? formatCurrencyFromMinorUnits(distributions[0].totalDeclaredMinorUnits, distributions[0].currency)
              : 'R 420,000.00'}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-neutral-950">
          <span className="text-xs text-zinc-400 block">Compliance Readiness</span>
          <span className="text-lg font-bold font-mono tabular-nums text-emerald-400 mt-1 block">98%</span>
        </div>
        <div className="p-4 rounded-xl bg-neutral-950">
          <span className="text-xs text-zinc-400 block">Asset Status</span>
          <span className="text-sm font-bold font-mono text-emerald-400 mt-1.5 block">
            {selectedAsset.passport.offeringStatus}
          </span>
        </div>
      </div>

      {statusMsg && (
        <div role="status"className="p-3.5 rounded-xl bg-emerald-500/10 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0"/>
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Distribution Engine + History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <form onSubmit={handleIssueDistribution} className="lg:col-span-5 bg-neutral-950 rounded-lg p-3.5 space-y-4 text-xs">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-400"/>
            Declare & Execute Pro-Rata Distribution
          </h2>
          <p className="text-zinc-400">
            Calculates exact integer minor-unit entitlements across verified token holders with deterministic remainder
            allocation and automatic withholding tax deduction.
          </p>

          <div>
            <label className="text-zinc-400 block mb-1">Distribution Type</label>
            <select
              value={distType}
              onChange={(e) => setDistType(e.target.value as DistributionBatchRecord['distributionType'])}
              className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white"
            >
              <option value="RENTAL">Rental Distribution</option>
              <option value="DIVIDEND">Corporate Dividend</option>
              <option value="INTEREST">Coupon / Interest</option>
              <option value="PROJECT_PROCEEDS">Infrastructure Project Proceeds</option>
              <option value="REDEMPTION">Principal Redemption</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-400 block mb-1">Gross Distributable ({selectedAsset.passport.currency})</label>
              <input
                type="number"
                value={distAmount}
                onChange={(e) => setDistAmount(e.target.value)}
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Withholding Tax (bps)</label>
              <input
                type="number"
                value={withholdingBps}
                onChange={(e) => setWithholdingBps(e.target.value)}
                className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-white text-black font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            {loading ? 'Executing Batch...' : 'Verify Compliance & Execute Distribution Batch'}
          </button>
        </form>

        <div className="lg:col-span-7 bg-neutral-950 rounded-lg p-3.5 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-zinc-300"/>
            Executed Distribution Batches & Investor Entitlements
          </h2>
          {distributions.length === 0 ? (
            <div className="p-4 text-center rounded-xl text-xs text-zinc-400 bg-white/[0.03]">
              No distribution batches executed in this session yet. Declare a distribution to compute and inspect pro-rata
              entitlement statements.
            </div>
          ) : (
            <div className="space-y-4">
              {distributions.map((batch) => (
                <div key={batch.id} className="p-4 rounded-xl bg-neutral-900/60 space-y-3 text-xs">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div>
                      <span className="font-bold text-white">{batch.id}</span>
                      <span className="text-zinc-400 ml-2">
                        {batch.assetName} · {batch.distributionType}
                      </span>
                    </div>
                    <span className="font-mono text-emerald-400 font-semibold">{batch.status}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 font-mono tabular-nums text-[11px]">
                    <div>
                      <span className="text-zinc-400 block font-sans">Gross Declared</span>
                      <span className="text-white">{formatCurrencyFromMinorUnits(batch.totalDeclaredMinorUnits, batch.currency)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block font-sans">Withholding + Fee</span>
                      <span className="text-amber-300">
                        {formatCurrencyFromMinorUnits(batch.totalWithholdingTaxMinorUnits + batch.totalFeeMinorUnits, batch.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block font-sans">Net Paid</span>
                      <span className="text-emerald-400 font-bold">
                        {formatCurrencyFromMinorUnits(batch.totalNetPaidMinorUnits, batch.currency)}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 space-y-1">
                    {batch.entitlements.map((ent) => (
                      <div key={ent.investorId} className="flex justify-between font-mono text-[11px] text-zinc-300">
                        <span className="font-sans">{ent.investorName} ({(ent.ownershipBps / 100).toFixed(2)}%)</span>
                        <span>Net: {formatCurrencyFromMinorUnits(ent.netPayoutMinorUnits, batch.currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
