import {
  ChannelType,
  PermissionFlagsBits,
  type Guild,
  type GuildMember,
  type TextChannel,
  type User
} from 'discord.js';
import type { Logger } from 'pino';
import { COPY } from '../config/messages';
import type { ConfigRepository } from '../database/repositories/configRepository';
import type { AdminLogRepository } from '../database/repositories/adminLogRepository';
import { DuplicateOpenTicketError, type TicketRepository } from '../database/repositories/ticketRepository';
import { infoEmbed, successEmbed } from '../embeds/factory';
import type { TicketRecord } from '../types/domain';
import { NO_MENTIONS } from '../utils/discord';
import { ticketAdminRows, ticketEmbed, ticketRows } from './ticketPresentation';

export class TicketService {
  private readonly guildLocks = new Map<string, Promise<void>>();

  public constructor(
    private readonly config: ConfigRepository,
    private readonly tickets: TicketRepository,
    private readonly logs: AdminLogRepository,
    private readonly logger: Logger
  ) {}

  public async openSupportTicket(guild: Guild, requester: User, categoryKey = 'suporte'): Promise<TicketRecord> {
    const categoryId = this.config.get(guild.id, 'support_category_id');
    const adminChannelId = this.config.get(guild.id, 'tickets_admin_channel_id');
    if (!categoryId || !adminChannelId) throw new Error('Configure a categoria de suporte e o canal administrativo de tickets antes de abrir atendimentos.');
    const bot = guild.members.me;
    if (!bot?.permissions.has(PermissionFlagsBits.ManageChannels)) throw new Error(COPY.missingPermission('Gerenciar Canais'));
    let ticket: TicketRecord;
    try { ticket = this.tickets.reserve(guild.id, requester.id, 'support', categoryKey); }
    catch (error: unknown) { if (error instanceof DuplicateOpenTicketError) throw error; throw error; }
    let channel: TextChannel | null = null;
    try {
      const staffIds = this.config.getStringArray(guild.id, 'staff_role_ids');
      channel = await guild.channels.create({
        name: `ticket-${ticket.id.toString().padStart(4, '0')}`,
        type: ChannelType.GuildText,
        parent: categoryId,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: requester.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
          { id: bot.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] },
          ...staffIds.map((id) => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }))
        ]
      });
      const initial = await channel.send({ embeds: [ticketEmbed(ticket)], components: ticketRows(ticket), allowedMentions: { users: [requester.id], parse: [] } });
      ticket = this.tickets.bindChannel(ticket.id, channel.id, initial.id);
      await this.createAdminPanel(guild, ticket, adminChannelId);
      this.logs.record(guild.id, requester.id, 'ticket_opened', 'ticket', String(ticket.id), { kind: 'support', categoryKey });
      return ticket;
    } catch (error: unknown) {
      if (channel) await channel.delete('Falha de criação do ticket').catch((deleteError: unknown) => this.logger.error({ err: deleteError }, 'Não foi possível limpar canal de ticket incompleto'));
      this.tickets.releaseReservation(ticket.id);
      throw error;
    }
  }

  public async autoAssign(guild: Guild, ticketId: number): Promise<{ readonly ticket: TicketRecord; readonly assignee: GuildMember | null }> {
    return this.withGuildLock(guild.id, async () => {
      const ticket = this.requireOpenTicket(ticketId, guild.id);
      if (ticket.assigneeId) return { ticket, assignee: null };
      const candidates = await this.eligibleStaff(guild, ticket.requesterId);
      if (candidates.length === 0) return { ticket, assignee: null };
      const assignee = candidates[Math.floor(Math.random() * candidates.length)];
      if (!assignee || !this.tickets.claim(ticket.id, assignee.id, null, 'auto')) return { ticket: this.requireTicket(ticketId), assignee: null };
      const updated = this.requireTicket(ticketId);
      await this.grantAndRefresh(guild, updated);
      await assignee.send({ embeds: [infoEmbed('Novo ticket atribuído', `Você foi selecionado para atender **#${updated.publicId}**.`)], allowedMentions: NO_MENTIONS })
        .catch((error: unknown) => this.logger.info({ err: error, userId: assignee.id }, 'DM de atribuição não entregue'));
      this.logs.record(guild.id, null, 'ticket_auto_assigned', 'ticket', String(ticketId), { assigneeId: assignee.id });
      return { ticket: updated, assignee };
    });
  }

  public async take(guild: Guild, ticketId: number, member: GuildMember): Promise<TicketRecord | null> {
    return this.withGuildLock(guild.id, async () => {
      this.requireOpenTicket(ticketId, guild.id);
      if (!this.tickets.claim(ticketId, member.id, member.id, 'manual')) return null;
      const updated = this.requireTicket(ticketId);
      await this.grantAndRefresh(guild, updated);
      this.logs.record(guild.id, member.id, 'ticket_claimed', 'ticket', String(ticketId), {});
      return updated;
    });
  }

  public async reassign(guild: Guild, ticketId: number, newAssignee: GuildMember, actorId: string): Promise<TicketRecord | null> {
    return this.withGuildLock(guild.id, async () => {
      const ticket = this.requireOpenTicket(ticketId, guild.id);
      if (!this.tickets.reassign(ticket.id, newAssignee.id, actorId)) return null;
      const updated = this.requireTicket(ticketId);
      await this.grantAndRefresh(guild, updated);
      this.logs.record(guild.id, actorId, 'ticket_reassigned', 'ticket', String(ticketId), { assigneeId: newAssignee.id });
      return updated;
    });
  }

  public async close(guild: Guild, ticketId: number, actorId: string): Promise<{ readonly ticket: TicketRecord; readonly changed: boolean }> {
    const ticket = this.requireTicket(ticketId);
    if (ticket.guildId !== guild.id) throw new Error('Ticket não pertence a este servidor.');
    const changed = this.tickets.close(ticketId, actorId);
    const updated = this.requireTicket(ticketId);
    if (changed) {
      await this.refreshMessages(guild, updated);
      await this.logClosure(guild, updated);
      this.logs.record(guild.id, actorId, 'ticket_closed', 'ticket', String(ticketId), {});
    }
    return { ticket: updated, changed };
  }

  public async eligibleStaff(guild: Guild, requesterId: string): Promise<GuildMember[]> {
    const roleIds = this.config.getStringArray(guild.id, 'staff_role_ids');
    if (roleIds.length === 0) return [];
    const members = await guild.members.fetch();
    return [...members.values()].filter((member) => !member.user.bot && member.id !== requesterId && roleIds.some((roleId) => member.roles.cache.has(roleId)));
  }

  private async createAdminPanel(guild: Guild, ticket: TicketRecord, channelId: string): Promise<void> {
    const channel = await guild.channels.fetch(channelId);
    if (!channel || !channel.isTextBased() || !('send' in channel)) throw new Error('O canal administrativo de tickets não está disponível.');
    const message = await (channel as TextChannel).send({
      embeds: [ticketEmbed(ticket).setDescription(`Solicitante: <@${ticket.requesterId}>\nCanal: <#${ticket.channelId}>`)],
      components: ticketAdminRows(ticket), allowedMentions: { users: [ticket.requesterId], parse: [] }
    });
    this.tickets.setAdminMessage(ticket.id, message.id);
  }

  private async grantAndRefresh(guild: Guild, ticket: TicketRecord): Promise<void> {
    if (!ticket.assigneeId || !ticket.channelId) return;
    const channel = await guild.channels.fetch(ticket.channelId);
    if (channel?.isTextBased() && 'permissionOverwrites' in channel) {
      await channel.permissionOverwrites.edit(ticket.assigneeId, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
    }
    await this.refreshMessages(guild, ticket);
  }

  private async refreshMessages(guild: Guild, ticket: TicketRecord): Promise<void> {
    await Promise.allSettled([
      this.editTicketMessage(guild, ticket),
      this.editAdminMessage(guild, ticket)
    ]);
  }

  private async editTicketMessage(guild: Guild, ticket: TicketRecord): Promise<void> {
    if (!ticket.channelId || !ticket.initialMessageId) return;
    const channel = await guild.channels.fetch(ticket.channelId);
    if (!channel?.isTextBased() || !('messages' in channel)) return;
    const message = await (channel as TextChannel).messages.fetch(ticket.initialMessageId);
    await message.edit({ embeds: [ticketEmbed(ticket)], components: ticketRows(ticket), allowedMentions: NO_MENTIONS });
  }

  private async editAdminMessage(guild: Guild, ticket: TicketRecord): Promise<void> {
    const adminId = this.config.get(guild.id, 'tickets_admin_channel_id');
    if (!adminId || !ticket.adminMessageId) return;
    const channel = await guild.channels.fetch(adminId);
    if (!channel?.isTextBased() || !('messages' in channel)) return;
    const message = await (channel as TextChannel).messages.fetch(ticket.adminMessageId);
    await message.edit({ embeds: [ticketEmbed(ticket).setDescription(`Solicitante: <@${ticket.requesterId}>\nCanal: <#${ticket.channelId}>`)], components: ticketAdminRows(ticket), allowedMentions: NO_MENTIONS });
  }

  private async logClosure(guild: Guild, ticket: TicketRecord): Promise<void> {
    const channelId = this.config.get(guild.id, 'logs_channel_id');
    if (!channelId) return;
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (channel?.isTextBased() && 'send' in channel) await (channel as TextChannel).send({ embeds: [successEmbed('Ticket encerrado', `**#${ticket.publicId}** foi encerrado por <@${ticket.closedBy ?? '0'}>.`)], allowedMentions: NO_MENTIONS });
  }

  private requireTicket(id: number): TicketRecord {
    const ticket = this.tickets.byId(id);
    if (!ticket) throw new Error('Ticket não encontrado.');
    return ticket;
  }

  private requireOpenTicket(id: number, guildId: string): TicketRecord {
    const ticket = this.requireTicket(id);
    if (ticket.guildId !== guildId || ticket.state === 'closed') throw new Error('Este ticket não está disponível para essa ação.');
    return ticket;
  }

  private async withGuildLock<T>(guildId: string, operation: () => Promise<T>): Promise<T> {
    const predecessor = this.guildLocks.get(guildId) ?? Promise.resolve();
    let release: (() => void) | undefined;
    const completion = new Promise<void>((resolve) => { release = resolve; });
    const queueTail = predecessor.then(() => completion);
    this.guildLocks.set(guildId, queueTail);
    await predecessor;
    try { return await operation(); }
    finally {
      release?.();
      if (this.guildLocks.get(guildId) === queueTail) this.guildLocks.delete(guildId);
    }
  }
}
