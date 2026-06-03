'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

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

function formatPSF(val: number | undefined): string {
  if (val == null) return '—';
  return '$' + val.toLocaleString('en-SG', { maximumFractionDigits: 0 });
}

const rankBadgeStyle = (rank: number): React.CSSProperties => {
  const colors: Record<number, { bg: string; color: string }> = {
    1: { bg: 'rgba(245,158,11,0.18)', color: '#f59e0b' },
    2: { bg: 'rgba(156,163,175,0.18)', color: '#9ca3af' },
    3: { bg: 'rgba(180,83,9,0.18)', color: '#b45309' },
  };
  const c = colors[rank] ?? { bg: 'var(--surface2)', color: 'var(--muted)' };
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: c.bg,
    color: c.color,
    fontSize: '13px',
    fontWeight: 700,
    flexShrink: 0,
  };
};

export default function NewLaunchPage() {
  const [data, setData] = useState<NewLaunchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/market/newlaunch');
        setData(res.data);
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr?.response?.data?.message || 'Failed to load new launch data.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Group results by postal_district
  const groups: DistrictGroup[] = [];
  if (data?.results) {
    const map = new Map<number, NewLaunchResult[]>();
    for (const row of data.results) {
      if (!map.has(row.postal_district)) map.set(row.postal_district, []);
      map.get(row.postal_district)!.push(row);
    }
    // Sort districts numerically
    const sorted = Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
    for (const [district, projects] of sorted) {
      groups.push({ district, projects: projects.sort((a, b) => a.rank - b.rank) });
    }
  }

  return (
    <AppLayout>
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
              New Launch at a Glance
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
              Top new launch projects by district
            </p>
          </div>
          {data?.month && (
            <span style={{
              padding: '5px 14px',
              borderRadius: '20px',
              backgroundColor: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              fontSize: '12px',
              fontWeight: 600,
            }}>
              {data.month}
            </span>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
            Loading…
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{
            backgroundColor: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#f87171',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && groups.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🚀</div>
            <p style={{ color: 'var(--muted)' }}>No new launch data available.</p>
          </div>
        )}

        {/* District groups */}
        {!loading && !error && groups.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {groups.map(({ district, projects }) => (
              <div key={district}>
                {/* District header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '14px',
                }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--accent)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}>
                    District {district}
                  </span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
                </div>

                {/* Project cards row */}
                <div style={{
                  display: 'flex',
                  gap: '14px',
                  flexWrap: 'wrap',
                }}>
                  {projects.slice(0, 3).map((proj) => (
                    <div
                      key={proj.project_name}
                      style={{
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '18px 20px',
                        minWidth: '200px',
                        flex: '1 1 200px',
                        maxWidth: '320px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        transition: 'border-color 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)'}
                      onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'}
                    >
                      {/* Top row: rank + project name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={rankBadgeStyle(proj.rank)}>#{proj.rank}</span>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--text)',
                          lineHeight: 1.3,
                        }}>
                          {proj.project_name}
                        </span>
                      </div>

                      {/* Stats row */}
                      <div style={{ display: 'flex', gap: '20px' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Units Sold
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)' }}>
                            {proj.units_sold ?? '—'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Avg PSF
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                            {formatPSF(proj.avg_psf)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
