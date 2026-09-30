import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { currentUser, login, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../validators/schemas.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: 'Trop de tentatives. Réessayez dans quelques minutes.' } }
});

router.post('/register', authLimiter, validate(registerSchema), asyncHandler(register));
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(login));
router.get('/me', requireAuth, asyncHandler(currentUser));

export default router;