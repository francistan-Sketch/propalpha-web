// Typed facade over the copied JavaScript engine (lib/flyer/engine/*.js). The JS files are untouched copies of the
// mobile app's; TypeScript infers loose (and in one place wrong) signatures from their JSDoc, so the shapes used by the
// web app are declared here once.
import * as composeMod from './engine/compose';
import * as dcMod from './engine/dc';
import { LOGO_BASE64 as logo } from './engine/logoBase64';
import type { FlyerAgent, FlyerCopy, FlyerPack, FlyerTemplate } from './types';

export interface ClassicOptions {
  chart?: boolean; table?: boolean; analysis?: boolean; qr?: boolean; joinCode?: boolean;
  photoDataUri?: string | null; logoDataUri?: string | null; tableRows?: number; whatsappText?: string;
}

export interface DcOptions {
  tableRows?: number; qr?: boolean; joinCode?: boolean; photoDataUri?: string | null; ctaBody?: string;
  agentTagline?: string; subline?: string; pillars?: string[]; formal?: boolean;
}

export interface DcMedia { waQr: string; joinQr: string; photo: string | null; portrait: string | null }
export interface DcBuild { vals: Record<string, unknown>; media: DcMedia }

export interface StatTile { value: string; label: string; sub: string }
export interface DerivedNumbers { stats: StatTile[]; hero: { value: string; label: string } }

type Fn = (...args: never[]) => unknown;
const as = <T extends Fn>(f: unknown) => f as T;

export const composeFlyer = as<(template: FlyerTemplate, pack: FlyerPack, copy: FlyerCopy, agent: FlyerAgent, opts?: ClassicOptions) => string>(composeMod.composeFlyer);
export const deriveNumbers = as<(pack: FlyerPack) => DerivedNumbers>(composeMod.deriveNumbers);
export const titleCase = as<(s: string | null | undefined) => string>(composeMod.titleCase);
export const monthYear = as<(iso: string | null | undefined) => string>(composeMod.monthYear);

export const isDcTemplate = as<(template: FlyerTemplate) => boolean>(dcMod.isDcTemplate);
export const composeDc = as<(template: FlyerTemplate, vals: Record<string, unknown>, media: DcMedia, o?: { assetBase?: string }) => string>(dcMod.composeDc);
export const buildDcVals = as<(pack: FlyerPack | null, copy: FlyerCopy, agent: FlyerAgent, opts?: DcOptions) => DcBuild>(dcMod.buildDcVals);

export const LOGO_BASE64: string = logo;
