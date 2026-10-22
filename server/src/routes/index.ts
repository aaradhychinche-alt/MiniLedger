import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes';
import { loansRoutes } from '../modules/loans/loans.routes';
import { dashboardRoutes } from '../modules/dashboard/dashboard.routes';
import { receiptsRoutes } from '../modules/receipts/receipts.routes';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'MiniLedger API',
  });
});

router.use('/auth', authRoutes);
router.use('/loans', loansRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/receipts', receiptsRoutes);

export const apiRouter = router;
