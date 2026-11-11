'use client';

import { deriveNumbers, titleCase } from '@/lib/flyer/build';
import type { FlyerKind, FlyerPack, FlyerTarget, FlyerTemplate, RecentTarget } from '@/lib/flyer/types';
import { ErrorLine, Kicker, Pill, Row, Spinner, Stat, Sub, inputStyle, scopeLabel } from './ui';

interface Props {
  kind: FlyerKind; setKind: (k: FlyerKind) => void;
  q: string; setQ: (v: string) => void;
  targets: FlyerTarget[]; searching: boolean;
  recent: RecentTarget[]; onPick: (t: FlyerTarget | RecentTarget) => void; onForget: (t: RecentTarget) => void;
  target: FlyerTarget | RecentTarget | null;
  months: string; setMonths: (v: string) => void;
  loading: boolean; error: string;
  pack: FlyerPack | null;
  appTemplate: FlyerTemplate | null; onAppFlyer: () => void;
}

export default function StepEstate({ kind, setKind, q, setQ, targets, searching, recent, onPick, onForget, target, months, setMonths, loading, error, pack, appTemplate, onAppFlyer }: Props) {
  const nums = pack ? deriveNumbers(pack) : null;
  const isSelected = (t: { name: string; scope: string }) => !!target && target.name === t.name && target.scope === t.scope;
  return (
    <>
      {appTemplate ? (
        <Row onClick={onAppFlyer} style={{ borderColor: 'var(--pa-primary)' }}>
          <span style={{ fontSize: 22, width: 28, textAlign: 'center' }}>α</span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <strong style={{ fontSize: 14 }}>Or: the PropAlpha app flyer</strong>
            <Sub>Promotes the app with your details and join code. No estate needed; goes straight to preview.</Sub>
          </span>
        </Row>
      ) : null}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {([['landed', 'Landed estate / street'], ['condo', 'Condo project']] as [FlyerKind, string][]).map(([v, l]) => (
          <Pill key={v} on={kind === v} onClick={() => setKind(v)}>{l}</Pill>
        ))}
      </div>

      <div style={{ position: 'relative' }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={kind === 'condo' ? 'Search a condo, e.g. Aalto' : 'Search an estate or street, e.g. Pavilion Park'}
          autoComplete="off"
          spellCheck={false}
          style={inputStyle}
        />
        {searching ? <span style={{ position: 'absolute', right: 14, top: 14, color: 'var(--pa-text-3)' }}><Spinner /></span> : null}
      </div>

      {targets.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {targets.map((t) => (
            <Row key={`${t.scope}|${t.name}`} onClick={() => onPick(t)} selected={isSelected(t)}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                <strong style={{ fontSize: 14 }}>{titleCase(t.name)}</strong>
                <Sub>{scopeLabel(t.scope)}{t.district ? ` · D${t.district}` : ''} · {t.sales ?? 0} sales · last {t.last_sale ? String(t.last_sale).slice(0, 7) : '—'}</Sub>
              </span>
            </Row>
          ))}
        </div>
      ) : null}

      {!targets.length && recent.length ? (
        <>
          <Kicker>Recent</Kicker>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {recent.map((r) => {
              const on = isSelected(r);
              return (
                <span key={`${r.kind}|${r.scope}|${r.name}`} title={`${scopeLabel(r.scope)}${r.district ? ` · D${r.district}` : ''}`} style={{
                  display: 'inline-flex', alignItems: 'center', borderRadius: 999, overflow: 'hidden',
                  border: `1px solid ${on ? 'var(--pa-primary)' : 'var(--pa-border)'}`,
                  background: on ? 'color-mix(in srgb, var(--pa-primary) 22%, transparent)' : 'transparent',
                }}>
                  <button type="button" className="pa-btn" onClick={() => onPick(r)} style={{ padding: '6px 4px 6px 10px', border: 0, background: 'transparent', fontSize: 12.5, cursor: 'pointer', color: on ? 'var(--pa-text)' : 'var(--pa-text-2)', fontWeight: on ? 700 : 400 }}>
                    {titleCase(r.name)}
                  </button>
                  <button type="button" aria-label={`Forget ${titleCase(r.name)}`} onClick={() => onForget(r)} style={{ padding: '4px 8px 4px 4px', border: 0, background: 'transparent', color: 'var(--pa-text-3)', fontSize: 14, lineHeight: 1, cursor: 'pointer' }}>×</button>
                </span>
              );
            })}
          </div>
        </>
      ) : null}

      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 12.5, color: 'var(--pa-text-2)' }}>
        Transactions window (months)
        <input
          type="number" min={3} max={60} value={months} onChange={(e) => setMonths(e.target.value)} inputMode="numeric"
          style={{ ...inputStyle, width: 80, height: 36, padding: '0 10px', textAlign: 'center' }}
        />
      </label>

      {loading ? <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--pa-text-2)', fontSize: 13 }}><Spinner color="var(--pa-primary)" /> Loading transactions…</span> : null}
      {error ? <ErrorLine>{error}</ErrorLine> : null}

      {pack && nums ? (
        <div style={{ border: '1px solid var(--pa-border)', borderRadius: 12, background: 'var(--pa-bg)', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <strong style={{ fontSize: 14 }}>{titleCase(pack.target.name)}{pack.target.district ? ` · D${pack.target.district}` : ''}{pack.target.tenure ? ` · ${pack.target.tenure}` : ''}</strong>
          <Sub>{pack.summary.sales_in_window} sales in the last {pack.target.months} months · {pack.summary.all_time} on record since {String(pack.summary.first_sale ?? '').slice(0, 4)}</Sub>
          <div style={{ display: 'flex', gap: 8 }}>
            {nums.stats.map((x, i) => <Stat key={i} value={x.value} label={x.label} sub={x.sub} />)}
          </div>
        </div>
      ) : null}
    </>
  );
}
