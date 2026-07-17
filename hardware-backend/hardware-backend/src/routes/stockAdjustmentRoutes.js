import { Router } from 'express';
import * as controller from '../controllers/stockAdjustmentController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validate.js';
import { 
  createStockAdjustmentSchema,
  listStockAdjustmentsSchema,
  adjustmentReportSchema,
  financialSummarySchema
} from '../validations/stockAdjustmentValidation.js';

const router = Router();
router.use(authenticate);

// Create adjustment with financial tracking
router.post(
  '/',
  validate(createStockAdjustmentSchema),
  requirePermission('stock.adjust'),
  controller.createStockAdjustment
);

// List all adjustments (with pagination)
router.get(
  '/',
  validate(listStockAdjustmentsSchema),
  requirePermission('stock.adjust'),
  controller.listStockAdjustments
);

// Get adjustments with financial report
router.get(
  '/report',
  validate(adjustmentReportSchema),
  requirePermission('stock.adjust'),
  controller.getAdjustmentReport
);

// Get financial summary
router.get(
  '/financial-summary',
  validate(financialSummarySchema),
  requirePermission('stock.adjust'),
  controller.getFinancialSummary
);

export default router;