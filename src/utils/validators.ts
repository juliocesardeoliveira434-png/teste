import net from 'node:net';

export interface Score {
  readonly left: number;
  readonly right: number;
  readonly display: string;
}

const INVITE = /^https:\/\/(?:www\.)?(?:discord\.gg|discord\.com\/invite)\/[A-Za-z0-9-]{2,}$/i;
const HEX = /^#?[0-9a-f]{6}$/i;

function localHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true;
  const ip = net.isIP(host);
  if (ip === 4) {
    const [a, b] = host.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b !== undefined && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  if (ip === 6) return host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80');
  return false;
}

/** Basic SSRF guard. DNS rebinding cannot be fully solved without owning the remote fetcher. */
export function validateHttpUrl(value: string, options: { readonly allowPrivateHost?: boolean } = {}): string | null {
  const raw = value.trim();
  if (!raw || raw.length > 1_500) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (url.username || url.password || (!options.allowPrivateHost && localHost(url.hostname))) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function parseScore(value: string): Score | null {
  const match = /^\s*(\d{1,3})\s*(?:x|×|-)\s*(\d{1,3})\s*$/i.exec(value);
  if (!match?.[1] || !match[2]) return null;
  const left = Number(match[1]);
  const right = Number(match[2]);
  if (!Number.isSafeInteger(left) || !Number.isSafeInteger(right)) return null;
  return { left, right, display: `${left} × ${right}` };
}

export function validateInvite(value: string): string | null {
  const normalized = value.trim();
  return INVITE.test(normalized) ? normalized : null;
}

export function parseHexColor(value: string): number | null {
  const normalized = value.trim();
  if (!HEX.test(normalized)) return null;
  return Number.parseInt(normalized.replace('#', ''), 16);
}

export function isValidDiscordSnowflake(value: string): boolean {
  return /^\d{16,22}$/.test(value);
}
