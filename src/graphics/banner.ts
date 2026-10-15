import { createCanvas } from '@napi-rs/canvas';
import { normalizeLabel } from '../utils/text';
import { registerProjectFont } from './fonts';

export interface BannerData {
  readonly gangOne: string;
  readonly score: string;
  readonly gangTwo: string;
  readonly publicationId: string;
}

export function createJournalBanner(data: BannerData): Buffer {
  registerProjectFont();
  const canvas = createCanvas(1200, 400);
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 1200, 400);
  gradient.addColorStop(0, '#101522');
  gradient.addColorStop(0.5, '#1f2948');
  gradient.addColorStop(1, '#101522');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1200, 400);

  context.globalAlpha = 0.32;
  context.fillStyle = '#5865f2';
  context.beginPath();
  context.arc(90, 80, 175, 0, Math.PI * 2);
  context.arc(1110, 330, 210, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;

  context.strokeStyle = '#5865f2';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(85, 45); context.lineTo(1115, 45);
  context.moveTo(85, 355); context.lineTo(1115, 355);
  context.stroke();

  context.fillStyle = '#b8c1ff';
  context.font = '500 17px "Gangue Sans"';
  context.textAlign = 'center';
  context.fillText(`PUBLICAÇÃO #${data.publicationId}`, 600, 82);

  context.fillStyle = '#f7f8ff';
  context.font = '700 42px "Gangue Sans"';
  context.textAlign = 'right';
  context.fillText(normalizeLabel(data.gangOne, 24), 470, 215);
  context.textAlign = 'left';
  context.fillText(normalizeLabel(data.gangTwo, 24), 730, 215);

  context.fillStyle = '#5865f2';
  context.roundRect(505, 135, 190, 110, 18);
  context.fill();
  context.fillStyle = '#ffffff';
  context.font = '700 44px "Gangue Sans"';
  context.textAlign = 'center';
  context.fillText(data.score, 600, 204);

  context.fillStyle = '#aab2d5';
  context.font = '400 15px "Gangue Sans"';
  context.fillText('JORNAL DAS GANGUES', 600, 326);
  return canvas.toBuffer('image/png');
}
