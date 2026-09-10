-- Init schema for audience app (matches server/src/db/postgres.js)

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
