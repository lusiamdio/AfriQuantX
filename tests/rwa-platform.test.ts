import { strict as assert } from 'node:assert';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';
import routes from '../server/routes/index.js';
import { redisService } from '../server/services/redis.service.js';
import {
  calculateInvestmentBreakdown,
  calculateProRataDistributions,
  computeComplianceRiskScore,
  convertCurrencyMinorUnits,
  parseDecimalToScaled,
} from '../src/lib/financialMath.js';

let server: Server;
let base: string;

before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api', routes);
  server = await new Promise<Server>((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  base = `http://127.0.0.1:${address.port}/api/v1`;
});

after(async () => {
  server?.close();
  await redisService.disconnect();
});

test('financialMath: deterministic fixed-point investment breakdown eliminates float rounding errors', () => {
  const breakdown = calculateInvestmentBreakdown({
    investmentMinorUnits: 123_456, // $1,234.56
    unitPriceMinorUnits: 7_500, // $75.00
    totalSupplyUnitsScaled: parseDecimalToScaled('100000', 6).toString(),
    feeRule: {
      fixedMinorUnits: 500,
      percentageBps: 75, // 0.75%
      minMinorUnits: 250,
      maxMinorUnits: 50_000,
    },
  });

  // 123,456 * 75 bps = 925.92 -> rounds half-up to 926 + 500 fixed = 1,426 minor units
  assert.equal(breakdown.feeMinorUnits, 1426);
  assert.equal(breakdown.totalChargeMinorUnits, 123_456 + 1426);
  // (123,456 * 10^6) / 7,500 = 16,460,800 -> 16.4608 units
  assert.equal(breakdown.unitsAllocatedScaled, '16460800');
  assert.equal(breakdown.unitsAllocatedDisplay, '16.4608');
});

test('financialMath: Hamilton largest-remainder pro-rata distribution conserves exact minor units', () => {
  const result = calculateProRataDistributions({
    totalDistributableMinorUnits: 100_001, // Odd cent pool split across 3 equal holders
    withholdingTaxBps: 1500, // 15%
    distributionFeeBps: 25, // 0.25%
    holders: [
      { investorId: 'inv-a', investorName: 'Holder A', unitsScaled: '100000000' },
      { investorId: 'inv-b', investorName: 'Holder B', unitsScaled: '100000000' },
      { investorId: 'inv-c', investorName: 'Holder C', unitsScaled: '100000000' },
    ],
  });

  assert.equal(result.totalGrossMinorUnits, 100_001);
  assert.equal(result.entitlements[0].grossEntitlementMinorUnits, 33_334);
  assert.equal(result.entitlements[1].grossEntitlementMinorUnits, 33_334);
  assert.equal(result.entitlements[2].grossEntitlementMinorUnits, 33_333);
  for (const row of result.entitlements) {
    assert.equal(
      row.netPayoutMinorUnits,
      row.grossEntitlementMinorUnits - row.withholdingTaxMinorUnits - row.feeMinorUnits
    );
  }
});

test('financialMath: FX conversion & compliance risk scoring bands', () => {
  const converted = convertCurrencyMinorUnits(100_000, 18_250_000n); // $1,000 * 18.25 ZAR
  assert.equal(converted, 1_825_000);

  const low = computeComplianceRiskScore({
    jurisdictionRisk: 5,
    sanctionsMatch: false,
    pepMatch: false,
    adverseMediaHits: 0,
    sourceOfFundsVerified: true,
    velocityAnomalyScore: 0,
    documentInconsistencyCount: 0,
  });
  assert.equal(low.band, 'LOW');

  const critical = computeComplianceRiskScore({
    jurisdictionRisk: 20,
    sanctionsMatch: true,
    pepMatch: true,
    adverseMediaHits: 2,
    sourceOfFundsVerified: false,
    velocityAnomalyScore: 15,
    documentInconsistencyCount: 1,
  });
  assert.equal(critical.band, 'CRITICAL');
  assert.ok(critical.score >= 80);
});

test('API v1: GET /assets returns seeded DEMO assets and enforces RBAC on POST /assets', async () => {
  const listRes = await fetch(`${base}/assets`);
  assert.equal(listRes.status, 200);
  const listJson = await listRes.json();
  assert.ok(Array.isArray(listJson.assets) && listJson.assets.length >= 5);

  const forbiddenRes = await fetch(`${base}/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-aqx-role': 'INVESTOR' },
    body: JSON.stringify({ name: 'Unauthorized Asset' }),
  });
  assert.equal(forbiddenRes.status, 403);
  assert.equal((await forbiddenRes.json()).error, 'FORBIDDEN_ROLE');

  const issuerRes = await fetch(`${base}/assets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-aqx-role': 'ISSUER',
      'x-aqx-user-id': 'issuer-test-01',
      'x-aqx-user-name': 'Test Issuer SPV',
    },
    body: JSON.stringify({
      name: 'Nairobi Clean Water Trust',
      shortSummary: 'Ring-fenced municipal water desalination note in Nairobi.',
      assetClass: 'Infrastructure',
      sector: 'Water Infrastructure',
      country: 'Kenya',
      jurisdiction: 'Kenya (CMA Sandbox)',
      currency: 'USD',
      issuer: 'Nairobi Water SPV Ltd',
      assetOwner: 'East Africa Utilities Holdings',
      valuationMinorUnits: 500_000_000,
      targetRaiseMinorUnits: 200_000_000,
      unitValueMinorUnits: 10_000,
      legalStructure: 'Kenya SPV Revenue Note',
      regulatoryStatus: 'SUBMITTED — Pending legal & regulatory sign-off',
      tokenName: 'Nairobi Water Unit',
      tokenSymbol: 'AQX-NAIW',
      tokenStandard: 'ERC-3643',
      blockchainNetworkId: 'adapter-polygon',
      transferModelPermitted: 'ALLOWLIST_P2P',
    }),
  });
  assert.equal(issuerRes.status, 201);
  const created = await issuerRes.json();
  assert.equal(created.asset.token.lifecycleStage, 'DRAFT');
  assert.ok(created.asset.passport.passportId.startsWith('AQX-'));
});

test('API v1: POST /investments requires Idempotency-Key and replays deterministic receipt', async () => {
  const missingKeyRes = await fetch(`${base}/investments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-aqx-role': 'INVESTOR',
      'x-aqx-user-id': 'inv-test-01',
    },
    body: JSON.stringify({
      assetId: 'asset-cape-urban-re',
      amountMinorUnits: 200_000,
      disclosuresAccepted: true,
    }),
  });
  assert.equal(missingKeyRes.status, 400);
  assert.equal((await missingKeyRes.json()).error, 'IDEMPOTENCY_KEY_REQUIRED');

  const idempotencyKey = `test-idem-${Date.now()}`;
  const firstRes = await fetch(`${base}/investments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-aqx-role': 'INVESTOR',
      'x-aqx-user-id': 'inv-test-01',
      'x-aqx-user-name': 'Kagiso Allocator',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      assetId: 'asset-cape-urban-re',
      amountMinorUnits: 200_000, // R 2,000.00 >= R 1,500 min
      disclosuresAccepted: true,
    }),
  });
  assert.equal(firstRes.status, 201);
  const firstJson = await firstRes.json();
  assert.equal(firstJson.idempotentReplay, false);

  const replayRes = await fetch(`${base}/investments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-aqx-role': 'INVESTOR',
      'x-aqx-user-id': 'inv-test-01',
      'x-aqx-user-name': 'Kagiso Allocator',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      assetId: 'asset-cape-urban-re',
      amountMinorUnits: 200_000,
      disclosuresAccepted: true,
    }),
  });
  assert.equal(replayRes.status, 200);
  const replayJson = await replayRes.json();
  assert.equal(replayJson.idempotentReplay, true);
  assert.equal(replayJson.order.id, firstJson.order.id);
});

test('API v1: Governance maker!=checker enforcement and distribution + audit logging', async () => {
  // Maker creates proposal
  const propRes = await fetch(`${base}/governance/proposals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-aqx-role': 'ASSET_ADMINISTRATOR',
      'x-aqx-user-id': 'maker-admin-1',
      'x-aqx-user-name': 'Admin Maker',
    },
    body: JSON.stringify({
      title: 'Adjust primary subscription fee cap',
      category: 'FEE_RULE_UPDATE',
      description: 'Update cap bounds for institutional allocation tiers.',
    }),
  });
  assert.equal(propRes.status, 201);
  const { proposal } = await propRes.json();

  // Same maker attempts self-approval -> rejected
  const selfApprove = await fetch(`${base}/governance/proposals/${proposal.id}/approve`, {
    method: 'POST',
    headers: {
      'x-aqx-role': 'ASSET_ADMINISTRATOR',
      'x-aqx-user-id': 'maker-admin-1',
    },
  });
  assert.equal(selfApprove.status, 400);

  // Different compliance officer co-signs -> approved & executed
  const checkerApprove = await fetch(`${base}/governance/proposals/${proposal.id}/approve`, {
    method: 'POST',
    headers: {
      'x-aqx-role': 'COMPLIANCE_OFFICER',
      'x-aqx-user-id': 'checker-mlro-2',
      'x-aqx-user-name': 'Compliance Checker',
    },
  });
  assert.equal(checkerApprove.status, 200);
  const approvedJson = await checkerApprove.json();
  assert.equal(approvedJson.proposal.status, 'APPROVED_EXECUTED');

  // Execute pro-rata distribution
  const distRes = await fetch(`${base}/distributions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-aqx-role': 'ISSUER',
      'x-aqx-user-id': 'issuer-cape-01',
      'Idempotency-Key': `dist-${Date.now()}`,
    },
    body: JSON.stringify({
      assetId: 'asset-cape-urban-re',
      distributionType: 'RENTAL_INCOME',
      totalDeclaredMinorUnits: 250_000,
      withholdingTaxBps: 1000,
    }),
  });
  assert.equal(distRes.status, 201);
  const distJson = await distRes.json();
  assert.equal(distJson.batch.totalDeclaredMinorUnits, 250_000);
  assert.ok(distJson.batch.entitlements.length >= 1);

  // Verify immutable audit log & RWA100 index endpoint
  const [auditRes, rwa100Res] = await Promise.all([
    fetch(`${base}/audit`, { headers: { 'x-aqx-role': 'REGULATOR_OBSERVER' } }),
    fetch(`${base}/rwa100?methodology=EQUAL_WEIGHTED`),
  ]);
  assert.equal(auditRes.status, 200);
  const auditJson = await auditRes.json();
  assert.ok(auditJson.auditLogs.length >= 3);

  assert.equal(rwa100Res.status, 200);
  const rwa100Json = await rwa100Res.json();
  assert.equal(rwa100Json.methodology, 'EQUAL_WEIGHTED');
  assert.ok(Array.isArray(rwa100Json.constituents) && rwa100Json.constituents.length > 0);
});

test('roleAccess: strict Investor vs Company separation & required sub-role definitions', async () => {
  const {
    INVESTOR_IDENTITIES,
    COMPANY_POSITIONS,
    canRoleAccessTab,
  } = await import('../src/lib/roleAccess.js');

  assert.deepEqual(
    INVESTOR_IDENTITIES.map((i) => i.label),
    ['Equity Funder', 'Venture Capital', 'Private Investor']
  );
  assert.deepEqual(
    COMPANY_POSITIONS.map((c) => c.label),
    ['Startup', 'Hedge Fund']
  );

  // Investors see investor workflows only, never issuer/tokenisation/admin consoles
  assert.equal(canRoleAccessTab('investor', 'marketplace'), true);
  assert.equal(canRoleAccessTab('investor', 'portfolio'), true);
  assert.equal(canRoleAccessTab('investor', 'issuer-dashboard'), false);
  assert.equal(canRoleAccessTab('investor', 'tokenisation-hub'), false);
  assert.equal(canRoleAccessTab('investor', 'ipo-launch'), false);
  assert.equal(canRoleAccessTab('investor', 'admin'), false);

  // Companies see company/issuer workflows only, never investor marketplace/personal trading
  assert.equal(canRoleAccessTab('company', 'issuer-dashboard'), true);
  assert.equal(canRoleAccessTab('company', 'tokenisation-hub'), true);
  assert.equal(canRoleAccessTab('company', 'ipo-launch'), true);
  assert.equal(canRoleAccessTab('company', 'marketplace'), false);
  assert.equal(canRoleAccessTab('company', 'portfolio'), false);
  assert.equal(canRoleAccessTab('company', 'trade'), false);
  assert.equal(canRoleAccessTab('company', 'market-secondary'), false);
  assert.equal(canRoleAccessTab('company', 'admin'), false);
});

test('API v1: infrastructure health, Redis status, and Multichain RPC fail-closed + validation', async () => {
  const [healthRes, redisRes, bcStatusRes] = await Promise.all([
    fetch(`${base}/system/health`),
    fetch(`${base}/infra/redis/status`),
    fetch(`${base}/blockchain/status`),
  ]);

  assert.equal(healthRes.status, 200);
  const healthJson = await healthRes.json();
  assert.ok(Array.isArray(healthJson.services));
  assert.ok(healthJson.infra?.redis);
  assert.ok(healthJson.infra?.multichainRpc);

  assert.equal(redisRes.status, 200);
  const redisJson = await redisRes.json();
  assert.equal(typeof redisJson.configured, 'boolean');
  assert.equal(typeof redisJson.mode, 'string');
  // Never expose credentials in serialized payloads
  assert.equal(JSON.stringify(redisJson).includes('redis://default:'), false);

  assert.equal(bcStatusRes.status, 200);
  const bcStatusJson = await bcStatusRes.json();
  assert.equal(typeof bcStatusJson.configured, 'boolean');

  // Invalid EVM address must be rejected cleanly
  const badAddrRes = await fetch(`${base}/blockchain/balances/not-an-address`);
  assert.equal(badAddrRes.status, 400);
  const badAddrJson = await badAddrRes.json();
  assert.equal(badAddrJson.error, 'INVALID_EVM_ADDRESS');

  // When RPC env vars are unset in test runtime, stats endpoint fails closed with 503
  if (!process.env.ANKR_MULTICHAIN_RPC_URL && !process.env.BLOCKCHAIN_RPC_URL) {
    const statsRes = await fetch(`${base}/blockchain/stats`);
    assert.equal(statsRes.status, 503);
    assert.equal((await statsRes.json()).error, 'BLOCKCHAIN_RPC_NOT_CONFIGURED');
  }
});

