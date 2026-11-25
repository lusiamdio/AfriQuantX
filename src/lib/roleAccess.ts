import type { PlatformRole } from '../types/rwa';

export type WorkspaceRole = 'investor' | 'company' | 'admin';

export type InvestorIdentity = 'EQUITY_FUNDER' | 'VENTURE_CAPITAL' | 'PRIVATE_INVESTOR';
export type CompanyPosition = 'STARTUP' | 'HEDGE_FUND';

export interface SubRoleMetadata<T extends string> {
  id: T;
  label: string;
  tagline: string;
  focusSummary: string;
  platformRole: PlatformRole;
}

export const INVESTOR_IDENTITIES: SubRoleMetadata<InvestorIdentity>[] = [
  {
    id: 'EQUITY_FUNDER',
    label: 'Equity Funder',
    tagline: 'Direct Primary & Growth Equity',
    focusSummary: 'Structured SPV equity participation, revenue-share mandates, and direct cap-table allocations.',
    platformRole: 'INSTITUTIONAL_INVESTOR',
  },
  {
    id: 'VENTURE_CAPITAL',
    label: 'Venture Capital',
    tagline: 'Institutional Early & Series Allocator',
    focusSummary: 'Syndicate deal flow, multi-stage African venture tranches, SAFEs/notes, and AQX RWA100 exposure.',
    platformRole: 'INSTITUTIONAL_INVESTOR',
  },
  {
    id: 'PRIVATE_INVESTOR',
    label: 'Private Investor',
    tagline: 'Qualified Individual & Family Office',
    focusSummary: 'Yield-bearing real-world assets, controlled secondary transfers, and automated quarterly distributions.',
    platformRole: 'INVESTOR',
  },
];

export const COMPANY_POSITIONS: SubRoleMetadata<CompanyPosition>[] = [
  {
    id: 'STARTUP',
    label: 'Startup',
    tagline: 'High-Growth Issuer & Operating Venture',
    focusSummary: 'Asset/equity tokenisation, SPV onboarding, IPO bookbuilding, data-room compliance, and investor distributions.',
    platformRole: 'ISSUER',
  },
  {
    id: 'HEDGE_FUND',
    label: 'Hedge Fund',
    tagline: 'Regulated Fund Vehicle & Alternative Manager',
    focusSummary: 'Multi-asset fund unit issuance, institutional KYB onboarding, NAV waterfall payouts, and audit reporting.',
    platformRole: 'ISSUER',
  },
];

export function getInvestorIdentityMeta(id?: string | null): SubRoleMetadata<InvestorIdentity> {
  return INVESTOR_IDENTITIES.find((item) => item.id === id) ?? INVESTOR_IDENTITIES[2];
}

export function getCompanyPositionMeta(id?: string | null): SubRoleMetadata<CompanyPosition> {
  return COMPANY_POSITIONS.find((item) => item.id === id) ?? COMPANY_POSITIONS[0];
}

// Strict Tab Access Matrix separating Investor vs Company capabilities
const INVESTOR_ALLOWED_TABS = new Set<string>([
  'dashboard',
  'marketplace',
  'index',
  'portfolio',
  'wallet',
  'market-secondary',
  'market-secondary-asset-paystack',
  'market-secondary-trade-paystack',
  'market-secondary-confirmation',
  'market-forex',
  'market-forex-confirmation',
  'market-forex-history',
  'market-forex-liquidity',
  'market-forex-positions',
  'market-forex-analytics',
  'trade',
  'algo-trading',
  'payouts',
  'payouts-q4',
  'payouts-q3',
  'performance',
  'performance-1M',
  'performance-3M',
  'performance-6M',
  'performance-1Y',
  'performance-ALL',
  'valuation-workbench',
  'tax-compliance',
  'reports',
  'kyc-kyb',
  'aqei',
  'intelligence-ngx',
  'intelligence-ngx-assistant',
  'company-profile',
  'activity',
  'search',
  'settings',
  'landing',
]);

const COMPANY_ALLOWED_TABS = new Set<string>([
  'dashboard',
  'issuer-dashboard',
  'tokenisation-hub',
  'ipo-launch',
  'kyc-kyb',
  'valuation-workbench',
  'payouts',
  'payouts-q4',
  'payouts-q3',
  'tax-compliance',
  'reports',
  'integrations',
  'activity',
  'search',
  'settings',
  'landing',
]);

const ADMIN_ALLOWED_TABS = new Set<string>([
  ...INVESTOR_ALLOWED_TABS,
  ...COMPANY_ALLOWED_TABS,
  'governance-audit',
  'admin',
]);

export function canRoleAccessTab(role: WorkspaceRole, tab: string): boolean {
  if (tab.startsWith('market-forex-')) {
    return role === 'investor' || role === 'admin';
  }
  if (tab.startsWith('market-secondary-')) {
    return role === 'investor' || role === 'admin';
  }
  if (tab.startsWith('performance-')) {
    return role === 'investor' || role === 'admin';
  }
  if (role === 'admin') {
    return ADMIN_ALLOWED_TABS.has(tab);
  }
  if (role === 'company') {
    return COMPANY_ALLOWED_TABS.has(tab);
  }
  return INVESTOR_ALLOWED_TABS.has(tab);
}

export function getStoredWorkspaceIdentity(): {
  userRole: WorkspaceRole;
  investorIdentity: InvestorIdentity | null;
  companyPosition: CompanyPosition | null;
} {
  if (typeof window === 'undefined') {
    return { userRole: 'investor', investorIdentity: 'PRIVATE_INVESTOR', companyPosition: null };
  }
  const rawRole = localStorage.getItem('userRole');
  const userRole: WorkspaceRole =
    rawRole === 'company' || rawRole === 'admin' ? rawRole : 'investor';
  const rawInvestor = localStorage.getItem('investorIdentity') as InvestorIdentity | null;
  const rawCompany = localStorage.getItem('companyPosition') as CompanyPosition | null;

  return {
    userRole,
    investorIdentity: INVESTOR_IDENTITIES.some((i) => i.id === rawInvestor) ? rawInvestor : null,
    companyPosition: COMPANY_POSITIONS.some((c) => c.id === rawCompany) ? rawCompany : null,
  };
}
