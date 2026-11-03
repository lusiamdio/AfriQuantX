import { Router } from 'express';
import aiRoutes from './ai.routes.js';
import marketRoutes from './market.routes.js';
import authRoutes from './auth.routes.js';
import africanRoutes from './african_exchange.routes.js';
import integrationsRoutes from './integrations.routes.js';

const router = Router();

// API Modules
router.use('/ai', aiRoutes);
router.use('/market', marketRoutes);
// These operations require authenticated, atomic accounting before they can be enabled.
router.use('/trade', (_req, res) => res.status(503).json({ error: 'Trading and wallet operations are unavailable.' }));
router.use('/auth', authRoutes);
router.use('/bot', (_req, res) => res.status(503).json({ error: 'Automated trading is unavailable.' }));
router.use('/whop', (_req, res) => res.status(503).json({ error: 'Whop integration is unavailable.' }));
router.use('/african', africanRoutes);
router.use('/integrations', integrationsRoutes);

export default router;

