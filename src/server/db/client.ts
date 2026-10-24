import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import fs from 'fs';
import path from 'path';
import * as schema from './schema';

const dbPath = process.env.DATABASE_URL || './data/careerchecks.sqlite';

// Ensure the directory for the database file exists
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

export function createSqliteConnection(targetPath: string = dbPath) {
  const sqlite = new Database(targetPath);
  
  // Enforce mandatory PRAGMAs per database rules
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('busy_timeout = 5000');

  return sqlite;
}

// Global cached connection for Next.js hot reload in development
const globalForDb = globalThis as unknown as {
  sqlite: Database.Database | undefined;
};

export const sqlite = globalForDb.sqlite ?? createSqliteConnection();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.sqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
