import { SlashCommandBuilder } from 'discord.js';
import { errorEmbed, successEmbed } from '../../embeds/factory';
import type { Command } from '../command';
import { safeReply } from '../../utils/discord';

export const setUpdateIntervalCommand: Command = {
  data: new SlashCommandBuilder().setName('set_update_interval').setDescription('Configura a atualização automática do leaderboard.')
    .addIntegerOption((option) => option.setName('minutos').setDescription('0 desativa; mínimo de 5 minutos').setRequired(true).setMinValue(0).setMaxValue(1440)),
  async execute(interaction, context) {
    if (!await context.permissions.requirePermission(interaction, 'admin')) return;
    const minutes = interaction.options.getInteger('minutos', true);
    if (minutes !== 0 && minutes < 5) { await safeReply(interaction, { embeds: [errorEmbed('Intervalo inválido', 'Use 0 para desativar ou pelo menos 5 minutos para respeitar rate limits.')], flags: 64 }, context.logger); return; }
    context.config.set(interaction.guildId!, 'leaderboard_interval_minutes', String(minutes));
    context.leaderboard.resetAutoRefresh(interaction.guildId!);
    await safeReply(interaction, { embeds: [successEmbed('Intervalo atualizado', minutes === 0 ? 'Atualização automática do leaderboard desativada.' : `Leaderboard será atualizado a cada **${minutes} minuto(s)**.`)], flags: 64 }, context.logger);
  }
};
