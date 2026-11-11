'use client';

import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  BackLink, DistrictSelect, EmptyBlock, ErrorBlock, HeadingRow, LoadingRows, PartialMonthNote, TableCard,
  dataToLabel, fmtMonth, fmtPct, fmtPsf, pageStyle, tableStyle, tdNum, tdStyle, thRight, thStyle, useMarketQuery,
} from '@/components/app/market/ui';

// GET /market/rental[?district] — same call and fields as before; only the presentation changed.

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

function yieldColor(pct: number | null | undefined): string {
  if (pct == null) return 'var(--pa-text-3)';
  if (pct >= 5) return 'var(--pa-emerald)';
  if (pct >= 3) return 'var(--pa-amber)';
  return 'var(--pa-text-2)';
}

export default function RentalYieldPage() {
  const [district, setDistrict] = useState('');
  const { data, previous, loading, error, retry } = useMarketQuery<RentalResponse>('/market/rental', { district }, 'Failed to load rental data.');
  const shown = data ?? previous;
  const results = data?.results ?? [];

  return (
    <AppLayout title="Rental Yield" subtitle={dataToLabel(shown?.month)}>
      <div style={pageStyle}>
        <BackLink />

        <HeadingRow
          title={district ? `District ${district} · Rental yield` : 'All districts · Rental yield'}
          meta={shown?.month ? `${fmtMonth(shown.month)} · top projects by gross yield` : 'top projects by gross yield'}
        >
          <DistrictSelect value={district} onChange={setDistrict} allowAll style={{ minWidth: 0 }} />
        </HeadingRow>

        {shown?.is_partial_month && !loading && <PartialMonthNote month={shown.month} />}

        {loading && <LoadingRows />}
        {!loading && error && <ErrorBlock onRetry={retry}>{error}</ErrorBlock>}

        {!loading && !error && data && results.length === 0 && (
          <EmptyBlock title="No rental data for this selection." action="Show all districts" onAction={() => setDistrict('')}>
            Rental contracts are matched to sales in the same project; a district with few of either shows nothing.
          </EmptyBlock>
        )}

        {!loading && !error && data && results.length > 0 && (
          <TableCard footer="Gross yield = average monthly rent psf × 12 ÷ average sale psf. Rents and sales from URA REALIS; yield colour: emerald 5%+, amber 3 to 5%.">
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Project</th>
                  <th style={thRight}>District</th>
                  <th style={thRight}>Avg sale psf</th>
                  <th style={thRight}>Avg rent psf / mth</th>
                  <th style={thRight}>Gross yield</th>
                  <th style={thRight}>Rental txns</th>
                  <th style={thRight}>Sale txns</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row, i) => (
                  <tr key={`${row.project_name}-${i}`} className="pa-row">
                    <td style={{ ...tdStyle, color: i < 3 ? 'var(--pa-amber)' : 'var(--pa-text-3)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, whiteSpace: 'normal', minWidth: 180 }}>{row.project_name}</td>
                    <td style={{ ...tdNum, color: 'var(--pa-text-2)' }}>D{row.postal_district}</td>
                    <td style={tdNum}>{fmtPsf(row.avg_sale_psf)}</td>
                    <td style={tdNum}>{row.avg_rent_psf_monthly != null ? `$${Number(row.avg_rent_psf_monthly).toFixed(2)}` : '—'}</td>
                    <td style={{ ...tdNum, color: yieldColor(row.rental_yield_pct), fontWeight: 700 }}>{fmtPct(row.rental_yield_pct)}</td>
                    <td style={{ ...tdNum, color: 'var(--pa-text-2)' }}>{row.rental_txns ?? '—'}</td>
                    <td style={{ ...tdNum, color: 'var(--pa-text-2)' }}>{row.sale_txns ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        )}
      </div>
    </AppLayout>
  );
}
