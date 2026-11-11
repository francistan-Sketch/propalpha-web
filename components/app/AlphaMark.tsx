import type { CSSProperties } from 'react';

// The small gradient "α" square used in ask fields, Socrates labels and the collapsed sidebar.
export default function AlphaMark({ size = 18, radius, fontSize, style }: { size?: number; radius?: number; fontSize?: number; style?: CSSProperties }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size, height: size, flex: 'none', borderRadius: radius ?? Math.round(size * 0.28),
        background: 'linear-gradient(135deg,var(--pa-deep-2),var(--pa-primary))', display: 'grid', placeItems: 'center',
        color: '#fff', fontSize: fontSize ?? Math.round(size * 0.55), fontWeight: 800, lineHeight: 1, ...style,
      }}
    >
      α
    </span>
  );
}
