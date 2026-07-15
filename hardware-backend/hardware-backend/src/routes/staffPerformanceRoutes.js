import { Router } from 'express';
import * as controller from '../controllers/staffPerformanceController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roleCheck.js';

const router = Router();
router.use(authenticate, requirePermission('report.view'));

router.get('/sales', controller.getSalesStaffPerformance);
router.get('/purchases', controller.getPurchaseStaffPerformance);

export default router;
