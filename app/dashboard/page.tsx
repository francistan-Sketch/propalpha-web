'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { getUser, AuthUser } from '@/lib/auth';

const STAT_CARDS = [
  { label: 'Total Searches', icon: '🔍', value: '—' },
  { label: 'Reports Generated', icon: '📄', value: '—' },
  { label: 'Market Updates', icon: '📊', value: '—' },
  { label: 'Active Listings', icon: '🏢', value: '—' },
];

const QUICK_ACTIONS = [
  { href: '/search', label: 'Search Transactions', icon: '🔍', accent: true },
  { href: '/market', label: 'Market Analytics', icon: '📊', accent: false },
  { href: '/launches', label: 'New Launches', icon: '🏢', accent: false },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/login'); return; }
    setUser(u);
  }, [router]);

  return (
    <AppLayout>
      <div>
        {/* Welcome */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
            Here&apos;s your PropAlpha dashboard overview.
          </p>
        </div>

        {/* Stat cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '36px',
        }}>
          {STAT_CARDS.map((card) => (
            <div
              key={card.label}
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '20px',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>{card.icon}</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                {card.value}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '14px' }}>
            Quick Actions
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 20px',
                  borderRadius: '10px',
                  border: action.accent ? 'none' : '1px solid var(--border)',
                  backgroundColor: action.accent ? 'var(--accent)' : 'var(--surface)',
                  color: action.accent ? '#fff' : 'var(--text)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                <span>{action.icon}</span>
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
