import bcrypt from 'bcryptjs';
import Member from '../models/Member.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import GroupClass from '../models/GroupClass.js';
import { AppError } from '../utils/AppError.js';

export async function listMembers(req, res) {
  const members = await Member.find().sort({ lastName: 1, firstName: 1 });
  res.json({ data: members });
}

export async function createMember(req, res) {
  if (await User.exists({ email: req.body.email })) {
    throw new AppError('Cette adresse e-mail est déjà utilisée par un compte.', 409);
  }
  const member = await Member.create(req.body);
  res.status(201).json({ data: member });
}

export async function getMember(req, res) {
  const member = await Member.findById(req.params.id);
  if (!member) throw new AppError('Adhérent introuvable.', 404);
  res.json({ data: member });
}

export async function updateMember(req, res) {
  const member = await Member.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true
  });
  if (!member) throw new AppError('Adhérent introuvable.', 404);

  const linkedUser = await User.findOne({ member: member.id });
  if (linkedUser) {
    linkedUser.name = `${member.firstName} ${member.lastName}`;
    linkedUser.email = member.email;
    await linkedUser.save();
  }
  res.json({ data: member });
}

export async function deleteMember(req, res) {
  const admin = await User.findById(req.user.id).select('+passwordHash');
  if (!admin || !await bcrypt.compare(req.body.adminPassword, admin.passwordHash)) {
    throw new AppError('Le mot de passe administrateur est incorrect.', 401);
  }
  const member = await Member.findByIdAndDelete(req.params.id);
  if (!member) throw new AppError('Adhérent introuvable.', 404);
  await Promise.all([
    Subscription.deleteMany({ member: member.id }),
    User.deleteMany({ member: member.id }),
    GroupClass.updateMany({}, { $pull: { attendees: member.id } })
  ]);
  res.status(204).end();
}