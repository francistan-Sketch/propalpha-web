'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import AskSocrates, { socratesHref } from '@/components/app/AskSocrates';
import { EmptyState } from '@/components/app/States';
import { Tag } from '@/components/site/ui';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';

// Dashboard from PropAlpha-App.dc.html: greeting, 60px ask field, prompt chips, recent conversations, quick links.

const PROMPTS = [
  'Show me the tower view for Arina East Residences',
  'Table of the top 5 new launch projects in D15 by units sold, with average psf',
  "How's the resale PSF trending in D15?",
  'What are industrial rents like in Ubi for a 2,000 sqft unit?',
];

const QUICK_LINKS = [
  { href: '/market', title: 'Market Updates', desc: 'Seven views, refreshed with every URA release' },
  { href: '/tools', title: 'Tech Tools', desc: 'Valuation, calculators, forms, flyers' },
  { href: '/search', title: 'Search', desc: 'Transactions and tower views' },
  { href: '/tower', title: 'Tower View', desc: 'Stacks across, floors down, tap a unit for its history' },
];

interface Conversation { id: string; title: string | null; created_at: string; updated_at: string }

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/** "Today", "Yesterday", a weekday within the week, "Last week", else a short date. */
function when(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((start(now) - start(d)) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return d.toLocaleDateString('en-SG', { weekday: 'short' });
  if (days < 14) return 'Last week';
  return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' });
}

const rowStyle = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--pa-border)', background: 'var(--pa-card)', color: 'var(--pa-text)', fontSize: 14, textAlign: 'left' } as const;

export default function DashboardPage() {
  const [firstName, setFirstName] = useState('');
  const [recents, setRecents] = useState<Conversation[] | null>(null);

  useEffect(() => {
    const u = getUser();
    setFirstName((u?.name || '').trim().split(/\s+/)[0] || '');
    let alive = true;
    api.get('/ai/conversations')
      .then((res) => { if (alive) setRecents(Array.isArray(res.data?.conversations) ? res.data.conversations.slice(0, 4) : []); })
      .catch(() => { if (alive) setRecents([]); }); // 403 for non-agents and network errors both show the empty state
    return () => { alive = false; };
  }, []);

  return (
    <AppLayout title="Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 1100, width: '100%', margin: '0 auto', minWidth: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 24 }}>
          <span style={{ fontSize: 13, color: 'var(--pa-text-2)' }}>{greeting()}{firstName ? `, ${firstName}` : ''}</span>
          <h2 style={{ fontSize: 'clamp(28px,3vw,40px)' }}>What would you like to know?</h2>
        </div>

        <AskSocrates variant="dashboard" />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PROMPTS.map((q) => (
            <Link key={q} href={socratesHref(q)} className="pa-row" style={{ padding: '9px 14px', borderRadius: 999, border: '1px solid var(--pa-border)', background: 'transparent', color: 'var(--pa-text-2)', fontSize: 13.5, textAlign: 'left' }}>
              {q}
            </Link>
          ))}
        </div>

        <div className="pa-2col" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h3 style={{ fontSize: 14, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--pa-text-3)' }}>Recent conversations</h3>
              <Link href="/socrates" className="pa-link" style={{ color: 'var(--pa-text-2)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>Open Socrates</Link>
            </div>
            {recents === null ? (
              <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--pa-border)', borderRadius: 14, overflow: 'hidden' }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ ...rowStyle, borderBottom: i < 2 ? rowStyle.borderBottom : 0 }}>
                    <span className="pa-pulse" style={{ height: 14, width: `${60 + i * 12}%`, borderRadius: 6, background: 'var(--pa-bg)' }} />
                    <span className="pa-pulse" style={{ height: 12, width: 48, borderRadius: 6, background: 'var(--pa-bg)' }} />
                  </div>
                ))}
              </div>
            ) : recents.length === 0 ? (
              <EmptyState>Your conversations with Socrates will appear here. Ask a question above to start one.</EmptyState>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--pa-border)', borderRadius: 14, overflow: 'hidden' }}>
                {recents.map((r, i) => (
                  <Link key={r.id} href={`/socrates?conversation=${encodeURIComponent(r.id)}`} className="pa-row" style={{ ...rowStyle, borderBottom: i < recents.length - 1 ? rowStyle.borderBottom : 0 }}>
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title || 'Untitled conversation'}</span>
                    <span style={{ fontSize: 12, color: 'var(--pa-text-3)', flex: 'none' }}>{when(r.updated_at || r.created_at)}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
            <h3 style={{ fontSize: 14, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--pa-text-3)' }}>Quick links</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {QUICK_LINKS.map((q) => (
                <Link key={q.href} href={q.href} className="pa-card-h" style={{ padding: 18, borderRadius: 14, border: '1px solid var(--pa-border)', background: 'var(--pa-card)', color: 'var(--pa-text)', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                  <strong style={{ fontSize: 15 }}>{q.title}</strong>
                  <span style={{ fontSize: 12.5, color: 'var(--pa-text-2)' }}>{q.desc}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* The sidebar's Maps item (Coming) lands here. */}
        <section id="maps" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '14px 16px', borderRadius: 14, border: '1px solid var(--pa-border)', background: 'color-mix(in srgb, var(--pa-card) 70%, transparent)', fontSize: 14 }}>
          <Tag kind="coming" />
          <span style={{ flex: 1, minWidth: 200 }}>Maps are in the app. Transaction pins with psf labels by district, Deal Radar, District Portrait, Nearby and Same Street.</span>
          <Link href="/download" className="pa-link" style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap' }}>Get the app</Link>
        </section>
      </div>
    </AppLayout>
  );
}
