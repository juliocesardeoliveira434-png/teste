import 'dotenv/config';
import { resolve } from 'node:path';

export interface Environment {
  readonly token: string;
  readonly clientId: string;
  readonly guildId: string;
  readonly databasePath: string;
  readonly logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error';
}

const LOG_LEVELS = new Set<Environment['logLevel']>(['trace', 'debug', 'info', 'warn', 'error']);

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}. Preencha o arquivo .env conforme o .env.example.`);
  return value;
}

/** Validates configuration before network/database work so deployment errors are actionable. */
export function loadEnvironment(): Environment {
  const requestedLevel = process.env.LOG_LEVEL?.trim().toLowerCase() ?? 'info';
  if (!LOG_LEVELS.has(requestedLevel as Environment['logLevel'])) {
    throw new Error('LOG_LEVEL inválido. Use trace, debug, info, warn ou error.');
  }
  return {
    token: required('DISCORD_TOKEN'),
    clientId: required('CLIENT_ID'),
    guildId: required('GUILD_ID'),
    databasePath: resolve(process.cwd(), process.env.DATABASE_PATH?.trim() || './data/bot.sqlite'),
    logLevel: requestedLevel as Environment['logLevel']
  };
}
