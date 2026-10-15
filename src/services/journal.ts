import { AttachmentBuilder, EmbedBuilder, PermissionFlagsBits, type Guild, type TextChannel } from 'discord.js';
import type { Logger } from 'pino';
import { COPY } from '../config/messages';
import type { ConfigRepository } from '../database/repositories/configRepository';
import type { PublicationRepository } from '../database/repositories/publicationRepository';
import { createJournalBanner } from '../graphics/banner';
import type { PublicationInput } from '../types/domain';
import { discordTimestamp } from '../utils/time';
import { NO_MENTIONS } from '../utils/discord';

export class JournalService {
  public constructor(
    private readonly config: ConfigRepository,
    private readonly publications: PublicationRepository,
    private readonly logger: Logger
  ) {}

  public async publish(guild: Guild, input: Omit<PublicationInput, 'points'>): Promise<{ readonly publicId: string; readonly points: number }> {
    const channelId = this.config.get(guild.id, 'publications_channel_id');
    if (!channelId) throw new Error(COPY.notConfigured('canal de publicações'));
    const channel = await guild.channels.fetch(channelId);
    if (!channel || !channel.isTextBased() || !('send' in channel)) throw new Error('O canal de publicações não existe ou não aceita mensagens.');
    const bot = guild.members.me;
    if (!bot || !channel.permissionsFor(bot).has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles])) {
      throw new Error(COPY.missingPermission('Ver Canal, Enviar Mensagens e Anexar Arquivos no canal de publicações'));
    }
    const points = Math.max(0, Math.floor(this.config.getNumber(guild.id, 'publication_points', 1)));
    const draft = this.publications.createDraft({ ...input, points });
    try {
      const embed = this.publicationEmbed(draft.publicId, input);
      const files = input.imageUrl ? [] : [new AttachmentBuilder(createJournalBanner({
        gangOne: input.gangOne, gangTwo: input.gangTwo, score: input.score, publicationId: draft.publicId
      }), { name: `jornal-${draft.publicId}.png` })];
      if (input.imageUrl) embed.setImage(input.imageUrl);
      else embed.setImage(`attachment://jornal-${draft.publicId}.png`);
      const message = await (channel as TextChannel).send({ embeds: [embed], files, allowedMentions: NO_MENTIONS });
      if (!this.publications.finalizeDraft(draft.id, channel.id, message.id, points, input.authorId)) {
        this.logger.error({ publicationId: draft.publicId }, 'Publicação entregue mas não pôde ser finalizada no banco');
        throw new Error('A publicação foi enviada, mas a confirmação de persistência falhou. Não reenvie; a equipe deve verificar o log.');
      }
      return { publicId: draft.publicId, points };
    } catch (error: unknown) {
      this.publications.failDraft(draft.id, error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    }
  }

  private publicationEmbed(publicId: string, input: Omit<PublicationInput, 'points'>): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`Jornal | #${publicId}`)
      .setURL(input.headlineUrl)
      .setDescription('Uma nova cobertura competitiva foi publicada.')
      .addFields(
        { name: 'Gangue 1', value: input.gangOne, inline: true },
        { name: 'Placar', value: `**${input.score}**`, inline: true },
        { name: 'Gangue 2', value: input.gangTwo, inline: true },
        { name: 'Jornalista', value: `<@${input.authorId}>`, inline: true },
        { name: 'Publicado em', value: discordTimestamp(new Date().toISOString()), inline: true }
      )
      .setFooter({ text: 'Jornal das Gangues' })
      .setTimestamp();
  }
}
