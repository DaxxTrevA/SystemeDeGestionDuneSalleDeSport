import bcrypt from 'bcryptjs';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';

function publicAdmin(user) {
  return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
}

export async function listAdmins(req, res) {
  const admins = await User.find({ role: 'admin' }).select('name email createdAt').sort({ name: 1 });
  res.json({ data: admins.map(publicAdmin) });
}

export async function createAdmin(req, res) {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) {
    throw new AppError('Cette adresse e-mail est déjà utilisée.', 409);
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await User.create({ name, email, passwordHash, role: 'admin' });
  res.status(201).json({ data: publicAdmin(admin) });
}

export async function updateAdminCredentials(req, res) {
  const admin = await User.findById(req.user.id).select('+passwordHash');
  if (!admin) throw new AppError('Compte introuvable.', 404);

  if (!await bcrypt.compare(req.body.currentPassword, admin.passwordHash)) {
    throw new AppError('Le mot de passe actuel est incorrect.', 401);
  }
  if (req.body.email && req.body.email !== admin.email && await User.exists({
    email: req.body.email,
    _id: { $ne: admin.id }
  })) {
    throw new AppError('Cette adresse e-mail est déjà utilisée.', 409);
  }
  if (req.body.email) admin.email = req.body.email;
  if (req.body.newPassword) admin.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  await admin.save();
  res.json({ data: publicAdmin(admin) });
}

export async function listAdminNotifications(req, res) {
  const data = await Subscription.find({ status: 'pending' })
    .populate('member', 'firstName lastName email')
    .sort({ createdAt: 1 });
  res.json({ data, unreadCount: data.length });
}