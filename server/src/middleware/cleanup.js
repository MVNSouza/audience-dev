import * as pg from '../db/postgres.js';

export async function cleanupExpiredSessions() {
  const now = new Date().toISOString();
  await pg.query("UPDATE sessions SET status='closed' WHERE status='active' AND expires_at<= $1", [
    now,
  ]);
  const cutoff = new Date(Date.now() - 14 * 86400000).toISOString();
  await pg.query('DELETE FROM sessions WHERE created_at<= $1', [cutoff]);
}
