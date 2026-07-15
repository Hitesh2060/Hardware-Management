import { Router } from 'express';
import * as controller from '../controllers/productController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roleCheck.js';
import { uploadProductImage } from '../middleware/upload.js';
import { createProductSchema, updateProductSchema, listProductsSchema } from '../validations/productValidation.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(listProductsSchema), requirePermission('product.view'), controller.listProducts);
router.get('/:id', requirePermission('product.view'), controller.getProduct);
router.post('/', validate(createProductSchema), requirePermission('product.create'), controller.createProduct);
router.patch('/:id', validate(updateProductSchema), requirePermission('product.update'), controller.updateProduct);
router.post('/:id/image', requirePermission('product.update'), uploadProductImage, controller.uploadProductImage);
router.delete('/:id', requirePermission('product.delete'), controller.deactivateProduct);

export default router;
