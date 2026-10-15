import { ButtonStyle, EmbedBuilder, type APIEmbed, type ModalSubmitInteraction } from 'discord.js';
import { errorEmbed, successEmbed } from '../../embeds/factory';
import { assertEmbedLimits, buttonRows, buttonsOf, ownedBotMessage } from '../../services/messageEditor';
import type { AppContext } from '../../types/app';
import { customId, type CustomId } from '../../utils/customId';
import { deferEphemeral, safeReply } from '../../utils/discord';
import { parseHexColor, validateHttpUrl } from '../../utils/validators';

function value(interaction: ModalSubmitInteraction, key: string): string { return interaction.fields.getTextInputValue(key).trim(); }
function embedJson(message: Awaited<ReturnType<typeof ownedBotMessage>>): APIEmbed { return message.embeds[0]?.toJSON() ?? {}; }
function indexOf(input: string, total: number): number { const number = Number(input); if (!Number.isSafeInteger(number) || number < 1 || number > total) throw new Error(`Informe um índice entre 1 e ${total}.`); return number - 1; }

export async function handleEditorModal(interaction: ModalSubmitInteraction, id: CustomId, context: AppContext): Promise<void> {
  if (!await context.permissions.requirePermission(interaction, 'admin') || !await deferEphemeral(interaction, context.logger)) return;
  try {
    const message = await ownedBotMessage(context, interaction.guild!, id.entityId);
    if (id.namespace === 'editembed') await editEmbed(message, interaction, id.action);
    else await editButtons(message, interaction, id.action, context);
    await safeReply(interaction, { embeds: [successEmbed('Edição aplicada', 'A mensagem do bot foi atualizada após as validações de segurança e limites.')], flags: 64 }, context.logger);
  } catch (error: unknown) { await safeReply(interaction, { embeds: [errorEmbed('Edição recusada', error instanceof Error ? error.message : 'Erro desconhecido.')], flags: 64 }, context.logger); }
}

async function editEmbed(message: Awaited<ReturnType<typeof ownedBotMessage>>, interaction: ModalSubmitInteraction, action: string): Promise<void> {
  const json = embedJson(message);
  if (action === 'save-content') {
    const title = value(interaction, 'title'); const description = value(interaction, 'description');
    if (title) json.title = title; else delete json.title;
    if (description) json.description = description; else delete json.description;
  } else if (action === 'save-appearance') {
    const color = value(interaction, 'color'); const image = value(interaction, 'image'); const thumbnail = value(interaction, 'thumbnail');
    if (color) { const parsed = parseHexColor(color); if (parsed === null) throw new Error('A cor deve ter seis dígitos hexadecimais, por exemplo #5865F2.'); json.color = parsed; } else delete json.color;
    if (image) { const url = validateHttpUrl(image); if (!url) throw new Error('A URL da imagem deve ser HTTP/HTTPS pública e segura.'); json.image = { url }; } else delete json.image;
    if (thumbnail) { const url = validateHttpUrl(thumbnail); if (!url) throw new Error('A URL da miniatura deve ser HTTP/HTTPS pública e segura.'); json.thumbnail = { url }; } else delete json.thumbnail;
  } else if (action === 'save-footer') {
    const text = value(interaction, 'text'); const icon = value(interaction, 'icon');
    if (!text) { if (icon) throw new Error('Informe texto para usar um ícone de rodapé.'); delete json.footer; }
    else { const iconUrl = icon ? validateHttpUrl(icon) : null; if (icon && !iconUrl) throw new Error('A URL do ícone deve ser HTTP/HTTPS pública e segura.'); json.footer = iconUrl ? { text, icon_url: iconUrl } : { text }; }
  } else if (action === 'save-fields') {
    const task = value(interaction, 'action').toLowerCase(); const fields = [...(json.fields ?? [])];
    if (task === 'adicionar') { const name = value(interaction, 'name'); const fieldValue = value(interaction, 'value'); if (!name || !fieldValue) throw new Error('Nome e valor são obrigatórios para adicionar field.'); if (fields.length >= 25) throw new Error('A embed já possui o máximo de 25 fields.'); fields.push({ name, value: fieldValue, inline: value(interaction, 'inline').toLowerCase() === 'sim' }); }
    else if (task === 'editar') { const index = indexOf(value(interaction, 'index'), fields.length); const name = value(interaction, 'name'); const fieldValue = value(interaction, 'value'); if (!name || !fieldValue) throw new Error('Nome e valor são obrigatórios para editar field.'); fields[index] = { name, value: fieldValue, inline: value(interaction, 'inline').toLowerCase() === 'sim' }; }
    else if (task === 'remover') fields.splice(indexOf(value(interaction, 'index'), fields.length), 1);
    else throw new Error('Ação de field inválida. Use adicionar, editar ou remover.');
    json.fields = fields;
  } else throw new Error('Ação de embed não reconhecida.');
  const embed = EmbedBuilder.from(json); assertEmbedLimits(embed); await message.edit({ embeds: [embed] });
}

async function editButtons(message: Awaited<ReturnType<typeof ownedBotMessage>>, interaction: ModalSubmitInteraction, action: string, context: AppContext): Promise<void> {
  const buttons = buttonsOf(message);
  if (action === 'save-label') { const button = buttons[indexOf(value(interaction, 'index'), buttons.length)]!; const label = value(interaction, 'label'); if (!label) throw new Error('O rótulo é obrigatório.'); buttons[buttons.indexOf(button)] = { ...button, label }; }
  else if (action === 'save-style') { const index = indexOf(value(interaction, 'index'), buttons.length); const button = buttons[index]!; if (button.url) throw new Error('Botões de link sempre usam o estilo Link; use Configurar link.'); const styles: Record<string, ButtonStyle> = { primary: ButtonStyle.Primary, secondary: ButtonStyle.Secondary, success: ButtonStyle.Success, danger: ButtonStyle.Danger }; const style = styles[value(interaction, 'style').toLowerCase()]; if (!style) throw new Error('Estilo inválido. Use primary, secondary, success ou danger.'); buttons[index] = { ...button, style }; }
  else if (action === 'save-add') { if (buttons.length >= 25) throw new Error('Limite atingido: 5 rows × 5 botões.'); const type = value(interaction, 'type').toLowerCase(); const label = value(interaction, 'label'); const target = value(interaction, 'target'); if (!label) throw new Error('O rótulo é obrigatório.'); if (type === 'link') { const url = validateHttpUrl(target); if (!url) throw new Error('O botão de link exige URL HTTP/HTTPS pública e segura.'); buttons.push({ type: 2, style: ButtonStyle.Link, label, url }); } else if (type === 'ticket-call') { const id = Number(target); const ticket = Number.isSafeInteger(id) ? context.tickets.byId(id) : null; if (!ticket || ticket.guildId !== interaction.guildId || ticket.state === 'closed') throw new Error('Informe o ID de um ticket aberto deste servidor.'); buttons.push({ type: 2, style: ButtonStyle.Primary, label, custom_id: customId('ticket', 'call', String(id)) }); } else throw new Error('Tipo inválido. Use link ou ticket-call; nenhum handler fictício é permitido.'); }
  else if (action === 'save-remove') buttons.splice(indexOf(value(interaction, 'index'), buttons.length), 1);
  else if (action === 'save-reorder') { const from = indexOf(value(interaction, 'from'), buttons.length); const to = indexOf(value(interaction, 'to'), buttons.length); const [button] = buttons.splice(from, 1); if (!button) throw new Error('Botão de origem inválido.'); buttons.splice(to, 0, button); }
  else if (action === 'save-link') { const index = indexOf(value(interaction, 'index'), buttons.length); const label = value(interaction, 'label'); const url = validateHttpUrl(value(interaction, 'url')); if (!label || !url) throw new Error('Rótulo e URL HTTP/HTTPS pública são obrigatórios.'); buttons[index] = { type: 2, style: ButtonStyle.Link, label, url }; }
  else throw new Error('Ação de botão não reconhecida.');
  await message.edit({ components: buttonRows(buttons) });
}
