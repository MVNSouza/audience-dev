import { Router } from 'express';
import { z } from 'zod';
import { getSessionByCode } from '../services/sessions.js';
import { submitEvaluation } from '../services/evaluations_pg.js';
const r = Router();
const s = z.object({
  voterId: z.string().uuid(),
  answers: z.record(z.string(), z.union([z.number(), z.string()])),
});
r.post('/:code/evaluations', async (req, res) => {
  const x = s.safeParse(req.body);
  if (!x.success) return res.status(400).json({ message: 'Dados de avaliação inválidos.' });
  const session = await getSessionByCode(req.params.code);
  if (!session) return res.status(404).json({ message: 'Sessão não encontrada.' });
  if (session.status !== 'active')
    return res.status(409).json({ message: 'Esta sessão está encerrada.' });
  try {
    await submitEvaluation(session, x.data.voterId, x.data.answers);
    res.status(201).json({ message: 'Avaliação registrada.' });
  } catch (e) {
    res.status(409).json({
      message: e instanceof Error ? e.message : 'Não foi possível registrar a avaliação.',
    });
  }
});
export default r;
