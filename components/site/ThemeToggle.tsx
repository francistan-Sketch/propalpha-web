'use client';

import { useEffect, useState } from 'react';
import { getTheme, toggleTheme, type PaTheme } from '@/lib/theme';

// 38px square toggle from the design: sun when dark (click for light), moon when light.
export default function ThemeToggle({ size = 38 }: { size?: number }) {
  const [theme, setThemeState] = useState<PaTheme>('dark');
  useEffect(() => {
    setThemeState(getTheme());
    const on = (e: Event) => setThemeState((e as CustomEvent<PaTheme>).detail);
    window.addEventListener('pa-theme', on);
    return () => window.removeEventListener('pa-theme', on);
  }, []);
  return (
    <button
      type="button"
      onClick={() => setThemeState(toggleTheme())}
      aria-label="Toggle light and dark theme"
      title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
      style={{ width: size, height: size, borderRadius: 10, border: '1px solid var(--pa-border)', background: 'var(--pa-card)', color: 'var(--pa-text-2)', display: 'grid', placeItems: 'center', cursor: 'pointer', flex: 'none' }}
    >
      {theme === 'dark' ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
      )}
    </button>
  );
}
