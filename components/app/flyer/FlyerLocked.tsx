'use client';

// The gated treatment from the design (Tech Tools, free plan): amber banner with "Request activation", and the
// tile at 75% opacity with the Locked tag and "Ask Luminaire Proptech to activate".
const MAILTO = 'mailto:contact@luminaireproptech.com.sg?subject=Activate%20Flyer%20Maker';

export default function FlyerLocked() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 760 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '14px 16px', borderRadius: 14, border: '1px solid color-mix(in srgb, var(--pa-amber) 50%, transparent)', background: 'color-mix(in srgb, var(--pa-amber) 10%, transparent)', fontSize: 14 }}>
        <span style={{ flex: 1, minWidth: 200 }}>Flyer Maker is an agent tool. Ask Luminaire Proptech to activate it for your account.</span>
        <a className="pa-btn" href={MAILTO} style={{ height: 36, display: 'inline-flex', alignItems: 'center', padding: '0 14px', borderRadius: 9, background: 'var(--pa-amber)', color: '#1E1B4B', fontWeight: 800, fontSize: 13 }}>Request activation</a>
      </div>
      <div style={{ position: 'relative', padding: 20, borderRadius: 16, border: '1px solid var(--pa-border)', background: 'var(--pa-card)', opacity: 0.75, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 150 }}>
        <span style={{ position: 'absolute', top: 14, right: 14, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 6, background: 'var(--pa-bg)', border: '1px solid var(--pa-border)', fontSize: 11, fontWeight: 700, color: 'var(--pa-text-2)' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>Locked
        </span>
        <span style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--pa-text-3)', fontWeight: 800 }}>Flyers</span>
        <strong style={{ fontSize: 16 }}>Flyer Maker</strong>
        <span style={{ fontSize: 13.5, color: 'var(--pa-text-2)' }}>Your estate&apos;s market letter, in minutes. Pick an estate, choose the URA REALIS figures, let AI write the words, pick a theme, export A4 or social sizes.</span>
        <a className="pa-link" href={MAILTO} style={{ marginTop: 'auto', fontSize: 12, color: 'var(--pa-text-3)' }}>Ask Luminaire Proptech to activate</a>
      </div>
    </div>
  );
}
