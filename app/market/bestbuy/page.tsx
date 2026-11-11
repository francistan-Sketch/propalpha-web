'use client';

import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  BackLink, EmptyBlock, ErrorBlock, HeadingRow, LoadingRows, Pills, TableCard,
  fmtPct, fmtPsf, pageStyle, tableStyle, tdNum, tdStyle, thRight, thStyle, useMarketQuery,
} from '@/components/app/market/ui';

// GET /market/bestbuy?months — same call and fields as before; only the presentation changed.

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
const PERIODS: { value: PeriodOption; label: string }[] = [{ value: 6, label: '6m' }, { value: 12, label: '12m' }, { value: 24, label: '2y' }];
const RANK_COLORS = ['var(--pa-amber)', '#9CA3AF', '#CD7F32'];

function fmtAsOf(d: string | undefined): string | undefined {
  if (!d) return undefined;
  const t = new Date(d);
  return isNaN(t.getTime()) ? d : t.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BestBuyPage() {
  const [months, setMonths] = useState<PeriodOption>(12);
  const { data, previous, loading, error, retry } = useMarketQuery<BestBuyResponse>('/market/bestbuy', { months }, 'Failed to load best buy data.');
  const shown = data ?? previous;
  const results = data?.results ?? [];
  const asOf = fmtAsOf(shown?.as_of_date);

  return (
    <AppLayout title="Best Buy" subtitle={asOf ? `Rents to ${asOf}` : undefined}>
      <div style={pageStyle}>
        <BackLink />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <Pills ariaLabel="Rental period" options={PERIODS} value={months} onChange={setMonths} />
        </div>

        <HeadingRow
          title="Singapore · Best Buy"
          meta={`top projects by gross rental yield · rents over the past ${data?.period_months ?? months} months`}
        />

        {loading && <LoadingRows />}
        {!loading && error && <ErrorBlock onRetry={retry}>{error}</ErrorBlock>}

        {!loading && !error && data && results.length === 0 && (
          <EmptyBlock title="No ranked projects for this period." action="Show the past 2 years" onAction={() => setMonths(24)}>
            A project needs enough rental contracts and recent sales to be ranked. Try a longer period.
          </EmptyBlock>
        )}

        {!loading && !error && data && results.length > 0 && (
          <TableCard footer="Ranked by gross yield: average rent psf × 12 ÷ average sale psf over the past 24 months of sales. Rents and sales from URA REALIS. Yield is before tax, maintenance and vacancy.">
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Rank</th>
                  <th style={thStyle}>Project</th>
                  <th style={thRight}>District</th>
                  <th style={thRight}>Sale psf</th>
                  <th style={thRight}>Annual rent psf</th>
                  <th style={thRight}>Gross yield</th>
                  <th style={thRight}>Rental txns</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row, i) => (
                  <tr key={`${row.project_name}-${i}`} className="pa-row">
                    <td style={{ ...tdStyle, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      <span style={{ display: 'inline-grid', placeItems: 'center', width: 26, height: 26, borderRadius: 13, border: `1.5px solid ${i < 3 ? RANK_COLORS[i] : 'var(--pa-border)'}`, color: i < 3 ? RANK_COLORS[i] : 'var(--pa-text-3)', fontSize: 11 }}>{i + 1}</span>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600, whiteSpace: 'normal', minWidth: 180 }}>{row.project_name}</td>
                    <td style={{ ...tdNum, color: 'var(--pa-text-2)' }}>D{row.postal_district}</td>
                    <td style={tdNum}>{fmtPsf(row.avg_sale_psf)}</td>
                    <td style={tdNum}>{row.avg_rent_psf_annual != null ? `$${Number(row.avg_rent_psf_annual).toFixed(2)}` : '—'}</td>
                    <td style={{ ...tdNum, color: 'var(--pa-emerald)', fontWeight: 700 }}>{fmtPct(row.rental_yield_pct)}</td>
                    <td style={{ ...tdNum, color: 'var(--pa-text-2)' }}>{row.rental_txns ?? '—'}</td>
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
