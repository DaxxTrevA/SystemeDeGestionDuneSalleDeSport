import 'dotenv/config';
import bcrypt from 'bcryptjs';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import User from './models/User.js';
import { runSubscriptionAlerts } from './services/subscriptionAlerts.js';

async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  if (!email || !process.env.ADMIN_PASSWORD) throw new Error('ADMIN_EMAIL et ADMIN_PASSWORD doivent être configurés.');
  if (await User.exists({ email })) return;
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
  await User.create({
    name: process.env.ADMIN_NAME || 'Administrateur',
    email,
    passwordHash,
    role: 'admin'
  });
  console.log(`Compte administrateur créé: ${email}`);
}

async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET doit contenir au moins 32 caractères.');
  }
  await connectDatabase(process.env.MONGODB_URI || 'mongodb://localhost:27017/fitclub');
  await ensureAdmin();
  await runSubscriptionAlerts();
  setInterval(() => runSubscriptionAlerts().catch(console.error), 24 * 60 * 60 * 1000).unref();

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log(`FitClub disponible sur http://localhost:${port}`));
}

start().catch((error) => {
  console.error('Échec du démarrage:', error.message);
  process.exit(1);
});