import GroupClass from '../models/GroupClass.js';
import Subscription from '../models/Subscription.js';
import { AppError } from '../utils/AppError.js';

export async function listClasses(req, res) {
  const classes = await GroupClass.find({ startsAt: { $gte: new Date() } }).sort({ startsAt: 1 });
  const data = classes.map((groupClass) => ({
    id: groupClass.id,
    title: groupClass.title,
    coach: groupClass.coach,
    startsAt: groupClass.startsAt,
    durationMinutes: groupClass.durationMinutes,
    capacity: groupClass.capacity,
    registeredCount: groupClass.attendees.length,
    isBooked: Boolean(req.user.member && groupClass.attendees.some((member) => member.equals(req.user.member)))
  }));
  res.json({ data });
}

export async function createClass(req, res) {
  if (req.body.startsAt <= new Date()) throw new AppError('Le cours doit être planifié dans le futur.', 400);
  const data = await GroupClass.create(req.body);
  res.status(201).json({ data });
}

export async function updateClass(req, res) {
  const groupClass = await GroupClass.findById(req.params.id);
  if (!groupClass) throw new AppError('Cours introuvable.', 404);
  if (req.body.startsAt <= new Date()) throw new AppError('Le cours doit être planifié dans le futur.', 400);
  if (req.body.capacity !== undefined && req.body.capacity < groupClass.attendees.length) {
    throw new AppError('La capacité ne peut pas être inférieure au nombre d’inscrits.', 409);
  }
  Object.assign(groupClass, req.body);
  await groupClass.save();
  res.json({ data: groupClass });
}

export async function deleteClass(req, res) {
  const groupClass = await GroupClass.findByIdAndDelete(req.params.id);
  if (!groupClass) throw new AppError('Cours introuvable.', 404);
  res.status(204).end();
}

export async function bookClass(req, res) {
  if (!req.user.member) throw new AppError('Aucun profil adhérent associé au compte.', 409);
  const now = new Date();
  const hasActiveSubscription = await Subscription.exists({
    member: req.user.member,
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gt: now }
  });
  if (!hasActiveSubscription) throw new AppError('Un abonnement actif est requis pour réserver un cours.', 403);

  const groupClass = await GroupClass.findOneAndUpdate({
    _id: req.params.id,
    startsAt: { $gt: now },
    attendees: { $ne: req.user.member },
    $expr: { $lt: [{ $size: '$attendees' }, '$capacity'] }
  }, { $addToSet: { attendees: req.user.member } }, { new: true });

  if (!groupClass) {
    const existing = await GroupClass.findById(req.params.id);
    if (!existing) throw new AppError('Cours introuvable.', 404);
    if (existing.startsAt <= now) throw new AppError('Ce cours a déjà commencé.', 409);
    if (existing.attendees.some((id) => id.equals(req.user.member))) {
      throw new AppError('Vous êtes déjà inscrit à ce cours.', 409);
    }
    throw new AppError('Ce cours est complet.', 409);
  }
  res.status(201).json({ data: groupClass });
}

export async function cancelBooking(req, res) {
  if (!req.user.member) throw new AppError('Aucun profil adhérent associé au compte.', 409);
  const groupClass = await GroupClass.findOneAndUpdate({
    _id: req.params.id,
    attendees: req.user.member
  }, { $pull: { attendees: req.user.member } }, { new: true });
  if (!groupClass) throw new AppError('Inscription introuvable.', 404);
  res.json({ data: groupClass });
}