import { Router } from 'express';
import * as controller from '../controllers/activityLogController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = Router();
// Audit trail is admin-only — it's the record of *everyone's* actions,
// including other admins, so it isn't gated by a regular permission code.
router.use(authenticate, requireRole('ADMIN'));

router.get('/', controller.listActivityLogs);

export default router;
