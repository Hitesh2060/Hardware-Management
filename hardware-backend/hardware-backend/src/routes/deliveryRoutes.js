import { Router } from 'express';
import * as controller from '../controllers/deliveryController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roleCheck.js';
import { createDeliverySchema, updateDeliveryStatusSchema } from '../validations/deliveryValidation.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('sale.view'), controller.listDeliveries);
router.get('/:id', requirePermission('sale.view'), controller.getDelivery);
router.post('/', validate(createDeliverySchema), requirePermission('sale.create'), controller.createDelivery);
router.patch('/:id/status', validate(updateDeliveryStatusSchema), requirePermission('sale.create'), controller.updateDeliveryStatus);

export default router;
