import { configStatusCommand, healthCommand, selectChannelCommand, selectRoleCommand } from './admin/configCommands';
import { embedJornalCommand } from './journalist/embedJornal';
import { leaderboardCommand, setupLeaderboardCommand } from './leaderboard/leaderboardCommands';
import { setupTicketsCommand } from './tickets/setupTickets';
import { setupGangsCommand } from './gangs/setupGangs';
import { setupReactionRoleCommand } from './admin/setupReactionRole';
import { serverStatsCommand, setupStatsCommand } from './statistics/statisticsCommands';
import { editButtonsCommand, editEmbedCommand } from './admin/editCommands';
import { setUpdateIntervalCommand } from './admin/updateInterval';
import type { Command } from './command';

export const commands: readonly Command[] = [
  selectChannelCommand, selectRoleCommand, configStatusCommand, healthCommand,
  embedJornalCommand, leaderboardCommand, setupLeaderboardCommand, setupTicketsCommand,
  setupGangsCommand, setupReactionRoleCommand, serverStatsCommand, setupStatsCommand, editEmbedCommand, editButtonsCommand, setUpdateIntervalCommand
];

export const commandsByName = new Map(commands.map((command) => [command.data.name, command]));
