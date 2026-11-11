/* eslint-disable */
// @ts-nocheck
// Copied verbatim from mobile/src/flyer/engine (pure JavaScript, no React Native). Keep the two copies in sync.
// Flyer render engine: template HTML + data pack + choices -> final HTML. Pure JavaScript, no React, no network,
// so it runs in the app's WebView today and in a standalone app or a server tomorrow.
// Slot contract: backend/services/flyer/TEMPLATE_CONTRACT.md
import { psfTrendChart } from './charts';
import { qrSvg } from './qr';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const money = (n) => {
  const v = Number(n);
  if (!isFinite(v) || v <= 0) return '';
  return v >= 1e6 ? `$${(v / 1e6).toFixed(2).replace(/\.?0+$/, '')}M` : `$${Math.round(v).toLocaleString('en-SG')}`;
};
export const moneyFull = (n) => (isFinite(Number(n)) && Number(n) > 0 ? `$${Math.round(Number(n)).toLocaleString('en-SG')}` : '');
export const monthYear = (iso) => { const m = /^(\d{4})-(\d{2})/.exec(iso || ''); return m ? `${MONTHS[+m[2] - 1]} ${m[1]}` : ''; };
export const titleCase = (s) => String(s || '').toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase()).replace(/\bD(\d)/g, 'D$1');

// The three stat tiles and the hero, chosen from the pack the way the sample flyer does.
export function deriveNumbers(pack) {
  const recs = pack.records || [];
  const byPsf = [...recs].filter((r) => r.record_psf).sort((a, b) => b.record_psf - a.record_psf);
  const byPrice = [...recs].filter((r) => r.record_price).sort((a, b) => b.record_price - a.record_price);
  const latest = pack.latest;
  const stats = [];
  if (byPsf[0]) stats.push({ value: `$${byPsf[0].record_psf.toLocaleString('en-SG')}`, label: `Record psf · ${byPsf[0].type}`, sub: monthYear(byPsf[0].record_psf_date) });
  if (byPrice[0]) stats.push({ value: money(byPrice[0].record_price), label: `Record price · ${byPrice[0].type}`, sub: monthYear(byPrice[0].record_price_date) });
  stats.push({ value: String(pack.summary.since_2y || pack.summary.sales_in_window || 0), label: `Sales since ${pack.summary.since_year}`, sub: pack.target.tenure || '' });
  while (stats.length < 3) stats.push({ value: '', label: '', sub: '' });
  const hero = latest
    ? { value: money(latest.price), label: `${latest.type} · ${titleCase(latest.address)} · ${monthYear(latest.date)}` }
    : byPrice[0] ? { value: money(byPrice[0].record_price), label: `Record ${byPrice[0].type} price` } : { value: '', label: '' };
  return { stats, hero };
}

function tableHtml(pack, limitPerType = 8) {
  const groups = pack.by_type && Object.keys(pack.by_type).length ? pack.by_type : { '': pack.transactions || [] };
  return Object.entries(groups).map(([type, rows]) => {
    if (!rows || !rows.length) return '';
    const body = rows.slice(0, limitPerType).map((r) => `
      <tr class="${r.record_psf || r.record_price ? 'fl-record' : ''}">
        <td class="fl-street">${esc(titleCase(r.address))}${r.record_psf || r.record_price ? '<span class="fl-badge">RECORD</span>' : ''}</td>
        <td class="fl-area">${r.area_sqft ? `${r.area_sqft.toLocaleString('en-SG')} sqft` : ''}</td>
        <td class="fl-price">${esc(moneyFull(r.price))}</td>
        <td class="fl-psf">${r.psf ? `$${r.psf.toLocaleString('en-SG')}` : ''}</td>
        <td class="fl-date">${esc(monthYear(r.date))}</td>
      </tr>`).join('');
    return `${type ? `<h3 class="fl-table-type">${esc(type)}</h3>` : ''}
      <table class="fl-table"><thead><tr><th>Street</th><th>Area</th><th class="r">Price</th><th class="r">PSF</th><th class="r">Date</th></tr></thead><tbody>${body}</tbody></table>`;
  }).join('');
}

function propalphaHtml(agent, joinUrl) {
  if (!agent || !agent.join_code) return '';
  return `<div class="fl-propalpha">${qrSvg(joinUrl, 'fl-qr')}<div>Live data on your home, on PropAlpha.<br/>Join code <b>${esc(agent.join_code)}</b></div></div>`;
}

/**
 * @param template  { html, width_px, height_px, pages }
 * @param pack      data pack from GET /flyer/data
 * @param copy      { headline, subhead, taglines[], analysis }   (AI or the agent's own)
 * @param agent     { name, designation, agency, cea_reg_no, agent_licence, mobile, email, photo_data_uri, join_code }
 * @param opts      { chart, table, analysis, qr, joinCode, photoDataUri, logoDataUri, tableRows, whatsappText }
 */
export function composeFlyer(template, pack, copy, agent, opts = {}) {
  const { stats, hero } = deriveNumbers(pack);
  const mobileDigits = String(agent.mobile || '').replace(/\D/g, '');
  const wa = mobileDigits ? `https://wa.me/${mobileDigits.length === 8 ? '65' + mobileDigits : mobileDigits}${opts.whatsappText ? `?text=${encodeURIComponent(opts.whatsappText)}` : ''}` : '';
  const joinUrl = agent.join_code ? `https://propalpha.sg/join/${encodeURIComponent(agent.join_code)}` : '';
  const window = pack.transactions && pack.transactions.length
    ? `${monthYear(pack.transactions[pack.transactions.length - 1].date)} – ${monthYear(pack.transactions[0].date)}` : '';
  const text = {
    project: titleCase(pack.target.name), district: pack.target.district ? `D${pack.target.district}` : '', tenure: pack.target.tenure || '',
    period: window, months: String(pack.target.months || ''), month_year: monthYear(new Date().toISOString()),
    headline: copy.headline || '', subhead: copy.subhead || '',
    tagline: (copy.taglines || [])[0] || '', tagline_2: (copy.taglines || [])[1] || '', tagline_3: (copy.taglines || [])[2] || '',
    analysis: opts.analysis === false ? '' : (copy.analysis || ''),
    agent_name: agent.name || '', agent_designation: agent.designation || '', agent_agency: agent.agency || '',
    agent_cea: agent.cea_reg_no || '', agent_licence: agent.agent_licence || '', agent_mobile: formatMobile(agent.mobile), agent_email: agent.email || '',
    join_code: opts.joinCode === false ? '' : (agent.join_code || ''),
    hero_value: hero.value, hero_label: hero.label,
  };
  stats.forEach((s, i) => { text[`stat_${i + 1}_value`] = s.value; text[`stat_${i + 1}_label`] = s.label; text[`stat_${i + 1}_sub`] = s.sub; });
  const frag = {
    agent_photo: agent.photo_data_uri ? `<img class="fl-agent-photo" src="${agent.photo_data_uri}"/>` : `<div class="fl-agent-initial">${esc((agent.name || '?').trim().charAt(0).toUpperCase())}</div>`,
    logo: opts.logoDataUri ? `<img class="fl-logo" src="${opts.logoDataUri}"/>` : '',
    photo: opts.photoDataUri ? `<img class="fl-photo" src="${opts.photoDataUri}"/>` : '',
    table: opts.table === false ? '' : tableHtml(pack, opts.tableRows || 8),
    chart: opts.chart === false ? '' : psfTrendChart(pack.trend || []),
    qr: opts.qr === false || !wa ? '' : qrSvg(wa, 'fl-qr'),
    qr_join: opts.joinCode === false || !joinUrl ? '' : qrSvg(joinUrl, 'fl-qr'),
    propalpha: opts.joinCode === false ? '' : propalphaHtml(agent, joinUrl),
  };
  let html = template.html;
  // remove optional sections whose slot is empty
  html = html.replace(/<([a-z0-9]+)([^>]*)\sdata-slot="([a-z0-9_]+)"([^>]*)>([\s\S]*?)<\/\1>/gi, (m, tag, a, slot, b, inner) => {
    const v = frag[slot] !== undefined ? frag[slot] : text[slot];
    return v ? m : '';
  });
  html = html.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (m, slot) => {
    if (frag[slot] !== undefined) return frag[slot];
    if (text[slot] !== undefined) return slot === 'analysis' ? esc(text[slot]).replace(/\n+/g, '<br/>') : esc(text[slot]);
    return '';
  });
  return html;
}

export function formatMobile(m) {
  const d = String(m || '').replace(/\D/g, '').replace(/^65/, '');
  return d.length === 8 ? `${d.slice(0, 4)} ${d.slice(4)}` : String(m || '');
}
