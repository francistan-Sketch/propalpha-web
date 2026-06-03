'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

interface PrimaryResult {
  project_name: string;
  postal_district: number;
  units_sold: number;
  avg_psf: number;
  median_psf: number;
  min_psf: number;
  max_psf: number;
  rental_yield_pct: number;
}

interface PrimaryResponse {
  results: PrimaryResult[];
  month: string;
  district: number;
}

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

export default function PrimarySalesPage() {
  const [district, setDistrict] = useState('1');
  const [data, setData] = useState<PrimaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchData(d: string) {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/market/primary', { params: { district: d } });
      setData(res.data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Failed to load primary sales data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData('1');
  }, []);

  function handleDistrictChange(val: string) {
    setDistrict(val);
    fetchData(val);
  }

  return (
    <AppLayout>
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
              Primary Sales
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
              Developer sales by district — new unit transactions
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {data?.month && (
              <span style={{
                padding: '5px 12px',
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
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏗️</div>
            <p style={{ color: 'var(--muted)' }}>No primary sales data for District {district}.</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && data && data.results.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--surface)' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface2)' }}>
                  {['Project', 'Units Sold', 'Avg PSF', 'Median PSF', 'Min PSF', 'Max PSF', 'Yield %'].map((h) => (
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
                    <td style={{ ...tdStyle, color: 'var(--accent)', fontWeight: 600 }}>{row.units_sold ?? '—'}</td>
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
