import { Router } from 'express';
import * as controller from '../controllers/salesOrderController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roleCheck.js';
import { createSaleSchema, listSalesSchema } from '../validations/salesOrderValidation.js';

const router = Router();
router.use(authenticate);

router.get('/', validate(listSalesSchema), requirePermission('sale.view'), controller.listSales);
router.get('/:id', requirePermission('sale.view'), controller.getSale);
router.post('/', validate(createSaleSchema), requirePermission('sale.create'), controller.createSale);
router.post('/:id/cancel', requirePermission('sale.void'), controller.cancelSale);

export default router;
