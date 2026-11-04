<!-- coderabbit-ai-generated:v1 -->

# AfriQuantX

AfriQuantX is a React and Express prototype for exploring African market dashboards, company profiles, portfolio views, and investment intelligence. It combines a Vite client with a Node.js API and optional Supabase and market-data integrations.

<!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:79abb4e36e95f0d4456f3df1cf090e8612f846929f58c6ee6cc973f2b641778a -->

## Current status

**This repository is a prototype, not a production financial platform. Do not use real money, payment details, sensitive personal data, or production credentials.** Many screens use simulated data and market endpoints may return fallback data when a provider is unavailable. The `/api/trade`, `/api/bot`, `/api/whop`, `/api/african`, `/api/integrations`, `/api/ai`, and placeholder `/api/auth` routes return HTTP 503 until safe integrations are implemented. <!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:b588223ac1ac72e7f6b9b2daf870d776fa4aaace6af929e03e003a6bf4513ac1 -->

The former browser AI key is no longer used; some screens still show simulated AI content.

<!-- /coderabbit-ai-generated:v1 -->

Significant work remains before deployment: server-side authorization, atomic and idempotent ledger operations, trusted pricing and execution, verified payment settlement, authenticated and rate-limited provider access, operational monitoring, accessibility, integration testing, dependency remediation, and an independent security review. Several displays describe simulated services as live or verified and must be reviewed before public release.

<!-- /coderabbit-ai-generated:v1 -->

## Requirements

- Node.js 24 and Bun 1.4 were used for local verification.
- Optional: a disposable Supabase project and provider credentials for integration development.

The Bun lockfile is the reproducible dependency source. The checked-in npm lockfile is out of sync with `package.json`; `npm ci` fails. `react-simple-maps` also declares React 18 peer support while this project uses React 19. Resolve that compatibility issue and consolidate lockfiles as part of dependency maintenance.

## Getting started

```sh
bun install --frozen-lockfile
cp .env.example .env
bun run dev
```

Open `http://localhost:3000`. The development server serves the API and Vite frontend together. The app can start without credentials, but configured features will be unavailable or use simulation. The local `.env` file is ignored by Git.

```sh
bun run lint       # TypeScript check
bun run test       # API fail-closed regression tests
bun run build      # Vite production bundle
NODE_ENV=production bun run start # serves dist and API; build first
```

The server listens on `PORT` (default 3000), on all interfaces. `/api/health` is a process health check, not a provider or database readiness check. Unknown API routes return JSON 404 responses.

## Configuration

<!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:4f77564477952ea125cb28655f5ef513838c77abd9fbde4cb1c968c24b1a9ef8 -->

See `.env.example` for the complete list. `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` configure the browser Supabase client. Values prefixed with `VITE_` are public in the generated frontend. Sign-in requires a valid Supabase session and a readable profile; signup may require email confirmation. Legacy demo login and sensitive onboarding drafts are removed. Role access in the interface comes from the profile, and database policies and grants must enforce authorization independently. Identity verification and company onboarding are not implemented. `TWELVEDATA_API_KEY`, `FINNHUB_API_KEY`, `BAVEST_API_KEY`, and Massive variables are read by market routes where implemented. Provider availability and credentials have not been verified by the local smoke checks.

<!-- /coderabbit-ai-generated:v1 -->

## Data model

`supabase_schema.sql` defines profiles, companies, wallets, transactions, assets, orders, portfolio items, and audit logs, with row-level security and a signup trigger. It is an initial schema, not an idempotent migration: it creates types and tables and replaces the `supabase_realtime` publication. Review it carefully before applying it to a disposable project; do not run it over an existing production database.

For an existing installation of the original schema, review and apply `migrations/001_restrict_client_writes.sql`: it removes direct client transaction and order write policies and restricts profile updates to name and avatar. Review any custom grants, policies, and already elevated roles separately. These changes do not repair historical data or create a secure ledger.

## Project structure

- `src/` — React views, client services, and styles.
- `server/routes/` — Express API modules for market data, AI, and prototype integrations.
- `server/services/` — provider and database adapters.
- `server.ts` — API and frontend server entry point.
- `supabase_schema.sql` and `migrations/` — initial database schema and targeted remediation.
- `tests/` — regression checks for disabled financial routes.

## Operational limitations

The application has no production deployment configuration or comprehensive automated test suite. `bun audit` reports vulnerabilities in the current lockfile, including critical and high severity advisories. The production build produces a large JavaScript bundle. The audit, dependency compatibility, simulated features, and missing controls above must be resolved and revalidated before a production release.
