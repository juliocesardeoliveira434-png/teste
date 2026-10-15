import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  InteractionReplyOptions,
  ModalSubmitInteraction,
  RepliableInteraction,
  StringSelectMenuInteraction
} from 'discord.js';
import type { Logger } from 'pino';
import { errorEmbed } from '../embeds/factory';

export const NO_MENTIONS = { parse: [] as const, repliedUser: false };
export type SupportedInteraction = RepliableInteraction | ChatInputCommandInteraction | ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction;

function discordErrorCode(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'number') return error.code;
  return undefined;
}

/** Replies at most once and deliberately ignores expired/already-acknowledged Discord interactions. */
export async function safeReply(interaction: SupportedInteraction, options: InteractionReplyOptions, logger: Logger): Promise<void> {
  try {
    const payload: InteractionReplyOptions = { ...options, allowedMentions: NO_MENTIONS };
    if (interaction.deferred) {
      const { flags, ...editOptions } = payload;
      void flags;
      await interaction.editReply(editOptions);
    } else if (interaction.replied) await interaction.followUp(payload);
    else await interaction.reply(payload);
  } catch (error: unknown) {
    const code = discordErrorCode(error);
    if (code === 10062 || code === 40060) {
      logger.warn({ code, interactionId: interaction.id }, 'Interação expirada ou já reconhecida');
      return;
    }
    logger.error({ err: error, interactionId: interaction.id }, 'Falha ao responder interação');
  }
}

export async function deferEphemeral(interaction: RepliableInteraction, logger: Logger): Promise<boolean> {
  try {
    if (!interaction.deferred && !interaction.replied) await interaction.deferReply({ flags: 64 });
    return true;
  } catch (error: unknown) {
    const code = discordErrorCode(error);
    logger[code === 10062 || code === 40060 ? 'warn' : 'error']({ err: error, code }, 'Não foi possível reconhecer interação');
    return false;
  }
}

export async function respondUnexpected(interaction: SupportedInteraction, logger: Logger): Promise<void> {
  await safeReply(interaction, { embeds: [errorEmbed('Erro interno', 'Não foi possível concluir a ação. Tente novamente em alguns instantes.')], flags: 64 }, logger);
}
