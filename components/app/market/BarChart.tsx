'use client';

import type { CSSProperties } from 'react';

// Bar chart from the Resale screen of the design: flex bars with 4px gaps in a 220px well, 4px top radius,
// primary bars with the highlighted one (the latest month) in amber, start/end labels below.

export interface Bar {
  /** Hover text, e.g. "Oct 2026 · 48 transactions". */
  title: string;
  value: number | null;
  highlight?: boolean;
}

export function BarChart({ bars, height = 220, startLabel, endLabel, note, style }: { bars: Bar[]; height?: number; startLabel?: string; endLabel?: string; note?: string; style?: CSSProperties }) {
  const max = Math.max(0, ...bars.map((b) => b.value ?? 0));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, ...style }}>
      <div role="img" aria-label={bars.map((b) => b.title).join('; ')} style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height }}>
        {bars.map((b, i) => {
          const v = b.value ?? 0;
          const pct = max > 0 ? Math.max(v > 0 ? 2 : 0, (v / max) * 100) : 0;
          return (
            <div key={i} title={b.title} style={{ flex: 1, height: `${pct}%`, borderRadius: '4px 4px 0 0', background: b.highlight ? 'var(--pa-amber)' : 'var(--pa-primary)', minWidth: 4, opacity: v > 0 ? 1 : 0.35 }} />
          );
        })}
      </div>
      {(startLabel || endLabel) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--pa-text-3)' }}>
          <span>{startLabel}</span><span>{endLabel}</span>
        </div>
      )}
      {note && <span style={{ fontSize: 11.5, color: 'var(--pa-text-3)' }}>{note}</span>}
    </div>
  );
}

export interface HBar {
  label: string;
  value: number;
  /** Formatted value shown at the right. */
  display: string;
  sub?: string;
  highlight?: boolean;
}

/** Horizontal ranked bars for "which projects" views: rank, name, bar, value. */
export function HBarList({ rows, style }: { rows: HBar[]; style?: CSSProperties }) {
  const max = Math.max(0, ...rows.map((r) => r.value));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
      {rows.map((r, i) => (
        <div key={i} className="pa-row" style={{ display: 'grid', gridTemplateColumns: '28px minmax(0,1fr) auto', gap: 10, alignItems: 'center', padding: '6px 8px', borderRadius: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: i < 3 ? 'var(--pa-amber)' : 'var(--pa-text-3)', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</span>
            <div style={{ height: 8, borderRadius: 4, background: 'var(--pa-bg)', overflow: 'hidden' }}>
              <div style={{ width: `${max > 0 ? (r.value / max) * 100 : 0}%`, height: '100%', borderRadius: 4, background: r.highlight ? 'var(--pa-amber)' : 'var(--pa-primary)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
            <strong style={{ fontSize: 14, color: r.highlight ? 'var(--pa-amber)' : 'var(--pa-text)', fontVariantNumeric: 'tabular-nums' }}>{r.display}</strong>
            {r.sub && <span style={{ fontSize: 11, color: 'var(--pa-text-3)', whiteSpace: 'nowrap' }}>{r.sub}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
