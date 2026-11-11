'use client';

import { useCallback, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { BackLink } from '@/components/app/market/ui';
import { EmptyState, ErrorBox } from '@/components/app/States';
import { Field, Select, TableEmpty, TableSkeleton, cardSection, tdStyle, thStyle } from '@/components/app/search/ui';
import { OwnershipDenied, OwnershipGate, PersonalDataNotice } from '@/components/app/ownership/Gate';
import { usePagedSearch } from '@/components/app/ownership/usePagedSearch';
import { Chips, LoadMore, SKY, Toggle, countText, filterCard, plural } from '@/components/app/ownership/ui';
import { getOwnershipLog, type LogEntry, type LogParams, type LogResponse } from '@/lib/ownership';

// Ownership Intelligence access log (mobile LandedLogScreen): who searched what and when. Admins holding the
// grant only; the backend answers 403 for everyone else, and viewing the log is itself logged.
// GET /landed-owners/log?user_id&module&searches=1&page

type ModuleFilter = 'all' | 'street' | 'gcb' | 'condo';

function when(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? String(iso) : d.toLocaleString('en-SG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function describe(it: LogEntry): string {
  const f = it.filters || {};
  const bits: string[] = [];
  if (it.action === 'summary') return 'opened the module';
  if (it.action === 'view') return 'viewed this log';
  if (it.action === 'streets') return `browsed streets${it.query ? ` “${it.query}”` : ''}`;
  if (it.action === 'projects') return `browsed projects${it.query ? ` “${it.query}”` : ''}${f.district ? ` in D${f.district}` : ''}`;
  if (it.query) bits.push(`“${it.query}”`);
  if (f.street) bits.push(f.street);
  if (f.project) bits.push(f.project);
  if (f.district) bits.push(`D${f.district}`);
  if (f.occupancy && f.occupancy !== 'all') bits.push(f.occupancy.replace('_', ' '));
  if (f.who && f.who !== 'all') bits.push(f.who === 'owner' ? 'owners' : 'tenants');
  if (f.flag && f.flag !== 'all') bits.push(f.flag);
  if (f.complete) bits.push('complete match');
  if (f.phoneOnly) bits.push('land line listed');
  if (f.tenantOnly) bits.push('tenanted');
  if (f.page) bits.push(`page ${f.page + 1}`);
  return bits.length ? `searched ${bits.join(' · ')}` : 'listed all';
}

const MODULE_LABEL: Record<string, string> = { gcb: 'GCB', street: 'LANDED', condo: 'CONDO' };
const moduleColor = (m: string) => (m === 'gcb' ? '#A78BFA' : m === 'log' ? 'var(--pa-text-3)' : SKY);

function LogView() {
  const [userId, setUserId] = useState(0);
  const [module, setModule] = useState<ModuleFilter>('all');
  const [searchesOnly, setSearchesOnly] = useState(true);

  const run = useCallback((page: number) => {
    const params: LogParams = { user_id: userId || undefined, module: module === 'all' ? undefined : module, searches: searchesOnly ? '1' : undefined, page };
    return getOwnershipLog(params);
  }, [userId, module, searchesOnly]);

  const { items, total, last, loading, more, error, loadMore } = usePagedSearch<LogEntry, LogResponse>(run, 'Could not load the log.');
  const users = last?.users || [];

  if (error?.kind === 'gated') return <OwnershipDenied />;
  if (error?.kind === 'forbidden') return <EmptyState title="Admin access with the Landed Intelligence grant is required." />;

  return (
    <>
      <div style={{ ...filterCard, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Field label="User" style={{ flex: '1 1 220px', maxWidth: 320 }}>
          <Select value={String(userId)} onChange={(e) => setUserId(Number(e.target.value))}>
            <option value="0">Everyone</option>
            {users.map((u) => <option key={u.id} value={String(u.id)}>{u.name || `User ${u.id}`} ({u.entries})</option>)}
          </Select>
        </Field>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', minWidth: 0 }}>
          <Chips ariaLabel="Module" value={module} onChange={setModule} options={[
            { value: 'all', label: 'All modules' }, { value: 'street', label: 'Landed' }, { value: 'gcb', label: 'GCB' }, { value: 'condo', label: 'Condo' },
          ]} />
          <Toggle label="Searches only" value={searchesOnly} onChange={setSearchesOnly} />
        </div>
        <span style={{ ...countText, flexBasis: '100%' }} aria-live="polite">{loading ? 'Loading…' : `${total.toLocaleString('en-SG')} ${plural(total, 'entry', 'entries')}`}</span>
      </div>

      {error ? <ErrorBox title="Could not load the log.">{error.message}</ErrorBox> : null}

      <div style={cardSection}>
        {loading && !items.length ? <TableSkeleton rows={8} /> : !items.length ? (
          error ? null : <TableEmpty title="No entries." />
        ) : (
          <div style={{ overflowX: 'auto', minWidth: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 640 }}>
              <thead>
                <tr>
                  <th style={thStyle()}>When</th>
                  <th style={thStyle()}>User</th>
                  <th style={thStyle()}>Module</th>
                  <th style={thStyle()}>Activity</th>
                  <th style={thStyle(true)}>Shown</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td style={tdStyle({ muted: true, nowrap: true })}>{when(it.at)}</td>
                    <td style={{ ...tdStyle({ nowrap: true }), fontWeight: 700, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.user_name || it.user_email}</td>
                    <td style={tdStyle({ nowrap: true })}><span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.08em', color: moduleColor(it.module) }}>{MODULE_LABEL[it.module] || 'LOG'}</span></td>
                    <td style={{ ...tdStyle({ muted: true }), minWidth: 240 }}>{describe(it)}</td>
                    <td style={tdStyle({ right: true, muted: true, nowrap: true })}>{it.action === 'search' || it.action === 'streets' ? `${it.result_count ?? 0} shown` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <LoadMore shown={items.length} total={total} busy={more} onMore={loadMore} />
    </>
  );
}

export default function OwnershipLogPage() {
  return (
    <AppLayout title="Access log" subtitle="Ownership Intelligence">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
        <BackLink href="/tools/ownership">Ownership Intelligence</BackLink>
        <OwnershipGate><PersonalDataNotice /><LogView /></OwnershipGate>
      </div>
    </AppLayout>
  );
}
