import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
// Remove the notImplemented import for now
// import { notImplemented } from '../controllers/rawMaterialController.js';

const router = Router();
router.use(authenticate);

// Add specific routes here when ready
// For now, just export the router with authentication middleware

export default router;