import { nanoid } from 'nanoid';
import crypto from 'node:crypto';
import * as pg from '../db/postgres.js';

export async function createSession({ title, description, questions }) {
  const id = nanoid(12),
    accessCode = nanoid(6).toUpperCase(),
    adminToken = crypto.randomBytes(24).toString('hex'),
    createdAt = new Date(),
    expiresAt = new Date(createdAt.getTime() + 7 * 86400000);
  await pg.transaction(async (client) => {
    await client.query(
      'INSERT INTO sessions(id,title,description,access_code,admin_token,status,expires_at,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
      [
        id,
        title,
        description ?? '',
        accessCode,
        adminToken,
        'active',
        expiresAt.toISOString(),
        createdAt.toISOString(),
      ]
    );
    for (const q of questions) {
      await client.query(
        'INSERT INTO questions(session_id,title,type,scale_type,min,max,required,description) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
        [
          id,
          q.title,
          q.type,
          q.scaleType ?? null,
          q.min ?? null,
          q.max ?? null,
          q.required === false ? false : true,
          q.description ?? null,
        ]
      );
    }
  });
  return await getSessionByCode(accessCode, true);
}

export async function expireIfNeeded(s) {
  if (s.status === 'active' && new Date(s.expires_at) <= new Date()) {
    await pg.query("UPDATE sessions SET status='closed' WHERE id=$1", [s.id]);
    s.status = 'closed';
  }
  return s;
}

export async function getSessionByCode(code, secret = false) {
  const r = await pg.query('SELECT * FROM sessions WHERE access_code=$1', [code.toUpperCase()]);
  const s = r.rows[0];
  if (!s) return null;
  await expireIfNeeded(s);
  const qs = await pg.query(
    'SELECT id,title,type,scale_type AS "scaleType",min,max,required,description FROM questions WHERE session_id=$1 ORDER BY id',
    [s.id]
  );
  const questions = qs.rows.map((q) => ({ ...q, required: Boolean(q.required) }));
  const out = {
    id: s.id,
    title: s.title,
    description: s.description,
    accessCode: s.access_code,
    status: s.status,
    expiresAt: s.expires_at,
    createdAt: s.created_at,
    questions,
  };
  if (secret) out.adminToken = s.admin_token;
  return out;
}

export async function verifyAdmin(code, token) {
  const r = await pg.query('SELECT * FROM sessions WHERE access_code=$1 AND admin_token=$2', [
    code.toUpperCase(),
    token,
  ]);
  const s = r.rows[0];
  return s ? await expireIfNeeded(s) : null;
}
