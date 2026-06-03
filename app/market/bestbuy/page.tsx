'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

interface BestBuyResult {
  project_name: string;
  postal_district: number;
  avg_rent_psf_monthly: number;
  avg_rent_psf_annual: number;
  avg_sale_psf: number;
  rental_yield_pct: number;
  rental_txns: number;
}

interface BestBuyResponse {
  results: BestBuyResult[];
  period_months: number;
  as_of_date: string;
}

type PeriodOption = 6 | 12 | 24;
const PERIOD_OPTIONS: PeriodOption[] = [6, 12, 24];

function formatPSF(val: number | undefined): string {
  if (val == null) return '—';
  return '$' + val.toLocaleString('en-SG', { maximumFractionDigits: 0 });
}

function formatPct(val: number | undefined): string {
  if (val == null) return '—';
  return val.toFixed(2) + '%';
}

const rankAccent: Record<number, string> = {
  0: '#f59e0b', // gold
  1: '#9ca3af', // silver
  2: '#b45309', // bronze
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

const toggleBase = {
  padding: '7px 16px',
  borderRadius: '7px',
  border: 'none',
  fontSize: '13px',
  fontWeight: 600 as const,
  cursor: 'pointer' as const,
  transition: 'background 0.15s, color 0.15s',
};

export default function BestBuyPage() {
  const [months, setMonths] = useState<PeriodOption>(12);
  const [data, setData] = useState<BestBuyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchData(m: PeriodOption) {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/market/bestbuy', { params: { months: m } });
      setData(res.data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Failed to load best buy data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData(12);
  }, []);

  function handleMonthsChange(m: PeriodOption) {
    setMonths(m);
    fetchData(m);
  }

  return (
    <AppLayout>
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
              Best Buy · Investment
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
              Top yield projects over last {data?.period_months ?? months} months
            </p>
          </div>

          {/* Period selector */}
          <div style={{
            display: 'flex',
            gap: '2px',
            backgroundColor: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: '9px',
            padding: '3px',
          }}>
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p}
                onClick={() => handleMonthsChange(p)}
                style={{
                  ...toggleBase,
                  backgroundColor: months === p ? 'var(--accent)' : 'transparent',
                  color: months === p ? '#fff' : 'var(--muted)',
                }}
              >
                {p}m
              </button>
            ))}
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
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>💡</div>
            <p style={{ color: 'var(--muted)' }}>No investment data available for this period.</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && data && data.results.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--surface)' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface2)' }}>
                  {['Rank', 'Project', 'District', 'Sale PSF', 'Annual Rent PSF', 'Yield %', 'Txns'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.results.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      transition: 'background 0.1s',
                      borderLeft: i < 3 ? `3px solid ${rankAccent[i]}` : '3px solid transparent',
                    }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'var(--surface2)'}
                    onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'}
                  >
                    <td style={{ ...tdStyle, fontWeight: 700, color: i < 3 ? rankAccent[i] : 'var(--muted)' }}>
                      #{i + 1}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{row.project_name}</td>
                    <td style={{ ...tdStyle, color: 'var(--muted)' }}>{row.postal_district}</td>
                    <td style={tdStyle}>{formatPSF(row.avg_sale_psf)}</td>
                    <td style={tdStyle}>{formatPSF(row.avg_rent_psf_annual)}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#34d399' }}>
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
