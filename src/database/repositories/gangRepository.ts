import type BetterSqlite3 from 'better-sqlite3';
import { nowUtc } from '../../utils/time';
import type { ApplicationState } from '../../types/domain';

export interface GangRequest {
  readonly id: number; readonly publicId: string; readonly guildId: string; readonly requesterId: string;
  readonly inviteUrl: string; readonly gangName: string; readonly roleName: string; readonly imageUrl: string | null;
  readonly memberCount: number; readonly state: ApplicationState; readonly adminMessageId: string | null;
}
export interface Gang {
  readonly id: number; readonly guildId: string; readonly name: string; readonly roleId: string | null;
  readonly inviteUrl: string; readonly imageUrl: string | null; readonly memberCount: number; readonly createdAt: string;
}
export interface GangRemovalRequest { readonly id: number; readonly guildId: string; readonly gangId: number; readonly requesterId: string; readonly reason: string; readonly state: ApplicationState; readonly adminMessageId: string | null; }

export class GangRepository {
  public constructor(private readonly database: BetterSqlite3.Database) {}

  public createRequest(guildId: string, requesterId: string, input: Omit<GangRequest, 'id' | 'publicId' | 'guildId' | 'requesterId' | 'state' | 'adminMessageId'>): GangRequest {
    const transaction = this.database.transaction(() => {
      const output = this.database.prepare(`INSERT INTO gang_requests(public_id, guild_id, requester_id, invite_url, gang_name, role_name, image_url, member_count, state, created_at)
        VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`).run(guildId, requesterId, input.inviteUrl, input.gangName, input.roleName, input.imageUrl, input.memberCount, nowUtc());
      const id = Number(output.lastInsertRowid); const publicId = `REQ-${id.toString().padStart(4, '0')}`;
      this.database.prepare('UPDATE gang_requests SET public_id = ? WHERE id = ?').run(publicId, id);
      return this.requireRequest(id);
    });
    return transaction();
  }

  public request(id: number): GangRequest | null { return this.readRequest(id); }
  public setRequestAdminMessage(id: number, messageId: string): void { this.database.prepare('UPDATE gang_requests SET admin_message_id = ? WHERE id = ?').run(messageId, id); }
  public startRequest(id: number): boolean { return this.database.prepare("UPDATE gang_requests SET state = 'processing' WHERE id = ? AND state = 'pending'").run(id).changes === 1; }
  public completeRequest(id: number, state: Extract<ApplicationState, 'approved' | 'rejected' | 'failed'>, userId: string, reason: string | null = null): boolean { return this.database.prepare(`UPDATE gang_requests SET state = ?, processed_by = ?, processed_at = ?, failure_reason = ? WHERE id = ? AND state = 'processing'`).run(state, userId, nowUtc(), reason, id).changes === 1; }

  public nameExists(guildId: string, name: string): boolean { return Boolean(this.database.prepare('SELECT 1 FROM gangs WHERE guild_id = ? AND name = ? COLLATE NOCASE').get(guildId, name)); }
  public createGang(request: GangRequest, roleId: string): Gang {
    const result = this.database.prepare(`INSERT INTO gangs(guild_id, name, role_id, invite_url, image_url, member_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(request.guildId, request.gangName, roleId, request.inviteUrl, request.imageUrl, request.memberCount, nowUtc());
    return this.requireGang(Number(result.lastInsertRowid));
  }
  public listGangs(guildId: string): readonly Gang[] { return this.database.prepare('SELECT id, guild_id AS guildId, name, role_id AS roleId, invite_url AS inviteUrl, image_url AS imageUrl, member_count AS memberCount, created_at AS createdAt FROM gangs WHERE guild_id = ? ORDER BY name COLLATE NOCASE LIMIT 25').all(guildId) as Gang[]; }
  public gang(id: number): Gang | null { return (this.database.prepare('SELECT id, guild_id AS guildId, name, role_id AS roleId, invite_url AS inviteUrl, image_url AS imageUrl, member_count AS memberCount, created_at AS createdAt FROM gangs WHERE id = ?').get(id) as Gang | undefined) ?? null; }

  public createRemoval(guildId: string, gangId: number, requesterId: string, reason: string): GangRemovalRequest {
    const output = this.database.prepare(`INSERT INTO gang_removal_requests(guild_id, gang_id, requester_id, reason, state, created_at) VALUES (?, ?, ?, ?, 'pending', ?)`).run(guildId, gangId, requesterId, reason, nowUtc());
    return this.requireRemoval(Number(output.lastInsertRowid));
  }
  public removal(id: number): GangRemovalRequest | null { return (this.database.prepare('SELECT id, guild_id AS guildId, gang_id AS gangId, requester_id AS requesterId, reason, state, admin_message_id AS adminMessageId FROM gang_removal_requests WHERE id = ?').get(id) as GangRemovalRequest | undefined) ?? null; }
  public setRemovalAdminMessage(id: number, messageId: string): void { this.database.prepare('UPDATE gang_removal_requests SET admin_message_id = ? WHERE id = ?').run(messageId, id); }
  public startRemoval(id: number): boolean { return this.database.prepare("UPDATE gang_removal_requests SET state = 'processing' WHERE id = ? AND state = 'pending'").run(id).changes === 1; }
  public completeRemoval(id: number, state: Extract<ApplicationState, 'approved' | 'rejected' | 'failed'>, userId: string): boolean { return this.database.prepare(`UPDATE gang_removal_requests SET state = ?, processed_by = ?, processed_at = ? WHERE id = ? AND state = 'processing'`).run(state, userId, nowUtc(), id).changes === 1; }
  public deleteGang(id: number): boolean { return this.database.prepare('DELETE FROM gangs WHERE id = ?').run(id).changes === 1; }

  private readRequest(id: number): GangRequest | null { return (this.database.prepare('SELECT id, public_id AS publicId, guild_id AS guildId, requester_id AS requesterId, invite_url AS inviteUrl, gang_name AS gangName, role_name AS roleName, image_url AS imageUrl, member_count AS memberCount, state, admin_message_id AS adminMessageId FROM gang_requests WHERE id = ?').get(id) as GangRequest | undefined) ?? null; }
  private requireRequest(id: number): GangRequest { const request = this.readRequest(id); if (!request) throw new Error('Solicitação de gangue não encontrada.'); return request; }
  private requireGang(id: number): Gang { const gang = this.gang(id); if (!gang) throw new Error('Gangue não encontrada após criação.'); return gang; }
  private requireRemoval(id: number): GangRemovalRequest { const request = this.removal(id); if (!request) throw new Error('Solicitação de remoção não encontrada.'); return request; }
}
