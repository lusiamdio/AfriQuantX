import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  ArrowRight,
  LayoutDashboard,
  Briefcase,
  Store,
  BarChart3,
  Rocket,
  Cpu,
  Calculator,
  Scale,
  FileText,
  Layers,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { canRoleAccessTab, type WorkspaceRole } from '../lib/roleAccess';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  userRole?: WorkspaceRole;
}

export function CommandPalette({ isOpen, onClose, onNavigate, userRole = 'investor' }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const actions = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id:'marketplace', label:'RWA Marketplace & Offerings', icon: Store },
    { id: 'index', label: 'AQX RWA100 Benchmark Index', icon: BarChart3 },
    { id: 'portfolio', label: 'Portfolio & Asset Allocations', icon: Briefcase },
    { id: 'market-secondary', label: 'Controlled Secondary Market', icon: ArrowRight },
    { id: 'algo-trading', label: 'Algorithmic Execution Desk', icon: Cpu },
    { id: 'issuer-dashboard', label: 'Issuer & Fund Console', icon: Building2 },
    { id: 'tokenisation-hub', label: 'Asset Tokenisation & Passports', icon: Layers },
    { id: 'ipo-launch', label: 'Capital Raise & IPO Bookbuilding', icon: Rocket },
    { id: 'kyc-kyb', label: 'KYC / KYB Verification Center', icon: ShieldCheck },
    { id: 'valuation-workbench', label: 'DCF & Valuation Workbench', icon: Calculator },
    { id: 'tax-compliance', label: 'Tax & Compliance Hub', icon: Scale },
    { id: 'reports', label: 'Reports & Audit Statements', icon: FileText },
    { id: 'governance-audit', label: 'Governance & Immutable Audit', icon: ShieldCheck },
  ];

  const roleAllowedActions = actions.filter((action) => canRoleAccessTab(userRole, action.id));
  const filteredActions = roleAllowedActions.filter((action) =>
    action.label.toLowerCase().includes(query.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[18vh] px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -12 }}
          transition={{ duration: 0.16 }}
          className="relative w-full max-w-xl bg-[#0D111A] rounded-lg shadow-2xl overflow-hidden"
        >
          <div className="flex items-center px-4 py-3.5 bg-white/[0.03]">
            <Search className="w-4 h-4 text-slate-400 mr-3 shrink-0"/>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Jump to workspace section..."
              className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-slate-500"
            />
            <kbd className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-mono text-slate-400">
              ESC
            </kbd>
          </div>

          <div className="max-h-[55vh] overflow-y-auto p-2">
            {filteredActions.length > 0 ? (
              <div className="space-y-0.5">
                {filteredActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => {
                        onNavigate(action.id);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/[0.06] text-left group transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#141A26] flex items-center justify-center text-slate-300 group-hover:text-emerald-400 transition-colors">
                          <Icon className="w-4 h-4"/>
                        </div>
                        <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                          {action.label}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center text-slate-400 text-sm">
                No matching workspace views for &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
