'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

interface ResaleResult {
  project_name: string;
  postal_district: number;
  txn_count: number;
  avg_psf: number;
  median_psf: number;
  min_psf: number;
  max_psf: number;
  rental_yield_pct: number;
}

interface ResaleResponse {
  results: ResaleResult[];
  month: string;
  district: number;
}

type SortMode = 'count' | 'psf';

const DISTRICTS = Array.from({ length: 28 }, (_, i) => i + 1);

function formatPSF(val: number | undefined): string {
  if (val == null) return '—';
  return '$' + val.toLocaleString('en-SG', { maximumFractionDigits: 0 });
}

function formatPct(val: number | undefined): string {
  if (val == null) return '—';
  return val.toFixed(2) + '%';
}

const selectStyle = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  backgroundColor: 'var(--surface2)',
  color: 'var(--text)',
  fontSize: '14px',
  outline: 'none',
  cursor: 'pointer',
};

const thStyle = {
  padding: '10px 14px',
  textAlign: 'left' as const,
  color: 'var(--muted)',
  fontSize: '12px',
  fontWeight: 600 as const,
  textTransform: 'uppercase' as const,
  whiteSpace: 'nowrap' as const,
  borderBottom: '1px solid var(--border)',
};

const tdStyle = {
  padding: '11px 14px',
  color: 'var(--text)',
  fontSize: '14px',
  borderBottom: '1px solid var(--border)',
};

export default function ResaleMarketPage() {
  const [district, setDistrict] = useState('1');
  const [sort, setSort] = useState<SortMode>('count');
  const [data, setData] = useState<ResaleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchData(d: string, s: SortMode) {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/market/resale', { params: { district: d, sort: s } });
      setData(res.data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Failed to load resale data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData('1', 'count');
  }, []);

  function handleDistrictChange(val: string) {
    setDistrict(val);
    fetchData(val, sort);
  }

  function handleSortChange(val: SortMode) {
    setSort(val);
    fetchData(district, val);
  }

  const toggleBase = {
    padding: '7px 16px',
    borderRadius: '7px',
    border: 'none',
    fontSize: '13px',
    fontWeight: 600 as const,
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
  };

  return (
    <AppLayout>
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
              Resale Market
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
              Resale transaction trends and price analysis
              {data?.month ? ` — ${data.month}` : ''}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Sort toggle */}
            <div style={{
              display: 'flex',
              gap: '2px',
              backgroundColor: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '9px',
              padding: '3px',
            }}>
              <button
                onClick={() => handleSortChange('count')}
                style={{
                  ...toggleBase,
                  backgroundColor: sort === 'count' ? 'var(--accent)' : 'transparent',
                  color: sort === 'count' ? '#fff' : 'var(--muted)',
                }}
              >
                By Volume
              </button>
              <button
                onClick={() => handleSortChange('psf')}
                style={{
                  ...toggleBase,
                  backgroundColor: sort === 'psf' ? 'var(--accent)' : 'transparent',
                  color: sort === 'psf' ? '#fff' : 'var(--muted)',
                }}
              >
                By PSF
              </button>
            </div>

            <select
              value={district}
              onChange={(e) => handleDistrictChange(e.target.value)}
              style={selectStyle}
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={String(d)}>District {d}</option>
              ))}
            </select>
          </div>
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
        {!loading && !error && data?.results.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔄</div>
            <p style={{ color: 'var(--muted)' }}>No resale data for District {district}.</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && data && data.results.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--surface)' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface2)' }}>
                  {['Project', 'Txns', 'Avg PSF', 'Median PSF', 'Min PSF', 'Max PSF', 'Yield %'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.results.map((row, i) => (
                  <tr
                    key={i}
                    style={{ transition: 'background 0.1s' }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'var(--surface2)'}
                    onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'}
                  >
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{row.project_name}</td>
                    <td style={{ ...tdStyle, color: 'var(--accent)', fontWeight: 600 }}>{row.txn_count ?? '—'}</td>
                    <td style={tdStyle}>{formatPSF(row.avg_psf)}</td>
                    <td style={tdStyle}>{formatPSF(row.median_psf)}</td>
                    <td style={{ ...tdStyle, color: 'var(--muted)' }}>{formatPSF(row.min_psf)}</td>
                    <td style={{ ...tdStyle, color: 'var(--muted)' }}>{formatPSF(row.max_psf)}</td>
                    <td style={{ ...tdStyle, color: 'var(--muted)' }}>{formatPct(row.rental_yield_pct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
