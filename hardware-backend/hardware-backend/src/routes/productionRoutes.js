import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
// import { notImplemented } from '../controllers/productionController.js';

const router = Router();
router.use(authenticate);

// Add specific routes here when ready

export default router;