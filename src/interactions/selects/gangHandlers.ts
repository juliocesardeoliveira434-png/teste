import { type StringSelectMenuInteraction } from 'discord.js';
import { errorEmbed } from '../../embeds/factory';
import type { AppContext } from '../../types/app';
import { customId } from '../../utils/customId';
import { safeReply } from '../../utils/discord';
import { type CustomId } from '../../utils/customId';
import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

export async function handleGangSelect(interaction: StringSelectMenuInteraction, id: CustomId, context: AppContext): Promise<void> {
  if (id.action !== 'remove-select' || !interaction.inGuild()) return;
  const gangId = Number(interaction.values[0]);
  const gang = Number.isSafeInteger(gangId) ? context.gangs.gang(gangId) : null;
  if (!gang || gang.guildId !== interaction.guildId) { await safeReply(interaction, { embeds: [errorEmbed('Gangue indisponível', 'Escolha novamente no painel de gangues.')], flags: 64 }, context.logger); return; }
  const modal = new ModalBuilder().setCustomId(customId('gang', 'remove-reason', String(gang.id))).setTitle(`Remover ${gang.name}`)
    .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('reason').setLabel('Motivo da solicitação').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000)));
  await interaction.showModal(modal);
}
