import type BetterSqlite3 from 'better-sqlite3';
import { nowUtc } from '../../utils/time';

export class AdminLogRepository {
  public constructor(private readonly database: BetterSqlite3.Database) {}

  public record(guildId: string, actorId: string | null, action: string, entityType: string, entityId: string | null, details: Record<string, unknown>): void {
    this.database.prepare(`INSERT INTO admin_logs(guild_id, actor_id, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(guildId, actorId, action, entityType, entityId, JSON.stringify(details), nowUtc());
  }
}
