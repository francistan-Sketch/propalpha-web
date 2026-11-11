'use client';

import type { FlyerCopy } from '@/lib/flyer/types';
import { ErrorLine, Field, SmallBtn, Spinner, Sub, selectStyle, textareaStyle } from './ui';

interface Props {
  copy: FlyerCopy; setCopy: (c: FlyerCopy) => void;
  tone: string; setTone: (v: string) => void;
  audience: string; setAudience: (v: string) => void;
  onWrite: () => void; writing: boolean; error: string;
  canWrite: boolean; showAnalysis: boolean;
}

const TONES = ['market letter', 'warm and personal', 'formal'];
const AUDIENCES = ['owners in the estate', 'buyers looking in', 'investors'];
const TAGLINE_HINTS = ['Just sold in your estate', 'Thinking of selling?', 'Know what your home is worth'];

export default function StepWords({ copy, setCopy, tone, setTone, audience, setAudience, onWrite, writing, error, canWrite, showAnalysis }: Props) {
  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <SmallBtn onClick={onWrite} disabled={writing || !canWrite}>
          {writing ? <Spinner /> : <span aria-hidden>✦</span>}
          {writing ? 'Writing…' : 'Write it for me from the figures'}
        </SmallBtn>
        <select value={tone} onChange={(e) => setTone(e.target.value)} aria-label="Tone" style={selectStyle}>
          {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={audience} onChange={(e) => setAudience(e.target.value)} aria-label="Audience" style={selectStyle}>
          {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      {!canWrite ? <Sub>Pick an estate first so the AI has figures to write from; the PropAlpha app flyer needs no words.</Sub> : null}
      {error ? <ErrorLine>{error}</ErrorLine> : null}

      <Field label="Headline">
        <textarea value={copy.headline} onChange={(e) => setCopy({ ...copy, headline: e.target.value })} placeholder="A semi-detached in your estate just sold for $5.17M." style={textareaStyle} />
      </Field>
      <Field label="Summary">
        <textarea value={copy.subhead} onChange={(e) => setCopy({ ...copy, subhead: e.target.value })} placeholder="Two sentences with a figure or two." style={{ ...textareaStyle, minHeight: 96 }} />
      </Field>
      <Field label="Taglines">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              value={copy.taglines[i]}
              onChange={(e) => { const t: FlyerCopy['taglines'] = [...copy.taglines] as FlyerCopy['taglines']; t[i] = e.target.value; setCopy({ ...copy, taglines: t }); }}
              placeholder={TAGLINE_HINTS[i]}
              style={{ ...textareaStyle, minHeight: 0, height: 40, padding: '0 12px', resize: 'none' }}
            />
          ))}
        </div>
      </Field>
      {showAnalysis ? (
        <Field label="Analysis">
          <textarea value={copy.analysis} onChange={(e) => setCopy({ ...copy, analysis: e.target.value })} placeholder="90–130 words. Ends with: For information only; not a valuation." style={{ ...textareaStyle, minHeight: 120 }} />
        </Field>
      ) : null}
    </>
  );
}
