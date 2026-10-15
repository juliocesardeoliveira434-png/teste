export function nowUtc(): string {
  return new Date().toISOString();
}

export function discordTimestamp(value: string): string {
  return `<t:${Math.floor(new Date(value).getTime() / 1000)}:f>`;
}
