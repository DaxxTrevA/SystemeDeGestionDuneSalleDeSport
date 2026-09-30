import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null;
    if (!token) throw new AppError('Authentification requise.', 401);

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('name email role member');
    if (!user) throw new AppError('Compte introuvable.', 401);
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(new AppError('Jeton invalide ou expiré.', 401));
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return next(new AppError('Accès interdit.', 403));
    next();
  };
}