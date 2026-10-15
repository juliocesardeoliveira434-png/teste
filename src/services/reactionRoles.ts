import { type Client, type Guild, type Message, type MessageReaction, type PartialMessage, type PartialMessageReaction, type PartialUser, type Role, type TextChannel, type User } from 'discord.js';
import type { Logger } from 'pino';
import type { ConfigRepository } from '../database/repositories/configRepository';
import type { PanelRepository } from '../database/repositories/panelRepository';
import type { ReactionRoleRepository } from '../database/repositories/reactionRoleRepository';
import { infoEmbed } from '../embeds/factory';
import { NO_MENTIONS } from '../utils/discord';

interface ReactionPanelConfig { readonly channelId: string; readonly roleId: string; readonly emoji: string; readonly message: string; readonly temporary: boolean; }
function emojiKey(reaction: MessageReaction | PartialMessageReaction): string { return reaction.emoji.id ?? reaction.emoji.name ?? ''; }

export class ReactionRoleService {
  public constructor(
    private readonly rules: ReactionRoleRepository,
    private readonly config: ConfigRepository,
    private readonly panels: PanelRepository,
    private readonly client: Client,
    private readonly logger: Logger
  ) {}

  public async publish(guild: Guild, channel: TextChannel, role: Role, emoji: string, messageText: string, temporary: boolean): Promise<void> {
    const config: ReactionPanelConfig = { channelId: channel.id, roleId: role.id, emoji, message: messageText, temporary };
    const saved = this.panels.get(guild.id, 'reaction-role');
    let message: Message<true> | null = null;
    if (saved?.channelId === channel.id) {
      try {
        const existing = await channel.messages.fetch(saved.messageId);
        if (existing.author.id === this.client.user?.id) message = await existing.edit({ embeds: [infoEmbed('Jornalista por reação', messageText)], allowedMentions: NO_MENTIONS });
      } catch { /* Missing messages are recreated below. */ }
    }
    if (!message) message = await channel.send({ embeds: [infoEmbed('Jornalista por reação', messageText)], allowedMentions: NO_MENTIONS });
    await message.react(emoji);
    this.rules.replaceJournalistRule(guild.id, channel.id, message.id, emoji, role.id, temporary);
    this.panels.upsert({ guildId: guild.id, panelType: 'reaction-role', channelId: channel.id, messageId: message.id, payload: null });
    this.config.set(guild.id, 'reaction_role_config', JSON.stringify(config));
  }

  public async restoreIfMissing(guildId: string): Promise<void> {
    const raw = this.config.get(guildId, 'reaction_role_config');
    if (!raw) return;
    let saved: ReactionPanelConfig;
    try { saved = JSON.parse(raw) as ReactionPanelConfig; }
    catch { this.logger.warn({ guildId }, 'Configuração de reaction role inválida'); return; }
    if (!saved.channelId || !saved.roleId || !saved.emoji || !saved.message) return;
    const guild = await this.client.guilds.fetch(guildId); const channel = await guild.channels.fetch(saved.channelId).catch(() => null); const role = await guild.roles.fetch(saved.roleId).catch(() => null);
    if (!channel?.isTextBased() || !('messages' in channel) || !role?.editable) return;
    const panel = this.panels.get(guildId, 'reaction-role');
    if (panel) {
      try { await (channel as TextChannel).messages.fetch(panel.messageId); return; }
      catch { /* Recreate verified missing panel. */ }
    }
    await this.publish(guild, channel as TextChannel, role, saved.emoji, saved.message, saved.temporary);
    this.logger.info({ guildId }, 'Painel de reaction role recriado');
  }

  public async onDeleted(message: Message | PartialMessage): Promise<void> {
    const full = message.partial ? await message.fetch().catch(() => null) : message;
    if (!full?.guild || full.author?.id !== this.client.user?.id) return;
    const panel = this.panels.get(full.guild.id, 'reaction-role');
    if (panel?.messageId === full.id) await this.restoreIfMissing(full.guild.id).catch((error: unknown) => this.logger.warn({ err: error }, 'Não foi possível recriar reaction role'));
  }

  public async onAdd(partial: MessageReaction | PartialMessageReaction, user: User | PartialUser): Promise<void> { await this.apply(partial, user, true); }
  public async onRemove(partial: MessageReaction | PartialMessageReaction, user: User | PartialUser): Promise<void> { await this.apply(partial, user, false); }

  private async apply(partial: MessageReaction | PartialMessageReaction, user: User | PartialUser, adding: boolean): Promise<void> {
    if (user.bot) return;
    try {
      const reaction = partial.partial ? await partial.fetch() : partial;
      const message = reaction.message.partial ? await reaction.message.fetch() : reaction.message;
      const guild = message.guild;
      if (!guild) return;
      const rule = this.rules.find(guild.id, message.id, emojiKey(reaction));
      if (!rule || (!adding && !rule.temporary)) return;
      const role = await guild.roles.fetch(rule.roleId);
      if (!role || !role.editable) { this.logger.warn({ guildId: guild.id, roleId: rule.roleId }, 'Cargo de reaction role removido ou acima da hierarquia'); return; }
      const member = await guild.members.fetch(user.id);
      if (adding) await member.roles.add(role, 'Reaction role configurada');
      else await member.roles.remove(role, 'Reaction role temporária removida');
    } catch (error: unknown) { this.logger.warn({ err: error }, 'Falha ao processar reaction role'); }
  }
}
