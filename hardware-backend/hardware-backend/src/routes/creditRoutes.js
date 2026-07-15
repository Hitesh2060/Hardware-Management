import { Router } from 'express';
import * as controller from '../controllers/creditController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roleCheck.js';

const router = Router();
router.use(authenticate, requirePermission('report.view'));

router.get('/customer-due', controller.getCustomerDueReport);
router.get('/supplier-due', controller.getSupplierDueReport);
router.get('/overdue-customers', controller.getOverdueCustomers);

export default router;
