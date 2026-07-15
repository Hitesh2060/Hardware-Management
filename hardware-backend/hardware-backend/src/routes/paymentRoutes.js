import { Router } from 'express';
import * as controller from '../controllers/paymentController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roleCheck.js';
import {
  recordCustomerPaymentSchema,
  recordSupplierPaymentSchema,
  listPaymentsSchema,
} from '../validations/paymentValidation.js';

const router = Router();
router.use(authenticate);

router.get('/', validate(listPaymentsSchema), requirePermission('payment.view'), controller.listPayments);
router.post(
  '/customer',
  validate(recordCustomerPaymentSchema),
  requirePermission('payment.create'),
  controller.recordCustomerPayment
);
router.post(
  '/supplier',
  validate(recordSupplierPaymentSchema),
  requirePermission('payment.create'),
  controller.recordSupplierPayment
);

export default router;
