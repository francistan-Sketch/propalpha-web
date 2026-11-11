export interface AuthUser {
  id: string;
  name: string;
  role: string;
  plan: string;
  email?: string;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('auth_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: AuthUser): void {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));
  notifyAuth();
}

export function clearAuth(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  notifyAuth();
}

/** Lets same-tab subscribers (components/app/hooks.ts) re-read the stored user. */
function notifyAuth(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('pa-auth'));
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function logout(): void {
  clearAuth();
  window.location.href = '/login';
}

// ── Additive helpers for the 2.0 shell ────────────────────────────────────────

/** Agent tools are unlocked for agents and for any paid plan; everyone else sees the locked treatment. */
export function isUnlocked(user: AuthUser | null): boolean {
  if (!user) return false;
  const plan = (user.plan || 'free').toLowerCase();
  const role = (user.role || '').toLowerCase();
  return role === 'agent' || role === 'admin' || plan !== 'free';
}

/** "Free plan" or "Agent · Tech Tools active", as the design labels the user menu and plan card. */
export function planLabel(user: AuthUser | null): string {
  return isUnlocked(user) ? 'Agent · Tech Tools active' : 'Free plan';
}

export function planDescription(user: AuthUser | null): string {
  return isUnlocked(user)
    ? 'Flyer Maker, Income Valuation, CEA forms, tenancy tools and inbox are active.'
    : 'Market data, search, tower view and maps. Ask Luminaire Proptech to activate agent tools.';
}

/** Up to two initials from a display name; "U" when there is none. */
export function initials(name?: string | null): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Only same-origin paths are honoured as a post-login destination. */
export function safeNextPath(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next) return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/login')) return fallback;
  return next;
}
