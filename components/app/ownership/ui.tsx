'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import type { Flag, Transaction } from '@/lib/ownership';

// Shared bits for the Ownership Intelligence pages: the web twin of mobile/src/components/LandedUi.js and
// LandedTx.js. Colours follow the site tokens (emerald = current, red = outdated, amber = tenant/key numbers).

export const RED = 'var(--pa-error)';
export const GREEN = 'var(--pa-emerald)';
export const SKY = '#38BDF8';
export const GREY = '#6B7280';

// Who a name is: the person on title (owner), a tenant, or the phone-directory subscriber at an address.
export const ROLE = {
  owner: { label: 'OWNER', color: '#8B5CF6' },
  tenant: { label: 'TENANT', color: 'var(--pa-amber)' },
  subscriber: { label: 'LAND LINE', color: SKY },
} as const;
export type Role = keyof typeof ROLE;

// ── Formatting (dates are read from the ISO text so a timezone can never shift them) ──
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function fmtDay(iso: unknown): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  if (!m) return null;
  return `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}`;
}
export function fmtMoney(n: unknown): string | null {
  const v = Number(n);
  if (!isFinite(v) || v <= 0) return null;
  return v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : `$${Math.round(v).toLocaleString('en-SG')}`;
}
export const fmtInt = (n: unknown) => (n == null ? '…' : Number(n).toLocaleString('en-SG'));
export const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

// Client-side twin of the server's matching rule, used only to highlight which names the search hit.
export function termsOf(q: string): string[] {
  return String(q || '').trim().split(/\s+/).map((w) => w.replace(/[^A-Za-z0-9'-]/g, '').toUpperCase()).filter(Boolean);
}
export function nameMatches(name: string | null | undefined, terms: string[], complete = false): boolean {
  if (!name || !terms.length) return false;
  const up = String(name).toUpperCase();
  if (!complete) return terms.every((t) => up.includes(t));        // partial: any fragment of the name
  const words = new Set(up.replace(/[^A-Z0-9' -]/g, ' ').split(/\s+/));
  return terms.every((t) => words.has(t));                         // complete: whole words only
}

/** The app's typed-search debounce (350 ms). */
export function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

// ── Status tags ──────────────────────────────────────────────────────────────
export function StatusTag({ color, children }: { color: string; children: ReactNode }) {
  return <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.06em', color, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>{children}</span>;
}
export function FlagTag({ flag }: { flag: Flag }) {
  const out = flag === 'outdated';
  return <StatusTag color={out ? RED : GREEN}>{out ? 'OUTDATED' : 'CURRENT'}</StatusTag>;
}
export function RoleBadge({ role }: { role: Role }) {
  const r = ROLE[role];
  return <span style={{ display: 'inline-flex', alignSelf: 'flex-start', background: r.color, color: '#000', borderRadius: 4, padding: '2px 6px', fontSize: 9, fontWeight: 800, letterSpacing: '.06em', flex: 'none' }}>{r.label}</span>;
}

/** One person on a card: a role badge and name, tinted when it is the name the search found. `dim` is for "No name on record". */
export function PersonRow({ role, name, hit, dim, children }: { role: Role; name: string; hit?: boolean; dim?: boolean; children?: ReactNode }) {
  const tint = ROLE[role].color;
  return (
    <div style={{ border: `1px solid ${hit ? tint : 'transparent'}`, background: hit ? `color-mix(in srgb, ${tint} 18%, transparent)` : 'transparent', borderRadius: 8, padding: '5px 6px', margin: '2px -6px 0', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <RoleBadge role={role} />
        <span style={{ color: dim ? 'var(--pa-text-3)' : 'var(--pa-text)', fontSize: 14, fontWeight: hit ? 800 : 600, fontStyle: dim ? 'italic' : 'normal', minWidth: 0, overflowWrap: 'anywhere' }}>{name}</span>
      </div>
      {children}
    </div>
  );
}

export function PhoneLink({ number, label }: { number: string | null | undefined; label?: string }) {
  if (!number) return null;
  const digits = String(number).replace(/[^\d+]/g, '');
  return (
    <a href={digits ? `tel:${digits}` : undefined} className="pa-link" style={{ color: 'var(--pa-text-2)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {label ? `${label}  ` : ''}{number}
    </a>
  );
}

export const dim: CSSProperties = { color: 'var(--pa-text-2)', fontSize: 12, lineHeight: '17px', marginTop: 1, overflowWrap: 'anywhere' };
export const dimInline: CSSProperties = { color: 'var(--pa-text-3)', fontSize: 11 };
export const sectionLabel: CSSProperties = { color: 'var(--pa-text-3)', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', marginTop: 10, marginBottom: 2, textTransform: 'uppercase' };
export const lineRow: CSSProperties = { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4, minWidth: 0 };

export function MoreLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return <button type="button" onClick={onClick} style={{ border: 0, background: 'transparent', padding: '4px 0 2px', color: 'var(--pa-text-2)', fontSize: 13, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start' }}>{children}</button>;
}

/** Result card: 4px left rule and a faint tint in the flag's colour (green current, red outdated). */
export function RecordCard({ flag, children }: { flag: Flag; children: ReactNode }) {
  const c = flag === 'outdated' ? RED : GREEN;
  return (
    <article style={{ border: '1px solid var(--pa-border)', borderLeftWidth: 4, borderLeftColor: c, borderRadius: 12, padding: 14, background: `color-mix(in srgb, ${c} 6%, var(--pa-card))`, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {children}
    </article>
  );
}

/** Card header line: the record's title on the left, its status tags stacked on the right. */
export function CardHead({ title, sub, tags }: { title: ReactNode; sub?: ReactNode; tags: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, minWidth: 0 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, overflowWrap: 'anywhere' }}>{title}</div>
        {sub && <div style={{ color: 'var(--pa-text-2)', fontSize: 13, fontWeight: 600, marginTop: 1, overflowWrap: 'anywhere' }}>{sub}</div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, paddingTop: 4, flex: 'none' }}>{tags}</div>
    </div>
  );
}

// ── Filters ──────────────────────────────────────────────────────────────────
export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      aria-label="Search"
      style={{ height: 42, width: '100%', minWidth: 0, padding: '0 14px', borderRadius: 10, border: '1px solid var(--pa-border)', background: 'var(--pa-bg)', color: 'var(--pa-text)', fontSize: 14.5 }}
    />
  );
}

/** "Complete match" box under the search field. Unticked = partial matching (the default). */
export function CompleteMatch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', minWidth: 0 }}>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--pa-primary)', margin: 0, flex: 'none' }} />
      <span style={{ fontSize: 13, fontWeight: 600 }}>Complete match</span>
      <span style={{ ...dimInline, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{value ? 'whole words only' : 'partial: "ho" also finds HOCK'}</span>
    </label>
  );
}

export interface ChipOption<V> { value: V; label: string; color?: string }
export function Chips<V extends string | number>({ options, value, onChange, ariaLabel }: { options: ChipOption<V>[]; value: V; onChange: (v: V) => void; ariaLabel?: string }) {
  return (
    <div role="group" aria-label={ariaLabel} style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map((o) => {
        const on = o.value === value;
        const c = o.color || 'var(--pa-primary)';
        return (
          <button key={String(o.value)} type="button" aria-pressed={on} onClick={() => onChange(o.value)}
            style={{ padding: '6px 11px', borderRadius: 8, border: `1px solid ${on ? c : 'var(--pa-border)'}`, background: on ? c : 'transparent', color: on ? '#fff' : 'var(--pa-text-2)', fontSize: 13, fontWeight: on ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" aria-pressed={value} onClick={() => onChange(!value)}
      style={{ padding: '6px 11px', borderRadius: 8, border: `1px solid ${value ? 'var(--pa-primary)' : 'var(--pa-border)'}`, background: value ? 'var(--pa-primary)' : 'transparent', color: value ? '#fff' : 'var(--pa-text-2)', fontSize: 13, fontWeight: value ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  );
}

/** Filter button that opens a picker panel ("Browse streets", "All districts", "All projects"). */
export function PickBtn({ active, onClick, children, style }: { active?: boolean; onClick: () => void; children: ReactNode; style?: CSSProperties }) {
  return (
    <button type="button" onClick={onClick}
      style={{ flex: 1, minWidth: 0, height: 34, padding: '0 11px', borderRadius: 8, border: `1px solid ${active ? 'var(--pa-primary)' : 'var(--pa-border)'}`, background: 'transparent', color: active ? 'var(--pa-text)' : 'var(--pa-text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left', ...style }}>
      {children}
    </button>
  );
}
export function ClearBtn({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} style={{ border: 0, background: 'transparent', color: 'var(--pa-text-2)', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '0 4px', flex: 'none' }}>Clear</button>;
}

/** Landed legend: the two flag meanings and the owner-data date. */
export function Legend({ since, asOf }: { since: string; asOf: string }) {
  const year = String(since || '2015-01-01').slice(0, 4);
  const dot = (c: string) => <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: 5, background: c, marginRight: 5, display: 'inline-block', flex: 'none' }} />;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', fontSize: 11, color: 'var(--pa-text-2)' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>{dot(GREEN)}Current: not sold since {year}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>{dot(RED)}Outdated: sold since {year}</span>
      {asOf ? <span style={{ color: 'var(--pa-text-3)' }}>Owner data as of {asOf}</span> : null}
    </div>
  );
}

export const legendText: CSSProperties = { fontSize: 11, lineHeight: '15px', color: 'var(--pa-text-3)' };
export const countText: CSSProperties = { fontSize: 12, color: 'var(--pa-text-3)' };

// ── Transactions ─────────────────────────────────────────────────────────────
const TX_SHOWN = 3;

/** Every PropAlpha sale on record for an address or unit: date, price, psf. Newest first, folded after three. */
export function Transactions({ list, hot }: { list: Transaction[] | null | undefined; hot?: string | null }) {
  const [all, setAll] = useState(false);
  const txs = Array.isArray(list) ? list : [];
  const shown = all ? txs : txs.slice(0, TX_SHOWN);
  const hidden = txs.length - shown.length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <span style={sectionLabel}>Transactions · {txs.length}</span>
      {!txs.length ? <span style={{ ...dimInline, fontSize: 12 }}>No sale on record</span> : null}
      {shown.map((x, i) => {
        const psf = Number(x.psf) > 0 ? Math.round(Number(x.psf)) : (Number(x.price) > 0 && Number(x.area_sqft) > 0 ? Math.round(Number(x.price) / Number(x.area_sqft)) : null);
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '3px 0', minWidth: 0 }}>
            <span style={{ color: i === 0 && hot ? hot : 'var(--pa-text-2)', fontSize: 12, width: 92, flex: 'none', fontWeight: i === 0 ? 700 : 500 }}>{fmtDay(x.date)}</span>
            <span style={{ color: 'var(--pa-text)', fontSize: 13, fontWeight: 700, flex: 1, minWidth: 0 }}>{fmtMoney(x.price) || 'price n/a'}</span>
            <span style={{ ...dimInline, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {psf ? `$${psf.toLocaleString('en-SG')} psf` : ''}{x.area_sqft ? `  ·  ${Math.round(Number(x.area_sqft)).toLocaleString('en-SG')} sqft` : ''}
            </span>
          </div>
        );
      })}
      {hidden > 0 || all ? (
        <MoreLink onClick={() => setAll(!all)}>{all ? 'Show fewer' : `Show ${hidden} earlier ${plural(hidden, 'sale', 'sales')}`}</MoreLink>
      ) : null}
    </div>
  );
}

// ── Layout ───────────────────────────────────────────────────────────────────
export const filterCard: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 16, border: '1px solid var(--pa-border)', background: 'var(--pa-card)', minWidth: 0 };
export const resultsGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))', gap: 12, alignItems: 'start' };

/** Footer under a results list: the page-by-page "Show more" (the app loads the next page on scroll). */
export function LoadMore({ shown, total, busy, onMore }: { shown: number; total: number; busy: boolean; onMore: () => void }) {
  if (shown >= total) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
      <button type="button" onClick={onMore} disabled={busy} style={{ height: 38, padding: '0 18px', borderRadius: 10, border: '1px solid var(--pa-border)', background: 'var(--pa-card)', color: 'var(--pa-text)', fontWeight: 600, fontSize: 13.5, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}>
        {busy ? 'Loading…' : `Show more (${shown.toLocaleString('en-SG')} of ${total.toLocaleString('en-SG')})`}
      </button>
    </div>
  );
}
