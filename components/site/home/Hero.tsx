'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Shot from '@/components/site/Shot';
import { ArrowRight } from '@/components/site/ui';
import { HERO_PROMPT } from './data';

// Home hero: the chat bubble types the prompt (38 ms per character), pauses 350 ms, then the
// "Socrates · tower view" label appears and the two screenshot wells fade in and rise 40px → 0
// over .7s with a .15s stagger. Reduced motion shows the final state immediately.
export default function Hero() {
  const [typed, setTyped] = useState('');
  const [answered, setAnswered] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finish = () => { setAnswered(true); setDone(true); };
    let pause: ReturnType<typeof setTimeout> | undefined;
    if (reduce) {
      pause = setTimeout(() => { setTyped(HERO_PROMPT); finish(); }, 0);
      return () => clearTimeout(pause);
    }
    let i = 0;
    const t = setInterval(() => {
      i++;
      setTyped(HERO_PROMPT.slice(0, i));
      if (i >= HERO_PROMPT.length) {
        clearInterval(t);
        pause = setTimeout(finish, 350);
      }
    }, 38);
    return () => { clearInterval(t); if (pause) clearTimeout(pause); };
  }, []);

  const shotOpacity = answered ? 1 : 0;
  const shotTransform = answered ? 'none' : 'translateY(40px)';

  return (
    <>
      <section className="pa-2col" style={{ maxWidth: 'var(--pa-max)', margin: '0 auto', padding: 'clamp(56px,8vw,112px) var(--pa-pad) clamp(40px,6vw,80px)', display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 'clamp(32px,5vw,72px)', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', padding: '6px 12px', borderRadius: 999, border: '1px solid var(--pa-border)', background: 'color-mix(in srgb, var(--pa-card) 80%, transparent)', fontSize: 12.5, fontWeight: 600, color: 'var(--pa-text-2)', letterSpacing: '.02em' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pa-emerald)' }} />
            Built for Singapore real estate professionals
          </span>
          <h1 style={{ fontSize: 'clamp(40px,5.6vw,76px)', lineHeight: 0.98 }}>
            No more searching.<br />
            <span style={{ color: 'var(--pa-text-2)' }}>Just say what you mean</span> and get what you want.
          </h1>
          <p style={{ fontSize: 'clamp(17px,1.4vw,20px)', lineHeight: 1.5, color: 'var(--pa-text-2)', maxWidth: 560 }}>
            Ask AI Socrates about Singapore property in plain English and get tables, charts and tower views, built from PropAlpha&apos;s own transaction database.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Link className="pa-btn" href="/download" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, height: 50, padding: '0 22px', borderRadius: 12, background: 'var(--pa-primary)', color: '#fff', fontWeight: 700, fontSize: 16, boxShadow: '0 10px 30px -10px rgba(112,40,184,.8)' }}>
              Download Free<ArrowRight />
            </Link>
            <a className="pa-btn pa-link" href="#ask" style={{ display: 'inline-flex', alignItems: 'center', height: 50, padding: '0 22px', borderRadius: 12, border: '1px solid var(--pa-border)', background: 'color-mix(in srgb, var(--pa-card) 70%, transparent)', color: 'var(--pa-text)', fontWeight: 600, fontSize: 16 }}>
              See how it works
            </a>
          </div>
          <p style={{ fontSize: 13, color: 'var(--pa-text-3)' }}>iPhone, iPad and Android. Market data is free for all users.</p>
        </div>

        <div style={{ position: 'relative', minHeight: 'clamp(420px,46vw,640px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: '10% -10% -10%', background: 'radial-gradient(60% 60% at 50% 50%, var(--pa-glow-a), transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, left: '6%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, zIndex: 3 }}>
            <div style={{ maxWidth: 'min(380px,92%)', padding: '14px 18px', borderRadius: '18px 18px 4px 18px', background: 'var(--pa-primary)', color: '#fff', fontSize: 15.5, lineHeight: 1.4, boxShadow: '0 14px 40px -12px rgba(112,40,184,.9)' }}>
              {typed}
              <span aria-hidden="true" style={{ display: 'inline-block', width: 2, height: '1em', verticalAlign: '-0.15em', marginLeft: 2, background: '#fff', animation: 'pa-caret 1s steps(1) infinite', opacity: done ? 0 : 1 }} />
            </div>
            {answered && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginLeft: 4, fontSize: 12.5, color: 'var(--pa-text-2)', animation: 'pa-rise .5s ease-out both' }}>
                <span style={{ width: 18, height: 18, borderRadius: 5, background: 'linear-gradient(135deg,var(--pa-deep-2),var(--pa-primary))', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 10, fontWeight: 800 }}>α</span>
                Socrates · tower view for Arina East Residences
              </div>
            )}
          </div>
          <div style={{ position: 'relative', width: '100%', height: 'clamp(360px,40vw,560px)', marginTop: 150 }}>
            <Shot
              id="ipad13-02"
              priority
              sizes="(max-width: 860px) 72vw, 36vw"
              style={{ position: 'absolute', right: 0, bottom: 0, width: '78%', aspectRatio: '3 / 4', maxHeight: '100%', opacity: shotOpacity, transform: shotTransform, transition: 'opacity .7s ease-out, transform .7s ease-out' }}
            />
            <Shot
              id="iphone69-02"
              priority
              sizes="(max-width: 860px) 32vw, 16vw"
              style={{ position: 'absolute', left: 0, bottom: '-6%', width: '34%', aspectRatio: '1320 / 2868', maxHeight: '92%', zIndex: 2, opacity: shotOpacity, transform: shotTransform, transition: 'opacity .7s .15s ease-out, transform .7s .15s ease-out' }}
            />
          </div>
        </div>
      </section>
      <p style={{ maxWidth: 'var(--pa-max)', margin: '-16px auto 0', padding: '0 var(--pa-pad)', fontSize: 13, color: 'var(--pa-text-3)' }}>
        Socrates answers with an interactive tower view. Replies take seconds to a minute.
      </p>
    </>
  );
}
