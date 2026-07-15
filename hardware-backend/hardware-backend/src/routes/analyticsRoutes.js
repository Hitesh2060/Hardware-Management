import { Router } from 'express';
import * as controller from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roleCheck.js';

const router = Router();
router.use(authenticate, requirePermission('dashboard.view'));

router.get('/summary', controller.getSummary);
router.get('/top-products', controller.getTopProducts);
router.get('/monthly-trend', controller.getMonthlyTrend);
router.get('/recent-activity', controller.getRecentActivity);

export default router;
