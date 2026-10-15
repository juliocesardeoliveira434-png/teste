import pino, { type Logger } from 'pino';
import type { Environment } from './env';

export function createLogger(environment: Pick<Environment, 'logLevel'>): Logger {
  return pino({
    level: environment.logLevel,
    redact: {
      paths: ['token', 'DISCORD_TOKEN', 'authorization', 'headers.authorization'],
      censor: '[REDACTED]'
    }
  });
}
