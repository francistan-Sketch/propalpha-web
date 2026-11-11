'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Btn, Tag, Caption } from '@/components/site/ui';
import { CONTACT_EMAIL } from '@/components/site/Footer';
import { Spinner } from '@/components/app/States';
import { isLoggedIn } from '@/lib/auth';
import { billingError, createCheckout, fetchBillingStatus, fetchPlans, formatSgd, type BillingStatus, type Interval, type Plans } from '@/lib/billing';

// The two plan cards with the monthly / yearly toggle. Prices come from GET /billing/plans; the product
// decisions below are the fallback when the request fails so the page never shows an empty card.
// When Stripe is not configured yet, the Plus buttons give way to a contact line.

const FALLBACK_PLANS: Plans = {
  configured: true,
  trial_days: 14,
  free: { searches_per_month: 5 },
  plus: { month: { amount_sgd: 38, label: 'S$38 a month' }, year: { amount_sgd: 288, label: 'S$288 a year' }, features: [] },
};

const FREE_POINTS = ['Market data, maps and tower view', 'AI Valuation and Buyer Calculator', 'transaction searches a calendar month'];
const PLUS_POINTS = [
  'Everything in Free, with unlimited searches',
  'AI Socrates',
  'Flyer Maker and Income Valuation',
  'Tenancy tools: LOI, Tenancy Agreement, room inventory',
  'Join codes, campaigns, broadcasts and client chat',
  'More than one device signed in at once',
];

const card: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 18, padding: 'clamp(22px,3vw,30px)', borderRadius: 16, border: '1px solid var(--pa-border)', background: 'color-mix(in srgb, var(--pa-card) 85%, transparent)', minWidth: 0 };
const planName: CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em' };
const price: CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(36px,4vw,44px)', letterSpacing: '-0.03em', lineHeight: 1, color: 'var(--pa-amber)' };
const per: CSSProperties = { fontSize: 15, color: 'var(--pa-text-2)', fontWeight: 600 };

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--pa-emerald)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none', marginTop: 3 }}><path d="M5 12l5 5L19 7" /></svg>
);

function Points({ items }: { items: ReactNode[] }) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 9, fontSize: 14.5, lineHeight: 1.45 }}>
      {items.map((t, i) => <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><Check /><span>{t}</span></li>)}
    </ul>
  );
}

function Toggle({ value, onChange }: { value: Interval; onChange: (v: Interval) => void }) {
  const seg = (v: Interval, label: string) => (
    <button type="button" onClick={() => onChange(v)} aria-pressed={value === v} style={{ height: 38, padding: '0 18px', borderRadius: 10, border: 0, cursor: 'pointer', fontWeight: 700, fontSize: 14, background: value === v ? 'var(--pa-primary)' : 'transparent', color: value === v ? '#fff' : 'var(--pa-text-2)', transition: 'background .15s, color .15s' }}>
      {label}
    </button>
  );
  return (
    <div role="group" aria-label="Billing period" style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 14, border: '1px solid var(--pa-border)', background: 'color-mix(in srgb, var(--pa-card) 85%, transparent)' }}>
      {seg('month', 'Monthly')}
      {seg('year', 'Yearly')}
    </div>
  );
}

function Notice({ tone, children }: { tone: 'quiet' | 'error'; children: ReactNode }) {
  const err = tone === 'error';
  return (
    <div role={err ? 'alert' : 'status'} style={{ padding: '12px 16px', borderRadius: 12, fontSize: 14, border: `1px solid ${err ? 'rgba(248,113,113,.5)' : 'var(--pa-border)'}`, background: err ? 'rgba(248,113,113,.1)' : 'color-mix(in srgb, var(--pa-card) 70%, transparent)', color: err ? 'var(--pa-text)' : 'var(--pa-text-2)' }}>
      {children}
    </div>
  );
}

export default function PlanCards() {
  const router = useRouter();
  const params = useSearchParams();
  const cancelled = params.get('billing') === 'cancelled';

  const [plans, setPlans] = useState<Plans | null>(() => null);
  const [status, setStatus] = useState<BillingStatus | null>(() => null);
  const [signedIn, setSignedIn] = useState(() => false);
  const [interval, setInterval_] = useState<Interval>(() => 'month');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ReactNode>(null);

  // Load plans (and, when signed in, the account's billing status) from a cancellable timer so the
  // effect body itself sets no state.
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      const loggedIn = isLoggedIn();
      setSignedIn(loggedIn);
      fetchPlans()
        .then((p) => { if (alive) setPlans(p); })
        .catch(() => { if (alive) setPlans(FALLBACK_PLANS); });
      if (loggedIn) {
        fetchBillingStatus()
          .then((s) => { if (alive) setStatus(s); })
          .catch(() => { /* the cards still work without it; checkout answers 409 if already subscribed */ });
      }
    }, 0);
    return () => { alive = false; clearTimeout(t); };
  }, []);

  const p = plans ?? FALLBACK_PLANS;
  const loadingPlans = plans === null;
  const onPlus = status?.plan === 'plus';
  const freeLimit = p.free.searches_per_month;
  const monthly = p.plus.month.amount_sgd;
  const yearly = p.plus.year.amount_sgd;
  const trialDays = p.trial_days;

  async function startCheckout() {
    if (!signedIn) { router.push('/login?next=/pricing'); return; }
    setBusy(true);
    setError(null);
    try {
      const url = await createCheckout(interval);
      if (!url) throw new Error('No checkout URL');
      window.location.assign(url);
    } catch (err) {
      const e = billingError(err, 'Checkout could not be started. Try again in a moment.');
      if (e.status === 409) {
        setError(<>You already have a Plus subscription. Manage it from <Link href="/profile" className="pa-link" style={{ color: 'var(--pa-text)', textDecoration: 'underline', textUnderlineOffset: 2 }}>your profile</Link>.</>);
      } else {
        setError(e.message);
      }
      setBusy(false);
    }
  }

  const plusButton = (() => {
    if (!p.configured) {
      return (
        <Caption style={{ margin: 0, lineHeight: 1.5 }}>
          Payments are being switched on. Contact <a className="pa-link" href={`mailto:${CONTACT_EMAIL}?subject=PropAlpha%20Plus`} style={{ color: 'var(--pa-text)', textDecoration: 'underline', textUnderlineOffset: 2, overflowWrap: 'anywhere' }}>{CONTACT_EMAIL}</a> to upgrade.
        </Caption>
      );
    }
    if (onPlus) return <Btn href="/profile" variant="secondary" style={{ width: '100%' }}>You are on Plus · Manage billing</Btn>;
    return (
      <Btn onClick={startCheckout} disabled={busy || loadingPlans} arrow={!busy} style={{ width: '100%' }}>
        {busy && <Spinner size={16} light />}
        {signedIn ? `Start ${trialDays}-day free trial` : 'Sign in to start your free trial'}
      </Btn>
    );
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
      {cancelled && <Notice tone="quiet">Checkout was cancelled. Nothing was charged; you are still on the Free plan.</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      <Toggle value={interval} onChange={setInterval_} />

      <div className="pa-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, width: '100%', maxWidth: 900, alignItems: 'stretch' }}>
        {/* FREE */}
        <section aria-label="Free plan" style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <span style={planName}>Free</span>
            {status && !onPlus && <Tag kind="locked">Your plan</Tag>}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={price}>S$0</span>
            <span style={per}>no card needed</span>
          </div>
          <Caption style={{ margin: 0 }}>Market data for everyone, with {freeLimit} transaction searches a month.</Caption>
          <Points items={[FREE_POINTS[0], FREE_POINTS[1], <>{freeLimit} {FREE_POINTS[2]}</>]} />
          <div style={{ marginTop: 'auto' }}>
            {signedIn
              ? <Btn href="/dashboard" variant="secondary" style={{ width: '100%' }}>Open PropAlpha</Btn>
              : <Btn href="/login?next=/dashboard" variant="secondary" style={{ width: '100%' }}>Create a free account</Btn>}
          </div>
        </section>

        {/* PLUS */}
        <section aria-label="Plus plan" style={{ ...card, border: '1px solid color-mix(in srgb, var(--pa-primary) 70%, var(--pa-border))', boxShadow: 'var(--pa-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={planName}>Plus</span>
            {onPlus ? <Tag kind="live">Your plan</Tag> : <Tag kind="new">{trialDays}-day free trial</Tag>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span style={price}>{loadingPlans ? <span className="pa-pulse">{formatSgd(interval === 'year' ? yearly : monthly)}</span> : formatSgd(interval === 'year' ? yearly : monthly)}</span>
              <span style={per}>{interval === 'year' ? 'a year' : 'a month'}</span>
            </div>
            <Caption style={{ margin: 0, color: interval === 'year' ? 'var(--pa-emerald)' : 'var(--pa-text-3)', fontWeight: interval === 'year' ? 700 : 400 }}>
              {interval === 'year' ? `${formatSgd(yearly)} a year · two months free` : `or ${formatSgd(yearly)} a year, two months free`}
            </Caption>
          </div>
          <Caption style={{ margin: 0 }}>{trialDays} days free, then {formatSgd(interval === 'year' ? yearly : monthly)} {interval === 'year' ? 'a year' : 'a month'}. Cancel any time.</Caption>
          <Points items={PLUS_POINTS} />
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {plusButton}
            {!signedIn && p.configured && !loadingPlans && <Caption style={{ margin: 0, textAlign: 'center' }}>Free account first, then the trial starts from your profile or here.</Caption>}
          </div>
        </section>
      </div>
    </div>
  );
}
