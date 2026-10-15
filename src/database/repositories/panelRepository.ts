import type BetterSqlite3 from 'better-sqlite3';
import { nowUtc } from '../../utils/time';

export interface PanelRecord {
  readonly guildId: string;
  readonly panelType: string;
  readonly channelId: string;
  readonly messageId: string;
  readonly payload: string | null;
}

export class PanelRepository {
  public constructor(private readonly database: BetterSqlite3.Database) {}

  public get(guildId: string, panelType: string): PanelRecord | null {
    return (this.database.prepare('SELECT guild_id AS guildId, panel_type AS panelType, channel_id AS channelId, message_id AS messageId, payload FROM panels WHERE guild_id = ? AND panel_type = ?')
      .get(guildId, panelType) as PanelRecord | undefined) ?? null;
  }

  public upsert(panel: PanelRecord): void {
    this.database.prepare(`INSERT INTO panels(guild_id, panel_type, channel_id, message_id, payload, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(guild_id, panel_type) DO UPDATE SET channel_id = excluded.channel_id,
        message_id = excluded.message_id, payload = excluded.payload, updated_at = excluded.updated_at`)
      .run(panel.guildId, panel.panelType, panel.channelId, panel.messageId, panel.payload, nowUtc());
  }
}
