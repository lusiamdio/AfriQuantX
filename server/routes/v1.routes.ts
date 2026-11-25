import { Router, type Request, type Response } from 'express';
import { rwaPlatformService, type RequestActor } from '../services/rwaPlatform.service.js';
import { redisService } from '../services/redis.service.js';
import { blockchainRpcService } from '../services/blockchainRpc.service.js';
import type { PlatformRole } from '../../src/types/rwa.js';

const router = Router();

const VALID_ROLES: PlatformRole[] = [
  'INVESTOR',
  'ISSUER',
  'ASSET_OWNER',
  'INSTITUTIONAL_INVESTOR',
  'COMPLIANCE_OFFICER',
  'ASSET_ADMINISTRATOR',
  'CUSTODIAN',
  'REGULATOR_OBSERVER',
  'SUPER_ADMIN',
];

function extractActor(req: Request): RequestActor {
  const rawRole = String(req.header('x-aqx-role') || 'INVESTOR').toUpperCase() as PlatformRole;
  const role: PlatformRole = VALID_ROLES.includes(rawRole) ? rawRole : 'INVESTOR';
  const subRole = String(req.header('x-aqx-subrole') || '').trim();
  const baseName = String(req.header('x-aqx-user-name') || 'Prototype Participant');
  return {
    userId: String(req.header('x-aqx-user-id') || 'demo-user-01'),
    userName: subRole ? `${baseName} [${subRole}]` : baseName,
    role,
    ip: req.ip || '127.0.0.1',
    device: String(req.header('user-agent') || 'AfriQuantX Client').slice(0, 80),
  };
}

function requireRole(actor: RequestActor, allowed: PlatformRole[], res: Response): boolean {
  if (!allowed.includes(actor.role)) {
    res.status(403).json({
      error: 'FORBIDDEN_ROLE',
      message: `Role ${actor.role} is not authorised for this operation.`,
      requiredRoles: allowed,
    });
    return false;
  }
  return true;
}

// Assets & Passports
router.get('/assets', (req, res) => {
  const assets = rwaPlatformService.listAssets({
    assetClass: req.query.assetClass as string | undefined,
    country: req.query.country as string | undefined,
    risk: req.query.risk as string | undefined,
    search: req.query.search as string | undefined,
  });
  res.json({ assets, count: assets.length, isDemo: true });
});

router.get('/assets/:id', (req, res) => {
  const asset = rwaPlatformService.getAsset(req.params.id);
  if (!asset) {
    res.status(404).json({ error: 'ASSET_NOT_FOUND' });
    return;
  }
  res.json({ asset });
});

router.post('/assets', (req, res) => {
  const actor = extractActor(req);
  if (!requireRole(actor, ['ISSUER', 'ASSET_OWNER', 'ASSET_ADMINISTRATOR', 'SUPER_ADMIN'], res)) return;
  try {
    const asset = rwaPlatformService.createAssetApplication(actor, req.body);
    res.status(201).json({ asset });
  } catch (err) {
    res.status(400).json({ error: 'INVALID_ASSET_APPLICATION', message: (err as Error).message });
  }
});

router.post('/assets/:id/transition', (req, res) => {
  const actor = extractActor(req);
  if (!requireRole(actor, ['COMPLIANCE_OFFICER', 'ASSET_ADMINISTRATOR', 'SUPER_ADMIN'], res)) return;
  try {
    const asset = rwaPlatformService.transitionAssetStage(actor, req.params.id, req.body.nextStage);
    res.json({ asset });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post('/assets/:id/documents', (req, res) => {
  const actor = extractActor(req);
  if (!requireRole(actor, ['ISSUER', 'ASSET_OWNER', 'ASSET_ADMINISTRATOR', 'COMPLIANCE_OFFICER', 'SUPER_ADMIN'], res)) return;
  try {
    const doc = rwaPlatformService.uploadAssetDocument(actor, req.params.id, req.body);
    res.status(201).json({ document: doc });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Token Design & Lifecycle
router.post('/tokens/:id/lifecycle', (req, res) => {
  const actor = extractActor(req);
  if (!requireRole(actor, ['ASSET_ADMINISTRATOR', 'COMPLIANCE_OFFICER', 'CUSTODIAN', 'SUPER_ADMIN'], res)) return;
  try {
    const asset = rwaPlatformService.transitionTokenLifecycle(
      actor,
      req.params.id,
      req.body.lifecycleStage,
      req.body.transferModelPermitted
    );
    res.json({ asset });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Investment Engine (Idempotency-Key enforced)
router.get('/investments', (_req, res) => {
  res.json({ investments: rwaPlatformService.listInvestments() });
});

router.post('/investments', (req, res) => {
  const actor = extractActor(req);
  if (!requireRole(actor, ['INVESTOR', 'INSTITUTIONAL_INVESTOR', 'SUPER_ADMIN'], res)) return;
  const idempotencyKey = String(req.header('idempotency-key') || '').trim();
  if (!idempotencyKey) {
    res.status(400).json({ error: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Header Idempotency-Key is mandatory.' });
    return;
  }
  try {
    const result = rwaPlatformService.executeInvestment(actor, idempotencyKey, req.body);
    res.status(result.idempotentReplay ? 200 : 201).json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Distribution Engine (Idempotency-Key enforced)
router.get('/distributions', (_req, res) => {
  res.json({ distributions: rwaPlatformService.listDistributions() });
});

router.post('/distributions', (req, res) => {
  const actor = extractActor(req);
  if (!requireRole(actor, ['ISSUER', 'ASSET_ADMINISTRATOR', 'CUSTODIAN', 'SUPER_ADMIN'], res)) return;
  const idempotencyKey = String(req.header('idempotency-key') || '').trim();
  if (!idempotencyKey) {
    res.status(400).json({ error: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Header Idempotency-Key is mandatory.' });
    return;
  }
  try {
    const result = rwaPlatformService.executeDistribution(actor, idempotencyKey, req.body);
    res.status(result.idempotentReplay ? 200 : 201).json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// KYC / KYB & Compliance
router.get('/kyc', (_req, res) => {
  res.json({ submissions: rwaPlatformService.listKycSubmissions() });
});

router.post('/kyc', (req, res) => {
  const actor = extractActor(req);
  try {
    const submission = rwaPlatformService.submitKycKyb(actor, req.body);
    res.status(201).json({ submission });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.get('/compliance/cases', (req, res) => {
  const actor = extractActor(req);
  if (!requireRole(actor, ['COMPLIANCE_OFFICER', 'REGULATOR_OBSERVER', 'ASSET_ADMINISTRATOR', 'SUPER_ADMIN'], res)) return;
  res.json({ cases: rwaPlatformService.listComplianceCases() });
});

router.post('/compliance/cases/:id/decision', (req, res) => {
  const actor = extractActor(req);
  if (!requireRole(actor, ['COMPLIANCE_OFFICER', 'SUPER_ADMIN'], res)) return;
  try {
    const updated = rwaPlatformService.decideComplianceCase(actor, req.params.id, req.body.decision, req.body.comment);
    res.json({ caseRecord: updated });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Governance Maker/Checker Multi-Admin Approval
router.get('/governance/proposals', (_req, res) => {
  res.json({ proposals: rwaPlatformService.listGovernanceProposals() });
});

router.post('/governance/proposals', (req, res) => {
  const actor = extractActor(req);
  if (!requireRole(actor, ['ASSET_ADMINISTRATOR', 'COMPLIANCE_OFFICER', 'SUPER_ADMIN'], res)) return;
  const proposal = rwaPlatformService.createGovernanceProposal(actor, req.body);
  res.status(201).json({ proposal });
});

router.post('/governance/proposals/:id/approve', (req, res) => {
  const actor = extractActor(req);
  if (!requireRole(actor, ['COMPLIANCE_OFFICER', 'ASSET_ADMINISTRATOR', 'CUSTODIAN', 'SUPER_ADMIN'], res)) return;
  try {
    const proposal = rwaPlatformService.approveGovernanceProposal(actor, req.params.id);
    res.json({ proposal });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Configurable Fee Schedule
router.get('/fees', (_req, res) => {
  res.json({ feeRules: rwaPlatformService.listFees() });
});

router.put('/fees/:id', (req, res) => {
  const actor = extractActor(req);
  if (!requireRole(actor, ['ASSET_ADMINISTRATOR', 'SUPER_ADMIN'], res)) return;
  try {
    const feeRule = rwaPlatformService.updateFeeRule(actor, req.params.id, req.body);
    res.json({ feeRule });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Controlled Secondary Market
router.get('/secondary/orders', (_req, res) => {
  res.json({ orders: rwaPlatformService.listSecondaryOrders() });
});

router.post('/secondary/orders', (req, res) => {
  const actor = extractActor(req);
  if (!requireRole(actor, ['INVESTOR', 'INSTITUTIONAL_INVESTOR', 'SUPER_ADMIN'], res)) return;
  try {
    const order = rwaPlatformService.createSecondaryOrder(actor, req.body);
    res.status(201).json({ order });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// AQX RWA100 Index
router.get('/rwa100', (req, res) => {
  const methodology = (req.query.methodology as 'MARKET_CAP_WEIGHTED' | 'EQUAL_WEIGHTED' | 'LIQUIDITY_ADJUSTED') || 'MARKET_CAP_WEIGHTED';
  res.json(rwaPlatformService.getRwa100Index(methodology));
});

// Audit Trail & Events & System Health
router.get('/audit', (req, res) => {
  const actor = extractActor(req);
  if (!requireRole(actor, ['COMPLIANCE_OFFICER', 'REGULATOR_OBSERVER', 'ASSET_ADMINISTRATOR', 'CUSTODIAN', 'SUPER_ADMIN'], res)) return;
  res.json({ auditLogs: rwaPlatformService.getAuditLogs() });
});

router.get('/events', (_req, res) => {
  res.json({ events: rwaPlatformService.getDomainEvents() });
});

router.get('/system/health', async (_req, res) => {
  const health = await rwaPlatformService.getSystemHealthLive();
  res.json(health);
});

router.get('/infra/redis/status', async (_req, res) => {
  const status = await redisService.ping();
  res.json(status);
});

router.get('/blockchain/status', async (_req, res) => {
  const [provider, health] = await Promise.all([
    Promise.resolve(blockchainRpcService.getSanitizedProviderInfo()),
    blockchainRpcService.getHealthStatus(),
  ]);
  res.json({ ...provider, health });
});

router.get('/blockchain/stats', async (req, res) => {
  try {
    const chains = typeof req.query.chains === 'string' ? req.query.chains : undefined;
    const data = await blockchainRpcService.getBlockchainStats(chains);
    res.json(data);
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    const status = e.statusCode || (e.message === 'UNSUPPORTED_BLOCKCHAIN_NETWORK' ? 400 : 502);
    res.status(status).json({ error: e.message || 'BLOCKCHAIN_STATS_FAILED' });
  }
});

router.get('/blockchain/balances/:address', async (req, res) => {
  try {
    const chains = typeof req.query.chains === 'string' ? req.query.chains : undefined;
    const data = await blockchainRpcService.getAccountBalances(req.params.address, chains);
    res.json(data);
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    const isClientErr =
      e.message === 'INVALID_EVM_ADDRESS' || e.message === 'UNSUPPORTED_BLOCKCHAIN_NETWORK';
    const status = e.statusCode || (isClientErr ? 400 : 502);
    res.status(status).json({ error: e.message || 'BLOCKCHAIN_BALANCE_FAILED' });
  }
});

router.get('/blockchain/transactions/:address', async (req, res) => {
  try {
    const chains = typeof req.query.chains === 'string' ? req.query.chains : undefined;
    const data = await blockchainRpcService.getTransactionsByAddress(req.params.address, chains);
    res.json(data);
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    const isClientErr =
      e.message === 'INVALID_EVM_ADDRESS' || e.message === 'UNSUPPORTED_BLOCKCHAIN_NETWORK';
    const status = e.statusCode || (isClientErr ? 400 : 502);
    res.status(status).json({ error: e.message || 'BLOCKCHAIN_TX_LOOKUP_FAILED' });
  }
});

router.get('/blockchain/holders/:chain/:contract', async (req, res) => {
  try {
    const data = await blockchainRpcService.getTokenHolders(req.params.chain, req.params.contract);
    res.json(data);
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    const isClientErr =
      e.message === 'INVALID_EVM_ADDRESS' || e.message === 'UNSUPPORTED_BLOCKCHAIN_NETWORK';
    const status = e.statusCode || (isClientErr ? 400 : 502);
    res.status(status).json({ error: e.message || 'BLOCKCHAIN_HOLDERS_FAILED' });
  }
});

export default router;
