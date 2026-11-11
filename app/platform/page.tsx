import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import Image from 'next/image';
import Nav from '@/components/site/Nav';
import Footer from '@/components/site/Footer';
import { Kicker, H2, Tag } from '@/components/site/ui';
import ContactForm from '@/components/site/platform/ContactForm';
import { publicFileExists } from '@/components/site/download/publicAsset';

export const metadata: Metadata = {
  title: 'PropAlpha Platform — for agencies and partners',
  description:
    'PropAlpha is Singapore property analytics rebuilt as an API, with a trained Socrates AI on top. Partner sites call the partner data API with a key issued by Luminaire Proptech.',
};

// Ported from design_handoff_propalpha_website/PropAlpha-Platform.dc.html. Section order and copy are the design's;
// showcase status reflects both sites live on PropAlpha as of 10 Nov 2026.

const SURFACES: { status: 'Live' | 'Coming'; c: string; t: string; d: string }[] = [
  { status: 'Live', c: 'var(--pa-emerald)', t: 'Data', d: 'District and project statistics, latest transactions, psf trends and tower grids for any condo project or landed estate.' },
  { status: 'Live', c: 'var(--pa-emerald)', t: 'Calculators', d: 'Buyer, seller and Executive Condo calculations, rental yields and income valuation, from the same engine as the app.' },
  { status: 'Coming', c: 'var(--pa-amber)', t: 'Socrates', d: 'The trained assistant as an ask bar or chat panel on your site, answering from PropAlpha data and handing visitors to you.' },
  { status: 'Live', c: 'var(--pa-emerald)', t: 'Flyer packs', d: 'The figures, headline and trend behind a Flyer Maker market letter, ready to drop into your own layouts.' },
];

const STEPS = [
  { n: '1', t: 'Talk to Luminaire Proptech', d: 'What your site is, who visits it, what they should be able to see.' },
  { n: '2', t: 'Get a partner key', d: 'Issued for your domain. One account for the app, the web and your site.' },
  { n: '3', t: 'Embed', d: 'Data cards or the Socrates ask bar, styled to your site.' },
  { n: '4', t: 'Go live', d: 'Visitors see live URA-based data and are handed back to you.' },
];

const SHOWCASE = [
  {
    key: 'berllynnetta',
    domain: 'berllynnetta.com',
    href: 'https://www.berllynnetta.com/pavilion-park',
    img: '/site/showcase/berllynnetta-pavilion-park.png',
    alt: 'berllynnetta.com, Pavilion Park page',
    d: 'An SRI agent’s personal site. Live market data by PropAlpha: district stats, estate stats and latest transactions for Pavilion Park.',
  },
  {
    key: 'propfolio',
    domain: 'propfolio.com.sg',
    href: 'https://www.propfolio.com.sg',
    img: '/site/showcase/propfolio-home.png',
    alt: 'propfolio.com.sg home page',
    d: 'A new-launch property intelligence site. AI project comparison enriched with PropAlpha market intelligence.',
  },
];

const mono: CSSProperties = {
  borderRadius: 18, border: '1px solid var(--pa-border)', background: '#120D2A', color: '#E9D5FF', padding: '20px 22px',
  fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace', fontSize: 13.5, lineHeight: 1.7, boxShadow: 'var(--pa-shadow)',
  overflowWrap: 'anywhere', minWidth: 0,
};
const monoHead: CSSProperties = {
  display: 'flex', justifyContent: 'space-between', color: '#8E7CC8', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase',
  fontFamily: 'var(--font-body)', fontWeight: 700, marginBottom: 10,
};
const sectionStyle: CSSProperties = { maxWidth: 'var(--pa-max)', margin: '0 auto', padding: 'var(--pa-sec) var(--pa-pad) 0' };
const dot: CSSProperties = { width: 10, height: 10, borderRadius: '50%', background: '#D9D4C7' };
const stat: CSSProperties = { padding: 14, borderRadius: 10, background: '#fff', border: '1px solid #E2DED3', display: 'flex', flexDirection: 'column', gap: 4 };
const statLabel: CSSProperties = { fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8A857A' };
const figureStyle: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 14, padding: 18, borderRadius: 22, border: '1px solid var(--pa-border)',
  background: 'color-mix(in srgb, var(--pa-card) 85%, transparent)', margin: 0,
};

export default function PlatformPage() {
  const showcase = SHOWCASE.map((s) => ({ ...s, exists: publicFileExists(s.img) }));

  return (
    <div className="pa-page">
      <Nav current="platform" />

      {/* Hero */}
      <section className="pa-2col" style={{ maxWidth: 'var(--pa-max)', margin: '0 auto', padding: 'clamp(56px,8vw,112px) var(--pa-pad) 0', display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 'clamp(32px,5vw,72px)', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Kicker>Platform · for agencies and partners</Kicker>
          <h1 style={{ fontSize: 'clamp(38px,5vw,68px)' }}>Built once. Delivered everywhere.</h1>
          <p style={{ fontSize: 'clamp(17px,1.3vw,19px)', color: 'var(--pa-text-2)', maxWidth: 560 }}>PropAlpha is Singapore property analytics rebuilt as an API, with a trained Socrates AI on top. The app is one client. Your website can be another.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <a className="pa-btn" href="#contact" style={{ display: 'inline-flex', alignItems: 'center', height: 50, padding: '0 22px', borderRadius: 12, background: 'var(--pa-primary)', color: '#fff', fontWeight: 700, fontSize: 16 }}>Talk to us about integrating</a>
            <a className="pa-btn pa-link" href="#api" style={{ display: 'inline-flex', alignItems: 'center', height: 50, padding: '0 22px', borderRadius: 12, border: '1px solid var(--pa-border)', color: 'var(--pa-text)', fontWeight: 600, fontSize: 16 }}>What the API covers</a>
          </div>
        </div>
        {/* stylised request / response card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          <div style={mono}>
            <div style={monoHead}><span>Request</span><span>partner key · issued by Luminaire Proptech</span></div>
            <div><span style={{ color: '#F59E0B' }}>GET</span> /partner/projects/<span style={{ color: '#10B981' }}>pavilion-park</span>/statistics</div>
          </div>
          <div style={mono}>
            <div style={monoHead}><span>Response</span><span>shape only, no figures</span></div>
            <div>{'{ project, district,'}</div>
            <div style={{ paddingLeft: 16 }}>{'statistics: { median_psf, volume, period },'}</div>
            <div style={{ paddingLeft: 16 }}>{'latest_transactions: [ … ],'}</div>
            <div style={{ paddingLeft: 16 }}><span style={{ color: '#F59E0B' }}>sample_size_flag</span>, <span style={{ color: '#F59E0B' }}>launch_share_flag</span>{' }'}</div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--pa-text-3)' }}>Sample-size and launch-share flags travel with every response, so partners can present percentages responsibly.</p>
        </div>
      </section>

      {/* What the API covers */}
      <section id="api" style={sectionStyle}>
        <div style={{ maxWidth: 680, marginBottom: 40 }}>
          <Kicker>What the API covers</Kicker>
          <H2>Four surfaces, one backend.</H2>
        </div>
        <div className="pa-4col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 2, background: 'var(--pa-border)', border: '1px solid var(--pa-border)', borderRadius: 16, overflow: 'hidden' }}>
          {SURFACES.map((s) => (
            <div key={s.t} style={{ padding: 26, background: 'var(--pa-bg)', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 220 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: s.c }}>{s.status}</span>
              <strong style={{ fontSize: 19 }}>{s.t}</strong>
              <p style={{ fontSize: 14.5, color: 'var(--pa-text-2)', lineHeight: 1.55 }}>{s.d}</p>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 18, fontSize: 14, color: 'var(--pa-text-3)', maxWidth: 760 }}>Today the partner data API serves district statistics and latest transactions, and project-level search, statistics and latest transactions for any condo project or landed estate. DomainStage, Luminaire&apos;s website builder for agents, already offers live PropAlpha data add-ons for the sites it hosts; that is the model for third-party integration.</p>
      </section>

      {/* Socrates on your site */}
      <section id="socrates" className="pa-2col" style={{ ...sectionStyle, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(32px,5vw,72px)', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div>
            <Kicker>Socrates on your site · coming</Kicker>
            <H2>An ask bar in your colours. Answers from PropAlpha.</H2>
          </div>
          <p style={{ fontSize: 17, color: 'var(--pa-text-2)' }}>A visitor asks about a project. Socrates answers with transactions and valuations from PropAlpha data. Then the visitor is handed back to you through your join code: your WhatsApp, your call button.</p>
          <p style={{ fontSize: 13, color: 'var(--pa-text-3)' }}>Socrates on partner sites is the next step and is not live yet.</p>
        </div>
        {/* mock browser window: partner site in its own colours */}
        <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid var(--pa-border)', boxShadow: 'var(--pa-shadow)', background: '#fff', color: '#1E1B4B', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#F1EFE9', borderBottom: '1px solid #E2DED3' }}>
            <span style={dot} /><span style={dot} /><span style={dot} />
            <span style={{ marginLeft: 12, flex: 1, height: 22, borderRadius: 6, background: '#fff', border: '1px solid #E2DED3', fontSize: 11, color: '#8A857A', display: 'flex', alignItems: 'center', padding: '0 10px', overflow: 'hidden', whiteSpace: 'nowrap' }}>youragency.sg/pavilion-park</span>
          </div>
          <div style={{ padding: 28, background: '#FBFAF6', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <strong style={{ fontFamily: 'Georgia,serif', fontSize: 20, letterSpacing: '-.01em', color: '#2A2A2A' }}>Pavilion Park</strong>
              <span style={{ fontSize: 11, color: '#8A857A' }}>Partner site · their type, their colours</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: '1px solid #D9D4C7', background: '#fff' }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg,#3D1A82,#7028B8)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 12, fontWeight: 800, flex: 'none' }}>α</span>
              <span style={{ flex: 1, fontSize: 14, color: '#2A2A2A' }}>What&apos;s the recent psf at Pavilion Park?</span>
              <span style={{ padding: '6px 12px', borderRadius: 8, background: '#2A2A2A', color: '#fff', fontSize: 12, fontWeight: 700 }}>Ask</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div style={stat}><span style={statLabel}>Median psf</span><span style={{ height: 14, width: '70%', borderRadius: 4, background: '#E7E3D8' }} /></div>
              <div style={stat}><span style={statLabel}>Volume</span><span style={{ height: 14, width: '50%', borderRadius: 4, background: '#E7E3D8' }} /></div>
              <div style={stat}><span style={statLabel}>Latest</span><span style={{ height: 14, width: '80%', borderRadius: 4, background: '#E7E3D8' }} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingTop: 14, borderTop: '1px solid #E2DED3' }}>
              <span style={{ fontSize: 12, color: '#8A857A' }}>Answers by PropAlpha · hands you to your agent</span>
              <span style={{ display: 'flex', gap: 8 }}>
                <span style={{ padding: '7px 12px', borderRadius: 8, background: '#25D366', color: '#fff', fontSize: 12, fontWeight: 700 }}>WhatsApp</span>
                <span style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #2A2A2A', color: '#2A2A2A', fontSize: 12, fontWeight: 700 }}>Call</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section id="showcase" style={sectionStyle}>
        <div style={{ maxWidth: 680, marginBottom: 40 }}>
          <Kicker>Showcase</Kicker>
          <H2>Two sites, two stages.</H2>
        </div>
        <div className="pa-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {showcase.map((s) => (
            <figure key={s.key} className="pa-card-h" style={figureStyle}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${s.domain}`} style={{ display: 'block', position: 'relative', aspectRatio: '16 / 10', borderRadius: 12, overflow: 'hidden', background: 'var(--pa-well)', border: '1px solid var(--pa-well-border)' }}>
                {s.exists ? (
                  <Image src={s.img} alt={s.alt} fill sizes="(max-width: 860px) 90vw, 560px" quality={82} style={{ objectFit: 'cover', objectPosition: '50% 0%' }} />
                ) : (
                  <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 13, color: 'var(--pa-text-3)', padding: 16, textAlign: 'center' }}>Screenshot — {s.domain}</span>
                )}
              </a>
              <figcaption style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="pa-link" style={{ display: 'block', fontSize: 18, fontWeight: 700, color: 'var(--pa-text)' }}>{s.domain}</a>
                  <span style={{ fontSize: 14, color: 'var(--pa-text-2)' }}>{s.d}</span>
                </div>
                <span style={{ flex: 'none' }}><Tag kind="live">Live</Tag></span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* How an integration happens */}
      <section id="how" style={sectionStyle}>
        <div style={{ maxWidth: 680, marginBottom: 40 }}>
          <Kicker>How an integration happens</Kicker>
          <H2>Four steps. No pricing page, just a conversation.</H2>
        </div>
        <div className="pa-4col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 20 }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 20, borderTop: '2px solid var(--pa-border)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--pa-amber)' }}>{s.n}</span>
              <strong style={{ fontSize: 17 }}>{s.t}</strong>
              <span style={{ fontSize: 14.5, color: 'var(--pa-text-2)', lineHeight: 1.5 }}>{s.d}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" style={{ maxWidth: 'var(--pa-max)', margin: 'var(--pa-sec) auto', padding: '0 var(--pa-pad)' }}>
        <div className="pa-2col" style={{ padding: 'clamp(28px,4vw,56px)', borderRadius: 28, background: 'linear-gradient(135deg,var(--pa-deep-1),var(--pa-deep-2) 60%,var(--pa-primary))', color: '#fff', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center', boxShadow: '0 40px 80px -30px rgba(112,40,184,.8)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ fontSize: 'clamp(30px,4vw,52px)' }}>Talk to us about integrating PropAlpha.</h2>
            <p style={{ fontSize: 16, color: '#E9D5FF', overflowWrap: 'anywhere' }}>Tell us about your site and what you want your visitors to be able to ask. We reply from contact@luminaireproptech.com.sg.</p>
          </div>
          <ContactForm />
        </div>
      </section>

      <Footer />
    </div>
  );
}
