'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Wordmark from '@/components/site/Wordmark';
import ThemeToggle from '@/components/site/ThemeToggle';

const field: CSSProperties = { height: 48, padding: '0 14px', borderRadius: 12, border: '1px solid var(--pa-border)', background: 'var(--pa-card)', color: 'var(--pa-text)', fontSize: 15.5, width: '100%' };
const label: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--pa-text-2)' };
const primary: CSSProperties = { height: 50, borderRadius: 12, border: 0, background: 'var(--pa-primary)', color: '#fff', fontWeight: 700, fontSize: 15.5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 };

function errorText(e: unknown, fallback: string): string {
  const err = e as { response?: { data?: { error?: string } } };
  return err?.response?.data?.error || fallback;
}

export default function ForgotForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState(() => params.get('email') || '');
  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function request(e: FormEvent) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const r = await api.post('/auth/forgot', { email: email.trim() });
      setNotice(r.data?.message || 'Code sent.');
      setStep('reset');
    } catch (err) {
      setError(errorText(err, 'Could not send a code. Try again.'));
    } finally { setBusy(false); }
  }

  async function reset(e: FormEvent) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const r = await api.post('/auth/reset', { email: email.trim(), code: code.trim(), password });
      setNotice(r.data?.message || 'Password updated.');
      setStep('done');
    } catch (err) {
      setError(errorText(err, 'Could not reset the password. Check the code and try again.'));
    } finally { setBusy(false); }
  }

  return (
    <div className="pa-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px var(--pa-pad)' }}>
        <Wordmark />
        <ThemeToggle size={36} />
      </div>
      <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '24px var(--pa-pad) 64px' }}>
        <div style={{ width: 'min(420px, 100%)', display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h1 style={{ fontSize: 32 }}>{step === 'done' ? 'Password updated' : 'Reset your password'}</h1>
            <p style={{ fontSize: 15, color: 'var(--pa-text-2)' }}>
              {step === 'request' && 'Works for every account, including ones created with Apple or Google. We send a code to the verified mobile number or email on the account.'}
              {step === 'reset' && notice}
              {step === 'done' && notice}
            </p>
          </div>

          {step === 'request' && (
            <form onSubmit={request} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={label}>Email<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@agency.sg" style={field} /></label>
              {error && <p role="alert" style={{ fontSize: 13.5, color: '#F87171' }}>{error}</p>}
              <button className="pa-btn" type="submit" disabled={busy} style={{ ...primary, opacity: busy ? 0.7 : 1 }}>{busy ? 'Sending…' : 'Send me a code'}</button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={reset} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={label}>Six-digit code<input inputMode="numeric" pattern="[0-9]{6}" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" style={{ ...field, letterSpacing: '.2em', fontWeight: 700 }} /></label>
              <label style={label}>New password<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" style={field} /></label>
              {error && <p role="alert" style={{ fontSize: 13.5, color: '#F87171' }}>{error}</p>}
              <button className="pa-btn" type="submit" disabled={busy} style={{ ...primary, opacity: busy ? 0.7 : 1 }}>{busy ? 'Saving…' : 'Set new password'}</button>
              <button type="button" onClick={() => { setStep('request'); setError(''); }} style={{ background: 'none', border: 0, color: 'var(--pa-text-2)', fontSize: 14, cursor: 'pointer', alignSelf: 'flex-start', padding: 0 }}>Send a new code</button>
            </form>
          )}

          {step === 'done' && (
            <Link className="pa-btn" href={`/login?email=${encodeURIComponent(email.trim())}`} style={{ ...primary, textDecoration: 'none' }}>Sign in</Link>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <Link className="pa-link" href="/login">Back to sign in</Link>
            <a className="pa-link" href="mailto:contact@luminaireproptech.com.sg?subject=PropAlpha%20password%20reset">Need help?</a>
          </div>
          <p style={{ fontSize: 13, color: 'var(--pa-text-3)', textAlign: 'center' }}>Setting a new password signs out every other device.</p>
        </div>
      </main>
    </div>
  );
}
