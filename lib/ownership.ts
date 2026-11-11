import api from '@/lib/api';

// Ownership Intelligence API (backend/routes/landedOwners.js). Every route needs the `landed_owners` grant:
// without it the backend answers 403 { featureGated: true, feature: 'landed_owners' }. Every call is written
// to the backend's access log. There is deliberately no export or bulk endpoint.
//
// Modules: 'street' (Landed), 'gcb' (GCB register), 'condo' (Condo Intelligence). Pages are 50 rows
// (PAGE_SIZE) and `page` is zero-based. Searches can take a while on a wide query, so they carry a long
// client timeout; the pages show a plain timeout message when it trips.

export type OwnershipModule = 'street' | 'gcb' | 'condo';
export type Flag = 'current' | 'outdated';
export type FlagFilter = 'all' | Flag;

export const SEARCH_TIMEOUT_MS = 120_000;
const QUICK_TIMEOUT_MS = 30_000;

// ── Summaries ──────────────────────────────────────────────────────────────────
export interface StreetSummary { total: number; with_phone: number; outdated: number; current: number; streets: number; outdated_since: string; data_as_of: string }
export interface GcbSummary { total: number; properties: number; outdated: number; current: number; with_phone: number; with_tenant: number; outdated_since: string; data_as_of: string }
export interface CondoSummary { records: number; total: number; projects: number; districts: number; outdated: number; current: number; outdated_since: string; data_as_of: string }

export async function getOwnershipSummary(module: 'street'): Promise<StreetSummary>;
export async function getOwnershipSummary(module: 'gcb'): Promise<GcbSummary>;
export async function getOwnershipSummary(module: 'condo'): Promise<CondoSummary>;
export async function getOwnershipSummary(module: OwnershipModule): Promise<StreetSummary | GcbSummary | CondoSummary> {
  const res = await api.get(`/landed-owners/${module}/summary`, { timeout: QUICK_TIMEOUT_MS });
  return res.data;
}

// ── Shared shapes ──────────────────────────────────────────────────────────────
/** A PropAlpha sale on record for the address or unit, newest first. */
export interface Transaction {
  date: string;
  price: number | string | null;
  area_sqft: number | string | null;
  psf: number | string | null;
  property_type?: string | null;
  type_of_sale?: string | null;
  tenure?: string | null;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  outdated_since?: string;
  data_as_of?: string;
}

// ── Landed (street directory) ──────────────────────────────────────────────────
// Every name on file is an owner; `phone` is set when that owner has a listed land line (the source's
// 'Subscriber' status). `hit` marks the owner the name search found.
export interface StreetOwner { name: string | null; phone: string | null; hit: boolean }
export interface StreetItem {
  id: string;
  street: string;
  house_no: string;
  postal_code: string | null;
  last_sale_date: string | null;
  last_sale_price: number | string | null;
  flag: Flag;
  owners: StreetOwner[];
  transactions: Transaction[];
}
export interface StreetSearchParams {
  q?: string;
  flag?: Flag;
  /** '1' = only addresses with a land line listed. */
  phone?: '1';
  street?: string;
  /** '1' = whole-word matching; otherwise every typed word may appear anywhere in a field. */
  complete?: '1';
  page: number;
}
export interface StreetRow { street: string; rows: number; outdated: number; current: number }

export async function getLandedStreets(q?: string): Promise<StreetRow[]> {
  const res = await api.get('/landed-owners/street/streets', { params: { q: q || undefined }, timeout: QUICK_TIMEOUT_MS });
  return res.data.streets ?? [];
}

// ── GCB register ───────────────────────────────────────────────────────────────
// One record per sale (serial_no). Owners are the purchasers; `staying` means the land line subscriber at the
// bungalow has the owner's name (the number is then the owner's). A subscriber with a different name is a
// tenant (`via: 'landline'`); the register's own tenants are `via: 'register'`. `tenanted` = any tenant exists.
export interface GcbOwner { name: string | null; home_address: string | null; home_phone: string | null; staying: boolean }
export interface GcbTenant { name: string | null; phone: string | null; via: 'landline' | 'register' }
export interface GcbItem {
  id: number | string;
  serial_no: number | string;
  property_address: string;
  postal_code: string | null;
  land_area_sqm: number | string | null;
  land_area_sqft: number | string | null;
  amount: number | string | null;
  contract_date: string | null;
  last_sale_date: string | null;
  last_sale_price: number | string | null;
  flag: Flag;
  owners: GcbOwner[];
  tenants: GcbTenant[];
  tenanted: boolean;
  transactions: Transaction[];
}
export type GcbWho = 'all' | 'owner' | 'tenant';
export interface GcbSearchParams {
  q?: string;
  who?: 'owner' | 'tenant';
  flag?: Flag;
  /** '1' = tenanted bungalows only. */
  tenant?: '1';
  complete?: '1';
  page: number;
}

// ── Condo Intelligence ─────────────────────────────────────────────────────────
// One card per unit from the caveat library, its records newest first. Occupancy (computed server-side from
// the latest record): own_stay = the land line subscriber at the unit is the purchaser; tenanted = a different
// subscriber at the unit; lives_elsewhere = the purchaser's own line is at another address.
export type Occupancy = 'own_stay' | 'tenanted' | 'lives_elsewhere' | 'unknown';
export interface CondoRecord {
  contract_date: string | null;
  amount: number | string | null;
  area_sqm: number | string | null;
  purchasers: string[] | null;
  purchaser_address: string | null;
  purchaser_at_unit: boolean | null;
  unit_subscriber: string | null;
  unit_tel: string | null;
  home_subscriber: string | null;
  home_tel: string | null;
  occupancy: Occupancy | null;
  mobiles: string[] | null;
  remarks: string | null;
  file_date: string | null;
}
export interface CondoContact {
  name: string | null;
  mobile: string | null;
  home_phone: string | null;
  email: string | null;
  asking: string | null;
  source: 'listing' | 'contacts' | string;
}
export interface CondoItem {
  id: string;
  unit_key: string;
  project: string;
  district: number | null;
  blk: string | null;
  street: string | null;
  unit: string;
  postal_code: string | null;
  last_sale_date: string | null;
  last_sale_price: number | string | null;
  flag: Flag;
  records: CondoRecord[];
  contacts: CondoContact[];
  occupancy: Occupancy;
  /** Purchaser names the search hit. */
  hits: string[];
  transactions: Transaction[];
}
export interface CondoSearchParams {
  q?: string;
  complete?: '1';
  flag?: Flag;
  occupancy?: Occupancy;
  district?: number;
  project?: string;
  page: number;
}
export interface CondoDistrict { district: number; projects: number; units: number }
export interface CondoProject { project: string; district: number | null; units: number; outdated: number; current: number }

export async function getCondoDistricts(): Promise<CondoDistrict[]> {
  const res = await api.get('/landed-owners/condo/districts', { timeout: QUICK_TIMEOUT_MS });
  return res.data.districts ?? [];
}

export async function getCondoProjects(params: { district?: number; q?: string }): Promise<CondoProject[]> {
  const res = await api.get('/landed-owners/condo/projects', { params, timeout: QUICK_TIMEOUT_MS });
  return res.data.projects ?? [];
}

// ── Search ─────────────────────────────────────────────────────────────────────
export async function searchOwnership(module: 'street', params: StreetSearchParams): Promise<Paged<StreetItem>>;
export async function searchOwnership(module: 'gcb', params: GcbSearchParams): Promise<Paged<GcbItem>>;
export async function searchOwnership(module: 'condo', params: CondoSearchParams): Promise<Paged<CondoItem>>;
export async function searchOwnership(module: OwnershipModule, params: StreetSearchParams | GcbSearchParams | CondoSearchParams): Promise<Paged<StreetItem | GcbItem | CondoItem>> {
  const res = await api.get(`/landed-owners/${module}/search`, { params, timeout: SEARCH_TIMEOUT_MS });
  return res.data;
}

// ── Access log (admins who hold the grant) ─────────────────────────────────────
export interface LogFilters {
  street?: string; project?: string; district?: number; occupancy?: string; who?: string; flag?: string;
  complete?: boolean; phoneOnly?: boolean; tenantOnly?: boolean; page?: number; userId?: number; module?: string;
}
export interface LogEntry {
  id: number;
  user_id: number;
  user_name: string | null;
  user_email: string | null;
  module: 'street' | 'gcb' | 'condo' | 'log';
  action: 'summary' | 'search' | 'streets' | 'projects' | 'view' | string;
  query: string | null;
  filters: LogFilters | null;
  result_count: number | null;
  at: string;
}
export interface LogUser { id: number; name: string | null; entries: number; last_at: string }
export interface LogParams { user_id?: number; module?: 'street' | 'gcb' | 'condo'; searches?: '1'; from?: string; to?: string; page: number }
export interface LogResponse extends Paged<LogEntry> { users: LogUser[] }

export async function getOwnershipLog(params: LogParams): Promise<LogResponse> {
  const res = await api.get('/landed-owners/log', { params, timeout: QUICK_TIMEOUT_MS });
  return res.data;
}

// ── Errors ─────────────────────────────────────────────────────────────────────
export type OwnershipErrorKind = 'gated' | 'forbidden' | 'session' | 'timeout' | 'other';
export interface OwnershipError { kind: OwnershipErrorKind; status?: number; message: string }

/** Axios error → what the page should do: gate card (403 featureGated), login (401), timeout note, or a retry line. */
export function describeOwnershipError(err: unknown, fallback = 'Could not load. Change the search to retry.'): OwnershipError {
  const e = err as { response?: { status?: number; data?: { error?: string; featureGated?: boolean } }; code?: string };
  const status = e?.response?.status;
  if (status === 403 && e.response?.data?.featureGated) return { kind: 'gated', status, message: 'Not enabled for your account.' };
  if (status === 403) return { kind: 'forbidden', status, message: e.response?.data?.error || 'Not allowed.' };
  if (status === 401) return { kind: 'session', status, message: 'Your session has ended. Sign in again.' };
  if (e?.code === 'ECONNABORTED') return { kind: 'timeout', message: 'The search took too long and was stopped. Narrow it and try again.' };
  return { kind: 'other', status, message: fallback };
}
