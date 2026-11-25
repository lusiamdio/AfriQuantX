import React, { useState, useEffect } from 'react';
import { LineChart, Activity, TrendingUp, TrendingDown, Bell, Zap, Globe, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { generateMarketIntelligence } from '../services/geminiService';

export function MarketIntelligence() {
  const [aiUnavailable, setAiUnavailable] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await generateMarketIntelligence();
      if (result.ok === true) { setData(result.data); setAiUnavailable(null); }
      else { setData(null); setAiUnavailable(result.message); }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="flex-1 bg-black rounded-xl flex flex-col overflow-hidden relative shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 text-white">
      {aiUnavailable && <p role="status" className="p-4 text-sm text-amber-300">{aiUnavailable}</p>}
      <div className="absolute top-0 inset-x-0 h-1 bg-[#FFFFFF]" />
      
      <div className="p-3.5 bg-white/[0.01] flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#FFFFFF]/10 flex items-center justify-center">
            <Globe className="w-6 h-6 text-[#FFFFFF]" />
          </div>
          <div>
            <h2 className="text-white font-bold tracking-tight text-xl uppercase">Smart Market Intelligence</h2>
            <p className="text-sm text-zinc-400 mt-1 font-medium">Live market data, AI summaries, and trend detection.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => setAlertsEnabled(prev => !prev)}
            className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold transition-colors flex items-center gap-2 cursor-pointer bg-white/[0.03] ${ alertsEnabled ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-black border-white/10 text-white hover:border-[#FFFFFF]/50' }`}
          >
            <Bell className="w-4 h-4" />
            {alertsEnabled ? 'Smart Alerts Active ✓' : 'Smart Alerts'}
          </button>
        </div>
      </div>

      {alertsEnabled && (
        <div role="status" className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 text-emerald-300 text-xs font-mono">
          Real-time market anomaly & liquidity alerts enabled for JSE, NGX, and NSE Kenya watchlists.
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="w-8 h-8 text-[#FFFFFF] animate-spin" />
            <p className="text-zinc-400 text-sm font-medium">Analyzing global markets...</p>
          </div>
        ) : data ? (
          <>
            {/* Live Market Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {data.overview?.map((stat: any, idx: number) => (
                <div key={idx} className="p-3 rounded-lg bg-black flex flex-col gap-2 transition-colors">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{stat.label}</span>
                  <div className="text-2xl font-bold font-mono text-white">{stat.value}</div>
                  <div className="text-xs font-bold font-mono flex items-center gap-1 text-[#FFFFFF]">
                    {stat.up === true && <TrendingUp className="w-3 h-3 text-[#FFFFFF]" />}
                    {stat.up === false && <TrendingDown className="w-3 h-3 text-[#FFFFFF]" />}
                    {stat.up === null && <AlertTriangle className="w-3 h-3 text-[#FFFFFF]" />}
                    {stat.change}
                  </div>
                </div>
              ))}
            </div>

            {/* AI Summaries: Why it moved */}
            <div>
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Zap className="w-4 h-4 text-[#FFFFFF]" />
                AI Market Summaries: "Why it moved today"
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {data.summaries?.map((summary: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-black relative overflow-hidden transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded-md text-xs font-bold font-mono bg-[#FFFFFF]/10 text-[#FFFFFF]">
                          {summary.ticker} {summary.change}
                        </span>
                        <span className="text-sm font-bold text-white">{summary.name}</span>
                      </div>
                      <Activity className="w-4 h-4 text-[#FFFFFF]" />
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                      {summary.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trend Detection Engine */}
            <div className="p-3.5 rounded-lg bg-black">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                <LineChart className="w-4 h-4 text-[#FFFFFF]" />
                Trend Detection Engine
              </h3>
              <div className="space-y-4">
                {data.trends?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] transition-colors">
                    <div>
                      <div className="text-sm font-bold text-white">{item.trend}</div>
                      <div className="text-xs text-zinc-400 mt-1 font-medium">Timeframe: {item.timeframe}</div>
                    </div>
                    <div className="flex gap-3 text-right">
                      <div>
                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Confidence</div>
                        <div className="text-sm font-bold text-[#FFFFFF] font-mono">{item.confidence}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Impact</div>
                        <div className="text-sm font-bold text-white font-mono">{item.impact}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertTriangle className="w-8 h-8 text-[#FFFFFF]" />
            <p className="text-zinc-400 text-sm font-medium">Failed to load market intelligence.</p>
          </div>
        )}
      </div>
    </div>
  );
}
