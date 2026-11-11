import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { Tag } from '@/components/site/ui';

export type HubTileProps = {
  kicker: string;
  title: string;
  description: string;
  /** Route to open. Omit for a tile that has nowhere to go yet. */
  href?: string;
  coming?: boolean;
  /** Locked treatment from the design: 75% opacity, "Locked" tag, activation line, not clickable. */
  locked?: boolean;
  minHeight?: number;
};

const LockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);

// Market and Tech Tools hub tile (22px padding, radius 16, amber kicker, 18px title).
export default function HubTile({ kicker, title, description, href, coming, locked, minHeight = 150 }: HubTileProps) {
  const base: CSSProperties = {
    position: 'relative', padding: 22, borderRadius: 16, border: '1px solid var(--pa-border)', background: 'var(--pa-card)', color: 'var(--pa-text)',
    textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8, minHeight, opacity: locked ? 0.75 : 1, cursor: locked || !href ? 'default' : 'pointer',
  };
  const body: ReactNode = (
    <>
      {locked && (
        <span style={{ position: 'absolute', top: 14, right: 14, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 6, background: 'var(--pa-bg)', border: '1px solid var(--pa-border)', fontSize: 11, fontWeight: 700, color: 'var(--pa-text-2)' }}>
          <LockIcon />Locked
        </span>
      )}
      {coming && !locked && <span style={{ position: 'absolute', top: 14, right: 14 }}><Tag kind="coming" /></span>}
      <span style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--pa-amber)', fontWeight: 800 }}>{kicker}</span>
      <strong style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingRight: locked || coming ? 72 : 0 }}>
        {title}
        {coming && locked && <Tag kind="coming" />}
      </strong>
      <span style={{ fontSize: 13, color: 'var(--pa-text-2)', lineHeight: 1.5 }}>{description}</span>
      {locked && <span style={{ marginTop: 'auto', fontSize: 12, color: 'var(--pa-text-3)' }}>Ask Luminaire Proptech to activate</span>}
    </>
  );
  if (locked || !href) return <div aria-disabled={locked || undefined} style={base}>{body}</div>;
  return <Link href={href} className="pa-card-h" style={base}>{body}</Link>;
}
