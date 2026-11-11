'use client';

import type { FlyerTemplate } from '@/lib/flyer/types';
import { isAppMode } from '@/lib/flyer/build';
import { Sub } from './ui';

interface Props {
  templates: FlyerTemplate[];
  template: FlyerTemplate | null;
  onPick: (t: FlyerTemplate) => void;
  hasPack: boolean;
}

// Swatch per theme when a template has no thumbnail (the design's theme gallery colours).
const SWATCH: Record<string, string> = {
  modernist: '#F3F2F2', broadsheet: '#ECE6D6', ledger: '#DCE3EA', poster: '#EC3013', estate: '#2F5D50', prestige: '#1B1B1B',
  social_portrait: '#3D1A82', social_landscape: '#7028B8', a4: '#FFFFFF', propalpha: '#0E0920',
};
function swatch(t: FlyerTemplate): string {
  const key = Object.keys(SWATCH).find((k) => t.slug.toLowerCase().includes(k) || t.name.toLowerCase().includes(k.replace('_', ' ')));
  return key ? SWATCH[key] : SWATCH[t.format] || '#FFFFFF';
}

function formatLabel(t: FlyerTemplate): string {
  if (t.format === 'a4') return 'A4';
  if (t.format === 'a4_landscape') return 'A4 fold';
  return String(t.format || '').replace('social_', '');
}

export default function StepTemplate({ templates, template, onPick, hasPack }: Props) {
  if (!templates.length) return <Sub>No templates yet. An admin can upload a Claude Design handoff at /flyer-templates.html.</Sub>;
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {templates.map((t) => {
          const on = !!template && template.slug === t.slug;
          const thumb = t.thumbnail || t.preview_url;
          const app = isAppMode(t);
          const disabled = !hasPack && !app;
          return (
            <button
              key={t.slug}
              type="button"
              onClick={() => onPick(t)}
              title={t.description || t.name}
              style={{
                display: 'flex', flexDirection: 'column', gap: 6, padding: 8, borderRadius: 10, cursor: 'pointer', textAlign: 'left', minWidth: 0,
                border: `1px solid ${on ? 'var(--pa-primary)' : 'var(--pa-border)'}`, background: 'var(--pa-bg)', color: 'var(--pa-text)',
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <span style={{ display: 'block', aspectRatio: t.width_px > t.height_px ? '1.3 / 1' : '1 / 1.3', borderRadius: 5, background: swatch(t), overflow: 'hidden', border: '1px solid var(--pa-border)', position: 'relative' }}>
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: swatch(t) === '#FFFFFF' || swatch(t) === '#F3F2F2' || swatch(t) === '#ECE6D6' || swatch(t) === '#DCE3EA' ? '#1E1B4B' : '#fff', textAlign: 'center', padding: 4 }}>
                    {formatLabel(t)}
                  </span>
                )}
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
              <span style={{ fontSize: 10.5, color: 'var(--pa-text-3)' }}>{t.width_px}×{t.height_px}{(t.pages || 1) > 1 ? ` · ${t.pages} pages` : ''}</span>
            </button>
          );
        })}
      </div>
      {template?.description ? <Sub>{template.description}</Sub> : null}
      {!hasPack ? <Sub>Estate themes need an estate from step 1; only the PropAlpha app flyer renders without one.</Sub> : null}
    </>
  );
}
