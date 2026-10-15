import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type Guild, type TextChannel } from 'discord.js';
import type { ConfigRepository } from '../database/repositories/configRepository';
import { infoEmbed } from '../embeds/factory';
import { customId } from '../utils/customId';
import type { PanelService } from './panels';

export class TicketPanelService {
  public constructor(private readonly config: ConfigRepository, private readonly panels: PanelService) {}
  public async publish(guild: Guild): Promise<void> {
    const panelId = this.config.get(guild.id, 'tickets_panel_channel_id');
    const supportCategory = this.config.get(guild.id, 'support_category_id');
    const recruitmentCategory = this.config.get(guild.id, 'recruitment_category_id');
    const adminId = this.config.get(guild.id, 'tickets_admin_channel_id');
    if (!panelId || !supportCategory || !recruitmentCategory || !adminId) throw new Error('Defina painel de tickets, categoria de suporte, categoria de recrutamento e canal administrativo antes de publicar.');
    const adminChannel = await guild.channels.fetch(adminId).catch(() => null);
    const privateAdmin = adminChannel && 'permissionOverwrites' in adminChannel ? adminChannel.permissionOverwrites.cache.get(guild.roles.everyone.id)?.deny.has('ViewChannel') : false;
    if (!privateAdmin) throw new Error('O canal administrativo precisa negar Ver Canal para @everyone.');
    const channel = await guild.channels.fetch(panelId);
    if (!channel?.isTextBased() || !('messages' in channel)) throw new Error('O canal do painel de tickets não aceita mensagens.');
    await this.panels.publish(guild.id, 'tickets', channel as TextChannel, {
      embeds: [infoEmbed('Central de atendimento', 'Abra um atendimento de suporte ou envie sua inscrição para jornalismo. Cada usuário pode manter um atendimento aberto por categoria.')],
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(customId('ticket', 'open', 'support')).setLabel('Abrir suporte').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(customId('recruitment', 'open', 'v1')).setLabel('Recrutamento jornalístico').setStyle(ButtonStyle.Success)
      )]
    });
  }
}
