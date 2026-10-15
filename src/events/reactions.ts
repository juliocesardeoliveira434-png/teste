import type { Client } from 'discord.js';
import type { AppContext } from '../types/app';

export function registerReactionEvents(client: Client, context: AppContext): void {
  client.on('messageReactionAdd', (reaction, user) => { void context.reactionRoles.onAdd(reaction, user); });
  client.on('messageReactionRemove', (reaction, user) => { void context.reactionRoles.onRemove(reaction, user); });
  client.on('messageDelete', (message) => { void context.reactionRoles.onDeleted(message); });
}
