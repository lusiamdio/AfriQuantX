<!-- coderabbit-ai-generated:v1 -->

# AfriQuantX

AfriQuantX is a React and Express prototype for exploring African market dashboards, company profiles, portfolio views, and investment intelligence. It combines a Vite client with a Node.js API and optional Supabase and market-data integrations.

## Current status

**This repository is a prototype, not a production financial platform. Do not use real money, payment details, sensitive personal data, or production credentials.** Many screens and institutional integrations use simulated data or simulated results. Market endpoints may return fallback data when a provider is unavailable. Local storage and demo login are not security boundaries. The API currently returns HTTP 503 for all `/api/trade`, `/api/bot`, and `/api/whop` requests: the original implementations lacked the controls needed for safe financial operations.

Significant work remains before deployment: server-side authentication and authorization, safe session handling, atomic and idempotent ledger operations, trusted pricing and execution, verified payment settlement, protection of provider credentials, validation and rate limits, operational monitoring, accessibility, integration testing, and an independent security review. Client-side AI features currently use `VITE_OPENROUTER_API_KEY`, which is included in the browser bundle; do not put a secret there. Several displays describe simulated services as live or verified and must be reviewed before public release.

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

See `.env.example` for the complete list. `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` configure the browser Supabase client. Values prefixed with `VITE_` are public in the generated frontend. `OPENROUTER_API_KEY`, `TWELVEDATA_API_KEY`, `FINNHUB_API_KEY`, `BAVEST_API_KEY`, and Massive variables are read by server integrations where implemented. Whop and financial API routes are disabled. Provider availability and credentials have not been verified by the local smoke checks.

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
