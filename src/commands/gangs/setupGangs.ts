import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, type TextChannel } from 'discord.js';
import { errorEmbed, infoEmbed, successEmbed } from '../../embeds/factory';
import { customId } from '../../utils/customId';
import { safeReply } from '../../utils/discord';
import type { Command } from '../command';

export const setupGangsCommand: Command = {
  data: new SlashCommandBuilder().setName('setup_gangs').setDescription('Publica ou atualiza o painel de cadastro de gangues.'),
  async execute(interaction, context) {
    if (!await context.permissions.requirePermission(interaction, 'admin')) return;
    const guild = interaction.guild!;
    const channelId = context.config.get(guild.id, 'gangs_panel_channel_id');
    if (!channelId) { await safeReply(interaction, { embeds: [errorEmbed('Configuração incompleta', 'Defina o canal do painel de gangues primeiro.')], flags: 64 }, context.logger); return; }
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel?.isTextBased() || !('messages' in channel)) { await safeReply(interaction, { embeds: [errorEmbed('Canal indisponível', 'O destino do painel não aceita mensagens.')], flags: 64 }, context.logger); return; }
    await context.panelService.publish(guild.id, 'gangs', channel as TextChannel, {
      embeds: [infoEmbed('Central de gangues', 'Solicite a adição ou remoção de um cadastro. Toda decisão é analisada pela equipe autorizada.')],
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(customId('gang', 'open', 'add')).setLabel('Adicionar gangue').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(customId('gang', 'open', 'remove')).setLabel('Remover gangue').setStyle(ButtonStyle.Secondary)
      )]
    });
    await safeReply(interaction, { embeds: [successEmbed('Painel publicado', 'O painel de gangues persistente está pronto.')], flags: 64 }, context.logger);
  }
};
