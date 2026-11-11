import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { Suspense } from 'react';
import Nav from '@/components/site/Nav';
import Footer, { CONTACT_EMAIL, DISCLAIMER } from '@/components/site/Footer';
import { Caption } from '@/components/site/ui';
import PlanCards from '@/components/site/pricing/PlanCards';

export const metadata: Metadata = {
  title: 'PropAlpha Pricing — Free and Plus',
  description:
    'PropAlpha is free for market data, maps, tower view, AI Valuation, the Buyer Calculator and 5 transaction searches a month. Plus adds unlimited searches, AI Socrates, Flyer Maker, Income Valuation and the agent tools for S$38 a month or S$288 a year, with a 14-day free trial.',
};

// Pricing page in the Home page's language: kicker, h2, the plan cards (client), a ruled comparison grid, FAQ.
const kicker: CSSProperties = { fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--pa-amber)' };
const h2: CSSProperties = { fontSize: 'clamp(32px,4vw,52px)', marginTop: 12 };
const lead: CSSProperties = { fontSize: 17, color: 'var(--pa-text-2)', maxWidth: 520 };
const section: CSSProperties = { maxWidth: 'var(--pa-max)', margin: '0 auto', padding: 'var(--pa-sec) var(--pa-pad) 0' };
const ruled: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1.7fr) minmax(0,1fr) minmax(0,1fr)', gap: 2, background: 'var(--pa-border)', border: '1px solid var(--pa-border)', borderRadius: 16, overflow: 'hidden' };
const cell: CSSProperties = { padding: '16px clamp(10px,2vw,18px)', background: 'var(--pa-bg)', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, justifyContent: 'center', overflowWrap: 'anywhere' };
const headCell: CSSProperties = { ...cell, padding: '12px clamp(10px,2vw,18px)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 800, color: 'var(--pa-text-3)' };

type Avail = 'yes' | 'no' | string;
const COMPARISON: { t: string; d?: string; free: Avail; plus: Avail }[] = [
  { t: 'Market data, maps and tower view', d: 'Seven market views, transaction pins, stacks across and floors down.', free: 'yes', plus: 'yes' },
  { t: 'AI Valuation and Buyer Calculator', d: 'Resale, New Launch and Executive Condo, with BSD, ABSD, CPF and TDSR.', free: 'yes', plus: 'yes' },
  { t: 'Transaction searches', d: 'Free searches count per calendar month and reset on the 1st.', free: '5 a month', plus: 'Unlimited' },
  { t: 'AI Socrates', d: 'Ask in plain English; tables, charts and tower views from PropAlpha data.', free: 'no', plus: 'yes' },
  { t: 'Flyer Maker', d: "Your estate's market letter, A4 and social sizes.", free: 'no', plus: 'yes' },
  { t: 'Income Valuation', d: 'Direct cap, DCF, IRR, equity multiple, sensitivity, PDF.', free: 'no', plus: 'yes' },
  { t: 'Tenancy tools', d: 'LOI, Tenancy Agreement, room inventory.', free: 'no', plus: 'yes' },
  { t: 'Join codes, campaigns and broadcasts', d: 'Clients who join with your code are handed back to you.', free: 'no', plus: 'yes' },
  { t: 'Client chat', d: 'Chat, photo sharing, WhatsApp hand-off.', free: 'no', plus: 'yes' },
  { t: 'Devices signed in at once', d: 'A second sign-in on Free signs the first device out.', free: 'One', plus: 'More than one' },
];

const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: 'How does the 14-day free trial work?',
    a: 'Plus starts with 14 days free. Your card is not charged until the trial ends, and if you cancel before then you pay nothing. After the trial, Plus renews at the price you chose until you cancel.',
  },
  {
    q: 'Can I cancel?',
    a: 'Any time, from Manage billing on your profile. Plus stays on until the end of the period you have already paid for, and your account then returns to Free.',
  },
  {
    q: 'Can I switch from monthly to yearly?',
    a: 'Yes, from your profile. Stripe prorates the change: the unused part of your current month is credited against the yearly price, so you only top up the difference. You can switch back to monthly the same way.',
  },
  {
    q: 'What stays free?',
    a: 'Market data, maps, tower view, AI Valuation, the Buyer Calculator and 5 transaction searches a calendar month. Free needs no card.',
  },
  {
    q: 'What about Ownership Intelligence, AML checks and V Office?',
    a: (
      <>
        These handle sensitive data and are switched on by Luminaire Proptech by request, account by account. They are not part of Plus. Write to <a className="pa-link" href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--pa-text)', textDecoration: 'underline', textUnderlineOffset: 2, overflowWrap: 'anywhere' }}>{CONTACT_EMAIL}</a> to ask.
      </>
    ),
  },
];

const Check = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--pa-emerald)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5L19 7" /></svg>
);

function AvailCell({ v, strong }: { v: Avail; strong?: boolean }) {
  if (v === 'yes') return <div role="cell" style={cell}><span role="img" aria-label="Included" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: 'var(--pa-emerald)', fontWeight: 700 }}><Check /><span className="pa-hide-xs" aria-hidden="true">Included</span></span></div>;
  if (v === 'no') return <div role="cell" style={cell}><span role="img" aria-label="Not included" style={{ fontSize: 14, color: 'var(--pa-text-3)' }}>—</span></div>;
  return <div role="cell" style={cell}><span style={{ fontSize: 13.5, fontWeight: strong ? 800 : 600, color: strong ? 'var(--pa-amber)' : 'var(--pa-text)' }}>{v}</span></div>;
}

export default function PricingPage() {
  return (
    <div className="pa-page" style={{ overflowX: 'clip' }}>
      <Nav current="pricing" />

      {/* PLANS */}
      <section id="plans" style={{ ...section, paddingTop: 'clamp(56px,8vw,112px)' }}>
        <div style={{ maxWidth: 640, marginBottom: 40 }}>
          <span style={kicker}>Plans</span>
          <h2 style={h2}>Free to start. Plus when you need more.</h2>
          <p style={{ ...lead, marginTop: 16 }}>Market data is free for everyone. Plus adds unlimited searches, AI Socrates and the agent tools, with a 14-day free trial and no lock-in.</p>
        </div>
        <Suspense fallback={<div style={{ minHeight: 420 }} aria-busy="true" />}>
          <PlanCards />
        </Suspense>
      </section>

      {/* COMPARISON */}
      <section id="compare" style={section}>
        <div style={{ maxWidth: 640, marginBottom: 40 }}>
          <span style={kicker}>Compare</span>
          <h2 style={h2}>What is in each plan.</h2>
        </div>
        <div role="table" aria-label="Feature comparison" style={ruled}>
          <div role="row" style={{ display: 'contents' }}>
            <div role="columnheader" style={headCell}>Feature</div>
            <div role="columnheader" style={headCell}>Free</div>
            <div role="columnheader" style={{ ...headCell, color: 'var(--pa-text)' }}>Plus</div>
          </div>
          {COMPARISON.map((r) => (
            <div role="row" key={r.t} style={{ display: 'contents' }}>
              <div role="cell" style={cell}>
                <strong style={{ fontSize: 15, letterSpacing: '-0.01em' }}>{r.t}</strong>
                {r.d && <span className="pa-hide-xs" style={{ fontSize: 13, color: 'var(--pa-text-2)', lineHeight: 1.45 }}>{r.d}</span>}
              </div>
              <AvailCell v={r.free} />
              <AvailCell v={r.plus} strong={r.plus !== 'yes'} />
            </div>
          ))}
        </div>
        <Caption style={{ marginTop: 16, maxWidth: 720, lineHeight: 1.55 }}>
          Ownership Intelligence, AML checks and V Office are switched on by Luminaire Proptech by request and are not part of Plus. Calculators are for illustration and are not financial, valuation or legal advice.
        </Caption>
      </section>

      {/* FAQ */}
      <section id="faq" style={section}>
        <div className="pa-2col" style={{ display: 'grid', gridTemplateColumns: '.8fr 1.2fr', gap: 'clamp(24px,4vw,64px)', alignItems: 'start' }}>
          <div style={{ maxWidth: 420 }}>
            <span style={kicker}>Questions</span>
            <h2 style={h2}>Short answers.</h2>
            <p style={{ ...lead, marginTop: 16 }}>Anything else, write to <a className="pa-link" href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--pa-text)', fontWeight: 600, overflowWrap: 'anywhere' }}>{CONTACT_EMAIL}</a>.</p>
          </div>
          <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', border: '1px solid var(--pa-border)', borderRadius: 16, overflow: 'hidden', background: 'var(--pa-border)', gap: 2 }}>
            {FAQ.map((f) => (
              <div key={f.q} style={{ padding: '18px 20px', background: 'var(--pa-bg)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <dt style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>{f.q}</dt>
                <dd style={{ margin: 0, fontSize: 14.5, color: 'var(--pa-text-2)', lineHeight: 1.55 }}>{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section style={{ ...section, paddingBottom: 'var(--pa-sec)' }}>
        <div style={{ padding: '20px 22px', borderRadius: 16, border: '1px solid var(--pa-border)', background: 'color-mix(in srgb, var(--pa-card) 70%, transparent)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Caption style={{ margin: 0, lineHeight: 1.6 }}>Prices are in Singapore dollars. Payments are handled by Stripe; PropAlpha does not see or store your card details. Plus renews until you cancel, and cancelling takes effect at the end of the period already paid for.</Caption>
          <Caption style={{ margin: 0, lineHeight: 1.6 }}>{DISCLAIMER}</Caption>
        </div>
      </section>

      <Footer />
    </div>
  );
}
