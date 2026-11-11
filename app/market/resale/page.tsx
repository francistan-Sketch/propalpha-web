'use client';

import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  BackLink, DistrictSelect, EmptyBlock, ErrorBlock, HeadingRow, LoadingRows, PartialMonthNote, Pills, Segmented, TableCard, Toggle,
  cardStyle, dataToLabel, fmtMonth, fmtMonthShort, fmtPct, fmtPsf, noteStyle, pageStyle, tableStyle, tdAmber, tdNum, tdStyle, thRight, thStyle, useMarketQuery,
} from '@/components/app/market/ui';
import { BarChart, HBarList } from '@/components/app/market/BarChart';

// GET /market/resale?district&sort&range[&limit] — the backend serves `range` 1/3/6/12/24 months ending at the
// latest month, `sort` count|psf, and returns `results` (projects over the window) plus `trend` (a monthly
// series of at least 12 months), so every control on this page is live.

interface ResaleResult {
  project_name: string;
  postal_district: number;
  txn_count: number;
  avg_psf: number;
  median_psf: number;
  min_psf: number;
  max_psf: number;
  rental_yield_pct: number | null;
}

interface TrendRow {
  month: string;
  txn_count: number;
  median_psf: number | null;
  avg_psf: number | null;
  median_price: number | null;
}

interface ResaleResponse {
  results: ResaleResult[];
  month: string;
  range: number;
  district: number;
  sort: 'count' | 'psf';
  is_partial_month: boolean;
  window: { start: string; end: string };
  trend: TrendRow[];
}

type SortMode = 'count' | 'psf';
type View = 'projects' | 'chart' | 'monthly';
type Range = 1 | 3 | 6 | 12 | 24;

const PERIODS: { value: Range; label: string }[] = [
  { value: 1, label: '1m' }, { value: 3, label: '3m' }, { value: 6, label: '6m' }, { value: 12, label: '12m' }, { value: 24, label: '2y' },
];
const PERIOD_LABEL: Record<Range, string> = { 1: '1 month', 3: '3 months', 6: '6 months', 12: '12 months', 24: '2 years' };

function fmtPrice(n: number | null): string {
  if (n == null) return '—';
  return n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${Math.round(n / 1e3)}k`;
}

export default function ResaleMarketPage() {
  const [district, setDistrict] = useState('15');
  const [sort, setSort] = useState<SortMode>('count');
  const [range, setRange] = useState<Range>(1);
  const [view, setView] = useState<View>('projects');

  const { data, previous, loading, error, retry } = useMarketQuery<ResaleResponse>(
    '/market/resale', { district, sort, range, limit: range > 1 ? 40 : 20 }, 'Failed to load resale data.',
  );
  const shown = data ?? previous;
  const month = shown?.month;
  const results = data?.results ?? [];
  const trend = data?.trend ?? [];
  const totalTxns = results.reduce((a, r) => a + Number(r.txn_count || 0), 0);

  // Monthly view: oldest → newest for the bars, newest first for the table; change = median psf vs the month before.
  const monthRows = trend.map((r, i) => {
    const prev = i > 0 ? trend[i - 1].median_psf : null;
    const change = r.median_psf != null && prev != null && prev > 0 ? (r.median_psf / prev - 1) * 100 : null;
    return { ...r, change };
  });
  const windowLabel = shown ? (shown.range === 1 ? fmtMonth(shown.month) : `${fmtMonth(shown.window.start)} to ${fmtMonth(shown.window.end)}`) : '';

  return (
    <AppLayout title="Resale Market" subtitle={dataToLabel(month)}>
      <div style={pageStyle}>
        <BackLink />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <Pills ariaLabel="Period" options={PERIODS} value={range} onChange={setRange} />
          <Segmented
            ariaLabel="View"
            options={[{ value: 'projects', label: 'Projects' }, { value: 'chart', label: 'Chart' }, { value: 'monthly', label: 'Monthly' }]}
            value={view} onChange={setView}
          />
        </div>

        <HeadingRow
          title={`District ${district} · Resale`}
          meta={`${PERIOD_LABEL[range]}${view === 'monthly' ? ' · monthly' : month ? ` · to ${fmtMonth(month)}` : ''}`}
        >
          <Toggle ariaLabel="Sort" options={[{ value: 'count', label: 'By Volume' }, { value: 'psf', label: 'By PSF' }]} value={sort} onChange={setSort} />
          <DistrictSelect value={district} onChange={setDistrict} style={{ minWidth: 0 }} />
        </HeadingRow>

        {shown?.is_partial_month && !loading && <PartialMonthNote month={shown.month} />}

        {loading && <LoadingRows />}

        {!loading && error && (
          <ErrorBlock onRetry={retry}>{error}</ErrorBlock>
        )}

        {!loading && !error && data && view !== 'monthly' && results.length === 0 && (
          <EmptyBlock title={`No resale transactions in District ${district} for this period.`} action="Show the past 12 months" onAction={() => setRange(12)}>
            Try a longer period or another district. Only private non-landed resale is counted here.
          </EmptyBlock>
        )}

        {/* Projects table */}
        {!loading && !error && data && view === 'projects' && results.length > 0 && (
          <TableCard footer={`D${district} resale · ${windowLabel} · ${totalTxns.toLocaleString('en-SG')} transactions${range > 1 ? ' · top projects over the period' : ''}. Yield uses rents six months either side of the latest month.`}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Project</th>
                  <th style={thRight}>Txns</th>
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
                    <td style={sort === 'count' ? tdAmber : tdNum}>{row.txn_count ?? '—'}</td>
                    <td style={sort === 'psf' ? tdAmber : tdNum}>{fmtPsf(row.avg_psf)}</td>
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

        {/* Projects chart */}
        {!loading && !error && data && view === 'chart' && results.length > 0 && (
          <div style={{ ...cardStyle, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <strong style={{ fontSize: 14 }}>Top projects {sort === 'count' ? 'by transactions' : 'by average psf'} · {windowLabel}</strong>
            <HBarList
              rows={results.slice(0, 15).map((r, i) => ({
                label: r.project_name,
                value: sort === 'count' ? Number(r.txn_count || 0) : Number(r.avg_psf || 0),
                display: sort === 'count' ? `${r.txn_count}` : fmtPsf(r.avg_psf),
                sub: sort === 'count' ? `${fmtPsf(r.avg_psf)} psf` : `${r.txn_count} txns`,
                highlight: i === 0,
              }))}
            />
            <span style={noteStyle}>{totalTxns.toLocaleString('en-SG')} transactions in the period. Amber marks the leading project.</span>
          </div>
        )}

        {/* Monthly: bars + table */}
        {!loading && !error && data && view === 'monthly' && (
          trend.length === 0 ? (
            <EmptyBlock title={`No monthly series for District ${district}.`}>The backend returned no months for this district.</EmptyBlock>
          ) : (
            <>
              <div style={{ ...cardStyle, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <BarChart
                  bars={monthRows.map((r, i) => ({
                    title: `${fmtMonth(r.month)} · ${r.txn_count} transactions${r.median_psf ? ` · median ${fmtPsf(r.median_psf)} psf` : ''}`,
                    value: sort === 'count' ? r.txn_count : r.median_psf,
                    highlight: i === monthRows.length - 1,
                  }))}
                  startLabel={fmtMonthShort(trend[0].month)}
                  endLabel={fmtMonth(trend[trend.length - 1].month)}
                  note={`${sort === 'count' ? 'Transactions' : 'Median psf'} per month, ${trend.length} months to ${fmtMonth(trend[trend.length - 1].month)}. Amber marks the latest month.`}
                />
              </div>
              <TableCard footer="Change is the median psf against the month before. Months with no sales show no psf.">
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Month</th>
                      <th style={thRight}>Volume</th>
                      <th style={thRight}>Median psf</th>
                      <th style={thRight}>Median price</th>
                      <th style={thRight}>Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...monthRows].reverse().map((r) => (
                      <tr key={r.month} className="pa-row">
                        <td style={tdStyle}>{fmtMonth(r.month)}</td>
                        <td style={r.txn_count ? tdNum : { ...tdNum, color: 'var(--pa-text-3)' }}>{r.txn_count}</td>
                        <td style={r.median_psf ? tdAmber : { ...tdNum, color: 'var(--pa-text-3)' }}>{r.median_psf ? fmtPsf(r.median_psf) : '—'}</td>
                        <td style={r.median_price ? tdNum : { ...tdNum, color: 'var(--pa-text-3)' }}>{fmtPrice(r.median_price)}</td>
                        <td style={{ ...tdNum, fontWeight: 700, color: r.change == null ? 'var(--pa-text-3)' : r.change >= 0 ? 'var(--pa-emerald)' : '#F87171' }}>
                          {r.change == null ? '—' : `${r.change >= 0 ? '+' : '−'}${Math.abs(r.change).toFixed(1)}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableCard>
            </>
          )
        )}

        {!loading && !error && data && <span style={noteStyle}>Private non-landed resale, URA REALIS. Figures are a snapshot of PropAlpha&apos;s transaction database as at the latest release.</span>}
      </div>
    </AppLayout>
  );
}
