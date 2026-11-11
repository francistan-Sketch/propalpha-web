'use client';

import type { CSSProperties, ReactNode } from 'react';

// Field and button primitives lifted from the `flyer` screen of PropAlpha-App.dc.html (sizes and colours as drawn).

export const inputStyle: CSSProperties = {
  height: 44, padding: '0 14px', borderRadius: 10, border: '1px solid var(--pa-border)', background: 'var(--pa-bg)',
  color: 'var(--pa-text)', fontSize: 14, width: '100%', minWidth: 0,
};

export const textareaStyle: CSSProperties = {
  minHeight: 60, padding: '10px 12px', borderRadius: 9, border: '1px solid var(--pa-border)', background: 'var(--pa-bg)',
  color: 'var(--pa-text)', fontSize: 14, resize: 'vertical', width: '100%', lineHeight: 1.45, fontFamily: 'inherit',
};

export const selectStyle: CSSProperties = {
  height: 36, padding: '0 10px', borderRadius: 9, border: '1px solid var(--pa-border)', background: 'var(--pa-bg)',
  color: 'var(--pa-text)', fontSize: 13, minWidth: 0,
};

export function Field({ label, children, style }: { label: ReactNode; children: ReactNode; style?: CSSProperties }) {
  return <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: 'var(--pa-text-2)', ...style }}>{label}{children}</label>;
}

export function Kicker({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <span style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--pa-text-3)', ...style }}>{children}</span>;
}

export function Sub({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <span style={{ fontSize: 12.5, color: 'var(--pa-text-3)', lineHeight: 1.4, ...style }}>{children}</span>;
}

/** 999px pill; the "Recent" chips of the design, also used as the on/off choice chips. */
export function Pill({ on, onClick, children, title, style }: { on?: boolean; onClick?: () => void; children: ReactNode; title?: string; style?: CSSProperties }) {
  return (
    <button type="button" onClick={onClick} title={title} className="pa-btn" style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, fontSize: 12.5, cursor: 'pointer',
      border: `1px solid ${on ? 'var(--pa-primary)' : 'var(--pa-border)'}`,
      background: on ? 'color-mix(in srgb, var(--pa-primary) 22%, transparent)' : 'transparent',
      color: on ? 'var(--pa-text)' : 'var(--pa-text-2)', fontWeight: on ? 700 : 400, ...style,
    }}>{children}</button>
  );
}

/** The 36px outline button ("Rewrite with AI", "Change photo"). */
export function SmallBtn({ onClick, children, disabled, style }: { onClick?: () => void; children: ReactNode; disabled?: boolean; style?: CSSProperties }) {
  return (
    <button type="button" className="pa-btn" onClick={onClick} disabled={disabled} style={{
      alignSelf: 'flex-start', height: 36, padding: '0 14px', borderRadius: 9, border: '1px solid var(--pa-border)', background: 'transparent',
      color: 'var(--pa-text)', fontWeight: 600, fontSize: 13, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
      display: 'inline-flex', alignItems: 'center', gap: 8, ...style,
    }}>{children}</button>
  );
}

/** The 44px export buttons: primary (filled) or outline. */
export function BigBtn({ onClick, children, primary, disabled, style }: { onClick?: () => void; children: ReactNode; primary?: boolean; disabled?: boolean; style?: CSSProperties }) {
  return (
    <button type="button" className="pa-btn" onClick={onClick} disabled={disabled} style={{
      height: 44, borderRadius: 10, fontSize: 14, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1, width: '100%',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      ...(primary ? { border: 0, background: 'var(--pa-primary)', color: '#fff', fontWeight: 700 }
        : { border: '1px solid var(--pa-border)', background: 'transparent', color: 'var(--pa-text)', fontWeight: 600 }),
      ...style,
    }}>{children}</button>
  );
}

/** A selectable list row (search result, recent search). */
export function Row({ onClick, selected, children, style }: { onClick?: () => void; selected?: boolean; children: ReactNode; style?: CSSProperties }) {
  return (
    <button type="button" className="pa-row" onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 10,
      border: `1px solid ${selected ? 'var(--pa-primary)' : 'var(--pa-border)'}`, background: 'var(--pa-bg)', color: 'var(--pa-text)', cursor: 'pointer',
      ...style,
    }}>{children}</button>
  );
}

export function Spinner({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return <span className="pa-spin" aria-hidden style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${color}`, borderRightColor: 'transparent', display: 'inline-block', flex: 'none' }} />;
}

export function ErrorLine({ children }: { children: ReactNode }) {
  return <span style={{ fontSize: 12.5, color: 'var(--pa-error)' }}>{children}</span>;
}

/** Stat tile from the summary card (the mobile app's statRow). */
export function Stat({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: 'var(--pa-bg)', border: '1px solid var(--pa-border)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
      <div style={{ color: 'var(--pa-amber)', fontSize: 16, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{value || '—'}</div>
      <div style={{ color: 'var(--pa-text)', fontSize: 10.5, fontWeight: 700, marginTop: 3 }}>{label}</div>
      <div style={{ color: 'var(--pa-text-3)', fontSize: 10.5 }}>{sub}</div>
    </div>
  );
}

export function scopeLabel(scope: string): string {
  return scope === 'street' ? 'Street' : scope === 'estate' ? 'Estate' : 'Condo';
}
