import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import type { TicketRecord } from '../types/domain';
import { COLORS } from '../config/messages';
import { customId } from '../utils/customId';
import { discordTimestamp } from '../utils/time';

function stateVisual(state: TicketRecord['state']): { readonly label: string; readonly color: number } {
  if (state === 'closed') return { label: '● ENCERRADO', color: COLORS.muted };
  if (state === 'assigned') return { label: '● ATRIBUÍDO', color: COLORS.success };
  return { label: '● ABERTO', color: COLORS.warning };
}

export function ticketEmbed(ticket: TicketRecord): EmbedBuilder {
  const visual = stateVisual(ticket.state);
  return new EmbedBuilder()
    .setColor(visual.color)
    .setTitle(`#${ticket.publicId} · ${visual.label}`)
    .setDescription(`Solicitante: <@${ticket.requesterId}>`)
    .addFields(
      { name: 'Categoria', value: ticket.categoryKey, inline: true },
      { name: 'Responsável', value: ticket.assigneeId ? `<@${ticket.assigneeId}>` : 'Aguardando equipe', inline: true },
      { name: 'Aberto em', value: discordTimestamp(ticket.openedAt), inline: true }
    )
    .setFooter({ text: 'Jornal das Gangues · atendimento' })
    .setTimestamp();
}

export function ticketRows(ticket: TicketRecord): ActionRowBuilder<ButtonBuilder>[] {
  const disabled = ticket.state === 'closed';
  return [new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(customId('ticket', 'close', String(ticket.id))).setLabel('Fechar ticket').setStyle(ButtonStyle.Danger).setDisabled(disabled),
    new ButtonBuilder().setCustomId(customId('ticket', 'call', String(ticket.id))).setLabel('Chamar staff').setStyle(ButtonStyle.Primary).setDisabled(disabled)
  )];
}

export function ticketAdminRows(ticket: TicketRecord): ActionRowBuilder<ButtonBuilder>[] {
  const disabled = ticket.state === 'closed';
  return [new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(customId('ticket', 'take', String(ticket.id))).setLabel('Assumir').setStyle(ButtonStyle.Success).setDisabled(disabled || ticket.assigneeId !== null),
    new ButtonBuilder().setCustomId(customId('ticket', 'reassign', String(ticket.id))).setLabel('Reatribuir').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId(customId('ticket', 'close', String(ticket.id))).setLabel('Encerrar').setStyle(ButtonStyle.Danger).setDisabled(disabled)
  )];
}

