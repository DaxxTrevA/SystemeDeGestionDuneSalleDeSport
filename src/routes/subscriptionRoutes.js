import { Router } from 'express';
import {
  createSubscription, deleteSubscription, getSubscription,
  listExpiringSubscriptions, listSubscriptions, updateSubscription
} from '../controllers/subscriptionController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { subscriptionSchema } from '../validators/schemas.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);
router.get('/expiring', requireRole('admin'), asyncHandler(listExpiringSubscriptions));
router.get('/', asyncHandler(listSubscriptions));
router.get('/:id', asyncHandler(getSubscription));
router.post('/', requireRole('admin'), validate(subscriptionSchema), asyncHandler(createSubscription));
router.put('/:id', requireRole('admin'), validate(subscriptionSchema), asyncHandler(updateSubscription));
router.delete('/:id', requireRole('admin'), asyncHandler(deleteSubscription));

export default router;