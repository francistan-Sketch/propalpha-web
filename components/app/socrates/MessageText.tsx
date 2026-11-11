import type { ReactNode } from 'react';

// Socrates writes markdown-flavoured prose (headings, bold, bullets, rules, the italic
// "_(Cut off — …)_" note when a reply hits max_tokens). This renders that subset; anything
// else is shown as plain text.

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${keyBase}-${i++}`;
    if (tok.startsWith('**')) out.push(<strong key={k}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('`')) out.push(<code key={k} style={{ fontSize: '0.92em', padding: '1px 5px', borderRadius: 4, background: 'var(--pa-bg)', border: '1px solid var(--pa-border)' }}>{tok.slice(1, -1)}</code>);
    else out.push(<em key={k} style={{ color: 'var(--pa-text-2)' }}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function MessageText({ text, style }: { text: string; style?: React.CSSProperties }) {
  const lines = (text || '').replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) {
      const k = `p${blocks.length}`;
      blocks.push(<p key={k} style={{ margin: 0 }}>{inline(para.join(' '), k)}</p>);
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      const k = `l${blocks.length}`;
      const items = list.items.map((it, i) => <li key={i} style={{ margin: '2px 0' }}>{inline(it, `${k}-${i}`)}</li>);
      blocks.push(list.ordered ? <ol key={k} style={{ margin: 0, paddingLeft: 22 }}>{items}</ol> : <ul key={k} style={{ margin: 0, paddingLeft: 20 }}>{items}</ul>);
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const t = line.trim();
    if (!t) { flushPara(); flushList(); continue; }
    if (/^[-*_]{3,}$/.test(t)) { flushPara(); flushList(); continue; }
    const h = t.match(/^#{1,6}\s+(.*)$/);
    if (h) {
      flushPara(); flushList();
      blocks.push(<strong key={`h${blocks.length}`} style={{ display: 'block', fontSize: '1.02em', marginTop: 4 }}>{inline(h[1], `h${blocks.length}`)}</strong>);
      continue;
    }
    const ul = t.match(/^[-*+•]\s+(.*)$/);
    const ol = t.match(/^\d+[.)]\s+(.*)$/);
    if (ul || ol) {
      flushPara();
      const ordered = !!ol;
      if (!list || list.ordered !== ordered) { flushList(); list = { ordered, items: [] }; }
      list.items.push((ul ?? ol)![1]);
      continue;
    }
    if (list) flushList();
    para.push(t);
  }
  flushPara();
  flushList();

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14.5, color: 'var(--pa-text)', lineHeight: 1.5, overflowWrap: 'anywhere', ...style }}>{blocks}</div>;
}
