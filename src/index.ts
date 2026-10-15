import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { loadEnvironment } from './config/env';
import { createLogger } from './config/logger';
import { openDatabase } from './database/connection';
import { AdminLogRepository } from './database/repositories/adminLogRepository';
import { ConfigRepository } from './database/repositories/configRepository';
import { PanelRepository } from './database/repositories/panelRepository';
import { PublicationRepository } from './database/repositories/publicationRepository';
import { RecruitmentRepository } from './database/repositories/recruitmentRepository';
import { GangRepository } from './database/repositories/gangRepository';
import { ReactionRoleRepository } from './database/repositories/reactionRoleRepository';
import { TicketRepository } from './database/repositories/ticketRepository';
import { registerInteractionCreate } from './events/interactionCreate';
import { registerReady } from './events/ready';
import { registerReactionEvents } from './events/reactions';
import { JournalService } from './services/journal';
import { LeaderboardService } from './services/leaderboard';
import { PanelService } from './services/panels';
import { PermissionService } from './services/permissions';
import { RecruitmentService } from './services/recruitment';
import { TicketService } from './services/tickets';
import { TicketPanelService } from './services/ticketPanel';
import { GangService } from './services/gangs';
import { ReactionRoleService } from './services/reactionRoles';
import { StatisticsService } from './services/statistics';
import type { AppContext } from './types/app';

async function main(): Promise<void> {
  const environment = loadEnvironment();
  const logger = createLogger(environment);
  const database = openDatabase(environment.databasePath);
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessageReactions],
    partials: [Partials.Channel, Partials.Message, Partials.Reaction, Partials.User]
  });
  const config = new ConfigRepository(database);
  const publications = new PublicationRepository(database);
  const tickets = new TicketRepository(database);
  const panels = new PanelRepository(database);
  const adminLogs = new AdminLogRepository(database);
  const recruitmentApplications = new RecruitmentRepository(database);
  const gangs = new GangRepository(database);
  const reactionRoleRules = new ReactionRoleRepository(database);
  const permissions = new PermissionService(config, environment.guildId, logger);
  const context: AppContext = {
    environment, client, database, logger, config, publications, tickets, panels, adminLogs,
    permissions,
    journal: new JournalService(config, publications, logger),
    leaderboard: new LeaderboardService(config, panels, publications, client, logger),
    ticketService: new TicketService(config, tickets, adminLogs, logger),
    ticketPanel: new TicketPanelService(config, new PanelService(panels, client)),
    panelService: new PanelService(panels, client),
    recruitment: new RecruitmentService(config, tickets, recruitmentApplications, adminLogs, logger),
    recruitmentApplications, gangs, reactionRoleRules,
    gangService: new GangService(config, gangs, adminLogs, logger),
    reactionRoles: new ReactionRoleService(reactionRoleRules, config, panels, client, logger),
    statistics: new StatisticsService()
  };
  client.on('error', (error) => logger.error({ err: error }, 'Erro do cliente Discord'));
  registerInteractionCreate(client, context);
  registerReady(client, context);
  registerReactionEvents(client, context);
  await client.login(environment.token);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
