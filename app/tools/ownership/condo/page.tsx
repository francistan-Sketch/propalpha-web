'use client';

import { useCallback, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { BackLink } from '@/components/app/market/ui';
import { ErrorBox, LoadingCard } from '@/components/app/States';
import { OwnershipDenied, OwnershipGate, PersonalDataNotice } from '@/components/app/ownership/Gate';
import { OCC, UnitCard } from '@/components/app/ownership/cards';
import { PickerPanel } from '@/components/app/ownership/Picker';
import { usePagedSearch } from '@/components/app/ownership/usePagedSearch';
import { Chips, ClearBtn, CompleteMatch, GREEN, LoadMore, PickBtn, RED, SearchBox, countText, filterCard, legendText, plural, resultsGrid, useDebounced } from '@/components/app/ownership/ui';
import { getCondoDistricts, getCondoProjects, searchOwnership, type CondoItem, type CondoSearchParams, type FlagFilter, type Occupancy } from '@/lib/ownership';

// Condo Intelligence (mobile CondoIntelScreen): one card per unit from the 2016 caveat library. Narrow by
// district -> project, or search like the other modules. OWN STAY: the land line subscriber at the unit is
// the purchaser. TENANTED: a different subscriber at the unit. LIVES ELSEWHERE: the purchaser's own line is
// at another address (unit likely tenanted). Occupancy and the outdated flag are computed server-side.
// GET /landed-owners/condo/search?q&complete=1&flag&occupancy&district&project&page

type OccFilter = 'all' | Occupancy;

function CondoModule() {
  const [q, setQ] = useState('');
  const [complete, setComplete] = useState(false);
  const [flag, setFlag] = useState<FlagFilter>('all');
  const [occ, setOcc] = useState<OccFilter>('all');
  const [district, setDistrict] = useState(0);
  const [project, setProject] = useState('');
  const [picker, setPicker] = useState<'district' | 'project' | null>(null);
  const dq = useDebounced(q);

  const run = useCallback((page: number) => {
    const params: CondoSearchParams = {
      q: dq || undefined, complete: complete ? '1' : undefined, flag: flag === 'all' ? undefined : flag,
      occupancy: occ === 'all' ? undefined : occ, district: district || undefined, project: project || undefined, page,
    };
    return searchOwnership('condo', params);
  }, [dq, complete, flag, occ, district, project]);

  const { items, total, last, loading, more, error, loadMore } = usePagedSearch<CondoItem>(run);
  const asOf = last?.data_as_of || '';

  const loadDistricts = useCallback(async () => {
    const rows = await getCondoDistricts();
    return rows.map((d) => ({ key: String(d.district), label: `D${d.district}`, sub: `${d.projects} ${plural(d.projects, 'project', 'projects')} · ${Number(d.units).toLocaleString('en-SG')} units` }));
  }, []);
  const loadProjects = useCallback(async (text: string) => {
    const rows = await getCondoProjects({ district: district || undefined, q: text || undefined });
    return rows.map((p) => ({ key: p.project, label: p.project, sub: `${p.district ? `D${p.district} · ` : ''}${p.units} units`, current: p.current, outdated: p.outdated }));
  }, [district]);

  if (error?.kind === 'gated') return <OwnershipDenied />;

  return (
    <>
      <div style={filterCard}>
        <SearchBox value={q} onChange={setQ} placeholder="Purchaser, project, unit, postal or number" />
        <CompleteMatch value={complete} onChange={setComplete} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <PickBtn active={!!district} onClick={() => setPicker((p) => (p === 'district' ? null : 'district'))}>{district ? `District ${district}` : 'All districts'}</PickBtn>
          <PickBtn active={!!project} style={{ flex: 1.6 }} onClick={() => setPicker((p) => (p === 'project' ? null : 'project'))}>{project || 'All projects'}</PickBtn>
          {district || project ? <ClearBtn onClick={() => { setDistrict(0); setProject(''); }} /> : null}
        </div>
        {picker === 'district' && (
          <PickerPanel title="Choose a district" searchable={false} load={loadDistricts} empty="No districts."
            onPick={(d) => { setDistrict(Number(d)); setProject(''); setPicker('project'); }} onClose={() => setPicker(null)} />
        )}
        {picker === 'project' && (
          <PickerPanel title={district ? `Projects in District ${district}` : 'Choose a project'} placeholder="Find a project" load={loadProjects} empty="No projects match."
            onPick={(p) => { setProject(p); setPicker(null); }} onClose={() => setPicker(null)} />
        )}
        <Chips ariaLabel="Status" value={flag} onChange={setFlag} options={[
          { value: 'all', label: 'All' }, { value: 'current', label: 'Current', color: GREEN }, { value: 'outdated', label: 'Outdated', color: RED },
        ]} />
        <Chips ariaLabel="Occupancy" value={occ} onChange={setOcc} options={[
          { value: 'all', label: 'Any occupancy' }, { value: 'own_stay', label: 'Own stay', color: OCC.own_stay.color },
          { value: 'tenanted', label: 'Tenanted', color: OCC.tenanted.color }, { value: 'lives_elsewhere', label: 'Owner elsewhere', color: OCC.lives_elsewhere.color },
        ]} />
        <span style={legendText}>Red: sold again more than 90 days after the contract date on file.{asOf ? `  Caveat data to ${asOf}.` : ''}</span>
        <span style={countText} aria-live="polite">{loading ? 'Searching…' : `${total.toLocaleString('en-SG')} ${plural(total, 'unit', 'units')}`}</span>
      </div>

      {error ? <ErrorBox title={error.kind === 'timeout' ? 'The search timed out.' : 'Could not load.'}>{error.message}</ErrorBox> : null}
      {loading && !items.length ? <LoadingCard label="Searching…" /> : null}
      {!loading && !error && !items.length ? <span style={{ textAlign: 'center', padding: 24, fontSize: 13, color: 'var(--pa-text-3)' }}>No units match.</span> : null}
      {items.length ? (
        <div style={resultsGrid}>
          {items.map((it) => <UnitCard key={it.id} item={it} />)}
        </div>
      ) : null}
      <LoadMore shown={items.length} total={total} busy={more} onMore={loadMore} />
    </>
  );
}

export default function CondoOwnershipPage() {
  return (
    <AppLayout title="Condo Intelligence" subtitle="Ownership Intelligence">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
        <BackLink href="/tools/ownership">Ownership Intelligence</BackLink>
        <OwnershipGate><PersonalDataNotice /><CondoModule /></OwnershipGate>
      </div>
    </AppLayout>
  );
}
