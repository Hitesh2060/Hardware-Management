import { Router } from 'express';
import * as controller from '../controllers/customerController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roleCheck.js';
import { createCustomerSchema, updateCustomerSchema, listCustomersSchema } from '../validations/customerValidation.js';

const router = Router();
router.use(authenticate);

router.get('/', validate(listCustomersSchema), requirePermission('customer.view'), controller.listCustomers);
router.get('/:id', requirePermission('customer.view'), controller.getCustomer);
router.post('/', validate(createCustomerSchema), requirePermission('customer.create'), controller.createCustomer);
router.patch('/:id', validate(updateCustomerSchema), requirePermission('customer.update'), controller.updateCustomer);
router.delete('/:id', requirePermission('customer.delete'), controller.deactivateCustomer);

export default router;
