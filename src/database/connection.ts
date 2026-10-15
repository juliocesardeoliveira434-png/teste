import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import BetterSqlite3 from 'better-sqlite3';
import { applyMigrations } from './schema';

export function openDatabase(filePath: string): BetterSqlite3.Database {
  mkdirSync(dirname(filePath), { recursive: true });
  const database = new BetterSqlite3(filePath);
  database.pragma('journal_mode = WAL');
  database.pragma('foreign_keys = ON');
  database.pragma('busy_timeout = 5000');
  applyMigrations(database);
  return database;
}
