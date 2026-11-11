'use client';

import { useSyncExternalStore } from 'react';
import { getUser, type AuthUser } from '@/lib/auth';
import { getTheme, type PaTheme } from '@/lib/theme';

// Browser-state hooks for the shell. Each reads localStorage / the document through useSyncExternalStore so
// the server render and the first client render agree, and no effect has to call setState to catch up.

// ── Signed-in user ─────────────────────────────────────────────────────────────
let userCache: { raw: string | null; user: AuthUser | null } = { raw: null, user: null };

function userSnapshot(): AuthUser | null {
  let raw: string | null = null;
  try { raw = localStorage.getItem('auth_user'); } catch { /* private mode */ }
  if (raw !== userCache.raw) userCache = { raw, user: raw ? getUser() : null };
  return userCache.user;
}

function subscribeStorage(cb: () => void) {
  window.addEventListener('storage', cb);
  window.addEventListener('pa-auth', cb);
  return () => { window.removeEventListener('storage', cb); window.removeEventListener('pa-auth', cb); };
}

/** `undefined` until hydrated on the client, then the stored user or `null` when signed out. */
export function useAuthUser(): AuthUser | null | undefined {
  return useSyncExternalStore(subscribeStorage, userSnapshot, () => undefined);
}

// ── Theme ──────────────────────────────────────────────────────────────────────
function subscribeTheme(cb: () => void) {
  window.addEventListener('pa-theme', cb);
  return () => window.removeEventListener('pa-theme', cb);
}

/** Current theme from <html data-theme>; 'dark' on the server. */
export function useTheme(): PaTheme {
  return useSyncExternalStore(subscribeTheme, getTheme, () => 'dark' as PaTheme);
}

// ── Sidebar collapsed state ────────────────────────────────────────────────────
const SIDE_KEY = 'pa-side-collapsed';
const SIDE_EVENT = 'pa-side';

function sideSnapshot(): boolean {
  try { return localStorage.getItem(SIDE_KEY) === '1'; } catch { return false; }
}

function subscribeSide(cb: () => void) {
  window.addEventListener('storage', cb);
  window.addEventListener(SIDE_EVENT, cb);
  return () => { window.removeEventListener('storage', cb); window.removeEventListener(SIDE_EVENT, cb); };
}

/** Whether the sidebar is collapsed to the icon rail; remembered in localStorage. */
export function useSidebarCollapsed(): [boolean, () => void] {
  const collapsed = useSyncExternalStore(subscribeSide, sideSnapshot, () => false);
  const toggle = () => {
    try { localStorage.setItem(SIDE_KEY, collapsed ? '0' : '1'); } catch { /* private mode */ }
    window.dispatchEvent(new Event(SIDE_EVENT));
  };
  return [collapsed, toggle];
}
