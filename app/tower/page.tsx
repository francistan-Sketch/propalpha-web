'use client';

import { Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';
import { Spinner } from '@/components/app/States';
import { socratesHref } from '@/components/app/AskSocrates';
import ProjectField from '@/components/app/search/ProjectField';
import TowerGrid, { TowerLegend, fmtInt, fmtMoney, useBlockGrid, towerBlocksToCsv, type TowerBlock, type TowerUnit } from '@/components/app/search/TowerGrid';
import { UnitDetail } from '@/components/app/socrates/cards';
import { PrimaryBtn, GhostBtn, TableSkeleton, TableEmpty, cardSection, cardHead, filterBar, thStyle, tdStyle, fmtDate, describeError, downloadText } from '@/components/app/search/ui';

// Tower View. Project names from GET /search/suggest (ProjectField); the grid from
// GET /newlaunch/units?project= → { blocks: [{ block_id, units_sold, min_floor, max_floor, avg_psf,
// min_psf, max_psf, avg_price, units[] }], summary: { total_transactions, year_from, year_to } }.

interface Summary { total_transactions?: number; year_from?: number; year_to?: number }

function Stat({ label, value, amber }: { label: string; value: string; amber?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 12px', borderRadius: 10, background: 'var(--pa-bg)', border: '1px solid var(--pa-border)', minWidth: 0 }}>
      <span style={{ fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--pa-text-3)', fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 800, color: amber ? 'var(--pa-amber)' : 'var(--pa-text)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
    </div>
  );
}

function BlockPanel({ project, blocks, idx, onIdx, sel, onSel, summary }: { project: string; blocks: TowerBlock[]; idx: number; onIdx: (i: number) => void; sel: { unit: TowerUnit; block: TowerBlock } | null; onSel: (s: { unit: TowerUnit; block: TowerBlock } | null) => void; summary: Summary | null }) {
  const block = blocks[idx];
  const { floors, stacks } = useBlockGrid(block);
  const latest = [...block.units].filter((u) => u.sale_date).sort((a, b) => String(b.sale_date).localeCompare(String(a.sale_date))).slice(0, 12);
  return (
    <section style={cardSection} aria-label="Block summary">
      <div style={cardHead}>
        <strong style={{ fontSize: 14 }}>{block.block_id || 'Block'} · summary</strong>
        {blocks.length > 1 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {blocks.map((b, i) => (
              <button key={b.block_id} type="button" onClick={() => onIdx(i)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid', borderColor: i === idx ? 'var(--pa-primary)' : 'var(--pa-border)', background: i === idx ? 'color-mix(in srgb, var(--pa-primary) 22%, transparent)' : 'transparent', color: i === idx ? 'var(--pa-text)' : 'var(--pa-text-2)', fontSize: 11.5, cursor: 'pointer' }}>{b.block_id}</button>
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="pa-4col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
          <Stat label="Units sold" value={fmtInt(block.units_sold)} />
          <Stat label="Floors" value={`${floors.length}`} />
          <Stat label="Stacks" value={`${stacks.length}`} />
          <Stat label="Avg psf" value={block.avg_psf ? `$${fmtInt(block.avg_psf)}` : '—'} amber />
          <Stat label="Min psf" value={block.min_psf ? `$${fmtInt(block.min_psf)}` : '—'} />
          <Stat label="Max psf" value={block.max_psf ? `$${fmtInt(block.max_psf)}` : '—'} />
          <Stat label="Avg new sale" value={fmtMoney(block.avg_price)} />
          <Stat label="Project txns" value={summary?.total_transactions ? `${fmtInt(summary.total_transactions)}${summary.year_from ? ` · ${summary.year_from}–${summary.year_to}` : ''}` : '—'} />
        </div>
        {sel && <UnitDetail unit={sel.unit} avgPsf={sel.block.avg_psf} onClose={() => onSel(null)} />}
      </div>
      <div style={{ borderTop: '1px solid var(--pa-border)' }}>
        <div style={{ padding: '12px 16px 4px', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--pa-text-3)', fontWeight: 700 }}>Latest transactions</div>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr><th style={thStyle()}>Date</th><th style={thStyle()}>Unit</th><th style={thStyle()}>Type</th><th style={thStyle(true)}>Area sqft</th><th style={thStyle(true)}>Price</th><th style={thStyle(true)}>psf</th></tr>
            </thead>
            <tbody>
              {latest.map((u, i) => (
                <tr key={`${u.unit_no}-${u.sale_date}-${i}`} className="pa-row" onClick={() => onSel({ unit: u, block })} style={{ cursor: 'pointer' }}>
                  <td style={tdStyle({ muted: true, nowrap: true })}>{fmtDate(u.sale_date)}</td>
                  <td style={tdStyle({ nowrap: true })}>{u.unit_no || `#${u.floor}-${u.stack}`}</td>
                  <td style={tdStyle({ muted: true, nowrap: true })}>{u.type_of_sale || '—'}</td>
                  <td style={tdStyle({ right: true })}>{fmtInt(u.area_sqft)}</td>
                  <td style={tdStyle({ right: true, nowrap: true })}>{fmtMoney(u.price)}</td>
                  <td style={tdStyle({ right: true, amber: true, nowrap: true })}>{u.psf ? `$${fmtInt(u.psf)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 14px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <GhostBtn href={`/search?project=${encodeURIComponent(project)}`} style={{ height: 32, fontSize: 12.5 }}>All transactions</GhostBtn>
          <GhostBtn href={socratesHref(`Show me the tower view for ${project}`)} style={{ height: 32, fontSize: 12.5 }}>Ask Socrates</GhostBtn>
          <GhostBtn onClick={() => downloadText(`${project.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-tower.csv`, towerBlocksToCsv(project, blocks))} style={{ height: 32, fontSize: 12.5 }}>Download CSV</GhostBtn>
        </div>
      </div>
    </section>
  );
}

function TowerScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(() => (params.get('project') || '').trim());
  const [project, setProject] = useState('');
  const [blocks, setBlocks] = useState<TowerBlock[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [idx, setIdx] = useState(0);
  const [sel, setSel] = useState<{ unit: TowerUnit; block: TowerBlock } | null>(null);
  const bootRef = useRef(false);

  const load = useCallback(async (name: string) => {
    const n = name.trim();
    if (!n) return;
    setProject(n);
    setLoading(true);
    setError('');
    setSel(null);
    setIdx(0);
    try {
      const res = await api.get('/newlaunch/units', { params: { project: n }, timeout: 30_000 });
      const list = (res.data?.blocks ?? []) as TowerBlock[];
      setBlocks(Array.isArray(list) ? list : []);
      setSummary((res.data?.summary ?? null) as Summary | null);
      window.history.replaceState(null, '', `/tower?project=${encodeURIComponent(n)}`);
    } catch (err) {
      if (describeError(err, '').status === 401) { router.replace('/login?reason=session'); return; }
      setError(describeError(err, 'Could not load the tower view.').message);
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // /tower?project=X (New Launches, Search) loads on mount, from a cancellable timer so the effect body sets no state.
  useEffect(() => {
    const t = setTimeout(() => {
      if (bootRef.current) return;
      bootRef.current = true;
      const p = (params.get('project') || '').trim();
      if (p) load(p);
    }, 0);
    return () => clearTimeout(t);
  }, [params, load]);

  function submit(e: FormEvent) {
    e.preventDefault();
    load(query);
  }

  const block = blocks && blocks.length ? blocks[Math.min(idx, blocks.length - 1)] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <form onSubmit={submit} style={filterBar}>
        <ProjectField value={query} onChange={setQuery} onPick={(name) => load(name)} autoFocus={!params.get('project')} placeholder="Search a project, e.g. The Arden, Lentor Hills…" style={{ flex: 2, minWidth: 220 }} />
        <PrimaryBtn disabled={loading || !query.trim()}>{loading ? <Spinner size={14} light /> : null}Show tower</PrimaryBtn>
      </form>

      <div className="pa-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,.9fr)', gap: 20, alignItems: 'start' }}>
        <section style={{ ...cardSection, padding: 16, gap: 12 }} aria-label="Tower view">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <strong style={{ fontSize: 14 }}>Tower view{project && block ? ` · ${project}` : ''}</strong>
            <TowerLegend />
          </div>

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} aria-busy="true">
              {Array.from({ length: 12 }, (_, i) => <div key={i} className="pa-pulse" style={{ height: 22, borderRadius: 4, background: 'var(--pa-bg)' }} />)}
            </div>
          )}

          {!loading && error && (
            <TableEmpty title="Tower view did not load." action={<GhostBtn onClick={() => load(project)}>Try again</GhostBtn>}>{error}</TableEmpty>
          )}

          {!loading && !error && blocks === null && (
            <TableEmpty title="Search for a project to see its tower.">Stacks across, floors down, coloured by New Sale psf. Resold units are purple.</TableEmpty>
          )}

          {!loading && !error && blocks && blocks.length === 0 && (
            <TableEmpty title={`No tower data for ${project}.`}>PropAlpha has no address-level (block, floor and stack) transactions for this project. Landed and older projects often have none.</TableEmpty>
          )}

          {!loading && !error && blocks && block && (
            <>
              <span style={{ fontSize: 12, color: 'var(--pa-text-2)' }}>{block.block_id} · {fmtInt(block.units_sold)} sold · avg ${fmtInt(block.avg_psf)} psf</span>
              <TowerGrid blocks={blocks} maxHeight={640} blockIndex={idx} onBlockChange={(i) => { setIdx(i); setSel(null); }} onUnitClick={(unit, b) => setSel({ unit, block: b })} selected={sel?.unit ?? null} />
              <span style={{ fontSize: 11.5, color: 'var(--pa-text-3)' }}>Stacks across, floors down. Click a unit for its last transaction. PropAlpha does not track compass facing; colours reflect transacted New Sale psf by position only.</span>
            </>
          )}
        </section>

        {blocks && block && !loading ? (
          <BlockPanel project={project} blocks={blocks} idx={idx} onIdx={(i) => { setIdx(i); setSel(null); }} sel={sel} onSel={setSel} summary={summary} />
        ) : (
          <section style={cardSection} aria-label="Block summary">
            <div style={cardHead}><strong style={{ fontSize: 14 }}>Block summary</strong></div>
            {loading ? <TableSkeleton rows={5} /> : <TableEmpty title="Units sold, psf range and the latest transactions appear here.">Click a unit in the grid for its price, psf, area and date.</TableEmpty>}
          </section>
        )}
      </div>
    </div>
  );
}

export default function TowerPage() {
  return (
    <AppLayout title="Tower View" subtitle="URA data to Oct 2026">
      <Suspense fallback={<TableSkeleton rows={4} />}>
        <TowerScreen />
      </Suspense>
    </AppLayout>
  );
}
