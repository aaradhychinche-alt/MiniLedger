import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /api/dashboard/summary
router.get('/summary', DashboardController.getSummary);

export const dashboardRoutes = router;
