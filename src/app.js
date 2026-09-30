import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import authRoutes from './routes/authRoutes.js';
import classRoutes from './routes/classRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import { errorHandler, notFound } from './utils/errors.js';

const app = express();
const publicDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' }));
app.use(express.json({ limit: '20kb' }));
app.use(express.static(publicDirectory));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/classes', classRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;