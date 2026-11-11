import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import Nav from '@/components/site/Nav';
import Footer from '@/components/site/Footer';
import Shot, { type ShotId } from '@/components/site/Shot';
import { ArrowRight } from '@/components/site/ui';
import Hero from '@/components/site/home/Hero';
import { AppStoreBadge, GooglePlayBadge } from '@/components/site/home/StoreBadges';
import {
  AGENCY_POINTS, ANSWER_POINTS, BERLLYNNETTA_URL, CLIENTS_LEFT, CLIENTS_RIGHT, CONTACT_MAILTO, FLYER_POINTS, MAP_TAGS, MARKET, MARQUEE,
  PLATFORM_COLUMNS, PROMPTS, PROPFOLIO_LINE, PROPFOLIO_URL, STEPS, TOOLS, TRUST,
} from '@/components/site/home/data';

export const metadata: Metadata = {
  title: 'PropAlpha — No more searching. Just say what you mean.',
};

// Some images are produced by other agents and may not be on disk yet; render a labelled well instead of a broken image.
const inPublic = (p: string) => existsSync(join(process.cwd(), 'public', p));

// Shared inline styles from the design (kept as values, not classes, so they match the sheet exactly).
const kicker: CSSProperties = { fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--pa-amber)' };
const h2: CSSProperties = { fontSize: 'clamp(32px,4vw,52px)', marginTop: 12 };
const lead: CSSProperties = { fontSize: 17, color: 'var(--pa-text-2)', maxWidth: 520 };
const caption: CSSProperties = { fontSize: 13, color: 'var(--pa-text-3)' };
const section: CSSProperties = { maxWidth: 'var(--pa-max)', margin: '0 auto', padding: 'var(--pa-sec) var(--pa-pad) 0' };
const dash: CSSProperties = { color: 'var(--pa-emerald)', fontWeight: 800 };
const ruledTile: CSSProperties = { padding: 24, background: 'var(--pa-bg)', display: 'flex', flexDirection: 'column', gap: 8 };
const liveTag: CSSProperties = { padding: '4px 9px', borderRadius: 6, background: 'color-mix(in srgb, var(--pa-emerald) 18%, transparent)', color: 'var(--pa-emerald)', fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', flex: 'none' };
const showcaseCard: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12, padding: 16, borderRadius: 18, border: '1px solid var(--pa-border)', background: 'color-mix(in srgb, var(--pa-card) 85%, transparent)', color: 'inherit' };
const showcaseWell: CSSProperties = { position: 'relative', aspectRatio: '16 / 10', borderRadius: 10, overflow: 'hidden', background: 'var(--pa-well)', border: '1px solid var(--pa-well-border)' };
const wellLabel: CSSProperties = { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 16, textAlign: 'center', fontSize: 13, color: 'var(--pa-text-3)' };

/** The "Ask in plain English" answer crops: a 4:3 well without the big radius/shadow (design: radius 14, no shadow). */
function AskCrop({ id, position }: { id: ShotId; position: string }) {
  return <Shot id={id} position={position} sizes="(max-width: 860px) 78vw, 25vw" style={{ aspectRatio: '4 / 3', borderRadius: 14, boxShadow: 'none' }} />;
}

function ShowcaseCard({ href, src, name, line, tag }: { href: string; src: string; name: string; line: string; tag: string }) {
  const has = inPublic(src);
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="pa-card-h" style={showcaseCard}>
      <div style={showcaseWell}>
        {has ? (
          <Image src={`/${src}`} alt={`${name} screenshot`} fill sizes="(max-width: 860px) 90vw, 30vw" quality={82} style={{ objectFit: 'cover', objectPosition: '50% 0%' }} />
        ) : (
          <span style={wellLabel}>Screenshot — {name}</span>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div>
          <strong style={{ display: 'block' }}>{name}</strong>
          <span style={{ fontSize: 13, color: 'var(--pa-text-2)' }}>{line}</span>
        </div>
        <span style={liveTag}>{tag}</span>
      </div>
    </a>
  );
}

export default function Home() {
  // Socrates chart / industrial-rents iPad captures, with the design's iPhone crops as the fallback.
  const chartShot: { id: ShotId; position: string } = inPublic('site/shots/ipad-x01-socrates-chart.png')
    ? { id: 'ipad-x01-socrates-chart', position: '50% 25%' }
    : { id: 'iphone69-07', position: '50% 46%' };
  const rentShot: { id: ShotId; position: string } = inPublic('site/shots/ipad-x02-socrates-industrial.png')
    ? { id: 'ipad-x02-socrates-industrial', position: '50% 25%' }
    : { id: 'iphone69-06', position: '50% 67%' };
  const askShots: { id: ShotId; position: string }[] = [
    { id: 'iphone69-02', position: '50% 52%' }, // tower grid
    { id: 'iphone69-03', position: '50% 76%' }, // table + Copy / Save row
    chartShot,
    rentShot,
  ];
  const hasQr = inPublic('site/qr/download.png');

  return (
    <div className="pa-page" style={{ overflowX: 'clip' }}>
      <Nav current="home" />

      {/* HERO (client: typing animation) */}
      <Hero />

      {/* MARQUEE */}
      <div style={{ marginTop: 56, borderTop: '1px solid var(--pa-border)', borderBottom: '1px solid var(--pa-border)', overflow: 'hidden', background: 'color-mix(in srgb, var(--pa-card) 50%, transparent)' }}>
        <div className="pa-marquee-track" style={{ display: 'flex', width: 'max-content', gap: 0 }}>
          {MARQUEE.map((m, i) => (
            <span key={i} aria-hidden={i >= MARQUEE.length / 2 ? true : undefined} style={{ display: 'inline-flex', alignItems: 'center', gap: 22, padding: '14px 22px 14px 0', fontSize: 13.5, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--pa-text-2)', whiteSpace: 'nowrap' }}>
              {m}<span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--pa-amber)' }} />
            </span>
          ))}
        </div>
      </div>

      {/* ASK IN PLAIN ENGLISH */}
      <section id="ask" style={section}>
        <div className="pa-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'end', marginBottom: 48 }}>
          <div><span style={kicker}>AI Socrates</span><h2 style={h2}>Ask in plain English.</h2></div>
          <p style={lead}>Real, tested prompts. Each returns a different kind of answer, built from the same transaction database.</p>
        </div>
        <div className="pa-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 20 }}>
          {PROMPTS.map((p, i) => (
            <div key={p.kind} className="pa-card-h" style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: 20, borderRadius: 20, border: '1px solid var(--pa-border)', background: 'color-mix(in srgb, var(--pa-card) 85%, transparent)' }}>
              <div style={{ alignSelf: 'flex-end', maxWidth: '100%', padding: '12px 14px', borderRadius: '16px 16px 4px 16px', background: 'var(--pa-primary)', color: '#fff', fontSize: 14.5, lineHeight: 1.4 }}>“{p.q}”</div>
              <AskCrop id={askShots[i].id} position={askShots[i].position} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--pa-text-2)' }}>{p.kind}</span>
                <span style={{ fontSize: 12, color: 'var(--pa-text-3)' }}>{p.src}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ANSWERS YOU CAN USE */}
      <section id="features" className="pa-2col" style={{ ...section, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(32px,5vw,80px)', alignItems: 'center' }}>
        <div style={{ position: 'relative', minHeight: 520 }}>
          <Shot id="iphone69-03" sizes="(max-width: 860px) 52vw, 26vw" style={{ position: 'absolute', left: 0, top: 0, width: '58%', aspectRatio: '1320 / 2868', maxHeight: '100%' }} />
          <Shot id="iphone69-02" sizes="(max-width: 860px) 47vw, 24vw" style={{ position: 'absolute', right: 0, bottom: 0, width: '52%', aspectRatio: '1320 / 2868', maxHeight: '90%', transform: 'rotate(3deg)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div><span style={kicker}>Answers you can use</span><h2 style={h2}>Not a chat log. Working material.</h2></div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
            {ANSWER_POINTS.map((a) => (
              <li key={a.n} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 14, padding: '18px 0', borderTop: '1px solid var(--pa-border)' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--pa-amber)', fontSize: 14, paddingTop: 3 }}>{a.n}</span>
                <div>
                  <strong style={{ display: 'block', fontSize: 17, marginBottom: 4 }}>{a.t}</strong>
                  <span style={{ color: 'var(--pa-text-2)', fontSize: 15 }}>{a.d}</span>
                </div>
              </li>
            ))}
          </ul>
          <p style={caption}>Socrates table with Copy and Save Image · tower view, tap any unit for its history</p>
        </div>
      </section>

      {/* FLYER MAKER */}
      <section id="flyer" style={{ marginTop: 'var(--pa-sec)', borderTop: '1px solid var(--pa-border)', borderBottom: '1px solid var(--pa-border)', background: 'linear-gradient(180deg, color-mix(in srgb, var(--pa-deep-1) 55%, transparent), transparent)', overflow: 'hidden' }}>
        <div className="pa-2col" style={{ maxWidth: 'var(--pa-max)', margin: '0 auto', padding: 'clamp(56px,7vw,100px) var(--pa-pad)', display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 'clamp(32px,5vw,72px)', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            <span style={{ display: 'inline-flex', alignSelf: 'flex-start', padding: '5px 10px', borderRadius: 6, background: 'var(--pa-amber)', color: '#1E1B4B', fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}>New</span>
            <div><span style={kicker}>Flyer Maker</span><h2 style={h2}>Your estate&apos;s market letter, in minutes.</h2></div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 16, color: 'var(--pa-text-2)' }}>
              {FLYER_POINTS.map((t) => (
                <li key={t} style={{ display: 'flex', gap: 12 }}><span style={dash}>—</span>{t}</li>
              ))}
            </ul>
            <Link className="pa-link" href="/flyer-maker" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--pa-text-2)', fontSize: 16 }}>See Flyer Maker<ArrowRight /></Link>
          </div>
          <div style={{ position: 'relative', minHeight: 'clamp(380px,42vw,620px)' }}>
            <Shot id="ipad13-04" sizes="(max-width: 860px) 80vw, 45vw" style={{ position: 'absolute', left: 0, top: 0, width: '88%', aspectRatio: '3 / 4', maxHeight: '100%' }} />
            <Shot id="iphone69-05" sizes="(max-width: 860px) 31vw, 18vw" style={{ position: 'absolute', right: '-4%', bottom: '-4%', width: '34%', aspectRatio: '1320 / 2868', maxHeight: '80%', zIndex: 2 }} />
          </div>
        </div>
        <p style={{ ...caption, maxWidth: 'var(--pa-max)', margin: '-28px auto 0', padding: '0 var(--pa-pad) 28px', textAlign: 'right' }}>Prestige market letter, Pavilion Park · template picker</p>
      </section>

      {/* TECH TOOLS */}
      <section id="tools" style={section}>
        <div className="pa-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'end', marginBottom: 48 }}>
          <div><span style={kicker}>Tech Tools</span><h2 style={h2}>Everything an agent needs, in one app.</h2></div>
          <p style={lead}>Agent tools are activated by Luminaire Proptech. Calculations are for illustration and are not financial or valuation advice.</p>
        </div>
        <div className="pa-2col" style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 24 }}>
          <div className="pa-4col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {TOOLS.map((t) => (
              <div key={t.n} className="pa-card-h" style={{ padding: 22, borderRadius: 18, border: '1px solid var(--pa-border)', background: 'color-mix(in srgb, var(--pa-card) 85%, transparent)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: 'var(--pa-amber)' }}>{t.n}</span>
                <strong style={{ fontSize: 18, letterSpacing: '-0.01em' }}>{t.t}</strong>
                <span style={{ fontSize: 14, color: 'var(--pa-text-2)', lineHeight: 1.5 }}>{t.d}</span>
              </div>
            ))}
          </div>
          <div className="pa-strip" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignContent: 'start' }}>
            <figure style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: 0 }}>
              <Shot id="iphone69-08" position="50% 88%" sizes="(max-width: 860px) 78vw, 20vw" style={{ aspectRatio: '1320 / 2400' }} />
              <figcaption style={caption}>Income Valuation: direct cap, DCF, IRR, sensitivity</figcaption>
            </figure>
            <figure style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: 0, marginTop: 48 }}>
              <Shot id="iphone69-09" position="50% 100%" sizes="(max-width: 860px) 78vw, 20vw" style={{ aspectRatio: '1320 / 2400' }} />
              <figcaption style={caption}>Executive Condo loan cap with the TDSR/MSR warning</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* MARKET UPDATES */}
      <section id="market" style={section}>
        <div className="pa-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(32px,5vw,80px)', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <span style={kicker}>Market Updates</span>
              <h2 style={h2}>Always know what the market is doing.</h2>
              <p style={{ marginTop: 14, fontSize: 17, color: 'var(--pa-text-2)' }}>Refreshed with every URA release. Free for every registered user.</p>
            </div>
            <div className="pa-4col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, background: 'var(--pa-border)', border: '1px solid var(--pa-border)', borderRadius: 16, overflow: 'hidden' }}>
              {MARKET.map((m) => (
                <div key={m.t} className="pa-row" style={{ padding: '18px 20px', background: 'var(--pa-bg)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <strong style={{ fontSize: 15.5 }}>{m.t}</strong>
                  <span style={{ fontSize: 13.5, color: 'var(--pa-text-2)' }}>{m.d}</span>
                </div>
              ))}
              <div style={{ padding: '18px 20px', background: 'var(--pa-bg)', display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--pa-text-3)' }}>URA, HDB and J-SPACE sources</div>
            </div>
          </div>
          <div className="pa-strip" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
            <figure style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: 0, marginTop: 56 }}>
              <Shot id="iphone69-06" position="50% 0%" sizes="(max-width: 860px) 78vw, 24vw" style={{ aspectRatio: '1320 / 2500' }} />
              <figcaption style={caption}>Market Updates hub, including Industrial Rents</figcaption>
            </figure>
            <figure style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: 0 }}>
              <Shot id="iphone69-07" position="50% 0%" sizes="(max-width: 860px) 78vw, 24vw" style={{ aspectRatio: '1320 / 2500' }} />
              <figcaption style={caption}>Resale Market, District 15, two years, monthly view</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* MAPS */}
      <section id="maps" className="pa-2col" style={{ ...section, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(32px,5vw,80px)', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div><span style={kicker}>Maps</span><h2 style={h2}>Every transaction, pinned with its psf.</h2></div>
          <p style={{ fontSize: 17, color: 'var(--pa-text-2)' }}>Pins by district with psf labels. Deal Radar, District Portrait, Nearby and Same Street. Private, HDB and landed.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {MAP_TAGS.map((t) => (
              <span key={t} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--pa-border)', fontSize: 13, fontWeight: 600, color: 'var(--pa-text-2)' }}>{t}</span>
            ))}
          </div>
        </div>
        <figure style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', margin: 0 }}>
          <Shot id="iphone69-10" sizes="340px" style={{ width: 'min(340px,80%)', aspectRatio: '1320 / 2868', transform: 'rotate(-3deg)' }} />
          <figcaption style={caption}>District 8 pins with psf labels</figcaption>
        </figure>
      </section>

      {/* PLATFORM */}
      <section id="platform" style={{ marginTop: 'var(--pa-sec)', borderTop: '1px solid var(--pa-border)', background: 'linear-gradient(180deg, transparent, color-mix(in srgb, var(--pa-deep-1) 45%, transparent) 50%, transparent)' }}>
        <div style={{ maxWidth: 'var(--pa-max)', margin: '0 auto', padding: 'clamp(56px,7vw,100px) var(--pa-pad)' }}>
          <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={kicker}>Built as a platform</span>
            <h2 style={{ fontSize: 'clamp(34px,4.6vw,60px)' }}>Singapore property analytics, rebuilt from the ground up as an API.</h2>
            <p style={{ fontSize: 18, color: 'var(--pa-text-2)' }}>The app is one client of the platform. The same data, calculators and Socrates can sit on your own website, answer your visitors and hand them back to you.</p>
          </div>

          {/* diagram */}
          <div className="pa-3col" style={{ margin: '56px 0', padding: 'clamp(24px,4vw,48px)', border: '1px solid var(--pa-border)', borderRadius: 24, background: 'color-mix(in srgb, var(--pa-card) 70%, transparent)', display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 'clamp(16px,3vw,40px)', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {CLIENTS_LEFT.map((c) => (
                <div key={c.t} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 18px', borderRadius: 14, border: '1px solid var(--pa-border)', background: 'var(--pa-bg)' }}>
                  <div><strong style={{ display: 'block', fontSize: 15 }}>{c.t}</strong><span style={{ fontSize: 12.5, color: 'var(--pa-text-2)' }}>{c.d}</span></div>
                  <span style={{ width: 28, height: 1, background: 'var(--pa-text-3)', flex: 'none' }} />
                </div>
              ))}
            </div>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '28px 36px', borderRadius: 20, background: 'linear-gradient(160deg,var(--pa-deep-2),var(--pa-primary))', color: '#fff', boxShadow: '0 30px 60px -20px rgba(112,40,184,.9)', textAlign: 'center', minWidth: 'min(220px, 100%)' }}>
              <span style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,.14)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 18 }}>α</span>
              <strong style={{ fontSize: 18, letterSpacing: '-0.01em' }}>PropAlpha platform</strong>
              <span style={{ fontSize: 12.5, color: '#E9D5FF', lineHeight: 1.4 }}>Transactions · psf trends · tower grids<br />yields · valuations · calculators<br />flyer data packs · Socrates AI</span>
              <span style={{ marginTop: 6, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--pa-amber)', fontWeight: 700 }}>One backend, one account</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {CLIENTS_RIGHT.map((c) => (
                <div key={c.t} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderRadius: 14, border: '1px solid var(--pa-border)', background: 'var(--pa-bg)' }}>
                  <span style={{ width: 28, height: 1, background: 'var(--pa-text-3)', flex: 'none' }} />
                  <div><strong style={{ display: 'block', fontSize: 15 }}>{c.t}</strong><span style={{ fontSize: 12.5, color: 'var(--pa-text-2)' }}>{c.d}</span></div>
                </div>
              ))}
            </div>
          </div>

          <div className="pa-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 2, background: 'var(--pa-border)', border: '1px solid var(--pa-border)', borderRadius: 16, overflow: 'hidden' }}>
            {PLATFORM_COLUMNS.map((c) => (
              <div key={c.t} style={{ padding: 28, background: 'var(--pa-bg)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <strong style={{ fontSize: 19 }}>{c.t}</strong>
                <p style={{ fontSize: 15, color: 'var(--pa-text-2)' }}>{c.d}</p>
                <span style={{ fontSize: 12, fontWeight: 700, color: c.tag === 'live' ? 'var(--pa-emerald)' : 'var(--pa-amber)', letterSpacing: '.08em', textTransform: 'uppercase' }}>{c.tag === 'live' ? 'Live' : 'Coming'}</span>
              </div>
            ))}
          </div>

          <div className="pa-3col" style={{ marginTop: 40, display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 20, alignItems: 'stretch' }}>
            <ShowcaseCard href={BERLLYNNETTA_URL} src="site/showcase/berllynnetta-pavilion-park.png" name="berllynnetta.com" line="An SRI agent's site. Live market data by PropAlpha." tag="Live" />
            <ShowcaseCard href={PROPFOLIO_URL} src="site/showcase/propfolio-home.png" name="propfolio.com.sg" line={PROPFOLIO_LINE} tag="Live" />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 12, minWidth: 'min(240px, 100%)' }}>
              <p style={{ fontSize: 14, color: 'var(--pa-text-2)' }}>Integrate the data, the calculators or Socrates into your site.</p>
              <Link className="pa-btn" href="/platform" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, height: 50, padding: '0 20px', borderRadius: 12, background: 'var(--pa-primary)', color: '#fff', fontWeight: 700 }}>Talk to us about integrating<ArrowRight /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* AGENCIES */}
      <section id="agencies" style={section}>
        <div className="pa-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, padding: 'clamp(28px,4vw,48px)', borderRadius: 24, border: '1px solid var(--pa-border)', background: 'color-mix(in srgb, var(--pa-card) 85%, transparent)', alignItems: 'center' }}>
          <div><span style={kicker}>For agencies</span><h2 style={{ fontSize: 'clamp(28px,3.4vw,44px)', marginTop: 12 }}>One standard across the whole team.</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 15.5, color: 'var(--pa-text-2)' }}>
              {AGENCY_POINTS.map((t) => (
                <li key={t} style={{ display: 'flex', gap: 12 }}><span style={dash}>—</span>{t}</li>
              ))}
            </ul>
            <a className="pa-btn pa-link" href={CONTACT_MAILTO} style={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', height: 46, padding: '0 20px', borderRadius: 12, border: '1px solid var(--pa-border)', color: 'var(--pa-text)', fontWeight: 700, background: 'var(--pa-bg)' }}>Contact us</a>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section id="trust" style={section}>
        <div style={{ maxWidth: 640, marginBottom: 40 }}><span style={kicker}>Built to be trusted</span><h2 style={h2}>Plain about where answers come from.</h2></div>
        <div className="pa-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 2, background: 'var(--pa-border)', border: '1px solid var(--pa-border)', borderRadius: 16, overflow: 'hidden' }}>
          {TRUST.map((t) => (
            <div key={t.t} style={ruledTile}>
              <strong style={{ fontSize: 16.5 }}>{t.t}</strong>
              <span style={{ fontSize: 14.5, color: 'var(--pa-text-2)', lineHeight: 1.5 }}>{t.d}</span>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={section}>
        <div style={{ maxWidth: 640, marginBottom: 40 }}><span style={kicker}>How it works</span><h2 style={h2}>Up and running in minutes.</h2></div>
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

      {/* DOWNLOAD */}
      <section id="download" style={{ maxWidth: 'var(--pa-max)', margin: 'var(--pa-sec) auto', padding: '0 var(--pa-pad)' }}>
        <div className="pa-2col" style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(36px,5vw,64px)', borderRadius: 28, background: 'linear-gradient(135deg,var(--pa-deep-1),var(--pa-deep-2) 60%,var(--pa-primary))', color: '#fff', display: 'grid', gridTemplateColumns: '1.2fr auto', gap: 32, alignItems: 'center', boxShadow: '0 40px 80px -30px rgba(112,40,184,.8)' }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(70% 100% at 100% 50%, #000, transparent)', WebkitMaskImage: 'radial-gradient(70% 100% at 100% 50%, #000, transparent)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ fontSize: 'clamp(32px,4.4vw,56px)' }}>Start with PropAlpha today.</h2>
            <p style={{ fontSize: 17, color: '#E9D5FF', maxWidth: 520 }}>Market data is free for all users. Agent tools require activation by Luminaire Proptech.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <AppStoreBadge />
              <GooglePlayBadge />
            </div>
          </div>
          <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, padding: 16, borderRadius: 18, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.18)', maxWidth: '100%' }}>
            <div style={{ width: 120, height: 120, borderRadius: 12, background: '#fff', overflow: 'hidden', flex: 'none', display: 'grid', placeItems: 'center' }}>
              {hasQr ? (
                <Image src="/site/qr/download.png" alt="QR code to download PropAlpha" width={120} height={120} style={{ objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: 12, color: '#1E1B4B', textAlign: 'center' }}>QR code</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 180 }}>
              <strong style={{ fontSize: 15 }}>Scan to download</strong>
              <span style={{ fontSize: 13, color: '#E9D5FF' }}>iOS and Android. iPhone and iPad.</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
