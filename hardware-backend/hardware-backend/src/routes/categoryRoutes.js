import { Router } from 'express';
import * as controller from '../controllers/categoryController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roleCheck.js';
import { createCategorySchema, updateCategorySchema } from '../validations/categoryValidation.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('product.view'), controller.listCategories);
router.get('/:id', requirePermission('product.view'), controller.getCategory);
router.post('/', validate(createCategorySchema), requirePermission('product.create'), controller.createCategory);
router.patch('/:id', validate(updateCategorySchema), requirePermission('product.update'), controller.updateCategory);
router.delete('/:id', requirePermission('product.delete'), controller.deactivateCategory);

export default router;
