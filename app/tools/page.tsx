'use client';

import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import HubTile from '@/components/app/HubTile';
import { Tag } from '@/components/site/ui';
import { isUnlocked } from '@/lib/auth';
import { LANDED_OWNERS, useFeatures } from '@/lib/features';
import { useAuthUser } from '@/components/app/hooks';

// Tech Tools hub from PropAlpha-App.dc.html. Agent tools are part of Plus and carry the locked treatment
// ("Included in Plus", Upgrade to Plus → /pricing) for free-plan users; calculators are free for everyone
// and live in the app for now. A tool with `grant` exists only for accounts holding that explicit feature
// grant (GET /tenancy/features): Ownership Intelligence is personal data and is never shown locked.
type Tool = { kicker: string; title: string; description: string; href?: string; coming?: boolean; agentOnly: boolean; grant?: string; badge?: string };

const TOOLS: Tool[] = [
  { kicker: 'Valuation', title: 'Income Valuation', description: 'Direct cap, DCF, IRR, equity multiple, sensitivity, PDF.', href: '/tools/income-valuation', agentOnly: true },
  { kicker: 'Calculator', title: 'Buyer Calculator', description: 'Resale, New Launch, Executive Condo. BSD, ABSD, CPF, TDSR.', href: '/download', coming: true, agentOnly: false },
  { kicker: 'Calculator', title: 'Executive Condo loan cap', description: 'Income ceiling and the lower of TDSR 55% and MSR 30%.', href: '/download', coming: true, agentOnly: false },
  { kicker: 'Flyers', title: 'Flyer Maker', description: "Your estate's market letter, in minutes.", href: '/flyer', agentOnly: true },
  { kicker: 'Intelligence', title: 'Ownership Intelligence', description: 'Landed and condo owners', href: '/tools/ownership', agentOnly: false, grant: LANDED_OWNERS, badge: 'By request' },
  { kicker: 'Forms', title: 'CEA Forms 1 to 8', description: 'All eight prescribed forms, PDF export.', coming: true, agentOnly: true },
  { kicker: 'Tenancy', title: 'Tenancy tools', description: 'LOI, Tenancy Agreement, room inventory.', coming: true, agentOnly: true },
  { kicker: 'Clients', title: 'Inbox', description: 'Client chat, photo sharing, WhatsApp hand-off.', coming: true, agentOnly: true },
];

export default function ToolsPage() {
  const user = useAuthUser();
  const unlocked = user === undefined ? true : isUnlocked(user); // no locked flash before hydration
  const { features } = useFeatures(!!user);
  const tools = TOOLS.filter((t) => !t.grant || (features?.includes(t.grant) ?? false));

  return (
    <AppLayout title="Tech Tools">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {!unlocked && (
          <div role="status" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '14px 16px', borderRadius: 14, border: '1px solid color-mix(in srgb, var(--pa-amber) 50%, transparent)', background: 'color-mix(in srgb, var(--pa-amber) 10%, transparent)', fontSize: 14 }}>
            <span style={{ flex: 1, minWidth: 220 }}>Tech Tools are included in Plus. Start a 14-day free trial to use them; calculators stay free.</span>
            <Link href="/pricing" className="pa-btn" style={{ height: 36, display: 'inline-flex', alignItems: 'center', padding: '0 14px', borderRadius: 9, background: 'var(--pa-amber)', color: '#1E1B4B', fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap' }}>See plans</Link>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 14 }}>
          {tools.map((t) => (
            <HubTile key={t.title} kicker={t.kicker} title={t.title} description={t.description} href={t.href} coming={t.coming} locked={t.agentOnly && !unlocked} minHeight={160}
              badge={t.badge ? <Tag kind="coming">{t.badge}</Tag> : undefined} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
