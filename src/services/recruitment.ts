import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, type EmbedBuilder, PermissionFlagsBits,
  type Guild, type GuildMember, type TextChannel, type User
} from 'discord.js';
import type { Logger } from 'pino';
import type { ConfigRepository } from '../database/repositories/configRepository';
import type { AdminLogRepository } from '../database/repositories/adminLogRepository';
import { DuplicateOpenTicketError, type TicketRepository } from '../database/repositories/ticketRepository';
import type { RecruitmentInput, RecruitmentRepository } from '../database/repositories/recruitmentRepository';
import { infoEmbed } from '../embeds/factory';
import type { TicketRecord } from '../types/domain';
import { customId } from '../utils/customId';
import { NO_MENTIONS } from '../utils/discord';
import { ticketEmbed, ticketRows } from './ticketPresentation';

export class RecruitmentService {
  public constructor(
    private readonly config: ConfigRepository,
    private readonly tickets: TicketRepository,
    private readonly applications: RecruitmentRepository,
    private readonly logs: AdminLogRepository,
    private readonly logger: Logger
  ) {}

  public async open(guild: Guild, user: User, input: RecruitmentInput): Promise<TicketRecord> {
    const categoryId = this.config.get(guild.id, 'recruitment_category_id');
    const adminId = this.config.get(guild.id, 'recruitment_admin_channel_id') ?? this.config.get(guild.id, 'tickets_admin_channel_id');
    const bot = guild.members.me;
    if (!categoryId || !adminId) throw new Error('Configure a categoria de recrutamento e um canal administrativo antes de receber inscrições.');
    if (!bot?.permissions.has(PermissionFlagsBits.ManageChannels)) throw new Error('O bot precisa de Gerenciar Canais para abrir inscrições privadas.');
    let ticket: TicketRecord;
    try { ticket = this.tickets.reserve(guild.id, user.id, 'recruitment', 'recrutamento'); }
    catch (error: unknown) { if (error instanceof DuplicateOpenTicketError) throw error; throw error; }
    let channel: TextChannel | null = null;
    try {
      const staff = this.config.getStringArray(guild.id, 'staff_role_ids');
      channel = await guild.channels.create({
        name: `recrutamento-${ticket.id.toString().padStart(4, '0')}`, type: ChannelType.GuildText, parent: categoryId,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
          { id: bot.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
          ...staff.map((id) => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }))
        ]
      });
      const initial = await channel.send({ embeds: [this.applicationEmbed(ticket, input)], components: ticketRows(ticket), allowedMentions: { users: [user.id], parse: [] } });
      ticket = this.tickets.bindChannel(ticket.id, channel.id, initial.id);
      this.applications.create(ticket.id, guild.id, user.id, input);
      const admin = await guild.channels.fetch(adminId);
      if (!admin?.isTextBased() || !('send' in admin)) throw new Error('Canal administrativo de inscrições não está disponível.');
      const panel = await (admin as TextChannel).send({ embeds: [this.applicationEmbed(ticket, input).setDescription(`Candidato: <@${user.id}>\nCanal: <#${channel.id}>`)], components: this.reviewRows(ticket.id), allowedMentions: { users: [user.id], parse: [] } });
      this.tickets.setAdminMessage(ticket.id, panel.id);
      this.logs.record(guild.id, user.id, 'recruitment_created', 'ticket', String(ticket.id), {});
      return ticket;
    } catch (error: unknown) {
      if (channel) await channel.delete('Falha na inscrição').catch((deleteError: unknown) => this.logger.error({ err: deleteError }, 'Não foi possível limpar inscrição incompleta'));
      this.tickets.releaseReservation(ticket.id);
      throw error;
    }
  }

  public async approve(guild: Guild, ticketId: number, reviewer: GuildMember): Promise<string> {
    const application = this.requireApplication(ticketId, guild.id);
    if (application.applicantId === reviewer.id) throw new Error('Autoaprovação é proibida. Outro administrador deve avaliar esta inscrição.');
    if (!this.applications.startReview(ticketId)) throw new Error('Esta inscrição já foi avaliada ou está sendo processada.');
    try {
      const roleId = this.config.get(guild.id, 'journalist_role_id');
      const role = roleId ? await guild.roles.fetch(roleId) : null;
      const applicant = await guild.members.fetch(application.applicantId);
      if (!role) throw new Error('Cargo de jornalista não configurado ou removido.');
      if (!role.editable) throw new Error('O cargo de jornalista está acima do bot ou não pode ser gerenciado.');
      await applicant.roles.add(role, `Inscrição ${ticketId} aprovada por ${reviewer.user.tag}`);
      if (!this.applications.complete(ticketId, 'approved', reviewer.id)) throw new Error('Cargo concedido, mas o banco não confirmou a aprovação. Verifique a inscrição em processamento.');
      await this.refreshReview(guild, ticketId);
      this.logs.record(guild.id, reviewer.id, 'recruitment_approved', 'ticket', String(ticketId), { applicantId: application.applicantId });
      return application.applicantId;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Falha desconhecida';
      this.applications.complete(ticketId, 'failed', reviewer.id, message);
      await this.refreshReview(guild, ticketId).catch(() => undefined);
      throw error;
    }
  }

  public async reject(guild: Guild, ticketId: number, reviewer: GuildMember, reason: string): Promise<void> {
    const application = this.requireApplication(ticketId, guild.id);
    if (application.applicantId === reviewer.id) throw new Error('Autorecusa não é permitida; outro administrador deve avaliar.');
    if (!this.applications.startReview(ticketId) || !this.applications.complete(ticketId, 'rejected', reviewer.id, reason)) throw new Error('Esta inscrição já foi avaliada ou está sendo processada.');
    await this.refreshReview(guild, ticketId);
    this.logs.record(guild.id, reviewer.id, 'recruitment_rejected', 'ticket', String(ticketId), { reason });
  }

  private applicationEmbed(ticket: TicketRecord, input: RecruitmentInput): EmbedBuilder {
    return ticketEmbed(ticket).setTitle(`#${ticket.publicId} · INSCRIÇÃO PENDENTE`).addFields(
      { name: 'Identificação', value: input.identification }, { name: 'Experiência', value: input.experience },
      { name: 'Motivo', value: input.motivation }, { name: 'Disponibilidade', value: input.availability },
      { name: 'Portfólio', value: input.portfolioUrl ?? 'Não informado' }
    );
  }

  private reviewRows(ticketId: number): ActionRowBuilder<ButtonBuilder>[] {
    return [new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(customId('recruitment', 'approve', String(ticketId))).setLabel('Aprovar').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(customId('recruitment', 'reject', String(ticketId))).setLabel('Recusar').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(customId('ticket', 'close', String(ticketId))).setLabel('Encerrar inscrição').setStyle(ButtonStyle.Secondary)
    )];
  }

  private async refreshReview(guild: Guild, ticketId: number): Promise<void> {
    const ticket = this.tickets.byId(ticketId);
    const app = this.applications.byTicket(ticketId);
    const channelId = this.config.get(guild.id, 'recruitment_admin_channel_id') ?? this.config.get(guild.id, 'tickets_admin_channel_id');
    if (!ticket || !app || !ticket.adminMessageId || !channelId) return;
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel?.isTextBased() || !('messages' in channel)) return;
    const message = await (channel as TextChannel).messages.fetch(ticket.adminMessageId);
    const embed = infoEmbed(`Inscrição #${ticket.publicId}`, `Estado: **${app.state.toUpperCase()}**\nCandidato: <@${app.applicantId}>`)
      .addFields({ name: 'Identificação', value: app.identification }, { name: 'Experiência', value: app.experience }, { name: 'Motivo', value: app.motivation }, { name: 'Disponibilidade', value: app.availability }, { name: 'Portfólio', value: app.portfolioUrl ?? 'Não informado' });
    await message.edit({ embeds: [embed], components: app.state === 'pending' ? this.reviewRows(ticketId) : [], allowedMentions: NO_MENTIONS });
  }

  private requireApplication(ticketId: number, guildId: string) {
    const application = this.applications.byTicket(ticketId);
    if (!application || application.guildId !== guildId) throw new Error('Inscrição não encontrada.');
    return application;
  }
}
