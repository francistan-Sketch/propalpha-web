'use client';

import Link from 'next/link';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import api from '@/lib/api';

// Shared primitives for the Market sub-pages, lifted from the Resale screen of the design
// (PropAlpha-App.dc.html, #resale): back link, period pills, segmented control, By Volume / By PSF
// toggle, card + table styles, the loading / empty / error states and the data hook.

export const DISTRICTS = Array.from({ length: 28 }, (_, i) => i + 1);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-10" → "Oct 2026". Anything else is returned untouched. */
export function fmtMonth(ym: string | null | undefined): string {
  if (!ym) return '';
  const m = /^(\d{4})-(\d{2})/.exec(ym);
  if (!m) return ym;
  return `${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

/** "2026-10" → "Oct 26" for axis labels. */
export function fmtMonthShort(ym: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(ym);
  if (!m) return ym;
  return `${MONTHS[Number(m[2]) - 1]} ${m[1].slice(2)}`;
}

export function fmtPsf(val: number | string | null | undefined): string {
  if (val == null || val === '') return '—';
  const n = Number(val);
  if (!isFinite(n)) return '—';
  return '$' + n.toLocaleString('en-SG', { maximumFractionDigits: 0 });
}

export function fmtPct(val: number | string | null | undefined, digits = 2): string {
  if (val == null || val === '') return '—';
  const n = Number(val);
  if (!isFinite(n)) return '—';
  return n.toFixed(digits) + '%';
}

export function fmtInt(val: number | string | null | undefined): string {
  if (val == null || val === '') return '—';
  const n = Number(val);
  return isFinite(n) ? n.toLocaleString('en-SG') : '—';
}

/** "URA data to Oct 2026" for the shell subtitle, once the response month is known. */
export function dataToLabel(month: string | null | undefined): string | undefined {
  return month ? `URA data to ${fmtMonth(month)}` : undefined;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

export const pageStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1100, width: '100%', margin: '0 auto', minWidth: 0 };

export const cardStyle: CSSProperties = { border: '1px solid var(--pa-border)', borderRadius: 16, background: 'var(--pa-card)' };

export const kickerStyle: CSSProperties = { fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--pa-text-3)', fontWeight: 800 };

export const noteStyle: CSSProperties = { fontSize: 11.5, color: 'var(--pa-text-3)' };

export const thStyle: CSSProperties = {
  textAlign: 'left', padding: '10px 14px', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase',
  color: 'var(--pa-text-3)', borderBottom: '1px solid var(--pa-border)', whiteSpace: 'nowrap', fontWeight: 700,
};
export const thRight: CSSProperties = { ...thStyle, textAlign: 'right' };

export const tdStyle: CSSProperties = { padding: '10px 14px', borderBottom: '1px solid var(--pa-border)', whiteSpace: 'nowrap' };
export const tdNum: CSSProperties = { ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };
export const tdAmber: CSSProperties = { ...tdNum, color: 'var(--pa-amber)', fontWeight: 700 };
export const tdMuted: CSSProperties = { ...tdStyle, color: 'var(--pa-text-2)' };

export const tableStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 13.5 };

export const selectStyle: CSSProperties = {
  height: 38, padding: '0 32px 0 10px', borderRadius: 9, border: '1px solid var(--pa-border)', background: 'var(--pa-bg)',
  color: 'var(--pa-text)', fontSize: 13.5, textTransform: 'none', letterSpacing: 0, cursor: 'pointer', appearance: 'none',
  WebkitAppearance: 'none', backgroundImage: 'linear-gradient(45deg, transparent 50%, var(--pa-text-3) 50%), linear-gradient(135deg, var(--pa-text-3) 50%, transparent 50%)',
  backgroundPosition: 'calc(100% - 16px) 16px, calc(100% - 11px) 16px', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat',
};

// ─── Pieces ──────────────────────────────────────────────────────────────────

/** "← Market Updates" at the top of every sub-page. */
export function BackLink({ href = '/market', children = 'Market Updates' }: { href?: string; children?: ReactNode }) {
  return (
    <Link href={href} className="pa-link" style={{ alignSelf: 'flex-start', color: 'var(--pa-text-2)', fontSize: 13, fontWeight: 600, padding: 0 }}>
      ← {children}
    </Link>
  );
}

/** Card wrapping a table so it scrolls inside the card on narrow screens instead of widening the page. */
export function TableCard({ children, footer, style }: { children: ReactNode; footer?: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ ...cardStyle, overflow: 'hidden', ...style }}>
      <div style={{ overflowX: 'auto' }}>{children}</div>
      {footer && <div style={{ padding: '10px 14px', ...noteStyle }}>{footer}</div>}
    </div>
  );
}

export type Option<T extends string | number> = { value: T; label: string; disabled?: boolean; title?: string };

/** Round pills (34px); the active one is filled primary. */
export function Pills<T extends string | number>({ options, value, onChange, ariaLabel }: { options: Option<T>[]; value: T; onChange: (v: T) => void; ariaLabel?: string }) {
  return (
    <div role="group" aria-label={ariaLabel} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)} type="button" onClick={() => !o.disabled && onChange(o.value)} disabled={o.disabled} title={o.title} aria-pressed={on}
            className={o.disabled ? undefined : 'pa-btn'}
            style={{
              height: 34, padding: '0 14px', borderRadius: 999, border: '1px solid var(--pa-border)', background: on ? 'var(--pa-primary)' : 'transparent',
              color: on ? '#fff' : 'var(--pa-text-2)', fontSize: 13, fontWeight: 600, cursor: o.disabled ? 'not-allowed' : 'pointer', opacity: o.disabled ? 0.45 : 1,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Joined buttons (34px) with a border round the group; the active one is tinted primary at 22%. */
export function Segmented<T extends string | number>({ options, value, onChange, ariaLabel }: { options: Option<T>[]; value: T; onChange: (v: T) => void; ariaLabel?: string }) {
  return (
    <div role="group" aria-label={ariaLabel} style={{ display: 'flex', border: '1px solid var(--pa-border)', borderRadius: 10, overflow: 'hidden', flex: 'none' }}>
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)} type="button" onClick={() => !o.disabled && onChange(o.value)} disabled={o.disabled} title={o.title} aria-pressed={on}
            style={{
              height: 34, padding: '0 16px', border: 0, borderRight: i < options.length - 1 ? '1px solid var(--pa-border)' : 0,
              background: on ? 'color-mix(in srgb, var(--pa-primary) 22%, transparent)' : 'transparent', color: on ? 'var(--pa-text)' : 'var(--pa-text-2)',
              fontSize: 13, fontWeight: 600, cursor: o.disabled ? 'not-allowed' : 'pointer', opacity: o.disabled ? 0.45 : 1,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Small filled toggle (30px) for By Volume / By PSF and the period selector on Best Buy. */
export function Toggle<T extends string | number>({ options, value, onChange, ariaLabel }: { options: Option<T>[]; value: T; onChange: (v: T) => void; ariaLabel?: string }) {
  return (
    <div role="group" aria-label={ariaLabel} style={{ display: 'flex', border: '1px solid var(--pa-border)', borderRadius: 8, overflow: 'hidden', flex: 'none' }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)} type="button" onClick={() => !o.disabled && onChange(o.value)} disabled={o.disabled} title={o.title} aria-pressed={on}
            style={{
              height: 30, padding: '0 12px', border: 0, background: on ? 'var(--pa-primary)' : 'transparent', color: on ? '#fff' : 'var(--pa-text-2)',
              fontSize: 12, fontWeight: 700, cursor: o.disabled ? 'not-allowed' : 'pointer', opacity: o.disabled ? 0.45 : 1,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Labelled select in the filter-bar style (uppercase 11px label, 38px field). */
export function FilterSelect({ label, value, onChange, children, style }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode; style?: CSSProperties }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--pa-text-3)', minWidth: 140, ...style }}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} style={selectStyle}>{children}</select>
    </label>
  );
}

/** District dropdown; pass allowAll for a leading "All districts" option (value ""). */
export function DistrictSelect({ value, onChange, allowAll, style }: { value: string; onChange: (v: string) => void; allowAll?: boolean; style?: CSSProperties }) {
  return (
    <FilterSelect label="District" value={value} onChange={onChange} style={style}>
      {allowAll && <option value="">All districts</option>}
      {DISTRICTS.map((d) => <option key={d} value={String(d)}>District {d}</option>)}
    </FilterSelect>
  );
}

/** Page heading row: "District 15 · Resale" with a muted context label and controls on the right. */
export function HeadingRow({ title, meta, children }: { title: ReactNode; meta?: ReactNode; children?: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <strong style={{ fontSize: 20, letterSpacing: '-0.02em' }}>{title}</strong>
      {meta && <span style={{ fontSize: 13, color: 'var(--pa-text-3)' }}>{meta}</span>}
      {children && <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>{children}</div>}
    </div>
  );
}

/** Amber-tinted banner for the "latest month may still be filling" note. */
export function PartialMonthNote({ month }: { month?: string }) {
  return (
    <div style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid color-mix(in srgb, var(--pa-amber) 50%, transparent)', background: 'color-mix(in srgb, var(--pa-amber) 10%, transparent)', fontSize: 13, color: 'var(--pa-text)' }}>
      {month ? `${fmtMonth(month)} is still being filed. ` : 'The latest month is still being filed. '}
      <span style={{ color: 'var(--pa-text-2)' }}>URA data for the current month can take a few weeks to settle.</span>
    </div>
  );
}

// ─── States ──────────────────────────────────────────────────────────────────

export function LoadingRows({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-live="polite" style={{ ...cardStyle, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: rows }, (_, i) => <div key={i} className="pa-pulse" style={{ height: 36, borderRadius: 8, background: 'var(--pa-bg)' }} />)}
    </div>
  );
}

export function EmptyBlock({ title, children, action, onAction }: { title: ReactNode; children?: ReactNode; action?: ReactNode; onAction?: () => void }) {
  return (
    <div style={{ ...cardStyle, padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
      <strong style={{ fontSize: 16 }}>{title}</strong>
      {children && <span style={{ fontSize: 13.5, color: 'var(--pa-text-2)', maxWidth: 360 }}>{children}</span>}
      {action && onAction && (
        <button type="button" className="pa-btn" onClick={onAction} style={{ marginTop: 8, height: 36, padding: '0 14px', borderRadius: 9, border: '1px solid var(--pa-border)', background: 'transparent', color: 'var(--pa-text)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          {action}
        </button>
      )}
    </div>
  );
}

export function ErrorBlock({ title = 'The market data could not be loaded.', children, onRetry }: { title?: ReactNode; children?: ReactNode; onRetry?: () => void }) {
  return (
    <div role="alert" style={{ padding: '16px 18px', borderRadius: 14, border: '1px solid rgba(248,113,113,.5)', background: 'rgba(248,113,113,.1)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <strong style={{ fontSize: 14.5, color: '#F87171' }}>{title}</strong>
      {children && <span style={{ fontSize: 13.5, color: 'var(--pa-text-2)' }}>{children}</span>}
      {onRetry && (
        <button type="button" className="pa-btn" onClick={onRetry} style={{ alignSelf: 'flex-start', height: 34, padding: '0 14px', borderRadius: 8, border: '1px solid var(--pa-border)', background: 'var(--pa-card)', color: 'var(--pa-text)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          Try again
        </button>
      )}
    </div>
  );
}

// ─── Data hook ───────────────────────────────────────────────────────────────

type Params = Record<string, string | number | undefined>;

interface QueryState<T> { key: string; data?: T; error?: string }

/**
 * GET `path` with `params` through the bearer-token axios instance. Re-fetches when the params change;
 * `loading` is derived (requested key ≠ resolved key) so no state is set synchronously inside the effect.
 */
export function useMarketQuery<T>(path: string, params: Params, fallbackMessage: string) {
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify({ path, params, attempt });
  const [state, setState] = useState<QueryState<T>>({ key: '' });

  useEffect(() => {
    let cancelled = false;
    const { path: p, params: q } = JSON.parse(key) as { path: string; params: Params };
    const clean: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== '') clean[k] = v;
    api.get<T>(p, { params: clean })
      .then((res) => { if (!cancelled) setState({ key, data: res.data }); })
      .catch((err: unknown) => {
        if (cancelled) return;
        const axiosErr = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
        setState({ key, error: axiosErr?.response?.data?.message || axiosErr?.response?.data?.error || fallbackMessage });
      });
    return () => { cancelled = true; };
  }, [key, fallbackMessage]);

  const resolved = state.key === key;
  return {
    data: resolved ? state.data : undefined,
    /** The last good response while a new one loads, so the layout does not collapse between requests. */
    previous: state.data,
    error: resolved ? state.error : undefined,
    loading: !resolved,
    retry: () => setAttempt((n) => n + 1),
  };
}
