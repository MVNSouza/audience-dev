import crypto from 'node:crypto';
import * as pg from '../db/postgres.js';

export const hashVoterId = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');

export async function submitEvaluation(session, voterId, answers) {
  const h = hashVoterId(voterId);
  const qsRes = await pg.query('SELECT * FROM questions WHERE session_id=$1 ORDER BY id', [session.id]);
  const qs = qsRes.rows;
  try {
    await pg.transaction(async (client) => {
      const r = await client.query(
        'INSERT INTO evaluations(session_id,voter_hash,created_at) VALUES($1,$2,$3) RETURNING id',
        [session.id, h, new Date().toISOString()]
      );
      const evalId = r.rows[0].id;
      for (const q of qs) {
        const raw = answers[String(q.id)];
        if (raw === undefined || raw === null || raw === '') {
          if (q.required) throw new Error(`A pergunta "${q.title}" é obrigatória.`);
          continue;
        }
        if (q.type === 'scale') {
          const v = Number(raw);
          if (!Number.isFinite(v) || v < q.min || v > q.max) throw new Error(`Valor inválido para "${q.title}".`);
          await client.query('INSERT INTO answers(evaluation_id,question_id,numeric_value,text_value) VALUES($1,$2,$3,$4)', [evalId, q.id, v, null]);
        } else {
          const t = String(raw).trim();
          if (q.required && !t) throw new Error(`A pergunta "${q.title}" é obrigatória.`);
          await client.query('INSERT INTO answers(evaluation_id,question_id,numeric_value,text_value) VALUES($1,$2,$3,$4)', [evalId, q.id, null, t]);
        }
      }
    });
  } catch (e) {
    if (e && e.code === '23505') throw new Error('Você já enviou uma avaliação para esta sessão.');
    throw e;
  }
}

export async function getResults(sessionId) {
  const qsRes = await pg.query('SELECT id,title,type,scale_type AS "scaleType",min,max,required FROM questions WHERE session_id=$1 ORDER BY id', [sessionId]);
  const totalRes = await pg.query('SELECT COUNT(*)::int AS count FROM evaluations WHERE session_id=$1', [sessionId]);
  const totalEvaluations = totalRes.rows[0].count;
  const questions = [];
  for (const q of qsRes.rows) {
    const row = await pg.query('SELECT AVG(numeric_value) AS average, COUNT(*)::int AS total FROM answers WHERE question_id=$1 AND numeric_value IS NOT NULL', [q.id]);
    const distribution = await pg.query('SELECT numeric_value AS value, COUNT(*)::int AS count FROM answers WHERE question_id=$1 AND numeric_value IS NOT NULL GROUP BY numeric_value ORDER BY numeric_value', [q.id]);
    questions.push({
      ...q,
      average: row.rows[0].average == null ? null : Number(Number(row.rows[0].average).toFixed(2)),
      total: row.rows[0].total,
      distribution: distribution.rows,
    });
  }
  return { totalEvaluations, questions };
}
import crypto from 'node:crypto';
import * as pg from '../db/postgres.js';

export const hashVoterId = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');

export async function submitEvaluation(session, voterId, answers) {
  const h = hashVoterId(voterId);
  const qsRes = await pg.query('SELECT * FROM questions WHERE session_id=$1 ORDER BY id', [session.id]);
  const qs = qsRes.rows;
  try {
    await pg.transaction(async (client) => {
      const r = await client.query(
        'INSERT INTO evaluations(session_id,voter_hash,created_at) VALUES($1,$2,$3) RETURNING id',
        [session.id, h, new Date().toISOString()]
      );
      const evalId = r.rows[0].id;
      for (const q of qs) {
        const raw = answers[String(q.id)];
        if (raw === undefined || raw === null || raw === '') {
          if (q.required) throw new Error(`A pergunta "${q.title}" é obrigatória.`);
          continue;
        }
        if (q.type === 'scale') {
          const v = Number(raw);
          if (!Number.isFinite(v) || v < q.min || v > q.max) throw new Error(`Valor inválido para "${q.title}".`);
          await client.query('INSERT INTO answers(evaluation_id,question_id,numeric_value,text_value) VALUES($1,$2,$3,$4)', [evalId, q.id, v, null]);
        } else {
          const t = String(raw).trim();
          if (q.required && !t) throw new Error(`A pergunta "${q.title}" é obrigatória.`);
          await client.query('INSERT INTO answers(evaluation_id,question_id,numeric_value,text_value) VALUES($1,$2,$3,$4)', [evalId, q.id, null, t]);
        }
      }
    });
  } catch (e) {
    if (e && e.code === '23505') throw new Error('Você já enviou uma avaliação para esta sessão.');
    throw e;
  }
}

export async function getResults(sessionId) {
  const qsRes = await pg.query('SELECT id,title,type,scale_type AS "scaleType",min,max,required FROM questions WHERE session_id=$1 ORDER BY id', [sessionId]);
  const totalRes = await pg.query('SELECT COUNT(*)::int AS count FROM evaluations WHERE session_id=$1', [sessionId]);
  const totalEvaluations = totalRes.rows[0].count;
  const questions = [];
  for (const q of qsRes.rows) {
    const row = await pg.query('SELECT AVG(numeric_value) AS average, COUNT(*)::int AS total FROM answers WHERE question_id=$1 AND numeric_value IS NOT NULL', [q.id]);
    const distribution = await pg.query('SELECT numeric_value AS value, COUNT(*)::int AS count FROM answers WHERE question_id=$1 AND numeric_value IS NOT NULL GROUP BY numeric_value ORDER BY numeric_value', [q.id]);
    questions.push({
      ...q,
      average: row.rows[0].average == null ? null : Number(Number(row.rows[0].average).toFixed(2)),
      total: row.rows[0].total,
      distribution: distribution.rows,
    });
  }
  return { totalEvaluations, questions };
}
import crypto from 'node:crypto';
import { db } from '../db/database.js';

const USING_PG = Boolean(process.env.DATABASE_URL);

export const hashVoterId = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');

export async function submitEvaluation(session, voterId, answers) {
  const h = hashVoterId(voterId);
  if (USING_PG) {
    const pg = await import('../db/postgres.js');
    const qsRes = await pg.query('SELECT * FROM questions WHERE session_id=$1 ORDER BY id', [session.id]);
    const qs = qsRes.rows;
    try {
      await pg.transaction(async (client) => {
        const r = await client.query(
          'INSERT INTO evaluations(session_id,voter_hash,created_at) VALUES($1,$2,$3) RETURNING id',
          [session.id, h, new Date().toISOString()],
        );
        const evalId = r.rows[0].id;
        for (const q of qs) {
          const raw = answers[String(q.id)];
          if (raw === undefined || raw === null || raw === '') {
            if (q.required) throw new Error(`A pergunta "${q.title}" é obrigatória.`);
            continue;
          }
          if (q.type === 'scale') {
            const v = Number(raw);
            if (!Number.isFinite(v) || v < q.min || v > q.max) throw new Error(`Valor inválido para "${q.title}".`);
            await client.query('INSERT INTO answers(evaluation_id,question_id,numeric_value,text_value) VALUES($1,$2,$3,$4)', [evalId, q.id, v, null]);
          } else {
            const t = String(raw).trim();
            if (q.required && !t) throw new Error(`A pergunta "${q.title}" é obrigatória.`);
            await client.query('INSERT INTO answers(evaluation_id,question_id,numeric_value,text_value) VALUES($1,$2,$3,$4)', [evalId, q.id, null, t]);
          }
        }
      });
    } catch (e) {
      if (e && e.code === '23505') throw new Error('Você já enviou uma avaliação para esta sessão.');
      throw e;
    }
    return;
  }

  const qs = db.prepare('SELECT * FROM questions WHERE session_id=?').all(session.id);
  const tx = db.transaction(() => {
    const r = db.prepare('INSERT INTO evaluations(session_id,voter_hash,created_at) VALUES(?,?,?)').run(session.id, h, new Date().toISOString());
    const ia = db.prepare('INSERT INTO answers(evaluation_id,question_id,numeric_value,text_value) VALUES(?,?,?,?)');
    for (const q of qs) {
      const raw = answers[String(q.id)];
      if (raw === undefined || raw === null || raw === '') {
        if (q.required) throw new Error(`A pergunta "${q.title}" é obrigatória.`);
        continue;
      }
      if (q.type === 'scale') {
        const v = Number(raw);
        if (!Number.isFinite(v) || v < q.min || v > q.max) throw new Error(`Valor inválido para "${q.title}".`);
        ia.run(r.lastInsertRowid, q.id, v, null);
      } else {
        const t = String(raw).trim();
        if (q.required && !t) throw new Error(`A pergunta "${q.title}" é obrigatória.`);
        ia.run(r.lastInsertRowid, q.id, null, t);
      }
    }
  });
  try {
    tx();
  } catch (e) {
    if (String(e.message).includes('UNIQUE constraint failed')) throw new Error('Você já enviou uma avaliação para esta sessão.');
    throw e;
  }
}

export async function getResults(sessionId) {
  if (USING_PG) {
    const pg = await import('../db/postgres.js');
    const qsRes = await pg.query('SELECT id,title,type,scale_type AS "scaleType",min,max,required FROM questions WHERE session_id=$1 ORDER BY id', [sessionId]);
    const totalRes = await pg.query('SELECT COUNT(*)::int AS count FROM evaluations WHERE session_id=$1', [sessionId]);
    const totalEvaluations = totalRes.rows[0].count;
    const questions = [];
    for (const q of qsRes.rows) {
      const row = await pg.query('SELECT AVG(numeric_value) AS average, COUNT(*)::int AS total FROM answers WHERE question_id=$1 AND numeric_value IS NOT NULL', [q.id]);
      const distribution = await pg.query('SELECT numeric_value AS value, COUNT(*)::int AS count FROM answers WHERE question_id=$1 AND numeric_value IS NOT NULL GROUP BY numeric_value ORDER BY numeric_value', [q.id]);
      questions.push({
        ...q,
        average: row.rows[0].average == null ? null : Number(Number(row.rows[0].average).toFixed(2)),
        total: row.rows[0].total,
        distribution: distribution.rows,
      });
    }
    return { totalEvaluations, questions };
  }

  const qs = db.prepare('SELECT id,title,type,scale_type AS scaleType,min,max,required FROM questions WHERE session_id=? ORDER BY id').all(sessionId);
  const totalEvaluations = db.prepare('SELECT COUNT(*) count FROM evaluations WHERE session_id=?').get(sessionId).count;
  return {
    totalEvaluations,
    questions: qs.map((q) => {
      const row = db.prepare('SELECT AVG(numeric_value) average,COUNT(*) total FROM answers WHERE question_id=? AND numeric_value IS NOT NULL').get(q.id);
      const distribution = db
        .prepare('SELECT numeric_value value,COUNT(*) count FROM answers WHERE question_id=? AND numeric_value IS NOT NULL GROUP BY numeric_value ORDER BY numeric_value')
        .all(q.id);
      return { ...q, average: row.average == null ? null : Number(row.average.toFixed(2)), total: row.total, distribution };
    }),
  };
}
import crypto from 'node:crypto';
import { db } from '../db/database.js';

const USING_PG = Boolean(process.env.DATABASE_URL);

export const hashVoterId = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');

export async function submitEvaluation(session, voterId, answers) {
  const h = hashVoterId(voterId);
  if (USING_PG) {
    const pg = await import('../db/postgres.js');
    const qsRes = await pg.query('SELECT * FROM questions WHERE session_id=$1 ORDER BY id', [session.id]);
    const qs = qsRes.rows;
    try {
      await pg.transaction(async (client) => {
        const r = await client.query(
          'INSERT INTO evaluations(session_id,voter_hash,created_at) VALUES($1,$2,$3) RETURNING id',
          [session.id, h, new Date().toISOString()],
        );
        const evalId = r.rows[0].id;

            if (q.required) throw new Error(`A pergunta "${q.title}" é obrigatória.`);
            continue;
          }
          if (q.type === 'scale') {
            const v = Number(raw);
            if (!Number.isFinite(v) || v < q.min || v > q.max) throw new Error(`Valor inválido para "${q.title}".`);
            await client.query('INSERT INTO answers(evaluation_id,question_id,numeric_value,text_value) VALUES($1,$2,$3,$4)', [evalId, q.id, v, null]);
          } else {
            const t = String(raw).trim();
            if (q.required && !t) throw new Error(`A pergunta "${q.title}" é obrigatória.`);
            await client.query('INSERT INTO answers(evaluation_id,question_id,numeric_value,text_value) VALUES($1,$2,$3,$4)', [evalId, q.id, null, t]);
          }
        }
      });
    } catch (e) {
      if (e && e.code === '23505') throw new Error('Você já enviou uma avaliação para esta sessão.');
      throw e;
    }
    return;
  }

  const hqs = db.prepare('SELECT * FROM questions WHERE session_id=?').all(session.id);
  const tx = db.transaction(() => {
    const r = db.prepare('INSERT INTO evaluations(session_id,voter_hash,created_at) VALUES(?,?,?)').run(session.id, h, new Date().toISOString());
    const ia = db.prepare('INSERT INTO answers(evaluation_id,question_id,numeric_value,text_value) VALUES(?,?,?,?)');
    for (const q of hqs) {
      const raw = answers[String(q.id)];
      if (raw === undefined || raw === null || raw === '') {
        if (q.required) throw new Error(`A pergunta "${q.title}" é obrigatória.`);
        continue;
      }
      if (q.type === 'scale') {
        const v = Number(raw);
        if (!Number.isFinite(v) || v < q.min || v > q.max) throw new Error(`Valor inválido para "${q.title}".`);
        ia.run(r.lastInsertRowid, q.id, v, null);
      } else {
        const t = String(raw).trim();
        if (q.required && !t) throw new Error(`A pergunta "${q.title}" é obrigatória.`);
        ia.run(r.lastInsertRowid, q.id, null, t);
      }
    }
  });
  try {
    tx();
  } catch (e) {
    if (String(e.message).includes('UNIQUE constraint failed')) throw new Error('Você já enviou uma avaliação para esta sessão.');
    throw e;
  }
}

export async function getResults(sessionId) {
  if (USING_PG) {
    const pg = await import('../db/postgres.js');
    const qsRes = await pg.query('SELECT id,title,type,scale_type AS "scaleType",min,max,required FROM questions WHERE session_id=$1 ORDER BY id', [sessionId]);
    const totalRes = await pg.query('SELECT COUNT(*)::int AS count FROM evaluations WHERE session_id=$1', [sessionId]);
    const totalEvaluations = totalRes.rows[0].count;
    const questions = [];
    for (const q of qsRes.rows) {
      const row = await pg.query('SELECT AVG(numeric_value) AS average, COUNT(*)::int AS total FROM answers WHERE question_id=$1 AND numeric_value IS NOT NULL', [q.id]);
      const distribution = await pg.query('SELECT numeric_value AS value, COUNT(*)::int AS count FROM answers WHERE question_id=$1 AND numeric_value IS NOT NULL GROUP BY numeric_value ORDER BY numeric_value', [q.id]);
      questions.push({
        ...q,
        average: row.rows[0].average == null ? null : Number(Number(row.rows[0].average).toFixed(2)),
        total: row.rows[0].total,
        distribution: distribution.rows,
      });
    }
    return { totalEvaluations, questions };
  }

  const qs = db.prepare('SELECT id,title,type,scale_type AS scaleType,min,max,required FROM questions WHERE session_id=? ORDER BY id').all(sessionId);
  const totalEvaluations = db.prepare('SELECT COUNT(*) count FROM evaluations WHERE session_id=?').get(sessionId).count;
  return {
    totalEvaluations,
    questions: qs.map((q) => {
      const row = db.prepare('SELECT AVG(numeric_value) average,COUNT(*) total FROM answers WHERE question_id=? AND numeric_value IS NOT NULL').get(q.id);
      const distribution = db
        .prepare('SELECT numeric_value value,COUNT(*) count FROM answers WHERE question_id=? AND numeric_value IS NOT NULL GROUP BY numeric_value ORDER BY numeric_value')
        .all(q.id);
      return { ...q, average: row.average == null ? null : Number(row.average.toFixed(2)), total: row.total, distribution };
    }),
  };
}
export * from './evaluations_pg.js';
