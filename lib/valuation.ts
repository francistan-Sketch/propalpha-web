// Income-approach valuation maths, ported from mobile/src/utils/incomeValuation.js.
// Rates are decimals (0.035 = 3.5%), money is SGD, cash flows are annual (end of year).
// Everything here is pure and runs client-side; no backend call is involved.

export type AssetClass = 'commercial' | 'industrial' | 'residential';
export type NoiMode = 'noi' | 'build';

export const ASSET_CLASSES: { value: AssetClass; label: string }[] = [
  { value: 'commercial', label: 'Commercial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'residential', label: 'Residential' },
];

/** Illustrative starting assumptions per asset class (strings, as they sit in the inputs). Every value is editable. */
export interface Preset {
  cap: string; growth: string; exitCap: string; discount: string;
  vacancy: string; opex: string; saleCost: string; acq: string;
}

export const PRESETS: Record<AssetClass, Preset> = {
  commercial:  { cap: '3.5', growth: '2.0', exitCap: '3.75', discount: '6.0', vacancy: '5', opex: '25', saleCost: '1.0', acq: '3.5' },
  industrial:  { cap: '3.5', growth: '2.0', exitCap: '3.75', discount: '6.0', vacancy: '5', opex: '25', saleCost: '1.0', acq: '3.5' },
  residential: { cap: '3.0', growth: '2.0', exitCap: '3.25', discount: '5.5', vacancy: '4', opex: '20', saleCost: '2.0', acq: '4.0' },
};

/** Default form values (same as the mobile screen on first open: Commercial, NOI 100k, 10-year hold, all equity). */
export interface ValuationForm {
  asset: AssetClass;
  name: string;
  preparedFor: string;
  mode: NoiMode;
  noi: string;
  area: string;
  rent: string;
  other: string;
  vacancy: string;
  opex: string;
  cap: string;
  growth: string;
  years: string;
  exitCap: string;
  discount: string;
  saleCost: string;
  lease: string;
  price: string;
  acq: string;
  financed: boolean;
  ltv: string;
  loanRate: string;
  loanYears: string;
  interestOnly: boolean;
}

export const DEFAULT_FORM: ValuationForm = {
  asset: 'commercial', name: '', preparedFor: '', mode: 'noi', noi: '100k', area: '', rent: '', other: '',
  vacancy: PRESETS.commercial.vacancy, opex: PRESETS.commercial.opex, cap: PRESETS.commercial.cap,
  growth: PRESETS.commercial.growth, years: '10', exitCap: PRESETS.commercial.exitCap, discount: PRESETS.commercial.discount,
  saleCost: PRESETS.commercial.saleCost, lease: '', price: '', acq: PRESETS.commercial.acq,
  financed: false, ltv: '50', loanRate: '3.5', loanYears: '25', interestOnly: false,
};

/** Reload the illustrative assumptions for a class, keeping the user's own figures (NOI, name, price…). */
export function applyPreset(form: ValuationForm, asset: AssetClass): ValuationForm {
  const p = PRESETS[asset];
  return { ...form, asset, cap: p.cap, growth: p.growth, exitCap: p.exitCap, discount: p.discount, vacancy: p.vacancy, opex: p.opex, saleCost: p.saleCost, acq: p.acq };
}

// ─── Parsing ─────────────────────────────────────────────────────────────────

/** "100k", "2.5m", "$100,000" → number; NaN when not a money string. */
export function parseMoney(text: string | number | null | undefined): number {
  if (text == null) return NaN;
  const t = String(text).trim().toLowerCase().replace(/[$,\s]/g, '');
  const m = t.match(/^(-?\d*\.?\d+)([kmb])?$/);
  if (!m) return NaN;
  const mult: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9 };
  return parseFloat(m[1]) * (m[2] ? mult[m[2]] : 1);
}

/** "3.5" or "3.5%" → 0.035; NaN when blank. */
export function parsePct(text: string | number | null | undefined): number {
  const n = parseFloat(String(text ?? '').replace(/[%\s,]/g, ''));
  return isNaN(n) ? NaN : n / 100;
}

// ─── Core maths ──────────────────────────────────────────────────────────────

export interface NoiBuild { gpr: number; otherIncome: number; vacancyLoss: number; egi: number; opex: number; noi: number }

export function buildNoi({ areaSqft, rentPsfPm, otherIncome = 0, vacancy = 0, opexPct = 0 }:
  { areaSqft: number; rentPsfPm: number; otherIncome?: number; vacancy?: number; opexPct?: number }): NoiBuild {
  const gpr = areaSqft * rentPsfPm * 12;
  const vacancyLoss = gpr * vacancy;
  const egi = gpr - vacancyLoss + otherIncome;
  const opex = egi * opexPct;
  return { gpr, otherIncome, vacancyLoss, egi, opex, noi: egi - opex };
}

export function directCap(noi: number, capRate: number): number {
  return capRate > 0 ? noi / capRate : NaN;
}

export function monthlyPayment(loan: number, annualRate: number, years: number, interestOnly = false): number {
  if (loan <= 0) return 0;
  const r = annualRate / 12, n = years * 12;
  if (interestOnly) return loan * r;
  if (r === 0) return loan / n;
  return loan * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function loanBalance(loan: number, annualRate: number, years: number, yearsElapsed: number, interestOnly = false): number {
  if (loan <= 0 || yearsElapsed >= years) return interestOnly && yearsElapsed < years ? loan : 0;
  if (interestOnly) return loan;
  const r = annualRate / 12, n = years * 12, k = yearsElapsed * 12;
  if (r === 0) return loan * (1 - k / n);
  return loan * (Math.pow(1 + r, n) - Math.pow(1 + r, k)) / (Math.pow(1 + r, n) - 1);
}

export function npv(rate: number, cfs: number[]): number {
  return cfs.reduce((s, cf, t) => s + cf / Math.pow(1 + rate, t), 0);
}

/** Bisection IRR; null when the flows have no sign change or no root in (-99%, 1000%). */
export function irr(cfs: number[]): number | null {
  if (!cfs.some((c) => c < 0) || !cfs.some((c) => c > 0)) return null;
  let lo = -0.99, hi = 10;
  let flo = npv(lo, cfs);
  if (flo * npv(hi, cfs) > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2, fm = npv(mid, cfs);
    if (Math.abs(fm) < 1e-9) return mid;
    if (flo * fm < 0) hi = mid; else { lo = mid; flo = fm; }
  }
  return (lo + hi) / 2;
}

export interface HoldingPlan { flowYears: number; reversion: boolean }

/** Years of income and whether a sale happens, given a holding period and remaining land lease (null = freehold/long). */
export function holdingPlan(years: number, remainingLease: number | null): HoldingPlan {
  const lease = remainingLease != null && remainingLease > 0 ? remainingLease : Infinity;
  return lease > years
    ? { flowYears: years, reversion: true }
    : { flowYears: Math.floor(lease), reversion: false };
}

export function projectNoi(noi: number, growth: number, years: number): number[] {
  return Array.from({ length: years }, (_, i) => noi * Math.pow(1 + growth, i));
}

export interface DcfParams {
  noi: number; growth: number; years: number; discount: number; exitCap: number;
  saleCostPct?: number; remainingLease?: number | null;
}

export interface DcfResult extends HoldingPlan {
  value: number; pvIncome: number; pvReversion: number; grossExit: number; netExit: number; flows: number[];
}

export function dcf({ noi, growth, years, discount, exitCap, saleCostPct = 0, remainingLease = null }: DcfParams): DcfResult {
  const plan = holdingPlan(years, remainingLease);
  const flows = projectNoi(noi, growth, plan.flowYears);
  const pvIncome = flows.reduce((s, cf, i) => s + cf / Math.pow(1 + discount, i + 1), 0);
  const grossExit = plan.reversion ? noi * Math.pow(1 + growth, plan.flowYears) / exitCap : 0;
  const netExit = grossExit * (1 - saleCostPct);
  const pvReversion = netExit / Math.pow(1 + discount, plan.flowYears);
  return { value: pvIncome + pvReversion, pvIncome, pvReversion, grossExit, netExit, flows, ...plan };
}

export interface Financing { ltv: number; rate: number; tenure: number; interestOnly: boolean }

export interface LeveredResult {
  loan: number; equity: number; annualDs: number; cfs: number[];
  irr: number | null; multiple: number | null; cashOnCash: number | null; dscr: number | null;
}

export interface InvestmentResult {
  upfront: number; unleveredIrr: number | null; unleveredCfs: number[]; unleveredMultiple: number | null;
  levered?: LeveredResult;
}

export function investment({ price, acqCostPct, flows, netExit, financing = null }:
  { price: number; acqCostPct: number; flows: number[]; netExit: number; financing?: Financing | null }): InvestmentResult {
  const n = flows.length;
  const upfront = price * (1 + acqCostPct);
  const unlevered = [-upfront, ...flows];
  if (n > 0) unlevered[n] += netExit;
  const out: InvestmentResult = {
    upfront, unleveredIrr: irr(unlevered), unleveredCfs: unlevered,
    unleveredMultiple: n ? (flows.reduce((a, b) => a + b, 0) + netExit) / upfront : null,
  };

  if (financing && financing.ltv > 0) {
    const loan = price * financing.ltv;
    const annualDs = 12 * monthlyPayment(loan, financing.rate, financing.tenure, financing.interestOnly);
    const equity = upfront - loan;
    const levered = [-equity];
    for (let t = 1; t <= n; t++) levered.push(flows[t - 1] - (t <= financing.tenure ? annualDs : 0));
    if (n > 0) levered[n] += netExit - loanBalance(loan, financing.rate, financing.tenure, n, financing.interestOnly);
    out.levered = {
      loan, equity, annualDs, cfs: levered,
      irr: irr(levered),
      multiple: n ? levered.slice(1).filter((c) => c > 0).reduce((a, b) => a + b, 0) / equity : null,
      cashOnCash: n ? (flows[0] - annualDs) / equity : null,
      dscr: n && annualDs > 0 ? flows[0] / annualDs : null,
    };
  }
  return out;
}

export interface GridResult { rows: number[]; cols: number[]; cells: (number | null)[][] }

interface IrrGridParams extends DcfParams { price: number; acqCostPct: number }

function irrFor(p: IrrGridParams, exitCap: number, growth: number): number | null {
  const d = dcf({ noi: p.noi, growth, years: p.years, discount: p.discount, exitCap, saleCostPct: p.saleCostPct, remainingLease: p.remainingLease });
  return investment({ price: p.price, acqCostPct: p.acqCostPct, flows: d.flows, netExit: d.netExit }).unleveredIrr;
}

/** Direct cap value as the cap rate (rows, ±25bp steps) and NOI (columns, ±5/10%) move. */
export function capRateGrid({ noi, cap, step = 0.0025, noiSteps = [-0.1, -0.05, 0, 0.05, 0.1] }:
  { noi: number; cap: number; step?: number; noiSteps?: number[] }): GridResult {
  const rows = [-2, -1, 0, 1, 2].map((k) => cap + k * step).filter((r) => r > 0.0005);
  return { rows, cols: noiSteps, cells: rows.map((r) => noiSteps.map((c) => directCap(noi * (1 + c), r))) };
}

/** Unlevered IRR as the exit cap (rows, ±25bp) and NOI growth (columns, ±50bp) move. */
export function irrGrid(p: IrrGridParams, { exitStep = 0.0025, growthStep = 0.005 } = {}): GridResult {
  const rows = [-2, -1, 0, 1, 2].map((k) => p.exitCap + k * exitStep).filter((r) => r > 0.0005);
  const cols = [-2, -1, 0, 1, 2].map((k) => p.growth + k * growthStep);
  return { rows, cols, cells: rows.map((r) => cols.map((g) => irrFor(p, r, g))) };
}

// ─── Whole-model entry point ─────────────────────────────────────────────────

export interface ValuationInputs {
  mode: NoiMode;
  noi: number;
  areaSqft: number;
  rentPsfPm: number;
  otherIncome: number;
  vacancy: number;
  opexPct: number;
  cap: number;
  growth: number;
  years: number;
  exitCap: number;
  discount: number;
  saleCostPct: number;
  remainingLease: number;
  price: number;
  acqCostPct: number;
  financed: boolean;
  ltv: number;
  loanRate: number;
  loanTenure: number;
  interestOnly: boolean;
}

export interface ValuationResult {
  errors: string[];
  warnings: string[];
  noi: number;
  build: NoiBuild | null;
  direct: { value: number; perSqft: number | null };
  years: number;
  remainingLease: number | null;
  growth: number;
  dcf?: DcfResult;
  price?: number;
  priceIsAuto?: boolean;
  priceVsDcf?: number;
  invest?: InvestmentResult;
  reconciled?: number;
  capGrid?: GridResult;
  irrGrid?: GridResult;
}

/** Turn the form strings into numbers (NaN where blank), exactly as the mobile screen does. */
export function toInputs(f: ValuationForm): ValuationInputs {
  return {
    mode: f.mode,
    noi: parseMoney(f.noi),
    areaSqft: parseMoney(f.area),
    rentPsfPm: parseMoney(f.rent),
    otherIncome: parseMoney(f.other),
    vacancy: parsePct(f.vacancy),
    opexPct: parsePct(f.opex),
    cap: parsePct(f.cap),
    growth: parsePct(f.growth),
    years: parseFloat(f.years),
    exitCap: parsePct(f.exitCap),
    discount: parsePct(f.discount),
    saleCostPct: parsePct(f.saleCost),
    remainingLease: parseFloat(f.lease),
    price: parseMoney(f.price),
    acqCostPct: parsePct(f.acq),
    financed: f.financed,
    ltv: parsePct(f.ltv),
    loanRate: parsePct(f.loanRate),
    loanTenure: parseFloat(f.loanYears),
    interestOnly: f.interestOnly,
  };
}

const num = (v: unknown): v is number => typeof v === 'number' && isFinite(v);
const pos = (v: unknown): v is number => num(v) && v > 0;

/** The blocking-error shape; `direct` is absent so a type guard can tell it from a full result. */
export interface ValuationError { errors: string[]; direct?: undefined }

/** Returns `{ errors }` only when an input blocks the valuation; otherwise the full set of results. */
export function computeValuation(i: ValuationInputs): ValuationResult | ValuationError {
  const errors: string[] = [];

  let build: NoiBuild | null = null, noi = i.noi;
  if (i.mode === 'build') {
    if (!pos(i.areaSqft) || !pos(i.rentPsfPm)) errors.push('Enter the area and rent psf to build up NOI.');
    else {
      build = buildNoi({ areaSqft: i.areaSqft, rentPsfPm: i.rentPsfPm, otherIncome: num(i.otherIncome) ? i.otherIncome : 0, vacancy: num(i.vacancy) ? i.vacancy : 0, opexPct: num(i.opexPct) ? i.opexPct : 0 });
      noi = build.noi;
    }
  } else if (!pos(noi)) errors.push('Enter a positive annual NOI.');

  if (!pos(i.cap)) errors.push('Enter a going-in cap rate above 0%.');
  if (errors.length) return { errors };

  const direct = { value: directCap(noi, i.cap), perSqft: pos(i.areaSqft) ? directCap(noi, i.cap) / i.areaSqft : null };
  const years = Math.max(1, Math.min(30, Math.round(num(i.years) ? i.years : 10)));
  const growth = num(i.growth) ? i.growth : 0;
  const remainingLease = pos(i.remainingLease) ? i.remainingLease : null;
  const warnings: string[] = [];
  const hasDcf = pos(i.discount) && pos(i.exitCap);
  if (!hasDcf) warnings.push('Enter a discount rate and exit cap rate for the DCF and IRR.');
  if (remainingLease && remainingLease <= years) warnings.push(`Remaining lease (${remainingLease} yrs) ends within the holding period: income stops at lease end and there is no sale value.`);
  else if (remainingLease) warnings.push('The exit cap rate should reflect the shorter remaining lease at sale.');
  if (hasDcf && i.discount <= growth) warnings.push('Discount rate is not above NOI growth; the DCF is unreliable.');

  const out: ValuationResult = { errors, warnings, noi, build, direct, years, remainingLease, growth };
  if (!hasDcf) return out;

  const params: Required<Omit<DcfParams, 'remainingLease'>> & { remainingLease: number | null } = {
    noi, growth, years, discount: i.discount, exitCap: i.exitCap, saleCostPct: num(i.saleCostPct) ? i.saleCostPct : 0, remainingLease,
  };
  out.dcf = dcf(params);
  const price = pos(i.price) ? i.price : direct.value;
  out.price = price;
  out.priceIsAuto = !pos(i.price);
  out.priceVsDcf = price / out.dcf.value - 1;
  const financing: Financing | null = i.financed && pos(i.ltv) && num(i.loanRate) && pos(i.loanTenure)
    ? { ltv: i.ltv, rate: i.loanRate, tenure: i.loanTenure, interestOnly: !!i.interestOnly } : null;
  const acqCostPct = num(i.acqCostPct) ? i.acqCostPct : 0;
  out.invest = investment({ price, acqCostPct, flows: out.dcf.flows, netExit: out.dcf.netExit, financing });
  out.reconciled = (direct.value + out.dcf.value) / 2;
  out.capGrid = capRateGrid({ noi, cap: i.cap });
  out.irrGrid = irrGrid({ ...params, price, acqCostPct });
  return out;
}

export function isValuationError(r: ValuationResult | ValuationError): r is ValuationError {
  return r.direct === undefined;
}

// ─── Formatting (same rules as the mobile screen) ────────────────────────────

/** $2.857M above a million, else $100,000. */
export function money(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  const r = Math.round(n);
  const sign = r < 0 ? '-' : '';
  const a = Math.abs(r);
  if (a >= 1000000) return `${sign}$${(a / 1000000).toFixed(3)}M`;
  return `${sign}$${a.toLocaleString('en-SG')}`;
}

/** $2.857M → $2.857M, $3.000M → $3M (sensitivity cells). */
export function moneyShort(n: number | null | undefined): string {
  return money(n).replace('.000M', 'M');
}

export function moneyFull(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  const r = Math.round(n);
  return `${r < 0 ? '-' : ''}$${Math.abs(r).toLocaleString('en-SG')}`;
}

export function pct(v: number | null | undefined, d = 2): string {
  return v == null || !isFinite(v) ? 'n/a' : `${(v * 100).toFixed(d)}%`;
}

export function mult(v: number | null | undefined): string {
  return v == null || !isFinite(v) ? 'n/a' : `${v.toFixed(2)}x`;
}
