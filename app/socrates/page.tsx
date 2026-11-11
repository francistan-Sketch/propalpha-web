'use client';

import { Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import AlphaMark from '@/components/app/AlphaMark';
import { Spinner } from '@/components/app/States';
import api from '@/lib/api';
import MessageText from '@/components/app/socrates/MessageText';
import { TableCard, ChartCard, TowerCard, YieldCard, InvestmentReturnCard } from '@/components/app/socrates/cards';
import { useSpeech } from '@/components/app/socrates/useSpeech';
import { answerKind, type ChatMessage, type ChatReply, type Conversation } from '@/components/app/socrates/types';
import { describeError } from '@/components/app/search/ui';

// AI Socrates on the web. Same backend as the mobile app: GET /ai/conversations,
// GET /ai/conversations/:id/messages, POST /ai/chat { message, conversation_id? }.
// Layout and states (empty / loading / answer / error) follow the design's #socrates screen.

const PROMPTS = [
  'Show me the tower view for Arina East Residences',
  'Table of the top 5 new launch projects in D15 by units sold, with average psf',
  "How's the resale PSF trending in D15?",
  'What are industrial rents like in Ubi for a 2,000 sqft unit?',
];

const GATED_TEXT = 'AI Socrates is available to agent accounts. Ask Luminaire Proptech to activate.';

type ChatError = { message: string; gated: boolean; question: string | null };

function relTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return d.toLocaleDateString('en-SG', { weekday: 'short' });
  if (days < 14) return 'Last week';
  return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' });
}

function SocratesScreen() {
  const router = useRouter();
  const params = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [input, setInput] = useState('');
  const bootRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onAuth = useCallback((err: unknown): boolean => {
    const { status } = describeError(err, '');
    if (status === 401) { router.replace('/login?reason=session'); return true; }
    return false;
  }, [router]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get('/ai/conversations');
      const list = (res.data?.conversations ?? res.data ?? []) as Conversation[];
      setConversations(Array.isArray(list) ? list : []);
    } catch (err) {
      if (onAuth(err)) return;
      const { status } = describeError(err, '');
      if (status === 403) setError({ message: GATED_TEXT, gated: true, question: null });
    }
  }, [onAuth]);

  const openConversation = useCallback(async (id: number) => {
    setActiveId(id);
    setError(null);
    setLoadingMsgs(true);
    try {
      const res = await api.get(`/ai/conversations/${id}/messages`);
      const list = (res.data?.messages ?? []) as ChatMessage[];
      setMessages(list);
      window.history.replaceState(null, '', `/socrates?conversation=${id}`);
    } catch (err) {
      if (onAuth(err)) return;
      const { status, message } = describeError(err, 'Could not load that conversation.');
      setError({ message: status === 403 ? GATED_TEXT : message, gated: status === 403, question: null });
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  }, [onAuth]);

  const send = useCallback(async (text: string, opts: { reuseBubble?: boolean } = {}) => {
    const q = text.trim();
    if (!q) return;
    setError(null);
    setSending(true);
    if (!opts.reuseBubble) {
      setMessages((prev) => [...prev, { id: `local-${Date.now()}`, role: 'user', content: q, created_at: new Date().toISOString() }]);
    }
    try {
      const res = await api.post('/ai/chat', { message: q, conversation_id: activeId ?? undefined }, { timeout: 120_000 });
      const data = res.data as ChatReply;
      setActiveId(data.conversation_id);
      setMessages((prev) => [...prev, {
        id: `reply-${Date.now()}`, role: 'assistant', content: data.reply, table: data.table, chart: data.chart,
        towerGrid: data.towerGrid, yieldCard: data.yieldCard, investmentReturn: data.investmentReturn, created_at: new Date().toISOString(),
      }]);
      if (data.conversation_id) window.history.replaceState(null, '', `/socrates?conversation=${data.conversation_id}`);
      loadConversations();
    } catch (err) {
      if (onAuth(err)) return;
      const { status, message } = describeError(err, 'The database query timed out. Try again, or narrow the question to one district or project.');
      setError(status === 403 ? { message: GATED_TEXT, gated: true, question: null } : { message, gated: false, question: q });
    } finally {
      setSending(false);
    }
  }, [activeId, loadConversations, onAuth]);

  // Boot once: the conversation list, then either ?conversation=<id> (Dashboard recents) or ?q=<question>
  // (Dashboard and top-bar ask fields) as the first message of a new conversation. The work starts from a
  // cancellable timer so the effect body itself sets no state (and Strict Mode's double-run boots once).
  useEffect(() => {
    const t = setTimeout(() => {
      if (bootRef.current) return;
      bootRef.current = true;
      loadConversations();
      const convo = parseInt(params.get('conversation') || '', 10);
      const q = (params.get('q') || '').trim();
      if (Number.isFinite(convo) && convo > 0) openConversation(convo);
      else if (q) send(q);
    }, 0);
    return () => clearTimeout(t);
  }, [params, loadConversations, openConversation, send]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, sending, error, loadingMsgs]);

  const speech = useSpeech((text, final) => {
    setInput(text);
    if (final) inputRef.current?.focus();
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (sending) return;
    const q = input.trim();
    if (!q) return;
    setInput('');
    speech.stop();
    send(q);
  }

  function startNew() {
    if (sending) return;
    setActiveId(null);
    setMessages([]);
    setError(null);
    setInput('');
    window.history.replaceState(null, '', '/socrates');
    inputRef.current?.focus();
  }

  const empty = !loadingMsgs && messages.length === 0 && !sending && !error;
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <>
      <style>{`
        .soc-grid { display: grid; grid-template-columns: minmax(0, 2fr) 300px; gap: 20px; height: calc(100vh - 64px - 56px); min-height: 560px; }
        @media (max-width: 860px) { .soc-grid { height: calc(100dvh - 64px - 64px - 32px); min-height: 480px; } }
        .soc-chip:hover { border-color: var(--pa-primary) !important; color: var(--pa-text) !important; }
      `}</style>
      <div className="soc-grid pa-2col">
        {/* Conversation */}
        <section aria-label="Conversation" style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--pa-border)', borderRadius: 18, background: 'color-mix(in srgb, var(--pa-card) 70%, transparent)', overflow: 'hidden', minHeight: 0, minWidth: 0 }}>
          <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {empty && (
              <div style={{ margin: 'auto', maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
                <AlphaMark size={44} radius={12} fontSize={20} />
                <h2 style={{ fontSize: 24 }}>Ask Socrates anything about Singapore property.</h2>
                <p style={{ fontSize: 14.5, color: 'var(--pa-text-2)' }}>Tables, charts, tower views, yield and IRR cards, built from PropAlpha&apos;s own transaction database.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {PROMPTS.map((q) => (
                    <button key={q} type="button" className="soc-chip" onClick={() => send(q)} style={{ padding: '8px 12px', borderRadius: 999, border: '1px solid var(--pa-border)', background: 'transparent', color: 'var(--pa-text-2)', fontSize: 13, cursor: 'pointer', textAlign: 'left', transition: 'border-color .15s, color .15s' }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loadingMsgs && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--pa-text-2)' }}><Spinner />Loading conversation…</div>
            )}

            {messages.map((m) => (m.role === 'user' ? (
              <div key={m.id} style={{ alignSelf: 'flex-end', maxWidth: '70%', padding: '12px 16px', borderRadius: '16px 16px 4px 16px', background: 'var(--pa-primary)', color: '#fff', fontSize: 15, lineHeight: 1.45, overflowWrap: 'anywhere' }}>
                {m.content}
              </div>
            ) : (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 820, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--pa-text-2)' }}>
                  <AlphaMark size={18} radius={5} fontSize={10} />Socrates · {answerKind(m)}
                </div>
                <MessageText text={m.content} />
                {m.towerGrid?.blocks?.length ? <TowerCard towerGrid={m.towerGrid} /> : null}
                {m.table?.columns?.length ? <TableCard table={m.table} /> : null}
                {m.chart?.labels?.length ? <ChartCard chart={m.chart} /> : null}
                {m.yieldCard?.project_name ? <YieldCard yieldCard={m.yieldCard} /> : null}
                {m.investmentReturn ? <InvestmentReturnCard ir={m.investmentReturn} /> : null}
              </div>
            )))}

            {sending && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--pa-text-2)' }}>
                  <Spinner />Socrates is querying the transaction database… this can take a few seconds to a minute.
                </div>
                <div className="pa-pulse" style={{ width: '60%', height: 120, borderRadius: 14, border: '1px solid var(--pa-border)', background: 'var(--pa-card)' }} />
              </>
            )}

            {error && (
              <div role="alert" style={{ maxWidth: 520, padding: '16px 18px', borderRadius: 14, border: '1px solid rgba(248,113,113,.5)', background: 'rgba(248,113,113,.1)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <strong style={{ fontSize: 14.5, color: '#F87171' }}>{error.gated ? 'AI Socrates is not active on this account.' : 'Socrates could not finish that answer.'}</strong>
                <span style={{ fontSize: 13.5, color: 'var(--pa-text-2)' }}>{error.message}</span>
                {error.question && (
                  <button type="button" className="pa-btn" onClick={() => send(error.question!, { reuseBubble: true })} style={{ alignSelf: 'flex-start', height: 34, padding: '0 14px', borderRadius: 8, border: '1px solid var(--pa-border)', background: 'var(--pa-card)', color: 'var(--pa-text)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    Try again
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--pa-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11.5, color: 'var(--pa-text-3)' }}>
              As generative AI approaches human-level data intelligence, Socrates can still make mistakes and should not be taken as a replacement for actual human advisory.{' '}
              <Link href="/#trust" className="pa-link" style={{ color: 'var(--pa-text-2)', textDecoration: 'underline', textUnderlineOffset: 2 }}>Learn more</Link>
            </span>
            <form onSubmit={submit} style={{ display: 'flex', alignItems: 'center', gap: 10, height: 50, padding: '0 6px 0 16px', borderRadius: 14, border: '1px solid var(--pa-border)', background: 'var(--pa-bg)', opacity: error?.gated ? 0.6 : 1 }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={sending ? 'Socrates is thinking…' : speech.listening ? 'Listening…' : 'Ask in plain English…'}
                disabled={sending || !!error?.gated}
                aria-label="Ask Socrates"
                style={{ flex: 1, minWidth: 0, border: 0, background: 'transparent', color: 'var(--pa-text)', fontSize: 15, outline: 'none' }}
              />
              {speech.supported && (
                <button type="button" onClick={speech.toggle} disabled={sending} aria-label={speech.listening ? 'Stop listening' : 'Speak'} aria-pressed={speech.listening} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid', borderColor: speech.listening ? 'var(--pa-amber)' : 'var(--pa-border)', background: speech.listening ? 'color-mix(in srgb, var(--pa-amber) 18%, transparent)' : 'transparent', color: speech.listening ? 'var(--pa-amber)' : 'var(--pa-text-2)', cursor: 'pointer', fontSize: 12, fontWeight: 700, flex: 'none' }}>
                  Mic
                </button>
              )}
              <button type="submit" className="pa-btn" disabled={sending || !input.trim() || !!error?.gated} style={{ height: 38, padding: '0 16px', borderRadius: 10, border: 0, background: 'var(--pa-primary)', color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: sending ? 'default' : 'pointer', opacity: sending || !input.trim() ? 0.55 : 1, display: 'inline-flex', alignItems: 'center', gap: 8, flex: 'none' }}>
                {sending ? <Spinner size={14} light /> : null}Ask
              </button>
            </form>
          </div>
        </section>

        {/* Conversations */}
        <aside className="pa-hide-m" aria-label="Conversations" style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--pa-text-3)' }}>Conversations</h3>
            <button type="button" onClick={startNew} style={{ border: 0, background: 'transparent', color: 'var(--pa-text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>New</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflow: 'auto' }}>
            {conversations.length === 0 && !error?.gated && (
              <span style={{ fontSize: 12.5, color: 'var(--pa-text-3)', padding: '4px 2px' }}>Your conversations appear here.</span>
            )}
            {conversations.map((c) => {
              const on = c.id === activeId;
              return (
                <button key={c.id} type="button" className="pa-row" onClick={() => openConversation(c.id)} disabled={sending} style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 12, border: '1px solid', borderColor: on ? 'var(--pa-primary)' : 'var(--pa-border)', background: on ? 'color-mix(in srgb, var(--pa-primary) 14%, var(--pa-card))' : 'var(--pa-card)', color: 'var(--pa-text)', fontSize: 13.5, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.title || 'Untitled'}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--pa-text-3)' }}>{relTime(c.updated_at || c.created_at)}</span>
                </button>
              );
            })}
          </div>
          {lastAssistant && (
            <span style={{ fontSize: 11.5, color: 'var(--pa-text-3)', marginTop: 'auto' }}>Figures are a snapshot of PropAlpha&apos;s transaction database as at the latest URA release.</span>
          )}
        </aside>
      </div>
    </>
  );
}

export default function SocratesPage() {
  return (
    <AppLayout title="AI Socrates" subtitle="URA data to Oct 2026">
      <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--pa-text-2)' }}><Spinner />Loading…</div>}>
        <SocratesScreen />
      </Suspense>
    </AppLayout>
  );
}
