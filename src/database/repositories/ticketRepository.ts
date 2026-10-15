import type BetterSqlite3 from 'better-sqlite3';
import type { TicketKind, TicketRecord } from '../../types/domain';
import { nowUtc } from '../../utils/time';

interface TicketRow {
  id: number; publicId: string; guildId: string; requesterId: string; kind: TicketKind; categoryKey: string;
  channelId: string | null; initialMessageId: string | null; adminMessageId: string | null; state: TicketRecord['state'];
  assigneeId: string | null; openedAt: string; closedAt: string | null; closedBy: string | null;
}

function mapTicket(row: TicketRow): TicketRecord { return { ...row }; }

export class DuplicateOpenTicketError extends Error {
  public constructor() { super('DUPLICATE_OPEN_TICKET'); }
}

export class TicketRepository {
  public constructor(private readonly database: BetterSqlite3.Database) {}

  public reserve(guildId: string, requesterId: string, kind: TicketKind, categoryKey: string): TicketRecord {
    const transaction = this.database.transaction(() => {
      try {
        const result = this.database.prepare(`INSERT INTO tickets
          (public_id, guild_id, requester_id, kind, category_key, state, opened_at)
          VALUES (NULL, ?, ?, ?, ?, 'open', ?)`).run(guildId, requesterId, kind, categoryKey, nowUtc());
        const id = Number(result.lastInsertRowid);
        const publicId = `TICKET-${id.toString().padStart(4, '0')}`;
        this.database.prepare('UPDATE tickets SET public_id = ? WHERE id = ?').run(publicId, id);
        return this.requireById(id);
      } catch (error: unknown) {
        const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
        if (code === 'SQLITE_CONSTRAINT_UNIQUE') throw new DuplicateOpenTicketError();
        throw error;
      }
    });
    return transaction();
  }

  public releaseReservation(ticketId: number): void {
    this.database.prepare("DELETE FROM tickets WHERE id = ? AND channel_id IS NULL AND state = 'open'").run(ticketId);
  }

  public bindChannel(ticketId: number, channelId: string, initialMessageId: string): TicketRecord {
    this.database.prepare('UPDATE tickets SET channel_id = ?, initial_message_id = ? WHERE id = ?').run(channelId, initialMessageId, ticketId);
    return this.requireById(ticketId);
  }

  public setAdminMessage(ticketId: number, messageId: string): void {
    this.database.prepare('UPDATE tickets SET admin_message_id = ? WHERE id = ?').run(messageId, ticketId);
  }

  public byId(id: number): TicketRecord | null {
    const row = this.database.prepare(`SELECT id, public_id AS publicId, guild_id AS guildId, requester_id AS requesterId,
      kind, category_key AS categoryKey, channel_id AS channelId, initial_message_id AS initialMessageId,
      admin_message_id AS adminMessageId, state, assignee_id AS assigneeId, opened_at AS openedAt,
      closed_at AS closedAt, closed_by AS closedBy FROM tickets WHERE id = ?`).get(id) as TicketRow | undefined;
    return row ? mapTicket(row) : null;
  }

  public byChannel(channelId: string): TicketRecord | null {
    const row = this.database.prepare(`SELECT id, public_id AS publicId, guild_id AS guildId, requester_id AS requesterId,
      kind, category_key AS categoryKey, channel_id AS channelId, initial_message_id AS initialMessageId,
      admin_message_id AS adminMessageId, state, assignee_id AS assigneeId, opened_at AS openedAt,
      closed_at AS closedAt, closed_by AS closedBy FROM tickets WHERE channel_id = ?`).get(channelId) as TicketRow | undefined;
    return row ? mapTicket(row) : null;
  }

  public claim(ticketId: number, assigneeId: string, assignedBy: string | null, type: 'auto' | 'manual' | 'reassigned'): boolean {
    const transaction = this.database.transaction(() => {
      const update = this.database.prepare(`UPDATE tickets SET assignee_id = ?, state = 'assigned'
        WHERE id = ? AND state IN ('open', 'assigned') AND assignee_id IS NULL`).run(assigneeId, ticketId);
      if (update.changes !== 1) return false;
      this.database.prepare(`INSERT INTO ticket_assignments(ticket_id, assignee_id, assigned_by, assignment_type, assigned_at)
        VALUES (?, ?, ?, ?, ?)`).run(ticketId, assigneeId, assignedBy, type, nowUtc());
      return true;
    });
    return transaction();
  }

  public reassign(ticketId: number, assigneeId: string, assignedBy: string): boolean {
    const transaction = this.database.transaction(() => {
      const update = this.database.prepare("UPDATE tickets SET assignee_id = ?, state = 'assigned' WHERE id = ? AND state IN ('open', 'assigned')")
        .run(assigneeId, ticketId);
      if (update.changes !== 1) return false;
      this.database.prepare(`INSERT INTO ticket_assignments(ticket_id, assignee_id, assigned_by, assignment_type, assigned_at)
        VALUES (?, ?, ?, 'reassigned', ?)`).run(ticketId, assigneeId, assignedBy, nowUtc());
      return true;
    });
    return transaction();
  }

  public close(ticketId: number, closedBy: string): boolean {
    const result = this.database.prepare("UPDATE tickets SET state = 'closed', closed_at = ?, closed_by = ? WHERE id = ? AND state <> 'closed'")
      .run(nowUtc(), closedBy, ticketId);
    return result.changes === 1;
  }

  public interruptedReservations(guildId: string): readonly TicketRecord[] {
    const rows = this.database.prepare(`SELECT id, public_id AS publicId, guild_id AS guildId, requester_id AS requesterId,
      kind, category_key AS categoryKey, channel_id AS channelId, initial_message_id AS initialMessageId,
      admin_message_id AS adminMessageId, state, assignee_id AS assigneeId, opened_at AS openedAt,
      closed_at AS closedAt, closed_by AS closedBy FROM tickets WHERE guild_id = ? AND channel_id IS NULL AND state = 'open'`).all(guildId) as TicketRow[];
    return rows.map(mapTicket);
  }

  private requireById(id: number): TicketRecord {
    const ticket = this.byId(id);
    if (!ticket) throw new Error(`Ticket ${id} não encontrado após escrita.`);
    return ticket;
  }
}
