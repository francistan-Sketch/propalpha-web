'use client';

import { useEffect, useRef, useState } from 'react';
import type { FlyerTemplate } from '@/lib/flyer/types';
import { pageCount, withViewport } from '@/lib/flyer/build';
import { Spinner } from './ui';

interface Props {
  html: string;
  template: FlyerTemplate | null;
  caption: string;
  rendering: boolean;
  onReady?: () => void;
}

/**
 * The sticky preview well from the design. The composed page is loaded into a sandboxed iframe laid out at the
 * template's own pixel width (as FlyerScreen's withViewport does for the WebView) and scaled with a CSS transform
 * to the column width, so the preview is the flyer itself, not a re-layout of it.
 */
export default function FlyerPreview({ html, template, caption, rendering, onReady }: Props) {
  const wellRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);

  useEffect(() => {
    const el = wellRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const width = Math.floor(entries[0]?.contentRect.width || 0);
      setW((prev) => (prev === width ? prev : width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pages = template ? pageCount(template) : 1;
  const pageW = template?.width_px || 1;
  const pageH = (template?.height_px || 1) * pages;
  const scale = w && template ? w / pageW : 0;
  const innerH = Math.round(pageH * scale);
  const show = !!html && !!template && scale > 0;

  return (
    <figure style={{ position: 'sticky', top: 84, display: 'flex', flexDirection: 'column', gap: 10, margin: 0, minWidth: 0 }}>
      <div
        ref={wellRef}
        style={{
          position: 'relative', maxHeight: 'calc(100vh - 140px)', borderRadius: 16, background: 'var(--pa-well)', border: '1px solid var(--pa-well-border)',
          boxShadow: 'var(--pa-shadow)', overflow: show ? 'auto' : 'hidden', aspectRatio: show ? undefined : '1 / 1.2', minHeight: show ? 0 : undefined,
        }}
      >
        {show ? (
          <div style={{ width: w, height: innerH, position: 'relative', background: '#fff' }}>
            <iframe
              key={template.slug}
              title="Flyer preview"
              sandbox=""
              srcDoc={withViewport(html, pageW)}
              onLoad={onReady}
              scrolling="no"
              style={{ width: pageW, height: pageH, border: 0, transform: `scale(${scale})`, transformOrigin: '0 0', position: 'absolute', left: 0, top: 0, background: '#fff', pointerEvents: 'none', display: 'block' }}
            />
            {rendering ? (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,9,32,.35)' }}>
                <Spinner size={24} color="#fff" />
              </div>
            ) : null}
          </div>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', color: 'var(--pa-text-3)', fontSize: 13.5 }}>
            {rendering ? <Spinner size={22} color="var(--pa-text-3)" /> : 'Live preview — appears once an estate and a template are chosen.'}
          </div>
        )}
      </div>
      <figcaption style={{ fontSize: 12.5, color: 'var(--pa-text-3)', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{caption}</span>
        <span style={{ flex: 'none' }}>Updates as you edit</span>
      </figcaption>
    </figure>
  );
}
