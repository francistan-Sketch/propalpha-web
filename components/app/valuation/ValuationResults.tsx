'use client';

import type { CSSProperties, ReactNode } from 'react';
import { type GridResult, type ValuationForm, type ValuationResult, money, moneyFull, moneyShort, mult, parsePct, pct } from '@/lib/valuation';

// Right-hand column of the Income Valuation tool, from the design's #valuation screen: Valuation (amber)
// and Returns (emerald) cards, the 6-column sensitivity grid with the base cell in primary, cash flows,
// "Generate PDF report" and the disclaimer. States: results / empty / calculating / error.

export type ResultsStatus = 'empty' | 'calculating' | 'results' | 'error';

const card: CSSProperties = { border: '1px solid var(--pa-border)', borderRadius: 16, background: 'var(--pa-card)', padding: 18, display: 'flex', flexDirection: 'column', gap: 10 };
const kicker: CSSProperties = { fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--pa-text-3)', fontWeight: 800 };
const note: CSSProperties = { fontSize: 11.5, color: 'var(--pa-text-3)' };

function Row({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, borderTop: '1px solid var(--pa-border)', paddingTop: 8 }}>
      <span style={{ fontSize: 13, color: 'var(--pa-text-2)' }}>{label}</span>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
        <strong style={{ fontSize: 17, color, fontVariantNumeric: 'tabular-nums' }}>{value}</strong>
        {sub && <span style={{ fontSize: 11, color: 'var(--pa-text-3)', whiteSpace: 'nowrap' }}>{sub}</span>}
      </span>
    </div>
  );
}

/** 6-column grid: a corner label, five column heads, then five rows of label + five cells. Base cell in primary. */
function SensGrid({ title, caption, grid, rowLabel, baseRow, baseCol, fmtRow, fmtCol, fmtCell }: {
  title: string; caption: string; grid: GridResult; rowLabel: string; baseRow: number; baseCol: number;
  fmtRow: (r: number) => string; fmtCol: (c: number) => string; fmtCell: (v: number | null) => string;
}) {
  const cell = (v: ReactNode, opts: { head?: boolean; base?: boolean; key: string }) => (
    <div key={opts.key} style={{
      padding: '8px 6px', borderRadius: 6, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      background: opts.base ? 'var(--pa-primary)' : opts.head ? 'transparent' : 'var(--pa-bg)',
      color: opts.base ? '#fff' : opts.head ? 'var(--pa-text-3)' : 'var(--pa-text)', fontWeight: opts.base ? 800 : opts.head ? 700 : 400,
    }}>{v}</div>
  );
  return (
    <div style={{ ...card, gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <span style={kicker}>{title}</span>
        <span style={note}>{caption}</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 4, fontSize: 12, fontVariantNumeric: 'tabular-nums', minWidth: 420 }}>
          {cell(rowLabel, { head: true, key: 'corner' })}
          {grid.cols.map((c, j) => cell(fmtCol(c), { head: true, key: `h${j}` }))}
          {grid.rows.map((r, i) => [
            cell(fmtRow(r), { head: true, key: `r${i}` }),
            ...grid.cells[i].map((v, j) => cell(fmtCell(v), { base: i === baseRow && j === baseCol, key: `c${i}-${j}` })),
          ])}
        </div>
      </div>
    </div>
  );
}

export function ValuationResults({ status, result, form, errorMessage, stale, onPrint }: {
  status: ResultsStatus;
  result: ValuationResult | null;
  form: ValuationForm;
  errorMessage?: string;
  /** Inputs changed since the last run. */
  stale?: boolean;
  onPrint: () => void;
}) {
  if (status === 'empty') {
    return (
      <div style={{ padding: '56px 24px', border: '1px dashed var(--pa-border)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
        <strong style={{ fontSize: 16 }}>Enter the property details to value it.</strong>
        <span style={{ fontSize: 13.5, color: 'var(--pa-text-2)', maxWidth: 360 }}>Direct capitalisation, DCF, IRR, equity multiple and a sensitivity table will appear here.</span>
      </div>
    );
  }

  if (status === 'calculating') {
    return (
      <div aria-busy="true" aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="pa-4col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="pa-pulse" style={{ height: 170, borderRadius: 16, background: 'var(--pa-card)', border: '1px solid var(--pa-border)' }} />
          <div className="pa-pulse" style={{ height: 170, borderRadius: 16, background: 'var(--pa-card)', border: '1px solid var(--pa-border)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--pa-text-2)' }}>
          <span className="pa-spin" aria-hidden="true" style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--pa-border)', borderTopColor: 'var(--pa-text-2)' }} />
          Calculating…
        </div>
      </div>
    );
  }

  if (status === 'error' || !result) {
    return (
      <div role="alert" style={{ padding: '16px 18px', borderRadius: 14, border: '1px solid rgba(248,113,113,.5)', background: 'rgba(248,113,113,.1)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <strong style={{ fontSize: 14.5, color: '#F87171' }}>Check the highlighted field.</strong>
        <span style={{ fontSize: 13.5, color: 'var(--pa-text-2)' }}>{errorMessage || 'An input is missing before the valuation can run.'}</span>
      </div>
    );
  }

  const inv = result.invest;
  const lev = inv?.levered;
  const capBase = result.capGrid ? result.capGrid.rows.findIndex((r) => Math.abs(r - parsePct(form.cap)) < 1e-9) : -1;
  const exitBase = result.irrGrid ? result.irrGrid.rows.findIndex((r) => Math.abs(r - parsePct(form.exitCap)) < 1e-9) : -1;
  const flows = result.dcf?.flows ?? [];
  const today = new Date().toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' });

  const assumptions: [string, string][] = [
    ['Asset class', form.asset.charAt(0).toUpperCase() + form.asset.slice(1)],
    ['Net operating income', moneyFull(result.noi)],
    ['Cap rate', `${form.cap}%`],
    ['NOI growth p.a.', `${form.growth || '0'}%`],
    ['Holding period', `${result.years} years`],
    ['Discount rate', `${form.discount}%`],
    ['Exit cap rate', `${form.exitCap}%`],
    ['Sale costs', `${form.saleCost || '0'}%`],
    ['Remaining lease', result.remainingLease ? `${result.remainingLease} years` : 'Freehold / not applicable'],
    ['Purchase price', result.price != null ? `${moneyFull(result.price)}${result.priceIsAuto ? ' (direct cap value)' : ''}` : '—'],
    ['Acquisition costs (estimate)', `${form.acq || '0'}%`],
  ];
  if (lev) assumptions.push(['Loan-to-value', `${form.ltv}%`], ['Interest rate', `${form.loanRate}% p.a.`], ['Loan tenure', `${form.loanYears} years`], ['Repayment', form.interestOnly ? 'Interest only' : 'Principal and interest']);

  return (
    <div id="pa-valuation-report" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Print-only header: everything a reader needs when the shell and the inputs are hidden. */}
      <div className="pa-print-only" style={{ display: 'none', flexDirection: 'column', gap: 6, paddingBottom: 12, borderBottom: '1px solid var(--pa-border)' }}>
        <strong style={{ fontSize: 20 }}>PropAlpha · Income Valuation Report</strong>
        <span style={{ fontSize: 13 }}>{form.name || 'Untitled property'}{form.preparedFor ? ` · Prepared for ${form.preparedFor}` : ''} · {today}</span>
        <span style={{ fontSize: 12, color: 'var(--pa-text-2)' }}>{assumptions.map(([k, v]) => `${k}: ${v}`).join(' · ')}</span>
      </div>

      {stale && (
        <div className="pa-no-print" style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid color-mix(in srgb, var(--pa-amber) 50%, transparent)', background: 'color-mix(in srgb, var(--pa-amber) 10%, transparent)', fontSize: 12.5 }}>
          Inputs changed since this run. Press Calculate to refresh.
        </div>
      )}

      {result.warnings.map((w, i) => (
        <div key={i} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid color-mix(in srgb, var(--pa-amber) 50%, transparent)', background: 'color-mix(in srgb, var(--pa-amber) 10%, transparent)', fontSize: 12.5, color: 'var(--pa-text)' }}>{w}</div>
      ))}

      <div className="pa-4col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={card}>
          <span style={kicker}>Valuation</span>
          <Row label="Direct capitalisation" value={money(result.direct.value)} sub={result.direct.perSqft ? `${moneyFull(result.direct.perSqft)} psf` : `${moneyFull(result.noi)} ÷ ${form.cap}%`} color="var(--pa-amber)" />
          <Row label="DCF value" value={result.dcf ? money(result.dcf.value) : '—'} sub={result.dcf ? `${result.dcf.flowYears}-year ${result.dcf.reversion ? 'hold with sale' : 'run-off, no sale'}` : 'needs discount and exit cap'} color="var(--pa-amber)" />
          <Row label="Reconciled value" value={result.reconciled != null ? money(result.reconciled) : '—'} sub="average of the two" color="var(--pa-amber)" />
        </div>
        <div style={card}>
          <span style={kicker}>Returns</span>
          <Row label={`IRR (${result.years} yr, unlevered)`} value={inv ? pct(inv.unleveredIrr) : '—'} sub={inv ? `${mult(inv.unleveredMultiple)} multiple` : undefined} color="var(--pa-emerald)" />
          <Row label="Equity multiple" value={inv ? mult(inv.unleveredMultiple) : '—'} sub={inv ? 'total cash back ÷ outlay' : undefined} color="var(--pa-emerald)" />
          <Row label="Total outlay" value={inv ? money(inv.upfront) : '—'} sub={inv ? (result.priceIsAuto ? 'at direct cap value' : 'price + acquisition costs') : undefined} color="var(--pa-emerald)" />
          {lev && (
            <>
              <Row label="Levered IRR" value={pct(lev.irr)} sub={`${mult(lev.multiple)} multiple · equity ${money(lev.equity)}`} color="var(--pa-emerald)" />
              <Row label="Year-1 cash-on-cash" value={pct(lev.cashOnCash)} sub={`debt service ${money(lev.annualDs)}/yr`} color={lev.cashOnCash != null && lev.cashOnCash < 0 ? '#F87171' : 'var(--pa-emerald)'} />
              <Row label="DSCR" value={lev.dscr != null ? `${lev.dscr.toFixed(2)}x` : 'n/a'} sub={`loan ${money(lev.loan)}`} color={lev.dscr != null && lev.dscr < 1.2 ? '#F87171' : 'var(--pa-emerald)'} />
            </>
          )}
        </div>
      </div>

      {result.priceVsDcf != null && (
        <span style={{ fontSize: 12.5, color: 'var(--pa-text-2)' }}>
          Price is {Math.abs(result.priceVsDcf * 100).toFixed(1)}% {result.priceVsDcf >= 0 ? 'above' : 'below'} the DCF value.
        </span>
      )}

      {result.capGrid && (
        <SensGrid
          title="Sensitivity · value by cap rate and NOI" caption="rows: cap rate · columns: NOI" grid={result.capGrid} rowLabel="Cap"
          baseRow={capBase} baseCol={2}
          fmtRow={(r) => pct(r)} fmtCol={(c) => `${c >= 0 ? '+' : ''}${(c * 100).toFixed(0)}%`} fmtCell={(v) => moneyShort(v)}
        />
      )}
      {result.irrGrid && (
        <SensGrid
          title="Sensitivity · IRR by exit cap and growth" caption="rows: exit cap · columns: NOI growth" grid={result.irrGrid} rowLabel="Exit"
          baseRow={exitBase} baseCol={2}
          fmtRow={(r) => pct(r)} fmtCol={(g) => `${(g * 100).toFixed(1)}%`} fmtCell={(v) => pct(v, 1)}
        />
      )}

      {inv && (
        <div style={{ ...card, padding: 0, overflow: 'hidden', gap: 0 }}>
          <div style={{ padding: '14px 18px 10px' }}><span style={kicker}>Cash flows</span></div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
              <thead>
                <tr>
                  {['Yr', 'NOI', 'Unlevered', ...(lev ? ['Levered'] : [])].map((h, i) => (
                    <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '8px 18px', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--pa-text-3)', borderBottom: '1px solid var(--pa-border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="pa-row">
                  <td style={{ padding: '7px 18px', borderBottom: '1px solid var(--pa-border)', color: 'var(--pa-text-3)' }}>0</td>
                  <td style={{ padding: '7px 18px', borderBottom: '1px solid var(--pa-border)', textAlign: 'right', color: 'var(--pa-text-3)' }}>—</td>
                  <td style={{ padding: '7px 18px', borderBottom: '1px solid var(--pa-border)', textAlign: 'right', color: '#F87171' }}>{money(inv.unleveredCfs[0])}</td>
                  {lev && <td style={{ padding: '7px 18px', borderBottom: '1px solid var(--pa-border)', textAlign: 'right', color: '#F87171' }}>{money(lev.cfs[0])}</td>}
                </tr>
                {flows.map((f, i) => {
                  const last = i === flows.length - 1;
                  return (
                    <tr key={i} className="pa-row">
                      <td style={{ padding: '7px 18px', borderBottom: '1px solid var(--pa-border)', color: 'var(--pa-text-3)' }}>{i + 1}</td>
                      <td style={{ padding: '7px 18px', borderBottom: '1px solid var(--pa-border)', textAlign: 'right' }}>{money(f)}</td>
                      <td style={{ padding: '7px 18px', borderBottom: '1px solid var(--pa-border)', textAlign: 'right', color: last ? 'var(--pa-amber)' : 'var(--pa-text)', fontWeight: last ? 700 : 400 }}>{money(inv.unleveredCfs[i + 1])}</td>
                      {lev && <td style={{ padding: '7px 18px', borderBottom: '1px solid var(--pa-border)', textAlign: 'right', color: last ? 'var(--pa-amber)' : 'var(--pa-text)', fontWeight: last ? 700 : 400 }}>{money(lev.cfs[i + 1])}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '10px 18px', ...note }}>{result.dcf?.reversion ? `The final year includes the net sale proceeds${lev ? ' less the loan balance' : ''}.` : 'No sale is assumed; income stops at lease expiry.'}</div>
        </div>
      )}

      <div className="pa-no-print" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="pa-btn" onClick={onPrint} style={{ height: 44, padding: '0 18px', borderRadius: 10, border: 0, background: 'var(--pa-primary)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          Generate PDF report
        </button>
        <span style={note}>Opens the print dialog; choose &ldquo;Save as PDF&rdquo;. Figures are illustrative. Not valuation advice.</span>
      </div>

      <p style={{ ...note, lineHeight: 1.6 }}>
        For illustration only. This is not a formal valuation and not investment, financial or legal advice. Results depend entirely on the assumptions entered.
        Acquisition costs are an estimate; confirm stamp duty, legal and agent fees with your lawyer and IRAS. ABSD is not included.
      </p>
    </div>
  );
}

/** Print rules: hide the shell and the inputs, print the report alone on a white page with legible colours. */
export const PRINT_CSS = `
@media print {
  :root, html[data-theme="light"] { --pa-bg:#fff; --pa-surface:#fff; --pa-card:#fff; --pa-border:#d9d4ee; --pa-text:#111; --pa-text-2:#3b3561; --pa-text-3:#5f5a80; --pa-amber:#b45309; --pa-emerald:#047857; --pa-primary:#5A22A0; }
  html, body { background:#fff !important; height:auto !important; overflow:visible !important; }
  body * { visibility:hidden; }
  .pa-bg, .pa-grain, .pa-orb { display:none !important; }
  #pa-valuation-report, #pa-valuation-report * { visibility:visible; }
  #pa-valuation-report { position:absolute; left:0; top:0; width:100%; padding:16px; gap:12px; }
  #pa-valuation-report .pa-print-only { display:flex !important; }
  #pa-valuation-report .pa-no-print { display:none !important; }
  #pa-valuation-report .pa-pulse, #pa-valuation-report .pa-spin { animation:none !important; }
  #pa-valuation-report [style*="overflow"] { overflow:visible !important; }
}`;
