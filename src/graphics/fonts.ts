import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { GlobalFonts } from '@napi-rs/canvas';

let registered = false;

export function registerProjectFont(): void {
  if (registered) return;
  const path = join(process.cwd(), 'assets', 'DejaVuSans.ttf');
  if (!existsSync(path) || !GlobalFonts.registerFromPath(path, 'Gangue Sans')) {
    throw new Error('A fonte assets/DejaVuSans.ttf é obrigatória para gerar os gráficos do bot.');
  }
  registered = true;
}
