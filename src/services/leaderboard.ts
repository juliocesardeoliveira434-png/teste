import { AttachmentBuilder, type Client, type Guild, type TextChannel } from 'discord.js';
import type { Logger } from 'pino';
import type { ConfigRepository } from '../database/repositories/configRepository';
import { type PanelRecord, type PanelRepository } from '../database/repositories/panelRepository';
import type { PublicationRepository } from '../database/repositories/publicationRepository';
import { infoEmbed, mutedEmbed } from '../embeds/factory';
import { createLeaderboardImage, type LeaderboardVisualEntry } from '../graphics/leaderboard';
import { NO_MENTIONS } from '../utils/discord';

export class LeaderboardService {
  private refreshTimer: NodeJS.Timeout | null = null;

  public constructor(
    private readonly config: ConfigRepository,
    private readonly panels: PanelRepository,
    private readonly publications: PublicationRepository,
    private readonly client: Client,
    private readonly logger: Logger
  ) {}

  public async imageFor(guild: Guild): Promise<AttachmentBuilder> {
    const limit = Math.min(25, Math.max(1, Math.floor(this.config.getNumber(guild.id, 'leaderboard_limit', 10))));
    const rows = this.publications.leaderboard(guild.id, limit);
    const entries: LeaderboardVisualEntry[] = [];
    for (const row of rows) {
      try {
        const member = await guild.members.fetch(row.userId);
        entries.push({ ...row, displayName: member.displayName, avatarUrl: member.displayAvatarURL({ extension: 'png', size: 128 }) });
      } catch {
        entries.push({ ...row, displayName: `Membro indisponível (${row.userId})`, avatarUrl: null });
      }
    }
    return new AttachmentBuilder(await createLeaderboardImage(entries, new Date()), { name: 'leaderboard.png' });
  }

  public async publishOrUpdate(guild: Guild): Promise<void> {
    const channelId = this.config.get(guild.id, 'leaderboard_channel_id');
    if (!channelId) throw new Error('Configure o canal de leaderboard antes de publicar o painel.');
    const channel = await guild.channels.fetch(channelId);
    if (!channel || !channel.isTextBased() || !('send' in channel)) throw new Error('O canal configurado para leaderboard não está disponível.');
    const textChannel = channel as TextChannel;
    const attachment = await this.imageFor(guild);
    const existing = this.panels.get(guild.id, 'leaderboard');
    const payload = { embeds: [infoEmbed('Leaderboard', 'A classificação é atualizada a partir de dados persistidos.').setImage('attachment://leaderboard.png')], files: [attachment], allowedMentions: NO_MENTIONS };
    const message = await this.editExistingOrCreate(existing, textChannel, payload);
    this.panels.upsert({ guildId: guild.id, panelType: 'leaderboard', channelId: textChannel.id, messageId: message.id, payload: null });
  }

  public startAutoRefresh(guildId: string): void {
    const minutes = this.config.getNumber(guildId, 'leaderboard_interval_minutes', 0);
    if (minutes < 5 || this.refreshTimer) return;
    this.refreshTimer = setInterval(() => {
      void this.refreshPanel(guildId);
    }, minutes * 60_000);
    this.refreshTimer.unref();
  }

  public resetAutoRefresh(guildId: string): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = null;
    this.startAutoRefresh(guildId);
  }

  public async refreshPanel(guildId: string): Promise<void> {
    const guild = await this.client.guilds.fetch(guildId);
    try { await this.publishOrUpdate(guild); }
    catch (error: unknown) { this.logger.warn({ err: error, guildId }, 'Não foi possível atualizar painel de leaderboard'); }
  }

  private async editExistingOrCreate(
    existing: PanelRecord | null,
    destination: TextChannel,
    payload: { readonly embeds: ReturnType<typeof infoEmbed>[]; readonly files: AttachmentBuilder[]; readonly allowedMentions: typeof NO_MENTIONS }
  ) {
    if (existing && existing.channelId === destination.id) {
      try {
        const previous = await destination.messages.fetch(existing.messageId);
        if (previous.author.id === this.client.user?.id) return await previous.edit(payload);
      } catch (error: unknown) {
        this.logger.info({ err: error, panel: 'leaderboard' }, 'Painel persistente ausente; será recriado');
      }
    }
    return destination.send(payload);
  }

  public emptyEmbed() {
    return mutedEmbed('Leaderboard', 'Ainda não há dados suficientes. A imagem será preenchida após a primeira publicação.');
  }
}
