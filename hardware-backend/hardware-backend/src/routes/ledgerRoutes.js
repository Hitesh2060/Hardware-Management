import { Router } from 'express';
import * as controller from '../controllers/ledgerController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roleCheck.js';

const router = Router();
router.use(authenticate);

router.get(
  '/supplier/:supplierId/ledger',
  requirePermission('report.view'),
  controller.getSupplierLedger
);

router.get(
  '/supplier/:supplierId/summary',
  requirePermission('report.view'),
  controller.getSupplierSummary
);

router.get(
  '/customer/:customerId/ledger',
  requirePermission('report.view'),
  controller.getCustomerLedger
);

router.get(
  '/customer/:customerId/summary',
  requirePermission('report.view'),
  controller.getCustomerSummary
);

export default router;