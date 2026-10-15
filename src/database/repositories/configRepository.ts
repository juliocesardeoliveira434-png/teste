import type BetterSqlite3 from 'better-sqlite3';
import type { ConfigKey } from '../../types/domain';
import { nowUtc } from '../../utils/time';

interface ConfigRow { value: string; }

export class ConfigRepository {
  public constructor(private readonly database: BetterSqlite3.Database) {}

  public get(guildId: string, key: ConfigKey): string | null {
    const row = this.database.prepare('SELECT value FROM server_config WHERE guild_id = ? AND key = ?')
      .get(guildId, key) as ConfigRow | undefined;
    return row?.value ?? null;
  }

  public set(guildId: string, key: ConfigKey, value: string): void {
    this.database.prepare(`INSERT INTO server_config(guild_id, key, value, updated_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(guild_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`)
      .run(guildId, key, value, nowUtc());
  }

  public all(guildId: string): ReadonlyMap<ConfigKey, string> {
    const rows = this.database.prepare('SELECT key, value FROM server_config WHERE guild_id = ?').all(guildId) as Array<{ key: ConfigKey; value: string }>;
    return new Map(rows.map((row) => [row.key, row.value]));
  }

  public getNumber(guildId: string, key: ConfigKey, fallback: number): number {
    const stored = this.get(guildId, key);
    if (stored === null) return fallback;
    const value = Number(stored);
    return Number.isFinite(value) ? value : fallback;
  }

  public getStringArray(guildId: string, key: ConfigKey): readonly string[] {
    const stored = this.get(guildId, key);
    if (!stored) return [];
    try {
      const parsed: unknown = JSON.parse(stored);
      return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string') ? parsed : [];
    } catch { return []; }
  }
}
