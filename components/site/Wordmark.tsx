import Link from 'next/link';

// "α" gradient square + Prop + italic emerald Alpha. 20px/800 by default.
export default function Wordmark({ size = 20, href = '/' }: { size?: number; href?: string | null }) {
  const box = Math.round(size * 1.4);
  const inner = (
    <>
      <span style={{ width: box, height: box, borderRadius: Math.round(box / 4), background: 'linear-gradient(135deg,var(--pa-deep-2),var(--pa-primary))', display: 'grid', placeItems: 'center', color: '#fff', fontSize: Math.round(size * 0.75), fontWeight: 800 }}>α</span>
      <span>Prop<em style={{ color: 'var(--pa-emerald)', fontStyle: 'italic' }}>Alpha</em></span>
    </>
  );
  const style = { display: 'flex', alignItems: 'center', gap: 10, color: 'var(--pa-text)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: size, letterSpacing: '-0.03em' } as const;
  if (!href) return <span style={style}>{inner}</span>;
  return <Link href={href} style={style} aria-label="PropAlpha home">{inner}</Link>;
}
