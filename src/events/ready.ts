import type { Client } from 'discord.js';
import type { AppContext } from '../types/app';

export function registerReady(client: Client, context: AppContext): void {
  client.once('clientReady', async (readyClient) => {
    context.logger.info({ userId: readyClient.user.id, guildId: context.environment.guildId }, 'Bot conectado e pronto');
    try {
      const guild = await readyClient.guilds.fetch(context.environment.guildId);
      await guild.members.fetchMe();
      const reservations = context.tickets.interruptedReservations(guild.id);
      if (reservations.length > 0) context.logger.warn({ ticketIds: reservations.map((item) => item.id) }, 'Reservas de tickets sem canal exigem revisão');
      const applications = context.recruitmentApplications.processing(guild.id);
      if (applications.length > 0) context.logger.warn({ ticketIds: applications.map((item) => item.ticketId) }, 'Inscrições em processamento exigem revisão manual');
      await context.reactionRoles.restoreIfMissing(guild.id);
      await context.ticketPanel.publish(guild).catch((error: unknown) => context.logger.warn({ err: error }, 'Painel de tickets não pôde ser recuperado'));
      context.leaderboard.startAutoRefresh(guild.id);
      if (context.config.get(guild.id, 'leaderboard_channel_id')) await context.leaderboard.refreshPanel(guild.id);
    } catch (error: unknown) {
      context.logger.error({ err: error }, 'Falha na verificação de prontidão');
    }
  });
}
