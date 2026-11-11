'use client';

import { useMemo, useState, type CSSProperties } from 'react';

// Tower grid from the design: 36px floor column + one column per stack, 22px cells, 4px gap,
// Low #10B981 / Mid #F59E0B / High #EF4444 / Resold #7028B8. Fed by `blocks` as returned by both
// GET /newlaunch/units and the Socrates render_tower_grid tool (same unit shape).

export interface TowerUnit {
  id?: number;
  unit_no?: string | null;
  floor?: number | null;
  stack?: string | null;
  area_sqft?: number | string | null;
  price?: number | string | null;
  psf?: number | string | null;
  new_sale_psf?: number | string | null;
  sale_date?: string | null;
  property_type?: string | null;
  type_of_sale?: string | null;
}

export interface TowerBlock {
  block_id: string;
  units_sold?: number | string;
  min_floor?: number;
  max_floor?: number;
  avg_psf?: number | string | null;
  min_psf?: number | string | null;
  max_psf?: number | string | null;
  avg_price?: number | string | null;
  units: TowerUnit[];
}

export const TOWER_COLORS = { low: '#10B981', mid: '#F59E0B', high: '#EF4444', resold: '#7028B8' } as const;
export type TowerTier = keyof typeof TOWER_COLORS;

export function num(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

export function fmtInt(v: number | string | null | undefined): string {
  const n = num(v);
  return n === null ? '—' : Math.round(n).toLocaleString('en-SG');
}

export function fmtMoney(v: number | string | null | undefined): string {
  const n = num(v);
  if (n === null) return '—';
  const r = Math.round(n);
  if (Math.abs(r) >= 1_000_000) return `$${(r / 1_000_000).toFixed(2)}M`;
  return `$${r.toLocaleString('en-SG')}`;
}

export function isResoldUnit(u: TowerUnit): boolean {
  return u.type_of_sale === 'Sub Sale' || u.type_of_sale === 'Resale';
}

// Mirrors the mobile app's tiering: thirds of the block's New Sale psf range.
export function towerTier(u: TowerUnit, minPsf: number, maxPsf: number): TowerTier {
  if (isResoldUnit(u)) return 'resold';
  const psf = num(u.new_sale_psf) ?? num(u.psf);
  if (psf === null || minPsf === maxPsf) return 'mid';
  const range = maxPsf - minPsf;
  if (psf < minPsf + range / 3) return 'low';
  if (psf < minPsf + (2 * range) / 3) return 'mid';
  return 'high';
}

export function TowerLegend({ style }: { style?: CSSProperties }) {
  const items: [TowerTier, string][] = [['low', 'Low'], ['mid', 'Mid'], ['high', 'High'], ['resold', 'Resold']];
  return (
    <div style={{ display: 'flex', gap: 12, fontSize: 11.5, color: 'var(--pa-text-2)', flexWrap: 'wrap', ...style }}>
      {items.map(([k, label]) => (
        <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <i aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 2, background: TOWER_COLORS[k], display: 'inline-block' }} />
          {label}
        </span>
      ))}
    </div>
  );
}

export function useBlockGrid(block: TowerBlock | undefined) {
  return useMemo(() => {
    const units = block?.units ?? [];
    const floorSet = new Set<number>();
    const stackSet = new Set<string>();
    const map: Record<number, Record<string, TowerUnit>> = {};
    const psfs: number[] = [];
    for (const u of units) {
      if (u.floor === null || u.floor === undefined || !u.stack) continue;
      floorSet.add(u.floor);
      stackSet.add(u.stack);
      (map[u.floor] ??= {})[u.stack] = u;
      const p = num(u.new_sale_psf) ?? num(u.psf);
      if (p !== null) psfs.push(p);
    }
    return {
      floors: Array.from(floorSet).sort((a, b) => b - a),
      stacks: Array.from(stackSet).sort(),
      unitMap: map,
      minPsf: psfs.length ? Math.min(...psfs) : 0,
      maxPsf: psfs.length ? Math.max(...psfs) : 0,
    };
  }, [block]);
}

type Props = {
  blocks: TowerBlock[];
  /** Max height of the scrolling grid area. */
  maxHeight?: number;
  onUnitClick?: (unit: TowerUnit, block: TowerBlock) => void;
  selected?: TowerUnit | null;
  /** Controlled block index (for a block picker rendered elsewhere). */
  blockIndex?: number;
  onBlockChange?: (i: number) => void;
  /** Show the block chips inside the grid (default true when there is more than one block). */
  showBlockChips?: boolean;
};

/** The grid itself: stack headers across, floors down, one coloured cell per transacted unit. */
export default function TowerGrid({ blocks, maxHeight = 420, onUnitClick, selected, blockIndex, onBlockChange, showBlockChips = true }: Props) {
  const [localIdx, setLocalIdx] = useState(0);
  const idx = Math.min(blockIndex ?? localIdx, Math.max(blocks.length - 1, 0));
  const block = blocks[idx];
  const { floors, stacks, unitMap, minPsf, maxPsf } = useBlockGrid(block);
  const showLabel = stacks.length <= 12;

  function pick(i: number) {
    setLocalIdx(i);
    onBlockChange?.(i);
  }

  if (!block || !floors.length) {
    return <span style={{ fontSize: 13, color: 'var(--pa-text-2)' }}>No floor and stack data for this block.</span>;
  }

  const head: CSSProperties = { height: 22, display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 700, color: 'var(--pa-text-3)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
      {showBlockChips && blocks.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {blocks.map((b, i) => (
            <button
              key={b.block_id}
              type="button"
              onClick={() => pick(i)}
              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid', borderColor: i === idx ? 'var(--pa-primary)' : 'var(--pa-border)', background: i === idx ? 'var(--pa-primary)' : 'transparent', color: i === idx ? '#fff' : 'var(--pa-text-2)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
            >
              {b.block_id}
            </button>
          ))}
        </div>
      )}
      <div style={{ overflow: 'auto', maxHeight }}>
        <div style={{ display: 'grid', gridTemplateColumns: `36px repeat(${stacks.length}, minmax(${showLabel ? 40 : 22}px, 1fr))`, gap: 4, fontSize: 10.5, minWidth: 0 }}>
          <div style={head} />
          {stacks.map((s) => (
            <div key={s} title={`Stack ${s}`} style={head}>{s}</div>
          ))}
          {floors.map((f) => (
            <FloorRow key={f} floor={f} stacks={stacks} row={unitMap[f] ?? {}} minPsf={minPsf} maxPsf={maxPsf} showLabel={showLabel} block={block} onUnitClick={onUnitClick} selected={selected} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FloorRow({ floor, stacks, row, minPsf, maxPsf, showLabel, block, onUnitClick, selected }: {
  floor: number; stacks: string[]; row: Record<string, TowerUnit>; minPsf: number; maxPsf: number; showLabel: boolean; block: TowerBlock;
  onUnitClick?: (u: TowerUnit, b: TowerBlock) => void; selected?: TowerUnit | null;
}) {
  return (
    <>
      <div title={`Floor ${floor}`} style={{ height: 22, display: 'grid', placeItems: 'center', fontWeight: 700, color: 'var(--pa-text-3)' }}>#{floor}</div>
      {stacks.map((s) => {
        const u = row[s];
        if (!u) return <div key={s} title={`#${String(floor).padStart(2, '0')}-${s} · no transaction`} style={{ height: 22, borderRadius: 4, background: 'var(--pa-bg)' }} />;
        const tier = towerTier(u, minPsf, maxPsf);
        const title = `${u.unit_no ?? `#${floor}-${s}`} · $${fmtInt(u.psf)} psf${u.area_sqft ? ` · ${fmtInt(u.area_sqft)} sqft` : ''}${u.sale_date ? ` · ${u.sale_date}` : ''}${u.type_of_sale ? ` · ${u.type_of_sale}` : ''}`;
        const isSel = selected ? selected === u || (selected.unit_no && selected.unit_no === u.unit_no && selected.sale_date === u.sale_date) : false;
        const cell: CSSProperties = {
          height: 22, borderRadius: 4, background: TOWER_COLORS[tier], color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 600,
          fontSize: 10.5, overflow: 'hidden', whiteSpace: 'nowrap', border: 0, padding: 0, cursor: onUnitClick ? 'pointer' : 'default',
          outline: isSel ? '2px solid var(--pa-text)' : undefined, outlineOffset: 1, fontVariantNumeric: 'tabular-nums',
        };
        const label = showLabel ? fmtInt(u.psf) : '';
        return onUnitClick ? (
          <button key={s} type="button" title={title} aria-label={title} onClick={() => onUnitClick(u, block)} style={cell}>{label}</button>
        ) : (
          <div key={s} title={title} style={cell}>{label}</div>
        );
      })}
    </>
  );
}

/** Units of one block as CSV rows, for the "Download CSV" action. */
export function towerBlocksToCsv(projectName: string, blocks: TowerBlock[]): string {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [['project', 'block', 'unit', 'floor', 'stack', 'area_sqft', 'price', 'psf', 'new_sale_psf', 'sale_date', 'type_of_sale'].join(',')];
  for (const b of blocks) {
    for (const u of b.units) {
      lines.push([projectName, b.block_id, u.unit_no, u.floor, u.stack, u.area_sqft, u.price, u.psf, u.new_sale_psf, u.sale_date, u.type_of_sale].map(esc).join(','));
    }
  }
  return lines.join('\n');
}
