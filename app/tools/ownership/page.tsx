'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { BackLink } from '@/components/app/market/ui';
import { Spinner } from '@/components/app/States';
import { useAuthUser } from '@/components/app/hooks';
import { OwnershipDenied, OwnershipGate, PersonalDataNotice } from '@/components/app/ownership/Gate';
import { GREEN, RED, fmtInt } from '@/components/app/ownership/ui';
import { describeOwnershipError, getOwnershipSummary, type CondoSummary, type GcbSummary, type StreetSummary } from '@/lib/ownership';

// Ownership Intelligence hub (mobile LandedOwnersScreen): the three modules with their summary counts, and
// the access log for admins. Shown only to accounts holding the `landed_owners` grant (components/app/ownership/Gate).

function Stat({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 12px', minWidth: 0 }}>
      <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: color || 'var(--pa-amber)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{value}</span>
      <span style={{ fontSize: 11, color: 'var(--pa-text-3)', letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 600, lineHeight: 1.3 }}>{label}</span>
    </div>
  );
}

function ModuleCard({ href, glyph, title, blurb, stats }: { href: string; glyph: string; title: string; blurb: string; stats: { value: string; label: string; color?: string }[] | null }) {
  return (
    <Link href={href} className="pa-card-h" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 22, borderRadius: 16, border: '1px solid var(--pa-border)', background: 'var(--pa-card)', color: 'var(--pa-text)', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <span aria-hidden="true" style={{ width: 42, height: 42, borderRadius: 11, display: 'grid', placeItems: 'center', background: 'color-mix(in srgb, var(--pa-primary) 22%, transparent)', fontSize: 22, flex: 'none' }}>{glyph}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <strong style={{ fontSize: 18 }}>{title}</strong>
          <span style={{ fontSize: 13, color: 'var(--pa-text-2)', lineHeight: 1.5 }}>{blurb}</span>
        </div>
      </div>
      {stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length === 4 ? 2 : stats.length}, minmax(0, 1fr))`, gap: 1, background: 'var(--pa-border)', border: '1px solid var(--pa-border)', borderRadius: 12, overflow: 'hidden' }}>
          {stats.map((s) => <div key={s.label} style={{ background: 'var(--pa-card)', minWidth: 0 }}><Stat {...s} /></div>)}
        </div>
      ) : (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--pa-text-2)' }}><Spinner size={14} />Counting…</span>
      )}
    </Link>
  );
}

function Hub() {
  const router = useRouter();
  const user = useAuthUser();
  const [street, setStreet] = useState<StreetSummary | null>(null);
  const [gcb, setGcb] = useState<GcbSummary | null>(null);
  const [condo, setCondo] = useState<CondoSummary | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      const fail = (e: unknown) => {
        if (!live) return;
        const err = describeOwnershipError(e);
        if (err.kind === 'session') router.replace('/login?reason=session');
        else if (err.kind === 'gated') setDenied(true);
      };
      getOwnershipSummary('street').then((r) => { if (live) setStreet(r); }).catch(fail);
      getOwnershipSummary('gcb').then((r) => { if (live) setGcb(r); }).catch(fail);
      getOwnershipSummary('condo').then((r) => { if (live) setCondo(r); }).catch(fail);
    }, 0);
    return () => { live = false; clearTimeout(t); };
  }, [router]);

  if (denied) return <OwnershipDenied />;

  return (
    <>
      <div className="pa-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
        <ModuleCard
          href="/tools/ownership/landed" glyph="🏘️" title="Landed Module" blurb="One card per landed address: every owner on file, land line where listed, every sale on record."
          stats={street ? [
            { value: fmtInt(street.total), label: 'addresses' },
            { value: fmtInt(street.current), label: 'current', color: GREEN },
            { value: fmtInt(street.outdated), label: 'outdated', color: RED },
          ] : null}
        />
        <ModuleCard
          href="/tools/ownership/gcb" glyph="🏛️" title="GCB Module" blurb="One card per sale record: purchasers, the land line subscriber at the bungalow, register tenants."
          stats={gcb ? [
            { value: fmtInt(gcb.total), label: 'sale records' },
            { value: fmtInt(gcb.current), label: 'current', color: GREEN },
            { value: fmtInt(gcb.outdated), label: 'outdated', color: RED },
          ] : null}
        />
        <ModuleCard
          href="/tools/ownership/condo" glyph="🏢" title="Condo Intelligence" blurb="One card per unit from the caveat library: purchasers, occupancy from the land line at the unit, contacts."
          stats={condo ? [
            { value: fmtInt(condo.total), label: 'units' },
            { value: fmtInt(condo.projects), label: 'projects' },
            { value: fmtInt(condo.current), label: 'current', color: GREEN },
            { value: fmtInt(condo.outdated), label: 'outdated', color: RED },
          ] : null}
        />
      </div>

      {user?.role?.toLowerCase() === 'admin' && (
        <Link href="/tools/ownership/log" className="pa-card-h" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 16, border: '1px solid var(--pa-border)', background: 'var(--pa-card)', color: 'var(--pa-text)', minWidth: 0 }}>
          <span aria-hidden="true" style={{ fontSize: 20, flex: 'none' }}>📋</span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <strong style={{ fontSize: 15 }}>Access log</strong>
            <span style={{ fontSize: 12.5, color: 'var(--pa-text-2)' }}>Who searched what and when. Every call is recorded, including viewing this log.</span>
          </span>
        </Link>
      )}
    </>
  );
}

export default function OwnershipHubPage() {
  return (
    <AppLayout title="Ownership Intelligence" subtitle="Landed · GCB · Condo">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
        <BackLink href="/tools">Tech Tools</BackLink>
        <OwnershipGate><PersonalDataNotice /><Hub /></OwnershipGate>
      </div>
    </AppLayout>
  );
}
