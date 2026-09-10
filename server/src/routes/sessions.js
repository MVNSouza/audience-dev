import { Router } from 'express';
import { z } from 'zod';
import { createSession, getSessionByCode, verifyAdmin } from '../services/sessions.js';
import { getResults } from '../services/evaluations_pg.js';
import * as pg from '../db/postgres.js';
const r = Router();

const q = z.object({
  title: z.string().trim().min(1).max(300),
  type: z.enum(['scale', 'text']),
  scaleType: z.enum(['stars', 'number', 'tomatoes', 'gamified']).optional(),
  min: z.number().int().min(0).max(100).optional(),
  max: z.number().int().min(1).max(100).optional(),
  required: z.boolean().optional(),
  description: z.string().max(500).optional(),
});

const s = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().max(1000).optional().default(''),
  questions: z.array(q).min(1).max(30),
});

r.post('/', async (req, res) => {
  const x = s.safeParse(req.body);
  if (!x.success)
    return res.status(400).json({ message: 'Dados inválidos.', issues: x.error.issues });
  const session = await createSession(x.data);
  res.status(201).json({ session });
});

r.get('/:code', async (req, res) => {
  const s = await getSessionByCode(req.params.code);
  if (!s) return res.status(404).json({ message: 'Sessão não encontrada.' });
  res.json({ session: s });
});

r.post('/:code/close', async (req, res) => {
  const s = await verifyAdmin(req.params.code, req.body?.adminToken);
  if (!s) return res.status(403).json({ message: 'Token administrativo inválido.' });
  await pg.query("UPDATE sessions SET status='closed' WHERE id=$1", [s.id]);
  const session = await getSessionByCode(req.params.code);
  res.json({ session });
});

r.get('/:code/results', async (req, res) => {
  const s = await verifyAdmin(req.params.code, req.query.adminToken);
  if (!s) return res.status(403).json({ message: 'Token administrativo inválido.' });
  const results = await getResults(s.id);
  res.json({ results });
});

export default r;
