import { Router } from 'express';
import * as controller from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate); // every user manages their own notifications, no extra permission needed

router.get('/', controller.listMyNotifications);
router.patch('/:id/read', controller.markAsRead);
router.patch('/read-all', controller.markAllAsRead);

export default router;
