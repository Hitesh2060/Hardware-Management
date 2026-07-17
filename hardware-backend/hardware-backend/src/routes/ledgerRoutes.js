import { Router } from 'express';
import * as controller from '../controllers/ledgerController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roleCheck.js';

const router = Router();
router.use(authenticate);

// ============================================
// CUSTOMER LEDGER
// ============================================

router.get(
  '/customer/:customerId/ledger',
  requirePermission('report.view'),
  controller.getCustomerLedger
);

router.get(
  '/customer/:customerId/summary',
  requirePermission('report.view'),
  controller.getCustomerLedgerSummary
);

router.post(
  '/customer/:customerId/rebuild',
  requirePermission('user.create'),
  controller.rebuildCustomerLedger
);

// ============================================
// SUPPLIER LEDGER
// ============================================

router.get(
  '/supplier/:supplierId/ledger',
  requirePermission('report.view'),
  controller.getSupplierLedger
);

router.get(
  '/supplier/:supplierId/summary',
  requirePermission('report.view'),
  controller.getSupplierLedgerSummary
);

router.post(
  '/supplier/:supplierId/rebuild',
  requirePermission('user.create'),
  controller.rebuildSupplierLedger
);

export default router;