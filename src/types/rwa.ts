export type PlatformRole =
  | 'INVESTOR'
  | 'ISSUER'
  | 'ASSET_OWNER'
  | 'INSTITUTIONAL_INVESTOR'
  | 'COMPLIANCE_OFFICER'
  | 'ASSET_ADMINISTRATOR'
  | 'CUSTODIAN'
  | 'REGULATOR_OBSERVER'
  | 'SUPER_ADMIN';

export type AssetClass =
  | 'Company'
  | 'Equity'
  | 'Debt'
  | 'Real Estate'
  | 'Infrastructure'
  | 'Agriculture'
  | 'Energy'
  | 'Commodity'
  | 'Fund'
  | 'Receivable'
  | 'Healthcare'
  | 'Technology'
  | 'Other';

export const ASSET_WORKFLOW_STAGES = [
  'DRAFT',
  'SUBMITTED',
  'DOCUMENT_VERIFICATION',
  'KYC_KYB',
  'LEGAL_REVIEW',
  'VALUATION',
  'RISK_REVIEW',
  'COMPLIANCE_REVIEW',
  'APPROVED',
  'OFFERING_STRUCTURED',
  'TOKENISATION',
  'PRIMARY_OFFERING',
  'ACTIVE',
] as const;

export type AssetWorkflowStage = (typeof ASSET_WORKFLOW_STAGES)[number];

export const TOKEN_LIFECYCLE_STAGES = [
  'DRAFT',
  'CONFIGURED',
  'LEGAL_APPROVAL',
  'COMPLIANCE_APPROVAL',
  'DEPLOYMENT',
  'MINTED',
  'OFFERING',
  'ACTIVE',
  'TRANSFER_RESTRICTED',
  'TRANSFERABLE',
  'REDEEMED',
  'RETIRED',
] as const;

export type TokenLifecycleStage = (typeof TOKEN_LIFECYCLE_STAGES)[number];

export const DOCUMENT_CATEGORIES = [
  'Ownership Documents',
  'Title Documents',
  'Corporate Records',
  'Audited Financial Statements',
  'Bank Statements',
  'Valuation Reports',
  'Insurance',
  'Licenses',
  'Permits',
  'Contracts',
  'Environmental Reports',
  'Tax Documents',
  'Legal Opinions',
  'Offering Memorandum',
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export type SupportedCurrency =
  | 'ZAR'
  | 'NGN'
  | 'KES'
  | 'GHS'
  | 'AOA'
  | 'RWF'
  | 'EGP'
  | 'MAD'
  | 'USD'
  | 'EUR'
  | 'GBP';

export type SecondaryTransferModel =
  | 'ORDER_BOOK'
  | 'RFQ'
  | 'PEER_TO_PEER'
  | 'ADMINISTRATOR_APPROVED';

export interface AssetDocumentRecord {
  id: string;
  assetId: string;
  category: DocumentCategory;
  title: string;
  version: number;
  sha256Hash: string;
  uploadedAt: string;
  uploadedBy: string;
  expiresAt: string | null;
  reviewerName: string | null;
  verificationStatus: 'PENDING_REVIEW' | 'VERIFIED' | 'FLAGGED' | 'EXPIRED';
  aiExtractionSummary: string;
  aiFlags: string[];
}

export interface AqxAssetScore {
  overall: number;
  financialStrength: number;
  marketOutlook: number;
  governance: number;
  liquidity: number;
  risk: number;
  dataQuality: number;
  methodology: string;
  dataSources: string[];
  timestamp: string;
  confidenceLevel: 'LOW' | 'MODERATE' | 'HIGH';
  limitations: string[];
  modelVersion: string;
}

export interface TokenConfiguration {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  tokenType: 'Security Token (Fungible)' | 'Asset Unit Registry' | 'Fractional Unique Deed' | 'Multi-Tranche Instrument';
  tokenStandard: 'ERC-3643' | 'ERC-20' | 'ERC-721' | 'ERC-1155';
  decimals: number;
  totalSupplyScaled: string;
  totalSupplyDisplay: string;
  unitValueMinorUnits: number;
  minInvestmentMinorUnits: number;
  maxAllocationMinorUnits: number;
  lockupPeriodDays: number;
  maturityDate: string | null;
  transferRestrictions: string;
  geographicRestrictions: string[];
  investorEligibility: string;
  distributionRules: string;
  redemptionRules: string;
  votingRights: string;
  governanceRights: string;
  lifecycleStage: TokenLifecycleStage;
  blockchainNetworkId: string;
  contractAddress: string;
}

export interface DigitalAssetPassport {
  passportId: string; // e.g., AQX-RE-000184
  assetId: string;
  issuer: string;
  assetOwner: string;
  assetClass: AssetClass;
  sector: string;
  country: string;
  jurisdiction: string;
  currency: SupportedCurrency;
  valuationMinorUnits: number;
  valuationDate: string;
  targetRaiseMinorUnits: number;
  fundedAmountMinorUnits: number;
  expectedYieldLabel: string;
  distributionSchedule: string;
  riskScore: number;
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  liquidityClassification: 'HIGH_LIQUIDITY' | 'MODERATE_LIQUIDITY' | 'LIMITED_SECONDARY' | 'ILLIQUID_HOLD_TO_MATURITY';
  legalStructure: string;
  regulatoryStatus: string;
  offeringStatus: AssetWorkflowStage;
  custodyStatus: 'CUSTODIAN_VERIFIED' | 'ESCROW_PENDING' | 'SPV_RINGFENCED';
  transferModelPermitted: SecondaryTransferModel;
  transferRules: string;
  investorEligibility: string;
  disclosuresSummary: string[];
  isDemo: boolean;
}

export interface RwaAsset {
  id: string;
  name: string;
  shortSummary: string;
  investmentThesis: string;
  financialSummary: {
    annualRevenueDisplay: string;
    ebitdaDisplay: string;
    cashFlowDisplay: string;
    debtToEquityDisplay: string;
    valuationBasis: string;
  };
  passport: DigitalAssetPassport;
  token: TokenConfiguration;
  aqxScore: AqxAssetScore;
  documents: AssetDocumentRecord[];
  faqs: { question: string; answer: string }[];
  isDemo: boolean;
}

export interface BlockchainAdapterInfo {
  id: string;
  name: string;
  networkType: 'Ethereum-Compatible' | 'Layer-2 Rollup' | 'Permissioned Institutional Ledger';
  supportedStandards: ('ERC-3643' | 'ERC-20' | 'ERC-721' | 'ERC-1155')[];
  finalityLabel: string;
  explorerUrlTemplate: string;
  custodyKeyModel: string;
  requiresExternalSigner: boolean;
}

export interface PaymentProviderInfo {
  id: string;
  name: string;
  railType: 'Domestic Bank EFT' | 'Instant Interbank' | 'Mobile Money' | 'Cross-Border Wire';
  supportedCurrencies: SupportedCurrency[];
  settlementWindow: string;
  requiresExternalCredentials: boolean;
}

export interface InvestmentOrderRecord {
  id: string;
  idempotencyKey: string;
  investorId: string;
  investorName: string;
  assetId: string;
  passportId: string;
  assetName: string;
  currency: SupportedCurrency;
  grossAmountMinorUnits: number;
  feeMinorUnits: number;
  totalChargeMinorUnits: number;
  unitsAllocatedScaled: string;
  unitsAllocatedDisplay: string;
  complianceStatus: 'PASSED' | 'MANUAL_REVIEW';
  settlementStatus: 'ALLOCATED_DEMO' | 'SETTLED_CUSTODY';
  disclosuresAcceptedAt: string;
  receiptHash: string;
  createdAt: string;
}

export interface DistributionBatchRecord {
  id: string;
  idempotencyKey: string;
  assetId: string;
  passportId: string;
  assetName: string;
  distributionType: 'DIVIDEND' | 'INTEREST' | 'RENTAL' | 'PROJECT_PROCEEDS' | 'REDEMPTION';
  currency: SupportedCurrency;
  totalDeclaredMinorUnits: number;
  totalWithholdingTaxMinorUnits: number;
  totalFeeMinorUnits: number;
  totalNetPaidMinorUnits: number;
  entitlementCount: number;
  status: 'DECLARED' | 'ADMIN_VERIFIED' | 'PAID';
  createdAt: string;
  entitlements: {
    investorId: string;
    investorName: string;
    unitsScaled: string;
    ownershipBps: number;
    grossEntitlementMinorUnits: number;
    withholdingTaxMinorUnits: number;
    feeMinorUnits: number;
    netPayoutMinorUnits: number;
  }[];
}

export interface KycKybSubmission {
  id: string;
  profileType: 'INDIVIDUAL_KYC' | 'CORPORATE_KYB';
  subjectName: string;
  email: string;
  jurisdiction: string;
  taxResidency: string;
  registrationOrIdRef: string;
  sourceOfFunds: string;
  riskToleranceOrActivity: string;
  beneficialOwnersCount: number;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ENHANCED_DUE_DILIGENCE' | 'RESTRICTED';
  riskScore: number;
  riskBand: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: string[];
  sanctionsScreen: 'CLEAR' | 'REVIEW';
  pepScreen: 'CLEAR' | 'MATCH';
  submittedAt: string;
}

export interface ComplianceCaseRecord {
  id: string;
  subject: string;
  caseType: 'KYC' | 'KYB' | 'AML_VELOCITY' | 'SANCTIONS' | 'PEP' | 'ASSET_COMPLIANCE';
  riskScore: number;
  riskBand: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence: string;
  assignedOfficer: string;
  status: 'OPEN' | 'ENHANCED_REVIEW' | 'APPROVED' | 'RESTRICTED' | 'ACCOUNT_FROZEN';
  updatedAt: string;
  auditHistory: { timestamp: string; actor: string; action: string; note: string }[];
}

export interface GovernanceProposal {
  id: string;
  title: string;
  category: 'POLICY_RULE' | 'FEE_SCHEDULE' | 'TOKEN_MINT' | 'CONTRACT_UPGRADE' | 'TREASURY_DISTRIBUTION' | 'AI_MODEL_GOVERNANCE';
  description: string;
  makerId: string;
  makerRole: string;
  checkerId: string | null;
  checkerRole: string | null;
  requiredApprovals: number;
  approvalsCount: number;
  status: 'PENDING_CHECKER' | 'APPROVED_EXECUTED' | 'REJECTED';
  createdAt: string;
  executedAt: string | null;
}

export interface ImmutableAuditEvent {
  id: string;
  event: string;
  userId: string;
  userRole: string;
  assetId?: string;
  tokenId?: string;
  timestamp: string;
  ip: string;
  device: string;
  result: 'APPROVED' | 'RECORDED' | 'DENIED' | 'FLAGGED';
  details: string;
}
