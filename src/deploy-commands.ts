import { REST, Routes } from 'discord.js';
import { commands } from './commands';
import { loadEnvironment } from './config/env';

async function main(): Promise<void> {
  const environment = loadEnvironment();
  const rest = new REST({ version: '10' }).setToken(environment.token);
  await rest.put(Routes.applicationGuildCommands(environment.clientId, environment.guildId), { body: commands.map((command) => command.data.toJSON()) });
  console.log(`${commands.length} comandos registrados no servidor configurado.`);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
