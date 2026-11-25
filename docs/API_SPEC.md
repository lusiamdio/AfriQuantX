# AfriQuantX REST API v1 Specification (`/api/v1`)

All endpoints return JSON. Protected endpoints require role context headers (`x-aqx-role`, `x-aqx-user-id`, `x-aqx-user-name` in prototype mode; verified JWT/session claims in production).

## Assets & Digital Asset Passports
- `GET /api/v1/assets` — Filterable list of RWA assets (`assetClass`, `country`, `risk`, `search`).
- `GET /api/v1/assets/:id` — Single asset detail & passport record.
- `POST /api/v1/assets` — Submit issuer asset onboarding application (`ISSUER`, `ASSET_OWNER`, `ASSET_ADMINISTRATOR`, `SUPER_ADMIN`).
- `POST /api/v1/assets/:id/transition` — Advance asset through the monotonic 13-stage workflow (`COMPLIANCE_OFFICER`, `ASSET_ADMINISTRATOR`, `SUPER_ADMIN`).
- `POST /api/v1/assets/:id/documents` — Register SHA-256 hashed asset document version (`ISSUER`, `ASSET_OWNER`, `ASSET_ADMINISTRATOR`, `COMPLIANCE_OFFICER`, `SUPER_ADMIN`).

## Token Lifecycle & Secondary Controls
- `POST /api/v1/tokens/:id/lifecycle` — Transition token lifecycle stage (`DRAFT` .. `RETIRED`) and configure permitted secondary transfer model (`LOCKED`, `ADMIN_APPROVED`, `ALLOWLIST_P2P`, `RFQ`, `ORDER_BOOK`).

## Primary Investments & Pro-Rata Distributions
- `GET /api/v1/investments` — List investment order records.
- `POST /api/v1/investments` — Execute investment allocation (`INVESTOR`, `INSTITUTIONAL_INVESTOR`, `SUPER_ADMIN`).
  - **Required Header**: `Idempotency-Key` (returns `400 IDEMPOTENCY_KEY_REQUIRED` if absent; `200` with `idempotentReplay: true` on duplicate submission).
- `GET /api/v1/distributions` — List income/dividend distribution batches.
- `POST /api/v1/distributions` — Execute deterministic Hamilton largest-remainder pro-rata distribution (`ISSUER`, `ASSET_ADMINISTRATOR`, `CUSTODIAN`, `SUPER_ADMIN`). Requires `Idempotency-Key`.

## KYC / KYB & Compliance Cases
- `GET /api/v1/kyc` — List KYC/KYB screening records.
- `POST /api/v1/kyc` — Submit Individual KYC or Corporate KYB screening with deterministic 0–100 risk scoring.
- `GET /api/v1/compliance/cases` — View open compliance cases (`COMPLIANCE_OFFICER`, `REGULATOR_OBSERVER`, `ASSET_ADMINISTRATOR`, `SUPER_ADMIN`).
- `POST /api/v1/compliance/cases/:id/decision` — Record compliance decision (`APPROVED`, `EDD_REQUIRED`, `RESTRICT_TRANSFERS`, `FROZEN`) (`COMPLIANCE_OFFICER`, `SUPER_ADMIN`).

## Governance, Fees, Benchmark Index & Audit
- `GET /api/v1/governance/proposals` — List maker/checker proposals.
- `POST /api/v1/governance/proposals` — Submit governance proposal.
- `POST /api/v1/governance/proposals/:id/approve` — Co-sign proposal (rejects self-approval by the original maker).
- `GET /api/v1/fees` / `PUT /api/v1/fees/:id` — Read and update configurable percentage bps, fixed minor units, and floor/cap fee bounds.
- `GET /api/v1/secondary/orders` / `POST /api/v1/secondary/orders` — Secondary market order submission gated by compliance freeze and asset transfer model.
- `GET /api/v1/rwa100?methodology=MARKET_CAP_WEIGHTED|EQUAL_WEIGHTED|LIQUIDITY_ADJUSTED` — Compute AQX RWA100 index constituents and weights.
- `GET /api/v1/audit` — Retrieve immutable append-only audit log entries.
- `GET /api/v1/events` — Retrieve emitted domain events.
- `GET /api/v1/system/health` — Backend service health & subsystem summary.
