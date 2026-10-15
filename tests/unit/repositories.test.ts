import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase } from '../../src/database/connection';
import { PublicationRepository } from '../../src/database/repositories/publicationRepository';
import { DuplicateOpenTicketError, TicketRepository } from '../../src/database/repositories/ticketRepository';

const directories: string[] = [];
function database() {
  const directory = mkdtempSync(join(tmpdir(), 'gangue-jornal-')); directories.push(directory);
  return openDatabase(join(directory, 'bot.sqlite'));
}
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }); });

describe('persistência de pontuação', () => {
  it('finaliza uma publicação e impede pontuação duplicada', () => {
    const db = database(); const repo = new PublicationRepository(db);
    const draft = repo.createDraft({ guildId: 'g', authorId: 'u1', headlineUrl: 'https://a.test', gangOne: 'A', score: '3 × 1', gangTwo: 'B', imageUrl: null, points: 1 });
    expect(draft.publicId).toBe('PUB-0001');
    expect(repo.finalizeDraft(draft.id, 'c', 'm', 1, 'u1')).toBe(true);
    expect(repo.finalizeDraft(draft.id, 'c', 'm', 1, 'u1')).toBe(false);
    expect(repo.leaderboard('g', 10)).toEqual([{ userId: 'u1', points: 1, publications: 1, firstReachedAt: expect.any(String) }]);
  });
  it('ordena empates pelo timestamp e, se idêntico, pelo usuário de forma determinística', () => {
    const db = database(); const repo = new PublicationRepository(db); const timestamp = '2026-01-01T00:00:00.000Z';
    db.prepare(`INSERT INTO score_events(guild_id, user_id, points, event_type, created_at) VALUES
      ('g', 'u2', 2, 'adjustment', ?), ('g', 'u1', 2, 'adjustment', ?)` ).run(timestamp, timestamp);
    expect(repo.leaderboard('g', 10).map((entry) => entry.userId)).toEqual(['u1', 'u2']);
  });
});

describe('máquina de estados de ticket', () => {
  it('impede duplicata aberta, atribui uma vez e fecha de forma idempotente', () => {
    const db = database(); const repo = new TicketRepository(db);
    const ticket = repo.reserve('g', 'u', 'support', 'suporte');
    expect(() => repo.reserve('g', 'u', 'support', 'suporte')).toThrow(DuplicateOpenTicketError);
    expect(repo.claim(ticket.id, 'staff1', null, 'auto')).toBe(true);
    expect(repo.claim(ticket.id, 'staff2', null, 'auto')).toBe(false);
    expect(repo.close(ticket.id, 'staff1')).toBe(true);
    expect(repo.close(ticket.id, 'staff1')).toBe(false);
    expect(repo.byId(ticket.id)?.state).toBe('closed');
  });
});
