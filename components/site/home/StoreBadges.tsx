import Link from 'next/link';
import type { CSSProperties } from 'react';
import { APP_STORE_URL, GOOGLE_PLAY_URL } from './data';

// Black store badges from the design: 52px tall, 1px rgba(255,255,255,.2) border, icon + two-line label.
const badge: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 10, height: 52, padding: '0 18px', borderRadius: 12, background: '#000', color: '#fff', fontWeight: 700, border: '1px solid rgba(255,255,255,.2)' };
const lines: CSSProperties = { display: 'flex', flexDirection: 'column', lineHeight: 1.1, textAlign: 'left' };
const small: CSSProperties = { fontSize: 10, fontWeight: 500 };
const big: CSSProperties = { fontSize: 16 };

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.4 12.6c0-2.5 2-3.7 2.1-3.7-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.7.9-.8 0-2-.9-3.3-.9-1.7 0-3.2 1-4.1 2.5-1.8 3-.5 7.6 1.3 10.1.8 1.2 1.8 2.6 3.1 2.5 1.3 0 1.7-.8 3.3-.8s2 .8 3.3.8c1.4 0 2.2-1.2 3.1-2.5.9-1.4 1.3-2.7 1.4-2.8-.1 0-2.9-1.1-2.9-4.1ZM14 5.3c.7-.8 1.2-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1.1 3 1.1.1 2.3-.6 3-1.4Z" /></svg>
);
const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.6 2.3 13 12l-9.4 9.7c-.4-.3-.6-.8-.6-1.4V3.7c0-.6.2-1.1.6-1.4Zm1.4-.3 11 6.3-2.6 2.6L5 1.9Zm0 20 8.4-8.9 2.6 2.6L5 22Zm12.2-12.8 3.4 2c1.2.7 1.2 1.8 0 2.5l-3.4 2-2.9-2.9-.1-.1 3-2.9Z" /></svg>
);

export function AppStoreBadge() {
  const inner = (
    <>
      <AppleIcon />
      <span style={lines}><span style={small}>Download on the</span><span style={big}>App Store</span></span>
    </>
  );
  if (APP_STORE_URL.startsWith('/')) return <Link className="pa-btn" href={APP_STORE_URL} style={badge} aria-label="Download on the App Store">{inner}</Link>;
  return <a className="pa-btn" href={APP_STORE_URL} style={badge} aria-label="Download on the App Store" target="_blank" rel="noopener noreferrer">{inner}</a>;
}

export function GooglePlayBadge() {
  return (
    <a className="pa-btn" href={GOOGLE_PLAY_URL} style={badge} aria-label="Get it on Google Play" target="_blank" rel="noopener noreferrer">
      <PlayIcon />
      <span style={lines}><span style={small}>Get it on</span><span style={big}>Google Play</span></span>
    </a>
  );
}
