import { Router } from 'express';
import * as controller from '../controllers/profileController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { uploadProfileImage } from '../middleware/upload.js';
import { updateProfileSchema, changePasswordSchema } from '../validations/profileValidation.js';

const router = Router();
router.use(authenticate); // no permission gate — every authenticated user manages their own profile

router.get('/me', controller.getMyProfile);
router.patch('/me', validate(updateProfileSchema), controller.updateMyProfile);
router.post('/me/change-password', validate(changePasswordSchema), controller.changeMyPassword);
router.post('/me/avatar', uploadProfileImage, controller.uploadMyAvatar);

export default router;
