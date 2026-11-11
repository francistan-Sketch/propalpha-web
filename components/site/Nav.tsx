'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Wordmark from './Wordmark';
import ThemeToggle from './ThemeToggle';
import { isLoggedIn } from '@/lib/auth';

export type NavCurrent = 'home' | 'features' | 'flyer' | 'market' | 'platform' | 'download' | 'none';

const LINKS: { key: NavCurrent; href: string; label: string }[] = [
  { key: 'features', href: '/#features', label: 'Features' },
  { key: 'flyer', href: '/flyer-maker', label: 'Flyer Maker' },
  { key: 'market', href: '/#market', label: 'Market Data' },
  { key: 'platform', href: '/platform', label: 'Platform' },
  { key: 'download', href: '/download', label: 'Download' },
];

// Sticky public navigation, 68px, blurred. Links hide under 860px behind a hamburger (.pa-desk / .pa-mob).
// When a user is signed in, "Sign In" becomes "Open PropAlpha".
export default function Nav({ current = 'none' }: { current?: NavCurrent }) {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { setSignedIn(isLoggedIn()); }, []);
  const color = (k: NavCurrent) => (k === current ? 'var(--pa-text)' : 'var(--pa-text-2)');
  const signIn = signedIn ? { href: '/dashboard', label: 'Open PropAlpha' } : { href: '/login', label: 'Sign In' };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', background: 'color-mix(in srgb, var(--pa-bg) 72%, transparent)', borderBottom: '1px solid var(--pa-border)' }}>
      <div style={{ maxWidth: 'var(--pa-max)', margin: '0 auto', padding: '0 var(--pa-pad)', height: 68, display: 'flex', alignItems: 'center', gap: 20 }}>
        <Wordmark />
        <nav className="pa-desk" style={{ display: 'flex', alignItems: 'center', gap: 22, marginLeft: 'auto', fontSize: 14.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
          {LINKS.map((l) => (
            <Link key={l.key} className="pa-link" href={l.href} style={{ color: color(l.key) }}>{l.label}</Link>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto', whiteSpace: 'nowrap', flex: 'none' }}>
          <ThemeToggle />
          <Link className="pa-desk pa-link" href={signIn.href} style={{ display: 'inline-flex', alignItems: 'center', height: 38, padding: '0 14px', fontSize: 14.5, fontWeight: 600, color: 'var(--pa-text-2)' }}>{signIn.label}</Link>
          <Link className="pa-btn pa-hide-xs" href="/download" style={{ display: 'inline-flex', alignItems: 'center', height: 38, padding: '0 16px', borderRadius: 10, background: 'var(--pa-primary)', color: '#fff', fontWeight: 700, fontSize: 14.5 }}>Get the App</Link>
          <button type="button" className="pa-mob" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open} style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid var(--pa-border)', background: 'var(--pa-card)', color: 'var(--pa-text)', placeItems: 'center', cursor: 'pointer', alignItems: 'center', justifyContent: 'center' }}>
            {open ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            )}
          </button>
        </div>
      </div>
      {open && (
        <nav style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--pa-border)', padding: '12px var(--pa-pad) 20px', gap: 4, fontSize: 17, fontWeight: 600, background: 'var(--pa-bg)' }}>
          {LINKS.map((l) => (
            <Link key={l.key} href={l.href} onClick={() => setOpen(false)} style={{ padding: '12px 0', borderBottom: '1px solid var(--pa-border)', color: 'var(--pa-text)' }}>{l.label}</Link>
          ))}
          <Link href={signIn.href} onClick={() => setOpen(false)} style={{ padding: '12px 0', color: 'var(--pa-text)' }}>{signIn.label}</Link>
        </nav>
      )}
    </header>
  );
}
