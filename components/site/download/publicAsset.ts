import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Build-time check for an optional file under /public (QR codes, showcase screenshots, theme previews
 * that another process produces). Server components only. `publicPath` is the URL path, e.g. "/site/qr/play.png".
 */
export function publicFileExists(publicPath: string): boolean {
  try {
    return existsSync(path.join(process.cwd(), 'public', publicPath));
  } catch {
    return false;
  }
}
