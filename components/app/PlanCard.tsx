'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@/components/app/States';
import { getToken, getUser, setAuth } from '@/lib/auth';
import { billingError, createPortal, fetchBillingStatus, formatDate, intervalLabel, switchInterval, type BillingStatus, type Interval } from '@/lib/billing';

// The profile's plan card, live from GET /billing/status. Free: search counter and "Upgrade to Plus".
// Plus: interval, trial end or next renewal, "cancels at period end", Manage billing (Stripe portal) and
// a prorated switch between monthly and yearly. After Stripe Checkout the user lands on
// /profile?billing=success; the webhook that flips the plan can lag, so the card polls a few times.

const SUCCESS_POLLS = 5;
const POLL_MS = 2000;

const cardStyle: CSSProperties = { border: '1px solid var(--pa-border)', borderRadius: 16, background: 'var(--pa-card)', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 };
const secondaryBtn: CSSProperties = { height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 14px', borderRadius: 9, border: '1px solid var(--pa-border)', background: 'transparent', color: 'var(--pa-text)', fontWeight: 600, fontSize: 13, cursor: 'pointer', width: '100%' };
const primaryBtn: CSSProperties = { ...secondaryBtn, border: 0, background: 'var(--pa-primary)', color: '#fff', fontWeight: 700 };
const eyebrow: CSSProperties = { fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--pa-text-3)', fontWeight: 800 };

/** Keep the stored auth_user's plan in step with the billing status so isUnlocked() and the sidebar agree. */
function syncStoredPlan(status: BillingStatus) {
  const token = getToken();
  const user = getUser();
  if (!token || !user) return;
  if ((user.plan || 'free').toLowerCase() !== status.plan) setAuth(token, { ...user, plan: status.plan });
}

function Notice({ tone, children }: { tone: 'ok' | 'quiet' | 'error'; children: ReactNode }) {
  const c = tone === 'ok' ? 'var(--pa-emerald)' : tone === 'error' ? '#F87171' : 'var(--pa-text-2)';
  const border = tone === 'ok' ? 'color-mix(in srgb, var(--pa-emerald) 45%, transparent)' : tone === 'error' ? 'rgba(248,113,113,.5)' : 'var(--pa-border)';
  const bg = tone === 'ok' ? 'color-mix(in srgb, var(--pa-emerald) 10%, transparent)' : tone === 'error' ? 'rgba(248,113,113,.1)' : 'var(--pa-bg)';
  return <div role={tone === 'error' ? 'alert' : 'status'} style={{ padding: '10px 12px', borderRadius: 10, border: `1px solid ${border}`, background: bg, fontSize: 12.5, color: c, lineHeight: 1.45 }}>{children}</div>;
}

export default function PlanCard() {
  const router = useRouter();
  const params = useSearchParams();
  const justPaid = params.get('billing') === 'success';

  const [status, setStatus] = useState<BillingStatus | null>(() => null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState<'portal' | 'switch' | null>(null);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState<{ tone: 'ok' | 'quiet'; text: string } | null>(() => null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    const load = async (): Promise<BillingStatus | null> => {
      try {
        const s = await fetchBillingStatus();
        if (!alive) return null;
        setStatus(s);
        setLoadError('');
        syncStoredPlan(s);
        return s;
      } catch (err) {
        if (alive) setLoadError(billingError(err, 'Your plan could not be loaded right now.').message);
        return null;
      }
    };

    // Poll after a successful checkout until the webhook has flipped the plan to Plus (up to five tries).
    const confirm = async (attempt: number) => {
      const s = await load();
      if (!alive) return;
      if (s?.plan === 'plus') {
        setConfirming(false);
        setNotice({ tone: 'ok', text: 'Welcome to Plus. Your subscription is active.' });
        router.replace('/profile', { scroll: false });
        return;
      }
      if (attempt >= SUCCESS_POLLS) {
        setConfirming(false);
        setNotice({ tone: 'quiet', text: 'Payment received. Your plan is still being updated; refresh in a minute if it does not show Plus.' });
        router.replace('/profile', { scroll: false });
        return;
      }
      timer = setTimeout(() => confirm(attempt + 1), POLL_MS);
    };

    timer = setTimeout(() => {
      if (justPaid) {
        setConfirming(true);
        setNotice({ tone: 'quiet', text: 'Thanks, your payment went through. Switching your account to Plus…' });
        confirm(1);
      } else {
        load();
      }
    }, 0);
    return () => { alive = false; clearTimeout(timer); };
  }, [justPaid, router]);

  async function openPortal() {
    setBusy('portal');
    setActionError('');
    try {
      const url = await createPortal();
      if (!url) throw new Error('No portal URL');
      window.location.assign(url);
    } catch (err) {
      setActionError(billingError(err, 'Billing could not be opened. Try again in a moment.').message);
      setBusy(null);
    }
  }

  async function switchTo(interval: Interval) {
    setBusy('switch');
    setActionError('');
    try {
      await switchInterval(interval);
      const s = await fetchBillingStatus();
      setStatus(s);
      syncStoredPlan(s);
      setNotice({ tone: 'ok', text: interval === 'year' ? 'Switched to yearly billing. The unused part of this month is credited against the year.' : 'Switched to monthly billing.' });
    } catch (err) {
      setActionError(billingError(err, 'The switch could not be made. Try again, or use Manage billing.').message);
    } finally {
      setBusy(null);
    }
  }

  // ── Derived copy ────────────────────────────────────────────────────────────
  const plan = status?.plan ?? null;
  const onPlus = plan === 'plus';
  const trialing = status?.status === 'trialing' && !!status.trial_end;
  const subscribed = !!status?.has_subscription;
  const interval = status?.interval ?? null;

  let title = 'Plan';
  let line = '';
  if (status) {
    title = onPlus ? 'Plus' : 'Free plan';
    if (onPlus && subscribed) {
      const when = status.cancel_at_period_end
        ? `Cancels on ${formatDate(status.period_end)}`
        : trialing
          ? `Free trial until ${formatDate(status.trial_end)}`
          : status.period_end ? `Renews ${formatDate(status.period_end)}` : '';
      line = [intervalLabel(interval), when].filter(Boolean).join(' · ');
    } else if (onPlus) {
      line = 'Included with your account.';
    } else {
      line = 'Market data, search, tower view and maps.';
    }
  }

  const quota = status && !status.searches.unlimited ? status.searches : null;

  return (
    <div style={cardStyle}>
      <span style={eyebrow}>Plan</span>

      {!status && !loadError && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} aria-busy="true">
          <span className="pa-pulse" style={{ height: 16, width: '50%', borderRadius: 6, background: 'var(--pa-bg)' }} />
          <span className="pa-pulse" style={{ height: 12, width: '80%', borderRadius: 6, background: 'var(--pa-bg)' }} />
        </div>
      )}

      {status && (
        <>
          <strong style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            {title}
            {onPlus && trialing && !status.cancel_at_period_end && <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', background: 'color-mix(in srgb, var(--pa-amber) 18%, transparent)', color: 'var(--pa-amber)' }}>Trial</span>}
            {status.cancel_at_period_end && <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', background: 'var(--pa-bg)', border: '1px solid var(--pa-border)', color: 'var(--pa-text-2)' }}>Cancels at period end</span>}
          </strong>
          {line && <span style={{ fontSize: 12.5, color: 'var(--pa-text-2)' }}>{line}</span>}

          {quota && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', borderRadius: 10, background: 'var(--pa-bg)', border: '1px solid var(--pa-border)' }}>
              <span style={{ fontSize: 12.5, color: 'var(--pa-text)' }}>
                <strong style={{ color: 'var(--pa-amber)', fontVariantNumeric: 'tabular-nums' }}>{quota.used} of {quota.limit}</strong> searches used this month{quota.resetsOn ? `, resets ${formatDate(quota.resetsOn)}` : ''}
              </span>
              <div aria-hidden="true" style={{ height: 4, borderRadius: 2, background: 'var(--pa-border)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, quota.limit > 0 ? (quota.used / quota.limit) * 100 : 0)}%`, background: quota.used >= quota.limit ? 'var(--pa-amber)' : 'var(--pa-primary)', transition: 'width .3s' }} />
              </div>
            </div>
          )}
        </>
      )}

      {loadError && !status && <Notice tone="error">{loadError}</Notice>}
      {notice && <Notice tone={notice.tone}>{confirming && <Spinner size={12} />} {notice.text}</Notice>}
      {actionError && <Notice tone="error">{actionError}</Notice>}

      {status && !onPlus && (
        <>
          <Link href="/pricing" className="pa-btn" style={primaryBtn}>Upgrade to Plus</Link>
          <span style={{ fontSize: 11.5, color: 'var(--pa-text-3)' }}>Unlimited searches, AI Socrates, Flyer Maker and the agent tools. 14-day free trial.</span>
        </>
      )}

      {status && onPlus && subscribed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button type="button" className="pa-btn" onClick={openPortal} disabled={busy !== null} style={{ ...secondaryBtn, opacity: busy ? 0.6 : 1 }}>
            {busy === 'portal' && <Spinner size={12} />}Manage billing
          </button>
          {interval === 'month' && !status.cancel_at_period_end && (
            <button type="button" className="pa-btn" onClick={() => switchTo('year')} disabled={busy !== null} style={{ ...secondaryBtn, opacity: busy ? 0.6 : 1 }}>
              {busy === 'switch' && <Spinner size={12} />}Switch to yearly, prorated
            </button>
          )}
          {interval === 'year' && !status.cancel_at_period_end && (
            <button type="button" className="pa-btn" onClick={() => switchTo('month')} disabled={busy !== null} style={{ ...secondaryBtn, opacity: busy ? 0.6 : 1 }}>
              {busy === 'switch' && <Spinner size={12} />}Switch to monthly, prorated
            </button>
          )}
          <span style={{ fontSize: 11.5, color: 'var(--pa-text-3)' }}>Card, invoices, cancelling and plan changes open in Stripe&apos;s billing portal.</span>
        </div>
      )}
    </div>
  );
}
