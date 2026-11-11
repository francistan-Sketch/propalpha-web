'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

// Feature grants from GET /tenancy/features → { features: string[] } (the same call the app makes).
// The list is cached for the page lifetime; a sign-in or sign-out (the `pa-auth` event from lib/auth.ts)
// clears it so another account never inherits the previous one's grants.
//
// `landed_owners` is the only key to Ownership Intelligence: it is personal data, issued per account by the
// app admin, and nothing else (admin role, Plus plan, a Stripe subscription) implies it.

export const LANDED_OWNERS = 'landed_owners';

let cache: string[] | null = null;
let inflight: Promise<string[]> | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('pa-auth', () => { cache = null; inflight = null; });
}

export async function fetchFeatures(): Promise<string[]> {
  if (cache) return cache;
  if (!inflight) {
    inflight = api.get('/tenancy/features', { timeout: 15_000 })
      .then((res) => {
        const list = (res.data as { features?: unknown })?.features;
        cache = Array.isArray(list) ? list.filter((f): f is string => typeof f === 'string') : [];
        return cache;
      })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

export interface FeaturesState {
  /** `undefined` while the grants are still being fetched. */
  features: string[] | undefined;
  /** True when the fetch failed (the list is then empty: no grant is ever assumed). */
  error: boolean;
}

/**
 * The signed-in account's feature grants. Pass `enabled=false` while there is no session so the call
 * never fires signed-out (a 401 would bounce the visitor to the login page with the wrong reason).
 */
export function useFeatures(enabled = true): FeaturesState {
  const [state, setState] = useState<FeaturesState>(() => ({ features: cache ?? undefined, error: false }));

  useEffect(() => {
    if (!enabled || state.features) return;
    let live = true;
    // Kick off from a cancellable timer so the effect body itself sets no state (react-hooks lint).
    const t = setTimeout(() => {
      fetchFeatures()
        .then((f) => { if (live) setState({ features: f, error: false }); })
        .catch(() => { if (live) setState({ features: [], error: true }); });
    }, 0);
    return () => { live = false; clearTimeout(t); };
  }, [enabled, state.features]);

  return state;
}

export function hasFeature(state: FeaturesState, feature: string): boolean {
  return !!state.features && state.features.includes(feature);
}
