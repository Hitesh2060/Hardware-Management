import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roleCheck.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validations/authValidation.js';

const router = Router();

// Only ADMINs (or a user with "user.create") can create new staff accounts —
// there is no public self-signup in an internal ERP system.
router.post(
  '/register',
  authenticate,
  requirePermission('user.create'),
  validate(registerSchema),
  authController.register
);

router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh-token', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);
router.get('/me', authenticate, authController.me);

export default router;
