import type { PlatformRole } from '../types/rwa';
import { getCompanyPositionMeta, getInvestorIdentityMeta } from './roleAccess';

export function mapAppRoleToPlatformRole(appRole?: 'admin' | 'investor' | 'company', overrideRole?: PlatformRole): PlatformRole {
  if (overrideRole) return overrideRole;
  if (appRole === 'admin') return 'SUPER_ADMIN';
  if (appRole === 'company') {
    const pos = typeof window !== 'undefined' ? localStorage.getItem('companyPosition') : null;
    return getCompanyPositionMeta(pos).platformRole;
  }
  const inv = typeof window !== 'undefined' ? localStorage.getItem('investorIdentity') : null;
  return getInvestorIdentityMeta(inv).platformRole;
}

export function getActorHeaders(overrideRole?: PlatformRole): Record<string, string> {
  const storedRole = typeof window !== 'undefined'
    ? (localStorage.getItem('userRole') as 'admin' | 'investor' | 'company' | null)
    : null;
  const fineRole = typeof window !== 'undefined'
    ? (localStorage.getItem('aqxFineRole') as PlatformRole | null)
    : null;
  const subRole = typeof window !== 'undefined'
    ? (storedRole === 'company'
        ? localStorage.getItem('companyPosition') || 'STARTUP'
        : storedRole === 'investor'
          ? localStorage.getItem('investorIdentity') || 'PRIVATE_INVESTOR'
          : 'SUPER_ADMIN')
    : 'PRIVATE_INVESTOR';
  const userName = typeof window !== 'undefined'
    ? localStorage.getItem('userName') || 'Prototype Participant'
    : 'Prototype Participant';
  const userEmail = typeof window !== 'undefined'
    ? localStorage.getItem('userEmail') || 'participant@afriquantx.demo'
    : 'participant@afriquantx.demo';

  return {
    'Content-Type': 'application/json',
    'x-aqx-role': mapAppRoleToPlatformRole(storedRole || 'investor', overrideRole || fineRole || undefined),
    'x-aqx-subrole': subRole,
    'x-aqx-user-id': userEmail,
    'x-aqx-user-name': userName,
  };
}

export async function rwaFetch<T>(
  path: string,
  options: RequestInit = {},
  overrideRole?: PlatformRole
): Promise<T> {
  const headers = {
    ...getActorHeaders(overrideRole),
    ...(options.headers || {}),
  };

  const response = await fetch(`/api/v1${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed (${response.status})`);
  }
  return data as T;
}
