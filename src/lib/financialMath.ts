/**
 * Deterministic Fixed-Point Financial Calculation Engine
 * Uses scaled integer arithmetic (BigInt) to eliminate IEEE-754 floating-point
 * rounding errors across allocations, fees, FX conversions, and distributions.
 */

export const UNIT_SCALE = 1_000_000n; // 6 decimal places for fractional units & rates
export const CENT_SCALE = 100n; // 2 decimal places (minor currency units / cents)

export interface FeeRuleConfig {
  id: string;
  name: string;
  feeType:
    | 'ISSUER_ONBOARDING'
    | 'TOKENISATION'
    | 'LISTING'
    | 'TRANSACTION'
    | 'SECONDARY_MARKET'
    | 'CUSTODY'
    | 'DISTRIBUTION'
    | 'WITHDRAWAL'
    | 'INSTITUTIONAL_SUBSCRIPTION'
    | 'API_USAGE';
  fixedMinorUnits: number;
  percentageBps: number; // 100 bps = 1.00%
  minMinorUnits: number;
  maxMinorUnits: number;
  currency: string;
  jurisdiction: string;
  assetClass: string;
}

export interface InvestmentBreakdown {
  grossAmountMinorUnits: number;
  feeMinorUnits: number;
  netInvestedMinorUnits: number;
  totalChargeMinorUnits: number;
  unitPriceMinorUnits: number;
  unitsAllocatedScaled: string; // integer scaled by 10^6
  unitsAllocatedDisplay: string;
  ownershipBpsAfter: number; // basis points of total supply (10000 = 100%)
  ownershipPercentDisplay: string;
  auditHashInput: string;
}

export interface DistributionHolder {
  investorId: string;
  investorName: string;
  unitsScaled: string; // BigInt string scaled by 10^6
}

export interface DistributionEntitlement {
  investorId: string;
  investorName: string;
  unitsScaled: string;
  ownershipBps: number;
  grossEntitlementMinorUnits: number;
  withholdingTaxMinorUnits: number;
  feeMinorUnits: number;
  netPayoutMinorUnits: number;
}

export interface ComplianceScoreInput {
  jurisdictionRisk: number; // 0-25
  sanctionsMatch: boolean;
  pepMatch: boolean;
  adverseMediaHits: number; // 0-3
  sourceOfFundsVerified: boolean;
  velocityAnomalyScore: number; // 0-20
  documentInconsistencyCount: number; // 0-5
}

export interface ComplianceScoreResult {
  score: number; // 0-100
  band: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: string[];
}

/**
 * Converts a decimal number or string cleanly into a scaled BigInt without IEEE-754 drift.
 */
export function parseDecimalToScaled(value: string | number, scaleDigits = 6): bigint {
  const raw = typeof value === 'number' ? value.toFixed(scaleDigits) : value.trim();
  if (!/^-?\d+(\.\d+)?$/.test(raw)) {
    throw new Error(`Invalid decimal value: ${value}`);
  }
  const negative = raw.startsWith('-');
  const unsigned = negative ? raw.slice(1) : raw;
  const [intPart, fracPart = ''] = unsigned.split('.');
  const paddedFrac = (fracPart + '0'.repeat(scaleDigits)).slice(0, scaleDigits);
  const combined = BigInt(intPart) * 10n ** BigInt(scaleDigits) + BigInt(paddedFrac || '0');
  return negative ? -combined : combined;
}

/**
 * Formats a scaled BigInt into a fixed decimal string.
 */
export function formatScaledDecimal(scaled: bigint, scaleDigits = 6, displayDecimals = 2): string {
  const negative = scaled < 0n;
  const abs = negative ? -scaled : scaled;
  const divisor = 10n ** BigInt(scaleDigits);
  const intPart = abs / divisor;
  const rem = abs % divisor;
  const fracStr = rem.toString().padStart(scaleDigits, '0').slice(0, displayDecimals);
  const formattedInt = intPart.toString();
  if (displayDecimals === 0) {
    return `${negative ? '-' : ''}${formattedInt}`;
  }
  return `${negative ? '-' : ''}${formattedInt}.${fracStr.padEnd(displayDecimals, '0')}`;
}

/**
 * Computes configurable fee deterministically in integer minor currency units.
 */
export function calculateConfiguredFeeMinorUnits(
  amountMinorUnits: number,
  feeRule: Pick<FeeRuleConfig, 'fixedMinorUnits' | 'percentageBps' | 'minMinorUnits' | 'maxMinorUnits'>
): number {
  if (!Number.isInteger(amountMinorUnits) || amountMinorUnits < 0) {
    throw new Error('Amount must be a non-negative integer in minor units.');
  }
  const amount = BigInt(amountMinorUnits);
  const pctFee = (amount * BigInt(feeRule.percentageBps) + 5000n) / 10_000n;
  let total = BigInt(feeRule.fixedMinorUnits) + pctFee;
  const min = BigInt(feeRule.minMinorUnits);
  const max = BigInt(feeRule.maxMinorUnits);
  if (total < min) total = min;
  if (max > 0n && total > max) total = max;
  return Number(total);
}

/**
 * Deterministic fixed-point investment calculation.
 */
export function calculateInvestmentBreakdown(params: {
  investmentMinorUnits: number;
  unitPriceMinorUnits: number;
  totalSupplyUnitsScaled: string;
  feeRule: Pick<FeeRuleConfig, 'fixedMinorUnits' | 'percentageBps' | 'minMinorUnits' | 'maxMinorUnits'>;
}): InvestmentBreakdown {
  const { investmentMinorUnits, unitPriceMinorUnits, totalSupplyUnitsScaled, feeRule } = params;
  if (!Number.isInteger(investmentMinorUnits) || investmentMinorUnits <= 0) {
    throw new Error('Investment amount must be a positive integer in minor units.');
  }
  if (!Number.isInteger(unitPriceMinorUnits) || unitPriceMinorUnits <= 0) {
    throw new Error('Unit price must be a positive integer in minor units.');
  }

  const feeMinorUnits = calculateConfiguredFeeMinorUnits(investmentMinorUnits, feeRule);
  const gross = BigInt(investmentMinorUnits);
  const price = BigInt(unitPriceMinorUnits);

  // Units allocated = (grossMinorUnits * UNIT_SCALE) / unitPriceMinorUnits
  const unitsAllocated = (gross * UNIT_SCALE) / price;
  const totalSupply = BigInt(totalSupplyUnitsScaled);
  const ownershipBpsAfter =
    totalSupply > 0n ? Number((unitsAllocated * 10_000n) / totalSupply) : 0;

  return {
    grossAmountMinorUnits: investmentMinorUnits,
    feeMinorUnits,
    netInvestedMinorUnits: investmentMinorUnits,
    totalChargeMinorUnits: investmentMinorUnits + feeMinorUnits,
    unitPriceMinorUnits,
    unitsAllocatedScaled: unitsAllocated.toString(),
    unitsAllocatedDisplay: formatScaledDecimal(unitsAllocated, 6, 4),
    ownershipBpsAfter,
    ownershipPercentDisplay: (ownershipBpsAfter / 100).toFixed(2) + '%',
    auditHashInput: `${investmentMinorUnits}:${unitPriceMinorUnits}:${feeMinorUnits}:${unitsAllocated.toString()}`,
  };
}

/**
 * Deterministic Pro-Rata Distribution Entitlement Calculator.
 * Uses Hamilton / largest-remainder allocation in integer minor units so
 * sum(grossEntitlementMinorUnits) === totalDistributableMinorUnits strictly.
 */
export function calculateProRataDistributions(params: {
  totalDistributableMinorUnits: number;
  holders: DistributionHolder[];
  withholdingTaxBps?: number;
  distributionFeeBps?: number;
}): {
  entitlements: DistributionEntitlement[];
  totalGrossMinorUnits: number;
  totalWithholdingTaxMinorUnits: number;
  totalFeeMinorUnits: number;
  totalNetPayoutMinorUnits: number;
} {
  const { totalDistributableMinorUnits, holders, withholdingTaxBps = 0, distributionFeeBps = 0 } = params;
  if (!Number.isInteger(totalDistributableMinorUnits) || totalDistributableMinorUnits <= 0) {
    throw new Error('Total distributable amount must be a positive integer in minor units.');
  }
  if (holders.length === 0) {
    return {
      entitlements: [],
      totalGrossMinorUnits: 0,
      totalWithholdingTaxMinorUnits: 0,
      totalFeeMinorUnits: 0,
      totalNetPayoutMinorUnits: 0,
    };
  }

  const totalUnits = holders.reduce((acc, h) => acc + BigInt(h.unitsScaled), 0n);
  if (totalUnits <= 0n) {
    throw new Error('Total holder units must be greater than zero.');
  }

  const pool = BigInt(totalDistributableMinorUnits);
  const initialShares = holders.map((holder, index) => {
    const units = BigInt(holder.unitsScaled);
    const numerator = pool * units;
    const baseGross = numerator / totalUnits;
    const remainder = numerator % totalUnits;
    const ownershipBps = Number((units * 10_000n) / totalUnits);
    return {
      index,
      holder,
      baseGross,
      remainder,
      ownershipBps,
    };
  });

  const allocatedSum = initialShares.reduce((acc, s) => acc + s.baseGross, 0n);
  let leftover = Number(pool - allocatedSum);

  // Distribute remainder minor units deterministically by largest remainder, then holder index
  const sortedByRemainder = [...initialShares].sort((a, b) => {
    if (b.remainder !== a.remainder) {
      return b.remainder > a.remainder ? 1 : -1;
    }
    return a.index - b.index;
  });

  const grossByIndex = new Map<number, bigint>();
  for (const s of initialShares) {
    grossByIndex.set(s.index, s.baseGross);
  }
  for (let i = 0; i < sortedByRemainder.length && leftover > 0; i++) {
    const idx = sortedByRemainder[i].index;
    grossByIndex.set(idx, (grossByIndex.get(idx) ?? 0n) + 1n);
    leftover--;
  }

  let totalGross = 0;
  let totalTax = 0;
  let totalFee = 0;
  let totalNet = 0;

  const entitlements: DistributionEntitlement[] = initialShares.map((s) => {
    const grossMinor = Number(grossByIndex.get(s.index) ?? 0n);
    const taxMinor = Number((BigInt(grossMinor) * BigInt(withholdingTaxBps)) / 10_000n);
    const feeMinor = Number((BigInt(grossMinor) * BigInt(distributionFeeBps)) / 10_000n);
    const netMinor = grossMinor - taxMinor - feeMinor;

    totalGross += grossMinor;
    totalTax += taxMinor;
    totalFee += feeMinor;
    totalNet += netMinor;

    return {
      investorId: s.holder.investorId,
      investorName: s.holder.investorName,
      unitsScaled: s.holder.unitsScaled,
      ownershipBps: s.ownershipBps,
      grossEntitlementMinorUnits: grossMinor,
      withholdingTaxMinorUnits: taxMinor,
      feeMinorUnits: feeMinor,
      netPayoutMinorUnits: netMinor,
    };
  });

  return {
    entitlements,
    totalGrossMinorUnits: totalGross,
    totalWithholdingTaxMinorUnits: totalTax,
    totalFeeMinorUnits: totalFee,
    totalNetPayoutMinorUnits: totalNet,
  };
}

/**
 * Exact FX conversion using scaled rates (rateScaled = exchangeRate * 10^6).
 */
export function convertCurrencyMinorUnits(amountMinorUnits: number, fxRateScaled: bigint): number {
  if (!Number.isInteger(amountMinorUnits) || amountMinorUnits < 0) {
    throw new Error('Amount must be a non-negative integer in minor units.');
  }
  if (fxRateScaled <= 0n) {
    throw new Error('FX rate must be positive.');
  }
  const result = (BigInt(amountMinorUnits) * fxRateScaled + UNIT_SCALE / 2n) / UNIT_SCALE;
  return Number(result);
}

/**
 * Deterministic Compliance Risk Score Engine (0-100).
 */
export function computeComplianceRiskScore(input: ComplianceScoreInput): ComplianceScoreResult {
  const factors: string[] = [];
  let score = Math.max(0, Math.min(25, Math.round(input.jurisdictionRisk)));
  if (input.jurisdictionRisk >= 15) factors.push('Elevated cross-border jurisdictional weight');

  if (input.sanctionsMatch) {
    score += 45;
    factors.push('Potential sanctions list name/entity match');
  }
  if (input.pepMatch) {
    score += 20;
    factors.push('Politically Exposed Person (PEP) flag');
  }
  if (input.adverseMediaHits > 0) {
    const pts = Math.min(15, input.adverseMediaHits * 5);
    score += pts;
    factors.push(`${input.adverseMediaHits} adverse media reference(s)`);
  }
  if (!input.sourceOfFundsVerified) {
    score += 15;
    factors.push('Source of funds / wealth evidence pending');
  }
  if (input.velocityAnomalyScore > 0) {
    const velPts = Math.min(20, Math.round(input.velocityAnomalyScore));
    score += velPts;
    if (velPts >= 10) factors.push('Elevated transaction velocity pattern');
  }
  if (input.documentInconsistencyCount > 0) {
    const docPts = Math.min(20, input.documentInconsistencyCount * 6);
    score += docPts;
    factors.push(`${input.documentInconsistencyCount} document inconsistency flag(s)`);
  }

  score = Math.max(0, Math.min(100, score));
  const band: ComplianceScoreResult['band'] =
    score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW';

  if (factors.length === 0) {
    factors.push('Baseline verification checks within standard institutional thresholds');
  }

  return { score, band, factors };
}

export function formatCurrencyFromMinorUnits(minorUnits: number, currency: string): string {
  const symbols: Record<string, string> = {
    ZAR: 'R',
    NGN: '₦',
    KES: 'KES ',
    GHS: 'GH₵',
    AOA: 'Kz ',
    RWF: 'RWF ',
    EGP: 'E£',
    MAD: 'MAD ',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  const prefix = symbols[currency] ?? `${currency} `;
  const val = minorUnits / 100;
  return `${prefix}${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
