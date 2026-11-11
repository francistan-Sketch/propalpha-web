'use client';

import type { ReactNode } from 'react';
import { EmptyState, LoadingCard } from '@/components/app/States';
import { useAuthUser } from '@/components/app/hooks';
import { LANDED_OWNERS, useFeatures } from '@/lib/features';

// Access gate for Ownership Intelligence. The only key is the explicit `landed_owners` grant from
// GET /tenancy/features; the admin role, the Plus plan and a subscription never imply it. The module body is
// mounted only once the grant is confirmed, so no search is fired (or logged) for an account without it.

export type GrantState = 'loading' | 'granted' | 'denied';

export function useOwnershipGrant(): GrantState {
  const user = useAuthUser();
  const { features } = useFeatures(!!user);
  if (user === undefined || features === undefined) return 'loading';
  return features.includes(LANDED_OWNERS) ? 'granted' : 'denied';
}

export const CONTACT_EMAIL = 'contact@luminaireproptech.com.sg';

/** The design's empty-state card for an account without the grant (also used when the backend answers 403 featureGated). */
export function OwnershipDenied() {
  return (
    <EmptyState title="Ownership Intelligence is switched on by Luminaire Proptech for individual accounts.">
      Write to <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--pa-text)', fontWeight: 600, textDecoration: 'underline' }}>{CONTACT_EMAIL}</a> to ask.
    </EmptyState>
  );
}

/** Loading card, denied card, or the module once the grant is confirmed. */
export function OwnershipGate({ children }: { children: ReactNode }) {
  const grant = useOwnershipGrant();
  if (grant === 'loading') return <LoadingCard label="Checking access…" />;
  if (grant === 'denied') return <OwnershipDenied />;
  return <>{children}</>;
}

/** One-line notice at the top of every module page. */
export function PersonalDataNotice() {
  return (
    <div role="note" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px', borderRadius: 12, border: '1px solid color-mix(in srgb, var(--pa-amber) 45%, transparent)', background: 'color-mix(in srgb, var(--pa-amber) 9%, transparent)', fontSize: 12.5, color: 'var(--pa-text)' }}>
      <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--pa-amber)', flex: 'none' }} />
      <span>Personal data for licensed agents&rsquo; own use. Do not share or export.</span>
    </div>
  );
}
