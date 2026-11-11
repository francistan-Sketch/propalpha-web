'use client';

import Link from 'next/link';

// The gated treatment from the design (Tech Tools, free plan): amber banner with "See plans", and the
// tile at 75% opacity with the Locked tag and "Included in Plus" with the upgrade link.

const btn = { height: 36, display: 'inline-flex', alignItems: 'center', padding: '0 14px', borderRadius: 9, fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap' } as const;

export default function FlyerLocked() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 760 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '14px 16px', borderRadius: 14, border: '1px solid color-mix(in srgb, var(--pa-amber) 50%, transparent)', background: 'color-mix(in srgb, var(--pa-amber) 10%, transparent)', fontSize: 14 }}>
        <span style={{ flex: 1, minWidth: 200 }}>Flyer Maker is included in Plus. Start a 14-day free trial to use it.</span>
        <Link href="/pricing" className="pa-btn" style={{ ...btn, background: 'var(--pa-amber)', color: '#1E1B4B' }}>See plans</Link>
      </div>
      <div style={{ position: 'relative', padding: 20, borderRadius: 16, border: '1px solid var(--pa-border)', background: 'var(--pa-card)', opacity: 0.75, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 150 }}>
        <span style={{ position: 'absolute', top: 14, right: 14, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 6, background: 'var(--pa-bg)', border: '1px solid var(--pa-border)', fontSize: 11, fontWeight: 700, color: 'var(--pa-text-2)' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>Locked
        </span>
        <span style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--pa-text-3)', fontWeight: 800 }}>Flyers</span>
        <strong style={{ fontSize: 16 }}>Flyer Maker</strong>
        <span style={{ fontSize: 13.5, color: 'var(--pa-text-2)' }}>Your estate&apos;s market letter, in minutes. Pick an estate, choose the URA REALIS figures, let AI write the words, pick a theme, export A4 or social sizes.</span>
        <span style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12, color: 'var(--pa-text-3)' }}>
          Included in Plus
          <Link href="/pricing" className="pa-btn" style={{ ...btn, height: 30, padding: '0 12px', borderRadius: 8, background: 'var(--pa-primary)', color: '#fff', fontWeight: 700, fontSize: 12.5 }}>Upgrade to Plus</Link>
        </span>
      </div>
    </div>
  );
}
