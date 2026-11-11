'use client';

import { useCallback, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { BackLink } from '@/components/app/market/ui';
import { ErrorBox, LoadingCard } from '@/components/app/States';
import { OwnershipDenied, OwnershipGate, PersonalDataNotice } from '@/components/app/ownership/Gate';
import { AddressCard } from '@/components/app/ownership/cards';
import { PickerPanel } from '@/components/app/ownership/Picker';
import { usePagedSearch } from '@/components/app/ownership/usePagedSearch';
import { Chips, ClearBtn, CompleteMatch, GREEN, Legend, LoadMore, PickBtn, RED, SearchBox, Toggle, countText, filterCard, plural, resultsGrid, useDebounced } from '@/components/app/ownership/ui';
import { getLandedStreets, searchOwnership, type FlagFilter, type StreetItem, type StreetSearchParams } from '@/lib/ownership';

// Landed Module (mobile LandedStreetScreen): one card per landed address. Every name on file is an owner; a
// land line is shown where the owner has one listed. Every PropAlpha sale on record is listed, newest first.
// GET /landed-owners/street/search?q&flag&phone=1&street&complete=1&page

function LandedModule() {
  const [q, setQ] = useState('');
  const [complete, setComplete] = useState(false);
  const [flag, setFlag] = useState<FlagFilter>('all');
  const [phoneOnly, setPhoneOnly] = useState(false);
  const [street, setStreet] = useState('');
  const [pickStreet, setPickStreet] = useState(false);
  const dq = useDebounced(q);

  const run = useCallback((page: number) => {
    const params: StreetSearchParams = {
      q: dq || undefined, flag: flag === 'all' ? undefined : flag, phone: phoneOnly ? '1' : undefined,
      street: street || undefined, complete: complete ? '1' : undefined, page,
    };
    return searchOwnership('street', params);
  }, [dq, flag, phoneOnly, street, complete]);

  const { items, total, last, loading, more, error, loadMore } = usePagedSearch<StreetItem>(run);
  const since = last?.outdated_since || '2013-01-01';
  const asOf = last?.data_as_of || '';

  const loadStreets = useCallback(async (text: string) => {
    const rows = await getLandedStreets(text || undefined);
    return rows.map((r) => ({ key: r.street, label: r.street, current: r.current, outdated: r.outdated }));
  }, []);

  if (error?.kind === 'gated') return <OwnershipDenied />;

  return (
    <>
      <div style={filterCard}>
        <SearchBox value={q} onChange={setQ} placeholder="Owner, street, house no., postal or land line" />
        <CompleteMatch value={complete} onChange={setComplete} />
        <Chips ariaLabel="Status" value={flag} onChange={setFlag} options={[
          { value: 'all', label: 'All' },
          { value: 'current', label: 'Current', color: GREEN },
          { value: 'outdated', label: 'Outdated', color: RED },
        ]} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Toggle label="Land line listed" value={phoneOnly} onChange={setPhoneOnly} />
          <PickBtn active={!!street} onClick={() => setPickStreet((o) => !o)}>{street || 'Browse streets'}</PickBtn>
          {street ? <ClearBtn onClick={() => setStreet('')} /> : null}
        </div>
        {pickStreet && (
          <PickerPanel title="Find a street" placeholder="Find a street" load={loadStreets} empty="No streets match."
            onPick={(name) => { setStreet(name); setPickStreet(false); }} onClose={() => setPickStreet(false)} />
        )}
        <Legend since={since} asOf={asOf} />
        <span style={countText} aria-live="polite">{loading ? 'Searching…' : `${total.toLocaleString('en-SG')} ${plural(total, 'address', 'addresses')}`}</span>
      </div>

      {error ? <ErrorBox title={error.kind === 'timeout' ? 'The search timed out.' : 'Could not load.'}>{error.message}</ErrorBox> : null}
      {loading && !items.length ? <LoadingCard label="Searching…" /> : null}
      {!loading && !error && !items.length ? <span style={{ textAlign: 'center', padding: 24, fontSize: 13, color: 'var(--pa-text-3)' }}>No records match.</span> : null}
      {items.length ? (
        <div style={resultsGrid}>
          {items.map((it) => <AddressCard key={it.id} item={it} />)}
        </div>
      ) : null}
      <LoadMore shown={items.length} total={total} busy={more} onMore={loadMore} />
    </>
  );
}

export default function LandedOwnershipPage() {
  return (
    <AppLayout title="Landed Module" subtitle="Ownership Intelligence">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
        <BackLink href="/tools/ownership">Ownership Intelligence</BackLink>
        <OwnershipGate><PersonalDataNotice /><LandedModule /></OwnershipGate>
      </div>
    </AppLayout>
  );
}
