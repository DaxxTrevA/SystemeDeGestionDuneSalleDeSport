import Member from '../models/Member.js';
import Subscription from '../models/Subscription.js';
import { AppError } from '../utils/AppError.js';

function endDateFor(startDate, durationMonths) {
  const endDate = new Date(startDate);
  const dayOfMonth = endDate.getDate();
  endDate.setDate(1);
  endDate.setMonth(endDate.getMonth() + durationMonths);
  const lastDayOfMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
  endDate.setDate(Math.min(dayOfMonth, lastDayOfMonth));
  return endDate;
}

export async function listSubscriptions(req, res) {
  const filter = req.user.role === 'admin' ? {} : { member: req.user.member };
  const subscriptions = await Subscription.find(filter).populate('member', 'firstName lastName email').sort({ endDate: -1 });
  res.json({ data: subscriptions });
}

export async function getSubscription(req, res) {
  const subscription = await Subscription.findById(req.params.id)
    .populate('member', 'firstName lastName email');
  if (!subscription) throw new AppError('Abonnement introuvable.', 404);
  if (req.user.role !== 'admin' && subscription.member.id !== req.user.member?.toString()) {
    throw new AppError('Accès interdit.', 403);
  }
  res.json({ data: subscription });
}

export async function createSubscription(req, res) {
  if (!await Member.exists({ _id: req.body.member })) throw new AppError('Adhérent introuvable.', 404);
  const data = {
    ...req.body,
    endDate: endDateFor(req.body.startDate, req.body.durationMonths)
  };
  const subscription = await Subscription.create(data);
  res.status(201).json({ data: subscription });
}

export async function updateSubscription(req, res) {
  const existing = await Subscription.findById(req.params.id);
  if (!existing) throw new AppError('Abonnement introuvable.', 404);
  const data = { ...req.body };
  if (data.member && !await Member.exists({ _id: data.member })) {
    throw new AppError('Adhérent introuvable.', 404);
  }
  const startDate = data.startDate || existing.startDate;
  const durationMonths = data.durationMonths || existing.durationMonths;
  data.endDate = endDateFor(startDate, durationMonths);
  Object.assign(existing, data);
  await existing.save();
  res.json({ data: existing });
}

export async function deleteSubscription(req, res) {
  const subscription = await Subscription.findByIdAndDelete(req.params.id);
  if (!subscription) throw new AppError('Abonnement introuvable.', 404);
  res.status(204).end();
}

export async function listExpiringSubscriptions(req, res) {
  const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 90);
  const now = new Date();
  const limit = new Date(now);
  limit.setDate(limit.getDate() + days);
  const data = await Subscription.find({ status: 'active', endDate: { $gte: now, $lte: limit } })
    .populate('member', 'firstName lastName email')
    .sort({ endDate: 1 });
  res.json({ data, windowDays: days });
}