import type BetterSqlite3 from 'better-sqlite3';
import { up as initial } from './migrations/001_initial';

interface Migration {
  readonly version: number;
  readonly name: string;
  readonly up: (database: BetterSqlite3.Database) => void;
}

const migrations: readonly Migration[] = [{ version: 1, name: 'initial', up: initial }];

export function applyMigrations(database: BetterSqlite3.Database): void {
  database.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL
  )`);
  const completed = new Set(
    (database.prepare('SELECT version FROM schema_migrations').all() as Array<{ version: number }>).map((row) => row.version)
  );
  const run = database.transaction(() => {
    for (const migration of migrations) {
      if (completed.has(migration.version)) continue;
      migration.up(database);
      database.prepare('INSERT INTO schema_migrations(version, name, applied_at) VALUES (?, ?, ?)')
        .run(migration.version, migration.name, new Date().toISOString());
    }
  });
  run();
}
