import type BetterSqlite3 from 'better-sqlite3';
import { nowUtc } from '../../utils/time';

export interface ReactionRoleRule {
  readonly id: number; readonly guildId: string; readonly channelId: string; readonly messageId: string; readonly emoji: string; readonly roleId: string; readonly temporary: boolean; readonly active: boolean;
}

export class ReactionRoleRepository {
  public constructor(private readonly database: BetterSqlite3.Database) {}
  public replaceJournalistRule(guildId: string, channelId: string, messageId: string, emoji: string, roleId: string, temporary: boolean): void {
    const transaction = this.database.transaction(() => {
      this.database.prepare('UPDATE reaction_roles SET active = 0 WHERE guild_id = ? AND role_id = ?').run(guildId, roleId);
      this.database.prepare(`INSERT INTO reaction_roles(guild_id, channel_id, message_id, emoji, role_id, temporary, active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)`)
        .run(guildId, channelId, messageId, emoji, roleId, temporary ? 1 : 0, nowUtc());
    }); transaction();
  }
  public find(guildId: string, messageId: string, emoji: string): ReactionRoleRule | null {
    const row = this.database.prepare(`SELECT id, guild_id AS guildId, channel_id AS channelId, message_id AS messageId, emoji, role_id AS roleId, temporary, active FROM reaction_roles WHERE guild_id = ? AND message_id = ? AND emoji = ? AND active = 1`).get(guildId, messageId, emoji) as Omit<ReactionRoleRule, 'temporary' | 'active'> & { temporary: number; active: number } | undefined;
    return row ? { ...row, temporary: row.temporary === 1, active: row.active === 1 } : null;
  }
}
