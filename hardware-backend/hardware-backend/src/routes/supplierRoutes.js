import { Router } from 'express';
import * as controller from '../controllers/supplierController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roleCheck.js';
import { createSupplierSchema, updateSupplierSchema, listSuppliersSchema } from '../validations/supplierValidation.js';

const router = Router();
router.use(authenticate);

router.get('/', validate(listSuppliersSchema), requirePermission('supplier.view'), controller.listSuppliers);
router.get('/:id', requirePermission('supplier.view'), controller.getSupplier);
router.post('/', validate(createSupplierSchema), requirePermission('supplier.create'), controller.createSupplier);
router.patch('/:id', validate(updateSupplierSchema), requirePermission('supplier.update'), controller.updateSupplier);
router.delete('/:id', requirePermission('supplier.delete'), controller.deactivateSupplier);

export default router;
