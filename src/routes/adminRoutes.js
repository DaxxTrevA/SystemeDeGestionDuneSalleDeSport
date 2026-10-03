import { Router } from 'express';
import { createAdmin, listAdminNotifications, listAdmins, updateAdminCredentials } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { adminCredentialsSchema, createAdminSchema } from '../validators/schemas.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));
router.route('/')
  .get(asyncHandler(listAdmins))
  .post(validate(createAdminSchema), asyncHandler(createAdmin));
router.get('/notifications', asyncHandler(listAdminNotifications));
router.patch('/me', validate(adminCredentialsSchema), asyncHandler(updateAdminCredentials));

export default router;