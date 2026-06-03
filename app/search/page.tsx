'use client';

import { useState, FormEvent } from 'react';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

interface Transaction {
  address?: string;
  area?: number | string;
  price?: number | string;
  psf?: number | string;
  contractDate?: string;
  propertyType?: string;
  tenure?: string;
  [key: string]: unknown;
}

const DISTRICTS = Array.from({ length: 28 }, (_, i) => i + 1);
const PROPERTY_TYPES = ['All', 'HDB', 'Condo', 'Landed'];
const PAGE_SIZE = 20;

function formatNum(val: number | string | undefined, prefix = ''): string {
  if (val === undefined || val === null || val === '') return '—';
  const n = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(n)) return String(val);
  return prefix + n.toLocaleString('en-SG', { maximumFractionDigits: 0 });
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [district, setDistrict] = useState('');
  const [propType, setPropType] = useState('All');
  const [fromYear, setFromYear] = useState('');
  const [toYear, setToYear] = useState('');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPage(1);
    setSearched(true);
    try {
      const params: Record<string, string> = {};
      if (query) params.q = query;
      if (district) params.district = district;
      if (propType && propType !== 'All') params.type = propType;
      if (fromYear) params.from = fromYear;
      if (toYear) params.to = toYear;

      const res = await api.get('/search', { params });
      const data = res.data;
      const txns: Transaction[] = Array.isArray(data)
        ? data
        : data.transactions || data.results || data.data || [];
      setTransactions(txns);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Search failed. Please try again.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(transactions.length / PAGE_SIZE);
  const paginated = transactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface2)',
    color: 'var(--text)',
    fontSize: '14px',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    color: 'var(--muted)',
    fontSize: '12px',
    marginBottom: '5px',
    fontWeight: 500 as const,
  };

  return (
    <AppLayout>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
          Transaction Search
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>
          Search Singapore property transactions
        </p>

        {/* Search form */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <form onSubmit={handleSearch}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '14px',
              marginBottom: '16px',
            }}>
              <div>
                <label style={labelStyle}>Project / Address</label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Clementi"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>District</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">All Districts</option>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={String(d)}>District {d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Property Type</label>
                <select
                  value={propType}
                  onChange={(e) => setPropType(e.target.value)}
                  style={inputStyle}
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>From Year</label>
                <input
                  type="number"
                  value={fromYear}
                  onChange={(e) => setFromYear(e.target.value)}
                  placeholder="2020"
                  min="1990"
                  max="2030"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>To Year</label>
                <input
                  type="number"
                  value={toYear}
                  onChange={(e) => setToYear(e.target.value)}
                  placeholder="2024"
                  min="1990"
                  max="2030"
                  style={inputStyle}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '11px 28px',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: loading ? 'var(--border)' : 'var(--accent)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Searching…' : '🔍 Search'}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#f87171',
            fontSize: '13px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
            Searching transactions…
          </div>
        )}

        {/* Results */}
        {!loading && searched && transactions.length === 0 && !error && (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
            <p style={{ color: 'var(--muted)' }}>No transactions found. Try different search terms.</p>
          </div>
        )}

        {!loading && transactions.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ color: 'var(--muted)', fontSize: '13px' }}>
                {transactions.length.toLocaleString()} results · Page {page} of {totalPages}
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                    {['Address', 'Area (sqft)', 'Price (SGD)', 'PSF', 'Date', 'Type', 'Tenure'].map((h) => (
                      <th key={h} style={{
                        padding: '10px 14px',
                        textAlign: 'left',
                        color: 'var(--muted)',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((tx, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: i % 2 === 0 ? 'var(--surface)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '10px 14px', color: 'var(--text)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(tx.address as string) || '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text)' }}>
                        {formatNum(tx.area as number | string)}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--green)', fontWeight: 600 }}>
                        {formatNum(tx.price as number | string, '$')}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text)' }}>
                        {formatNum(tx.psf as number | string, '$')}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                        {(tx.contractDate as string) || '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--muted)' }}>
                        {(tx.propertyType as string) || '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--muted)' }}>
                        {(tx.tenure as string) || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)', color: page === 1 ? 'var(--border)' : 'var(--text)',
                    cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '13px',
                  }}
                >
                  ← Prev
                </button>

                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let p: number;
                  if (totalPages <= 7) p = i + 1;
                  else if (page <= 4) p = i + 1;
                  else if (page >= totalPages - 3) p = totalPages - 6 + i;
                  else p = page - 3 + i;
                  return p;
                }).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      padding: '8px 12px', borderRadius: '8px',
                      border: p === page ? 'none' : '1px solid var(--border)',
                      backgroundColor: p === page ? 'var(--accent)' : 'var(--surface)',
                      color: p === page ? '#fff' : 'var(--text)',
                      cursor: 'pointer', fontSize: '13px', fontWeight: p === page ? 600 : 400,
                    }}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)', color: page === totalPages ? 'var(--border)' : 'var(--text)',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '13px',
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
