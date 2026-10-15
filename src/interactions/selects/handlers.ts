import { PermissionFlagsBits, type AnySelectMenuInteraction, type ChannelSelectMenuInteraction, type RoleSelectMenuInteraction } from 'discord.js';
import { channelFunction, roleFunction } from '../../config/serverConfig';
import { errorEmbed, successEmbed, warningEmbed } from '../../embeds/factory';
import type { AppContext } from '../../types/app';
import { type CustomId } from '../../utils/customId';
import { deferEphemeral, safeReply } from '../../utils/discord';

export async function handleSelect(interaction: AnySelectMenuInteraction, id: CustomId, context: AppContext): Promise<void> {
  if (id.namespace === 'config' && id.action === 'channel' && interaction.isChannelSelectMenu()) {
    await handleChannelConfig(interaction, id.entityId, context); return;
  }
  if (id.namespace === 'config' && id.action === 'role' && interaction.isRoleSelectMenu()) {
    await handleRoleConfig(interaction, id.entityId, context); return;
  }
  if (id.namespace === 'ticket' && id.action === 'category' && interaction.isStringSelectMenu()) {
    if (!interaction.inGuild() || !await deferEphemeral(interaction, context.logger)) return;
    if (interaction.values[0] !== 'support') { await safeReply(interaction, { embeds: [errorEmbed('Categoria inválida', 'A categoria escolhida não está disponível.')], flags: 64 }, context.logger); return; }
    try {
      const ticket = await context.ticketService.openSupportTicket(interaction.guild!, interaction.user);
      await safeReply(interaction, { embeds: [successEmbed('Ticket criado', `Seu atendimento privado **#${ticket.publicId}** foi aberto.`)], flags: 64 }, context.logger);
    } catch (error: unknown) { await safeReply(interaction, { embeds: [errorEmbed('Ticket não criado', error instanceof Error && error.message === 'DUPLICATE_OPEN_TICKET' ? 'Você já possui um ticket aberto nesta categoria.' : error instanceof Error ? error.message : 'Erro desconhecido.')], flags: 64 }, context.logger); }
    return;
  }
  if (id.namespace === 'ticket' && id.action === 'reassign' && interaction.isStringSelectMenu()) {
    if (!await context.permissions.requirePermission(interaction, 'staff') || !await deferEphemeral(interaction, context.logger)) return;
    const ticketId = Number(id.entityId);
    const assigneeId = interaction.values[0];
    if (!Number.isSafeInteger(ticketId) || !assigneeId) { await safeReply(interaction, { embeds: [errorEmbed('Dados inválidos', 'Não foi possível identificar o ticket ou o responsável.')], flags: 64 }, context.logger); return; }
    try {
      const eligible = await context.ticketService.eligibleStaff(interaction.guild!, context.tickets.byId(ticketId)?.requesterId ?? '');
      const assignee = eligible.find((member) => member.id === assigneeId);
      if (!assignee) throw new Error('O membro selecionado não está mais elegível para atendimento.');
      const ticket = await context.ticketService.reassign(interaction.guild!, ticketId, assignee, interaction.user.id);
      await safeReply(interaction, { embeds: [ticket ? successEmbed('Ticket reatribuído', `**#${ticket.publicId}** agora está sob responsabilidade de <@${assignee.id}>.`) : warningEmbed('Ticket indisponível', 'O ticket já foi encerrado.')], flags: 64 }, context.logger);
    } catch (error: unknown) { await safeReply(interaction, { embeds: [errorEmbed('Reatribuição não concluída', error instanceof Error ? error.message : 'Erro desconhecido.')], flags: 64 }, context.logger); }
    return;
  }
  await safeReply(interaction, { embeds: [errorEmbed('Menu inválido', 'Este menu não está ativo ou não pertence a este fluxo.')], flags: 64 }, context.logger);
}

async function handleChannelConfig(interaction: ChannelSelectMenuInteraction, functionValue: string, context: AppContext): Promise<void> {
  if (!await context.permissions.requirePermission(interaction, 'admin')) return;
  const spec = channelFunction(functionValue);
  const channelId = interaction.values[0];
  if (!spec || !channelId || !interaction.guild) { await safeReply(interaction, { embeds: [errorEmbed('Seleção inválida', 'Escolha novamente pelo comando /select_channel.')], flags: 64 }, context.logger); return; }
  const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
  if (!channel || !spec.channelTypes.includes(channel.type)) { await safeReply(interaction, { embeds: [errorEmbed('Tipo incompatível', `A função **${spec.label}** exige um destino compatível.`)], flags: 64 }, context.logger); return; }
  const bot = interaction.guild.members.me;
  const required = spec.isCategory ? [PermissionFlagsBits.ManageChannels] : [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages];
  if (!bot || !channel.permissionsFor(bot).has(required)) { await safeReply(interaction, { embeds: [errorEmbed('Permissão insuficiente', `O bot precisa de **${spec.isCategory ? 'Gerenciar Canais' : 'Ver Canal e Enviar Mensagens'}** no destino selecionado.`)], flags: 64 }, context.logger); return; }
  if (!await deferEphemeral(interaction, context.logger)) return;
  context.config.set(interaction.guild.id, spec.key, channel.id);
  await safeReply(interaction, { embeds: [successEmbed('Canal configurado', `${spec.label}: <#${channel.id}>.`)], flags: 64 }, context.logger);
}

async function handleRoleConfig(interaction: RoleSelectMenuInteraction, functionValue: string, context: AppContext): Promise<void> {
  if (!await context.permissions.requirePermission(interaction, 'admin')) return;
  const spec = roleFunction(functionValue);
  const roleId = interaction.values[0];
  if (!spec || !roleId || !interaction.guild) { await safeReply(interaction, { embeds: [errorEmbed('Seleção inválida', 'Escolha novamente pelo comando /select_role.')], flags: 64 }, context.logger); return; }
  const role = await interaction.guild.roles.fetch(roleId).catch(() => null);
  if (!role || role.id === interaction.guild.id || role.managed) { await safeReply(interaction, { embeds: [errorEmbed('Cargo incompatível', 'Selecione um cargo comum, não gerenciado e diferente de @everyone.')], flags: 64 }, context.logger); return; }
  if (spec.value === 'journalist' && !role.editable) { await safeReply(interaction, { embeds: [errorEmbed('Hierarquia insuficiente', 'O cargo de jornalista deve ficar abaixo do cargo mais alto do bot.')], flags: 64 }, context.logger); return; }
  if (!await deferEphemeral(interaction, context.logger)) return;
  context.config.set(interaction.guild.id, spec.key, spec.value === 'staff' ? JSON.stringify([role.id]) : role.id);
  await safeReply(interaction, { embeds: [successEmbed('Cargo configurado', `${spec.label}: <@&${role.id}>.`)], flags: 64 }, context.logger);
}
