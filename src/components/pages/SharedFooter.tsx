import React, { useState } from 'react';
import {
  Send, ShieldCheck, CheckCircle2, X,
} from 'lucide-react';

interface SharedFooterProps {
  onNavigatePage: (page: string) => void;
  onNavigateToAuth?: () => void;
}

export function SharedFooter({ onNavigatePage, onNavigateToAuth }: SharedFooterProps) {
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [legalDoc, setLegalDoc] = useState<string | null>(null);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriberEmail.trim() || !subscriberEmail.includes('@')) return;
    setSubscribed(true);
    setSubscriberEmail('');
  };

  return (
    <footer className="bg-[#0A0A0A] text-white pt-20 pb-5 px-3.5 lg:px-5 text-xs font-sans relative overflow-hidden">
      <div className="max-w-[1240px] mx-auto space-y-5 relative z-10">

        {/* Top Newsletter & Institutional Briefing Bar */}
        <div className="bg-zinc-900/80 rounded-xl p-4 lg:p-4 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="space-y-2 max-w-xl text-center lg:text-left">
            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              Get weekly institutional market insights.
            </h3>
            <p className="text-zinc-400 text-sm font-normal">
              Receive quantitative RWA research and Pan-African fixed-income / equity briefings every Monday morning.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {subscribed ? (
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold px-4 py-3 rounded-xl bg-emerald-500/10">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Subscribed to weekly institutional briefing (DEMO).</span>
              </div>
            ) : (
              <>
                <div className="relative w-full sm:w-80">
                  <input
                    type="email"
                    required
                    value={subscriberEmail}
                    onChange={(e) => setSubscriberEmail(e.target.value)}
                    placeholder="Enter your work email"
                    className="w-full bg-[#0A0A0A] rounded-full px-5 py-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white hover:bg-zinc-200 text-black font-bold text-xs tracking-tight transition-all duration-200 flex items-center justify-center gap-2 shrink-0 shadow-md cursor-pointer"
                >
                  <span>Subscribe</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </form>
        </div>

        {/* Navigation Link Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
          <div className="space-y-4">
            <h5 className="font-mono font-bold text-white uppercase tracking-wider text-[11px]">SOLUTIONS</h5>
            <ul className="space-y-2.5 text-zinc-400 text-sm">
              <li onClick={onNavigateToAuth} className="hover:text-white cursor-pointer transition-colors">Global Multi-Currency</li>
              <li onClick={onNavigateToAuth} className="hover:text-white cursor-pointer transition-colors">Instant FX Clearing</li>
              <li onClick={onNavigateToAuth} className="hover:text-white cursor-pointer transition-colors">SPV Asset Tokenisation</li>
              <li onClick={onNavigateToAuth} className="hover:text-white cursor-pointer transition-colors">Treasury Yield Vaults</li>
              <li onClick={onNavigateToAuth} className="hover:text-white cursor-pointer transition-colors">Controlled Secondary Desk</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h5 className="font-mono font-bold text-white uppercase tracking-wider text-[11px]">PLATFORM</h5>
            <ul className="space-y-2.5 text-zinc-400 text-sm">
              <li onClick={onNavigateToAuth} className="hover:text-white cursor-pointer transition-colors">Quantitative Router Node</li>
              <li onClick={onNavigateToAuth} className="hover:text-white cursor-pointer transition-colors">Risk Governance Matrix</li>
              <li onClick={() => onNavigatePage('business')} className="hover:text-white cursor-pointer transition-colors">Enterprise Treasury</li>
              <li onClick={() => onNavigatePage('about')} className="hover:text-white cursor-pointer transition-colors">Architecture & SLAs</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h5 className="font-mono font-bold text-white uppercase tracking-wider text-[11px]">INSTITUTIONAL</h5>
            <ul className="space-y-2.5 text-zinc-400 text-sm">
              <li onClick={() => onNavigatePage('business')} className="hover:text-white cursor-pointer transition-colors">Investment Banking Advisory</li>
              <li onClick={() => onNavigatePage('business')} className="hover:text-white cursor-pointer transition-colors">Underwriting & Syndication</li>
              <li onClick={() => onNavigatePage('about')} className="hover:text-white cursor-pointer transition-colors">Security Audits</li>
              <li onClick={() => onNavigatePage('about')} className="hover:text-white cursor-pointer transition-colors">Compliance Protocols</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h5 className="font-mono font-bold text-white uppercase tracking-wider text-[11px]">COMPANY</h5>
            <ul className="space-y-2.5 text-zinc-400 text-sm">
              <li onClick={() => onNavigatePage('about')} className="hover:text-white cursor-pointer transition-colors">About AfriQuantX</li>
              <li onClick={() => onNavigatePage('about')} className="hover:text-white cursor-pointer transition-colors">Careers</li>
              <li onClick={() => onNavigatePage('about')} className="hover:text-white cursor-pointer transition-colors">Press & Media</li>
              <li onClick={() => onNavigatePage('about')} className="hover:text-white cursor-pointer transition-colors">Contact Us</li>
            </ul>
          </div>
        </div>

        {/* Legal & Regulatory Footnote */}
        <div className="pt-4 space-y-2.5 font-mono text-[11px] text-zinc-500 leading-relaxed">
          <p>
            AfriQuantX Technologies Inc. (AQX) provides real-world asset structuring workflows and liquidity analytics across African markets. Live regulated issuance requires jurisdiction-specific SPV documentation, custodian appointments, and regulatory authorisation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-400 pt-2">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center text-[#10B981]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span>© 2026 AfriQuantX Technologies Inc. All rights reserved.</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {['Privacy Policy', 'Terms of Service', 'Regulatory Disclosures', 'Security'].map((doc) => (
                <button
                  key={doc}
                  type="button"
                  onClick={() => setLegalDoc(doc)}
                  className="hover:text-white cursor-pointer transition-colors"
                >
                  {doc}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {legalDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0D111A] rounded-lg max-w-md w-full p-3.5 space-y-4">
            <div className="flex items-center justify-between pb-3">
              <h4 className="text-sm font-bold text-white">{legalDoc}</h4>
              <button type="button" onClick={() => setLegalDoc(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              AfriQuantX isolates investor PII off-chain and enforces role-based compliance gating across all RWA asset workflows. Regulated financial transactions depend on completed SPV legal opinions and licensed regional partners.
            </p>
            <button
              type="button"
              onClick={() => setLegalDoc(null)}
              className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}
