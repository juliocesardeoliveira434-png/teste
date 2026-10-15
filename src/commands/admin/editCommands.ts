import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, SlashCommandBuilder } from 'discord.js';
import { errorEmbed, infoEmbed } from '../../embeds/factory';
import { messageEntity, ownedBotMessage } from '../../services/messageEditor';
import type { AppContext } from '../../types/app';
import { customId } from '../../utils/customId';
import { safeReply } from '../../utils/discord';
import type { Command } from '../command';

async function startEditor(interaction: Parameters<Command['execute']>[0], context: AppContext, kind: 'embed' | 'buttons'): Promise<void> {
  if (!await context.permissions.requirePermission(interaction, 'admin')) return;
  const channel = interaction.options.getChannel('canal', true, [ChannelType.GuildText, ChannelType.GuildAnnouncement]);
  const messageId = interaction.options.getString('id', true);
  try {
    await ownedBotMessage(context, interaction.guild!, messageEntity(channel.id, messageId));
    const buttons = kind === 'embed'
      ? [new ButtonBuilder().setCustomId(customId('editembed', 'content', messageEntity(channel.id, messageId))).setLabel('Conteúdo').setStyle(ButtonStyle.Primary), new ButtonBuilder().setCustomId(customId('editembed', 'appearance', messageEntity(channel.id, messageId))).setLabel('Aparência').setStyle(ButtonStyle.Secondary), new ButtonBuilder().setCustomId(customId('editembed', 'footer', messageEntity(channel.id, messageId))).setLabel('Rodapé').setStyle(ButtonStyle.Secondary), new ButtonBuilder().setCustomId(customId('editembed', 'fields', messageEntity(channel.id, messageId))).setLabel('Fields').setStyle(ButtonStyle.Secondary)]
      : [new ButtonBuilder().setCustomId(customId('editbuttons', 'view', messageEntity(channel.id, messageId))).setLabel('Visualizar').setStyle(ButtonStyle.Secondary), new ButtonBuilder().setCustomId(customId('editbuttons', 'label', messageEntity(channel.id, messageId))).setLabel('Editar rótulo').setStyle(ButtonStyle.Primary), new ButtonBuilder().setCustomId(customId('editbuttons', 'style', messageEntity(channel.id, messageId))).setLabel('Alterar estilo').setStyle(ButtonStyle.Secondary), new ButtonBuilder().setCustomId(customId('editbuttons', 'add', messageEntity(channel.id, messageId))).setLabel('Adicionar').setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId(customId('editbuttons', 'remove', messageEntity(channel.id, messageId))).setLabel('Remover').setStyle(ButtonStyle.Danger), new ButtonBuilder().setCustomId(customId('editbuttons', 'reorder', messageEntity(channel.id, messageId))).setLabel('Reordenar').setStyle(ButtonStyle.Secondary), new ButtonBuilder().setCustomId(customId('editbuttons', 'link', messageEntity(channel.id, messageId))).setLabel('Configurar link').setStyle(ButtonStyle.Secondary)];
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (let index = 0; index < buttons.length; index += 5) rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(index, index + 5)));
    await safeReply(interaction, { embeds: [infoEmbed(kind === 'embed' ? 'Editor de embeds' : 'Editor de botões', 'A edição é aplicada somente após validação de propriedade, URLs e limites da API.')], components: rows, flags: 64 }, context.logger);
  } catch (error: unknown) { await safeReply(interaction, { embeds: [errorEmbed('Mensagem não editável', error instanceof Error ? error.message : 'Erro desconhecido.')], flags: 64 }, context.logger); }
}

function builder(name: string, description: string) {
  return new SlashCommandBuilder().setName(name).setDescription(description)
    .addChannelOption((option) => option.setName('canal').setDescription('Canal da mensagem').setRequired(true).addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
    .addStringOption((option) => option.setName('id').setDescription('ID da mensagem enviada pelo bot').setRequired(true).setMinLength(16).setMaxLength(22));
}

export const editEmbedCommand: Command = { data: builder('edit_embed', 'Edita uma embed enviada por este bot.'), async execute(interaction, context) { await startEditor(interaction, context, 'embed'); } };
export const editButtonsCommand: Command = { data: builder('edit_botoes', 'Edita botões de uma mensagem enviada por este bot.'), async execute(interaction, context) { await startEditor(interaction, context, 'buttons'); } };
