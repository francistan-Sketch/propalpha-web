import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** Theme gallery entry: the design's label (`t`), size label (`k`) and CSS aspect ratio (`ar`), plus the preview file if it exists. */
export type ThemeTile = { slug: string; t: string; k: string; ar: string; src: string | null };

/** Shape of /public/site/themes/index.json, produced by another process. */
type IndexEntry = { slug: string; name?: string; format?: string; width?: number; height?: number; file?: string };

// The design's static list, in its order, keyed to the preview slugs.
const DESIGN_THEMES: { slug: string; t: string; k: string; ar: string }[] = [
  { slug: 'letter-modernist', t: 'Modernist', k: 'A4', ar: '1/1.414' },
  { slug: 'letter-broadsheet', t: 'Broadsheet', k: 'A4', ar: '1/1.414' },
  { slug: 'letter-ledger', t: 'Ledger', k: 'A4', ar: '1/1.414' },
  { slug: 'letter-poster', t: 'Poster', k: 'A4', ar: '1/1.414' },
  { slug: 'letter-estate', t: 'Estate', k: 'A4', ar: '1/1.414' },
  { slug: 'letter-prestige', t: 'Prestige', k: 'A4', ar: '1/1.414' },
  { slug: 'social-portrait', t: 'Social Portrait', k: '4:5', ar: '4/5' },
  { slug: 'social-landscape', t: 'Social Landscape', k: '16:9', ar: '16/9' },
  { slug: 'market-letter-a4', t: 'A4 Market Letter', k: 'A4', ar: '1/1.414' },
  { slug: 'propalpha-app', t: 'PropAlpha App Flyer', k: 'A4', ar: '1/1.414' },
];

const THEMES_DIR = path.join(process.cwd(), 'public', 'site', 'themes');

function readIndex(): Map<string, IndexEntry> {
  const map = new Map<string, IndexEntry>();
  try {
    const file = path.join(THEMES_DIR, 'index.json');
    if (!existsSync(file)) return map;
    const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'));
    const list = Array.isArray(parsed) ? parsed : Array.isArray((parsed as { themes?: unknown })?.themes) ? (parsed as { themes: unknown[] }).themes : [];
    for (const e of list) {
      if (e && typeof e === 'object' && typeof (e as IndexEntry).slug === 'string') map.set((e as IndexEntry).slug, e as IndexEntry);
    }
  } catch {
    // malformed index: fall back to the static list
  }
  return map;
}

/**
 * Build-time list of the ten theme tiles in the design's order. A tile gets `src` only when its preview PNG
 * exists under /public/site/themes (named in index.json, or `<slug>.png`); otherwise the well renders empty.
 */
export function loadThemes(): ThemeTile[] {
  const index = readIndex();
  return DESIGN_THEMES.map((d) => {
    const entry = index.get(d.slug);
    const fileName = entry?.file ? path.basename(entry.file) : `${d.slug}.png`;
    const exists = existsSync(path.join(THEMES_DIR, fileName));
    return { ...d, src: exists ? `/site/themes/${fileName}` : null };
  });
}
