import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import sessions from './routes/sessions.js';
import evaluations from './routes/evaluations.js';
import { cleanupExpiredSessions } from './middleware/cleanup.js';
import './db/postgres.js';
import { ready as dbReady } from './db/postgres.js';

const app = express(),
  port = Number(process.env.PORT ?? 3333),
  origin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
app.use(cors({ origin }));
app.use(express.json({ limit: '100kb' }));
app.get('/api/health', (_q, res) =>
  res.json({ ok: true, service: 'audience-api', now: new Date().toISOString() })
);
app.use('/api/sessions', sessions);
app.use('/api/sessions', evaluations);
app.use((_q, res) => res.status(404).json({ message: 'Rota não encontrada.' }));
app.use((e, _q, res, _n) => {
  console.error(e);
  res.status(500).json({ message: 'Erro interno do servidor.' });
});

// wait for DB initialization (with retries) before running cleanup and starting listen
await dbReady;
cleanupExpiredSessions();
setInterval(cleanupExpiredSessions, 3600000);
app.listen(port, () => console.log(`Audience API: http://localhost:${port}`));
