import { SlashCommandBuilder, type TextChannel } from 'discord.js';
import { errorEmbed, successEmbed } from '../../embeds/factory';
import { safeReply } from '../../utils/discord';
import type { Command } from '../command';

export const setupReactionRoleCommand: Command = {
  data: new SlashCommandBuilder().setName('setup_reactionrole').setDescription('Publica a regra de reação para o cargo de jornalista.')
    .addStringOption((option) => option.setName('emoji').setDescription('Emoji Unicode da regra').setRequired(false).setMaxLength(32))
    .addStringOption((option) => option.setName('mensagem').setDescription('Texto explicativo do painel').setRequired(false).setMaxLength(1000))
    .addBooleanOption((option) => option.setName('temporario').setDescription('Remove o cargo ao desfazer a reação').setRequired(false)),
  async execute(interaction, context) {
    if (!await context.permissions.requirePermission(interaction, 'admin')) return;
    const guild = interaction.guild!; const channelId = context.config.get(guild.id, 'reaction_role_channel_id'); const roleId = context.config.get(guild.id, 'journalist_role_id');
    const channel = channelId ? await guild.channels.fetch(channelId).catch(() => null) : null; const role = roleId ? await guild.roles.fetch(roleId).catch(() => null) : null;
    if (!channel?.isTextBased() || !('messages' in channel) || !role) { await safeReply(interaction, { embeds: [errorEmbed('Configuração incompleta', 'Defina canal de reaction role e cargo de jornalista antes de publicar.')], flags: 64 }, context.logger); return; }
    if (!role.editable) { await safeReply(interaction, { embeds: [errorEmbed('Hierarquia insuficiente', 'O cargo de jornalista deve estar abaixo do cargo mais alto do bot.')], flags: 64 }, context.logger); return; }
    const emoji = interaction.options.getString('emoji')?.trim() || '📰';
    const text = interaction.options.getString('mensagem')?.trim() || `Reaja com ${emoji} para receber o cargo <@&${role.id}>.`;
    try {
      await context.reactionRoles.publish(guild, channel as TextChannel, role, emoji, text, interaction.options.getBoolean('temporario') ?? false);
      await safeReply(interaction, { embeds: [successEmbed('Reaction role configurada', `A regra persistente foi publicada em <#${channel.id}>.`)], flags: 64 }, context.logger);
    } catch (error: unknown) { await safeReply(interaction, { embeds: [errorEmbed('Reaction role não configurada', error instanceof Error ? error.message : 'Erro desconhecido.')], flags: 64 }, context.logger); }
  }
};
