'use client';

import AppLayout from '@/components/AppLayout';
import {
  BackLink, EmptyBlock, ErrorBlock, HeadingRow, LoadingRows,
  cardStyle, dataToLabel, fmtMonth, fmtPsf, noteStyle, pageStyle, useMarketQuery,
} from '@/components/app/market/ui';

// GET /market/newlaunch — same call and fields as before; grouped by district client-side as before.

interface NewLaunchResult {
  postal_district: number;
  rank: number;
  project_name: string;
  units_sold: number;
  avg_psf: number;
}

interface NewLaunchResponse {
  results: NewLaunchResult[];
  month: string;
}

interface DistrictGroup {
  district: number;
  projects: NewLaunchResult[];
}

const RANK: Record<number, { bg: string; color: string }> = {
  1: { bg: 'color-mix(in srgb, var(--pa-amber) 18%, transparent)', color: 'var(--pa-amber)' },
  2: { bg: 'rgba(156,163,175,0.18)', color: '#9CA3AF' },
  3: { bg: 'rgba(205,127,50,0.18)', color: '#CD7F32' },
};

export default function NewLaunchPage() {
  const { data, previous, loading, error, retry } = useMarketQuery<NewLaunchResponse>('/market/newlaunch', {}, 'Failed to load new launch data.');
  const shown = data ?? previous;

  const groups: DistrictGroup[] = [];
  if (data?.results) {
    const map = new Map<number, NewLaunchResult[]>();
    for (const row of data.results) {
      if (!map.has(row.postal_district)) map.set(row.postal_district, []);
      map.get(row.postal_district)!.push(row);
    }
    for (const [district, projects] of Array.from(map.entries()).sort((a, b) => a[0] - b[0])) {
      groups.push({ district, projects: projects.sort((a, b) => a.rank - b.rank) });
    }
  }
  const totalUnits = data?.results.reduce((a, r) => a + Number(r.units_sold || 0), 0) ?? 0;

  return (
    <AppLayout title="New Launch at a Glance" subtitle={dataToLabel(shown?.month)}>
      <div style={pageStyle}>
        <BackLink />

        <HeadingRow
          title="Which projects are moving, and where"
          meta={shown?.month ? `${fmtMonth(shown.month)} · top three per district by units sold` : 'top three per district by units sold'}
        />

        {loading && <LoadingRows />}
        {!loading && error && <ErrorBlock onRetry={retry}>{error}</ErrorBlock>}

        {!loading && !error && data && groups.length === 0 && (
          <EmptyBlock title="No new launch sales this month.">Developer sales appear here once URA files the month&apos;s new sale transactions.</EmptyBlock>
        )}

        {!loading && !error && data && groups.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {groups.map(({ district, projects }) => (
              <section key={district} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--pa-amber)', fontWeight: 800 }}>District {district}</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--pa-border)' }} />
                  <span style={{ fontSize: 12, color: 'var(--pa-text-3)' }}>{projects.reduce((a, p) => a + Number(p.units_sold || 0), 0)} units</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                  {projects.slice(0, 3).map((proj) => {
                    const rank = RANK[proj.rank] ?? { bg: 'var(--pa-bg)', color: 'var(--pa-text-3)' };
                    return (
                      <div key={proj.project_name} className="pa-card-h" style={{ ...cardStyle, padding: 18, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 120 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ display: 'inline-grid', placeItems: 'center', width: 28, height: 28, borderRadius: '50%', background: rank.bg, color: rank.color, fontSize: 12, fontWeight: 800, flex: 'none' }}>#{proj.rank}</span>
                          <strong style={{ fontSize: 15, lineHeight: 1.25 }}>{proj.project_name}</strong>
                        </div>
                        <div style={{ display: 'flex', gap: 24 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--pa-text-3)' }}>Units sold</span>
                            <strong style={{ fontSize: 18, color: 'var(--pa-amber)', fontVariantNumeric: 'tabular-nums' }}>{proj.units_sold ?? '—'}</strong>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--pa-text-3)' }}>Avg psf</span>
                            <strong style={{ fontSize: 18, fontVariantNumeric: 'tabular-nums' }}>{fmtPsf(proj.avg_psf)}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
            <span style={noteStyle}>{totalUnits.toLocaleString('en-SG')} developer units sold across {groups.length} districts{shown?.month ? ` in ${fmtMonth(shown.month)}` : ''}. New sale transactions, URA REALIS.</span>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
