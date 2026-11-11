import api from './api';

// Typed fetchers for the backend's /billing endpoints (Stripe Checkout, customer portal and the
// Free-plan search quota). The bearer token and base URL come from lib/api.ts.

export type Interval = 'month' | 'year';
export type PlanName = 'free' | 'plus';

export interface PlanPrice { amount_sgd: number; label: string }

export interface Plans {
  /** False until the Stripe keys are set on the backend; the checkout buttons give way to a contact line. */
  configured: boolean;
  trial_days: number;
  free: { searches_per_month: number };
  plus: { month: PlanPrice; year: PlanPrice; features: string[] };
}

export type SearchQuota = { unlimited: true } | { unlimited: false; used: number; limit: number; resetsOn: string };

export interface BillingStatus {
  plan: PlanName;
  role: string;
  interval: Interval | null;
  status: string | null;
  period_end: string | number | null;
  trial_end: string | number | null;
  cancel_at_period_end: boolean;
  has_subscription: boolean;
  searches: SearchQuota;
}

/** The 402 body GET /search sends when a Free user is over quota. */
export interface QuotaExceeded { error: string; quotaExceeded: true; used: number; limit: number; upgradeUrl?: string }

export async function fetchPlans(): Promise<Plans> {
  const res = await api.get('/billing/plans');
  return res.data as Plans;
}

export async function fetchBillingStatus(): Promise<BillingStatus> {
  const res = await api.get('/billing/status');
  return res.data as BillingStatus;
}

/** Stripe Checkout URL for a new Plus subscription. 409 when already subscribed, 503 when Stripe is not configured. */
export async function createCheckout(interval: Interval): Promise<string> {
  const res = await api.post('/billing/checkout', { interval });
  return String(res.data?.url || '');
}

/** Stripe customer portal URL: card, invoices, cancel, switch plan. */
export async function createPortal(): Promise<string> {
  const res = await api.post('/billing/portal');
  return String(res.data?.url || '');
}

/** Switch the live subscription between monthly and yearly; Stripe prorates the change. */
export async function switchInterval(interval: Interval): Promise<{ ok: boolean; interval: Interval }> {
  const res = await api.post('/billing/switch', { interval });
  return res.data as { ok: boolean; interval: Interval };
}

/** Axios error → HTTP status and the server's message (or a fallback). */
export function billingError(err: unknown, fallback: string): { status?: number; message: string; data?: Record<string, unknown> } {
  const e = err as { response?: { status?: number; data?: { error?: string; message?: string } & Record<string, unknown> }; message?: string };
  const status = e?.response?.status;
  const message = e?.response?.data?.error || e?.response?.data?.message || fallback;
  return { status, message, data: e?.response?.data };
}

/** Parse the `X-Search-Quota: used/limit` header GET /search sends for Free users. */
export function parseQuotaHeader(value: unknown): { used: number; limit: number } | null {
  const m = String(value ?? '').match(/^\s*(\d+)\s*\/\s*(\d+)\s*$/);
  if (!m) return null;
  return { used: parseInt(m[1], 10), limit: parseInt(m[2], 10) };
}

/** "S$38" or "S$288"; cents are shown only when the amount has them. */
export function formatSgd(amount: number | null | undefined): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  const whole = Number.isInteger(n);
  return `S$${n.toLocaleString('en-SG', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })}`;
}

/** "1 Dec 2026" from an ISO string, a unix timestamp in seconds or milliseconds. */
export function formatDate(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  let d: Date;
  if (typeof value === 'number' || /^\d+$/.test(String(value))) {
    const n = Number(value);
    d = new Date(n < 1e12 ? n * 1000 : n);
  } else {
    d = new Date(String(value));
  }
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "Monthly" / "Yearly" for the profile plan card. */
export function intervalLabel(interval: Interval | null | undefined): string {
  return interval === 'year' ? 'Yearly' : interval === 'month' ? 'Monthly' : '';
}
