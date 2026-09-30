import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Member from '../models/Member.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';

function createToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });
}

function userResponse(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    memberId: user.member?.toString() || null
  };
}

export async function register(req, res) {
  const { name, firstName, lastName, email, password, phone, dateOfBirth } = req.body;
  if (await User.exists({ email })) throw new AppError('Cette adresse e-mail est déjà utilisée.', 409);

  const member = await Member.create({ firstName, lastName, email, phone, dateOfBirth });
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, member: member.id });
    res.status(201).json({ token: createToken(user), user: userResponse(user) });
  } catch (error) {
    await Member.findByIdAndDelete(member.id);
    throw error;
  }
}

export async function login(req, res) {
  const user = await User.findOne({ email: req.body.email }).select('+passwordHash');
  const valid = user && await bcrypt.compare(req.body.password, user.passwordHash);
  if (!valid) throw new AppError('E-mail ou mot de passe incorrect.', 401);
  res.json({ token: createToken(user), user: userResponse(user) });
}

export function currentUser(req, res) {
  res.json({ user: userResponse(req.user) });
}