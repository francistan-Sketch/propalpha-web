'use client';

import { useEffect, useRef, useState } from 'react';
import type { FlyerTemplate } from '@/lib/flyer/types';
import { pageCount, withViewport } from '@/lib/flyer/build';

interface Props {
  html: string;
  template: FlyerTemplate | null;
  caption: string;
  onReady?: () => void;
}

/**
 * The sticky preview well of the design. The composed page is shown in a sandboxed iframe laid out at the template's
 * own pixel width (as FlyerScreen's withViewport does for the WebView) and scaled with a CSS transform to the column.
 */
export default function FlyerPreview({ html, template, caption, onReady }: Props) {
  const wellRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);

  useEffect(() => {
    const el = wellRef.current;
    if (!el) return;
    const measure = () => setW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pages = template ? pageCount(template) : 1;
  const width = template ? template.width_px : 0;
  const height = template ? template.height_px * pages : 0;
  const scale = template && w ? w / width : 0;
  const show = !!(html && template && scale);

  return (
    <figure style={{ position: 'sticky', top: 84, display: 'flex', flexDirection: 'column', gap: 10, margin: 0, minWidth: 0 }}>
      <div
        ref={wellRef}
        style={{
          borderRadius: 16, background: 'var(--pa-well)', border: '1px solid var(--pa-well-border)', boxShadow: 'var(--pa-shadow)', overflow: 'hidden',
          maxHeight: 'calc(100vh - 140px)', overflowY: show ? 'auto' : 'hidden',
          ...(show ? {} : { aspectRatio: '1 / 1.2' }),
        }}
      >
        {show ? (
          <div style={{ width: '100%', height: Math.round(height * scale), position: 'relative', background: '#fff' }}>
            <iframe
              key={`${template!.slug}-${width}`}
              title="Flyer preview"
              sandbox=""
              srcDoc={withViewport(html, width)}
              onLoad={onReady}
              scrolling="no"
              style={{ width, height, border: 0, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', left: 0, top: 0, background: '#fff', pointerEvents: 'none', display: 'block' }}
            />
          </div>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', color: 'var(--pa-text-3)', fontSize: 13.5 }}>
            {template ? 'Pick an estate (or the PropAlpha app flyer) to see the live preview.' : 'Live preview — choose a template to render it here.'}
          </div>
        )}
      </div>
      <figcaption style={{ fontSize: 12.5, color: 'var(--pa-text-3)', display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <span>{caption}</span>
        <span>Updates as you edit</span>
      </figcaption>
    </figure>
  );
}
