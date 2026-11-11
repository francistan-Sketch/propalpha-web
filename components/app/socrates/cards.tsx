'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import TowerGrid, { TowerLegend, fmtInt, fmtMoney, towerBlocksToCsv, type TowerUnit, type TowerBlock } from '@/components/app/search/TowerGrid';
import { csvEscape, downloadText } from '@/components/app/search/ui';
import type { TableData, ChartData, TowerGridData, YieldCardData, InvestmentReturnData } from './types';

// Answer cards from the design: 16px padding, radius 16, card background, title row with
// 30/32px outline actions. Each mirrors the mobile MessageTable / MessageChart / MessageTowerGrid /
// MessageYieldCard / MessageInvestmentReturn renderers. "Save image" on mobile captures the view
// as a PNG; html-to-image is not a dependency here, so the web action is "Download CSV" and says so.

const cardStyle: CSSProperties = { border: '1px solid var(--pa-border)', borderRadius: 16, background: 'var(--pa-card)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 };
const titleRow: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' };
const noteStyle: CSSProperties = { fontSize: 11.5, color: 'var(--pa-text-3)', lineHeight: 1.45 };

function Action({ onClick, children, h = 30 }: { onClick: () => void; children: ReactNode; h?: number }) {
  return (
    <button type="button" onClick={onClick} className="pa-btn" style={{ height: h, padding: '0 12px', borderRadius: 8, border: '1px solid var(--pa-border)', background: 'transparent', color: 'var(--pa-text)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
      {children}
    </button>
  );
}

function safeName(s: string): string {
  return (s || 'socrates').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'socrates';
}

function csvOf(columns: unknown[], rows: unknown[][]): string {
  return [columns.map(csvEscape).join(','), ...rows.map((r) => r.map(csvEscape).join(','))].join('\n');
}

// ── Table ─────────────────────────────────────────────────────────────────────

function looksNumeric(v: unknown): boolean {
  if (typeof v === 'number') return true;
  if (typeof v !== 'string') return false;
  return /^\s*[$S]?\s*-?[\d,]+(\.\d+)?\s*(%|psf|M|k|sqft)?\s*$/i.test(v) && /\d/.test(v);
}

export function TableCard({ table }: { table: TableData }) {
  const [copied, setCopied] = useState(false);
  if (!table?.columns?.length || !table?.rows?.length) return null;
  const cols = table.columns;
  const numericCol = cols.map((_, ci) => table.rows.every((r) => r[ci] === null || r[ci] === undefined || r[ci] === '' || looksNumeric(r[ci])) && table.rows.some((r) => looksNumeric(r[ci])));
  const amberCol = numericCol.findIndex((n, i) => n && i > 0);

  async function copy() {
    const tsv = [cols.map((c) => String(c ?? '')).join('\t'), ...table.rows.map((r) => r.map((c) => String(c ?? '')).join('\t'))].join('\n');
    try {
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: nothing to do */
    }
  }

  const th: CSSProperties = { textAlign: 'left', padding: 8, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--pa-text-3)', borderBottom: '1px solid var(--pa-border)', fontWeight: 600, whiteSpace: 'nowrap' };

  return (
    <div style={cardStyle}>
      <div style={titleRow}>
        <strong style={{ fontSize: 14 }}>{table.title || 'Table'}</strong>
        <div style={{ display: 'flex', gap: 8 }}>
          <Action onClick={copy}>{copied ? 'Copied' : 'Copy'}</Action>
          <Action onClick={() => downloadText(`${safeName(table.title || 'table')}.csv`, csvOf(cols, table.rows))}>Download CSV</Action>
        </div>
      </div>
      <div style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr>{cols.map((c, i) => <th key={i} style={{ ...th, textAlign: numericCol[i] ? 'right' : 'left' }}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {table.rows.map((r, ri) => (
              <tr key={ri} className="pa-row">
                {cols.map((_, ci) => {
                  const v = r[ci];
                  const isNum = numericCol[ci];
                  const amber = ci === amberCol;
                  return (
                    <td key={ci} style={{ padding: '9px 8px', borderBottom: '1px solid var(--pa-border)', textAlign: isNum ? 'right' : 'left', color: ci === 0 && isNum ? 'var(--pa-text-3)' : amber ? 'var(--pa-amber)' : 'var(--pa-text)', fontWeight: amber ? 700 : 400, fontVariantNumeric: isNum ? 'tabular-nums' : undefined, whiteSpace: isNum ? 'nowrap' : undefined }}>
                      {v === null || v === undefined ? '—' : String(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span style={noteStyle}>A snapshot of PropAlpha&apos;s transaction database as at the latest URA release.</span>
    </div>
  );
}

// ── Chart ─────────────────────────────────────────────────────────────────────

const SERIES = ['var(--pa-primary)', 'var(--pa-amber)', 'var(--pa-emerald)', '#F87171'];
const hasValue = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function fmtTick(v: number): string {
  const a = Math.abs(v);
  if (a >= 1_000_000) return `${(v / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1)}M`;
  if (a >= 10_000) return `${Math.round(v / 1000)}k`;
  return Math.round(v).toLocaleString('en-SG');
}

export function ChartCard({ chart }: { chart: ChartData }) {
  if (!chart?.labels?.length || !chart?.series?.length) return null;
  const labels = chart.labels;
  const series = chart.series;
  const all = series.flatMap((s) => s.data || []).filter(hasValue);
  const dataMax = all.length ? Math.max(...all) : 0;
  const dataMin = all.length ? Math.min(...all) : 0;
  const bar = chart.type === 'bar';

  // Bars start from a true zero baseline; lines auto-scale to the data range with padding.
  let lo: number, hi: number;
  if (bar) { lo = Math.min(dataMin, 0); hi = Math.max(dataMax, 0); }
  else { const pad = (dataMax - dataMin) * 0.1 || Math.abs(dataMax || 1) * 0.1 || 1; lo = dataMin - pad; hi = dataMax + pad; }
  if (hi === lo) hi = lo + 1;

  const H = 200, PAD_L = 52, PAD_R = 12, PAD_T = 12, PAD_B = 34;
  const colW = Math.max(56, Math.min(96, Math.floor(640 / labels.length)));
  const W = PAD_L + labels.length * colW + PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const y = (v: number) => PAD_T + plotH - ((v - lo) / (hi - lo)) * plotH;
  const x = (i: number) => PAD_L + i * colW + colW / 2;
  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => lo + ((hi - lo) * i) / ticks);
  const barW = Math.max(6, Math.min(18, (colW - 10) / series.length - 2));

  const csv = csvOf(['label', ...series.map((s) => s.name)], labels.map((l, i) => [l, ...series.map((s) => s.data?.[i] ?? '')]));

  return (
    <div style={cardStyle}>
      <div style={titleRow}>
        <strong style={{ fontSize: 14 }}>{chart.title || (bar ? 'Comparison' : 'Trend')}</strong>
        <Action onClick={() => downloadText(`${safeName(chart.title || 'chart')}.csv`, csv)}>Download CSV</Action>
      </div>
      {series.length > 1 && (
        <div style={{ display: 'flex', gap: 12, fontSize: 11.5, color: 'var(--pa-text-2)', flexWrap: 'wrap' }}>
          {series.map((s, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><i aria-hidden="true" style={{ width: 10, height: 10, borderRadius: bar ? 2 : 5, background: SERIES[i % SERIES.length], display: 'inline-block' }} />{s.name}</span>
          ))}
        </div>
      )}
      <div style={{ overflow: 'auto' }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={chart.title || 'Chart'} style={{ display: 'block', maxWidth: '100%', minWidth: Math.min(W, 480) }}>
          {tickVals.map((v, i) => (
            <g key={i}>
              <line x1={PAD_L} x2={W - PAD_R} y1={y(v)} y2={y(v)} stroke="var(--pa-border)" strokeWidth={1} strokeDasharray={i === 0 && bar ? undefined : '2 4'} />
              <text x={PAD_L - 8} y={y(v) + 3.5} textAnchor="end" fontSize={10.5} fill="var(--pa-text-3)">{fmtTick(v)}</text>
            </g>
          ))}
          {labels.map((l, i) => (
            <text key={i} x={x(i)} y={H - 12} textAnchor="middle" fontSize={10.5} fill="var(--pa-text-3)">{l.length > 10 ? `${l.slice(0, 9)}…` : l}</text>
          ))}
          {bar
            ? labels.map((l, li) => (
                <g key={li}>
                  {series.map((s, si) => {
                    const v = s.data?.[li];
                    if (!hasValue(v)) return null;
                    const bx = x(li) - (series.length * (barW + 2)) / 2 + si * (barW + 2);
                    const top = Math.min(y(v), y(0)), bottom = Math.max(y(v), y(0));
                    const h = Math.max(bottom - top, 2);
                    return (
                      <rect key={si} x={bx} y={top} width={barW} height={h} rx={3} fill={SERIES[si % SERIES.length]}>
                        <title>{`${l}${series.length > 1 ? ` · ${s.name}` : ''}: ${v.toLocaleString('en-SG')}`}</title>
                      </rect>
                    );
                  })}
                </g>
              ))
            : series.map((s, si) => {
                const color = SERIES[si % SERIES.length];
                const pts = labels.map((_, li) => (hasValue(s.data?.[li]) ? { x: x(li), y: y(s.data[li] as number), v: s.data[li] as number } : null));
                const segs: string[] = [];
                let cur = '';
                pts.forEach((p) => {
                  if (!p) { if (cur) segs.push(cur); cur = ''; return; }
                  cur += `${cur ? ' L' : 'M'}${p.x} ${p.y}`;
                });
                if (cur) segs.push(cur);
                return (
                  <g key={si}>
                    {segs.map((d, i) => <path key={i} d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />)}
                    {pts.map((p, i) => p && (
                      <circle key={i} cx={p.x} cy={p.y} r={4} fill={color} stroke="var(--pa-card)" strokeWidth={2}>
                        <title>{`${labels[i]}${series.length > 1 ? ` · ${s.name}` : ''}: ${p.v.toLocaleString('en-SG')}`}</title>
                      </circle>
                    ))}
                  </g>
                );
              })}
        </svg>
      </div>
      <span style={noteStyle}>Gaps are periods with no transactions. A snapshot of PropAlpha&apos;s transaction database as at the latest URA release.</span>
    </div>
  );
}

// ── Tower grid ────────────────────────────────────────────────────────────────

export function TowerCard({ towerGrid }: { towerGrid: TowerGridData }) {
  const [sel, setSel] = useState<{ unit: TowerUnit; block: TowerBlock } | null>(null);
  const [idx, setIdx] = useState(0);
  if (!towerGrid?.blocks?.length) return null;
  const block = towerGrid.blocks[Math.min(idx, towerGrid.blocks.length - 1)];
  const floors = new Set(block.units.map((u) => u.floor).filter((f) => f !== null && f !== undefined)).size;

  return (
    <div style={cardStyle}>
      <div style={titleRow}>
        <strong style={{ fontSize: 14 }}>{towerGrid.project_name} · Tower view</strong>
        <TowerLegend />
      </div>
      <span style={{ fontSize: 12, color: 'var(--pa-text-2)' }}>
        {block.block_id ? `${block.block_id} · ` : ''}{fmtInt(block.units_sold)} sold · {floors} floors · avg ${fmtInt(block.avg_psf)} psf
      </span>
      <TowerGrid blocks={towerGrid.blocks} maxHeight={360} onUnitClick={(unit, b) => setSel({ unit, block: b })} selected={sel?.unit ?? null} blockIndex={idx} onBlockChange={(i) => { setIdx(i); setSel(null); }} />
      {sel && <UnitDetail unit={sel.unit} avgPsf={sel.block.avg_psf} onClose={() => setSel(null)} />}
      <span style={noteStyle}>Stacks across, floors down. Click a unit for its last transaction. {towerGrid.note}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <Action h={32} onClick={() => downloadText(`${safeName(towerGrid.project_name)}-tower.csv`, towerBlocksToCsv(towerGrid.project_name, towerGrid.blocks))}>Download CSV</Action>
      </div>
    </div>
  );
}

/** Last transaction for a clicked unit, inline under the grid. */
export function UnitDetail({ unit, avgPsf, onClose }: { unit: TowerUnit; avgPsf?: number | string | null; onClose: () => void }) {
  const psf = unit.psf === null || unit.psf === undefined ? null : Number(unit.psf);
  const avg = avgPsf === null || avgPsf === undefined ? null : Number(avgPsf);
  const diff = psf !== null && avg ? ((psf - avg) / avg) * 100 : null;
  const cell = (l: string, v: ReactNode, amber = false) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 90 }}>
      <span style={{ fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--pa-text-3)', fontWeight: 700 }}>{l}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: amber ? 'var(--pa-amber)' : 'var(--pa-text)', fontVariantNumeric: 'tabular-nums' }}>{v}</span>
    </div>
  );
  return (
    <div style={{ border: '1px solid var(--pa-border)', borderRadius: 12, background: 'var(--pa-bg)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <strong style={{ fontSize: 13.5 }}>{unit.unit_no || `#${unit.floor}-${unit.stack}`} · {unit.type_of_sale || 'Sale'}</strong>
        <button type="button" onClick={onClose} aria-label="Close" style={{ border: 0, background: 'transparent', color: 'var(--pa-text-2)', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}>×</button>
      </div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        {cell('Price', fmtMoney(unit.price))}
        {cell('psf', psf === null ? '—' : `$${fmtInt(psf)}`, true)}
        {cell('Area', unit.area_sqft ? `${fmtInt(unit.area_sqft)} sqft` : '—')}
        {cell('Date', unit.sale_date || '—')}
        {diff !== null && cell('vs block avg', <span style={{ color: diff >= 0 ? 'var(--pa-emerald)' : '#F87171' }}>{diff >= 0 ? '+' : '−'}{Math.abs(diff).toFixed(1)}%</span>)}
      </div>
    </div>
  );
}

// ── Yield & IRR ───────────────────────────────────────────────────────────────

function Stat({ label, value, big }: { label: string; value: ReactNode; big?: boolean }) {
  return (
    <div style={{ flex: 1, minWidth: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textAlign: 'center' }}>
      <span style={{ fontSize: big ? 30 : 18, fontWeight: 800, color: big ? 'var(--pa-amber)' : 'var(--pa-text)', fontVariantNumeric: 'tabular-nums', letterSpacing: big ? '-0.02em' : 0, lineHeight: 1.1 }}>{value}</span>
      <span style={{ fontSize: 11, color: 'var(--pa-text-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</span>
    </div>
  );
}

export function YieldCard({ yieldCard }: { yieldCard: YieldCardData }) {
  if (!yieldCard?.project_name) return null;
  const n = yieldCard.rental_sample_count || 0;
  const low = n < 5;
  const csv = csvOf(['project', 'gross_yield_pct', 'avg_monthly_rent_psf', 'avg_sale_psf', 'rental_sample_count'], [[yieldCard.project_name, yieldCard.yield_pct, yieldCard.avg_monthly_rent_psf, yieldCard.avg_sale_psf, n]]);
  return (
    <div style={cardStyle}>
      <div style={titleRow}>
        <strong style={{ fontSize: 14 }}>{yieldCard.project_name} · Rental yield</strong>
        <Action onClick={() => downloadText(`${safeName(yieldCard.project_name)}-yield.csv`, csv)}>Download CSV</Action>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '6px 0' }}>
        <Stat big label="Gross yield" value={`${yieldCard.yield_pct}%`} />
        <Stat label="Avg rent psf" value={`$${yieldCard.avg_monthly_rent_psf}`} />
        <Stat label="Avg sale psf" value={`$${fmtInt(yieldCard.avg_sale_psf)}`} />
      </div>
      <span style={noteStyle}>Based on {n} rental transaction{n === 1 ? '' : 's'} (last 12 months) against sales (last 24 months).{low ? ' Small sample — treat with caution.' : ''}</span>
    </div>
  );
}

export function InvestmentReturnCard({ ir }: { ir: InvestmentReturnData }) {
  if (!ir) return null;
  const loss = ir.irr_pct === null || ir.irr_pct === undefined;
  const csv = csvOf(
    ['irr_pct', 'equity', 'net_proceeds', 'purchase_price', 'estimated_sale_price', 'holding_years', 'loan_amount', 'total_interest_cost', 'assumed_rental_yield_pct', 'assumed_loan_interest_rate_pct'],
    [[ir.irr_pct, ir.equity, ir.net_proceeds, ir.purchase_price, ir.estimated_sale_price, ir.holding_years, ir.loan_amount, ir.total_interest_cost, ir.assumed_rental_yield_pct, ir.assumed_loan_interest_rate_pct]],
  );
  return (
    <div style={cardStyle}>
      <div style={titleRow}>
        <strong style={{ fontSize: 14 }}>Projected return</strong>
        <Action onClick={() => downloadText('projected-return.csv', csv)}>Download CSV</Action>
      </div>
      {loss ? (
        <strong style={{ fontSize: 15, color: '#F87171' }}>Loss scenario — see the note below.</strong>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '6px 0' }}>
            <Stat big label="Leveraged IRR" value={`${ir.irr_pct}%`} />
            <Stat label="Equity in" value={fmtMoney(ir.equity)} />
            <Stat label="Net proceeds" value={fmtMoney(ir.net_proceeds)} />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid var(--pa-border)', paddingTop: 10 }}>
            <Stat label="Purchase" value={fmtMoney(ir.purchase_price)} />
            <Stat label="Est. sale" value={fmtMoney(ir.estimated_sale_price)} />
            <Stat label="Holding" value={ir.holding_years !== undefined ? `${ir.holding_years} yr` : '—'} />
          </div>
        </>
      )}
      {ir.assumptions?.length ? <span style={noteStyle}>Assumptions: {ir.assumptions.join(' · ')}</span> : null}
      {ir.note && <span style={noteStyle}>{ir.note}</span>}
    </div>
  );
}
