import { Router } from 'express';
import {
  bookClass, cancelBooking, createClass, deleteClass, listClasses, updateClass
} from '../controllers/classController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { groupClassSchema } from '../validators/schemas.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);
router.get('/', asyncHandler(listClasses));
router.post('/', requireRole('admin'), validate(groupClassSchema), asyncHandler(createClass));
router.put('/:id', requireRole('admin'), validate(groupClassSchema), asyncHandler(updateClass));
router.delete('/:id', requireRole('admin'), asyncHandler(deleteClass));
router.post('/:id/book', requireRole('member'), asyncHandler(bookClass));
router.delete('/:id/book', requireRole('member'), asyncHandler(cancelBooking));

export default router;