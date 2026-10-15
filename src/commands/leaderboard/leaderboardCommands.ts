import { SlashCommandBuilder } from 'discord.js';
import { errorEmbed, successEmbed } from '../../embeds/factory';
import { safeReply } from '../../utils/discord';
import type { Command } from '../command';

export const leaderboardCommand: Command = {
  data: new SlashCommandBuilder().setName('leaderboard').setDescription('Exibe a classificação atual em imagem.'),
  async execute(interaction, context) {
    if (!interaction.inGuild() || interaction.guildId !== context.environment.guildId) {
      await safeReply(interaction, { embeds: [errorEmbed('Servidor indisponível', 'Este bot funciona somente no servidor configurado.')], flags: 64 }, context.logger);
      return;
    }
    await interaction.deferReply({ flags: 64 });
    try {
      const attachment = await context.leaderboard.imageFor(interaction.guild!);
      await interaction.editReply({ files: [attachment] });
    } catch (error: unknown) {
      await safeReply(interaction, { embeds: [errorEmbed('Leaderboard indisponível', error instanceof Error ? error.message : 'Falha desconhecida.')], flags: 64 }, context.logger);
    }
  }
};

export const setupLeaderboardCommand: Command = {
  data: new SlashCommandBuilder().setName('setup_leaderboard').setDescription('Publica ou atualiza o painel persistente do ranking.'),
  async execute(interaction, context) {
    if (!await context.permissions.requirePermission(interaction, 'admin')) return;
    const channelId = context.config.get(interaction.guildId!, 'leaderboard_channel_id');
    const channel = channelId ? await interaction.guild!.channels.fetch(channelId).catch(() => null) : null;
    if (!channel?.isTextBased() || !('messages' in channel)) {
      await safeReply(interaction, { embeds: [errorEmbed('Configuração incompleta', 'Defina um canal de leaderboard compatível primeiro.')], flags: 64 }, context.logger);
      return;
    }
    await interaction.deferReply({ flags: 64 });
    try {
      await context.leaderboard.publishOrUpdate(interaction.guild!);
      await interaction.editReply({ embeds: [successEmbed('Painel publicado', 'O ranking persistente foi criado ou atualizado no canal configurado.')] });
    } catch (error: unknown) {
      await safeReply(interaction, { embeds: [errorEmbed('Falha ao publicar', error instanceof Error ? error.message : 'Erro desconhecido.')], flags: 64 }, context.logger);
    }
  }
};
