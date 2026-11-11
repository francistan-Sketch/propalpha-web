'use client';

import { Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';
import { Spinner } from '@/components/app/States';
import { socratesHref } from '@/components/app/AskSocrates';
import ProjectField from '@/components/app/search/ProjectField';
import TowerGrid, { TowerLegend, fmtInt, type TowerBlock, type TowerUnit } from '@/components/app/search/TowerGrid';
import { UnitDetail } from '@/components/app/socrates/cards';
import { DISTRICTS, Field, Select, PrimaryBtn, GhostBtn, TableSkeleton, TableEmpty, cardSection, cardHead, filterBar, footnote, thStyle, tdStyle, fmtDate, unitFromAddress, toDistrict, describeError } from '@/components/app/search/ui';

// Transaction search. GET /search (query/district/category/dateFrom/dateTo/page, with the page's
// older q/type/from/to names sent alongside) and GET /search/suggest through ProjectField. When a
// project is named, the tower view beside the table comes from GET /newlaunch/units.

interface Transaction {
  project_name?: string; address?: string; street_name?: string; area_sqft?: number | string; transacted_price?: number | string; monthly_rent?: number | string;
  unit_price_psf?: number | string; sale_date?: string; lease_date?: string; txn_date?: string; property_type?: string; tenure?: string; type_of_sale?: string;
  postal_district?: number | string; floor_level?: string;
  // older field names the page used to read
  area?: number | string; price?: number | string; psf?: number | string; contractDate?: string; propertyType?: string;
  [key: string]: unknown;
}

const CATEGORIES: [string, string][] = [
  ['', 'All categories'], ['resi_strata', 'Private · Condo / Apt'], ['resi_landed', 'Private · Landed'], ['commercial', 'Commercial · All'],
  ['office', 'Office'], ['retail', 'Retail'], ['shophouse', 'Shophouse'], ['factory', 'Factory'], ['warehouse', 'Warehouse'], ['business_park', 'Business park'],
];
const DATE_PRESETS: [string, string][] = [['', 'Latest 30'], ['3m', 'Last 3 months'], ['6m', 'Last 6 months'], ['12m', 'Last 12 months'], ['24m', 'Last 2 years'], ['60m', 'Last 5 years']];
const PSF_BANDS: [string, string][] = [['', 'Any'], ['0-1500', 'Under $1,500'], ['1500-2000', '$1,500 – $2,000'], ['2000-2500', '$2,000 – $2,500'], ['2500-3000', '$2,500 – $3,000'], ['3000-', '$3,000 and up']];
const PAGE_SIZE = 20;

function iso(d: Date): string { return d.toISOString().slice(0, 10); }
function presetRange(key: string): { from: string; to: string } {
  const m = parseInt(key, 10);
  if (!Number.isFinite(m)) return { from: '', to: '' };
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - m);
  return { from: iso(from), to: iso(to) };
}
const psfOf = (t: Transaction) => { const v = t.unit_price_psf ?? t.psf; const n = typeof v === 'string' ? parseFloat(v) : v; return typeof n === 'number' && Number.isFinite(n) ? n : null; };
const inBand = (psf: number | null, band: string) => {
  if (!band) return true;
  if (psf === null) return false;
  const [lo, hi] = band.split('-').map((x) => (x === '' ? null : parseFloat(x)));
  return (lo === null || psf >= lo) && (hi === null || psf < hi);
};

function SearchScreen() {
  const router = useRouter();
  const params = useSearchParams();

  // Deep links: /search?project=X (New Launches) and /search?district=15 seed the filters.
  const [project, setProject] = useState(() => (params.get('project') || params.get('q') || '').trim());
  const [district, setDistrict] = useState(() => (params.get('district') || '').replace(/^D0*/i, ''));
  const [category, setCategory] = useState('');
  const [datePreset, setDatePreset] = useState('');
  const [psfBand, setPsfBand] = useState('');
  const [txnType, setTxnType] = useState<'sale' | 'rental'>('sale');

  const [rows, setRows] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [serverPage, setServerPage] = useState(1);
  const [serverPages, setServerPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [searchedProject, setSearchedProject] = useState('');

  const [blocks, setBlocks] = useState<TowerBlock[] | null>(null);
  const [towerLoading, setTowerLoading] = useState(false);
  const [towerError, setTowerError] = useState('');
  const [sel, setSel] = useState<{ unit: TowerUnit; block: TowerBlock } | null>(null);
  const bootRef = useRef(false);

  const onAuth = useCallback((err: unknown) => {
    if (describeError(err, '').status === 401) { router.replace('/login?reason=session'); return true; }
    return false;
  }, [router]);

  const runSearch = useCallback(async (f: { project: string; district: string; category: string; datePreset: string; txnType: string }, pageNo = 1) => {
    setLoading(true);
    setError('');
    setPage(1);
    setSearched(true);
    setSearchedProject(f.project.trim());
    try {
      const { from, to } = presetRange(f.datePreset);
      const p: Record<string, string> = {};
      if (f.project.trim()) { p.q = f.project.trim(); p.query = f.project.trim(); }
      if (f.district) p.district = f.district;
      if (f.category) { p.type = f.category; p.category = f.category; }
      if (from) { p.from = from; p.dateFrom = from; }
      if (to) { p.to = to; p.dateTo = to; }
      p.txnType = f.txnType;
      if (pageNo > 1) p.page = String(pageNo);
      const res = await api.get('/search', { params: p, timeout: 30_000 });
      const data = res.data;
      const list: Transaction[] = Array.isArray(data) ? data : data.transactions || data.results || data.data || [];
      setRows(list);
      setTotal(typeof data?.total === 'number' ? data.total : list.length);
      setServerPage(typeof data?.page === 'number' ? data.page : 1);
      setServerPages(typeof data?.pages === 'number' && data.pages > 0 ? data.pages : 1);
    } catch (err) {
      if (onAuth(err)) return;
      setError(describeError(err, 'Search failed. Please try again.').message);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [onAuth]);

  const loadTower = useCallback(async (name: string) => {
    setSel(null);
    if (!name.trim()) { setBlocks(null); setTowerError(''); return; }
    setTowerLoading(true);
    setTowerError('');
    try {
      const res = await api.get('/newlaunch/units', { params: { project: name.trim() }, timeout: 30_000 });
      const list = (res.data?.blocks ?? []) as TowerBlock[];
      setBlocks(Array.isArray(list) ? list : []);
    } catch (err) {
      if (onAuth(err)) return;
      setTowerError(describeError(err, 'Could not load the tower view.').message);
      setBlocks([]);
    } finally {
      setTowerLoading(false);
    }
  }, [onAuth]);

  // Run the deep-linked search once on mount (from a cancellable timer so the effect body sets no state).
  useEffect(() => {
    const t = setTimeout(() => {
      if (bootRef.current) return;
      bootRef.current = true;
      const p = (params.get('project') || params.get('q') || '').trim();
      const d = (params.get('district') || '').replace(/^D0*/i, '');
      if (p || d) {
        runSearch({ project: p, district: d, category: '', datePreset: '', txnType: 'sale' });
        if (p) loadTower(p);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [params, runSearch, loadTower]);

  function submit(e: FormEvent) {
    e.preventDefault();
    runSearch({ project, district, category, datePreset, txnType });
    loadTower(project);
  }
  function clearFilters() {
    setProject(''); setDistrict(''); setCategory(''); setDatePreset(''); setPsfBand(''); setTxnType('sale');
    setRows([]); setSearched(false); setBlocks(null); setError('');
  }

  const filtered = psfBand ? rows.filter((t) => inBand(psfOf(t), psfBand)) : rows;
  const useServerPaging = serverPages > 1;
  const totalPages = useServerPaging ? serverPages : Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = useServerPaging ? filtered : filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const curPage = useServerPaging ? serverPage : page;
  const isRental = txnType === 'rental';

  function goPage(n: number) {
    if (useServerPaging) runSearch({ project, district, category, datePreset, txnType }, n);
    else setPage(n);
  }

  const activeBlock = blocks?.length ? blocks[0] : null;
  const unitLabel = (t: Transaction) => unitFromAddress(t.address) || (t.floor_level ? String(t.floor_level) : '') || '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <form onSubmit={submit} style={filterBar}>
        <Field label="District">
          <Select value={district} onChange={(e) => setDistrict(e.target.value)}>
            <option value="">All districts</option>
            {DISTRICTS.map((d) => <option key={d} value={String(d)}>D{String(d).padStart(2, '0')}</option>)}
          </Select>
        </Field>
        <ProjectField value={project} onChange={setProject} style={{ flex: 1.4, minWidth: 180 }} />
        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
        <Field label="Date">
          <Select value={datePreset} onChange={(e) => setDatePreset(e.target.value)}>
            {DATE_PRESETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
        <Field label="psf" style={{ minWidth: 130 }}>
          <Select value={psfBand} onChange={(e) => { setPsfBand(e.target.value); setPage(1); }}>
            {PSF_BANDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
        <Field label="Type" style={{ flex: 0, minWidth: 110 }}>
          <Select value={txnType} onChange={(e) => setTxnType(e.target.value as 'sale' | 'rental')}>
            <option value="sale">Sale</option>
            <option value="rental">Rental</option>
          </Select>
        </Field>
        <PrimaryBtn disabled={loading}>{loading ? <Spinner size={14} light /> : null}Search</PrimaryBtn>
      </form>

      <div className="pa-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,.9fr)', gap: 20, alignItems: 'start' }}>
        {/* Results */}
        <section style={cardSection} aria-label="Transactions">
          <div style={cardHead}>
            <strong style={{ fontSize: 14 }}>Transactions{searchedProject ? ` · ${searchedProject}` : district ? ` · D${String(parseInt(district, 10)).padStart(2, '0')}` : ''}</strong>
            {searched && !loading && !error && (
              <span style={{ fontSize: 11.5, color: 'var(--pa-text-3)' }}>
                {total.toLocaleString('en-SG')} result{total === 1 ? '' : 's'}{psfBand ? ` · ${filtered.length} in psf band` : ''}{totalPages > 1 ? ` · page ${curPage} of ${totalPages}` : ''}
              </span>
            )}
          </div>

          {loading && <TableSkeleton rows={6} />}

          {!loading && error && (
            <TableEmpty title="Search did not complete." action={<GhostBtn onClick={() => runSearch({ project, district, category, datePreset, txnType })}>Try again</GhostBtn>}>{error}</TableEmpty>
          )}

          {!loading && !error && !searched && (
            <TableEmpty title="Search Singapore property transactions.">Pick a district or a project, then Search. Latest 30 are shown unless you set a date range.</TableEmpty>
          )}

          {!loading && !error && searched && filtered.length === 0 && (
            <TableEmpty title="No transactions match these filters." action={<GhostBtn onClick={clearFilters}>Clear filters</GhostBtn>}>
              Widen the date range or clear the psf band. Private, HDB and landed are searched separately.
            </TableEmpty>
          )}

          {!loading && !error && filtered.length > 0 && (
            <>
              <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                  <thead>
                    <tr>
                      <th style={thStyle()}>Date</th>
                      <th style={thStyle()}>Project</th>
                      <th style={thStyle()}>Unit</th>
                      <th style={thStyle(true)}>Area sqft</th>
                      <th style={thStyle(true)}>{isRental ? 'Rent / mo' : 'Price'}</th>
                      <th style={thStyle(true)}>psf</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((t, i) => {
                      const price = isRental ? (t.monthly_rent ?? t.price) : (t.transacted_price ?? t.price);
                      const psf = psfOf(t);
                      const name = t.project_name || t.address || t.street_name || '—';
                      return (
                        <tr key={`${t.address || name}-${i}`} className="pa-row">
                          <td style={tdStyle({ muted: true, nowrap: true })}>{fmtDate(t.txn_date || t.sale_date || t.lease_date || t.contractDate)}</td>
                          <td style={tdStyle()}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 140 }}>
                              <span>{name}</span>
                              <span style={{ fontSize: 11.5, color: 'var(--pa-text-3)' }}>
                                {[toDistrict(t.postal_district), t.property_type || t.propertyType, t.tenure, t.type_of_sale].filter(Boolean).join(' · ')}
                              </span>
                            </div>
                          </td>
                          <td style={tdStyle({ nowrap: true })}>{unitLabel(t)}</td>
                          <td style={tdStyle({ right: true })}>{fmtInt(t.area_sqft ?? t.area)}</td>
                          <td style={tdStyle({ right: true, nowrap: true })}>{price === undefined || price === null ? '—' : `$${fmtInt(price as number | string)}`}</td>
                          <td style={tdStyle({ right: true, amber: true, nowrap: true })}>{psf === null ? '—' : `$${fmtInt(psf)}`}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={footnote}>A snapshot of PropAlpha&apos;s transaction database as at the latest URA release.</span>
                {totalPages > 1 && (
                  <div style={{ display: 'flex', gap: 6, padding: '8px 14px', alignItems: 'center' }}>
                    <GhostBtn onClick={() => goPage(Math.max(1, curPage - 1))} style={{ height: 30, padding: '0 10px', fontSize: 12.5, opacity: curPage === 1 ? 0.45 : 1 }}>Prev</GhostBtn>
                    <span style={{ fontSize: 12, color: 'var(--pa-text-2)', fontVariantNumeric: 'tabular-nums' }}>{curPage} / {totalPages}</span>
                    <GhostBtn onClick={() => goPage(Math.min(totalPages, curPage + 1))} style={{ height: 30, padding: '0 10px', fontSize: 12.5, opacity: curPage === totalPages ? 0.45 : 1 }}>Next</GhostBtn>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* Tower view */}
        <section style={{ ...cardSection, padding: 16, gap: 12 }} aria-label="Tower view">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <strong style={{ fontSize: 14 }}>Tower view{searchedProject && blocks?.length ? ` · ${searchedProject}` : ''}</strong>
            <TowerLegend />
          </div>

          {towerLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} aria-busy="true">
              {Array.from({ length: 8 }, (_, i) => <div key={i} className="pa-pulse" style={{ height: 22, borderRadius: 4, background: 'var(--pa-bg)' }} />)}
            </div>
          )}

          {!towerLoading && towerError && <span style={{ fontSize: 13, color: '#F87171' }}>{towerError}</span>}

          {!towerLoading && !towerError && blocks === null && (
            <div style={{ padding: '32px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
              <strong style={{ fontSize: 15 }}>Name a project to see its tower view.</strong>
              <span style={{ fontSize: 13, color: 'var(--pa-text-2)', maxWidth: 320 }}>Pick a project in the filter bar and Search. Stacks across, floors down, coloured by New Sale psf.</span>
              <Link href="/tower" className="pa-link" style={{ fontSize: 13, color: 'var(--pa-text-2)', marginTop: 4 }}>Open Tower View →</Link>
            </div>
          )}

          {!towerLoading && !towerError && blocks && blocks.length === 0 && (
            <span style={{ fontSize: 13, color: 'var(--pa-text-2)' }}>No address-level (block, floor and stack) data for {searchedProject || 'this project'}.</span>
          )}

          {!towerLoading && blocks && blocks.length > 0 && (
            <>
              {activeBlock && (
                <span style={{ fontSize: 12, color: 'var(--pa-text-2)' }}>
                  {blocks.length} block{blocks.length === 1 ? '' : 's'} · {fmtInt(blocks.reduce((n, b) => n + (Number(b.units_sold) || 0), 0))} units sold · avg ${fmtInt(activeBlock.avg_psf)} psf
                </span>
              )}
              <TowerGrid blocks={blocks} maxHeight={520} onUnitClick={(unit, block) => setSel({ unit, block })} selected={sel?.unit ?? null} onBlockChange={() => setSel(null)} />
              {sel && <UnitDetail unit={sel.unit} avgPsf={sel.block.avg_psf} onClose={() => setSel(null)} />}
              <span style={{ fontSize: 11.5, color: 'var(--pa-text-3)' }}>Stacks across, floors down. Click a unit for its last transaction.</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <GhostBtn href={`/tower?project=${encodeURIComponent(searchedProject)}`} style={{ height: 32, fontSize: 12.5 }}>Full tower view</GhostBtn>
                <GhostBtn href={socratesHref(`Show me the tower view for ${searchedProject}`)} style={{ height: 32, fontSize: 12.5 }}>Ask Socrates</GhostBtn>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <AppLayout title="Search" subtitle="URA data to Oct 2026">
      <Suspense fallback={<TableSkeleton rows={4} />}>
        <SearchScreen />
      </Suspense>
    </AppLayout>
  );
}
