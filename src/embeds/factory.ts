import { EmbedBuilder } from 'discord.js';
import { BRAND, COLORS } from '../config/messages';

function base(color: number): EmbedBuilder {
  return new EmbedBuilder().setColor(color).setFooter({ text: BRAND }).setTimestamp();
}

export function successEmbed(title: string, description: string): EmbedBuilder {
  return base(COLORS.success).setTitle(`✓ ${title}`).setDescription(description);
}

export function errorEmbed(title: string, description: string): EmbedBuilder {
  return base(COLORS.danger).setTitle(`! ${title}`).setDescription(description);
}

export function infoEmbed(title: string, description: string): EmbedBuilder {
  return base(COLORS.accent).setTitle(title).setDescription(description);
}

export function warningEmbed(title: string, description: string): EmbedBuilder {
  return base(COLORS.warning).setTitle(`⚠ ${title}`).setDescription(description);
}

export function mutedEmbed(title: string, description: string): EmbedBuilder {
  return base(COLORS.neutral).setTitle(title).setDescription(description);
}
