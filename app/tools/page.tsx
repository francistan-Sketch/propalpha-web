'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import HubTile from '@/components/app/HubTile';
import { getUser, isUnlocked } from '@/lib/auth';

// Tech Tools hub from PropAlpha-App.dc.html. Agent tools carry the locked treatment for free-plan users;
// calculators are free for everyone and live in the app for now.
type Tool = { kicker: string; title: string; description: string; href?: string; coming?: boolean; agentOnly: boolean };

const TOOLS: Tool[] = [
  { kicker: 'Valuation', title: 'Income Valuation', description: 'Direct cap, DCF, IRR, equity multiple, sensitivity, PDF.', href: '/tools/income-valuation', agentOnly: true },
  { kicker: 'Calculator', title: 'Buyer Calculator', description: 'Resale, New Launch, Executive Condo. BSD, ABSD, CPF, TDSR.', href: '/download', coming: true, agentOnly: false },
  { kicker: 'Calculator', title: 'Executive Condo loan cap', description: 'Income ceiling and the lower of TDSR 55% and MSR 30%.', href: '/download', coming: true, agentOnly: false },
  { kicker: 'Flyers', title: 'Flyer Maker', description: "Your estate's market letter, in minutes.", href: '/flyer', agentOnly: true },
  { kicker: 'Forms', title: 'CEA Forms 1 to 8', description: 'All eight prescribed forms, PDF export.', coming: true, agentOnly: true },
  { kicker: 'Tenancy', title: 'Tenancy tools', description: 'LOI, Tenancy Agreement, room inventory.', coming: true, agentOnly: true },
  { kicker: 'Clients', title: 'Inbox', description: 'Client chat, photo sharing, WhatsApp hand-off.', coming: true, agentOnly: true },
];

export default function ToolsPage() {
  const [unlocked, setUnlocked] = useState(true);
  useEffect(() => { setUnlocked(isUnlocked(getUser())); }, []);

  return (
    <AppLayout title="Tech Tools">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {!unlocked && (
          <div role="status" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '14px 16px', borderRadius: 14, border: '1px solid color-mix(in srgb, var(--pa-amber) 50%, transparent)', background: 'color-mix(in srgb, var(--pa-amber) 10%, transparent)', fontSize: 14 }}>
            <span style={{ flex: 1, minWidth: 220 }}>Tech Tools are agent tools. Ask Luminaire Proptech to activate them for your account.</span>
            <a className="pa-btn" href="mailto:contact@luminaireproptech.com.sg?subject=PropAlpha%20Tech%20Tools%20activation" style={{ height: 36, display: 'inline-flex', alignItems: 'center', padding: '0 14px', borderRadius: 9, background: 'var(--pa-amber)', color: '#1E1B4B', fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap' }}>Request activation</a>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 14 }}>
          {TOOLS.map((t) => (
            <HubTile key={t.title} kicker={t.kicker} title={t.title} description={t.description} href={t.href} coming={t.coming} locked={t.agentOnly && !unlocked} minHeight={160} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
