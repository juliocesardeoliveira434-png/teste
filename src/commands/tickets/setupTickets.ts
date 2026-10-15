import { SlashCommandBuilder } from 'discord.js';
import { errorEmbed, successEmbed } from '../../embeds/factory';
import { COPY } from '../../config/messages';
import { safeReply } from '../../utils/discord';
import type { Command } from '../command';

export const setupTicketsCommand: Command = {
  data: new SlashCommandBuilder().setName('setup_tickets').setDescription('Publica ou atualiza o painel persistente de tickets.'),
  async execute(interaction, context) {
    if (!await context.permissions.requirePermission(interaction, 'admin')) return;
    try {
      await context.ticketPanel.publish(interaction.guild!);
      await safeReply(interaction, { embeds: [successEmbed('Painel publicado', COPY.setupSaved('tickets'))], flags: 64 }, context.logger);
    } catch (error: unknown) { await safeReply(interaction, { embeds: [errorEmbed('Configuração incompleta', error instanceof Error ? error.message : 'Erro desconhecido.')], flags: 64 }, context.logger); }
  }
};
