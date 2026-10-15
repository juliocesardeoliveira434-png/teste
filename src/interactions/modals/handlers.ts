import type { ModalSubmitInteraction } from 'discord.js';
import { errorEmbed, successEmbed } from '../../embeds/factory';
import { validateJournalSubmission } from '../../commands/journalist/embedJornal';
import type { AppContext } from '../../types/app';
import { type CustomId } from '../../utils/customId';
import { deferEphemeral, safeReply } from '../../utils/discord';
import { normalizeLabel } from '../../utils/text';
import { validateHttpUrl } from '../../utils/validators';

function read(interaction: ModalSubmitInteraction, key: string): string {
  return interaction.fields.getTextInputValue(key).trim();
}

export async function handleModal(interaction: ModalSubmitInteraction, id: CustomId, context: AppContext): Promise<void> {
  if (id.namespace === 'journal' && id.action === 'submit') {
    if (!await context.permissions.requirePermission(interaction, 'journalist') || !await deferEphemeral(interaction, context.logger)) return;
    const validation = validateJournalSubmission({ headlineUrl: read(interaction, 'headline_url'), gangOne: read(interaction, 'gang_one'), score: read(interaction, 'score'), gangTwo: read(interaction, 'gang_two'), imageUrl: read(interaction, 'image_url') });
    if (!validation.input) {
      await safeReply(interaction, { embeds: [errorEmbed('Corrija os campos indicados', validation.errors.join('\n'))], flags: 64 }, context.logger);
      return;
    }
    try {
      const publication = await context.journal.publish(interaction.guild!, { guildId: interaction.guildId!, authorId: interaction.user.id, ...validation.input });
      await context.leaderboard.refreshPanel(interaction.guildId!);
      await safeReply(interaction, { embeds: [successEmbed('Publicação enviada', `**#${publication.publicId}** foi publicada e registrou **${publication.points} ponto(s)**.`)], flags: 64 }, context.logger);
    } catch (error: unknown) {
      await safeReply(interaction, { embeds: [errorEmbed('Publicação não concluída', error instanceof Error ? error.message : 'Erro desconhecido.')], flags: 64 }, context.logger);
    }
    return;
  }
  if (id.namespace === 'recruitment' && id.action === 'submit') {
    if (!interaction.inGuild() || interaction.guildId !== context.environment.guildId || !await deferEphemeral(interaction, context.logger)) return;
    const identification = normalizeLabel(read(interaction, 'identification'), 100);
    const experience = normalizeLabel(read(interaction, 'experience'), 1000);
    const motivation = normalizeLabel(read(interaction, 'motivation'), 1000);
    const availability = normalizeLabel(read(interaction, 'availability'), 200);
    const portfolioRaw = read(interaction, 'portfolio');
    const portfolioUrl = portfolioRaw ? validateHttpUrl(portfolioRaw) : null;
    const errors: string[] = [];
    if (!identification) errors.push('**Nome / identificação:** obrigatório.');
    if (!experience) errors.push('**Experiência:** obrigatória.');
    if (!motivation) errors.push('**Motivo:** obrigatório.');
    if (!availability) errors.push('**Disponibilidade:** obrigatória.');
    if (portfolioRaw && !portfolioUrl) errors.push('**Portfólio:** informe URL HTTP/HTTPS pública válida.');
    if (errors.length > 0) { await safeReply(interaction, { embeds: [errorEmbed('Corrija os campos indicados', errors.join('\n'))], flags: 64 }, context.logger); return; }
    try {
      const ticket = await context.recruitment.open(interaction.guild!, interaction.user, { identification, experience, motivation, availability, portfolioUrl });
      await safeReply(interaction, { embeds: [successEmbed('Inscrição recebida', `Sua inscrição abriu o canal privado **#${ticket.publicId}**.`)], flags: 64 }, context.logger);
    } catch (error: unknown) {
      await safeReply(interaction, { embeds: [errorEmbed('Inscrição não concluída', error instanceof Error && error.message === 'DUPLICATE_OPEN_TICKET' ? 'Você já possui uma inscrição aberta.' : error instanceof Error ? error.message : 'Erro desconhecido.')], flags: 64 }, context.logger);
    }
    return;
  }
  if (id.namespace === 'recruitment' && id.action === 'reject-reason') {
    if (!await context.permissions.requirePermission(interaction, 'admin') || !await deferEphemeral(interaction, context.logger)) return;
    const ticketId = Number(id.entityId);
    const reason = normalizeLabel(read(interaction, 'reason'), 1000);
    if (!Number.isSafeInteger(ticketId) || ticketId < 1 || !reason) { await safeReply(interaction, { embeds: [errorEmbed('Dados inválidos', 'Informe um motivo de recusa válido.')], flags: 64 }, context.logger); return; }
    try {
      const reviewer = await interaction.guild!.members.fetch(interaction.user.id);
      await context.recruitment.reject(interaction.guild!, ticketId, reviewer, reason);
      await safeReply(interaction, { embeds: [successEmbed('Inscrição recusada', 'A decisão e o motivo interno foram registrados.')], flags: 64 }, context.logger);
    } catch (error: unknown) { await safeReply(interaction, { embeds: [errorEmbed('Recusa não concluída', error instanceof Error ? error.message : 'Erro desconhecido.')], flags: 64 }, context.logger); }
  }
}
