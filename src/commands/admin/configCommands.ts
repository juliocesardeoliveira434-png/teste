import {
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  PermissionFlagsBits,
  RoleSelectMenuBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction
} from 'discord.js';
import { CHANNEL_FUNCTIONS, P0_CONFIG, ROLE_FUNCTIONS, channelFunction, roleFunction } from '../../config/serverConfig';
import { COPY } from '../../config/messages';
import { errorEmbed, infoEmbed, successEmbed, warningEmbed } from '../../embeds/factory';
import type { AppContext } from '../../types/app';
import { customId } from '../../utils/customId';
import { safeReply } from '../../utils/discord';
import type { Command } from '../command';

const selectChannelData = new SlashCommandBuilder().setName('select_channel').setDescription('Configura um canal ou categoria do bot.')
  .addStringOption((option) => option.setName('funcao').setDescription('Função do destino').setRequired(true)
    .addChoices(...CHANNEL_FUNCTIONS.map((item) => ({ name: item.label, value: item.value }))));
const selectRoleData = new SlashCommandBuilder().setName('select_role').setDescription('Configura um cargo autorizado.')
  .addStringOption((option) => option.setName('funcao').setDescription('Função do cargo').setRequired(true)
    .addChoices(...ROLE_FUNCTIONS.map((item) => ({ name: item.label, value: item.value }))));

export const selectChannelCommand: Command = {
  data: selectChannelData,
  async execute(interaction, context) {
    if (!await context.permissions.requirePermission(interaction, 'admin')) return;
    const selected = channelFunction(interaction.options.getString('funcao', true));
    if (!selected) {
      await safeReply(interaction, { embeds: [errorEmbed('Função inválida', 'Escolha uma das funções disponíveis no comando.')], flags: 64 }, context.logger);
      return;
    }
    const menu = new ChannelSelectMenuBuilder().setCustomId(customId('config', 'channel', selected.value)).setPlaceholder('Selecione o destino')
      .setChannelTypes([...selected.channelTypes]).setMinValues(1).setMaxValues(1);
    await safeReply(interaction, {
      embeds: [infoEmbed('Selecionar canal', `${COPY.selectAChannel}\nFunção: **${selected.label}**.`)],
      components: [new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(menu)], flags: 64
    }, context.logger);
  }
};

export const selectRoleCommand: Command = {
  data: selectRoleData,
  async execute(interaction, context) {
    if (!await context.permissions.requirePermission(interaction, 'admin')) return;
    const selected = roleFunction(interaction.options.getString('funcao', true));
    if (!selected) {
      await safeReply(interaction, { embeds: [errorEmbed('Função inválida', 'Escolha uma das funções disponíveis no comando.')], flags: 64 }, context.logger);
      return;
    }
    const menu = new RoleSelectMenuBuilder().setCustomId(customId('config', 'role', selected.value)).setPlaceholder('Selecione o cargo').setMinValues(1).setMaxValues(1);
    await safeReply(interaction, {
      embeds: [infoEmbed('Selecionar cargo', `${COPY.selectARole}\nFunção: **${selected.label}**.`)],
      components: [new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(menu)], flags: 64
    }, context.logger);
  }
};

export const configStatusCommand: Command = {
  data: new SlashCommandBuilder().setName('config_status').setDescription('Mostra configurações concluídas e pendentes.'),
  async execute(interaction: ChatInputCommandInteraction, context: AppContext) {
    if (!await context.permissions.requirePermission(interaction, 'admin')) return;
    const values = context.config.all(interaction.guildId!);
    const fields = P0_CONFIG.map((item) => {
      const value = values.get(item.key);
      const shown = item.key === 'staff_role_ids' ? (() => {
        try { return (JSON.parse(value ?? '[]') as string[]).map((id) => `<@&${id}>`).join(', ') || '— pendente'; } catch { return '— inválido'; }
      })() : value ? (item.key.endsWith('_id') ? `<#${value}>` : value) : '— pendente';
      return { name: value ? `✓ ${item.label}` : `! ${item.label}`, value: shown, inline: false };
    });
    await safeReply(interaction, { embeds: [infoEmbed('Status da configuração', 'Itens pendentes impedem apenas os fluxos que dependem deles.').addFields(fields)], flags: 64 }, context.logger);
  }
};

export const healthCommand: Command = {
  data: new SlashCommandBuilder().setName('health').setDescription('Verifica banco, canais configurados e permissões do bot.'),
  async execute(interaction, context) {
    if (!await context.permissions.requirePermission(interaction, 'admin')) return;
    const guild = interaction.guild!;
    const checks: string[] = [];
    try { context.database.prepare('SELECT 1 AS ok').get(); checks.push('✓ SQLite acessível (WAL ativo).'); }
    catch { checks.push('! SQLite indisponível.'); }
    const bot = guild.members.me;
    checks.push(bot?.permissions.has(PermissionFlagsBits.SendMessages) ? '✓ Bot pode enviar mensagens no servidor.' : '! Bot sem permissão global para enviar mensagens.');
    for (const item of P0_CONFIG) {
      const value = context.config.get(guild.id, item.key);
      if (!value || !item.key.endsWith('_id')) continue;
      if (item.key === 'admin_role_id' || item.key === 'journalist_role_id' || item.key === 'staff_role_ids') continue;
      const channel = await guild.channels.fetch(value).catch(() => null);
      checks.push(channel ? `✓ ${item.label} acessível.` : `! ${item.label} foi removido ou não está acessível.`);
    }
    await safeReply(interaction, { embeds: [checks.some((value) => value.startsWith('!')) ? warningEmbed('Health', checks.join('\n')) : successEmbed('Health', `${COPY.healthOk}\n${checks.join('\n')}`)], flags: 64 }, context.logger);
  }
};
