'use client';

import AppLayout from '@/components/AppLayout';
import HubTile, { type HubTileProps } from '@/components/app/HubTile';

// Market hub from PropAlpha-App.dc.html: seven tiles, auto-fill 240px. Industrial Rents is in the app only.
const TILES: HubTileProps[] = [
  { kicker: 'Rental', title: 'Rental Yield', description: 'Monthly rental data by district.', href: '/market/rental' },
  { kicker: 'Primary', title: 'Primary Sales', description: 'Developer sales by project and district.', href: '/market/primary' },
  { kicker: 'Resale', title: 'Resale Market', description: '1 month to 2 years, monthly view.', href: '/market/resale' },
  { kicker: 'Picks', title: 'Best Buy', description: 'Ranked by psf discount to district average.', href: '/market/bestbuy' },
  { kicker: 'Industrial', title: 'Industrial Rents', description: 'URA J-SPACE quartiles by district, size band and level.', href: '/download', coming: true },
  { kicker: 'New launch', title: 'New Launch at a Glance', description: 'Which projects are moving, and where.', href: '/market/newlaunch' },
  { kicker: 'Report', title: 'AI Valuation', description: "A report that carries the client's agent.", href: '/market/ai-valuation' },
];

export default function MarketPage() {
  return (
    <AppLayout title="Market Updates">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <p style={{ fontSize: 14, color: 'var(--pa-text-2)' }}>Refreshed with every URA release. Free for every registered user.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 14 }}>
          {TILES.map((t) => <HubTile key={t.title} {...t} />)}
        </div>
      </div>
    </AppLayout>
  );
}
