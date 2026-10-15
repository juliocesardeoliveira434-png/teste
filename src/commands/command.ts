import type { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from 'discord.js';
import type { AppContext } from '../types/app';

export interface Command {
  readonly data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  readonly execute: (interaction: ChatInputCommandInteraction, context: AppContext) => Promise<void>;
}
