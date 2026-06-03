'use client';

import Link from 'next/link';
import AppLayout from '@/components/AppLayout';

const MARKET_CARDS = [
  {
    href: '/market/rental',
    icon: '🏠',
    title: 'Rental Yield',
    description: 'Analyse gross and net rental yields by district, property type, and price tier.',
  },
  {
    href: '/market/primary',
    icon: '🏗️',
    title: 'Primary Sales',
    description: 'Developer sales volumes, new units launched, median prices from URA data.',
  },
  {
    href: '/market/resale',
    icon: '🔄',
    title: 'Resale Market',
    description: 'Resale transaction trends, sub-sale volumes, and price indices.',
  },
  {
    href: '/market/bestbuy',
    icon: '💡',
    title: 'Best Buy · Investment',
    description: 'AI-curated picks based on PSF discount to district median and yield potential.',
  },
  {
    href: '/market/newlaunch',
    icon: '🚀',
    title: 'New Launch at a Glance',
    description: 'Snapshot of all active new launch projects — units, availability, launch PSF.',
  },
];

export default function MarketPage() {
  return (
    <AppLayout>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
          Market Analytics
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '28px' }}>
          Singapore property market intelligence — powered by URA &amp; HDB data.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {MARKET_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '24px',
                  height: '100%',
                  transition: 'border-color 0.2s, background-color 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)';
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--surface2)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--surface)';
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '14px' }}>{card.icon}</div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                  {card.title}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
                  {card.description}
                </p>
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontSize: '13px', fontWeight: 600 }}>
                  Explore <span>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
