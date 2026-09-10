import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set for postgres adapter');

export const pool = new Pool({ connectionString });

export async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

export async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function initSchema() {
  await pool.query(`
  CREATE TABLE IF NOT EXISTS sessions(
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    access_code TEXT NOT NULL UNIQUE,
    admin_token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
  );

  CREATE TABLE IF NOT EXISTS questions(
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    scale_type TEXT,
    min INTEGER,
    max INTEGER,
    required BOOLEAN NOT NULL DEFAULT true,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS evaluations(
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    voter_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    UNIQUE(session_id, voter_hash)
  );

  CREATE TABLE IF NOT EXISTS answers(
    id SERIAL PRIMARY KEY,
    evaluation_id INTEGER NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    numeric_value REAL,
    text_value TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_code ON sessions(access_code);
  CREATE INDEX IF NOT EXISTS idx_evaluations_session ON evaluations(session_id);
  `);
}

// initialize schema on import with retries; don't crash the process on first failure
async function initWithRetry(attempts = 5, delayMs = 1000) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await initSchema();
      console.log('Postgres schema initialized');
      return;
    } catch (e) {
      console.error(`Attempt ${i} to initialize Postgres schema failed:`, e.message || e);
      if (i === attempts) {
        console.error(
          'All attempts to initialize Postgres schema failed — continuing without schema initialization.'
        );
        return;
      }
      await new Promise((r) => setTimeout(r, delayMs * i));
    }
  }
}

export const ready = initWithRetry();

ready.catch((e) => {
  console.error('Unexpected error during Postgres init retry', e);
});
