import { Router } from 'express';
import marketRoutes from './market.routes.js';

const router = Router();

// API Modules
router.use('/ai', (_req, res) => res.status(503).json({ error: 'AI integration is unavailable.' }));
router.use('/market', marketRoutes);
// These operations require authenticated, atomic accounting before they can be enabled.
router.use('/trade', (_req, res) => res.status(503).json({ error: 'Trading and wallet operations are unavailable.' }));
router.use('/auth', (_req, res) => res.status(503).json({ error: 'Use the configured authentication provider.' }));
router.use('/bot', (_req, res) => res.status(503).json({ error: 'Automated trading is unavailable.' }));
router.use('/whop', (_req, res) => res.status(503).json({ error: 'Whop integration is unavailable.' }));
router.use('/african', (_req, res) => res.status(503).json({ error: 'Exchange integration is unavailable.' }));
router.use('/integrations', (_req, res) => res.status(503).json({ error: 'Institutional integrations are unavailable.' }));

export default router;

