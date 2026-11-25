import crypto from 'node:crypto';
import {
  ASSET_WORKFLOW_STAGES,
  TOKEN_LIFECYCLE_STAGES,
  type AssetClass,
  type AssetDocumentRecord,
  type AssetWorkflowStage,
  type ComplianceCaseRecord,
  type DistributionBatchRecord,
  type DocumentCategory,
  type GovernanceProposal,
  type ImmutableAuditEvent,
  type InvestmentOrderRecord,
  type KycKybSubmission,
  type PlatformRole,
  type RwaAsset,
  type SecondaryTransferModel,
  type SupportedCurrency,
  type TokenLifecycleStage,
} from '../../src/types/rwa.js';
import {
  calculateInvestmentBreakdown,
  calculateProRataDistributions,
  computeComplianceRiskScore,
  type FeeRuleConfig,
} from '../../src/lib/financialMath.js';
import {
  BLOCKCHAIN_ADAPTERS,
  DEFAULT_FEE_RULES,
  DEMO_FX_RATES,
  INITIAL_AUDIT_EVENTS,
  INITIAL_COMPLIANCE_CASES,
  INITIAL_DEMO_ASSETS,
  INITIAL_GOVERNANCE_PROPOSALS,
  INITIAL_KYC_SUBMISSIONS,
  PAYMENT_PROVIDERS,
} from '../../src/services/rwaPlatformService.js';
import { redisService } from './redis.service.js';
import { blockchainRpcService } from './blockchainRpc.service.js';

export interface RequestActor {
  userId: string;
  userName: string;
  role: PlatformRole;
  ip: string;
  device: string;
}

export interface SecondaryOrderRecord {
  id: string;
  assetId: string;
  passportId: string;
  ticker: string;
  side: 'BUY' | 'SELL';
  transferModel: SecondaryTransferModel;
  quantityUnits: number;
  priceMinorUnits: number;
  currency: SupportedCurrency;
  investorId: string;
  eligibilityVerified: boolean;
  status: 'OPEN' | 'PENDING_ADMIN_APPROVAL' | 'SETTLED_DEMO' | 'REJECTED';
  createdAt: string;
}

export interface PlatformEventRecord {
  id: string;
  eventName: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

class RwaPlatformStore {
  private assets: RwaAsset[];
  private feeRules: FeeRuleConfig[];
  private investments: InvestmentOrderRecord[] = [];
  private distributions: DistributionBatchRecord[] = [];
  private kycSubmissions: KycKybSubmission[];
  private complianceCases: ComplianceCaseRecord[];
  private governanceProposals: GovernanceProposal[];
  private auditLogs: ImmutableAuditEvent[];
  private secondaryOrders: SecondaryOrderRecord[] = [];
  private domainEvents: PlatformEventRecord[] = [];
  private idempotencyStore = new Map<string, unknown>();
  private frozenAccounts = new Set<string>();

  constructor() {
    this.assets = structuredClone(INITIAL_DEMO_ASSETS);
    this.feeRules = structuredClone(DEFAULT_FEE_RULES);
    this.kycSubmissions = structuredClone(INITIAL_KYC_SUBMISSIONS);
    this.complianceCases = structuredClone(INITIAL_COMPLIANCE_CASES);
    this.governanceProposals = structuredClone(INITIAL_GOVERNANCE_PROPOSALS);
    this.auditLogs = structuredClone(INITIAL_AUDIT_EVENTS);

    // Seed initial holder base on primary assets so distribution simulations are meaningful
    this.investments = [
      {
        id: 'INV-DEMO-1001',
        idempotencyKey: 'seed-inv-1001',
        investorId: 'inv-thabo-01',
        investorName: 'Thabo Mbeki-Ndlovu (DEMO)',
        assetId: 'asset-cape-urban-re',
        passportId: 'AQX-RE-000184',
        assetName: 'Cape Urban Property Fund',
        currency: 'ZAR',
        grossAmountMinorUnits: 45000000, // R 450,000
        feeMinorUnits: 342500,
        totalChargeMinorUnits: 45342500,
        unitsAllocatedScaled: '30000000000', // 30,000 units
        unitsAllocatedDisplay: '30000.0000',
        complianceStatus: 'PASSED',
        settlementStatus: 'ALLOCATED_DEMO',
        disclosuresAcceptedAt: '2026-11-18T10:00:00Z',
        receiptHash: 'sha256:8d19e09fa22f891b',
        createdAt: '2026-11-18T10:01:00Z',
      },
      {
        id: 'INV-DEMO-1002',
        idempotencyKey: 'seed-inv-1002',
        investorId: 'inst-sahara-02',
        investorName: 'Sahara Institutional Mandate (DEMO)',
        assetId: 'asset-cape-urban-re',
        passportId: 'AQX-RE-000184',
        assetName: 'Cape Urban Property Fund',
        currency: 'ZAR',
        grossAmountMinorUnits: 105000000, // R 1,050,000
        feeMinorUnits: 792500,
        totalChargeMinorUnits: 105792500,
        unitsAllocatedScaled: '70000000000', // 70,000 units
        unitsAllocatedDisplay: '70000.0000',
        complianceStatus: 'PASSED',
        settlementStatus: 'ALLOCATED_DEMO',
        disclosuresAcceptedAt: '2026-11-19T12:15:00Z',
        receiptHash: 'sha256:4a9b103cf71c0091',
        createdAt: '2026-11-19T12:16:00Z',
      },
    ];

    this.secondaryOrders = [
      {
        id: 'ORD-SEC-901',
        assetId: 'asset-cape-urban-re',
        passportId: 'AQX-RE-000184',
        ticker: 'AQX-CUPF',
        side: 'SELL',
        transferModel: 'ORDER_BOOK',
        quantityUnits: 1200,
        priceMinorUnits: 1525, // R 15.25
        currency: 'ZAR',
        investorId: 'inv-thabo-01',
        eligibilityVerified: true,
        status: 'OPEN',
        createdAt: '2026-11-23T14:20:00Z',
      },
    ];

    void this.hydrateFromRedis();
  }

  private async hydrateFromRedis() {
    if (!redisService.isConfigured()) return;
    try {
      const snapshot = await redisService.getJson<{
        assets?: RwaAsset[];
        feeRules?: FeeRuleConfig[];
        investments?: InvestmentOrderRecord[];
        distributions?: DistributionBatchRecord[];
        kycSubmissions?: KycKybSubmission[];
        complianceCases?: ComplianceCaseRecord[];
        governanceProposals?: GovernanceProposal[];
        auditLogs?: ImmutableAuditEvent[];
        secondaryOrders?: SecondaryOrderRecord[];
        domainEvents?: PlatformEventRecord[];
        idempotencyEntries?: Array<[string, unknown]>;
        frozenAccounts?: string[];
      }>('rwa:snapshot:v1');
      if (!snapshot) return;
      if (Array.isArray(snapshot.assets)) this.assets = snapshot.assets;
      if (Array.isArray(snapshot.feeRules)) this.feeRules = snapshot.feeRules;
      if (Array.isArray(snapshot.investments)) this.investments = snapshot.investments;
      if (Array.isArray(snapshot.distributions)) this.distributions = snapshot.distributions;
      if (Array.isArray(snapshot.kycSubmissions)) this.kycSubmissions = snapshot.kycSubmissions;
      if (Array.isArray(snapshot.complianceCases)) this.complianceCases = snapshot.complianceCases;
      if (Array.isArray(snapshot.governanceProposals)) this.governanceProposals = snapshot.governanceProposals;
      if (Array.isArray(snapshot.auditLogs)) this.auditLogs = snapshot.auditLogs;
      if (Array.isArray(snapshot.secondaryOrders)) this.secondaryOrders = snapshot.secondaryOrders;
      if (Array.isArray(snapshot.domainEvents)) this.domainEvents = snapshot.domainEvents;
      if (Array.isArray(snapshot.idempotencyEntries)) {
        this.idempotencyStore = new Map(snapshot.idempotencyEntries);
      }
      if (Array.isArray(snapshot.frozenAccounts)) {
        this.frozenAccounts = new Set(snapshot.frozenAccounts);
      }
    } catch {
      // Keep seeded fallback on transient Redis failure
    }
  }

  private async persistToRedis() {
    if (!redisService.isConfigured()) return;
    try {
      await redisService.setJson('rwa:snapshot:v1', {
        assets: this.assets,
        feeRules: this.feeRules,
        investments: this.investments,
        distributions: this.distributions,
        kycSubmissions: this.kycSubmissions,
        complianceCases: this.complianceCases,
        governanceProposals: this.governanceProposals,
        auditLogs: this.auditLogs.slice(0, 200),
        secondaryOrders: this.secondaryOrders,
        domainEvents: this.domainEvents.slice(0, 200),
        idempotencyEntries: Array.from(this.idempotencyStore.entries()).slice(-200),
        frozenAccounts: Array.from(this.frozenAccounts),
      });
    } catch {
      // Fail gracefully without exposing credentials
    }
  }

  private appendAudit(
    actor: RequestActor,
    event: string,
    result: ImmutableAuditEvent['result'],
    details: string,
    refs?: { assetId?: string; tokenId?: string }
  ) {
    const entry: ImmutableAuditEvent = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      event,
      userId: actor.userId,
      userRole: actor.role,
      assetId: refs?.assetId,
      tokenId: refs?.tokenId,
      timestamp: new Date().toISOString(),
      ip: actor.ip,
      device: actor.device,
      result,
      details,
    };
    this.auditLogs.unshift(entry);
    void this.persistToRedis();
    return entry;
  }

  private emitEvent(eventName: string, payload: Record<string, unknown>) {
    this.domainEvents.unshift({
      id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      eventName,
      payload,
      createdAt: new Date().toISOString(),
    });
  }

  listAssets(filters?: { assetClass?: string; country?: string; risk?: string; search?: string }) {
    return this.assets.filter((a) => {
      if (filters?.assetClass && filters.assetClass !== 'ALL' && a.passport.assetClass !== filters.assetClass) {
        return false;
      }
      if (filters?.country && filters.country !== 'ALL' && !a.passport.country.toLowerCase().includes(filters.country.toLowerCase())) {
        return false;
      }
      if (filters?.risk && filters.risk !== 'ALL' && a.passport.riskRating !== filters.risk) {
        return false;
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        const hit =
          a.name.toLowerCase().includes(q) ||
          a.passport.passportId.toLowerCase().includes(q) ||
          a.passport.sector.toLowerCase().includes(q) ||
          a.token.tokenSymbol.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }

  getAsset(idOrPassport: string) {
    return this.assets.find((a) => a.id === idOrPassport || a.passport.passportId === idOrPassport) ?? null;
  }

  createAssetApplication(
    actor: RequestActor,
    payload: {
      name: string;
      shortSummary: string;
      assetClass: AssetClass;
      sector: string;
      country: string;
      jurisdiction: string;
      currency: SupportedCurrency;
      issuer: string;
      assetOwner: string;
      valuationMinorUnits: number;
      targetRaiseMinorUnits: number;
      unitValueMinorUnits: number;
      legalStructure: string;
      regulatoryStatus: string;
      tokenName: string;
      tokenSymbol: string;
      tokenStandard: 'ERC-3643' | 'ERC-20' | 'ERC-721' | 'ERC-1155';
      blockchainNetworkId: string;
      transferModelPermitted: SecondaryTransferModel;
    }
  ): RwaAsset {
    const id = `asset-${crypto.randomUUID().slice(0, 8)}`;
    const prefixMap: Partial<Record<AssetClass, string>> = {
      'Real Estate': 'RE',
      Energy: 'EN',
      Infrastructure: 'INF',
      Technology: 'TECH',
      Healthcare: 'HC',
      Agriculture: 'AG',
    };
    const code = prefixMap[payload.assetClass] ?? 'AS';
    const passportId = `AQX-${code}-${Math.floor(100000 + Math.random() * 899999)}`;
    const totalUnits = Math.max(1, Math.floor(payload.targetRaiseMinorUnits / Math.max(1, payload.unitValueMinorUnits)));
    const totalSupplyScaled = (BigInt(totalUnits) * 1_000_000n).toString();

    const newAsset: RwaAsset = {
      id,
      name: payload.name,
      shortSummary: payload.shortSummary,
      investmentThesis: payload.shortSummary,
      financialSummary: {
        annualRevenueDisplay: 'Pending audited accounts verification',
        ebitdaDisplay: 'Pending verification',
        cashFlowDisplay: 'Pending verification',
        debtToEquityDisplay: 'Pending verification',
        valuationBasis: 'Issuer submitted valuation draft (unverified)',
      },
      passport: {
        passportId,
        assetId: id,
        issuer: payload.issuer,
        assetOwner: payload.assetOwner,
        assetClass: payload.assetClass,
        sector: payload.sector,
        country: payload.country,
        jurisdiction: payload.jurisdiction,
        currency: payload.currency,
        valuationMinorUnits: payload.valuationMinorUnits,
        valuationDate: new Date().toISOString().split('T')[0],
        targetRaiseMinorUnits: payload.targetRaiseMinorUnits,
        fundedAmountMinorUnits: 0,
        expectedYieldLabel: 'Illustrative subject to offering review (non-guaranteed)',
        distributionSchedule: 'To be finalised at OFFERING_STRUCTURED stage',
        riskScore: 45,
        riskRating: 'MEDIUM',
        liquidityClassification: 'LIMITED_SECONDARY',
        legalStructure: payload.legalStructure,
        regulatoryStatus: payload.regulatoryStatus || 'SUBMITTED — Pending legal & regulatory sign-off',
        offeringStatus: 'SUBMITTED',
        custodyStatus: 'ESCROW_PENDING',
        transferModelPermitted: payload.transferModelPermitted,
        transferRules: 'Allowlisted KYC/KYB investors only',
        investorEligibility: 'Subject to Compliance Review',
        disclosuresSummary: [
          'This submission is in onboarding review and is not open to public investment until Legal & Compliance sign-off completes.',
        ],
        isDemo: true,
      },
      token: {
        tokenId: `tok-${id.slice(6)}`,
        tokenName: payload.tokenName,
        tokenSymbol: payload.tokenSymbol.toUpperCase(),
        tokenType: 'Security Token (Fungible)',
        tokenStandard: payload.tokenStandard,
        decimals: 6,
        totalSupplyScaled,
        totalSupplyDisplay: `${totalUnits.toLocaleString()} units`,
        unitValueMinorUnits: payload.unitValueMinorUnits,
        minInvestmentMinorUnits: payload.unitValueMinorUnits * 10,
        maxAllocationMinorUnits: payload.targetRaiseMinorUnits,
        lockupPeriodDays: 90,
        maturityDate: null,
        transferRestrictions: 'Identity allowlist enforcement required',
        geographicRestrictions: ['Sanctioned Jurisdictions Excluded'],
        investorEligibility: 'KYC Level 2 / KYB',
        distributionRules: 'Pro-rata contractual entitlement',
        redemptionRules: 'Subject to offering terms',
        votingRights: 'Per Legal Structure SPV deed',
        governanceRights: 'Multi-admin compliance controls',
        lifecycleStage: 'DRAFT',
        blockchainNetworkId: payload.blockchainNetworkId,
        contractAddress: `0xPENDING_${passportId.replace(/-/g, '')}`,
      },
      aqxScore: {
        overall: 68,
        financialStrength: 65,
        marketOutlook: 75,
        governance: 66,
        liquidity: 60,
        risk: 68,
        dataQuality: 72,
        methodology: 'Preliminary automated intake rubric awaiting verified financials & legal sign-off.',
        dataSources: ['Issuer Intake Application'],
        timestamp: new Date().toISOString(),
        confidenceLevel: 'LOW',
        limitations: ['Unverified issuer submission; score must not be treated as investment endorsement.'],
        modelVersion: 'aqx-asset-intel-v2.4',
      },
      documents: [],
      faqs: [],
      isDemo: true,
    };

    this.assets.unshift(newAsset);
    this.appendAudit(actor, 'ASSET_APPLICATION_CREATED', 'RECORDED', `Submitted ${payload.name} (${passportId})`, {
      assetId: id,
    });
    this.emitEvent('asset.submitted', { assetId: id, passportId });
    return newAsset;
  }

  transitionAssetStage(actor: RequestActor, assetId: string, nextStage: AssetWorkflowStage): RwaAsset {
    const asset = this.getAsset(assetId);
    if (!asset) {
      throw new Error('ASSET_NOT_FOUND');
    }
    const currentIndex = ASSET_WORKFLOW_STAGES.indexOf(asset.passport.offeringStatus);
    const nextIndex = ASSET_WORKFLOW_STAGES.indexOf(nextStage);
    if (nextIndex === -1) {
      throw new Error('INVALID_WORKFLOW_STAGE');
    }
    if (nextIndex < currentIndex) {
      throw new Error('CANNOT_REVERT_WORKFLOW_STAGE');
    }
    if (nextStage === 'ACTIVE' && (!asset.passport.legalStructure || !asset.passport.regulatoryStatus)) {
      throw new Error('LEGAL_AND_REGULATORY_FIELDS_REQUIRED');
    }

    asset.passport.offeringStatus = nextStage;
    if (nextStage === 'APPROVED' || nextStage === 'ACTIVE') {
      this.emitEvent('asset.approved', { assetId: asset.id, stage: nextStage });
    }
    this.appendAudit(actor, 'ASSET_WORKFLOW_TRANSITION', 'APPROVED', `Transitioned ${asset.passport.passportId} to ${nextStage}`, {
      assetId: asset.id,
      tokenId: asset.token.tokenId,
    });
    return asset;
  }

  uploadAssetDocument(
    actor: RequestActor,
    assetId: string,
    payload: { category: DocumentCategory; title: string; expiresAt?: string | null; verificationStatus?: AssetDocumentRecord['verificationStatus'] }
  ): AssetDocumentRecord {
    const asset = this.getAsset(assetId);
    if (!asset) {
      throw new Error('ASSET_NOT_FOUND');
    }
    const existingVersions = asset.documents.filter((d) => d.category === payload.category).length;
    const sha256Hash = crypto.createHash('sha256').update(`${assetId}:${payload.category}:${payload.title}:${Date.now()}`).digest('hex');

    const doc: AssetDocumentRecord = {
      id: `doc-${crypto.randomUUID().slice(0, 8)}`,
      assetId: asset.id,
      category: payload.category,
      title: payload.title,
      version: existingVersions + 1,
      sha256Hash,
      uploadedAt: new Date().toISOString(),
      uploadedBy: actor.userName,
      expiresAt: payload.expiresAt ?? null,
      reviewerName: payload.verificationStatus === 'VERIFIED' ? actor.userName : null,
      verificationStatus: payload.verificationStatus ?? 'PENDING_REVIEW',
      aiExtractionSummary: `Indexed ${payload.category} file "${payload.title}" (SHA-256 fingerprint recorded; human compliance review required).`,
      aiFlags: [],
    };
    asset.documents.unshift(doc);
    this.appendAudit(actor, 'ASSET_DOCUMENT_UPLOADED', 'RECORDED', `Uploaded ${payload.category} v${doc.version} (${doc.title})`, {
      assetId: asset.id,
    });
    return doc;
  }

  transitionTokenLifecycle(
    actor: RequestActor,
    assetId: string,
    nextLifecycle: TokenLifecycleStage,
    transferModel?: SecondaryTransferModel
  ): RwaAsset {
    const asset = this.getAsset(assetId);
    if (!asset) throw new Error('ASSET_NOT_FOUND');
    if (!TOKEN_LIFECYCLE_STAGES.includes(nextLifecycle)) {
      throw new Error('INVALID_TOKEN_LIFECYCLE');
    }
    asset.token.lifecycleStage = nextLifecycle;
    if (transferModel) {
      asset.passport.transferModelPermitted = transferModel;
    }
    this.appendAudit(actor, 'TOKEN_LIFECYCLE_UPDATED', 'APPROVED', `Token ${asset.token.tokenSymbol} moved to ${nextLifecycle}`, {
      assetId: asset.id,
      tokenId: asset.token.tokenId,
    });
    this.emitEvent('token.created', { tokenId: asset.token.tokenId, lifecycleStage: nextLifecycle });
    return asset;
  }

  executeInvestment(
    actor: RequestActor,
    idempotencyKey: string,
    payload: {
      assetId: string;
      amountMinorUnits: number;
      disclosuresAccepted: boolean;
      kycVerifiedOverride?: boolean;
    }
  ): { order: InvestmentOrderRecord; idempotentReplay: boolean } {
    if (!idempotencyKey) {
      throw new Error('IDEMPOTENCY_KEY_REQUIRED');
    }
    const cacheKey = `invest:${actor.userId}:${idempotencyKey}`;
    const existing = this.idempotencyStore.get(cacheKey) as InvestmentOrderRecord | undefined;
    if (existing) {
      return { order: existing, idempotentReplay: true };
    }

    if (this.frozenAccounts.has(actor.userId)) {
      this.appendAudit(actor, 'INVESTMENT_BLOCKED', 'DENIED', `Account ${actor.userId} restricted/frozen by compliance.`);
      throw new Error('ACCOUNT_RESTRICTED_OR_FROZEN');
    }

    if (!payload.disclosuresAccepted) {
      throw new Error('DISCLOSURES_ACCEPTANCE_REQUIRED');
    }

    const asset = this.getAsset(payload.assetId);
    if (!asset) {
      throw new Error('ASSET_NOT_FOUND');
    }
    if (!['ACTIVE', 'PRIMARY_OFFERING'].includes(asset.passport.offeringStatus)) {
      throw new Error('ASSET_NOT_OPEN_FOR_INVESTMENT');
    }
    if (payload.amountMinorUnits < asset.token.minInvestmentMinorUnits) {
      throw new Error('BELOW_MINIMUM_INVESTMENT');
    }
    if (payload.amountMinorUnits > asset.token.maxAllocationMinorUnits) {
      throw new Error('EXCEEDS_MAXIMUM_ALLOCATION');
    }

    const primaryFeeRule =
      this.feeRules.find((r) => r.feeType === 'TRANSACTION') ?? this.feeRules[0];

    const breakdown = calculateInvestmentBreakdown({
      investmentMinorUnits: payload.amountMinorUnits,
      unitPriceMinorUnits: asset.token.unitValueMinorUnits,
      totalSupplyUnitsScaled: asset.token.totalSupplyScaled,
      feeRule: primaryFeeRule,
    });

    const receiptHash =
      'sha256:' +
      crypto
        .createHash('sha256')
        .update(`${idempotencyKey}:${asset.id}:${breakdown.auditHashInput}`)
        .digest('hex')
        .slice(0, 24);

    const order: InvestmentOrderRecord = {
      id: `INV-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
      idempotencyKey,
      investorId: actor.userId,
      investorName: actor.userName,
      assetId: asset.id,
      passportId: asset.passport.passportId,
      assetName: asset.name,
      currency: asset.passport.currency,
      grossAmountMinorUnits: breakdown.grossAmountMinorUnits,
      feeMinorUnits: breakdown.feeMinorUnits,
      totalChargeMinorUnits: breakdown.totalChargeMinorUnits,
      unitsAllocatedScaled: breakdown.unitsAllocatedScaled,
      unitsAllocatedDisplay: breakdown.unitsAllocatedDisplay,
      complianceStatus: 'PASSED',
      settlementStatus: 'ALLOCATED_DEMO',
      disclosuresAcceptedAt: new Date().toISOString(),
      receiptHash,
      createdAt: new Date().toISOString(),
    };

    asset.passport.fundedAmountMinorUnits += breakdown.grossAmountMinorUnits;
    this.investments.unshift(order);
    this.idempotencyStore.set(cacheKey, order);

    this.appendAudit(
      actor,
      'INVESTMENT_ALLOCATED',
      'APPROVED',
      `Allocated ${order.unitsAllocatedDisplay} units of ${asset.token.tokenSymbol} (${receiptHash})`,
      { assetId: asset.id, tokenId: asset.token.tokenId }
    );
    this.emitEvent('investment.confirmed', { orderId: order.id, assetId: asset.id, units: order.unitsAllocatedDisplay });
    this.emitEvent('allocation.completed', { orderId: order.id, tokenId: asset.token.tokenId });

    return { order, idempotentReplay: false };
  }

  listInvestments() {
    return this.investments;
  }

  listDistributions() {
    return this.distributions;
  }

  executeDistribution(
    actor: RequestActor,
    idempotencyKey: string,
    payload: {
      assetId: string;
      distributionType: DistributionBatchRecord['distributionType'];
      totalDeclaredMinorUnits: number;
      withholdingTaxBps?: number;
    }
  ): { batch: DistributionBatchRecord; idempotentReplay: boolean } {
    if (!idempotencyKey) {
      throw new Error('IDEMPOTENCY_KEY_REQUIRED');
    }
    const cacheKey = `dist:${payload.assetId}:${idempotencyKey}`;
    const existing = this.idempotencyStore.get(cacheKey) as DistributionBatchRecord | undefined;
    if (existing) {
      return { batch: existing, idempotentReplay: true };
    }

    const asset = this.getAsset(payload.assetId);
    if (!asset) throw new Error('ASSET_NOT_FOUND');

    // Aggregate holder units from investment ledger for this asset
    const holderTotals = new Map<string, { investorId: string; investorName: string; units: bigint }>();
    for (const inv of this.investments) {
      if (inv.assetId !== asset.id) continue;
      const cur = holderTotals.get(inv.investorId) ?? {
        investorId: inv.investorId,
        investorName: inv.investorName,
        units: 0n,
      };
      cur.units += BigInt(inv.unitsAllocatedScaled);
      holderTotals.set(inv.investorId, cur);
    }

    // Ensure at least demo cap-table holders if asset had seed funded balance
    if (holderTotals.size === 0) {
      holderTotals.set('seed-custodian-pool', {
        investorId: 'seed-custodian-pool',
        investorName: 'Verified Treasury Holder Pool (DEMO)',
        units: 100_000_000_000n,
      });
    }

    const distFeeRule = this.feeRules.find((r) => r.feeType === 'DISTRIBUTION');
    const holders = Array.from(holderTotals.values()).map((h) => ({
      investorId: h.investorId,
      investorName: h.investorName,
      unitsScaled: h.units.toString(),
    }));

    const calc = calculateProRataDistributions({
      totalDistributableMinorUnits: payload.totalDeclaredMinorUnits,
      holders,
      withholdingTaxBps: payload.withholdingTaxBps ?? 1500, // 15% default WHT configurable
      distributionFeeBps: distFeeRule?.percentageBps ?? 25,
    });

    const batch: DistributionBatchRecord = {
      id: `DIST-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
      idempotencyKey,
      assetId: asset.id,
      passportId: asset.passport.passportId,
      assetName: asset.name,
      distributionType: payload.distributionType,
      currency: asset.passport.currency,
      totalDeclaredMinorUnits: calc.totalGrossMinorUnits,
      totalWithholdingTaxMinorUnits: calc.totalWithholdingTaxMinorUnits,
      totalFeeMinorUnits: calc.totalFeeMinorUnits,
      totalNetPaidMinorUnits: calc.totalNetPayoutMinorUnits,
      entitlementCount: calc.entitlements.length,
      status: 'PAID',
      createdAt: new Date().toISOString(),
      entitlements: calc.entitlements,
    };

    this.distributions.unshift(batch);
    this.idempotencyStore.set(cacheKey, batch);
    this.appendAudit(
      actor,
      'DISTRIBUTION_EXECUTED',
      'APPROVED',
      `Distributed ${batch.totalDeclaredMinorUnits} minor units across ${batch.entitlementCount} holders of ${asset.passport.passportId}`,
      { assetId: asset.id, tokenId: asset.token.tokenId }
    );
    this.emitEvent('distribution.paid', { batchId: batch.id, assetId: asset.id });

    return { batch, idempotentReplay: false };
  }

  listKycSubmissions() {
    return this.kycSubmissions;
  }

  submitKycKyb(
    actor: RequestActor,
    payload: {
      profileType: 'INDIVIDUAL_KYC' | 'CORPORATE_KYB';
      subjectName: string;
      email: string;
      jurisdiction: string;
      taxResidency: string;
      registrationOrIdRef: string;
      sourceOfFunds: string;
      riskToleranceOrActivity: string;
      beneficialOwnersCount?: number;
      pepDeclared?: boolean;
      highRiskJurisdiction?: boolean;
    }
  ): KycKybSubmission {
    const scoreResult = computeComplianceRiskScore({
      jurisdictionRisk: payload.highRiskJurisdiction ? 20 : 8,
      sanctionsMatch: false,
      pepMatch: Boolean(payload.pepDeclared),
      adverseMediaHits: 0,
      sourceOfFundsVerified: payload.sourceOfFunds.trim().length > 5,
      velocityAnomalyScore: 0,
      documentInconsistencyCount: 0,
    });

    const submission: KycKybSubmission = {
      id: `${payload.profileType === 'CORPORATE_KYB' ? 'KYB' : 'KYC'}-${Date.now().toString().slice(-6)}`,
      profileType: payload.profileType,
      subjectName: payload.subjectName,
      email: payload.email,
      jurisdiction: payload.jurisdiction,
      taxResidency: payload.taxResidency,
      registrationOrIdRef: payload.registrationOrIdRef,
      sourceOfFunds: payload.sourceOfFunds,
      riskToleranceOrActivity: payload.riskToleranceOrActivity,
      beneficialOwnersCount: payload.beneficialOwnersCount ?? 1,
      status: scoreResult.band === 'HIGH' || scoreResult.band === 'CRITICAL' ? 'ENHANCED_DUE_DILIGENCE' : 'PENDING_REVIEW',
      riskScore: scoreResult.score,
      riskBand: scoreResult.band,
      riskFactors: scoreResult.factors,
      sanctionsScreen: 'CLEAR',
      pepScreen: payload.pepDeclared ? 'MATCH' : 'CLEAR',
      submittedAt: new Date().toISOString(),
    };

    this.kycSubmissions.unshift(submission);

    // Open compliance review case automatically
    this.complianceCases.unshift({
      id: `CASE-${Date.now().toString().slice(-5)}`,
      subject: submission.subjectName,
      caseType: payload.profileType === 'CORPORATE_KYB' ? 'KYB' : 'KYC',
      riskScore: submission.riskScore,
      riskBand: submission.riskBand,
      evidence: `${payload.profileType} onboarding submitted (${payload.jurisdiction}); factors: ${scoreResult.factors.join('; ')}`,
      assignedOfficer: 'N. Mokoena',
      status: scoreResult.band === 'HIGH' ? 'ENHANCED_REVIEW' : 'OPEN',
      updatedAt: new Date().toISOString(),
      auditHistory: [
        {
          timestamp: new Date().toISOString(),
          actor: actor.userName,
          action: 'ONBOARDING_SUBMITTED',
          note: `Risk score ${submission.riskScore}/100 (${submission.riskBand})`,
        },
      ],
    });

    this.appendAudit(actor, 'KYC_KYB_SUBMITTED', 'RECORDED', `Submitted ${submission.id} (${submission.riskBand} risk)`);
    return submission;
  }

  listComplianceCases() {
    return this.complianceCases;
  }

  decideComplianceCase(
    actor: RequestActor,
    caseId: string,
    decision: 'APPROVED' | 'RESTRICTED' | 'ACCOUNT_FROZEN' | 'ENHANCED_REVIEW',
    comment: string
  ): ComplianceCaseRecord {
    const found = this.complianceCases.find((c) => c.id === caseId);
    if (!found) throw new Error('COMPLIANCE_CASE_NOT_FOUND');
    found.status = decision;
    found.updatedAt = new Date().toISOString();
    found.auditHistory.unshift({
      timestamp: found.updatedAt,
      actor: `${actor.userName} (${actor.role})`,
      action: decision,
      note: comment || `Decision recorded: ${decision}`,
    });

    if (decision === 'ACCOUNT_FROZEN') {
      this.frozenAccounts.add(found.subject);
    }

    this.appendAudit(
      actor,
      'COMPLIANCE_CASE_DECISION',
      decision === 'APPROVED' ? 'APPROVED' : 'FLAGGED',
      `${found.id} marked ${decision}: ${comment}`
    );
    return found;
  }

  listGovernanceProposals() {
    return this.governanceProposals;
  }

  createGovernanceProposal(
    actor: RequestActor,
    payload: { title: string; category: GovernanceProposal['category']; description: string }
  ): GovernanceProposal {
    const proposal: GovernanceProposal = {
      id: `GOV-${Date.now().toString().slice(-6)}`,
      title: payload.title,
      category: payload.category,
      description: payload.description,
      makerId: actor.userId,
      makerRole: actor.role,
      checkerId: null,
      checkerRole: null,
      requiredApprovals: 2,
      approvalsCount: 1,
      status: 'PENDING_CHECKER',
      createdAt: new Date().toISOString(),
      executedAt: null,
    };
    this.governanceProposals.unshift(proposal);
    this.appendAudit(actor, 'GOVERNANCE_PROPOSAL_CREATED', 'RECORDED', `Maker created ${proposal.id}: ${proposal.title}`);
    return proposal;
  }

  approveGovernanceProposal(actor: RequestActor, proposalId: string): GovernanceProposal {
    const prop = this.governanceProposals.find((p) => p.id === proposalId);
    if (!prop) throw new Error('PROPOSAL_NOT_FOUND');
    if (prop.status !== 'PENDING_CHECKER') throw new Error('PROPOSAL_NOT_PENDING');
    if (prop.makerId === actor.userId) {
      throw new Error('MAKER_CANNOT_SELF_APPROVE');
    }
    prop.checkerId = actor.userId;
    prop.checkerRole = actor.role;
    prop.approvalsCount = 2;
    prop.status = 'APPROVED_EXECUTED';
    prop.executedAt = new Date().toISOString();

    this.appendAudit(actor, 'GOVERNANCE_PROPOSAL_APPROVED', 'APPROVED', `Checker ${actor.userId} co-signed ${prop.id}`);
    return prop;
  }

  listFees() {
    return this.feeRules;
  }

  updateFeeRule(actor: RequestActor, id: string, updates: Partial<FeeRuleConfig>): FeeRuleConfig {
    const rule = this.feeRules.find((r) => r.id === id);
    if (!rule) throw new Error('FEE_RULE_NOT_FOUND');
    Object.assign(rule, {
      fixedMinorUnits: typeof updates.fixedMinorUnits === 'number' ? updates.fixedMinorUnits : rule.fixedMinorUnits,
      percentageBps: typeof updates.percentageBps === 'number' ? updates.percentageBps : rule.percentageBps,
      minMinorUnits: typeof updates.minMinorUnits === 'number' ? updates.minMinorUnits : rule.minMinorUnits,
      maxMinorUnits: typeof updates.maxMinorUnits === 'number' ? updates.maxMinorUnits : rule.maxMinorUnits,
    });
    this.appendAudit(actor, 'FEE_SCHEDULE_UPDATED', 'APPROVED', `Updated fee rule ${rule.id}`);
    return rule;
  }

  listSecondaryOrders() {
    return this.secondaryOrders;
  }

  createSecondaryOrder(
    actor: RequestActor,
    payload: {
      assetId: string;
      side: 'BUY' | 'SELL';
      quantityUnits: number;
      priceMinorUnits: number;
    }
  ): SecondaryOrderRecord {
    const asset = this.getAsset(payload.assetId);
    if (!asset) throw new Error('ASSET_NOT_FOUND');
    if (this.frozenAccounts.has(actor.userId)) {
      throw new Error('ACCOUNT_RESTRICTED_OR_FROZEN');
    }

    const requiresAdmin = asset.passport.transferModelPermitted === 'ADMINISTRATOR_APPROVED';
    const order: SecondaryOrderRecord = {
      id: `ORD-SEC-${Date.now().toString().slice(-5)}`,
      assetId: asset.id,
      passportId: asset.passport.passportId,
      ticker: asset.token.tokenSymbol,
      side: payload.side,
      transferModel: asset.passport.transferModelPermitted,
      quantityUnits: payload.quantityUnits,
      priceMinorUnits: payload.priceMinorUnits,
      currency: asset.passport.currency,
      investorId: actor.userId,
      eligibilityVerified: true,
      status: requiresAdmin ? 'PENDING_ADMIN_APPROVAL' : 'OPEN',
      createdAt: new Date().toISOString(),
    };
    this.secondaryOrders.unshift(order);
    this.appendAudit(
      actor,
      'SECONDARY_ORDER_CREATED',
      'APPROVED',
      `${order.side} ${order.quantityUnits} ${order.ticker} (${order.transferModel})`,
      { assetId: asset.id, tokenId: asset.token.tokenId }
    );
    return order;
  }

  getRwa100Index(methodology: 'MARKET_CAP_WEIGHTED' | 'EQUAL_WEIGHTED' | 'LIQUIDITY_ADJUSTED' = 'MARKET_CAP_WEIGHTED') {
    const categories = [
      { name: 'Real Estate', weight: methodology === 'EQUAL_WEIGHTED' ? 11.1 : 18.5, countries: ['South Africa', 'Kenya', 'Morocco'] },
      { name: 'Energy', weight: methodology === 'EQUAL_WEIGHTED' ? 11.1 : 16.0, countries: ['Ghana', 'Kenya', 'South Africa'] },
      { name: 'Infrastructure', weight: methodology === 'EQUAL_WEIGHTED' ? 11.1 : 15.5, countries: ['Angola', 'Morocco', 'Egypt'] },
      { name: 'Agriculture', weight: methodology === 'EQUAL_WEIGHTED' ? 11.1 : 10.5, countries: ['Kenya', 'Ghana', 'Rwanda'] },
      { name: 'Technology', weight: methodology === 'EQUAL_WEIGHTED' ? 11.1 : 12.0, countries: ['Nigeria', 'Kenya', 'South Africa'] },
      { name: 'Healthcare', weight: methodology === 'EQUAL_WEIGHTED' ? 11.1 : 8.5, countries: ['Rwanda', 'Egypt'] },
      { name: 'Manufacturing', weight: methodology === 'EQUAL_WEIGHTED' ? 11.1 : 7.0, countries: ['Nigeria', 'Morocco', 'Egypt'] },
      { name: 'Logistics', weight: methodology === 'EQUAL_WEIGHTED' ? 11.1 : 6.5, countries: ['Angola', 'South Africa'] },
      { name: 'Financial Assets', weight: methodology === 'EQUAL_WEIGHTED' ? 11.2 : 5.5, countries: ['South Africa', 'Nigeria', 'Kenya'] },
    ];

    const constituents = this.assets.map((asset, idx) => {
      const equalW = Number((100 / this.assets.length).toFixed(2));
      const mcapW = [28.4, 16.2, 21.8, 22.1, 11.5][idx] ?? 10.0;
      const liqW = [24.0, 17.5, 25.0, 13.5, 20.0][idx] ?? 15.0;
      const weight =
        methodology === 'EQUAL_WEIGHTED'
          ? equalW
          : methodology === 'LIQUIDITY_ADJUSTED'
            ? liqW
            : mcapW;

      return {
        assetId: asset.id,
        passportId: asset.passport.passportId,
        name: asset.name,
        ticker: asset.token.tokenSymbol,
        assetClass: asset.passport.assetClass,
        country: asset.passport.country,
        aqxScore: asset.aqxScore.overall,
        liquidity: asset.passport.liquidityClassification,
        weightPercent: weight,
        isDemo: true,
      };
    });

    return {
      indexCode: 'AQX-RWA100',
      indexName: 'AfriQuantX Pan-African Real-World Asset 100 Index',
      methodology,
      isDemo: true,
      disclaimer:
        'DEMO METHODOLOGY SIMULATION: Index constituent weights and indicative series are for platform demonstration and require licensed external pricing feeds prior to live benchmark publication.',
      value: methodology === 'EQUAL_WEIGHTED' ? 1428.64 : methodology === 'LIQUIDITY_ADJUSTED' ? 1512.18 : 1485.20,
      dailyChangePct: '+0.42%',
      weeklyChangePct: '+1.85%',
      monthlyChangePct: '+3.90%',
      annualChangePct: '+14.20%',
      categories,
      constituents,
      priorityCountries: ['South Africa', 'Nigeria', 'Kenya', 'Ghana', 'Angola', 'Rwanda', 'Egypt', 'Morocco'],
      timestamp: new Date().toISOString(),
    };
  }

  getAuditLogs() {
    return this.auditLogs;
  }

  getDomainEvents() {
    return this.domainEvents;
  }

  getSystemHealth() {
    return {
      status: 'OPERATIONAL_PROTOTYPE',
      timestamp: new Date().toISOString(),
      rpoMinutes: 15,
      rtoMinutes: 60,
      services: [
        { name: 'API Gateway (/api/v1)', status: 'HEALTHY', latencyMs: 12, mode: 'LIVE_SERVER' },
        { name: 'PostgreSQL / Relational Schema', status: 'READY_SCHEMA_V2', latencyMs: 8, mode: 'CONFIGURABLE_VIA_DATABASE_URL' },
        {
          name: 'Redis & Queue Worker',
          status: redisService.isConfigured() ? 'REDIS_CONFIGURED' : 'IN_MEMORY_FALLBACK',
          latencyMs: 2,
          mode: redisService.isConfigured() ? 'REDIS_CLOUD_PERSISTENCE' : 'REQUIRES_REDIS_URL_IN_PROD',
        },
        { name: 'AI Governance Layer', status: 'PASSIVE_METADATA_MODE', latencyMs: 4, mode: 'FAIL_CLOSED_WITHOUT_PROVIDER_KEY' },
        {
          name: 'Blockchain Adapter Registry',
          status: blockchainRpcService.isConfigured() ? 'RPC_CONFIGURED' : 'ADAPTER_READY',
          latencyMs: 15,
          mode: blockchainRpcService.isConfigured() ? 'ANKR_MULTICHAIN_RPC' : 'REQUIRES_HSM_SIGNER_AND_AUDIT',
        },
        { name: 'Payment Providers (11 Currencies)', status: 'ADAPTER_READY', latencyMs: 18, mode: 'REQUIRES_PSP_CREDENTIALS' },
        { name: 'KYC / KYB Screening Adapter', status: 'INTERNAL_WORKFLOW_ACTIVE', latencyMs: 9, mode: 'REQUIRES_EXTERNAL_SANCTIONS_FEED' },
        { name: 'Notification Dispatcher', status: 'IN_APP_ACTIVE', latencyMs: 3, mode: 'EMAIL_SMS_WAIT_KEYS' },
        { name: 'Encrypted Object Storage', status: 'SHA256_INDEX_ACTIVE', latencyMs: 11, mode: 'REQUIRES_S3_KMS_BUCKET' },
      ],
      adapters: {
        blockchain: BLOCKCHAIN_ADAPTERS,
        payments: PAYMENT_PROVIDERS,
        currencies: DEMO_FX_RATES,
      },
    };
  }

  async getSystemHealthLive() {
    const [redisHealth, rpcHealth] = await Promise.all([
      redisService.ping(),
      blockchainRpcService.getHealthStatus(),
    ]);

    const overallStatus =
      redisHealth.connected && rpcHealth.connected
        ? 'OPERATIONAL_LIVE_INFRA'
        : redisHealth.connected || rpcHealth.connected
          ? 'OPERATIONAL_PARTIAL_LIVE'
          : 'OPERATIONAL_PROTOTYPE';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      rpoMinutes: 15,
      rtoMinutes: 60,
      infra: {
        redis: redisHealth,
        multichainRpc: rpcHealth,
      },
      services: [
        { name: 'API Gateway (/api/v1)', status: 'HEALTHY', latencyMs: 12, mode: 'LIVE_SERVER' },
        { name: 'PostgreSQL / Relational Schema', status: 'READY_SCHEMA_V2', latencyMs: 8, mode: 'CONFIGURABLE_VIA_DATABASE_URL' },
        {
          name: 'Redis & Queue Worker',
          status: redisHealth.mode,
          latencyMs: redisHealth.latencyMs,
          mode: redisHealth.endpoint ? `REDIS_${redisHealth.endpoint}` : 'REQUIRES_REDIS_URL_IN_PROD',
        },
        { name: 'AI Governance Layer', status: 'PASSIVE_METADATA_MODE', latencyMs: 4, mode: 'FAIL_CLOSED_WITHOUT_PROVIDER_KEY' },
        {
          name: 'Blockchain Adapter Registry',
          status: rpcHealth.mode,
          latencyMs: rpcHealth.latencyMs,
          mode: rpcHealth.host
            ? `${rpcHealth.provider} (${rpcHealth.host}${typeof rpcHealth.chainsReported === 'number' ? ` · ${rpcHealth.chainsReported} chains` : ''})`
            : 'REQUIRES_BLOCKCHAIN_RPC_URL',
        },
        { name: 'Payment Providers (11 Currencies)', status: 'ADAPTER_READY', latencyMs: 18, mode: 'REQUIRES_PSP_CREDENTIALS' },
        { name: 'KYC / KYB Screening Adapter', status: 'INTERNAL_WORKFLOW_ACTIVE', latencyMs: 9, mode: 'REQUIRES_EXTERNAL_SANCTIONS_FEED' },
        { name: 'Notification Dispatcher', status: 'IN_APP_ACTIVE', latencyMs: 3, mode: 'EMAIL_SMS_WAIT_KEYS' },
        { name: 'Encrypted Object Storage', status: 'SHA256_INDEX_ACTIVE', latencyMs: 11, mode: 'REQUIRES_S3_KMS_BUCKET' },
      ],
      adapters: {
        blockchain: BLOCKCHAIN_ADAPTERS,
        payments: PAYMENT_PROVIDERS,
        currencies: DEMO_FX_RATES,
      },
    };
  }
}

export const rwaPlatformService = new RwaPlatformStore();
