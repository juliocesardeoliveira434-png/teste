export interface CustomId {
  readonly namespace: string;
  readonly action: string;
  readonly entityId: string;
}

const PART = /^[a-z0-9_-]{1,64}$/i;

/** Parses versioned deterministic IDs: namespace:action:entityId. */
export function parseCustomId(value: string): CustomId | null {
  if (value.length > 100) return null;
  const [namespace, action, entityId, extra] = value.split(':');
  if (extra !== undefined || !namespace || !action || !entityId) return null;
  if (!PART.test(namespace) || !PART.test(action) || !PART.test(entityId)) return null;
  return { namespace, action, entityId };
}

export function customId(namespace: string, action: string, entityId: string): string {
  const value = `${namespace}:${action}:${entityId}`;
  if (!parseCustomId(value)) throw new Error(`customId inválido: ${value}`);
  return value;
}
