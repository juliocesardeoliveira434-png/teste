export function truncate(value: string, limit: number): string {
  const normalized = value.trim();
  if (normalized.length <= limit) return normalized;
  if (limit <= 1) return '…';
  return `${normalized.slice(0, limit - 1)}…`;
}

export function normalizeLabel(value: string, maxLength: number): string {
  return truncate(value.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim(), maxLength);
}
