'use client';

import type { CSSProperties, ReactNode, SelectHTMLAttributes, InputHTMLAttributes } from 'react';

// Field, table and card primitives for the Search, Tower View and New Launches screens.
// Sizes and colours follow the design handoff (filter bar 14px pad radius 16; selects 38px radius 9;
// table head 11px uppercase .08em; psf column amber 700 tabular-nums).

export const filterBar: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, padding: 14, borderRadius: 16, border: '1px solid var(--pa-border)', background: 'var(--pa-card)' };
export const cardSection: CSSProperties = { border: '1px solid var(--pa-border)', borderRadius: 16, background: 'var(--pa-card)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 };
export const cardHead: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '14px 16px', borderBottom: '1px solid var(--pa-border)' };
export const footnote: CSSProperties = { padding: '10px 14px', fontSize: 11.5, color: 'var(--pa-text-3)' };

const control: CSSProperties = { height: 38, padding: '0 10px', borderRadius: 9, border: '1px solid var(--pa-border)', background: 'var(--pa-bg)', color: 'var(--pa-text)', fontSize: 13.5, textTransform: 'none', letterSpacing: 0, width: '100%', minWidth: 0 };

export function Field({ label, children, style }: { label: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--pa-text-3)', flex: 1, minWidth: 140, position: 'relative', ...style }}>
      {label}
      {children}
    </label>
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...control, ...props.style }} />;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...control, ...props.style }} />;
}

export function PrimaryBtn({ children, disabled, type = 'submit', onClick, style }: { children: ReactNode; disabled?: boolean; type?: 'submit' | 'button'; onClick?: () => void; style?: CSSProperties }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="pa-btn" style={{ alignSelf: 'flex-end', height: 38, padding: '0 18px', borderRadius: 9, border: 0, background: 'var(--pa-primary)', color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.55 : 1, display: 'inline-flex', alignItems: 'center', gap: 8, ...style }}>
      {children}
    </button>
  );
}

export function GhostBtn({ children, onClick, style, type = 'button', href }: { children: ReactNode; onClick?: () => void; style?: CSSProperties; type?: 'button' | 'submit'; href?: string }) {
  const s: CSSProperties = { height: 36, padding: '0 14px', borderRadius: 9, border: '1px solid var(--pa-border)', background: 'transparent', color: 'var(--pa-text)', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', ...style };
  if (href) return <a className="pa-btn" href={href} style={s}>{children}</a>;
  return <button type={type} onClick={onClick} className="pa-btn" style={s}>{children}</button>;
}

/** Segmented toggle (Results / Empty / Loading style chips from the design). */
export function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--pa-border)', background: active ? 'color-mix(in srgb, var(--pa-primary) 22%, transparent)' : 'transparent', color: active ? 'var(--pa-text)' : 'var(--pa-text-2)', fontSize: 11.5, cursor: 'pointer' }}>
      {children}
    </button>
  );
}

export const thStyle = (right = false): CSSProperties => ({ textAlign: right ? 'right' : 'left', padding: '10px 14px', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--pa-text-3)', borderBottom: '1px solid var(--pa-border)', whiteSpace: 'nowrap', fontWeight: 600 });
export const tdStyle = (opts: { right?: boolean; muted?: boolean; amber?: boolean; nowrap?: boolean } = {}): CSSProperties => ({
  padding: '10px 14px', borderBottom: '1px solid var(--pa-border)', textAlign: opts.right ? 'right' : 'left',
  color: opts.amber ? 'var(--pa-amber)' : opts.muted ? 'var(--pa-text-2)' : 'var(--pa-text)', fontWeight: opts.amber ? 700 : 400,
  fontVariantNumeric: opts.right ? 'tabular-nums' : undefined, whiteSpace: opts.nowrap ? 'nowrap' : undefined,
});

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => <div key={i} className="pa-pulse" style={{ height: 36, borderRadius: 8, background: 'var(--pa-bg)' }} />)}
    </div>
  );
}

export function TableEmpty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
      <strong style={{ fontSize: 16 }}>{title}</strong>
      {children && <span style={{ fontSize: 13.5, color: 'var(--pa-text-2)', maxWidth: 360 }}>{children}</span>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

export const DISTRICTS = Array.from({ length: 28 }, (_, i) => i + 1);

export function fmtDate(v: unknown): string {
  if (!v) return '—';
  const s = String(v).slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Unit number out of a URA address ("... #12-03"), or null for landed / no unit. */
export function unitFromAddress(address: unknown): string | null {
  const m = String(address ?? '').match(/(#\d{2,3}-\d{2,3}[A-Z]?)/);
  return m ? m[1] : null;
}

export function toDistrict(v: unknown): string {
  const n = parseInt(String(v ?? '').replace(/^D0*/i, ''), 10);
  return Number.isFinite(n) ? `D${String(n).padStart(2, '0')}` : '';
}

/** Axios error → message, plus 401 detection for the session redirect. */
export function describeError(err: unknown, fallback: string): { status?: number; message: string } {
  const e = err as { response?: { status?: number; data?: { error?: string; message?: string } }; code?: string; message?: string };
  const status = e?.response?.status;
  const message = e?.response?.data?.error || e?.response?.data?.message || (e?.code === 'ECONNABORTED' ? 'The request timed out. Try a narrower search.' : fallback);
  return { status, message };
}

export function downloadText(filename: string, text: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
