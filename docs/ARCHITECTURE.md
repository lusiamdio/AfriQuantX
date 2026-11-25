# AfriQuantX — Real-World Asset (RWA) Infrastructure Architecture

## 1. Platform Positioning & Legal Boundary
AfriQuantX operates as **Africa's AI-Powered Real-World Asset Investment Infrastructure**, designed strictly around compliance-first asset representation—not an unregulated cryptocurrency exchange.

Every onboarded asset explicitly separates:
1. **Legal Ownership Layer**: Off-chain Special Purpose Vehicle (SPV), custodian, or regulated trustee structure holding title deeds, commercial agreements, and revenue rights.
2. **Regulatory & Compliance Layer**: Jurisdiction-specific authorisation references, off-chain KYC/KYB verification, sanctions/PEP screening, and compliance freeze gates.
3. **Technical Tokenisation Layer**: Pluggable ledger adapters (`Polygon`, `Ethereum`, `Base L2`, `Permissioned Besu`) issuing permissioned digital asset units bound to a **Digital Asset Passport** (`AQX-{CLASS}-{SERIAL}`).

## 2. Core System Layers
- **Fixed-Point Financial Math (`src/lib/financialMath.ts`)**: All investment breakdowns, configurable fees, FX conversions (`10^6` scaled integers), and Hamilton largest-remainder pro-rata distributions run in exact integer/BigInt arithmetic so floating-point rounding drift cannot occur.
- **Role-Based Access Control (`server/routes/v1.routes.ts`)**: Every state-changing `/api/v1/*` endpoint enforces role permissions (`INVESTOR`, `ISSUER`, `ASSET_OWNER`, `INSTITUTIONAL_INVESTOR`, `COMPLIANCE_OFFICER`, `ASSET_ADMINISTRATOR`, `CUSTODIAN`, `REGULATOR_OBSERVER`, `SUPER_ADMIN`).
- **Idempotency & Concurrency**: Primary investments (`POST /api/v1/investments`) and yield distributions (`POST /api/v1/distributions`) require a caller-supplied `Idempotency-Key` header and cache deterministic receipts per actor+key.
- **Maker/Checker Multi-Admin Governance**: Critical actions (`CREATE_OFFERING`, `PAUSE_TRADING`, `UPGRADE_ADAPTER`, `UPDATE_FEE_SCHEDULE`, `FROZEN_ASSET_OVERRIDE`) require a separate checker role that cannot match the initiating maker's user ID.
- **Off-Chain PII Isolation**: Investor/beneficial-owner identity documents remain strictly off-chain in KMS-encrypted storage (`supabase_schema_v2_rwa.sql`). Only non-PII allowlist flags and document SHA-256 checksums bind to on-chain adapters.

## 3. Data Persistence, Auditability & Disaster Recovery
- `audit_logs` stores `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `before_state`, `after_state`, `ip_address`, `device_info`, and timestamp. Database triggers block `UPDATE` and `DELETE` operations.
- Target production objectives (once deployed to managed PostgreSQL/KMS infrastructure):
  - **RPO**: <= 5 minutes via continuous WAL archiving / point-in-time recovery.
  - **RTO**: <= 30 minutes across multi-AZ failover nodes.
  - **Backup Verification**: Daily automated checksum verification + quarterly restore drills.

## 4. Mandatory External Dependencies Before Live Regulated Operations
The current application provides an interactive architectural prototype and deterministic simulation (`DEMO` assets, `DEMO_INDICATIVE` FX snapshots). Prior to accepting live investor funds or regulated asset issuances, operators must provision and integrate:
1. **Regulated KYC/KYB, AML & Sanctions Providers** (e.g., Smile ID, Sumsub, Refinitiv World-Check, Compustat/PEP screening webhooks).
2. **Licensed Payment & Mobile-Money Rails** (e.g., PayShap/BankservAfrica, NIBSS, Safaricom M-Pesa Daraja, SWIFT institutional escrow accounts).
3. **Licensed Legal Structures & Regulatory Authorisations** (Jurisdiction-specific legal opinions, SPV trust deeds, FSCA / Kenya CMA / Nigeria SEC / Botswana NBFIRA filings and custodian agreements).
4. **External Real-Time Market & FX Data Feeds** (Licensed B2B FX feeds and sovereign yield benchmarks replacing `DEMO_INDICATIVE` reference rates).
5. **Independent Smart-Contract Security Audits & Key Custody** (Third-party audit sign-off on `contracts/AQXRegulatedSecurityToken.sol`, HSM/MPC custody for `ISSUER_ROLE`, `COMPLIANCE_ROLE`, and `PAUSER_ROLE` signers).
6. **Production Infrastructure Secrets & Persistent Managed Database** (Managed PostgreSQL with `supabase_schema_v2_rwa.sql`, Redis idempotency store, encrypted S3/GCS document vault, and production authentication tokens).
