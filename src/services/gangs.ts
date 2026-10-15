import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type EmbedBuilder, type Guild, type GuildMember, type TextChannel } from 'discord.js';
import type { Logger } from 'pino';
import type { AdminLogRepository } from '../database/repositories/adminLogRepository';
import type { ConfigRepository } from '../database/repositories/configRepository';
import type { Gang, GangRemovalRequest, GangRepository, GangRequest } from '../database/repositories/gangRepository';
import { infoEmbed, successEmbed } from '../embeds/factory';
import { customId } from '../utils/customId';
import { NO_MENTIONS } from '../utils/discord';

export class GangService {
  public constructor(private readonly config: ConfigRepository, private readonly gangs: GangRepository, private readonly logs: AdminLogRepository, private readonly logger: Logger) {}

  public async submit(guild: Guild, requester: GuildMember, input: Omit<GangRequest, 'id' | 'publicId' | 'guildId' | 'requesterId' | 'state' | 'adminMessageId'>): Promise<GangRequest> {
    const adminId = this.config.get(guild.id, 'gangs_admin_channel_id');
    if (!adminId) throw new Error('Canal administrativo de gangues não configurado.');
    if (this.gangs.nameExists(guild.id, input.gangName)) throw new Error('Já existe uma gangue cadastrada com esse nome.');
    const request = this.gangs.createRequest(guild.id, requester.id, input);
    try {
      const channel = await guild.channels.fetch(adminId);
      if (!channel?.isTextBased() || !('send' in channel)) throw new Error('Canal administrativo de gangues não está disponível.');
      const message = await (channel as TextChannel).send({ embeds: [this.requestEmbed(request)], components: this.requestRows(request.id), allowedMentions: { users: [requester.id], parse: [] } });
      this.gangs.setRequestAdminMessage(request.id, message.id);
      this.logs.record(guild.id, requester.id, 'gang_requested', 'gang_request', String(request.id), { name: input.gangName });
      return request;
    } catch (error: unknown) {
      this.gangs.startRequest(request.id);
      this.gangs.completeRequest(request.id, 'failed', requester.id, error instanceof Error ? error.message : 'Falha ao publicar análise');
      throw error;
    }
  }

  public async approve(guild: Guild, requestId: number, reviewer: GuildMember): Promise<Gang> {
    const request = this.requireRequest(requestId, guild.id);
    if (!this.gangs.startRequest(request.id)) throw new Error('Esta solicitação já está sendo processada ou foi decidida.');
    let roleId: string | null = null;
    try {
      if (this.gangs.nameExists(guild.id, request.gangName)) throw new Error('Já existe uma gangue registrada com esse nome.');
      const bot = guild.members.me;
      if (!bot?.permissions.has('ManageRoles')) throw new Error('O bot precisa de Gerenciar Cargos para aprovar gangues.');
      const role = await guild.roles.create({ name: request.roleName, reason: `Gangue aprovada: ${request.publicId}` });
      roleId = role.id;
      if (!role.editable) throw new Error('O cargo recém-criado não pode ser gerenciado por causa da hierarquia.');
      const requester = await guild.members.fetch(request.requesterId);
      await requester.roles.add(role, `Gangue aprovada: ${request.publicId}`);
      const gang = this.gangs.createGang(request, role.id);
      if (!this.gangs.completeRequest(request.id, 'approved', reviewer.id)) throw new Error('A gangue foi criada, mas a confirmação final do banco falhou; revise o estado processing.');
      await this.refreshRequestPanel(guild, request.id);
      await this.publishPublic(guild, gang);
      this.logs.record(guild.id, reviewer.id, 'gang_approved', 'gang', String(gang.id), { requestId: request.id, roleId: role.id });
      return gang;
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : 'Erro desconhecido';
      this.gangs.completeRequest(request.id, 'failed', reviewer.id, `${reason}${roleId ? ` Cargo criado: ${roleId}; revisar manualmente.` : ''}`);
      await this.refreshRequestPanel(guild, request.id).catch((refreshError: unknown) => this.logger.warn({ err: refreshError }, 'Não foi possível atualizar análise de gangue'));
      throw error;
    }
  }

  public async reject(guild: Guild, requestId: number, reviewer: GuildMember): Promise<void> {
    const request = this.requireRequest(requestId, guild.id);
    if (!this.gangs.startRequest(request.id) || !this.gangs.completeRequest(request.id, 'rejected', reviewer.id)) throw new Error('Esta solicitação já foi processada.');
    await this.refreshRequestPanel(guild, request.id);
    this.logs.record(guild.id, reviewer.id, 'gang_rejected', 'gang_request', String(request.id), {});
  }

  public async requestRemoval(guild: Guild, requester: GuildMember, gangId: number, reason: string): Promise<GangRemovalRequest> {
    const gang = this.gangs.gang(gangId);
    const adminId = this.config.get(guild.id, 'gangs_admin_channel_id');
    if (!gang || gang.guildId !== guild.id || !adminId) throw new Error('Gangue ou canal administrativo indisponível.');
    const request = this.gangs.createRemoval(guild.id, gang.id, requester.id, reason);
    const channel = await guild.channels.fetch(adminId);
    if (!channel?.isTextBased() || !('send' in channel)) throw new Error('Canal administrativo de gangues não está disponível.');
    const message = await (channel as TextChannel).send({ embeds: [infoEmbed(`Remoção de gangue #${request.id}`, `Gangue: **${gang.name}**\nSolicitante: <@${request.requesterId}>\nMotivo: ${request.reason}\n\nO registro será removido. Por padrão, o cargo é preservado; excluir cargo é uma ação distinta.`)], components: this.removalRows(request.id), allowedMentions: { users: [requester.id], parse: [] } });
    this.gangs.setRemovalAdminMessage(request.id, message.id);
    return request;
  }

  public async approveRemoval(guild: Guild, removalId: number, reviewer: GuildMember): Promise<void> {
    const request = this.gangs.removal(removalId);
    if (!request || request.guildId !== guild.id || !this.gangs.startRemoval(removalId)) throw new Error('Solicitação de remoção indisponível.');
    try {
      if (!this.gangs.deleteGang(request.gangId)) throw new Error('Registro da gangue já foi removido.');
      if (!this.gangs.completeRemoval(removalId, 'approved', reviewer.id)) throw new Error('A remoção foi aplicada, mas o banco não confirmou seu estado.');
      await this.refreshRemovalPanel(guild, removalId);
      this.logs.record(guild.id, reviewer.id, 'gang_removal_approved', 'gang', String(request.gangId), {});
    } catch (error: unknown) {
      this.gangs.completeRemoval(removalId, 'failed', reviewer.id);
      await this.refreshRemovalPanel(guild, removalId).catch(() => undefined);
      throw error;
    }
  }

  public async rejectRemoval(guild: Guild, removalId: number, reviewer: GuildMember): Promise<void> {
    const request = this.gangs.removal(removalId);
    if (!request || request.guildId !== guild.id || !this.gangs.startRemoval(removalId) || !this.gangs.completeRemoval(removalId, 'rejected', reviewer.id)) throw new Error('Solicitação de remoção indisponível.');
    await this.refreshRemovalPanel(guild, removalId);
  }

  private requestEmbed(request: GangRequest): EmbedBuilder {
    const embed = infoEmbed(`Análise de gangue #${request.publicId}`, `Solicitante: <@${request.requesterId}>\nEstado: **${request.state.toUpperCase()}**`)
      .addFields({ name: 'Nome', value: request.gangName, inline: true }, { name: 'Cargo', value: request.roleName, inline: true }, { name: 'Membros', value: String(request.memberCount), inline: true }, { name: 'Convite', value: request.inviteUrl }, { name: 'Imagem', value: request.imageUrl ?? 'Não informada' });
    if (request.imageUrl) embed.setThumbnail(request.imageUrl);
    return embed;
  }
  private requestRows(id: number): ActionRowBuilder<ButtonBuilder>[] { return [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId(customId('gang', 'approve', String(id))).setLabel('Aprovar').setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId(customId('gang', 'reject', String(id))).setLabel('Recusar').setStyle(ButtonStyle.Danger))]; }
  private removalRows(id: number): ActionRowBuilder<ButtonBuilder>[] { return [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId(customId('gang', 'remove-approve', String(id))).setLabel('Aprovar remoção').setStyle(ButtonStyle.Danger), new ButtonBuilder().setCustomId(customId('gang', 'remove-reject', String(id))).setLabel('Recusar').setStyle(ButtonStyle.Secondary))]; }

  private async publishPublic(guild: Guild, gang: Gang): Promise<void> {
    const channelId = this.config.get(guild.id, 'gangs_public_channel_id');
    if (!channelId) throw new Error('Canal público de gangues não configurado.');
    const channel = await guild.channels.fetch(channelId);
    if (!channel?.isTextBased() || !('send' in channel)) throw new Error('Canal público de gangues indisponível.');
    const embed = successEmbed(`Gangue aprovada · ${gang.name}`, `Cargo: <@&${gang.roleId ?? '0'}>\nMembros declarados: **${gang.memberCount}**\n\nO bot valida apenas o formato do convite; a equipe deve verificar a validade e permanência antes da aprovação.`);
    if (gang.imageUrl) embed.setImage(gang.imageUrl);
    await (channel as TextChannel).send({ embeds: [embed], components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Abrir convite').setURL(gang.inviteUrl))], allowedMentions: NO_MENTIONS });
  }

  private async refreshRequestPanel(guild: Guild, requestId: number): Promise<void> {
    const request = this.gangs.request(requestId); const channelId = this.config.get(guild.id, 'gangs_admin_channel_id');
    if (!request || !request.adminMessageId || !channelId) return;
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel?.isTextBased() || !('messages' in channel)) return;
    const message = await (channel as TextChannel).messages.fetch(request.adminMessageId);
    await message.edit({ embeds: [this.requestEmbed(request)], components: request.state === 'pending' ? this.requestRows(request.id) : [], allowedMentions: NO_MENTIONS });
  }
  private async refreshRemovalPanel(guild: Guild, removalId: number): Promise<void> {
    const request = this.gangs.removal(removalId); const channelId = this.config.get(guild.id, 'gangs_admin_channel_id');
    if (!request || !request.adminMessageId || !channelId) return;
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel?.isTextBased() || !('messages' in channel)) return;
    const message = await (channel as TextChannel).messages.fetch(request.adminMessageId);
    await message.edit({ embeds: [infoEmbed(`Remoção de gangue #${request.id}`, `Estado: **${request.state.toUpperCase()}**\nMotivo: ${request.reason}`)], components: [], allowedMentions: NO_MENTIONS });
  }
  private requireRequest(id: number, guildId: string): GangRequest { const request = this.gangs.request(id); if (!request || request.guildId !== guildId) throw new Error('Solicitação de gangue não encontrada.'); return request; }
}
