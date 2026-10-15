import { describe, expect, it } from 'vitest';
import { parseCustomId } from '../../src/utils/customId';
import { parseHexColor, parseScore, validateHttpUrl, validateInvite } from '../../src/utils/validators';
import { truncate } from '../../src/utils/text';

describe('validadores de entrada', () => {
  it('normaliza placares aceitos', () => {
    expect(parseScore('3 x 1')).toEqual({ left: 3, right: 1, display: '3 × 1' });
    expect(parseScore('03-01')?.display).toBe('3 × 1');
    expect(parseScore('3 contra 1')).toBeNull();
  });
  it('aceita somente URLs HTTP(S) públicas', () => {
    expect(validateHttpUrl('https://exemplo.com/imagem.png')).toBe('https://exemplo.com/imagem.png');
    expect(validateHttpUrl('file:///etc/passwd')).toBeNull();
    expect(validateHttpUrl('http://127.0.0.1/a')).toBeNull();
    expect(validateHttpUrl('http://192.168.1.10/a')).toBeNull();
  });
  it('valida convite e cor hex', () => {
    expect(validateInvite('https://discord.gg/MinhaGangue')).toBe('https://discord.gg/MinhaGangue');
    expect(validateInvite('https://example.com/a')).toBeNull();
    expect(parseHexColor('#5865F2')).toBe(0x5865f2);
    expect(parseHexColor('#fff')).toBeNull();
  });
  it('trunca sem exceder o limite', () => {
    expect(truncate('abcdef', 4)).toBe('abc…');
    expect(truncate('abc', 4)).toBe('abc');
  });
});

describe('custom IDs', () => {
  it('aceita o formato namespace:ação:entidade', () => expect(parseCustomId('ticket:close:127')).toEqual({ namespace: 'ticket', action: 'close', entityId: '127' }));
  it('rejeita partes extras e IDs longos', () => {
    expect(parseCustomId('ticket:close:1:extra')).toBeNull();
    expect(parseCustomId(`a:b:${'c'.repeat(99)}`)).toBeNull();
  });
});
