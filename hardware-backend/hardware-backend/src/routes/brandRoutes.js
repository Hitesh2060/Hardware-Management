import { Router } from 'express';
import * as controller from '../controllers/catalogController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roleCheck.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('product.view'), controller.listBrands);
router.post('/', requirePermission('product.create'), controller.createBrand);
router.delete('/:id', requirePermission('product.delete'), controller.deactivateBrand);

export default router;
