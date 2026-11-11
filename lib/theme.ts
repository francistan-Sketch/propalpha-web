// Theme state lives on <html data-theme> and in localStorage['pa-theme']; app/layout.tsx applies it before paint.
export type PaTheme = 'dark' | 'light';
const KEY = 'pa-theme';

export function getTheme(): PaTheme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function setTheme(t: PaTheme): void {
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem(KEY, t); } catch { /* private mode */ }
  window.dispatchEvent(new CustomEvent('pa-theme', { detail: t }));
}

export function toggleTheme(): PaTheme {
  const next: PaTheme = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}
