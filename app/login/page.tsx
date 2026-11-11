'use client';

import { useState, useEffect, type FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { setAuth, safeNextPath, type AuthUser } from '@/lib/auth';
import Wordmark from '@/components/site/Wordmark';
import ThemeToggle from '@/components/site/ThemeToggle';
import { Spinner } from '@/components/app/States';
import { useTheme } from '@/components/app/hooks';

// Login gate from PropAlpha-Login.dc.html: Google (server-side redirect), Apple (Apple JS SDK popup),
// email + password. States: default, loading, error, "signed out on another device" (?reason=session).

const BACKEND_URL = 'https://propalpha-backend-production.up.railway.app';
const APPLE_SDK = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
const APPLE_SERVICE_ID = process.env.NEXT_PUBLIC_APPLE_SERVICE_ID || '';
const APPLE_REDIRECT_URI = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI || 'https://www.propalpha.tech/login';
const APPLE_NOT_READY = 'Apple sign-in is not switched on yet. Use Google or email.';

type AppleSignInResult = {
  authorization: { id_token: string; code: string; state?: string };
  user?: { name?: { firstName?: string; lastName?: string }; email?: string };
};

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init(config: { clientId: string; scope: string; redirectURI: string; state?: string; usePopup?: boolean }): void;
        signIn(): Promise<AppleSignInResult>;
      };
    };
  }
}

/** Load Apple's SDK once and initialise it with the Services ID. Resolves false if the env is not set. */
function loadAppleSdk(): Promise<boolean> {
  if (!APPLE_SERVICE_ID) return Promise.resolve(false);
  return new Promise((resolve) => {
    const init = () => {
      try {
        window.AppleID?.auth.init({ clientId: APPLE_SERVICE_ID, scope: 'name email', redirectURI: APPLE_REDIRECT_URI, usePopup: true });
        resolve(!!window.AppleID);
      } catch { resolve(false); }
    };
    if (window.AppleID) return init();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${APPLE_SDK}"]`);
    const s = existing ?? document.createElement('script');
    s.addEventListener('load', init);
    s.addEventListener('error', () => resolve(false));
    if (!existing) { s.src = APPLE_SDK; s.async = true; document.head.appendChild(s); }
  });
}

function serverError(err: unknown): string | null {
  const e = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
  if (!e?.response) return null;
  return e.response.data?.error || e.response.data?.message || null;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // An ?error= from the Google redirect is the initial error; the form clears it on the next attempt.
  const [error, setError] = useState(() => { const e = searchParams.get('error'); return e ? decodeURIComponent(e) : ''; });
  // Only an email/password failure outlines the fields; an Apple or Google problem is shown as text alone.
  const [fieldError, setFieldError] = useState(false);
  const [loading, setLoading] = useState<'email' | 'apple' | null>(null);
  const theme = useTheme();
  const [appleReady, setAppleReady] = useState<boolean | null>(null);

  const next = safeNextPath(searchParams.get('next'));
  const signedOutElsewhere = searchParams.get('reason') === 'session';

  useEffect(() => { loadAppleSdk().then(setAppleReady); }, []);

  // Handle redirect back from Google OAuth (server-side flow): /login?token=…&userId=…&name=…&role=…&email=…
  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const name = searchParams.get('name');
    const role = searchParams.get('role');
    const mail = searchParams.get('email');

    if (searchParams.get('error')) return; // shown as the initial error above; nothing to store
    if (token) {
      const user: AuthUser = { id: userId || '', name: name || '', role: role || 'agent', plan: 'free' };
      if (mail) user.email = mail;
      setAuth(token, user);
      router.replace(next);
    }
  }, [searchParams, router, next]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(''); setFieldError(false);
    setLoading('email');
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data as { token: string; user: AuthUser };
      setAuth(token, user);
      router.push(next);
    } catch (err: unknown) {
      setFieldError(true);
      setError(serverError(err) || 'Wrong email or password. Try again, or reset your password.');
      setLoading(null);
    }
  }

  async function handleApple() {
    setError(''); setFieldError(false);
    if (!APPLE_SERVICE_ID) { setError(APPLE_NOT_READY); return; }
    const ready = appleReady ?? (await loadAppleSdk());
    if (!ready || !window.AppleID) { setError(APPLE_NOT_READY); return; }
    setLoading('apple');
    try {
      const result = await window.AppleID.auth.signIn();
      const n = result.user?.name;
      const fullName = n ? [n.firstName, n.lastName].filter(Boolean).join(' ') : undefined;
      const res = await api.post('/auth/apple', { identityToken: result.authorization.id_token, fullName: fullName || undefined });
      const { token, user } = res.data as { token: string; user: AuthUser };
      setAuth(token, user);
      router.push(next);
    } catch (err: unknown) {
      const code = (err as { error?: string })?.error;
      // The user closing Apple's popup is not an error worth showing.
      if (code === 'popup_closed_by_user' || code === 'user_cancelled_authorize') { setLoading(null); return; }
      setError(serverError(err) || 'Apple could not sign you in. Try again, or use Google or email.');
      setLoading(null);
    }
  }

  // Apple's button follows Apple's rules: white on the dark theme, black on the light theme.
  const dark = theme !== 'light';
  const apple = { bg: dark ? '#fff' : '#000', fg: dark ? '#000' : '#fff', border: dark ? '#fff' : '#000' };
  const fieldBorder = fieldError && error ? '#F87171' : 'var(--pa-border)';
  const busy = loading !== null;
  const fieldStyle = { height: 48, padding: '0 14px', borderRadius: 12, border: `1px solid ${fieldBorder}`, background: 'var(--pa-card)', color: 'var(--pa-text)', fontSize: 15.5, width: '100%', minWidth: 0 } as const;
  const ssoStyle = { height: 50, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, borderRadius: 12, fontWeight: 600, fontSize: 15.5, cursor: busy ? 'default' : 'pointer', fontFamily: 'var(--font-body)', textDecoration: 'none', opacity: busy ? 0.8 : 1 } as const;

  return (
    <div className="pa-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px var(--pa-pad)', gap: 12 }}>
        <Wordmark />
        <ThemeToggle size={36} />
      </div>
      <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '24px var(--pa-pad) 64px' }}>
        <div style={{ width: 'min(420px,100%)', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {signedOutElsewhere && (
            <div role="status" style={{ display: 'flex', gap: 12, padding: '14px 16px', borderRadius: 12, border: '1px solid color-mix(in srgb, var(--pa-amber) 50%, transparent)', background: 'color-mix(in srgb, var(--pa-amber) 12%, transparent)', fontSize: 14, color: 'var(--pa-text)' }}>
              <span style={{ color: 'var(--pa-amber)', fontWeight: 800 }}>!</span>
              <span>You have been signed out on another device. The free plan allows one active session. Sign in again to continue here.</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h1 style={{ fontSize: 32 }}>Sign in to PropAlpha</h1>
            <p style={{ fontSize: 15, color: 'var(--pa-text-2)' }}>Same account as the app.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a
              className="pa-btn"
              href={`${BACKEND_URL}/auth/google-web`}
              aria-disabled={busy || undefined}
              onClick={(e) => { if (busy) e.preventDefault(); }}
              style={{ ...ssoStyle, border: '1px solid #DADCE0', background: '#fff', color: '#1F1F1F' }}
            >
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" /><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" /><path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.7 24c0-1.6.3-3.1.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z" /><path fill="#34A853" d="M24 48c6.3 0 11.7-2.1 15.5-5.7l-7.6-5.9c-2.1 1.4-4.8 2.3-7.9 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z" /></svg>
              Continue with Google
            </a>
            <button
              type="button"
              className="pa-btn"
              onClick={handleApple}
              disabled={busy}
              style={{ ...ssoStyle, border: `1px solid ${apple.border}`, background: apple.bg, color: apple.fg }}
            >
              {loading === 'apple' ? (
                <span aria-hidden="true" className="pa-spin" style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${dark ? 'rgba(0,0,0,.25)' : 'rgba(255,255,255,.35)'}`, borderTopColor: apple.fg, display: 'inline-block' }} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.4 12.6c0-2.5 2-3.7 2.1-3.7-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.7.9-.8 0-2-.9-3.3-.9-1.7 0-3.2 1-4.1 2.5-1.8 3-.5 7.6 1.3 10.1.8 1.2 1.8 2.6 3.1 2.5 1.3 0 1.7-.8 3.3-.8s2 .8 3.3.8c1.4 0 2.2-1.2 3.1-2.5.9-1.4 1.3-2.7 1.4-2.8-.1 0-2.9-1.1-2.9-4.1ZM14 5.3c.7-.8 1.2-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1.1 3 1.1.1 2.3-.6 3-1.4Z" /></svg>
              )}
              {loading === 'apple' ? 'Signing in…' : 'Continue with Apple'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12.5, color: 'var(--pa-text-3)' }}>
            <span style={{ flex: 1, height: 1, background: 'var(--pa-border)' }} />
            or continue with email
            <span style={{ flex: 1, height: 1, background: 'var(--pa-border)' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--pa-text-2)' }}>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@agency.sg" aria-invalid={!!error || undefined} style={fieldStyle} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--pa-text-2)' }}>
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••••" aria-invalid={!!error || undefined} style={fieldStyle} />
            </label>
            {error && (
              <p role="alert" style={{ fontSize: 13.5, color: '#F87171', display: 'flex', gap: 8 }}>
                <span style={{ fontWeight: 800 }}>×</span>
                <span>{error}</span>
              </p>
            )}
            <button
              type="submit"
              className="pa-btn"
              disabled={busy}
              style={{ height: 50, borderRadius: 12, border: 0, background: 'var(--pa-primary)', color: '#fff', fontWeight: 700, fontSize: 15.5, cursor: busy ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: loading === 'email' ? 0.8 : 1 }}
            >
              {loading === 'email' && <Spinner light />}
              {loading === 'email' ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', fontSize: 14 }}>
            <Link className="pa-link" href="/download">New to PropAlpha? Get the app</Link>
            <Link className="pa-link" href="/forgot">Forgot password</Link>
          </div>
          <p style={{ fontSize: 13, color: 'var(--pa-text-3)', textAlign: 'center' }}>Market data is free. Agent tools are activated by Luminaire Proptech.</p>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
