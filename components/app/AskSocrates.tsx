'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AlphaMark from './AlphaMark';

/** Route a question to the Socrates screen. Empty questions open Socrates with no prompt. */
export function socratesHref(q: string): string {
  const t = q.trim();
  return t ? `/socrates?q=${encodeURIComponent(t)}` : '/socrates';
}

type Props = {
  /** `top`: the 40px pill in the top bar. `dashboard`: the 60px field with shadow on the Dashboard. */
  variant: 'top' | 'dashboard';
  className?: string;
};

// The global "Ask Socrates" field. Both variants submit to /socrates?q=<encoded>.
export default function AskSocrates({ variant, className }: Props) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const top = variant === 'top';

  function submit(e: FormEvent) {
    e.preventDefault();
    router.push(socratesHref(q));
    setQ('');
  }

  return (
    <form
      onSubmit={submit}
      className={className}
      role="search"
      style={
        top
          ? { flex: 1, maxWidth: 560, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10, height: 40, padding: '0 6px 0 14px', borderRadius: 12, border: '1px solid var(--pa-border)', background: 'var(--pa-card)', minWidth: 0 }
          : { display: 'flex', alignItems: 'center', gap: 12, height: 60, padding: '0 8px 0 18px', borderRadius: 16, border: '1px solid var(--pa-border)', background: 'var(--pa-card)', boxShadow: 'var(--pa-shadow)', minWidth: 0 }
      }
    >
      <AlphaMark size={top ? 18 : 24} radius={top ? 5 : 6} fontSize={top ? 10 : 12} />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={top ? 'Ask Socrates anything about Singapore property' : 'Ask Socrates in plain English'}
        aria-label="Ask Socrates"
        style={{ flex: 1, minWidth: 0, border: 0, background: 'transparent', color: 'var(--pa-text)', fontSize: top ? 14 : 17, outline: 'none' }}
      />
      <button
        type="submit"
        className={top ? undefined : 'pa-btn'}
        style={
          top
            ? { height: 30, padding: '0 12px', borderRadius: 8, border: 0, background: 'var(--pa-primary)', color: '#fff', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', flex: 'none' }
            : { height: 44, padding: '0 18px', borderRadius: 12, border: 0, background: 'var(--pa-primary)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', flex: 'none' }
        }
      >
        Ask
      </button>
    </form>
  );
}
