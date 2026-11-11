// Composes the flyer HTML exactly the way mobile/src/flyer/FlyerScreen.js does (build(), withViewport(), exportPdf()),
// on top of the copied engine, so the web renders the same flyers as the app.
import { composeFlyer, titleCase, deriveNumbers, isDcTemplate as engineIsDc, composeDc, buildDcVals, LOGO_BASE64 } from './engine';
import type { FlyerAgent, FlyerCopy, FlyerOptions, FlyerPack, FlyerTemplate } from './types';

export const ASSET_BASE = 'https://propalpha-backend-production.up.railway.app/flyer-assets';
const A4_PT = { width: 595, height: 842 };   // A4 in PostScript points

export { titleCase, deriveNumbers };

/** The PropAlpha app flyer: promotes the app with the agent's details and join code, needs no estate. */
export function isAppMode(t: FlyerTemplate | null | undefined): boolean {
  return !!t && (t.mode === 'propalpha' || t.manifest?.mode === 'propalpha');
}

export function isDcTemplate(t: FlyerTemplate | null | undefined): boolean {
  return !!t && (t.dialect === 'dc' || engineIsDc(t));
}

export interface BuildInput {
  template: FlyerTemplate;        // must carry `html`
  pack: FlyerPack | null;         // null only for the app flyer
  copy: FlyerCopy;
  agent: FlyerAgent;
  opts: FlyerOptions;
  photoDataUri: string | null;
  logoDataUri: string | null;
}

/** Final flyer HTML, or '' when the inputs are not complete yet. Mirrors FlyerScreen.build(). */
export function buildFlyerHtml({ template, pack, copy, agent, opts, photoDataUri, logoDataUri }: BuildInput): string {
  if (!template.html) return '';
  const appMode = isAppMode(template);
  if (!pack && !appMode) return '';
  if (isDcTemplate(template)) {
    const { vals, media } = buildDcVals(appMode ? null : pack, copy, { ...agent, email: agent.email }, {
      tableRows: 8, qr: opts.qr, joinCode: opts.joinCode, photoDataUri: opts.photo ? photoDataUri : null,
      ctaBody: opts.analysis ? (copy.analysis || '').split(/(?<=\.)\s/).slice(0, 2).join(' ') : undefined,
    });
    return composeDc(template, vals, media, { assetBase: ASSET_BASE });
  }
  if (!pack) return '';
  const logo = opts.logo === 'propalpha' ? LOGO_BASE64 : opts.logo === 'custom' ? logoDataUri : null;
  return composeFlyer(template, pack, copy, agent, {
    chart: opts.chart, table: opts.table, analysis: opts.analysis, qr: opts.qr, joinCode: opts.joinCode,
    photoDataUri: opts.photo ? photoDataUri : null, logoDataUri: logo, tableRows: 8,
    whatsappText: `Hi ${agent.name || ''}, I saw your ${titleCase(pack.target.name)} flyer.`,
  });
}

/** Pin the layout width to the template's own pixel width (FlyerScreen's withViewport). */
export function withViewport(html: string, width: number, scale = 1): string {
  return html.replace(/<meta[^>]*name="viewport"[^>]*>/gi, '')
    .replace(/<head>/i, `<head><meta name="viewport" content="width=${width}, initial-scale=${scale}, minimum-scale=${scale}, maximum-scale=${scale}, user-scalable=no"><style>html,body{-webkit-text-size-adjust:none;text-size-adjust:none;}</style>`);
}

export function pageCount(t: FlyerTemplate): number {
  return Math.max(1, Number(t.pages) || 1);
}

/** Human label for the PDF paper the template prints to. */
export function paperLabel(t: FlyerTemplate): string {
  return t.format === 'a4' ? 'A4' : t.format === 'a4_landscape' ? 'A4 landscape, 2 sides (print both sides, fold to A5)' : 'page-sized';
}

/**
 * The flyer HTML prepared for the browser's print dialog, following FlyerScreen.exportPdf(): dc themes are laid out in mm
 * and print on A4 landscape as they are (trimmed by 1pt so WebKit does not spill a blank page after each side); classic
 * px templates are zoomed to the sheet. A script triggers print() once fonts and images have loaded.
 */
export function printableHtml(html: string, template: FlyerTemplate): string {
  const page = template.format === 'a4' ? A4_PT
    : template.format === 'a4_landscape' ? { width: A4_PT.height, height: A4_PT.width }
    : { width: Math.round(template.width_px * 0.75), height: Math.round(template.height_px * 0.75) };
  const dc = isDcTemplate(template);
  const size = dc ? 'A4 landscape' : `${page.width}pt ${page.height}pt`;
  const zoom = dc ? 1 : page.width / template.width_px;
  const trim = dc ? '.fl-page{width:297mm;height:calc(210mm - 1pt);}' : `html{zoom:${zoom};}`;
  const style = `<style>${trim} @page{margin:0;size:${size};} @media print{html,body{margin:0;}}</style>`;
  const script = '<script>window.addEventListener("load",function(){setTimeout(function(){window.print();},400);});</script>';
  return html.includes('</head>') ? html.replace('</head>', `${style}${script}</head>`) : `${style}${script}${html}`;
}

/** Opens HTML in a new tab via a Blob URL (so fonts, data URIs and the asset host all load). Returns false when blocked. */
export function openHtml(html: string): boolean {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return !!w;
}

/** Downloads text as a file (used for the composed HTML when nothing else fits). */
export function downloadText(text: string, filename: string, type = 'text/html'): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** A File from an <input type="file"> as a data URI. */
export function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/** A remote image as a data URI; falls back to the URL itself when the host does not allow cross-origin reads. */
export async function urlToDataUri(url: string): Promise<string> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return url;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}
