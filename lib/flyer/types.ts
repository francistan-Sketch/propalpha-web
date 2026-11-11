// Shapes returned by the Flyer Maker API (backend/routes/flyer.js) and the wizard's own choices.
// They mirror what mobile/src/flyer/FlyerScreen.js consumes, so the two front ends render the same flyers.

export type FlyerKind = 'landed' | 'condo';
export type FlyerScope = 'estate' | 'street' | 'project';

export interface FlyerTarget {
  kind: FlyerKind;
  scope: FlyerScope;
  name: string;
  district?: string | number | null;
  sales?: number;
  last_sale?: string | null;
}

/** A remembered search: the four fields needed to fetch the pack again. */
export interface RecentTarget {
  kind: FlyerKind;
  scope: FlyerScope;
  name: string;
  district: string | number | null;
}

export interface FlyerTransaction {
  address: string;
  type?: string;
  area_sqft?: number | null;
  price: number;
  psf?: number | null;
  date: string;
  record_psf?: number | null;
  record_price?: number | null;
}

export interface FlyerRecord {
  type: string;
  record_psf?: number | null;
  record_psf_date?: string | null;
  record_price?: number | null;
  record_price_date?: string | null;
}

export interface FlyerPack {
  target: {
    name: string;
    kind: FlyerKind;
    scope: FlyerScope;
    months: number;
    tenure?: string | null;
    district?: string | number | null;
    planning_area?: string | null;
  };
  summary: {
    sales_in_window: number;
    all_time: number;
    first_sale?: string | number | null;
    since_2y: number;
    since_year: number;
  };
  records: FlyerRecord[];
  transactions: FlyerTransaction[];
  by_type: Record<string, FlyerTransaction[]>;
  trend: { year: number | string; avg_psf: number; n?: number }[];
  latest?: FlyerTransaction | null;
}

export interface FlyerAgent {
  name?: string | null;
  cea_reg_no?: string | null;
  agent_licence?: string | null;
  agency?: string | null;
  mobile?: string | null;
  email?: string | null;
  photo_uri?: string | null;
  /** Set by the wizard: the portrait as a data URI (or the URL when it cannot be fetched cross-origin). */
  photo_data_uri?: string | null;
  designation?: string | null;
  join_code?: string | null;
  address?: string | null;
  web?: string | null;
}

export interface FlyerCopy {
  headline: string;
  subhead: string;
  taglines: [string, string, string];
  analysis: string;
}

export type FlyerFormat = 'a4' | 'a4_landscape' | 'social_portrait' | 'social_landscape' | string;

export interface FlyerTemplate {
  id: number | string;
  slug: string;
  name: string;
  description?: string | null;
  format: FlyerFormat;
  width_px: number;
  height_px: number;
  pages?: number | null;
  slots?: string[] | null;
  preview_url?: string | null;
  thumbnail?: string | null;
  sort_order?: number;
  /** Present on the list when the backend exposes them; always derivable from `manifest` on the full record. */
  dialect?: 'dc' | 'classic' | string | null;
  mode?: 'propalpha' | string | null;
  manifest?: { dialect?: string; mode?: string; [k: string]: unknown } | null;
  /** Only on GET /flyer/templates/:slug. */
  html?: string | null;
}

export type LogoChoice = 'propalpha' | 'custom' | 'none';

export interface FlyerOptions {
  chart: boolean;
  table: boolean;
  analysis: boolean;
  qr: boolean;
  joinCode: boolean;
  photo: boolean;
  logo: LogoChoice;
}

export const DEFAULT_OPTIONS: FlyerOptions = { chart: true, table: true, analysis: true, qr: true, joinCode: true, photo: false, logo: 'propalpha' };
export const EMPTY_COPY: FlyerCopy = { headline: '', subhead: '', taglines: ['', '', ''], analysis: '' };

export const RECENT_KEY = 'flyer_recent_targets';
export const RECENT_MAX = 8;
