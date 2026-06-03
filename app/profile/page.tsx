'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { getUser, logout, AuthUser } from '@/lib/auth';

function getRoleBadge(role: string): { label: string; bg: string; color: string } {
  switch (role?.toLowerCase()) {
    case 'agent':
      return { label: 'Agent', bg: 'rgba(79,142,247,0.15)', color: '#4f8ef7' };
    case 'admin':
      return { label: 'Admin', bg: 'rgba(139,92,246,0.15)', color: '#a78bfa' };
    default:
      return { label: 'Public', bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' };
  }
}

function getPlanBadge(plan: string): { label: string; bg: string; color: string } {
  switch (plan?.toLowerCase()) {
    case 'plus':
      return { label: 'Plus', bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' };
    default:
      return { label: 'Free', bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' };
  }
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const badgeStyle = (bg: string, color: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: '20px',
  backgroundColor: bg,
  color,
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.04em',
});

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.replace('/login');
      return;
    }
    setUser(u);
  }, [router]);

  if (!user) {
    return (
      <AppLayout>
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
          Loading…
        </div>
      </AppLayout>
    );
  }

  const roleBadge = getRoleBadge(user.role);
  const planBadge = getPlanBadge(user.plan);

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '32px' }}>

        {/* Back link */}
        <div style={{ width: '100%', maxWidth: '480px', marginBottom: '20px' }}>
          <Link
            href="/dashboard"
            style={{
              color: 'var(--muted)',
              textDecoration: 'none',
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text)'}
            onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--muted)'}
          >
            ← Dashboard
          </Link>
        </div>

        {/* Profile card */}
        <div style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          padding: '40px 36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}>
          {/* Avatar */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f8ef7 0%, #7c5cfc 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '30px',
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '-0.02em',
            flexShrink: 0,
          }}>
            {getInitials(user.name)}
          </div>

          {/* Name */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: '12px',
              letterSpacing: '-0.01em',
            }}>
              {user.name}
            </h1>

            {/* Badges */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span style={badgeStyle(roleBadge.bg, roleBadge.color)}>
                {roleBadge.label}
              </span>
              <span style={badgeStyle(planBadge.bg, planBadge.color)}>
                {planBadge.label}
              </span>
            </div>
          </div>

          {/* Email */}
          {user.email && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '9px',
              backgroundColor: 'var(--surface2)',
              border: '1px solid var(--border)',
              width: '100%',
            }}>
              <span style={{ fontSize: '16px' }}>✉️</span>
              <span style={{ fontSize: '14px', color: 'var(--muted)' }}>{user.email}</span>
            </div>
          )}

          {/* Divider */}
          <div style={{ width: '100%', height: '1px', backgroundColor: 'var(--border)' }} />

          {/* Sign out */}
          <button
            onClick={() => logout()}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '10px',
              border: '1px solid rgba(239,68,68,0.3)',
              backgroundColor: 'rgba(239,68,68,0.08)',
              color: '#f87171',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.15)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.5)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.08)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.3)';
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
