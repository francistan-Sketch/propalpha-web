'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { logout, initials, planLabel } from '@/lib/auth';
import Wordmark from '@/components/site/Wordmark';
import ThemeToggle from '@/components/site/ThemeToggle';
import { Tag } from '@/components/site/ui';
import AlphaMark from '@/components/app/AlphaMark';
import AskSocrates from '@/components/app/AskSocrates';
import { useAuthUser, useSidebarCollapsed } from '@/components/app/hooks';
import { LANDED_OWNERS, useFeatures } from '@/lib/features';

// Signed-in shell from PropAlpha-App.dc.html: sticky 240px sidebar (68px icon rail when collapsed),
// 64px top bar with title, data label, global Ask Socrates pill, theme toggle and user menu; a 64px
// bottom tab bar replaces the sidebar under 860px (globals.css: .pa-app-side / .pa-app-tabs / .pa-app-main).

type NavKey = 'dashboard' | 'socrates' | 'search' | 'tower' | 'launches' | 'market' | 'maps' | 'tools' | 'ownership' | 'inbox' | 'profile';

interface NavItem {
  key: NavKey;
  label: string;
  glyph: string;
  /** Route; `undefined` for an item that has nowhere to go yet (Inbox). */
  href?: string;
  coming?: boolean;
  /** The item exists only for accounts holding this explicit feature grant (GET /tenancy/features). */
  grant?: string;
}

const NAV: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', glyph: 'D', href: '/dashboard' },
  { key: 'socrates', label: 'AI Socrates', glyph: 'α', href: '/socrates' },
  { key: 'search', label: 'Search', glyph: 'S', href: '/search' },
  { key: 'tower', label: 'Tower View', glyph: 'T', href: '/tower' },
  { key: 'launches', label: 'New Launches', glyph: 'N', href: '/launches' },
  { key: 'market', label: 'Market', glyph: 'M', href: '/market' },
  { key: 'maps', label: 'Maps', glyph: '◎', href: '/dashboard#maps', coming: true },
  { key: 'tools', label: 'Tech Tools', glyph: '⚒', href: '/tools' },
  // Ownership Intelligence is personal data: the entry exists only with the `landed_owners` grant, never locked.
  { key: 'ownership', label: 'Ownership', glyph: 'O', href: '/tools/ownership', grant: LANDED_OWNERS },
  { key: 'inbox', label: 'Inbox', glyph: '✉', coming: true },
  { key: 'profile', label: 'Profile', glyph: 'P', href: '/profile' },
];

const TABS: { key: NavKey; label: string; glyph: string; href: string }[] = [
  { key: 'socrates', label: 'Socrates', glyph: 'α', href: '/socrates' },
  { key: 'search', label: 'Search', glyph: 'S', href: '/search' },
  { key: 'market', label: 'Market', glyph: 'M', href: '/market' },
  { key: 'tools', label: 'Tools', glyph: '⚒', href: '/tools' },
  { key: 'profile', label: 'More', glyph: '…', href: '/profile' },
];

const ACTIVE_BG = 'color-mix(in srgb, var(--pa-primary) 22%, transparent)';

/** Which sidebar item a path belongs to. Sub-pages roll up to their hub (flyer and tools/* → Tech Tools; tools/ownership/* → Ownership). */
function activeKey(pathname: string): NavKey | null {
  const is = (p: string) => pathname === p || pathname.startsWith(p + '/');
  if (is('/dashboard')) return 'dashboard';
  if (is('/socrates')) return 'socrates';
  if (is('/search')) return 'search';
  if (is('/tower')) return 'tower';
  if (is('/launches')) return 'launches';
  if (is('/market')) return 'market';
  if (is('/tools/ownership')) return 'ownership';
  if (is('/tools') || is('/flyer')) return 'tools';
  if (is('/profile')) return 'profile';
  return null;
}

interface AppLayoutProps {
  children: ReactNode;
  /** Page title shown in the top bar. */
  title?: string;
  /** Small label next to the title. Defaults to the data freshness line from the design. */
  subtitle?: string;
}

export default function AppLayout({ children, title = 'PropAlpha', subtitle = 'URA data to Oct 2026' }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthUser(); // undefined until hydrated, null when signed out
  const [collapsed, toggleSide] = useSidebarCollapsed();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { features } = useFeatures(!!user); // grant-gated nav items; fetched once per page lifetime

  // Gate: send signed-out visitors to the login page and remember where they were heading.
  useEffect(() => {
    if (user !== null) return;
    const next = window.location.pathname + window.location.search;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [user, router]);

  // Close the user menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menuOpen]);

  if (!user) return null;

  const active = activeKey(pathname || '');
  const expanded = !collapsed;
  const plan = planLabel(user);
  const name = user?.name || 'PropAlpha user';
  const nav = NAV.filter((n) => !n.grant || (features?.includes(n.grant) ?? false));

  return (
    <div className="pa-page" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* SIDEBAR */}
      <aside
        className="pa-app-side"
        style={{ position: 'sticky', top: 0, height: '100vh', flex: 'none', width: collapsed ? 68 : 240, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--pa-border)', background: 'color-mix(in srgb, var(--pa-card) 80%, transparent)', transition: 'width .2s', overflow: 'hidden' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 64, padding: '0 16px', borderBottom: '1px solid var(--pa-border)', flex: 'none' }}>
          {expanded ? (
            <Wordmark size={18} href="/dashboard" />
          ) : (
            <Link href="/dashboard" aria-label="PropAlpha dashboard" style={{ display: 'flex', flex: 'none' }}>
              <AlphaMark size={30} radius={8} fontSize={15} />
            </Link>
          )}
        </div>
        <nav aria-label="App" style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 10, flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {nav.map((n) => {
            const on = active === n.key && !n.coming;
            const rowStyle = {
              display: 'flex', alignItems: 'center', gap: 12, height: 42, padding: '0 10px', borderRadius: 10, border: 0, width: '100%',
              background: on ? ACTIVE_BG : 'transparent', color: on ? 'var(--pa-text)' : 'var(--pa-text-2)', fontWeight: 600, fontSize: 14,
              cursor: n.href ? 'pointer' : 'default', textAlign: 'left', whiteSpace: 'nowrap', textDecoration: 'none', flex: 'none',
            } as const;
            const inner = (
              <>
                <span aria-hidden="true" style={{ width: 22, height: 22, flex: 'none', display: 'grid', placeItems: 'center', borderRadius: 6, background: on ? 'var(--pa-primary)' : 'var(--pa-bg)', fontSize: 11, fontWeight: 800, color: on ? '#fff' : 'var(--pa-text-2)' }}>{n.glyph}</span>
                {expanded && <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.label}</span>}
                {expanded && n.coming && <Tag kind="coming" />}
              </>
            );
            if (!n.href) return <div key={n.key} className="pa-row" title={`${n.label} · Coming`} aria-disabled="true" style={rowStyle}>{inner}</div>;
            return (
              <Link key={n.key} href={n.href} className="pa-row" title={n.coming ? `${n.label} · Coming` : n.label} aria-current={on ? 'page' : undefined} style={rowStyle}>
                {inner}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: 10, borderTop: '1px solid var(--pa-border)', flex: 'none' }}>
          <button
            type="button"
            onClick={toggleSide}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={expanded}
            style={{ display: 'flex', alignItems: 'center', gap: 12, height: 40, width: '100%', padding: '0 10px', borderRadius: 10, border: 0, background: 'transparent', color: 'var(--pa-text-3)', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            <span style={{ width: 22, textAlign: 'center', flex: 'none' }}>{collapsed ? '»' : '«'}</span>
            {expanded && 'Collapse'}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header style={{ position: 'sticky', top: 0, zIndex: 20, height: 64, display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px', borderBottom: '1px solid var(--pa-border)', background: 'color-mix(in srgb, var(--pa-bg) 80%, transparent)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>
          <h1 style={{ fontSize: 18, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{title}</h1>
          {subtitle && <span className="pa-hide-m" style={{ fontSize: 12, color: 'var(--pa-text-3)', whiteSpace: 'nowrap' }}>{subtitle}</span>}
          <AskSocrates variant="top" className="pa-app-top-ask" />
          <div ref={menuRef} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, position: 'relative', flex: 'none' }}>
            <ThemeToggle size={36} />
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Account menu"
              style={{ display: 'flex', alignItems: 'center', gap: 10, height: 36, padding: '0 10px 0 4px', borderRadius: 10, border: '1px solid var(--pa-border)', background: 'var(--pa-card)', color: 'var(--pa-text)', cursor: 'pointer' }}
            >
              <span aria-hidden="true" style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--pa-primary)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, flex: 'none' }}>{initials(name)}</span>
              <span className="pa-hide-m" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                <span style={{ fontSize: 13, fontWeight: 700, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                <span style={{ fontSize: 11, color: 'var(--pa-text-3)', whiteSpace: 'nowrap' }}>{plan}</span>
              </span>
            </button>
            {menuOpen && (
              <div role="menu" style={{ position: 'absolute', right: 0, top: 44, width: 260, padding: 8, borderRadius: 14, border: '1px solid var(--pa-border)', background: 'var(--pa-surface)', boxShadow: 'var(--pa-shadow)', display: 'flex', flexDirection: 'column', gap: 2, zIndex: 30 }}>
                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <strong style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</strong>
                  {user?.email && <span style={{ fontSize: 12.5, color: 'var(--pa-text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>}
                  <span style={{ fontSize: 12, color: 'var(--pa-text-3)' }}>{plan}</span>
                </div>
                <Link role="menuitem" href="/profile" className="pa-row" onClick={() => setMenuOpen(false)} style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 8, color: 'var(--pa-text)', fontSize: 13.5 }}>Profile</Link>
                <button role="menuitem" type="button" className="pa-row" onClick={() => logout()} style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 8, border: 0, background: 'transparent', color: 'var(--pa-text)', fontSize: 13.5, cursor: 'pointer' }}>Sign out</button>
              </div>
            )}
          </div>
        </header>

        <main className="pa-app-main" style={{ flex: 1, padding: '28px 24px 96px', display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
          {children}
        </main>

        {/* MOBILE TABS (shown under 860px by globals.css) */}
        <nav
          className="pa-app-tabs"
          aria-label="App"
          style={{ display: 'none', position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30, height: 64, borderTop: '1px solid var(--pa-border)', background: 'color-mix(in srgb, var(--pa-card) 92%, transparent)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {TABS.map((t) => {
            const on = active === t.key || (t.key === 'tools' && active === 'ownership');
            return (
              <Link key={t.key} href={t.href} aria-current={on ? 'page' : undefined} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: on ? 'var(--pa-text)' : 'var(--pa-text-3)', fontSize: 11, fontWeight: 700, minHeight: 44, minWidth: 0 }}>
                <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: 6, background: on ? 'var(--pa-primary)' : 'transparent', display: 'grid', placeItems: 'center', fontSize: 10, color: on ? '#fff' : 'var(--pa-text-3)' }}>{t.glyph}</span>
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
