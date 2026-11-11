'use client';

import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { fileToDataUri } from '@/lib/flyer/build';
import type { FlyerAgent, FlyerOptions, LogoChoice } from '@/lib/flyer/types';
import { Kicker, Pill, SmallBtn, Sub } from './ui';

interface Props {
  opts: FlyerOptions; setOpts: (patch: Partial<FlyerOptions>) => void;
  photoDataUri: string | null; setPhotoDataUri: (v: string | null) => void;
  logoDataUri: string | null; setLogoDataUri: (v: string | null) => void;
  agent: FlyerAgent | null;
}

const TOGGLES: [keyof FlyerOptions, string, string][] = [
  ['table', 'Table of latest transactions', 'Grouped by property type, record rows badged'],
  ['chart', 'Chart: average psf by year', 'Last six years, with sales volume'],
  ['analysis', 'AI analysis paragraph', 'Written from the figures only'],
  ['qr', 'WhatsApp QR code', 'Opens a chat to your number'],
  ['joinCode', 'PropAlpha join code', 'Your code with a QR for the public'],
];

export default function StepContent({ opts, setOpts, photoDataUri, setPhotoDataUri, logoDataUri, setLogoDataUri, agent }: Props) {
  const photoInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  const onFile = (which: 'photo' | 'logo') => async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const uri = await fileToDataUri(file);
      if (which === 'photo') { setPhotoDataUri(uri); setOpts({ photo: true }); }
      else { setLogoDataUri(uri); setOpts({ logo: 'custom' }); }
    } catch { /* unreadable file: leave the previous choice */ }
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {TOGGLES.map(([k, l, sub]) => (
          <label key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid var(--pa-border)', fontSize: 14, cursor: 'pointer' }}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
              <span>{l}</span>
              <Sub>{sub}</Sub>
            </span>
            <input type="checkbox" checked={!!opts[k]} onChange={(e) => setOpts({ [k]: e.target.checked })} style={{ width: 18, height: 18, accentColor: 'var(--pa-primary)', flex: 'none' }} />
          </label>
        ))}
      </div>

      <Kicker>Logo</Kicker>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {([['propalpha', 'PropAlpha'], ['custom', logoDataUri ? 'Your logo ✓' : 'Pick a logo…'], ['none', 'None']] as [LogoChoice, string][]).map(([v, l]) => (
          <Pill key={v} on={opts.logo === v} onClick={() => (v === 'custom' && !logoDataUri ? logoInput.current?.click() : setOpts({ logo: v }))}>{l}</Pill>
        ))}
        {logoDataUri ? <Pill onClick={() => logoInput.current?.click()}>Change</Pill> : null}
        <input ref={logoInput} type="file" accept="image/*" onChange={onFile('logo')} style={{ display: 'none' }} />
      </div>

      <Kicker>Property photo (templates with a photo slot)</Kicker>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <Pill on={opts.photo} onClick={() => photoInput.current?.click()}>{photoDataUri ? 'Change photo' : 'Choose a photo'}</Pill>
        {photoDataUri ? <Pill onClick={() => { setPhotoDataUri(null); setOpts({ photo: false }); }}>Remove</Pill> : null}
        {photoDataUri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoDataUri} alt="" style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--pa-border)' }} />
        ) : null}
        <input ref={photoInput} type="file" accept="image/*" onChange={onFile('photo')} style={{ display: 'none' }} />
      </div>

      {agent ? (
        <div style={{ border: '1px solid var(--pa-border)', borderRadius: 12, background: 'var(--pa-bg)', padding: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <strong style={{ fontSize: 14 }}>Your details on the flyer</strong>
          <Sub>{agent.name || '(no name)'} · CEA {agent.cea_reg_no || '—'} · {agent.agency || '—'} · {agent.mobile || '— no mobile —'}</Sub>
          <Sub>Join code {agent.join_code || '—'}{agent.photo_data_uri ? ' · portrait set' : ' · no portrait: an initial is shown'}</Sub>
          <SmallBtn style={{ marginTop: 6 }} onClick={() => { window.location.href = '/profile'; }}>Edit name, CEA and mobile under Profile</SmallBtn>
        </div>
      ) : null}
    </>
  );
}
