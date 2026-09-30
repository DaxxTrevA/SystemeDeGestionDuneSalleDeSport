import Subscription from '../models/Subscription.js';

export async function runSubscriptionAlerts() {
  const now = new Date();
  await Subscription.updateMany(
    { status: 'active', endDate: { $lte: now } },
    { $set: { status: 'expired' } }
  );

  const limit = new Date(now);
  limit.setDate(limit.getDate() + 7);
  const expiring = await Subscription.find({ status: 'active', endDate: { $gt: now, $lte: limit } })
    .populate('member', 'firstName lastName email')
    .select('endDate member');

  for (const subscription of expiring) {
    console.info(`Abonnement bientôt expiré: ${subscription.member?.email} (${subscription.endDate.toLocaleDateString('fr-FR')})`);
  }
}