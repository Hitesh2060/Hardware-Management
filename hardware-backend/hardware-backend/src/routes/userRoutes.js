import { Router } from 'express';
import * as controller from '../controllers/userController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roleCheck.js';
import {
  listUsersSchema,
  updateUserRoleSchema,
  setUserActiveSchema,
  adminResetPasswordSchema,
} from '../validations/userValidation.js';

const router = Router();
router.use(authenticate);

router.get('/roles', requirePermission('user.view'), controller.listRoles);
router.get('/', validate(listUsersSchema), requirePermission('user.view'), controller.listUsers);
router.get('/:id', requirePermission('user.view'), controller.getUser);
router.patch('/:id/role', validate(updateUserRoleSchema), requirePermission('user.update'), controller.updateUserRole);
router.patch('/:id/active', validate(setUserActiveSchema), requirePermission('user.update'), controller.setUserActive);
router.post(
  '/:id/reset-password',
  validate(adminResetPasswordSchema),
  requirePermission('user.update'),
  controller.adminResetPassword
);

export default router;
