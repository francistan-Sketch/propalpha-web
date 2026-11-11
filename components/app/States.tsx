import type { CSSProperties, ReactNode } from 'react';

// Empty, loading and error blocks from the component sheet ("Empty, loading, error").

export function EmptyState({ title = 'Nothing here yet.', children, style }: { title?: string; children?: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ padding: '32px 20px', border: '1px dashed var(--pa-border)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center', ...style }}>
      <strong style={{ fontSize: 15 }}>{title}</strong>
      {children && <span style={{ fontSize: 13, color: 'var(--pa-text-2)' }}>{children}</span>}
    </div>
  );
}

export function LoadingCard({ label = 'Loading…', style }: { label?: string; style?: CSSProperties }) {
  const bar = (w: string) => <div className="pa-pulse" style={{ height: 14, width: w, borderRadius: 6, background: 'var(--pa-bg)' }} />;
  return (
    <div style={{ padding: 20, border: '1px solid var(--pa-border)', borderRadius: 16, background: 'var(--pa-card)', display: 'flex', flexDirection: 'column', gap: 10, ...style }}>
      {bar('60%')}
      {bar('90%')}
      {bar('75%')}
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--pa-text-2)' }}>
        <Spinner size={14} />
        {label}
      </span>
    </div>
  );
}

export function ErrorBox({ title = 'Something went wrong.', children, onRetry, style }: { title?: string; children?: ReactNode; onRetry?: () => void; style?: CSSProperties }) {
  return (
    <div role="alert" style={{ padding: '16px 18px', borderRadius: 16, border: '1px solid rgba(248,113,113,.5)', background: 'rgba(248,113,113,.1)', display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      <strong style={{ fontSize: 14.5, color: '#F87171' }}>{title}</strong>
      {children && <span style={{ fontSize: 13, color: 'var(--pa-text-2)' }}>{children}</span>}
      {onRetry && (
        <button type="button" onClick={onRetry} style={{ alignSelf: 'flex-start', height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid var(--pa-border)', background: 'var(--pa-card)', color: 'var(--pa-text)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>
          Try again
        </button>
      )}
    </div>
  );
}

/** .8s spinner; `light` draws it in white for use on a primary button. */
export function Spinner({ size = 16, light = false }: { size?: number; light?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="pa-spin"
      style={{
        width: size, height: size, flex: 'none', borderRadius: '50%',
        border: `2px solid ${light ? 'rgba(255,255,255,.35)' : 'var(--pa-border)'}`,
        borderTopColor: light ? '#fff' : 'var(--pa-text-2)', display: 'inline-block',
      }}
    />
  );
}
