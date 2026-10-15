import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle,
  type ButtonInteraction
} from 'discord.js';
import { errorEmbed, infoEmbed, successEmbed, warningEmbed } from '../../embeds/factory';
import type { AppContext } from '../../types/app';
import { customId, type CustomId } from '../../utils/customId';
import { deferEphemeral, safeReply } from '../../utils/discord';

function ticketId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function journalModal(): ModalBuilder {
  return new ModalBuilder().setCustomId(customId('journal', 'submit', 'v1')).setTitle('Nova publicação jornalística').addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('headline_url').setLabel('URL da manchete').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(1500)),
    new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('gang_one').setLabel('Gangue 1').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(80)),
    new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('score').setLabel('Placar (ex.: 3 x 1)').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(12)),
    new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('gang_two').setLabel('Gangue 2').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(80)),
    new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('image_url').setLabel('URL de imagem (opcional)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(1500))
  );
}

function recruitmentModal(): ModalBuilder {
  return new ModalBuilder().setCustomId(customId('recruitment', 'submit', 'v1')).setTitle('Inscrição para jornalista').addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('identification').setLabel('Nome / identificação').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)),
    new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('experience').setLabel('Experiência').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000)),
    new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('motivation').setLabel('Por que deseja participar?').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000)),
    new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('availability').setLabel('Disponibilidade').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(200)),
    new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('portfolio').setLabel('Portfólio (opcional)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(1500))
  );
}

function rejectionModal(id: number): ModalBuilder {
  return new ModalBuilder().setCustomId(customId('recruitment', 'reject-reason', String(id))).setTitle('Recusar inscrição').addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('reason').setLabel('Motivo interno da recusa').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000))
  );
}

export async function handleButton(interaction: ButtonInteraction, id: CustomId, context: AppContext): Promise<void> {
  if (id.namespace === 'journal' && id.action === 'open') {
    if (!await context.permissions.requirePermission(interaction, 'journalist')) return;
    await interaction.showModal(journalModal());
    return;
  }
  if (id.namespace === 'recruitment' && id.action === 'open') {
    if (!interaction.inGuild()) return;
    await interaction.showModal(recruitmentModal());
    return;
  }
  if (id.namespace === 'recruitment' && id.action === 'approve') {
    if (!await context.permissions.requirePermission(interaction, 'admin')) return;
    const idNumber = ticketId(id.entityId);
    if (!idNumber || !await deferEphemeral(interaction, context.logger)) return;
    try {
      const reviewer = await interaction.guild!.members.fetch(interaction.user.id);
      const userId = await context.recruitment.approve(interaction.guild!, idNumber, reviewer);
      await safeReply(interaction, { embeds: [successEmbed('Inscrição aprovada', `O cargo de jornalista foi concedido a <@${userId}>.`)], flags: 64 }, context.logger);
    } catch (error: unknown) { await safeReply(interaction, { embeds: [errorEmbed('Não foi possível aprovar', error instanceof Error ? error.message : 'Erro desconhecido.')], flags: 64 }, context.logger); }
    return;
  }
  if (id.namespace === 'recruitment' && id.action === 'reject') {
    if (!await context.permissions.requirePermission(interaction, 'admin')) return;
    const idNumber = ticketId(id.entityId);
    if (!idNumber) return;
    await interaction.showModal(rejectionModal(idNumber));
    return;
  }
  if (id.namespace !== 'ticket') {
    await safeReply(interaction, { embeds: [errorEmbed('Ação indisponível', 'Este componente não pertence a um fluxo ativo.')], flags: 64 }, context.logger);
    return;
  }
  if (id.action === 'open' && id.entityId === 'support') {
    const menu = new StringSelectMenuBuilder().setCustomId(customId('ticket', 'category', 'support')).setPlaceholder('Escolha a categoria').addOptions({ label: 'Suporte geral', value: 'support', description: 'Dúvidas, problemas e atendimento da equipe' });
    await safeReply(interaction, { embeds: [infoEmbed('Abrir suporte', 'Escolha uma categoria para criar um canal privado.')], components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)], flags: 64 }, context.logger);
    return;
  }
  const idNumber = ticketId(id.entityId);
  if (!idNumber) return;
  const ticket = context.tickets.byId(idNumber);
  if (!ticket || !interaction.inGuild() || ticket.guildId !== interaction.guildId) {
    await safeReply(interaction, { embeds: [errorEmbed('Ticket indisponível', 'Este ticket não existe mais ou pertence a outro servidor.')], flags: 64 }, context.logger);
    return;
  }
  if (id.action === 'close') {
    if (!await context.permissions.canOperateTicket(interaction, ticket.requesterId)) return;
    await safeReply(interaction, { embeds: [warningEmbed('Confirmar encerramento', `Deseja encerrar **#${ticket.publicId}**? Esta ação é idempotente.`)], components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(customId('ticket', 'confirm-close', String(ticket.id))).setLabel('Confirmar encerramento').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(customId('ticket', 'cancel-close', String(ticket.id))).setLabel('Cancelar').setStyle(ButtonStyle.Secondary)
    )], flags: 64 }, context.logger);
    return;
  }
  if (id.action === 'cancel-close') {
    await interaction.update({ embeds: [infoEmbed('Encerramento cancelado', `O ticket **#${ticket.publicId}** continua aberto.`)], components: [] });
    return;
  }
  if (id.action === 'confirm-close') {
    if (!await context.permissions.canOperateTicket(interaction, ticket.requesterId) || !await deferEphemeral(interaction, context.logger)) return;
    try {
      const result = await context.ticketService.close(interaction.guild!, ticket.id, interaction.user.id);
      await safeReply(interaction, { embeds: [successEmbed('Ticket encerrado', result.changed ? `**#${result.ticket.publicId}** foi encerrado.` : `**#${result.ticket.publicId}** já estava encerrado.`)], flags: 64 }, context.logger);
    } catch (error: unknown) { await safeReply(interaction, { embeds: [errorEmbed('Falha ao encerrar', error instanceof Error ? error.message : 'Erro desconhecido.')], flags: 64 }, context.logger); }
    return;
  }
  if (id.action === 'call') {
    if (!await context.permissions.canOperateTicket(interaction, ticket.requesterId) || !await deferEphemeral(interaction, context.logger)) return;
    try {
      const result = await context.ticketService.autoAssign(interaction.guild!, ticket.id);
      const response = result.assignee ? successEmbed('Atendimento atribuído', `Um membro elegível foi notificado para **#${result.ticket.publicId}**.`) : warningEmbed('Equipe indisponível', 'Nenhum membro elegível está disponível; o ticket continua aberto sem responsável fictício.');
      await safeReply(interaction, { embeds: [response], flags: 64 }, context.logger);
    } catch (error: unknown) { await safeReply(interaction, { embeds: [errorEmbed('Falha na atribuição', error instanceof Error ? error.message : 'Erro desconhecido.')], flags: 64 }, context.logger); }
    return;
  }
  if (id.action === 'take') {
    if (!await context.permissions.requirePermission(interaction, 'staff') || !await deferEphemeral(interaction, context.logger)) return;
    try {
      const member = await interaction.guild!.members.fetch(interaction.user.id);
      const result = await context.ticketService.take(interaction.guild!, ticket.id, member);
      await safeReply(interaction, { embeds: [result ? successEmbed('Ticket assumido', `Você assumiu **#${result.publicId}**.`) : warningEmbed('Ticket já atribuído', 'Use Reatribuir caso uma troca seja necessária.')], flags: 64 }, context.logger);
    } catch (error: unknown) { await safeReply(interaction, { embeds: [errorEmbed('Falha ao assumir', error instanceof Error ? error.message : 'Erro desconhecido.')], flags: 64 }, context.logger); }
    return;
  }
  if (id.action === 'reassign') {
    if (!await context.permissions.requirePermission(interaction, 'staff')) return;
    const options = (await context.ticketService.eligibleStaff(interaction.guild!, ticket.requesterId)).slice(0, 25).map((member) => ({ label: member.displayName.slice(0, 100), value: member.id, description: member.user.tag.slice(0, 100) }));
    if (options.length === 0) { await safeReply(interaction, { embeds: [warningEmbed('Sem responsáveis', 'Não há membros de staff elegíveis para reatribuir este ticket.')], flags: 64 }, context.logger); return; }
    const menu = new StringSelectMenuBuilder().setCustomId(customId('ticket', 'reassign', String(ticket.id))).setPlaceholder('Escolha o novo responsável').addOptions(options);
    await safeReply(interaction, { embeds: [infoEmbed('Reatribuir ticket', 'Escolha um membro da equipe elegível.')], components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)], flags: 64 }, context.logger);
    return;
  }
  await safeReply(interaction, { embeds: [errorEmbed('Ação indisponível', 'Este botão não é reconhecido pelo bot.')], flags: 64 }, context.logger);
}
