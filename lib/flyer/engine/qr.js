/* eslint-disable */
// @ts-nocheck
// Copied verbatim from mobile/src/flyer/engine (pure JavaScript, no React Native). Keep the two copies in sync.
// QR codes as inline SVG (pure JavaScript, no native module), for WhatsApp links and PropAlpha join codes.
import qrcode from './vendor/qrcode-generator';

export function qrSvg(text, className = 'fl-qr', { ecl = 'M', quiet = 2 } = {}) {
  if (!text) return '';
  const qr = qrcode(0, ecl);
  qr.addData(String(text));
  qr.make();
  const n = qr.getModuleCount();
  const size = n + quiet * 2;
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + quiet} ${r + quiet}h1v1h-1z`;
  return `<svg class="${className}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="var(--fl-ink, #15122B)"/></svg>`;
}
