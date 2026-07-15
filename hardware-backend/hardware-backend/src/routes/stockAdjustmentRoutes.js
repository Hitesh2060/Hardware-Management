import { Router } from 'express';
import * as controller from '../controllers/stockAdjustmentController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roleCheck.js';
import { createStockAdjustmentSchema, listStockAdjustmentsSchema } from '../validations/stockAdjustmentValidation.js';

const router = Router();
router.use(authenticate);

router.get('/', validate(listStockAdjustmentsSchema), requirePermission('product.view'), controller.listStockAdjustments);
// Deliberately restricted to a narrower permission than product.update — physical stock
// corrections are a bigger deal than editing a description or price.
router.post('/', validate(createStockAdjustmentSchema), requirePermission('stock.adjust'), controller.createStockAdjustment);

export default router;
