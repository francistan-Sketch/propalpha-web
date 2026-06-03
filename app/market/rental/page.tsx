'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

interface RentalResult {
  project_name: string;
  postal_district: number;
  avg_rent_psf_monthly: number;
  avg_rent_psf_annual: number;
  avg_sale_psf: number;
  rental_yield_pct: number;
  rental_txns: number;
  sale_txns: number;
}

interface RentalResponse {
  results: RentalResult[];
  month: string;
  is_partial_month: boolean;
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

function yieldColor(pct: number): string {
  if (pct >= 5) return '#34d399';
  if (pct >= 3) return '#fbbf24';
  return 'var(--muted)';
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

export default function RentalYieldPage() {
  const [district, setDistrict] = useState('');
  const [data, setData] = useState<RentalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchData(d: string) {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (d) params.district = d;
      const res = await api.get('/market/rental', { params });
      setData(res.data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Failed to load rental data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData('');
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
              Rental Yield
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
              Top projects by gross rental yield
              {data?.month ? ` — ${data.month}` : ''}
            </p>
          </div>
          <select
            value={district}
            onChange={(e) => handleDistrictChange(e.target.value)}
            style={selectStyle}
          >
            <option value="">All Districts</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={String(d)}>District {d}</option>
            ))}
          </select>
        </div>

        {/* Partial month note */}
        {data?.is_partial_month && (
          <div style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '12px' }}>
            * Data for current month may be incomplete
          </div>
        )}

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
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏠</div>
            <p style={{ color: 'var(--muted)' }}>No rental data available for this selection.</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && data && data.results.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--surface)' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface2)' }}>
                  {['Project', 'District', 'Avg Sale PSF', 'Avg Rent PSF/mo', 'Rental Yield %', 'Txns'].map((h) => (
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
                    <td style={{ ...tdStyle, color: 'var(--muted)' }}>{row.postal_district}</td>
                    <td style={tdStyle}>{formatPSF(row.avg_sale_psf)}</td>
                    <td style={tdStyle}>{formatPSF(row.avg_rent_psf_monthly)}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: yieldColor(row.rental_yield_pct) }}>
                      {formatPct(row.rental_yield_pct)}
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--muted)' }}>{row.rental_txns ?? '—'}</td>
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
