'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Spinner } from '@/components/app/States';
import { GREEN, RED, useDebounced } from '@/components/app/ownership/ui';

// Inline picker panel: the web form of the app's full-screen street / project pickers. A search field (when
// `searchable`), a list of rows with the module's current/outdated counts, Close. `load` runs on open and on
// each debounced change to the typed text (250 ms, as the app does).

export interface PickRow { key: string; label: ReactNode; sub?: ReactNode; current?: number; outdated?: number }

export function PickerPanel({ title, placeholder, searchable = true, load, onPick, onClose, empty = 'Nothing matches.' }: {
  title: string;
  placeholder?: string;
  searchable?: boolean;
  load: (q: string) => Promise<PickRow[]>;
  onPick: (key: string) => void;
  onClose: () => void;
  empty?: string;
}) {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<PickRow[]>([]);
  const [busy, setBusy] = useState(false);
  const dq = useDebounced(q, 250);

  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      setBusy(true);
      load(dq).then((r) => { if (live) setRows(r); }).catch(() => { if (live) setRows([]); }).finally(() => { if (live) setBusy(false); });
    }, 0);
    return () => { live = false; clearTimeout(t); };
  }, [dq, load]);

  return (
    <div role="dialog" aria-label={title} style={{ border: '1px solid var(--pa-border)', borderRadius: 14, background: 'var(--pa-surface)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <strong style={{ fontSize: 14, flex: 1, minWidth: 0 }}>{title}</strong>
        {busy && <Spinner size={14} />}
        <button type="button" onClick={onClose} style={{ border: 0, background: 'transparent', color: 'var(--pa-text-2)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Close</button>
      </div>
      {searchable && (
        <input
          type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} autoFocus autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-label={placeholder}
          style={{ height: 38, width: '100%', padding: '0 12px', borderRadius: 9, border: '1px solid var(--pa-border)', background: 'var(--pa-bg)', color: 'var(--pa-text)', fontSize: 14 }}
        />
      )}
      <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {rows.map((r) => (
          <button key={r.key} type="button" onClick={() => onPick(r.key)} className="pa-row"
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 6px', border: 0, borderBottom: '1px solid var(--pa-border)', background: 'transparent', color: 'var(--pa-text)', textAlign: 'left', cursor: 'pointer', fontSize: 14, minWidth: 0 }}>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <span style={{ overflowWrap: 'anywhere' }}>{r.label}</span>
              {r.sub && <span style={{ fontSize: 11, color: 'var(--pa-text-3)' }}>{r.sub}</span>}
            </span>
            {r.current != null && <span style={{ color: GREEN, fontSize: 12, width: 42, textAlign: 'right', flex: 'none', fontVariantNumeric: 'tabular-nums' }}>{r.current}</span>}
            {r.outdated != null && <span style={{ color: RED, fontSize: 12, width: 42, textAlign: 'right', flex: 'none', fontVariantNumeric: 'tabular-nums' }}>{r.outdated}</span>}
          </button>
        ))}
        {!busy && !rows.length && <span style={{ padding: '20px 0', textAlign: 'center', fontSize: 13, color: 'var(--pa-text-3)' }}>{empty}</span>}
      </div>
    </div>
  );
}
