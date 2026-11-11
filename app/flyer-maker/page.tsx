import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Nav from '@/components/site/Nav';
import Footer from '@/components/site/Footer';
import Shot, { shotRatio } from '@/components/site/Shot';
import { Kicker, H2 } from '@/components/site/ui';
import { loadThemes } from '@/components/site/flyer/themes';

export const metadata: Metadata = {
  title: 'Flyer Maker — PropAlpha',
  description:
    'Your estate’s market letter, in minutes. Pick an estate, street or condo; live URA REALIS figures fill in, AI writes the words, you pick the theme and export.',
};

// Ported from design_handoff_propalpha_website/PropAlpha-Flyer-Maker.dc.html.

/** "Open on the web": the design points at the web app's Flyer Maker; the signed-in tools hub is the nearest route today. */
const WEB_FLYER_URL = '/tools';

const STEPS = [
  { n: '1', t: 'Estate', d: 'Pick an estate, street or condo. Recent searches are remembered.' },
  { n: '2', t: 'Content', d: 'URA REALIS transactions, record prices and the psf trend load in.' },
  { n: '3', t: 'Words', d: 'AI writes the headline, summary, taglines and analysis. Edit anything.' },
  { n: '4', t: 'Template', d: 'Six market-letter themes, social sizes and the PropAlpha app flyer.' },
  { n: '5', t: 'Export', d: 'A4 fold-to-A5 PDF or image. Share on WhatsApp.' },
];

const ON_FLYER = [
  'Record prices and the psf trend, from URA REALIS',
  'AI-written headline, summary and taglines, all editable',
  'Your name, CEA number and portrait',
  'Your photos of the estate',
  'WhatsApp QR code',
  'Your PropAlpha join code',
  'A4 fold-to-A5 PDF, or image for social',
];

const sectionStyle: CSSProperties = { maxWidth: 'var(--pa-max)', margin: '0 auto', padding: 'var(--pa-sec) var(--pa-pad) 0' };
const cardBg = 'color-mix(in srgb, var(--pa-card) 85%, transparent)';

export default function FlyerMakerPage() {
  const themes = loadThemes();

  return (
    <div className="pa-page">
      <Nav current="flyer" />

      {/* Hero: iPad 04 bleeds right; the section clips it so nothing scrolls sideways */}
      <section style={{ overflow: 'hidden' }}>
        <div className="pa-2col" style={{ maxWidth: 'var(--pa-max)', margin: '0 auto', padding: 'clamp(56px,8vw,112px) var(--pa-pad) 0', display: 'grid', gridTemplateColumns: '.9fr 1.1fr', gap: 'clamp(32px,5vw,72px)', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            <Kicker>Flyer Maker</Kicker>
            <h1 style={{ fontSize: 'clamp(40px,5.2vw,70px)' }}>Your estate&apos;s market letter, in minutes.</h1>
            <p style={{ fontSize: 18, color: 'var(--pa-text-2)', maxWidth: 520 }}>Pick an estate, street or condo. Live URA REALIS figures fill in, AI writes the words, you pick the theme and export. Every flyer carries your name, CEA number and WhatsApp QR.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <Link className="pa-btn" href="/download" style={{ display: 'inline-flex', alignItems: 'center', height: 50, padding: '0 22px', borderRadius: 12, background: 'var(--pa-primary)', color: '#fff', fontWeight: 700, fontSize: 16 }}>Download Free</Link>
              <Link className="pa-btn pa-link" href={WEB_FLYER_URL} style={{ display: 'inline-flex', alignItems: 'center', height: 50, padding: '0 22px', borderRadius: 12, border: '1px solid var(--pa-border)', color: 'var(--pa-text)', fontWeight: 600, fontSize: 16 }}>Open on the web</Link>
            </div>
            <p style={{ fontSize: 13, color: 'var(--pa-text-3)' }}>Agent tool. Activated by Luminaire Proptech.</p>
          </div>
          <figure style={{ position: 'relative', marginRight: '-12vw', marginLeft: 0, marginTop: 0, marginBottom: 0, minWidth: 0 }}>
            <Shot id="ipad13-04" priority position="50% 0%" style={{ aspectRatio: '3 / 4', maxHeight: 720 }} sizes="(max-width: 860px) 100vw, 60vw" />
            <figcaption style={{ marginTop: 10, fontSize: 13, color: 'var(--pa-text-3)' }}>Prestige market letter, Pavilion Park</figcaption>
          </figure>
        </div>
      </section>

      {/* Five steps */}
      <section style={sectionStyle}>
        <div style={{ maxWidth: 680, marginBottom: 40 }}>
          <Kicker>Five steps</Kicker>
          <H2>Estate, Content, Words, Template, Export.</H2>
        </div>
        <div className="pa-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 16 }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 22, borderRadius: 18, border: '1px solid var(--pa-border)', background: cardBg }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--pa-amber)' }}>{s.n}</span>
              <strong style={{ fontSize: 18 }}>{s.t}</strong>
              <span style={{ fontSize: 14.5, color: 'var(--pa-text-2)', lineHeight: 1.5 }}>{s.d}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Themes */}
      <section style={sectionStyle}>
        <div className="pa-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'end', marginBottom: 40 }}>
          <div>
            <Kicker>Themes</Kicker>
            <H2>Six market letters. Four more sizes.</H2>
          </div>
          <p style={{ fontSize: 16, color: 'var(--pa-text-2)' }}>Each theme is a designed layout, not a colour swap. Social sizes share the same figures and words.</p>
        </div>
        <div className="pa-4col" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 14 }}>
          {themes.map((t) => (
            <figure key={t.slug} className="pa-card-h" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 10, borderRadius: 14, border: '1px solid var(--pa-border)', background: cardBg, margin: 0, minWidth: 0 }}>
              <div style={{ position: 'relative', aspectRatio: t.ar, borderRadius: 8, overflow: 'hidden', background: 'var(--pa-well)', border: '1px solid var(--pa-well-border)' }}>
                {t.src ? (
                  <Image src={t.src} alt={`${t.t} theme preview`} fill sizes="(max-width: 560px) 45vw, (max-width: 1200px) 20vw, 230px" quality={82} style={{ objectFit: 'cover', objectPosition: '50% 0%' }} />
                ) : null}
              </div>
              <figcaption style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13 }}>
                <strong>{t.t}</strong>
                <span style={{ color: 'var(--pa-text-3)', flex: 'none' }}>{t.k}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* What is on every flyer */}
      <section className="pa-2col" style={{ ...sectionStyle, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(32px,5vw,72px)', alignItems: 'center' }}>
        <figure style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', margin: 0 }}>
          <Shot id="iphone69-05" position="50% 0%" style={{ width: 'min(320px,80%)', aspectRatio: shotRatio('iphone69-05') }} sizes="(max-width: 860px) 80vw, 320px" />
          <figcaption style={{ fontSize: 13, color: 'var(--pa-text-3)' }}>Template picker, ten templates</figcaption>
        </figure>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div>
            <Kicker>What is on every flyer</Kicker>
            <H2>The figures, the words, and you.</H2>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
            {ON_FLYER.map((f) => (
              <li key={f} style={{ padding: '12px 0', borderTop: '1px solid var(--pa-border)', fontSize: 16, display: 'flex', gap: 12, color: 'var(--pa-text-2)' }}>
                <span style={{ color: 'var(--pa-emerald)', fontWeight: 800 }}>—</span>{f}
              </li>
            ))}
          </ul>
          <p style={{ fontSize: 13, color: 'var(--pa-text-3)' }}>Figures are for illustration and are not valuation advice. Recent searches are remembered.</p>
        </div>
      </section>

      {/* CTA band */}
      <section style={{ maxWidth: 'var(--pa-max)', margin: 'var(--pa-sec) auto', padding: '0 var(--pa-pad)' }}>
        <div style={{ padding: 'clamp(32px,5vw,56px)', borderRadius: 28, background: 'linear-gradient(135deg,var(--pa-deep-1),var(--pa-deep-2) 60%,var(--pa-primary))', color: '#fff', display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 40px 80px -30px rgba(112,40,184,.8)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 560 }}>
            <h2 style={{ fontSize: 'clamp(28px,3.6vw,44px)' }}>Make your first market letter.</h2>
            <p style={{ fontSize: 16, color: '#E9D5FF' }}>Download PropAlpha, sign in, then ask Luminaire Proptech to activate Flyer Maker.</p>
          </div>
          <Link className="pa-btn" href="/download" style={{ display: 'inline-flex', alignItems: 'center', height: 52, padding: '0 22px', borderRadius: 12, background: '#fff', color: 'var(--pa-deep-1)', fontWeight: 800, fontSize: 16 }}>Download Free</Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
