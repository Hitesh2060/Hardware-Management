import { Router } from 'express';
import * as controller from '../controllers/stockController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roleCheck.js';

const router = Router();
router.use(authenticate, requirePermission('product.view'));

router.get('/low-stock', controller.getLowStockList);
router.get('/:productId/current', controller.getCurrentStockLevel);
router.get('/:productId/ledger', controller.getLedger);

export default router;
