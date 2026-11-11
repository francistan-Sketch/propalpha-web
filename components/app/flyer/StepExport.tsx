'use client';

import type { FlyerTemplate } from '@/lib/flyer/types';
import { isDcTemplate, pageCount, paperLabel } from '@/lib/flyer/build';
import { BigBtn, ErrorLine, Spinner, Sub } from './ui';

interface Props {
  template: FlyerTemplate | null;
  ready: boolean;
  busy: '' | 'pdf' | 'open' | 'html';
  error: string;
  onPdf: () => void;
  onOpen: () => void;
  onHtml: () => void;
  pngSupported: boolean;
}

export default function StepExport({ template, ready, busy, error, onPdf, onOpen, onHtml, pngSupported }: Props) {
  if (!template) return <Sub>Choose a template first.</Sub>;
  const pages = pageCount(template);
  const dc = isDcTemplate(template);
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <BigBtn primary onClick={onPdf} disabled={!ready || !!busy}>
          {busy === 'pdf' ? <Spinner color="#fff" /> : null}
          {dc || template.format === 'a4_landscape' ? 'Export PDF · A4 fold-to-A5' : template.format === 'a4' ? 'Export PDF · A4' : 'Export PDF · page-sized'}
        </BigBtn>
        <BigBtn onClick={onOpen} disabled={!ready || !!busy}>
          {busy === 'open' ? <Spinner /> : null}
          {pngSupported ? 'Export image' : 'Open full size'}
        </BigBtn>
        <BigBtn onClick={onHtml} disabled={!ready || !!busy}>Download HTML</BigBtn>
      </div>
      {error ? <ErrorLine>{error}</ErrorLine> : null}
      <Sub>
        PDF: {paperLabel(template)}. The browser&apos;s print dialog opens in a new tab; choose &ldquo;Save as PDF&rdquo;, margins none, background graphics on.
      </Sub>
      <Sub>
        Image: {template.width_px}×{template.height_px * pages} px.{' '}
        {pngSupported
          ? 'Rendered from the preview.'
          : 'This site has no HTML-to-image renderer installed, so the flyer opens full size in a new tab instead; save it from there (screenshot, or print to PDF).'}
      </Sub>
      {!ready ? <Sub>The flyer is still rendering.</Sub> : null}
    </>
  );
}
