import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js';
import { infoEmbed } from '../../embeds/factory';
import { customId } from '../../utils/customId';
import { safeReply } from '../../utils/discord';
import { parseScore, validateHttpUrl } from '../../utils/validators';
import { normalizeLabel } from '../../utils/text';
import type { Command } from '../command';

export const embedJornalCommand: Command = {
  data: new SlashCommandBuilder().setName('embed_jornal').setDescription('Abre o formulário de uma publicação jornalística.'),
  async execute(interaction, context) {
    if (!await context.permissions.requirePermission(interaction, 'journalist')) return;
    await safeReply(interaction, {
      embeds: [infoEmbed('Nova publicação', 'Abra o formulário, preencha os cinco campos e revise as URLs antes de enviar.')],
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(customId('journal', 'open', 'v1')).setLabel('Criar publicação').setStyle(ButtonStyle.Primary)
      )], flags: 64
    }, context.logger);
  }
};

export function validateJournalSubmission(values: {
  readonly headlineUrl: string; readonly gangOne: string; readonly score: string; readonly gangTwo: string; readonly imageUrl: string;
}): { readonly errors: readonly string[]; readonly input?: { readonly headlineUrl: string; readonly gangOne: string; readonly score: string; readonly gangTwo: string; readonly imageUrl: string | null } } {
  const errors: string[] = [];
  const headlineUrl = validateHttpUrl(values.headlineUrl);
  const imageUrl = values.imageUrl.trim() ? validateHttpUrl(values.imageUrl) : null;
  const score = parseScore(values.score);
  const gangOne = normalizeLabel(values.gangOne, 80);
  const gangTwo = normalizeLabel(values.gangTwo, 80);
  if (!headlineUrl) errors.push('**URL da manchete:** informe uma URL HTTP/HTTPS pública válida.');
  if (!gangOne) errors.push('**Gangue 1:** informe um nome de até 80 caracteres.');
  if (!score) errors.push('**Placar:** use formatos como `3 x 1`, `3-1` ou `3×1`.');
  if (!gangTwo) errors.push('**Gangue 2:** informe um nome de até 80 caracteres.');
  if (values.imageUrl.trim() && !imageUrl) errors.push('**URL de imagem:** use URL HTTP/HTTPS pública; endereços locais e protocolos perigosos são bloqueados.');
  if (errors.length > 0 || !headlineUrl || !score) return { errors };
  return { errors, input: { headlineUrl, gangOne, score: score.display, gangTwo, imageUrl } };
}
