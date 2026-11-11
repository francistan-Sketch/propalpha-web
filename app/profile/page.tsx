'use client';

import { Suspense, useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { ErrorBox } from '@/components/app/States';
import PlanCard from '@/components/app/PlanCard';
import api from '@/lib/api';
import { logout, initials, isUnlocked, planLabel } from '@/lib/auth';
import { useAuthUser } from '@/components/app/hooks';

// Profile from PropAlpha-App.dc.html: portrait, fields, join code card with QR, plan card, Sign out, Delete account.
// The plan card (components/app/PlanCard.tsx) is live from /billing/status and handles ?billing=success.

interface AgentProfile {
  name?: string | null;
  cea_reg_no?: string | null;
  agent_licence?: string | null;
  agency?: string | null;
  mobile?: string | null;
  email?: string | null;
  photo_uri?: string | null;
  designation?: string | null;
  join_code?: string | null;
}

const JOIN_BASE = 'https://propalpha.sg/join/';

const cardStyle = { border: '1px solid var(--pa-border)', borderRadius: 16, background: 'var(--pa-card)' } as const;
const secondaryBtn = { height: 40, display: 'inline-flex', alignItems: 'center', padding: '0 14px', borderRadius: 9, border: '1px solid var(--pa-border)', background: 'transparent', color: 'var(--pa-text)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer' } as const;

function titleCase(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: 'var(--pa-text-2)', minWidth: 0 }}>
      {label}
      <input readOnly value={value} style={{ height: 40, padding: '0 12px', borderRadius: 9, border: '1px solid var(--pa-border)', background: 'var(--pa-bg)', color: 'var(--pa-text)', fontSize: 14, width: '100%', minWidth: 0 }} />
    </label>
  );
}

export default function ProfilePage() {
  const user = useAuthUser() ?? null;
  const unlocked = isUnlocked(user);
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [shared, setShared] = useState<'idle' | 'copied'>('idle');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!unlocked) return;
    let alive = true;
    api.get('/flyer/agent')
      .then((res) => { if (alive && res.data?.agent) setAgent(res.data.agent as AgentProfile); })
      .catch(() => { /* 403/404: no agent profile yet; the join code card simply stays hidden */ });
    return () => { alive = false; };
  }, [unlocked]);

  const joinCode = agent?.join_code || '';
  const joinUrl = JOIN_BASE + encodeURIComponent(joinCode);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(joinUrl)}`;

  async function shareCode() {
    const text = `Join me on PropAlpha with code ${joinCode}: ${joinUrl}`;
    try {
      if (typeof navigator.share === 'function') { await navigator.share({ title: 'My PropAlpha join code', text, url: joinUrl }); return; }
      await navigator.clipboard.writeText(joinUrl);
      setShared('copied');
      setTimeout(() => setShared('idle'), 2000);
    } catch { /* user dismissed the share sheet */ }
  }

  async function deleteAccount() {
    const ok = window.confirm('Delete your PropAlpha account? Your profile, saved data and sessions are removed permanently. This cannot be undone.');
    if (!ok) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete('/auth/account');
      logout(); // clears storage and hard-navigates to /login
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setDeleteError(e?.response?.data?.error || 'The account could not be deleted. Try again, or contact Luminaire Proptech.');
      setDeleting(false);
    }
  }

  const name = user?.name || 'PropAlpha user';
  const subline = agent?.agency || agent?.cea_reg_no
    ? [agent?.agency, agent?.cea_reg_no ? `CEA ${agent.cea_reg_no}` : null].filter(Boolean).join(' · ')
    : [titleCase(user?.role || ''), user?.email].filter(Boolean).join(' · ');

  return (
    <AppLayout title="Profile">
      <div className="pa-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 20, maxWidth: 1000, width: '100%', margin: '0 auto', alignItems: 'start' }}>
        <section style={{ ...cardStyle, padding: 22, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', minWidth: 0 }}>
            <div aria-hidden="true" style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', background: 'var(--pa-primary)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 800, flex: 'none' }}>
              {agent?.photo_uri ? (
                // eslint-disable-next-line @next/next/no-img-element -- agent portraits come from the backend's own storage
                <img src={agent.photo_uri} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : initials(name)}
            </div>
            <div style={{ minWidth: 0 }}>
              <strong style={{ fontSize: 20, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</strong>
              {subline && <span style={{ fontSize: 13.5, color: 'var(--pa-text-2)' }}>{subline}</span>}
            </div>
          </div>

          <div className="pa-4col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Name" value={name} />
            <Field label="Email" value={user?.email || agent?.email || '—'} />
            <Field label="Role" value={titleCase(user?.role || 'public')} />
            <Field label="Plan" value={planLabel(user)} />
            {agent && (
              <>
                <Field label="CEA number" value={agent.cea_reg_no || '—'} />
                <Field label="Agency" value={agent.agency || '—'} />
                <Field label="Mobile" value={agent.mobile || '—'} />
                <Field label="Designation" value={agent.designation || '—'} />
              </>
            )}
          </div>
          <span style={{ fontSize: 12, color: 'var(--pa-text-3)' }}>Details are edited in the PropAlpha app and shown here as they are on your account.</span>

          {deleteError && <ErrorBox title="Delete account failed.">{deleteError}</ErrorBox>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--pa-border)', flexWrap: 'wrap' }}>
            <button type="button" className="pa-btn" onClick={() => logout()} style={secondaryBtn}>Sign out</button>
            <button type="button" className="pa-btn" onClick={deleteAccount} disabled={deleting} style={{ ...secondaryBtn, border: '1px solid rgba(248,113,113,.5)', color: '#F87171', opacity: deleting ? 0.6 : 1 }}>
              {deleting ? 'Deleting…' : 'Delete account'}
            </button>
          </div>
        </section>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          {joinCode && (
            <div style={{ ...cardStyle, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', textAlign: 'center' }}>
              <span style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--pa-text-3)', fontWeight: 800, alignSelf: 'flex-start' }}>Join code</span>
              <div style={{ width: 160, height: 160, borderRadius: 10, background: '#fff', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- generated on the fly by api.qrserver.com */}
                <img src={qrSrc} width={160} height={160} alt={`QR code for join code ${joinCode}`} style={{ display: 'block' }} />
              </div>
              <strong style={{ fontSize: 24, letterSpacing: '.12em', fontVariantNumeric: 'tabular-nums' }}>{joinCode}</strong>
              <span style={{ fontSize: 12.5, color: 'var(--pa-text-2)' }}>Clients who join with your code are handed back to you in every report.</span>
              <button type="button" className="pa-btn" onClick={shareCode} style={{ ...secondaryBtn, height: 36, width: '100%', justifyContent: 'center', fontSize: 13 }}>
                {shared === 'copied' ? 'Link copied' : 'Share code'}
              </button>
              <span style={{ fontSize: 11, color: 'var(--pa-text-3)' }}>QR generated from {JOIN_BASE.replace('https://', '')}{joinCode} by a public QR service.</span>
            </div>
          )}
          <Suspense
            fallback={(
              <div style={{ ...cardStyle, padding: 20, display: 'flex', flexDirection: 'column', gap: 6 }} aria-busy="true">
                <span style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--pa-text-3)', fontWeight: 800 }}>Plan</span>
                <strong style={{ fontSize: 16 }}>{planLabel(user)}</strong>
              </div>
            )}
          >
            <PlanCard />
          </Suspense>
        </aside>
      </div>
    </AppLayout>
  );
}
