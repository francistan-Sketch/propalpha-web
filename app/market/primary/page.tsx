'use client';

import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  BackLink, DistrictSelect, EmptyBlock, ErrorBlock, HeadingRow, LoadingRows, TableCard,
  dataToLabel, fmtMonth, fmtPct, fmtPsf, pageStyle, tableStyle, tdAmber, tdNum, tdStyle, thRight, thStyle, useMarketQuery,
} from '@/components/app/market/ui';

// GET /market/primary?district — same call and fields as before; only the presentation changed.

interface PrimaryResult {
  project_name: string;
  postal_district: number;
  units_sold: number;
  avg_psf: number;
  median_psf: number;
  min_psf: number;
  max_psf: number;
  rental_yield_pct: number | null;
}

interface PrimaryResponse {
  results: PrimaryResult[];
  month: string;
  district: number;
}

export default function PrimarySalesPage() {
  const [district, setDistrict] = useState('1');
  const { data, previous, loading, error, retry } = useMarketQuery<PrimaryResponse>('/market/primary', { district }, 'Failed to load primary sales data.');
  const shown = data ?? previous;
  const results = data?.results ?? [];
  const totalUnits = results.reduce((a, r) => a + Number(r.units_sold || 0), 0);

  return (
    <AppLayout title="Primary Sales" subtitle={dataToLabel(shown?.month)}>
      <div style={pageStyle}>
        <BackLink />

        <HeadingRow
          title={`District ${district} · Primary sales`}
          meta={shown?.month ? `${fmtMonth(shown.month)} · developer sales by project` : 'developer sales by project'}
        >
          <DistrictSelect value={district} onChange={setDistrict} style={{ minWidth: 0 }} />
        </HeadingRow>

        {loading && <LoadingRows />}
        {!loading && error && <ErrorBlock onRetry={retry}>{error}</ErrorBlock>}

        {!loading && !error && data && results.length === 0 && (
          <EmptyBlock title={`No developer sales in District ${district} this month.`} action="Try District 15" onAction={() => setDistrict('15')}>
            New sale transactions are filed by URA as developers lodge them; a district with no active launch shows nothing.
          </EmptyBlock>
        )}

        {!loading && !error && data && results.length > 0 && (
          <TableCard footer={`${totalUnits.toLocaleString('en-SG')} units sold by developers in D${district}${shown?.month ? ` in ${fmtMonth(shown.month)}` : ''}. New sale transactions, URA REALIS. Yield uses rents in the same project where available.`}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Project</th>
                  <th style={thRight}>Units sold</th>
                  <th style={thRight}>Avg psf</th>
                  <th style={thRight}>Median psf</th>
                  <th style={thRight}>Min psf</th>
                  <th style={thRight}>Max psf</th>
                  <th style={thRight}>Yield</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row, i) => (
                  <tr key={`${row.project_name}-${i}`} className="pa-row">
                    <td style={{ ...tdStyle, color: i < 3 ? 'var(--pa-amber)' : 'var(--pa-text-3)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, whiteSpace: 'normal', minWidth: 180 }}>{row.project_name}</td>
                    <td style={tdAmber}>{row.units_sold ?? '—'}</td>
                    <td style={tdNum}>{fmtPsf(row.avg_psf)}</td>
                    <td style={tdNum}>{fmtPsf(row.median_psf)}</td>
                    <td style={{ ...tdNum, color: 'var(--pa-text-2)' }}>{fmtPsf(row.min_psf)}</td>
                    <td style={{ ...tdNum, color: 'var(--pa-text-2)' }}>{fmtPsf(row.max_psf)}</td>
                    <td style={{ ...tdNum, color: row.rental_yield_pct != null ? 'var(--pa-emerald)' : 'var(--pa-text-3)', fontWeight: 600 }}>{fmtPct(row.rental_yield_pct, 1)}</td>
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
