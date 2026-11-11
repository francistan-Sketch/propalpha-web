'use client';

import { useCallback, useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { BackLink } from '@/components/app/market/ui';
import { ErrorBox, LoadingCard } from '@/components/app/States';
import { OwnershipDenied, OwnershipGate, PersonalDataNotice } from '@/components/app/ownership/Gate';
import { GcbCard } from '@/components/app/ownership/cards';
import { usePagedSearch } from '@/components/app/ownership/usePagedSearch';
import { Chips, CompleteMatch, GREEN, LoadMore, RED, ROLE, SearchBox, Toggle, countText, filterCard, legendText, plural, resultsGrid, termsOf, useDebounced } from '@/components/app/ownership/ui';
import { searchOwnership, type FlagFilter, type GcbItem, type GcbSearchParams, type GcbWho } from '@/lib/ownership';

// GCB Module (mobile LandedGcbScreen): one card per sale record. The owner is the purchaser on the left of
// the register; the land line subscriber on the right is the owner when the names match (staying there) and
// otherwise a tenant, so a differing name marks the bungalow TENANTED. Register tenants are listed too.
// A record is "outdated" (red) when the property has sold again after the contract date on file.
// GET /landed-owners/gcb/search?q&who&flag&tenant=1&complete=1&page

function GcbModule() {
  const [q, setQ] = useState('');
  const [who, setWho] = useState<GcbWho>('all');
  const [complete, setComplete] = useState(false);
  const [flag, setFlag] = useState<FlagFilter>('all');
  const [tenantOnly, setTenantOnly] = useState(false);
  const dq = useDebounced(q);
  const terms = useMemo(() => termsOf(dq), [dq]);

  const run = useCallback((page: number) => {
    const params: GcbSearchParams = {
      q: dq || undefined, who: who === 'all' ? undefined : who, flag: flag === 'all' ? undefined : flag,
      tenant: tenantOnly ? '1' : undefined, complete: complete ? '1' : undefined, page,
    };
    return searchOwnership('gcb', params);
  }, [dq, who, flag, tenantOnly, complete]);

  const { items, total, last, loading, more, error, loadMore } = usePagedSearch<GcbItem>(run);
  const since = last?.outdated_since || '2010-01-01';
  const asOf = last?.data_as_of || '';

  if (error?.kind === 'gated') return <OwnershipDenied />;

  return (
    <>
      <div style={filterCard}>
        <SearchBox value={q} onChange={setQ}
          placeholder={who === 'tenant' ? 'Tenant name or land line' : who === 'owner' ? 'Owner name, address, postal or land line' : 'Person, address, postal or land line'} />
        <CompleteMatch value={complete} onChange={setComplete} />
        <Chips ariaLabel="Who" value={who} onChange={setWho} options={[
          { value: 'all', label: 'Owners + tenants' },
          { value: 'owner', label: 'Owners', color: ROLE.owner.color },
          { value: 'tenant', label: 'Tenants', color: ROLE.tenant.color },
        ]} />
        <Chips ariaLabel="Status" value={flag} onChange={setFlag} options={[
          { value: 'all', label: 'All' },
          { value: 'current', label: 'Current', color: GREEN },
          { value: 'outdated', label: 'Outdated', color: RED },
        ]} />
        {who !== 'tenant' ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <Toggle label="Tenanted only" value={tenantOnly} onChange={setTenantOnly} />
          </div>
        ) : null}
        <span style={legendText}>
          Red: sold again after the contract date on file (or since {String(since).slice(0, 4)} when no date is held).
          {asOf ? `  Register data as of ${asOf}.` : ''}
        </span>
        <span style={countText} aria-live="polite">{loading ? 'Searching…' : `${total.toLocaleString('en-SG')} sale ${plural(total, 'record', 'records')}`}</span>
      </div>

      {error ? <ErrorBox title={error.kind === 'timeout' ? 'The search timed out.' : 'Could not load.'}>{error.message}</ErrorBox> : null}
      {loading && !items.length ? <LoadingCard label="Searching…" /> : null}
      {!loading && !error && !items.length ? <span style={{ textAlign: 'center', padding: 24, fontSize: 13, color: 'var(--pa-text-3)' }}>No records match.</span> : null}
      {items.length ? (
        <div style={resultsGrid}>
          {items.map((it) => <GcbCard key={String(it.id)} item={it} terms={terms} complete={complete} who={who} />)}
        </div>
      ) : null}
      <LoadMore shown={items.length} total={total} busy={more} onMore={loadMore} />
    </>
  );
}

export default function GcbOwnershipPage() {
  return (
    <AppLayout title="GCB Module" subtitle="Ownership Intelligence">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
        <BackLink href="/tools/ownership">Ownership Intelligence</BackLink>
        <OwnershipGate><PersonalDataNotice /><GcbModule /></OwnershipGate>
      </div>
    </AppLayout>
  );
}
