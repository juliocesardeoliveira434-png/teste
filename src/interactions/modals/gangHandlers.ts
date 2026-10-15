import type { ModalSubmitInteraction } from 'discord.js';
import { errorEmbed, successEmbed } from '../../embeds/factory';
import type { AppContext } from '../../types/app';
import { type CustomId } from '../../utils/customId';
import { deferEphemeral, safeReply } from '../../utils/discord';
import { normalizeLabel } from '../../utils/text';
import { validateHttpUrl, validateInvite } from '../../utils/validators';

function field(interaction: ModalSubmitInteraction, name: string): string { return interaction.fields.getTextInputValue(name).trim(); }

export async function handleGangModal(interaction: ModalSubmitInteraction, id: CustomId, context: AppContext): Promise<void> {
  if (id.action === 'submit') {
    const guild = await context.client.guilds.fetch(id.entityId).catch(() => null);
    const member = guild ? await guild.members.fetch(interaction.user.id).catch(() => null) : null;
    if (!guild || !member || !await deferEphemeral(interaction, context.logger)) return;
    const inviteUrl = validateInvite(field(interaction, 'invite'));
    const gangName = normalizeLabel(field(interaction, 'name'), 80);
    const roleName = normalizeLabel(field(interaction, 'role'), 80) || gangName;
    const imageUrl = validateHttpUrl(field(interaction, 'image'));
    const memberCount = Number(field(interaction, 'members'));
    const errors: string[] = [];
    if (!inviteUrl) errors.push('**Convite:** use discord.gg/... ou discord.com/invite/... com HTTPS.');
    if (!gangName) errors.push('**Nome da gangue:** obrigatório.');
    if (!imageUrl) errors.push('**Imagem:** informe URL HTTP/HTTPS pública, sem caminhos locais.');
    if (!Number.isSafeInteger(memberCount) || memberCount < 0) errors.push('**Quantidade de membros:** informe um inteiro maior ou igual a zero.');
    if (errors.length > 0 || !inviteUrl || !imageUrl) { await safeReply(interaction, { embeds: [errorEmbed('Corrija os campos indicados', errors.join('\n'))], flags: 64 }, context.logger); return; }
    try {
      const request = await context.gangService.submit(guild, member, { inviteUrl, gangName, roleName, imageUrl, memberCount });
      await safeReply(interaction, { embeds: [successEmbed('Solicitação enviada', `A solicitação **#${request.publicId}** aguarda análise. Nenhum cargo foi criado ainda.`)], flags: 64 }, context.logger);
    } catch (error: unknown) { await safeReply(interaction, { embeds: [errorEmbed('Solicitação não concluída', error instanceof Error ? error.message : 'Erro desconhecido.')], flags: 64 }, context.logger); }
    return;
  }
  if (id.action === 'remove-reason') {
    if (!interaction.inGuild() || !await deferEphemeral(interaction, context.logger)) return;
    const gangId = Number(id.entityId); const reason = normalizeLabel(field(interaction, 'reason'), 1000);
    if (!Number.isSafeInteger(gangId) || gangId < 1 || !reason) { await safeReply(interaction, { embeds: [errorEmbed('Dados inválidos', 'Informe um motivo para a solicitação de remoção.')], flags: 64 }, context.logger); return; }
    try {
      const member = await interaction.guild!.members.fetch(interaction.user.id);
      const request = await context.gangService.requestRemoval(interaction.guild!, member, gangId, reason);
      await safeReply(interaction, { embeds: [successEmbed('Remoção enviada', `Solicitação **#${request.id}** enviada para análise administrativa.`)], flags: 64 }, context.logger);
    } catch (error: unknown) { await safeReply(interaction, { embeds: [errorEmbed('Remoção não enviada', error instanceof Error ? error.message : 'Erro desconhecido.')], flags: 64 }, context.logger); }
  }
}
