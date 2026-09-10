import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const file = path.resolve(process.env.DATABASE_FILE ?? "./data/audience.db");
fs.mkdirSync(path.dirname(file), { recursive: true });
export const db = new Database(file);

db.pragma("journal_mode=WAL");
db.pragma("foreign_keys=ON");
db.exec(
    `CREATE TABLE IF NOT EXISTS sessions(
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  access_code TEXT NOT NULL UNIQUE,
  admin_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL);
  
  CREATE TABLE IF NOT EXISTS questions(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,type TEXT NOT NULL,
  scale_type TEXT,
  min INTEGER,
  max INTEGER,
  required INTEGER NOT NULL DEFAULT 1,
  description TEXT);
  
  CREATE TABLE IF NOT EXISTS evaluations(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  voter_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(session_id,voter_hash));
  
  CREATE TABLE IF NOT EXISTS answers(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  evaluation_id INTEGER NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  numeric_value REAL,text_value TEXT);
  
  CREATE INDEX IF NOT EXISTS idx_sessions_code ON sessions(access_code);
  CREATE INDEX IF NOT EXISTS idx_evaluations_session ON evaluations(session_id);`,
);
