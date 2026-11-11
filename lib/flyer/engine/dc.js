/* eslint-disable */
// @ts-nocheck
// Copied verbatim from mobile/src/flyer/engine (pure JavaScript, no React Native). Keep the two copies in sync.
// Claude Design ".dc.html" dialect: {{ path }} holes, <sc-for list="{{ x }}" as="r">, <sc-if value="{{ x }}">,
// <image-slot id=…>, pages as <section class="page"> inside <doc-page>, fonts/styles in <helmet>.
// This renders such a template with a view-model (see buildDcVals) into plain HTML the WebView can show.
import { qrSvg } from './qr';
import { money, moneyFull, monthYear, titleCase, formatMobile } from './compose';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function lookup(path, scopes) {
  const p = String(path).trim();
  if (p === 'true') return true;
  if (p === 'false') return false;
  for (const scope of scopes) {
    if (!scope) continue;
    let cur = scope, ok = true;
    for (const part of p.split('.')) {
      if (cur != null && Object.prototype.hasOwnProperty.call(cur, part)) cur = cur[part]; else { ok = false; break; }
    }
    if (ok) return cur;
  }
  return undefined;
}

function fill(s, scopes) {
  return s.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, p) => { const v = lookup(p, scopes); return v == null ? '' : esc(v); });
}

// Expand <sc-for>…</sc-for> and <sc-if>…</sc-if> outermost first (so an <sc-if> inside a loop sees the loop
// variable), matching each opening tag to its own closing tag even when nested; then fill {{ holes }}.
const TAG = /<(\/?)sc-(for|if)\b([^>]*)>/g;
function render(html, scopes) {
  let out = '';
  let pos = 0;
  for (;;) {
    TAG.lastIndex = pos;
    const open = TAG.exec(html);
    if (!open) break;
    if (open[1] === '/') { pos = open.index + open[0].length; continue; }   // stray close: skip
    out += fill(html.slice(pos, open.index), scopes);
    let depth = 1, close = null, m;
    TAG.lastIndex = open.index + open[0].length;
    while ((m = TAG.exec(html))) {
      if (m[1] === '/') { depth -= 1; if (depth === 0) { close = m; break; } } else depth += 1;
    }
    if (!close) { out += fill(html.slice(open.index), scopes); pos = html.length; break; }
    const inner = html.slice(open.index + open[0].length, close.index);
    const attrs = open[3];
    const attr = (n) => { const a = new RegExp(`(?:^|\\s)${n}="([^"]*)"`).exec(attrs); return a ? a[1] : ''; };
    if (open[2] === 'for') {
      const list = lookup(attr('list').replace(/[{}]/g, ''), scopes);
      const as = attr('as') || 'item';
      if (Array.isArray(list)) out += list.map((item, i) => render(inner, [{ [as]: item, $index: String(i).padStart(2, '0'), $i: i }, ...scopes])).join('');
    } else {
      const v = lookup(attr('value').replace(/[{}]/g, ''), scopes);
      if (v) out += render(inner, scopes);
    }
    pos = close.index + close[0].length;
  }
  out += fill(html.slice(pos), scopes);
  return out;
}

// <image-slot id="qr-…-front"> -> WhatsApp QR, "…-app" -> PropAlpha join QR, "…-inner" -> WhatsApp QR,
// "hero-…" -> property photo, "portrait-…" -> agent photo. The slot's own style (size, background) is kept.
function fillImageSlots(html, media) {
  return html.replace(/<image-slot\b([^>]*)>(?:[\s\S]*?<\/image-slot>)?/gi, (m, attrs) => {
    const attr = (n) => { const a = new RegExp(`(?:^|\\s)${n}="([^"]*)"`).exec(attrs); return a ? a[1] : ''; };
    const id = attr('id').toLowerCase(), style = attr('style'), shape = attr('shape'), radius = attr('radius') || '2mm';
    const rad = shape === 'circle' ? '50%' : shape === 'rounded' ? radius : '0';
    const isPhoto = /hero|photo/.test(id);
    let inner = '';
    if (/qr/.test(id)) inner = /app|join/.test(id) ? media.joinQr : media.waQr;
    // A pale scrim over the top of a photo keeps the estate label legible on dusk/dark pictures.
    else if (isPhoto) inner = media.photo ? `<img src="${media.photo}" style="width:100%;height:100%;object-fit:cover;display:block"/><div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(251,250,252,.94) 0%,rgba(251,250,252,.78) 26%,rgba(251,250,252,.25) 45%,rgba(251,250,252,0) 60%)"></div>` : '';
    else if (/portrait|agent/.test(id)) inner = media.portrait ? `<img src="${media.portrait}" style="width:100%;height:100%;object-fit:cover;display:block"/>` : '';
    const base = isPhoto && !inner ? 'background:linear-gradient(135deg,#c9bdd2,#8a7a94);' : '';
    return `<div style="${base}${style};overflow:hidden;border-radius:${rad};display:block;${isPhoto ? 'position:absolute;inset:0;' : ''}">${inner}</div>`;
  });
}

export function isDcTemplate(template) {
  return /<x-dc>/i.test(template.html || '') || (template.manifest && template.manifest.dialect === 'dc');
}

export function composeDc(template, vals, media, { assetBase = '' } = {}) {
  const src = template.html;
  const helmet = (/<helmet>([\s\S]*?)<\/helmet>/i.exec(src) || [, ''])[1]
    .replace(/<script[\s\S]*?<\/script>/gi, '').replace(/doc-page:not\(:defined\)\{visibility:hidden\}/g, '');
  const pages = [];
  const re = /<section class="page"[^>]*>([\s\S]*?)<\/section>/gi;
  let m;
  while ((m = re.exec(src))) pages.push(m[1]);
  let body = pages.map((p) => `<section class="fl-page">${fillImageSlots(render(p, [vals]), media)}</section>`).join('\n');
  if (assetBase) body = body.replace(/src="assets\//g, `src="${assetBase.replace(/\/$/, '')}/`);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>${helmet}
<style>
  * { box-sizing: border-box; } html, body { margin:0; padding:0; background:#fff; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .fl-page { width:297mm; height:210mm; overflow:hidden; page-break-after:always; position:relative; }
  .fl-page:last-child { page-break-after:auto; }
  .fl-qr { width:100%; height:100%; display:block; }
  @page { size: A4 landscape; margin: 0; }
</style></head><body>${body}</body></html>`;
}

// View-model for the dc themes, built from the flyer data pack, the copy and the agent block.
// Mirrors buildVals() in the handoff's flyer-data.js: two stat tiles, two transaction groups, an app panel.
const APP = {
  name: 'PropAlpha', headline: 'Get updated market insights anytime, anywhere.',
  sub: 'Your all-in-one platform for Singapore property market trends and insights.',
  cta: 'Download the PropAlpha app today',
  features: [
    { name: 'AI Socrates', desc: 'Ask in plain English, get tables & charts', isNew: true },
    { name: 'AI Valuation', desc: 'Instant indicative value — URA data', isNew: false },
    { name: 'Resale Market', desc: 'Most transacted & highest PSF', isNew: false },
    { name: 'Rental Yield', desc: 'Best rental returns by project', isNew: false },
    { name: 'New Launch', desc: 'Best sellers across all districts', isNew: false },
    { name: 'Maps', desc: 'Transaction pins with PSF by district', isNew: false },
  ],
};

// PropAlpha mode content (ported from the handoff's flyer-data.js) and the Lucide icon paths its dc script adds.
const PA = {
  brand: 'PropAlpha', brandLead: 'Prop', brandAccent: 'Alpha', strap: 'Property Intelligence — Reimagined',
  heroLead: 'Your', heroAccent: 'Smart', heroRest: 'Real Estate Research Companion',
  heroBody: 'The only app that ranks every Singapore district by price, PSF and rental yield — then values any unit instantly with AI. Ask Socrates in plain English, or search the classic way.',
  whyTitle: 'Only in PropAlpha',
  why: [
    { text: 'Every district ranked by price, PSF and rental yield — no other app does this.' },
    { text: 'AI Valuation: an instant indicative value for any unit, from URA data.' },
    { text: 'Tower view: see which stack and floor commands the premium, unit by unit.' },
    { text: 'Ask AI Socrates in plain English and get the chart, the numbers and the read-out.' },
  ],
  journeyTitle: 'Supports every stage of your property journey', journey: ['Research', 'Buy', 'Invest', 'Track', 'Value'],
  functionsTitle: 'Key functions & how they help you',
  functions: [
    { name: 'AI Socrates', help: 'Ask in natural language — “show me the tower view for Arina East” — and get the data, the chart and the read-out, with voice.', shot: 'assets/propalpha/02-socrates-tower.png', isNew: true },
    { name: 'District Rankings', help: 'Every district ranked by price, PSF and rental yield — resale, primary sales and rental in one hub, refreshed monthly from URA. No other app offers this.', shot: 'assets/propalpha/04-market-updates.png', isNew: false },
    { name: 'Best Buy · Investment', help: 'Top rental yields Singapore-wide over 12 or 24 months, with rent, sale PSF and transaction count per project.', shot: 'assets/propalpha/07-best-buy.png', isNew: false },
    { name: 'New Launch at a Glance', help: 'Units sold and median PSF for every launch, grouped by district and month — list or heat map.', shot: 'assets/propalpha/08-new-launch.png', isNew: false },
    { name: 'Map · District PSF', help: 'Live PSF pins across private and HDB, filtered by category and district, on a familiar map.', shot: 'assets/propalpha/09-maps-psf.png', isNew: false },
    { name: 'AI Valuation & Buyer Calculator', help: 'Instant indicative value for any address, then EC eligibility, MSR/TDSR loan cap and the full progressive payment schedule.', shot: 'assets/propalpha/05-ec-income.png', isNew: true },
  ],
  audienceTitle: 'How PropAlpha supports the property journey',
  audience: [
    { who: 'For Buyers', text: 'Compare launches and resale pricing, then check what you can actually afford.' },
    { who: 'For Sellers', text: 'See where your stack and floor sit against every transaction in the building.' },
    { who: 'For Investors', text: 'Rank districts by yield and PSF, then drill into the projects behind the numbers.' },
    { who: 'For Agents', text: 'Answer client questions on the spot with charts you can save and share.' },
  ],
  closing: 'Powered by the PropAlpha™ Analytics Backend API. Data sourced from URA, updated regularly.',
  cta: 'Download PropAlpha today', ctaSub: 'District rankings, AI Valuation and AI Socrates — intelligence no other property app gives you.',
  heroShots: ['assets/propalpha/01-welcome.png', 'assets/propalpha/02-socrates-tower.png'],
  version: 'v1.1.9', stamp: 'Nov 2026',
};
const ICONS = {
  who: ['M3 11l9-8 9 8M5 10v10h14V10', 'M20 7h-9M14 17H5M17 14l3 3-3 3M7 4l-3 3 3 3', 'M4 20V10M10 20V4M16 20v-8M22 20H2', 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75'],
  why: ['M12 2v4M4.9 4.9l2.8 2.8M2 12h4M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16M12 14l3-3', 'M3 21h18M5 21V7l7-4 7 4v14M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1', 'M3 3v18h18M7 14l4-4 4 4 5-5', 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'],
};
function paVals() {
  return {
    pa: PA, audience: PA.audience.map((a, i) => ({ ...a, d: ICONS.who[i] })), why: PA.why.map((w, i) => ({ ...w, d: ICONS.why[i] })),
    journey: PA.journey, fnLeft: PA.functions.slice(0, 3), fnRight: PA.functions.slice(3, 6), heroShot1: PA.heroShots[0], heroShot2: PA.heroShots[1],
  };
}

// Prestige reads a two-part headline: the accent is the money figure when the headline has one, else the estate.
function splitHeadline(headline, estate) {
  const h = String(headline || '').replace(/[.!]\s*$/, '');
  const m = /(S?\$[\d.,]+\s?[MmKk]?)/.exec(h);
  if (m && h.endsWith(m[1])) return { lead: h.slice(0, m.index).trim(), accent: m[1] };
  if (estate && h.toLowerCase().endsWith(estate.toLowerCase())) return { lead: h.slice(0, h.length - estate.length).trim(), accent: estate };
  const words = h.split(' ');
  return { lead: words.slice(0, -2).join(' '), accent: words.slice(-2).join(' ') };
}

// Whole sentences up to about `max` characters: the dc fronts give the intro two lines before the stat tiles.
function clip(text, max) {
  const s = String(text || '').trim();
  if (s.length <= max) return s;
  // A sentence ends at . ! or ? followed by a space or the end of the text, so "$5.10M" is not split at its point.
  const parts = [];
  let from = 0;
  for (let i = 0; i < s.length; i++) {
    if ('.!?'.includes(s[i]) && (i + 1 === s.length || /\s/.test(s[i + 1]))) { parts.push(s.slice(from, i + 1)); from = i + 1; }
  }
  if (from < s.length) parts.push(s.slice(from));
  let out = '';
  for (const p of parts) { if ((out + p).length > max) break; out += p; }
  if (out.trim()) return out.trim();
  // one long sentence: cut at a word boundary
  const cut = s.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ') > 40 ? cut.lastIndexOf(' ') : cut.length).trim() + '…';
}

export function buildDcVals(pack, copy, agent, opts = {}) {
  // PropAlpha mode has no estate; a minimal pack keeps the shared fields (agent, issue) filled.
  if (!pack) pack = { target: { name: 'PropAlpha', kind: 'landed', months: 15, tenure: '', district: null }, summary: { sales_in_window: 0, since_2y: 0, since_year: new Date().getFullYear() - 2 }, records: [], transactions: [], by_type: {}, trend: [] };
  const maxRows = Math.max(3, Math.min(10, opts.tableRows || 8));
  const estate = titleCase(pack.target.name);
  const recs = pack.records || [];
  const byPsf = [...recs].filter((r) => r.record_psf).sort((a, b) => b.record_psf - a.record_psf)[0];
  const byPrice = [...recs].filter((r) => r.record_price).sort((a, b) => b.record_price - a.record_price)[0];
  const stats = [
    byPsf ? { value: `$${byPsf.record_psf.toLocaleString('en-SG')}`, label: 'Record PSF', sub: `${byPsf.type} · ${monthYear(byPsf.record_psf_date)}` } : { value: String(pack.summary.sales_in_window), label: 'Sales', sub: `last ${pack.target.months} months` },
    byPrice ? { value: `S${money(byPrice.record_price)}`, label: 'Record price', sub: `${byPrice.type} · ${monthYear(byPrice.record_price_date)}` } : { value: String(pack.summary.since_2y), label: 'Sales', sub: `since ${pack.summary.since_year}` },
  ];
  const row = (r) => ({ street: titleCase(r.address), area: r.area_sqft ? `${r.area_sqft.toLocaleString('en-SG')} sqft` : '', price: moneyFull(r.price),
                        psf: r.psf ? `$${r.psf.toLocaleString('en-SG')}` : '', psfNum: r.psf || 0, date: monthYear(r.date), record: !!(r.record_psf || r.record_price) });
  // two groups: the two property types with most sales; a single-type target (a condo) is split into latest / earlier
  const types = Object.entries(pack.by_type || {}).filter(([, rows]) => rows && rows.length).sort((a, b) => b[1].length - a[1].length);
  let groups;
  if (types.length >= 2) groups = types.slice(0, 2).map(([type, rows]) => ({ type, rows: rows.map(row) }));
  else {
    const all = (types[0] ? types[0][1] : pack.transactions || []).map(row);
    const half = Math.ceil(all.length / 2);
    groups = [{ type: 'Latest sales', rows: all.slice(0, half) }, { type: 'Earlier sales', rows: all.slice(half) }];
  }
  const t = groups[0], s = groups[1];
  const all = [...t.rows, ...s.rows];
  const maxPsf = Math.max(...all.map((r) => r.psfNum), 1);
  const period = `the last ${pack.target.months} months`;
  const first = (agent.name || '').split(' ')[0];
  const head = splitHeadline(copy.headline || `Record prices set in ${estate}`, estate);
  const vals = {
    issue: { estate, district: pack.target.district ? `District ${pack.target.district}` : '', segment: pack.target.kind === 'condo' ? 'Condominium' : 'Landed',
             month: monthYear(new Date().toISOString()), agency: agent.agency || '', agencyShort: (agent.agency || '').split(/\s+/).map((w) => w[0]).join('').slice(0, 4).toUpperCase() || 'PA',
             source: 'URA REALIS', period, tenure: pack.target.tenure || '', disclaimer: 'For information only; not a valuation. Verify independently.' },
    agent: { name: agent.name || '', role: agent.designation || 'Resident agent', cea: agent.cea_reg_no || '', ea: agent.agent_licence || '', phone: formatMobile(agent.mobile),
             track: `${pack.summary.since_2y} sales since ${pack.summary.since_year}`, address: agent.address || agent.agency || '', joinCode: agent.join_code || '',
             email: agent.email || '', web: agent.web || (agent.join_code ? `PropAlpha join code ${agent.join_code}` : ''),
             area: pack.target.planning_area ? `${estate}, ${pack.target.planning_area}` : estate,
             tagline: opts.agentTagline || 'Local knowledge. Better possibilities.' },
    stats, stat1: stats[0], stat2: stats[1],
    groups, terraceType: t.type, semidType: s.type,
    terraceRows: t.rows.slice(0, maxRows), semidRows: s.rows.slice(0, maxRows),
    terraceCount: `${t.rows.length} transaction${t.rows.length === 1 ? '' : 's'}`, semidCount: `${s.rows.length} transaction${s.rows.length === 1 ? '' : 's'}`,
    bars: all.slice(-13).map((r) => ({ h: Math.round((r.psfNum / maxPsf) * 100), psf: r.psf, date: r.date, record: r.record, type: r.street })),
    app: APP, appFeatures: APP.features.map((f, i) => ({ ...f, num: String(i + 1).padStart(2, '0') })),
    copy: {
      tagline: (copy.taglines || [])[0] || 'Market Letter',
      headline: copy.headline || `Record prices set in ${estate}`,
      intro: clip(copy.subhead, 150),
      tableTitle: `${estate} — ${period}`,
      cta: (copy.taglines || [])[1] || `Thinking of selling in ${estate}?`,
      ctaBody: opts.ctaBody || `I track every ${estate} sale as it is lodged, so my numbers are never a guess. The figures in this letter are drawn directly from URA REALIS.`,
      contactLabel: 'Call / WhatsApp',
      headlineLead: head.lead, headlineAccent: head.accent,
      subline: opts.subline || (opts.formal ? 'Let’s talk numbers' : 'Let’s make it happen'),
      pillars: opts.pillars || (opts.formal ? ['Experience', 'Insights', 'Results'] : ['Local', 'Honest', 'Proven']),
    },
    isFormal: !!opts.formal,
    ...paVals(),
  };
  const digits = String(agent.mobile || '').replace(/\D/g, '');
  const wa = digits ? `https://wa.me/${digits.length === 8 ? '65' + digits : digits}?text=${encodeURIComponent(`Hi ${first}, I saw your ${estate} market letter.`)}` : '';
  const join = agent.join_code ? `https://propalpha.sg/join/${encodeURIComponent(agent.join_code)}` : 'https://propalpha.sg';
  const media = { waQr: opts.qr === false || !wa ? '' : qrSvg(wa, 'fl-qr'), joinQr: opts.joinCode === false ? '' : qrSvg(join, 'fl-qr'), photo: opts.photoDataUri || null, portrait: agent.photo_data_uri || null };
  return { vals, media };
}
