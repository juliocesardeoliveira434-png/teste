import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, type ButtonInteraction } from 'discord.js';
import { errorEmbed, infoEmbed } from '../../embeds/factory';
import { buttonsOf, ownedBotMessage } from '../../services/messageEditor';
import type { AppContext } from '../../types/app';
import { customId, type CustomId } from '../../utils/customId';
import { safeReply } from '../../utils/discord';

function input(id: string, label: string, required = false, paragraph = false, limit = 1000): ActionRowBuilder<TextInputBuilder> {
  return new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId(id).setLabel(label).setRequired(required).setStyle(paragraph ? TextInputStyle.Paragraph : TextInputStyle.Short).setMaxLength(limit));
}
function embedModal(action: string, entity: string): ModalBuilder {
  if (action === 'content') return new ModalBuilder().setCustomId(customId('editembed', 'save-content', entity)).setTitle('Editar conteúdo').addComponents(input('title', 'Título (vazio remove)', false, false, 256), input('description', 'Descrição (vazio remove)', false, true, 4096));
  if (action === 'appearance') return new ModalBuilder().setCustomId(customId('editembed', 'save-appearance', entity)).setTitle('Editar aparência').addComponents(input('color', 'Cor hex, ex.: #5865F2 (vazio remove)', false, false, 7), input('image', 'URL da imagem (vazio remove)', false, false, 1500), input('thumbnail', 'URL da miniatura (vazio remove)', false, false, 1500));
  if (action === 'footer') return new ModalBuilder().setCustomId(customId('editembed', 'save-footer', entity)).setTitle('Editar rodapé').addComponents(input('text', 'Texto do rodapé (vazio remove)', false, false, 2048), input('icon', 'URL do ícone (opcional)', false, false, 1500));
  return new ModalBuilder().setCustomId(customId('editembed', 'save-fields', entity)).setTitle('Gerenciar fields').addComponents(input('action', 'Ação: adicionar, editar ou remover', true, false, 10), input('index', 'Índice (editar/remover; começa em 1)', false, false, 2), input('name', 'Nome (adicionar/editar)', false, false, 256), input('value', 'Valor (adicionar/editar)', false, true, 1024), input('inline', 'Inline: sim ou nao', false, false, 3));
}
function buttonModal(action: string, entity: string): ModalBuilder {
  if (action === 'label') return new ModalBuilder().setCustomId(customId('editbuttons', 'save-label', entity)).setTitle('Editar rótulo').addComponents(input('index', 'Índice do botão (começa em 1)', true, false, 2), input('label', 'Novo rótulo', true, false, 80));
  if (action === 'style') return new ModalBuilder().setCustomId(customId('editbuttons', 'save-style', entity)).setTitle('Alterar estilo').addComponents(input('index', 'Índice do botão (começa em 1)', true, false, 2), input('style', 'primary, secondary, success ou danger', true, false, 12));
  if (action === 'add') return new ModalBuilder().setCustomId(customId('editbuttons', 'save-add', entity)).setTitle('Adicionar botão funcional').addComponents(input('type', 'Tipo: link ou ticket-call', true, false, 12), input('label', 'Rótulo', true, false, 80), input('target', 'URL pública ou ID de ticket', true, false, 1500));
  if (action === 'remove') return new ModalBuilder().setCustomId(customId('editbuttons', 'save-remove', entity)).setTitle('Remover botão').addComponents(input('index', 'Índice do botão (começa em 1)', true, false, 2));
  if (action === 'reorder') return new ModalBuilder().setCustomId(customId('editbuttons', 'save-reorder', entity)).setTitle('Reordenar botões').addComponents(input('from', 'Índice de origem (começa em 1)', true, false, 2), input('to', 'Nova posição (começa em 1)', true, false, 2));
  return new ModalBuilder().setCustomId(customId('editbuttons', 'save-link', entity)).setTitle('Configurar botão de link').addComponents(input('index', 'Índice do botão (começa em 1)', true, false, 2), input('label', 'Rótulo', true, false, 80), input('url', 'URL HTTP/HTTPS pública', true, false, 1500));
}

export async function handleEditorButton(interaction: ButtonInteraction, id: CustomId, context: AppContext): Promise<void> {
  if (!await context.permissions.requirePermission(interaction, 'admin')) return;
  try {
    if (id.namespace === 'editembed') { await interaction.showModal(embedModal(id.action, id.entityId)); return; }
    const message = await ownedBotMessage(context, interaction.guild!, id.entityId);
    if (id.action === 'view') {
      const buttons = buttonsOf(message);
      const list = buttons.length ? buttons.map((button, index) => `${index + 1}. **${button.label ?? 'sem rótulo'}** · ${button.url ? 'Link' : `Interno: ${button.custom_id ?? 'indefinido'}`}`).join('\n') : 'Nenhum botão nesta mensagem.';
      await safeReply(interaction, { embeds: [infoEmbed('Botões atuais', list)], flags: 64 }, context.logger);
      return;
    }
    await interaction.showModal(buttonModal(id.action, id.entityId));
  } catch (error: unknown) { await safeReply(interaction, { embeds: [errorEmbed('Editor indisponível', error instanceof Error ? error.message : 'Erro desconhecido.')], flags: 64 }, context.logger); }
}
