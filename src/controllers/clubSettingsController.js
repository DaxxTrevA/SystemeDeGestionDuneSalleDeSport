import ClubSettings from '../models/ClubSettings.js';

export async function getClubSettings(req, res) {
  const settings = await ClubSettings.findOneAndUpdate(
    { key: 'main' },
    { $setOnInsert: { key: 'main' } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json({ data: {
    courseTypes: settings.courseTypes,
    coaches: settings.coaches,
    monthlyPriceAr: settings.monthlyPriceAr || 22000
  } });
}

export async function getSubscriptionOffer(req, res) {
  const settings = await ClubSettings.findOneAndUpdate(
    { key: 'main' },
    { $setOnInsert: { key: 'main' } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json({ data: { monthlyPriceAr: settings.monthlyPriceAr || 22000 } });
}

export async function updateClubSettings(req, res) {
  const settings = await ClubSettings.findOneAndUpdate(
    { key: 'main' },
    { $set: req.body },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.json({ data: {
    courseTypes: settings.courseTypes,
    coaches: settings.coaches,
    monthlyPriceAr: settings.monthlyPriceAr
  } });
}