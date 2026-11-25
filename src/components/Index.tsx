import React, { useEffect, useState } from 'react';
import { Globe, TrendingUp, ArrowUpRight, Info, ShieldCheck } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { rwaFetch } from '../lib/rwaApi';

const INDEX_SERIES = [
  { name: 'Jan', value: 1295 },
  { name: 'Feb', value: 1318 },
  { name: 'Mar', value: 1310 },
  { name: 'Apr', value: 1344 },
  { name: 'May', value: 1368 },
  { name: 'Jun', value: 1392 },
  { name: 'Jul', value: 1405 },
  { name: 'Aug', value: 1421 },
  { name: 'Sep', value: 1448 },
  { name: 'Oct', value: 1462 },
  { name: 'Nov', value: 1485 },
];

const CATEGORY_COLORS = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
  '#6366f1',
  '#94a3b8',
];

export function Index({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const [methodology, setMethodology] = useState<'MARKET_CAP_WEIGHTED' | 'EQUAL_WEIGHTED' | 'LIQUIDITY_ADJUSTED'>(
    'MARKET_CAP_WEIGHTED'
  );
  const [indexData, setIndexData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await rwaFetch<any>(`/rwa100?methodology=${methodology}`);
        setIndexData(res);
      } catch {
        // Silent fallback below
      }
    };
    void load();
  }, [methodology]);

  const categories = indexData?.categories || [
    { name: 'Real Estate', weight: 18.5, countries: ['South Africa', 'Kenya', 'Morocco'] },
    { name: 'Energy', weight: 16.0, countries: ['Ghana', 'Kenya', 'South Africa'] },
    { name: 'Infrastructure', weight: 15.5, countries: ['Angola', 'Morocco', 'Egypt'] },
    { name: 'Technology', weight: 12.0, countries: ['Nigeria', 'Kenya', 'South Africa'] },
    { name: 'Agriculture', weight: 10.5, countries: ['Kenya', 'Ghana', 'Rwanda'] },
    { name: 'Healthcare', weight: 8.5, countries: ['Rwanda', 'Egypt'] },
    { name:'Manufacturing', weight: 7.0, countries: ['Nigeria','Morocco','Egypt'] },
    { name: 'Logistics', weight: 6.5, countries: ['Angola', 'South Africa'] },
    { name: 'Financial Assets', weight: 5.5, countries: ['South Africa', 'Nigeria', 'Kenya'] },
  ];

  const constituents = indexData?.constituents || [];

  return (
    <div className="space-y-3 bg-black text-white">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5">
        <div>
          <p className="text-xs font-medium text-zinc-400">
            Pan-African Flagship Benchmark · 9 RWA Sectors · 8 Priority Markets · DEMO
          </p>
          <div className="flex items-center gap-3 mt-1">
            <Globe className="w-6 h-6 text-emerald-400"/>
            <h1 className="text-3xl font-bold text-white tracking-tight">AQX RWA100</h1>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Tracking verified real-world asset and digital capital-market instruments across Africa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 p-1 bg-neutral-900 rounded-lg text-xs">
            {[
              { id: 'MARKET_CAP_WEIGHTED', label: 'Valuation Weighted' },
              { id: 'EQUAL_WEIGHTED', label: 'Equal Weighted' },
              { id: 'LIQUIDITY_ADJUSTED', label: 'Liquidity Adjusted' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMethodology(m.id as typeof methodology)}
                className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer whitespace-nowrap ${ methodology === m.id ?'bg-white text-black':'text-zinc-400 hover:text-white'}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="text-right font-mono tabular-nums">
            <span className="text-xs text-zinc-400 block font-sans">Indicative Index Level (DEMO)</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{indexData?.value?.toFixed(2) ??'1485.20'}</span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5"/>
                {indexData?.annualChangePct ?? '+14.20%'} YoY
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transparent DEMO Disclaimer */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 text-xs text-amber-200 flex items-start gap-2.5">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-300"/>
        <span>
          {indexData?.disclaimer ||
'DEMO METHODOLOGY SIMULATION: Index levels and constituent weights are demonstration snapshots requiring licensed external market data feeds prior to benchmark publication.'}
        </span>
      </div>

      {/* Main Chart + Sector Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-neutral-950 rounded-lg p-3.5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-white">Indicative Performance Trajectory (DEMO)</h2>
            <div className="flex gap-4 text-xs font-mono tabular-nums text-zinc-300">
              <span>1D: {indexData?.dailyChangePct ?? '+0.42%'}</span>
              <span>1W: {indexData?.weeklyChangePct ?? '+1.85%'}</span>
              <span>1M: {indexData?.monthlyChangePct ?? '+3.90%'}</span>
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <AreaChart data={INDEX_SERIES} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRwa"x1="0"y1="0"x2="0"y2="1">
                    <stop offset="5%"stopColor="#10b981"stopOpacity={0.3} />
                    <stop offset="95%"stopColor="#10b981"stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor:'#0a0a0a',
                    border:'none',
                    borderRadius: '10px',
                  }}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRwa)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-neutral-950 rounded-lg p-3.5 space-y-4">
          <h2 className="text-base font-bold text-white">9-Sector Asset Weighting</h2>
          <div className="h-44 relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <PieChart>
                <Pie data={categories} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="weight" stroke="none">
                  {categories.map((_: any, idx: number) => (
                    <Cell key={idx} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor:'#0a0a0a',
                    border:'none',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 text-xs">
            {categories.map((cat: any, idx: number) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm"style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} />
                  <span className="text-zinc-300">{cat.name}</span>
                </div>
                <span className="font-mono tabular-nums text-white font-semibold">{cat.weight}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Constituents Table */}
      <div className="bg-neutral-950 rounded-lg p-3.5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400"/>
            Indexed DEMO Constituents & Country Weights
          </h2>
          <button
            onClick={() => setActiveTab('marketplace')}
            className="px-4 py-1.5 rounded-lg bg-white text-black text-xs font-bold hover:bg-zinc-200 cursor-pointer"
          >
            Explore RWA Marketplace
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-zinc-400">
                <th className="py-1.5 px-3">Passport</th>
                <th className="py-1.5 px-3">Asset Name</th>
                <th className="py-1.5 px-3">Category</th>
                <th className="py-1.5 px-3">Country</th>
                <th className="py-1.5 px-3">AQX Score</th>
                <th className="py-1.5 px-3 text-right">Index Weight</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {constituents.map((item: any) => (
                <tr key={item.assetId} className="hover:bg-white/[0.02]">
                  <td className="py-1.5 px-3 text-zinc-300">{item.passportId}</td>
                  <td className="py-1.5 px-3 font-sans font-semibold text-white">
                    {item.name} <span className="text-zinc-500 font-normal">({item.ticker})</span>
                  </td>
                  <td className="py-1.5 px-3 font-sans text-zinc-300">{item.assetClass}</td>
                  <td className="py-1.5 px-3 font-sans text-zinc-300">{item.country}</td>
                  <td className="py-1.5 px-3 text-emerald-400">{item.aqxScore}/100</td>
                  <td className="py-1.5 px-3 text-right text-white font-bold">{item.weightPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
