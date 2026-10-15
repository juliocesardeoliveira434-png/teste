import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle, type ButtonInteraction } from 'discord.js';
import { errorEmbed, infoEmbed, successEmbed } from '../../embeds/factory';
import type { AppContext } from '../../types/app';
import { customId, type CustomId } from '../../utils/customId';
import { deferEphemeral, safeReply } from '../../utils/discord';

function positiveId(value: string): number | null { const id = Number(value); return Number.isSafeInteger(id) && id > 0 ? id : null; }
function gangModal(guildId: string): ModalBuilder {
  return new ModalBuilder().setCustomId(customId('gang', 'submit', guildId)).setTitle('Alistamento de gangue').addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('invite').setLabel('Convite Discord').setPlaceholder('https://discord.gg/exemplo').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(200)),
    new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('name').setLabel('Nome da gangue').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(80)),
    new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('role').setLabel('Nome do cargo (vazio = nome da gangue)').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(80)),
    new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('image').setLabel('URL de imagem / logo').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(1500)),
    new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('members').setLabel('Quantidade de membros').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(10))
  );
}
export async function handleGangButton(interaction: ButtonInteraction, id: CustomId, context: AppContext): Promise<void> {
  if (id.action === 'open' && id.entityId === 'add') {
    if (!interaction.inGuild()) return;
    const button = new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId(customId('gang', 'start', interaction.guildId)).setLabel('Iniciar alistamento').setStyle(ButtonStyle.Primary));
    try {
      await interaction.user.send({ embeds: [infoEmbed('Alistamento de gangue', 'Preencha o formulário. O cadastro só cria cargo depois da aprovação da equipe.')], components: [button] });
      await safeReply(interaction, { embeds: [successEmbed('Mensagem enviada', 'Enviei o início do alistamento por mensagem direta.')], flags: 64 }, context.logger);
    } catch {
      await safeReply(interaction, { embeds: [infoEmbed('DM indisponível', 'Não foi possível enviar DM. Inicie o formulário abaixo neste servidor.')], components: [button], flags: 64 }, context.logger);
    }
    return;
  }
  if (id.action === 'start') {
    const guild = await context.client.guilds.fetch(id.entityId).catch(() => null);
    if (!guild) { await safeReply(interaction, { embeds: [errorEmbed('Servidor indisponível', 'Este alistamento não está mais disponível.')], flags: 64 }, context.logger); return; }
    const member = await guild.members.fetch(interaction.user.id).catch(() => null);
    if (!member) { await safeReply(interaction, { embeds: [errorEmbed('Acesso negado', 'Você não é mais membro do servidor deste alistamento.')], flags: 64 }, context.logger); return; }
    await interaction.showModal(gangModal(guild.id));
    return;
  }
  if (id.action === 'open' && id.entityId === 'remove') {
    if (!interaction.inGuild()) return;
    const options = context.gangs.listGangs(interaction.guildId).map((gang) => ({ label: gang.name.slice(0, 100), value: String(gang.id), description: `${gang.memberCount} membro(s) declarados` }));
    if (options.length === 0) { await safeReply(interaction, { embeds: [infoEmbed('Sem gangues', 'Não há gangues cadastradas para remover.')], flags: 64 }, context.logger); return; }
    const menu = new StringSelectMenuBuilder().setCustomId(customId('gang', 'remove-select', 'v1')).setPlaceholder('Escolha a gangue').addOptions(options);
    await safeReply(interaction, { embeds: [infoEmbed('Solicitar remoção', 'Escolha a gangue e informe o motivo para análise administrativa.')], components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)], flags: 64 }, context.logger);
    return;
  }
  const requestId = positiveId(id.entityId);
  if (!requestId || !interaction.inGuild()) return;
  if (id.action === 'approve' || id.action === 'reject' || id.action === 'remove-approve' || id.action === 'remove-reject') {
    if (!await context.permissions.requirePermission(interaction, 'admin') || !await deferEphemeral(interaction, context.logger)) return;
    try {
      const reviewer = await interaction.guild!.members.fetch(interaction.user.id);
      if (id.action === 'approve') { const gang = await context.gangService.approve(interaction.guild!, requestId, reviewer); await safeReply(interaction, { embeds: [successEmbed('Gangue aprovada', `**${gang.name}** foi cadastrada e o cargo foi criado.`)], flags: 64 }, context.logger); }
      else if (id.action === 'reject') { await context.gangService.reject(interaction.guild!, requestId, reviewer); await safeReply(interaction, { embeds: [successEmbed('Solicitação recusada', 'A decisão foi persistida.')], flags: 64 }, context.logger); }
      else if (id.action === 'remove-approve') { await context.gangService.approveRemoval(interaction.guild!, requestId, reviewer); await safeReply(interaction, { embeds: [successEmbed('Remoção aprovada', 'O registro foi removido; o cargo foi preservado por padrão.')], flags: 64 }, context.logger); }
      else { await context.gangService.rejectRemoval(interaction.guild!, requestId, reviewer); await safeReply(interaction, { embeds: [successEmbed('Remoção recusada', 'O registro da gangue foi mantido.')], flags: 64 }, context.logger); }
    } catch (error: unknown) { await safeReply(interaction, { embeds: [errorEmbed('Ação não concluída', error instanceof Error ? error.message : 'Erro desconhecido.')], flags: 64 }, context.logger); }
  }
}
