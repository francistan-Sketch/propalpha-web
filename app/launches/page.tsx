'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';
import { socratesHref } from '@/components/app/AskSocrates';
import { DISTRICTS, Field, Select, Input, Chip, GhostBtn, TableSkeleton, TableEmpty, cardSection, cardHead, filterBar, footnote, thStyle, tdStyle, toDistrict, describeError } from '@/components/app/search/ui';

// New Launches. GET /newlaunch/projects?district= → { projects: string[] } (projects with New Sale
// transactions in the last three years). Older object-shaped rows are still accepted.

interface Project {
  id?: string | number; name?: string; projectName?: string; district?: string | number; units?: number | string; totalUnits?: number | string;
  launchDate?: string; launch_date?: string; [key: string]: unknown;
}

function normalise(data: unknown): Project[] {
  const d = data as { projects?: unknown; results?: unknown; data?: unknown };
  const list = Array.isArray(data) ? data : d?.projects || d?.results || d?.data || [];
  if (!Array.isArray(list)) return [];
  return list.map((p: string | Project) => (typeof p === 'string' ? { name: p } : p));
}

const getName = (p: Project) => String(p.name || p.projectName || 'Unnamed project');
const getUnits = (p: Project) => p.units ?? p.totalUnits;
const getDate = (p: Project) => p.launchDate || p.launch_date || '';

export default function LaunchesPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [district, setDistrict] = useState('');
  const [q, setQ] = useState('');
  const [view, setView] = useState<'cards' | 'table'>('cards');

  const load = useCallback(async (d: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/newlaunch/projects', { params: d ? { district: d } : {}, timeout: 15_000 });
      setProjects(normalise(res.data));
    } catch (err) {
      if (describeError(err, '').status === 401) { router.replace('/login?reason=session'); return; }
      setError(describeError(err, 'Failed to load new launches.').message);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Fetch on mount and whenever the district changes (from a cancellable timer so the effect body sets no state).
  useEffect(() => {
    const t = setTimeout(() => load(district), 0);
    return () => clearTimeout(t);
  }, [district, load]);

  const needle = q.trim().toLowerCase();
  const filtered = projects.filter((p) => (!needle || getName(p).toLowerCase().includes(needle)) && (!district || !p.district || String(p.district).replace(/^D0*/i, '') === district));
  const districtLabel = district ? `D${String(parseInt(district, 10)).padStart(2, '0')}` : '';

  return (
    <AppLayout title="New Launches" subtitle="URA data to Oct 2026">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={filterBar}>
          <Field label="District" style={{ flex: 0, minWidth: 160 }}>
            <Select value={district} onChange={(e) => setDistrict(e.target.value)}>
              <option value="">All districts</option>
              {DISTRICTS.map((d) => <option key={d} value={String(d)}>D{String(d).padStart(2, '0')}</option>)}
            </Select>
          </Field>
          <Field label="Project" style={{ flex: 2, minWidth: 200 }}>
            <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name" />
          </Field>
          <div style={{ alignSelf: 'flex-end', display: 'flex', gap: 6, height: 38, alignItems: 'center' }}>
            <Chip active={view === 'cards'} onClick={() => setView('cards')}>Cards</Chip>
            <Chip active={view === 'table'} onClick={() => setView('table')}>Table</Chip>
          </div>
        </div>

        <section style={cardSection} aria-label="New launch projects">
          <div style={cardHead}>
            <strong style={{ fontSize: 14 }}>New launches{districtLabel ? ` · ${districtLabel}` : ''}</strong>
            {!loading && !error && <span style={{ fontSize: 11.5, color: 'var(--pa-text-3)' }}>{filtered.length} project{filtered.length === 1 ? '' : 's'} with developer sales in the last 3 years</span>}
          </div>

          {loading && <TableSkeleton rows={6} />}

          {!loading && error && (
            <TableEmpty title="New launches did not load." action={<GhostBtn onClick={() => load(district)}>Try again</GhostBtn>}>{error}</TableEmpty>
          )}

          {!loading && !error && filtered.length === 0 && (
            <TableEmpty title={districtLabel ? `No new launches in ${districtLabel}.` : 'No new launches match.'} action={(district || q) ? <GhostBtn onClick={() => { setDistrict(''); setQ(''); }}>Clear filters</GhostBtn> : undefined}>
              Projects appear here once they have New Sale transactions in URA data.
            </TableEmpty>
          )}

          {!loading && !error && filtered.length > 0 && view === 'cards' && (
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {filtered.map((p, i) => {
                const name = getName(p);
                const d = toDistrict(p.district) || districtLabel;
                return (
                  <Link key={String(p.id ?? name) + i} href={`/tower?project=${encodeURIComponent(name)}`} className="pa-card-h" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 18, borderRadius: 16, border: '1px solid var(--pa-border)', background: 'var(--pa-bg)', color: 'var(--pa-text)', minHeight: 132 }}>
                    <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--pa-amber)', fontWeight: 800 }}>New launch</span>
                      {d && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'color-mix(in srgb, var(--pa-primary) 22%, transparent)', color: 'var(--pa-text-2)' }}>{d}</span>}
                    </span>
                    <strong style={{ fontSize: 16, lineHeight: 1.25 }}>{name}</strong>
                    <span style={{ fontSize: 12.5, color: 'var(--pa-text-2)' }}>
                      {getUnits(p) ? `${getUnits(p)} units` : 'Developer sales on record'}{getDate(p) ? ` · ${getDate(p)}` : ''}
                    </span>
                    <span style={{ marginTop: 'auto', display: 'flex', gap: 12, fontSize: 12.5, color: 'var(--pa-text-2)', fontWeight: 600 }}>
                      <span>Tower view →</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {!loading && !error && filtered.length > 0 && view === 'table' && (
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead>
                  <tr><th style={thStyle()}>Project</th><th style={thStyle()}>District</th><th style={thStyle(true)}>Units</th><th style={thStyle(true)}>Open</th></tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => {
                    const name = getName(p);
                    return (
                      <tr key={String(p.id ?? name) + i} className="pa-row">
                        <td style={tdStyle()}>{name}</td>
                        <td style={tdStyle({ muted: true, nowrap: true })}>{toDistrict(p.district) || districtLabel || '—'}</td>
                        <td style={tdStyle({ right: true })}>{getUnits(p) ? String(getUnits(p)) : '—'}</td>
                        <td style={{ ...tdStyle({ right: true, nowrap: true }), display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                          <Link href={`/tower?project=${encodeURIComponent(name)}`} className="pa-link" style={{ fontSize: 12.5, fontWeight: 600 }}>Tower</Link>
                          <Link href={`/search?project=${encodeURIComponent(name)}`} className="pa-link" style={{ fontSize: 12.5, fontWeight: 600 }}>Transactions</Link>
                          <Link href={socratesHref(`Show me the tower view for ${name}`)} className="pa-link" style={{ fontSize: 12.5, fontWeight: 600 }}>Socrates</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && <span style={footnote}>Projects with New Sale transactions in URA data over the last three years. A snapshot as at the latest URA release.</span>}
        </section>
      </div>
    </AppLayout>
  );
}
