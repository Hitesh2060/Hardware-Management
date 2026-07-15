import { Router } from 'express';
import * as controller from '../controllers/purchaseOrderController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roleCheck.js';
import { createPurchaseSchema, listPurchasesSchema } from '../validations/purchaseOrderValidation.js';

const router = Router();
router.use(authenticate);

router.get('/', validate(listPurchasesSchema), requirePermission('purchase.view'), controller.listPurchases);
router.get('/:id', requirePermission('purchase.view'), controller.getPurchase);
router.post('/', validate(createPurchaseSchema), requirePermission('purchase.create'), controller.createPurchase);
router.post('/:id/receive', requirePermission('purchase.create'), controller.receivePurchase);
router.put('/:id/draft', validate(createPurchaseSchema), requirePermission('purchase.update'), controller.updateDraftPurchase);
router.post('/:id/cancel', requirePermission('purchase.cancel'), controller.cancelPurchase);

export default router;