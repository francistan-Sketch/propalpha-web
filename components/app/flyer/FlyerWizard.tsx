'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { errorMessage, errorStatus, getFlyerAgent, getFlyerData, getFlyerTargets, getFlyerTemplate, getFlyerTemplates, postFlyerCopy, postFlyerJob } from '@/lib/flyer/api';
import { buildFlyerHtml, downloadText, isAppMode, openHtml, printableHtml, titleCase, urlToDataUri, withViewport } from '@/lib/flyer/build';
import { DEFAULT_OPTIONS, EMPTY_COPY, RECENT_KEY, RECENT_MAX } from '@/lib/flyer/types';
import type { FlyerAgent, FlyerCopy, FlyerKind, FlyerOptions, FlyerPack, FlyerTarget, FlyerTemplate, RecentTarget } from '@/lib/flyer/types';
import FlyerLocked from './FlyerLocked';
import FlyerPreview from './FlyerPreview';
import StepContent from './StepContent';
import StepEstate from './StepEstate';
import StepExport from './StepExport';
import StepTemplate from './StepTemplate';
import StepWords from './StepWords';

// Flyer Maker wizard for the web: the five steps of mobile/src/flyer/FlyerScreen.js (Estate, Content, Words, Template,
// Export) in the 380px column of the design, with the composed flyer in a sticky preview on the right.

const STEPS: [string, string][] = [
  ['Estate', 'Pick an estate, street or condo. Recent searches are remembered.'],
  ['Content', 'Choose which URA REALIS figures appear: transactions, record prices, psf trend.'],
  ['Words', 'AI writes the headline, summary and taglines. Edit anything.'],
  ['Template', 'Six market-letter themes, social sizes and the PropAlpha app flyer.'],
  ['Export', 'A4 fold-to-A5 PDF, or the flyer at full size to save as an image.'],
];

// No HTML-to-image dependency (html2canvas, html-to-image, dom-to-image) is in package.json, so there is no PNG path;
// the Export step offers "Open full size" instead and says so.
const PNG_RENDERER_AVAILABLE = false;

type Gate = 'loading' | 'ok' | 'locked';
type Busy = '' | 'pdf' | 'open' | 'html';

const readRecent = (): RecentTarget[] => {
  try { const v = localStorage.getItem(RECENT_KEY); return v ? (JSON.parse(v) as RecentTarget[]) : []; } catch { return []; }
};
const writeRecent = (list: RecentTarget[]) => { try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch { /* private mode */ } };
const sameTarget = (a: { kind: string; scope: string; name: string }, b: { kind: string; scope: string; name: string }) => a.kind === b.kind && a.scope === b.scope && a.name === b.name;

export default function FlyerWizard() {
  const router = useRouter();
  const [gate, setGate] = useState<Gate>('loading');
  const [step, setStep] = useState(0);

  // 1. target
  const [kind, setKind] = useState<FlyerKind>('landed');
  const [q, setQ] = useState('');
  const [targets, setTargets] = useState<FlyerTarget[]>([]);
  const [searching, setSearching] = useState(false);
  const [target, setTarget] = useState<FlyerTarget | RecentTarget | null>(null);
  const [months, setMonths] = useState('15');
  const [pack, setPack] = useState<FlyerPack | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [recent, setRecent] = useState<RecentTarget[]>([]);
  const [agent, setAgent] = useState<FlyerAgent | null>(null);
  const skipSearchFor = useRef<string | null>(null);   // q set programmatically after a pick: do not search it again

  // 2. content choices
  const [opts, setOptsState] = useState<FlyerOptions>(DEFAULT_OPTIONS);
  const setOpts = useCallback((patch: Partial<FlyerOptions>) => setOptsState((o) => ({ ...o, ...patch })), []);
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [logoDataUri, setLogoDataUri] = useState<string | null>(null);

  // 3. copy
  const [copy, setCopy] = useState<FlyerCopy>(EMPTY_COPY);
  const [tone, setTone] = useState('market letter');
  const [audience, setAudience] = useState('owners in the estate');
  const [writing, setWriting] = useState(false);
  const [copyError, setCopyError] = useState('');

  // 4. template
  const [templates, setTemplates] = useState<FlyerTemplate[]>([]);
  const [appTemplate, setAppTemplate] = useState<FlyerTemplate | null>(null);
  const [template, setTemplate] = useState<FlyerTemplate | null>(null);
  const fullCache = useRef<Map<string, FlyerTemplate>>(new Map());
  const selectedSlug = useRef<string | null>(null);

  // 5. export
  const [busy, setBusy] = useState<Busy>('');
  const [exportError, setExportError] = useState('');
  const [loadedHtml, setLoadedHtml] = useState('');

  /** 401 → sign in again; 403 → the account lacks the `flyer` feature. Returns true when handled. */
  const handleAuth = useCallback((e: unknown): boolean => {
    const status = errorStatus(e);
    if (status === 401) { router.replace('/login?reason=session'); return true; }
    if (status === 403) { setGate('locked'); return true; }
    return false;
  }, [router]);

  /** Full template record (with html), cached by slug. */
  const loadFull = useCallback(async (t: FlyerTemplate): Promise<FlyerTemplate> => {
    if (t.html) return t;
    const hit = fullCache.current.get(t.slug);
    if (hit) return hit;
    const full = { ...t, ...(await getFlyerTemplate(t.slug)) };
    fullCache.current.set(t.slug, full);
    return full;
  }, []);

  const pickTemplate = useCallback((t: FlyerTemplate) => {
    selectedSlug.current = t.slug;
    setTemplate(t);
    if (!t.html) {
      loadFull(t).then((full) => { if (selectedSlug.current === full.slug) setTemplate(full); }).catch((e) => { handleAuth(e); });
    }
  }, [loadFull, handleAuth]);

  // Mount: the agent block (also the feature gate), the template list and the remembered searches.
  useEffect(() => {
    let alive = true;
    const timer = setTimeout(() => {
      setRecent(readRecent());
      getFlyerAgent().then(async (a) => {
        if (!alive) return;
        setAgent(a);
        setGate('ok');
        if (a.photo_uri) {
          const uri = await urlToDataUri(a.photo_uri);
          if (alive) setAgent({ ...a, photo_data_uri: uri });
        }
      }).catch((e) => {
        if (!alive) return;
        if (!handleAuth(e)) setGate('ok');
      });
      getFlyerTemplates().then(async (list) => {
        if (!alive) return;
        setTemplates(list);
        if (list[0]) pickTemplate(list[0]);
        // The app flyer: flagged on the list when the backend exposes mode/dialect, else found by name on the full record.
        let app = list.find(isAppMode) || null;
        if (!app) {
          const candidates = list.filter((t) => /propalpha|app/i.test(`${t.slug} ${t.name}`));
          for (const c of candidates) {
            try { const full = await loadFull(c); if (isAppMode(full)) { app = full; break; } } catch { /* skip */ }
          }
        }
        if (alive && app) setAppTemplate(app);
      }).catch((e) => { if (alive) handleAuth(e); });
    }, 0);
    return () => { alive = false; clearTimeout(timer); };
  }, [handleAuth, loadFull, pickTemplate]);

  // Debounced target search.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    if (skipSearchFor.current === q) { skipSearchFor.current = null; return; }
    let alive = true;
    const timer = setTimeout(() => {
      setSearching(true);
      getFlyerTargets(term, kind)
        .then((list) => { if (alive) setTargets(list); })
        .catch((e) => { if (alive && !handleAuth(e)) setTargets([]); })
        .finally(() => { if (alive) setSearching(false); });
    }, 300);
    return () => { alive = false; clearTimeout(timer); };
  }, [q, kind, handleAuth]);

  const onQ = (v: string) => { setQ(v); setTarget(null); setPack(null); setDataError(''); if (v.trim().length < 2) setTargets([]); };
  const onKind = (k: FlyerKind) => { setKind(k); setTarget(null); setPack(null); setTargets([]); };

  const remember = (t: FlyerTarget | RecentTarget) => {
    const entry: RecentTarget = { kind: t.kind, scope: t.scope, name: t.name, district: t.district ?? null };
    setRecent((cur) => { const next = [entry, ...cur.filter((r) => !sameTarget(r, entry))].slice(0, RECENT_MAX); writeRecent(next); return next; });
  };
  const forget = (t: RecentTarget) => setRecent((cur) => { const next = cur.filter((r) => !sameTarget(r, t)); writeRecent(next); return next; });

  const pickTarget = async (t: FlyerTarget | RecentTarget) => {
    if (t.kind !== kind) setKind(t.kind);
    const label = titleCase(t.name);
    skipSearchFor.current = label;
    setTarget(t); setTargets([]); setQ(label); setDataError(''); setDataLoading(true);
    try {
      const p = await getFlyerData({ kind: t.kind, scope: t.scope, name: t.name, months: parseInt(months, 10) || 15, rows: 12 });
      setPack(p); remember(t);
    } catch (e) {
      if (!handleAuth(e)) { setDataError(errorMessage(e, 'Could not load transactions for that name.')); setTarget(null); }
    } finally { setDataLoading(false); }
  };

  const writeWithAi = async () => {
    if (!pack) return;
    setWriting(true); setCopyError('');
    try {
      const c = await postFlyerCopy(pack, { tone, audience });
      const tags = [...(c.taglines || []), '', '', ''].slice(0, 3) as FlyerCopy['taglines'];
      setCopy({ headline: c.headline || '', subhead: c.subhead || '', taglines: tags, analysis: c.analysis || '' });
    } catch (e) {
      if (!handleAuth(e)) setCopyError('Could not write the copy. You can type it yourself.');
    } finally { setWriting(false); }
  };

  // The composed flyer. Pure and synchronous, so it is a memo of (deferred) inputs rather than an effect; the iframe
  // reloads only once typing pauses.
  const buildInput = useMemo(() => ({ template, pack, copy, agent, opts, photoDataUri, logoDataUri }), [template, pack, copy, agent, opts, photoDataUri, logoDataUri]);
  const deferred = useDeferredValue(buildInput);
  const html = useMemo(() => {
    const { template: t, pack: p, copy: c, agent: a, opts: o, photoDataUri: ph, logoDataUri: lg } = deferred;
    if (!t || !a) return '';
    try { return buildFlyerHtml({ template: t, pack: p, copy: c, agent: a, opts: o, photoDataUri: ph, logoDataUri: lg }); } catch { return ''; }
  }, [deferred]);
  const rendering = (deferred !== buildInput) || (!!html && loadedHtml !== html);

  const record = () => {
    if (!pack || !template) return Promise.resolve();
    return postFlyerJob({ template_id: template.id, target: pack.target, options: opts, pack: { target: pack.target, summary: pack.summary }, copy }).catch(() => undefined);
  };

  const exportPdf = async () => {
    if (!html || !template) return;
    setBusy('pdf'); setExportError('');
    try {
      if (!openHtml(printableHtml(html, template))) setExportError('The browser blocked the print tab. Allow pop-ups for this site and try again.');
      else await record();
    } finally { setBusy(''); }
  };
  const openFull = async () => {
    if (!html || !template) return;
    setBusy('open'); setExportError('');
    try {
      if (!openHtml(withViewport(html, template.width_px))) setExportError('The browser blocked the new tab. Allow pop-ups for this site and try again.');
      else await record();
    } finally { setBusy(''); }
  };
  const downloadHtml = async () => {
    if (!html || !template) return;
    setBusy('html'); setExportError('');
    try {
      downloadText(html, `${template.slug}-${(pack ? titleCase(pack.target.name) : 'propalpha').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.html`);
      await record();
    } finally { setBusy(''); }
  };

  const appMode = isAppMode(template);
  const canNext = [!!pack, true, !!copy.headline || appMode, !!template, false][step];
  const goTo = (i: number) => { if (i <= step || (i === step + 1 && canNext)) setStep(i); };
  const estateLabel = pack ? titleCase(pack.target.name) : appMode ? 'PropAlpha app' : '—';
  const caption = `Preview · ${template?.name || '—'} · ${estateLabel}`;

  if (gate === 'locked') return <FlyerLocked />;
  if (gate === 'loading') {
    return (
      <div className="pa-2col" style={{ display: 'grid', gridTemplateColumns: '380px minmax(0,1fr)', gap: 20, alignItems: 'start' }}>
        <div className="pa-pulse" style={{ height: 480, borderRadius: 16, border: '1px solid var(--pa-border)', background: 'var(--pa-card)' }} />
        <div className="pa-pulse" style={{ aspectRatio: '1 / 1.2', maxHeight: 'calc(100vh - 140px)', borderRadius: 16, border: '1px solid var(--pa-well-border)', background: 'var(--pa-well)' }} />
      </div>
    );
  }

  const active = 'color-mix(in srgb, var(--pa-primary) 22%, transparent)';
  return (
    <div className="pa-2col" style={{ display: 'grid', gridTemplateColumns: '380px minmax(0,1fr)', gap: 20, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        {/* Step rail */}
        <div style={{ display: 'flex', gap: 4 }}>
          {STEPS.map(([label], i) => {
            const on = i === step, done = i < step;
            const reachable = i <= step || (i === step + 1 && canNext);
            return (
              <button
                key={label} type="button" onClick={() => goTo(i)} disabled={!reachable} aria-current={on ? 'step' : undefined}
                style={{
                  flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 8px', borderRadius: 10, textAlign: 'left',
                  border: `1px solid ${on ? 'var(--pa-primary)' : 'var(--pa-border)'}`, background: on ? active : done ? 'var(--pa-card)' : 'transparent',
                  color: on || done ? 'var(--pa-text)' : 'var(--pa-text-3)', cursor: reachable ? 'pointer' : 'default', opacity: reachable || on ? 1 : 0.6,
                }}
              >
                <span style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.7, whiteSpace: 'nowrap' }}>Step {i + 1}</span>
                <strong style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</strong>
              </button>
            );
          })}
        </div>

        {/* Step card */}
        <div style={{ border: '1px solid var(--pa-border)', borderRadius: 16, background: 'var(--pa-card)', padding: 20, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 420 }}>
          <strong style={{ fontSize: 16 }}>{STEPS[step][0]}{step === 4 && appMode ? ' · PropAlpha app flyer' : ''}</strong>
          <p style={{ fontSize: 13.5, color: 'var(--pa-text-2)' }}>{STEPS[step][1]}</p>

          {step === 0 ? (
            <StepEstate
              kind={kind} setKind={onKind} q={q} setQ={onQ} targets={targets} searching={searching}
              recent={recent} onPick={pickTarget} onForget={forget} target={target}
              months={months} setMonths={setMonths} loading={dataLoading} error={dataError} pack={pack}
              appTemplate={appTemplate} onAppFlyer={() => { if (appTemplate) { pickTemplate(appTemplate); setStep(4); } }}
            />
          ) : null}
          {step === 1 ? (
            <StepContent opts={opts} setOpts={setOpts} photoDataUri={photoDataUri} setPhotoDataUri={setPhotoDataUri} logoDataUri={logoDataUri} setLogoDataUri={setLogoDataUri} agent={agent} />
          ) : null}
          {step === 2 ? (
            <StepWords copy={copy} setCopy={setCopy} tone={tone} setTone={setTone} audience={audience} setAudience={setAudience} onWrite={writeWithAi} writing={writing} error={copyError} canWrite={!!pack} showAnalysis={opts.analysis} />
          ) : null}
          {step === 3 ? <StepTemplate templates={templates} template={template} onPick={pickTemplate} hasPack={!!pack} /> : null}
          {step === 4 ? (
            <StepExport template={template} ready={!!html} busy={busy} error={exportError} onPdf={exportPdf} onOpen={openFull} onHtml={downloadHtml} pngSupported={PNG_RENDERER_AVAILABLE} />
          ) : null}

          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', gap: 8, paddingTop: 12 }}>
            <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} style={{ height: 38, padding: '0 14px', borderRadius: 9, border: '1px solid var(--pa-border)', background: 'transparent', color: 'var(--pa-text)', fontWeight: 600, fontSize: 13, cursor: step === 0 ? 'default' : 'pointer', opacity: step === 0 ? 0.3 : 1 }}>Back</button>
            {step < 4 ? (
              <button type="button" className="pa-btn" onClick={() => canNext && setStep(step + 1)} disabled={!canNext} style={{ height: 38, padding: '0 16px', borderRadius: 9, border: 0, background: 'var(--pa-primary)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: canNext ? 'pointer' : 'default', opacity: canNext ? 1 : 0.4 }}>
                {step === 3 ? 'Preview' : 'Next'}
              </button>
            ) : (
              <button type="button" className="pa-btn" onClick={() => { setStep(0); }} style={{ height: 38, padding: '0 16px', borderRadius: 9, border: 0, background: 'var(--pa-primary)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Done</button>
            )}
          </div>
        </div>
      </div>

      <FlyerPreview html={html} template={template} caption={caption} rendering={rendering} onReady={() => setLoadedHtml(html)} />
    </div>
  );
}
