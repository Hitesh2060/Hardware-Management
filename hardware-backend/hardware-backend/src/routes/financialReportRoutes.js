import { Router } from 'express';
import * as controller from '../controllers/financialReportController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roleCheck.js';

const router = Router();
router.use(authenticate);

// Profit & Loss Statement
router.get(
  '/profit-loss',
  requirePermission('report.view'),
  controller.getProfitLoss
);

// Stock Adjustment Financial Report
router.get(
  '/stock-adjustment',
  requirePermission('report.view'),
  controller.getStockAdjustmentFinancialReport
);

export default router;