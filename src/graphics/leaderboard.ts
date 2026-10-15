import { createCanvas, loadImage, type SKRSContext2D } from '@napi-rs/canvas';
import type { LeaderboardEntry } from '../types/domain';
import { truncate } from '../utils/text';
import { registerProjectFont } from './fonts';

export interface LeaderboardVisualEntry extends LeaderboardEntry {
  readonly displayName: string;
  readonly avatarUrl: string | null;
}

const medals = ['#f6c85f', '#b9c1cb', '#bd8250'] as const;

async function drawAvatar(context: SKRSContext2D, url: string | null, x: number, y: number, size: number): Promise<void> {
  context.save();
  context.beginPath();
  context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  context.clip();
  try {
    if (!url) throw new Error('Sem avatar');
    const image = await loadImage(url);
    context.drawImage(image, x, y, size, size);
  } catch {
    context.fillStyle = '#414b73';
    context.fillRect(x, y, size, size);
    context.fillStyle = '#cbd1ff';
    context.font = `700 ${Math.floor(size * 0.45)}px "Gangue Sans"`;
    context.textAlign = 'center';
    context.fillText('?', x + size / 2, y + size * 0.67);
  }
  context.restore();
}

export async function createLeaderboardImage(entries: readonly LeaderboardVisualEntry[], updatedAt: Date): Promise<Buffer> {
  registerProjectFont();
  const height = Math.max(330, 165 + entries.length * 86);
  const canvas = createCanvas(1000, height);
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 1000, height);
  gradient.addColorStop(0, '#111521'); gradient.addColorStop(1, '#1c2440');
  context.fillStyle = gradient; context.fillRect(0, 0, 1000, height);
  context.fillStyle = '#f6f7ff'; context.font = '700 36px "Gangue Sans"'; context.textAlign = 'left';
  context.fillText('CLASSIFICAÇÃO', 62, 70);
  context.fillStyle = '#9ca7d9'; context.font = '400 17px "Gangue Sans"';
  context.fillText('Jornalismo competitivo entre gangues', 64, 100);
  context.strokeStyle = '#5865f2'; context.lineWidth = 2; context.beginPath(); context.moveTo(62, 123); context.lineTo(938, 123); context.stroke();

  if (entries.length === 0) {
    context.fillStyle = '#bdc5ed'; context.font = '500 25px "Gangue Sans"'; context.textAlign = 'center';
    context.fillText('Nenhuma publicação pontuada ainda.', 500, 230);
  }
  for (const [index, entry] of entries.entries()) {
    const y = 145 + index * 86;
    const highlight = medals[index];
    context.fillStyle = highlight ? `${highlight}20` : '#ffffff0b';
    context.roundRect(52, y, 896, 70, 12); context.fill();
    context.fillStyle = highlight ?? '#aab3d2'; context.font = '700 25px "Gangue Sans"'; context.textAlign = 'center';
    context.fillText(`${index + 1}º`, 98, y + 45);
    await drawAvatar(context, entry.avatarUrl, 135, y + 8, 54);
    context.fillStyle = '#f5f6ff'; context.font = '600 23px "Gangue Sans"'; context.textAlign = 'left';
    context.fillText(truncate(entry.displayName, 32), 210, y + 36);
    context.fillStyle = '#aeb8df'; context.font = '400 15px "Gangue Sans"';
    context.fillText(`${entry.publications} publicação(ões)`, 210, y + 57);
    context.fillStyle = '#d9ddff'; context.font = '700 25px "Gangue Sans"'; context.textAlign = 'right';
    context.fillText(`${entry.points} pts`, 905, y + 44);
  }
  context.fillStyle = '#8690bb'; context.font = '400 13px "Gangue Sans"'; context.textAlign = 'right';
  context.fillText(`JORNAL DAS GANGUES • atualizado ${updatedAt.toISOString().replace('T', ' ').slice(0, 16)} UTC`, 938, height - 28);
  return canvas.toBuffer('image/png');
}
