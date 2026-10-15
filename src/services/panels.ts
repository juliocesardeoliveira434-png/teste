import { type Client, type MessageCreateOptions, type MessageEditOptions, type TextChannel } from 'discord.js';
import type { PanelRepository } from '../database/repositories/panelRepository';
import { NO_MENTIONS } from '../utils/discord';

export class PanelService {
  public constructor(private readonly panels: PanelRepository, private readonly client: Client) {}

  /** Edits a persisted bot message whenever possible; a missing/deleted message is recreated exactly once. */
  public async publish(guildId: string, panelType: string, channel: TextChannel, options: MessageCreateOptions): Promise<string> {
    const createPayload: MessageCreateOptions = { ...options, allowedMentions: NO_MENTIONS };
    const editPayload: MessageEditOptions = { allowedMentions: NO_MENTIONS };
    if (options.embeds) editPayload.embeds = options.embeds;
    if (options.components) editPayload.components = options.components;
    if (options.files) editPayload.files = options.files;
    const saved = this.panels.get(guildId, panelType);
    if (saved?.channelId === channel.id) {
      try {
        const message = await channel.messages.fetch(saved.messageId);
        if (message.author.id === this.client.user?.id) {
          await message.edit(editPayload);
          this.panels.upsert({ guildId, panelType, channelId: channel.id, messageId: message.id, payload: null });
          return message.id;
        }
      } catch { /* Recreate only a missing/unowned persisted panel. */ }
    }
    const message = await channel.send(createPayload);
    this.panels.upsert({ guildId, panelType, channelId: channel.id, messageId: message.id, payload: null });
    return message.id;
  }
}
