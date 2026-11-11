// Unit-style checks for lib/valuation.ts against the figures on the Income Valuation screenshot
// (public/site/shots/ipad13-08.png): Commercial defaults, NOI $100,000, cap 3.5%, 10-year hold.
//
//   npx tsx scripts/check-valuation.ts
//   node --experimental-strip-types scripts/check-valuation.ts   (Node 22.6+; no tsx needed)
//
// The module is loaded through a URL so the file type-checks under the project tsconfig
// (which does not allow `.ts` import specifiers) and still runs directly in Node.

type Valuation = typeof import('../lib/valuation');
const v: Valuation = await import(new URL('../lib/valuation.ts', import.meta.url).href);

const { DEFAULT_FORM, toInputs, computeValuation, isValuationError, money, moneyShort, pct, mult } = v;

let failed = 0;
function check(label: string, actual: string, expected: string) {
  const ok = actual === expected;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(58)} ${actual}${ok ? '' : `   (expected ${expected})`}`);
}

const res = computeValuation(toInputs(DEFAULT_FORM));
if (isValuationError(res)) throw new Error('Default inputs should not error: ' + res.errors.join('; '));
if (!res.dcf || !res.invest || !res.capGrid || !res.irrGrid || res.reconciled == null) throw new Error('DCF block missing');

// Headline cards
check('Direct cap value (NOI $100,000 / 3.5%)', money(res.direct.value), '$2.857M');
check('DCF value (g 2%, 10y, r 6%, exit 3.75%, sale 1%)', money(res.dcf.value), '$2.595M');
check('Reconciled value (average)', money(res.reconciled), '$2.726M');
check('Unlevered IRR', pct(res.invest.unleveredIrr), '4.40%');
check('Equity multiple', mult(res.invest.unleveredMultiple), '1.46x');
check('Total outlay (price + 3.5% acquisition costs)', money(res.invest.upfront), '$2.957M');
check('Price vs DCF', `${Math.abs((res.priceVsDcf ?? 0) * 100).toFixed(1)}% ${(res.priceVsDcf ?? 0) >= 0 ? 'above' : 'below'}`, '10.1% above');

// Sensitivity · value, row 3.50% (base row), columns -10% … +10%
const capRow = res.capGrid.rows.findIndex((r) => Math.abs(r - 0.035) < 1e-9);
check('Sensitivity value row 3.50%', res.capGrid.cells[capRow].map(moneyShort).join(' / '), '$2.571M / $2.714M / $2.857M / $3M / $3.143M');

// Sensitivity · IRR, row 3.75% (base exit cap), growth 1.0% … 3.0%
const exitRow = res.irrGrid.rows.findIndex((r) => Math.abs(r - 0.0375) < 1e-9);
check('Sensitivity IRR row 3.75%', res.irrGrid.cells[exitRow].map((x) => pct(x, 1)).join(' / '), '3.4% / 3.9% / 4.4% / 4.9% / 5.4%');

// Cash flows: year 0 outlay, year 1 NOI, final year includes the net sale proceeds
check('Cash flow year 0', money(res.invest.unleveredCfs[0]), '-$2.957M');
check('Cash flow year 1 (NOI)', money(res.dcf.flows[0]), '$100,000');
check('Cash flow year 10 (NOI + net sale)', money(res.invest.unleveredCfs[10]), '$3.338M');

// Residential preset swaps the illustrative assumptions (cap 3.0 / exit 3.25 / discount 5.5 / acq 4.0)
const resi = computeValuation(toInputs(v.applyPreset(DEFAULT_FORM, 'residential')));
if (isValuationError(resi) || !resi.invest) throw new Error('Residential preset should compute');
check('Residential preset direct cap (NOI $100,000 / 3.0%)', money(resi.direct.value), '$3.333M');
check('Residential preset total outlay (+4.0%)', money(resi.invest.upfront), '$3.467M');

// Error path
const bad = computeValuation(toInputs({ ...DEFAULT_FORM, noi: '' }));
check('Blank NOI reports an error', isValuationError(bad) ? bad.errors[0] : 'no error', 'Enter a positive annual NOI.');

console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed');
if (failed) process.exit(1);
