import { Router } from 'express';
import { createMember, deleteMember, getMember, listMembers, updateMember } from '../controllers/memberController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { memberSchema } from '../validators/schemas.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));
router.route('/')
  .get(asyncHandler(listMembers))
  .post(validate(memberSchema), asyncHandler(createMember));
router.route('/:id')
  .get(asyncHandler(getMember))
  .put(validate(memberSchema), asyncHandler(updateMember))
  .delete(asyncHandler(deleteMember));

export default router;