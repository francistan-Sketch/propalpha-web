'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import api from '@/lib/api';
import { setAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleSuccess(credentialResponse: { credential?: string }) {
    console.log('[Google] onSuccess fired, credential present:', !!credentialResponse.credential);
    if (!credentialResponse.credential) {
      setError('Google sign-in returned no credential. Please try again.');
      return;
    }
    setGoogleLoading(true);
    setError('');
    try {
      console.log('[Google] Calling /auth/google…');
      const res = await api.post('/auth/google', { idToken: credentialResponse.credential });
      console.log('[Google] Backend responded:', res.status, res.data);
      const { token, user } = res.data;
      setAuth(token, user);
      router.push('/dashboard');
    } catch (err: unknown) {
      console.error('[Google] Error:', err);
      const axiosErr = err as { response?: { data?: { error?: string }; status?: number } };
      const msg = axiosErr?.response?.data?.error
        || `Sign-in failed (${axiosErr?.response?.status ?? 'network error'})`;
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      setAuth(token, user);
      router.push('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #4f8ef7 0%, #7c5cfc 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px'
            }}>α</div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>PropAlpha</span>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '4px' }}>
            Singapore Property Intelligence
          </p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '32px',
        }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
            Sign in to your account
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '28px' }}>
            Access your PropAlpha dashboard
          </p>

          {error && (
            <div style={{
              backgroundColor: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#f87171',
              fontSize: '13px',
              marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          {/* Google SSO */}
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
            {googleLoading ? (
              <div style={{
                width: '100%', padding: '11px 16px', borderRadius: '10px',
                border: '1px solid var(--border)', backgroundColor: 'var(--surface2)',
                color: 'var(--muted)', fontSize: '14px', textAlign: 'center',
              }}>
                Signing in…
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in was cancelled or failed.')}
                theme="filled_black"
                size="large"
                width="356"
                text="continue_with"
                shape="rectangular"
              />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
            <span style={{ color: 'var(--muted)', fontSize: '12px' }}>or continue with email</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: 'var(--muted)', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="agent@propco.com.sg"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface2)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: 'var(--muted)', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface2)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            {error && (
              <div style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#f87171',
                fontSize: '13px',
                marginBottom: '16px',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: loading ? 'var(--border)' : 'var(--accent)',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--muted)', fontSize: '13px' }}>
          <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            ← Back to PropAlpha.tech
          </Link>
        </p>
      </div>
    </div>
  );
}
