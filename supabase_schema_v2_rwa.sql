-- AfriQuantX Institutional RWA Platform — PostgreSQL Schema v2 (Compliance-First Blueprint)
-- NOTE: Designed for Supabase / PostgreSQL 15+. Requires RLS policies and KMS/Vault encryption
-- for PII and off-chain custody credentials prior to production deployment.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Identity, RBAC & Organizations
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  account_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'FROZEN', 'SUSPENDED', 'PENDING')),
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL
);

INSERT INTO roles (id, description) VALUES
  ('INVESTOR', 'Retail/Qualified Individual Investor'),
  ('ISSUER', 'Real-World Asset Issuer / Sponsor'),
  ('ASSET_OWNER', 'Underlying Asset Beneficial Owner'),
  ('INSTITUTIONAL_INVESTOR', 'Institutional / DFI / Pension Allocator'),
  ('COMPLIANCE_OFFICER', 'MLRO / AML / KYC Compliance Reviewer'),
  ('ASSET_ADMINISTRATOR', 'Platform Operations & Token Lifecycle Admin'),
  ('CUSTODIAN', 'Regulated Third-Party Custodian / Trustee'),
  ('REGULATOR_OBSERVER', 'Read-Only Supervisory Authority Access'),
  ('SUPER_ADMIN', 'Dual-Controlled System Administrator')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name TEXT NOT NULL,
  spv_name TEXT,
  registration_number TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  kyb_status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_users (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_role TEXT NOT NULL,
  PRIMARY KEY (organization_id, user_id)
);

-- 2. Investor, Issuer & KYC/KYB Verification (Off-Chain PII Isolated)
CREATE TABLE IF NOT EXISTS investor_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  investor_tier TEXT NOT NULL CHECK (investor_tier IN ('RETAIL', 'QUALIFIED', 'INSTITUTIONAL')),
  tax_residency_country TEXT NOT NULL,
  kyc_tier TEXT NOT NULL DEFAULT 'TIER_0',
  compliance_risk_score INTEGER NOT NULL DEFAULT 0 CHECK (compliance_risk_score BETWEEN 0 AND 100),
  source_of_funds_verified BOOLEAN NOT NULL DEFAULT FALSE,
  allowlisted_for_rwa BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issuer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  regulatory_license_ref TEXT,
  custodian_name TEXT,
  trustee_name TEXT,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kyc_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  pii_encrypted_ref TEXT NOT NULL, -- Pointer to KMS-encrypted off-chain PII vault
  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  risk_band TEXT NOT NULL CHECK (risk_band IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'EDD_REQUIRED', 'REJECTED', 'FROZEN')),
  reviewer_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kyb_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  jurisdiction TEXT NOT NULL,
  registry_verification_ref TEXT,
  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'EDD_REQUIRED', 'REJECTED', 'FROZEN')),
  reviewer_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS beneficial_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  ownership_bps INTEGER NOT NULL CHECK (ownership_bps BETWEEN 1 AND 10000),
  pep_flag BOOLEAN NOT NULL DEFAULT FALSE,
  sanctions_flag BOOLEAN NOT NULL DEFAULT FALSE,
  verified BOOLEAN NOT NULL DEFAULT FALSE
);

-- 3. Document Vault & Hashing
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  storage_uri TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL CHECK (version_number >= 1),
  sha256_hash TEXT NOT NULL,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('UPLOADED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED')),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (document_id, version_number)
);

-- 4. Assets, Digital Asset Passports & Reviews
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  passport_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  asset_class TEXT NOT NULL,
  country TEXT NOT NULL,
  jurisdiction_regulator TEXT NOT NULL,
  spv_legal_entity TEXT NOT NULL,
  custodian_name TEXT NOT NULL,
  workflow_stage TEXT NOT NULL,
  currency TEXT NOT NULL,
  unit_price_minor_units BIGINT NOT NULL CHECK (unit_price_minor_units > 0),
  total_supply_units_scaled NUMERIC(30,0) NOT NULL CHECK (total_supply_units_scaled > 0),
  available_units_scaled NUMERIC(30,0) NOT NULL CHECK (available_units_scaled >= 0),
  min_investment_minor_units BIGINT NOT NULL CHECK (min_investment_minor_units > 0),
  target_yield_bps INTEGER NOT NULL,
  is_demo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asset_owners (
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ownership_bps INTEGER NOT NULL CHECK (ownership_bps BETWEEN 1 AND 10000),
  PRIMARY KEY (asset_id, organization_id)
);

CREATE TABLE IF NOT EXISTS asset_valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  valuation_minor_units BIGINT NOT NULL CHECK (valuation_minor_units > 0),
  currency TEXT NOT NULL,
  valuer_firm TEXT NOT NULL,
  valuation_date DATE NOT NULL,
  report_document_id UUID REFERENCES documents(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asset_documents (
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  PRIMARY KEY (asset_id, document_id)
);

CREATE TABLE IF NOT EXISTS asset_risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  composite_score NUMERIC(5,2) NOT NULL CHECK (composite_score BETWEEN 0 AND 100),
  risk_band TEXT NOT NULL CHECK (risk_band IN ('LOW', 'MEDIUM', 'HIGH')),
  confidence_level NUMERIC(4,2) NOT NULL,
  scoring_version TEXT NOT NULL,
  limitations_disclosure TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asset_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id),
  from_stage TEXT NOT NULL,
  to_stage TEXT NOT NULL,
  decision TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Offerings & Regulated Token Units
CREATE TABLE IF NOT EXISTS offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  offering_type TEXT NOT NULL CHECK (offering_type IN ('PRIVATE_PLACEMENT', 'REGULATED_PUBLIC', 'INSTITUTIONAL_SYNDICATE')),
  opens_at TIMESTAMPTZ NOT NULL,
  closes_at TIMESTAMPTZ,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS offering_terms (
  offering_id UUID PRIMARY KEY REFERENCES offerings(id) ON DELETE CASCADE,
  eligibility_tier TEXT NOT NULL,
  transfer_restriction_summary TEXT NOT NULL,
  lockup_days INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS token_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adapter_name TEXT NOT NULL,
  chain_id TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  standard TEXT NOT NULL DEFAULT 'ERC-3643-COMPLIANT',
  deployed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id TEXT UNIQUE NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  lifecycle_stage TEXT NOT NULL,
  transfer_model TEXT NOT NULL CHECK (transfer_model IN ('LOCKED', 'ADMIN_APPROVED', 'ALLOWLIST_P2P', 'RFQ', 'ORDER_BOOK')),
  token_contract_id UUID REFERENCES token_contracts(id),
  paused BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS token_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  investor_user_id UUID NOT NULL REFERENCES users(id),
  units_scaled NUMERIC(30,0) NOT NULL CHECK (units_scaled > 0),
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS token_holdings (
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  investor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  units_scaled NUMERIC(30,0) NOT NULL CHECK (units_scaled >= 0),
  locked_units_scaled NUMERIC(30,0) NOT NULL DEFAULT 0 CHECK (locked_units_scaled >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (token_id, investor_user_id)
);

-- 6. Wallets, Primary Investments, Secondary Orders & Distributions
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  available_minor_units BIGINT NOT NULL DEFAULT 0 CHECK (available_minor_units >= 0),
  locked_minor_units BIGINT NOT NULL DEFAULT 0 CHECK (locked_minor_units >= 0),
  custody_address TEXT,
  UNIQUE (user_id, currency)
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
  tx_type TEXT NOT NULL CHECK (tx_type IN ('DEPOSIT', 'INVESTMENT_DEBIT', 'DISTRIBUTION_CREDIT', 'FEE_DEBIT', 'WITHDRAWAL')),
  amount_minor_units BIGINT NOT NULL CHECK (amount_minor_units > 0),
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investments (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL,
  user_id TEXT NOT NULL,
  asset_id TEXT NOT NULL REFERENCES assets(id),
  currency TEXT NOT NULL,
  gross_amount_minor_units BIGINT NOT NULL CHECK (gross_amount_minor_units > 0),
  fee_minor_units BIGINT NOT NULL CHECK (fee_minor_units >= 0),
  total_charge_minor_units BIGINT NOT NULL CHECK (total_charge_minor_units > 0),
  units_allocated_scaled NUMERIC(30,0) NOT NULL CHECK (units_allocated_scaled > 0),
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id TEXT NOT NULL REFERENCES assets(id),
  user_id TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
  model TEXT NOT NULL,
  units_scaled NUMERIC(30,0) NOT NULL CHECK (units_scaled > 0),
  limit_price_minor_units BIGINT NOT NULL CHECK (limit_price_minor_units > 0),
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buy_order_id UUID NOT NULL REFERENCES orders(id),
  sell_order_id UUID NOT NULL REFERENCES orders(id),
  asset_id TEXT NOT NULL REFERENCES assets(id),
  units_scaled NUMERIC(30,0) NOT NULL CHECK (units_scaled > 0),
  execution_price_minor_units BIGINT NOT NULL CHECK (execution_price_minor_units > 0),
  settled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS distributions (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT UNIQUE NOT NULL,
  asset_id TEXT NOT NULL REFERENCES assets(id),
  distribution_type TEXT NOT NULL,
  currency TEXT NOT NULL,
  total_distributable_minor_units BIGINT NOT NULL CHECK (total_distributable_minor_units > 0),
  withholding_tax_bps INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS distribution_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_id TEXT NOT NULL REFERENCES distributions(id) ON DELETE CASCADE,
  investor_user_id TEXT NOT NULL,
  gross_entitlement_minor_units BIGINT NOT NULL CHECK (gross_entitlement_minor_units >= 0),
  withholding_tax_minor_units BIGINT NOT NULL CHECK (withholding_tax_minor_units >= 0),
  fee_minor_units BIGINT NOT NULL CHECK (fee_minor_units >= 0),
  net_payout_minor_units BIGINT NOT NULL CHECK (net_payout_minor_units >= 0)
);

-- 7. Compliance, AML, Sanctions, PEP & Blockchain Events
CREATE TABLE IF NOT EXISTS compliance_cases (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  case_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  assigned_officer TEXT,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aml_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_case_id TEXT REFERENCES compliance_cases(id),
  rule_triggered TEXT NOT NULL,
  score_contribution INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sanctions_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  match_found BOOLEAN NOT NULL,
  screened_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pep_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  pep_tier TEXT,
  screened_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL,
  tx_category TEXT NOT NULL,
  currency TEXT NOT NULL,
  amount_minor_units BIGINT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blockchain_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_contract_id UUID REFERENCES token_contracts(id),
  tx_hash TEXT NOT NULL,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blockchain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address TEXT NOT NULL,
  event_name TEXT NOT NULL,
  payload JSONB NOT NULL,
  block_number BIGINT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Portfolios, Notifications, Immutable Audit, API Keys, Webhooks, Fees & Reporting
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  total_nav_minor_units BIGINT NOT NULL,
  currency TEXT NOT NULL,
  snapshot_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read_flag BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before_state JSONB,
  after_state JSONB,
  ip_address TEXT NOT NULL,
  device_info TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforce strict append-only immutability on audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs table is strictly append-only and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_no_update ON audit_logs;
CREATE TRIGGER trg_audit_logs_no_update
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  key_prefix TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  scopes TEXT[] NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,
  signing_secret_hash TEXT NOT NULL,
  events TEXT[] NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  fee_type TEXT NOT NULL,
  fixed_minor_units BIGINT NOT NULL DEFAULT 0,
  percentage_bps INTEGER NOT NULL DEFAULT 0,
  min_minor_units BIGINT NOT NULL DEFAULT 0,
  max_minor_units BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  asset_class TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  currency TEXT NOT NULL,
  amount_minor_units BIGINT NOT NULL,
  status TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  generated_by TEXT NOT NULL,
  payload_ref TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS regulatory_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction TEXT NOT NULL,
  reporting_period TEXT NOT NULL,
  status TEXT NOT NULL,
  filed_at TIMESTAMPTZ
);

-- Enable Row Level Security on sensitive tables (policies defined per deployment environment)
ALTER TABLE kyc_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyb_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
