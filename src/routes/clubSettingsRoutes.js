import { Router } from 'express';
import { getClubSettings, getSubscriptionOffer, updateClubSettings } from '../controllers/clubSettingsController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { clubSettingsSchema } from '../validators/schemas.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.get('/offer', requireAuth, asyncHandler(getSubscriptionOffer));
router.use(requireAuth, requireRole('admin'));
router.get('/', asyncHandler(getClubSettings));
router.put('/', validate(clubSettingsSchema), asyncHandler(updateClubSettings));

export default router;