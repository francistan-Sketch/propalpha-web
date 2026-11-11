'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import { Field, Input } from './ui';

// Project name field with GET /search/suggest autocomplete (300ms debounce, min 2 chars).
// The backend answers { projects: string[] }; the older keys are kept as fallbacks.

interface Suggestion { name?: string; projectName?: string; id?: string | number }

function normalise(data: unknown): string[] {
  const d = data as { projects?: unknown; suggestions?: unknown; results?: unknown; data?: unknown };
  const list = Array.isArray(data) ? data : d?.projects || d?.suggestions || d?.results || d?.data || [];
  if (!Array.isArray(list)) return [];
  return list.map((s: string | Suggestion) => (typeof s === 'string' ? s : String(s.name || s.projectName || ''))).filter(Boolean);
}

type Props = {
  value: string;
  onChange: (v: string) => void;
  /** Called when a suggestion is picked (not on every keystroke). */
  onPick?: (v: string) => void;
  label?: string;
  placeholder?: string;
  autoFocus?: boolean;
  style?: React.CSSProperties;
};

export default function ProjectField({ value, onChange, onPick, label = 'Project', placeholder = 'e.g. Arina East Residences', autoFocus, style }: Props) {
  const [items, setItems] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const picked = useRef<string | null>(null);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2 || picked.current === q) {
      if (timer.current) clearTimeout(timer.current);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setBusy(true);
      try {
        const res = await api.get('/search/suggest', { params: { q } });
        const list = normalise(res.data);
        setItems(list);
        setOpen(list.length > 0);
      } catch {
        setItems([]);
        setOpen(false);
      } finally {
        setBusy(false);
      }
    }, 300);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [value]);

  function pick(name: string) {
    picked.current = name;
    onChange(name);
    onPick?.(name);
    setOpen(false);
    setItems([]);
  }

  return (
    <Field label={label} style={style}>
      <Input
        type="text"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => { picked.current = null; onChange(e.target.value); }}
        onFocus={() => { if (items.length) setOpen(true); }}
        onBlur={() => { setTimeout(() => setOpen(false), 150); }}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      {busy && <span aria-hidden="true" style={{ position: 'absolute', right: 10, bottom: 11, fontSize: 11, color: 'var(--pa-text-3)', textTransform: 'none', letterSpacing: 0 }}>…</span>}
      {open && items.length > 0 && (
        <div role="listbox" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 40, maxHeight: 260, overflow: 'auto', borderRadius: 12, border: '1px solid var(--pa-border)', background: 'var(--pa-surface)', boxShadow: 'var(--pa-shadow)', padding: 6, display: 'flex', flexDirection: 'column', gap: 2, textTransform: 'none', letterSpacing: 0 }}>
          {items.map((name) => (
            <button key={name} type="button" role="option" aria-selected={name === value} className="pa-row" onMouseDown={() => pick(name)} style={{ textAlign: 'left', padding: '9px 10px', borderRadius: 8, border: 0, background: 'transparent', color: 'var(--pa-text)', fontSize: 13.5, cursor: 'pointer' }}>
              {name}
            </button>
          ))}
        </div>
      )}
    </Field>
  );
}
