'use client';

import type { CSSProperties, ReactNode } from 'react';

// Form pieces for the Income Valuation tool, from the design's Inputs card: 12px label above a 40px field
// (radius 9, page background), a red border and "Enter a positive amount." line when a field blocks the run.

export const inputStyle: CSSProperties = {
  width: '100%', height: 40, padding: '0 12px', borderRadius: 9, border: '1px solid var(--pa-border)', background: 'var(--pa-bg)',
  color: 'var(--pa-text)', fontSize: 14, fontVariantNumeric: 'tabular-nums', outline: 'none', boxSizing: 'border-box', minWidth: 0,
};

export function Field({ label, value, onChange, suffix, placeholder, hint, error, kind = 'num', style }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  placeholder?: string;
  hint?: ReactNode;
  /** Message under the field; also paints the border red. */
  error?: string;
  kind?: 'num' | 'money' | 'text';
  style?: CSSProperties;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: 'var(--pa-text-2)', minWidth: 0, ...style }}>
      {label}
      <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={kind === 'text' ? 'text' : 'decimal'}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          style={{ ...inputStyle, paddingRight: suffix ? 12 + suffix.length * 7.5 + 8 : 12, borderColor: error ? '#F87171' : 'var(--pa-border)', textAlign: kind === 'text' ? 'left' : 'right' }}
        />
        {suffix && <span aria-hidden="true" style={{ position: 'absolute', right: 12, fontSize: 12, color: 'var(--pa-text-3)', pointerEvents: 'none', whiteSpace: 'nowrap' }}>{suffix}</span>}
      </span>
      {error ? <span style={{ fontSize: 12, color: '#F87171' }}>{error}</span> : hint ? <span style={{ fontSize: 11.5, color: 'var(--pa-text-3)', lineHeight: 1.4 }}>{hint}</span> : null}
    </label>
  );
}

/** Small filled toggle used for asset class, NOI mode and financing. */
export function ToggleGroup<T extends string | boolean>({ options, value, onChange, ariaLabel }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; ariaLabel: string }) {
  return (
    <div role="group" aria-label={ariaLabel} style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)} type="button" onClick={() => onChange(o.value)} aria-pressed={on}
            style={{ height: 32, padding: '0 12px', borderRadius: 8, border: `1px solid ${on ? 'var(--pa-primary)' : 'var(--pa-border)'}`, background: on ? 'var(--pa-primary)' : 'transparent', color: on ? '#fff' : 'var(--pa-text-2)', fontSize: 12.5, fontWeight: on ? 700 : 600, cursor: 'pointer' }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Uppercase divider between groups of inputs. */
export function FormSection({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
      <span style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--pa-text-3)', fontWeight: 800, whiteSpace: 'nowrap' }}>{title}</span>
      <span style={{ flex: 1, height: 1, background: 'var(--pa-border)' }} />
      {children}
    </div>
  );
}
