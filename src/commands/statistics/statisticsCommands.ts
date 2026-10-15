import { SlashCommandBuilder, type TextChannel } from 'discord.js';
import { errorEmbed, successEmbed } from '../../embeds/factory';
import { safeReply } from '../../utils/discord';
import type { Command } from '../command';

export const serverStatsCommand: Command = {
  data: new SlashCommandBuilder().setName('server_stats').setDescription('Consulta estatísticas reais do servidor.'),
  async execute(interaction, context) {
    if (!interaction.inGuild() || interaction.guildId !== context.environment.guildId) { await safeReply(interaction, { embeds: [errorEmbed('Servidor indisponível', 'Este bot funciona somente no servidor configurado.')], flags: 64 }, context.logger); return; }
    await interaction.deferReply({ flags: 64 });
    await interaction.editReply({ embeds: [await context.statistics.embed(interaction.guild!)] });
  }
};

export const setupStatsCommand: Command = {
  data: new SlashCommandBuilder().setName('setup_stats').setDescription('Publica ou atualiza o painel persistente de estatísticas.'),
  async execute(interaction, context) {
    if (!await context.permissions.requirePermission(interaction, 'admin')) return;
    const guild = interaction.guild!; const channelId = context.config.get(guild.id, 'stats_channel_id'); const channel = channelId ? await guild.channels.fetch(channelId).catch(() => null) : null;
    if (!channel?.isTextBased() || !('messages' in channel)) { await safeReply(interaction, { embeds: [errorEmbed('Configuração incompleta', 'Defina um canal de estatísticas primeiro.')], flags: 64 }, context.logger); return; }
    await context.panelService.publish(guild.id, 'statistics', channel as TextChannel, { embeds: [await context.statistics.embed(guild)] });
    await safeReply(interaction, { embeds: [successEmbed('Painel publicado', 'O painel de estatísticas persistente foi atualizado.')], flags: 64 }, context.logger);
  }
};
