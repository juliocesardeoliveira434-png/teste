import type BetterSqlite3 from 'better-sqlite3';
import { nowUtc } from '../../utils/time';
import type { ApplicationState } from '../../types/domain';

export interface RecruitmentApplication {
  readonly id: number;
  readonly ticketId: number;
  readonly guildId: string;
  readonly applicantId: string;
  readonly identification: string;
  readonly experience: string;
  readonly motivation: string;
  readonly availability: string;
  readonly portfolioUrl: string | null;
  readonly state: ApplicationState;
  readonly reviewedBy: string | null;
  readonly reviewedAt: string | null;
  readonly rejectionReason: string | null;
  readonly createdAt: string;
}

export interface RecruitmentInput {
  readonly identification: string;
  readonly experience: string;
  readonly motivation: string;
  readonly availability: string;
  readonly portfolioUrl: string | null;
}

export class RecruitmentRepository {
  public constructor(private readonly database: BetterSqlite3.Database) {}

  public create(ticketId: number, guildId: string, applicantId: string, input: RecruitmentInput): RecruitmentApplication {
    const result = this.database.prepare(`INSERT INTO recruitment_applications
      (ticket_id, guild_id, applicant_id, identification, experience, motivation, availability, portfolio_url, state, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`).run(ticketId, guildId, applicantId, input.identification, input.experience, input.motivation, input.availability, input.portfolioUrl, nowUtc());
    return this.require(Number(result.lastInsertRowid));
  }

  public byTicket(ticketId: number): RecruitmentApplication | null {
    const row = this.database.prepare(`SELECT id, ticket_id AS ticketId, guild_id AS guildId, applicant_id AS applicantId,
      identification, experience, motivation, availability, portfolio_url AS portfolioUrl, state,
      reviewed_by AS reviewedBy, reviewed_at AS reviewedAt, rejection_reason AS rejectionReason, created_at AS createdAt
      FROM recruitment_applications WHERE ticket_id = ?`).get(ticketId) as RecruitmentApplication | undefined;
    return row ?? null;
  }

  public startReview(ticketId: number): boolean {
    return this.database.prepare("UPDATE recruitment_applications SET state = 'processing' WHERE ticket_id = ? AND state = 'pending'").run(ticketId).changes === 1;
  }

  public complete(ticketId: number, state: Extract<ApplicationState, 'approved' | 'rejected' | 'failed'>, reviewerId: string, reason: string | null = null): boolean {
    return this.database.prepare(`UPDATE recruitment_applications SET state = ?, reviewed_by = ?, reviewed_at = ?, rejection_reason = ?
      WHERE ticket_id = ? AND state = 'processing'`).run(state, reviewerId, nowUtc(), reason, ticketId).changes === 1;
  }

  public processing(guildId: string): readonly RecruitmentApplication[] {
    return this.database.prepare(`SELECT id, ticket_id AS ticketId, guild_id AS guildId, applicant_id AS applicantId,
      identification, experience, motivation, availability, portfolio_url AS portfolioUrl, state,
      reviewed_by AS reviewedBy, reviewed_at AS reviewedAt, rejection_reason AS rejectionReason, created_at AS createdAt
      FROM recruitment_applications WHERE guild_id = ? AND state = 'processing'`).all(guildId) as RecruitmentApplication[];
  }

  private require(id: number): RecruitmentApplication {
    const item = this.database.prepare(`SELECT id, ticket_id AS ticketId, guild_id AS guildId, applicant_id AS applicantId,
      identification, experience, motivation, availability, portfolio_url AS portfolioUrl, state,
      reviewed_by AS reviewedBy, reviewed_at AS reviewedAt, rejection_reason AS rejectionReason, created_at AS createdAt
      FROM recruitment_applications WHERE id = ?`).get(id) as RecruitmentApplication | undefined;
    if (!item) throw new Error('Inscrição não encontrada após criação.');
    return item;
  }
}
