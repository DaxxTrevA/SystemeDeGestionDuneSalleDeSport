import { Router } from 'express';
import {
  approveSubscriptionRequest, createSubscription, deleteSubscription, getSubscription,
  listExpiringSubscriptions, listSubscriptions, rejectSubscriptionRequest, requestSubscription, updateSubscription
} from '../controllers/subscriptionController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { subscriptionRequestSchema, subscriptionSchema } from '../validators/schemas.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);
router.post('/request', requireRole('member'), validate(subscriptionRequestSchema), asyncHandler(requestSubscription));
router.get('/expiring', requireRole('admin'), asyncHandler(listExpiringSubscriptions));
router.get('/', asyncHandler(listSubscriptions));
router.post('/:id/approve', requireRole('admin'), asyncHandler(approveSubscriptionRequest));
router.post('/:id/reject', requireRole('admin'), asyncHandler(rejectSubscriptionRequest));
router.get('/:id', asyncHandler(getSubscription));
router.post('/', requireRole('admin'), validate(subscriptionSchema), asyncHandler(createSubscription));
router.put('/:id', requireRole('admin'), validate(subscriptionSchema), asyncHandler(updateSubscription));
router.delete('/:id', requireRole('admin'), asyncHandler(deleteSubscription));

export default router;