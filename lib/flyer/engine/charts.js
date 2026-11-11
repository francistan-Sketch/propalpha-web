/* eslint-disable */
// @ts-nocheck
// Copied verbatim from mobile/src/flyer/engine (pure JavaScript, no React Native). Keep the two copies in sync.
// Inline SVG charts for flyers. Colours come from the template's CSS variables so every design keeps its palette.

// Average psf by year as a line, sales volume as faint bars behind it.
export function psfTrendChart(trend, { width = 700, height = 240 } = {}) {
  const rows = (trend || []).filter((t) => t.avg_psf > 0);
  if (rows.length < 2) return '';
  const padL = 56, padR = 20, padT = 24, padB = 36;
  const W = width - padL - padR, H = height - padT - padB;
  const psf = rows.map((r) => Number(r.avg_psf)), vol = rows.map((r) => Number(r.n || 0));
  const minP = Math.min(...psf) * 0.9, maxP = Math.max(...psf) * 1.05, maxV = Math.max(...vol, 1);
  const x = (i) => padL + (rows.length === 1 ? W / 2 : (i * W) / (rows.length - 1));
  const y = (v) => padT + H - ((v - minP) / (maxP - minP)) * H;
  const bw = Math.min(56, (W / rows.length) * 0.5);
  const bars = rows.map((r, i) => `<rect x="${x(i) - bw / 2}" y="${padT + H - (vol[i] / maxV) * H * 0.6}" width="${bw}" height="${(vol[i] / maxV) * H * 0.6}" rx="4" fill="var(--fl-accent-2, #1C9BD8)" opacity="0.14"/>`).join('');
  const path = psf.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const dots = psf.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="4.5" fill="var(--fl-accent, #5B4BE0)"/>
    <text x="${x(i)}" y="${y(v) - 11}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--fl-ink, #15122B)">$${Math.round(v).toLocaleString('en-SG')}</text>`).join('');
  const labels = rows.map((r, i) => `<text x="${x(i)}" y="${height - 12}" text-anchor="middle" font-size="12" fill="var(--fl-muted, #6B6B80)">${r.year}</text>
    <text x="${x(i)}" y="${padT + H + 2}" text-anchor="middle" font-size="9" fill="var(--fl-muted, #6B6B80)">${vol[i]} sale${vol[i] === 1 ? '' : 's'}</text>`).join('');
  const grid = [0, 0.5, 1].map((f) => { const v = minP + (maxP - minP) * f; return `<line x1="${padL}" x2="${width - padR}" y1="${y(v)}" y2="${y(v)}" stroke="var(--fl-ink, #15122B)" stroke-opacity="0.08"/>
    <text x="${padL - 8}" y="${y(v) + 4}" text-anchor="end" font-size="10" fill="var(--fl-muted, #6B6B80)">$${Math.round(v).toLocaleString('en-SG')}</text>`; }).join('');
  return `<svg class="fl-chart" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" font-family="inherit">
    <text x="${padL}" y="14" font-size="11" font-weight="800" letter-spacing="2" fill="var(--fl-accent, #5B4BE0)">AVERAGE PSF BY YEAR</text>
    ${grid}${bars}<path d="${path}" fill="none" stroke="var(--fl-accent, #5B4BE0)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>${dots}${labels}
  </svg>`;
}
