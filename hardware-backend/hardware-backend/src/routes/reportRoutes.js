import { Router } from 'express';
import * as controller from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roleCheck.js';

const router = Router();
router.use(authenticate, requirePermission('report.view'));

router.get('/sales', controller.getSalesReport);
router.get('/purchases', controller.getPurchaseReport);
router.get('/profit', controller.getProfitReport);
router.get('/expenses', controller.getExpenseReport);
router.get('/stock-valuation', controller.getStockValuationReport);
router.get('/dead-stock', controller.getDeadStockReport);
router.get('/fast-moving', controller.getFastMovingItemsReport);

router.get('/sales/export/pdf', requirePermission('report.export'), controller.exportSalesReportPdf);
router.get('/sales/export/excel', requirePermission('report.export'), controller.exportSalesReportExcel);

export default router;
