import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Nav from '@/components/site/Nav';
import Footer from '@/components/site/Footer';
import Shot, { shotRatio } from '@/components/site/Shot';
import { Kicker } from '@/components/site/ui';
import { publicFileExists } from '@/components/site/download/publicAsset';

export const metadata: Metadata = {
  title: 'Download PropAlpha',
  description: 'Get PropAlpha for iOS and Android. iPhone and iPad. Market data is free for all users; agent tools require activation by Luminaire Proptech.',
};

// Ported from design_handoff_propalpha_website/PropAlpha-Download.dc.html.

/** The App Store URL is not known yet; it points back here until Francis supplies it. */
const APP_STORE_URL = '/download';
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=sg.propalpha.app';

const FREE = ['Market Updates, refreshed with every URA release', 'Transaction search', 'New launch explorer and tower views', 'Maps with psf pins', 'AI Socrates'];
const AGENT = ['Flyer Maker', 'Income Valuation', 'CEA Forms 1 to 8', 'Tenancy tools: LOI, TA, room inventory', 'Inbox and client chat'];

const QRS = [
  { key: 'ios', src: '/site/qr/appstore.png', alt: 'QR code for PropAlpha on the App Store', label: 'Scan for the App Store', ph: 'QR · App Store' },
  { key: 'android', src: '/site/qr/play.png', alt: 'QR code for PropAlpha on Google Play', label: 'Scan for Google Play', ph: 'QR · Google Play' },
];

const badge: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 10, height: 56, padding: '0 20px', borderRadius: 12, background: '#000', color: '#fff',
  fontWeight: 700, border: '1px solid rgba(255,255,255,.2)',
};
const badgeText: CSSProperties = { display: 'flex', flexDirection: 'column', lineHeight: 1.1, textAlign: 'left' };
const qrCard: CSSProperties = { display: 'flex', alignItems: 'center', gap: 14, padding: 12, borderRadius: 14, border: '1px solid var(--pa-border)', background: 'var(--pa-card)' };
const qrWell: CSSProperties = { width: 96, height: 96, borderRadius: 8, background: '#fff', overflow: 'hidden', flex: 'none', display: 'grid', placeItems: 'center' };
const planCard: CSSProperties = {
  padding: 32, borderRadius: 22, border: '1px solid var(--pa-border)', background: 'color-mix(in srgb, var(--pa-card) 85%, transparent)',
  display: 'flex', flexDirection: 'column', gap: 18,
};
const li: CSSProperties = { padding: '12px 0', borderTop: '1px solid var(--pa-border)', fontSize: 16, display: 'flex', gap: 12 };

const AppleMark = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.4 12.6c0-2.5 2-3.7 2.1-3.7-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.7.9-.8 0-2-.9-3.3-.9-1.7 0-3.2 1-4.1 2.5-1.8 3-.5 7.6 1.3 10.1.8 1.2 1.8 2.6 3.1 2.5 1.3 0 1.7-.8 3.3-.8s2 .8 3.3.8c1.4 0 2.2-1.2 3.1-2.5.9-1.4 1.3-2.7 1.4-2.8-.1 0-2.9-1.1-2.9-4.1ZM14 5.3c.7-.8 1.2-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1.1 3 1.1.1 2.3-.6 3-1.4Z" /></svg>
);
const PlayMark = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.6 2.3 13 12l-9.4 9.7c-.4-.3-.6-.8-.6-1.4V3.7c0-.6.2-1.1.6-1.4Zm1.4-.3 11 6.3-2.6 2.6L5 1.9Zm0 20 8.4-8.9 2.6 2.6L5 22Zm12.2-12.8 3.4 2c1.2.7 1.2 1.8 0 2.5l-3.4 2-2.9-2.9-.1-.1 3-2.9Z" /></svg>
);

export default function DownloadPage() {
  const qrs = QRS.map((q) => ({ ...q, exists: publicFileExists(q.src) }));

  return (
    <div className="pa-page">
      <Nav current="download" />

      {/* Hero */}
      <section className="pa-2col" style={{ maxWidth: 'var(--pa-max)', margin: '0 auto', padding: 'clamp(56px,8vw,112px) var(--pa-pad) 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(32px,5vw,72px)', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26, minWidth: 0 }}>
          <Kicker>Download</Kicker>
          <h1 style={{ fontSize: 'clamp(40px,5.4vw,72px)' }}>Get PropAlpha.</h1>
          <p style={{ fontSize: 18, color: 'var(--pa-text-2)', maxWidth: 520 }}>iOS and Android. iPhone and iPad. Market data is free for all users. Agent tools require activation by Luminaire Proptech.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Link className="pa-btn" href={APP_STORE_URL} style={badge}>
              <AppleMark />
              <span style={badgeText}><span style={{ fontSize: 11, fontWeight: 500 }}>Download on the</span><span style={{ fontSize: 17 }}>App Store</span></span>
            </Link>
            <a className="pa-btn" href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer" style={badge}>
              <PlayMark />
              <span style={badgeText}><span style={{ fontSize: 11, fontWeight: 500 }}>Get it on</span><span style={{ fontSize: 17 }}>Google Play</span></span>
            </a>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            {qrs.map((q) => (
              <div key={q.key} style={qrCard}>
                <div style={qrWell}>
                  {q.exists ? (
                    <Image src={q.src} alt={q.alt} width={96} height={96} style={{ display: 'block', width: 96, height: 96, objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: 11, color: '#8A857A', textAlign: 'center', padding: 8 }}>{q.ph}</span>
                  )}
                </div>
                <span style={{ fontSize: 13, color: 'var(--pa-text-2)', width: 90 }}>{q.label}</span>
              </div>
            ))}
          </div>
        </div>
        <figure style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', margin: 0 }}>
          <Shot id="iphone69-01" priority position="50% 0%" style={{ width: 'min(340px,80%)', aspectRatio: shotRatio('iphone69-01') }} sizes="(max-width: 860px) 80vw, 340px" />
          <figcaption style={{ fontSize: 13, color: 'var(--pa-text-3)' }}>Two ways to work: ask Socrates, or search the classic way</figcaption>
        </figure>
      </section>

      {/* Free / agents */}
      <section className="pa-2col" style={{ maxWidth: 'var(--pa-max)', margin: 'var(--pa-sec) auto', padding: '0 var(--pa-pad)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={planCard}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--pa-emerald)' }}>Free for everyone</span>
          <h2 style={{ fontSize: 28 }}>What you get free</h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
            {FREE.map((f) => (
              <li key={f} style={li}><span style={{ color: 'var(--pa-emerald)', fontWeight: 800 }}>—</span>{f}</li>
            ))}
          </ul>
        </div>
        <div style={planCard}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--pa-amber)' }}>Agents unlock</span>
          <h2 style={{ fontSize: 28 }}>What agents unlock</h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
            {AGENT.map((f) => (
              <li key={f} style={li}><span style={{ color: 'var(--pa-amber)', fontWeight: 800 }}>—</span>{f}</li>
            ))}
          </ul>
          <p style={{ fontSize: 14, color: 'var(--pa-text-3)' }}>Tech Tools need agent activation. Contact Luminaire Proptech after you sign in.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
