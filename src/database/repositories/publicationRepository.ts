import type BetterSqlite3 from 'better-sqlite3';
import type { LeaderboardEntry, PublicationInput } from '../../types/domain';
import { nowUtc } from '../../utils/time';

export interface PublicationDraft { readonly id: number; readonly publicId: string; }

export class PublicationRepository {
  public constructor(private readonly database: BetterSqlite3.Database) {}

  /** Keeps the unpublished draft recoverable if Discord fails between ID allocation and delivery. */
  public createDraft(input: PublicationInput): PublicationDraft {
    const transaction = this.database.transaction(() => {
      const inserted = this.database.prepare(`INSERT INTO publications
        (public_id, guild_id, author_id, headline_url, gang_one, score, gang_two, image_url, created_at)
        VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        input.guildId, input.authorId, input.headlineUrl, input.gangOne, input.score, input.gangTwo, input.imageUrl, nowUtc()
      );
      const id = Number(inserted.lastInsertRowid);
      const publicId = `PUB-${id.toString().padStart(4, '0')}`;
      this.database.prepare('UPDATE publications SET public_id = ? WHERE id = ?').run(publicId, id);
      return { id, publicId };
    });
    return transaction();
  }

  /** The score event has a unique publication_id and remains idempotent even after a retry/restart. */
  public finalizeDraft(draftId: number, channelId: string, messageId: string, points: number, authorId: string): boolean {
    const transaction = this.database.transaction(() => {
      const draft = this.database.prepare("UPDATE publications SET status = 'published', channel_id = ?, message_id = ? WHERE id = ? AND status = 'pending'")
        .run(channelId, messageId, draftId);
      if (draft.changes !== 1) return false;
      const input = this.database.prepare('SELECT guild_id AS guildId, author_id AS authorId FROM publications WHERE id = ?').get(draftId) as { guildId: string; authorId: string } | undefined;
      if (!input) throw new Error(`Publicação ${draftId} desapareceu durante finalização.`);
      this.database.prepare(`INSERT INTO score_events
        (guild_id, publication_id, user_id, points, event_type, reason, created_by, created_at)
        VALUES (?, ?, ?, ?, 'publication', NULL, ?, ?)
        ON CONFLICT(publication_id) DO NOTHING`).run(input.guildId, draftId, input.authorId, points, authorId, nowUtc());
      return true;
    });
    return transaction();
  }

  public failDraft(draftId: number, reason: string): void {
    this.database.prepare("UPDATE publications SET status = 'failed', failure_reason = ? WHERE id = ? AND status = 'pending'").run(reason.slice(0, 400), draftId);
  }

  public addAdjustment(guildId: string, userId: string, points: number, reason: string, actorId: string): void {
    this.database.prepare(`INSERT INTO score_events
      (guild_id, publication_id, user_id, points, event_type, reason, created_by, created_at)
      VALUES (?, NULL, ?, ?, 'adjustment', ?, ?, ?)`).run(guildId, userId, points, reason, actorId, nowUtc());
  }

  public leaderboard(guildId: string, limit: number): readonly LeaderboardEntry[] {
    const rows = this.database.prepare(`
      SELECT se.user_id AS userId,
        COALESCE(SUM(se.points), 0) AS points,
        COUNT(p.id) AS publications,
        COALESCE(MIN(p.created_at), MIN(se.created_at)) AS firstReachedAt
      FROM score_events se
      LEFT JOIN publications p ON p.id = se.publication_id
      WHERE se.guild_id = ?
      GROUP BY se.user_id
      ORDER BY points DESC, publications DESC, firstReachedAt ASC, se.user_id ASC
      LIMIT ?`).all(guildId, limit) as Array<LeaderboardEntry>;
    return rows.map((row) => ({ ...row, points: Number(row.points), publications: Number(row.publications) }));
  }
}
