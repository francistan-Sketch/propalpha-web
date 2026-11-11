import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

// Small shared primitives from the component sheet. Everything takes `style` for one-off tweaks.

export function Kicker({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <span style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--pa-amber)', ...style }}>{children}</span>;
}

export function H2({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', marginTop: 12, ...style }}>{children}</h2>;
}

export function Lead({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <p style={{ fontSize: 17, color: 'var(--pa-text-2)', maxWidth: 520, ...style }}>{children}</p>;
}

export function Caption({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <p style={{ fontSize: 13, color: 'var(--pa-text-3)', ...style }}>{children}</p>;
}

export const ArrowRight = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

type BtnProps = { href?: string; onClick?: () => void; children: ReactNode; variant?: 'primary' | 'secondary' | 'amber' | 'ghost'; size?: 'md' | 'lg'; style?: CSSProperties; type?: 'button' | 'submit'; disabled?: boolean; arrow?: boolean };

const VARIANT: Record<NonNullable<BtnProps['variant']>, CSSProperties> = {
  primary: { background: 'var(--pa-primary)', color: '#fff', fontWeight: 700, border: 0, boxShadow: '0 10px 30px -10px rgba(112,40,184,.8)' },
  secondary: { background: 'color-mix(in srgb, var(--pa-card) 70%, transparent)', color: 'var(--pa-text)', fontWeight: 600, border: '1px solid var(--pa-border)' },
  amber: { background: 'var(--pa-amber)', color: '#1E1B4B', fontWeight: 800, border: 0 },
  ghost: { background: 'transparent', color: 'var(--pa-text-2)', fontWeight: 600, border: 0 },
};

/** 50px (lg) or 38px (md) button from the sheet; renders a Link when href is given. */
export function Btn({ href, onClick, children, variant = 'primary', size = 'lg', style, type = 'button', disabled, arrow }: BtnProps) {
  const base: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, height: size === 'lg' ? 50 : 38,
    padding: size === 'lg' ? '0 22px' : '0 16px', borderRadius: size === 'lg' ? 12 : 10, fontSize: size === 'lg' ? 16 : 14.5,
    cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.45 : 1, whiteSpace: 'nowrap', ...VARIANT[variant], ...style,
  };
  const inner = <>{children}{arrow && <ArrowRight />}</>;
  if (href) return <Link className="pa-btn" href={href} style={base}>{inner}</Link>;
  return <button className="pa-btn" type={type} onClick={onClick} disabled={disabled} style={base}>{inner}</button>;
}

export function Tag({ kind, children }: { kind: 'live' | 'coming' | 'locked' | 'new'; children?: ReactNode }) {
  const s: Record<string, CSSProperties> = {
    live: { background: 'color-mix(in srgb, var(--pa-emerald) 18%, transparent)', color: 'var(--pa-emerald)' },
    coming: { background: 'color-mix(in srgb, var(--pa-amber) 18%, transparent)', color: 'var(--pa-amber)' },
    locked: { background: 'var(--pa-bg)', border: '1px solid var(--pa-border)', color: 'var(--pa-text-2)', fontWeight: 700, letterSpacing: 0, textTransform: 'none' },
    new: { background: 'var(--pa-amber)', color: '#1E1B4B', letterSpacing: '.1em' },
  };
  const label = children ?? { live: 'Live', coming: 'Coming', locked: 'Locked', new: 'New' }[kind];
  return <span style={{ display: 'inline-flex', padding: '4px 9px', borderRadius: 6, fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', ...s[kind] }}>{label}</span>;
}

/** Section wrapper: max-width 1200, page gutter, section rhythm on top. */
export function Section({ id, children, style, className }: { id?: string; children: ReactNode; style?: CSSProperties; className?: string }) {
  return <section id={id} className={className} style={{ maxWidth: 'var(--pa-max)', margin: '0 auto', padding: 'var(--pa-sec) var(--pa-pad) 0', ...style }}>{children}</section>;
}

export const card: CSSProperties = { padding: 22, borderRadius: 18, border: '1px solid var(--pa-border)', background: 'color-mix(in srgb, var(--pa-card) 85%, transparent)' };
