'use client';

import { Suspense, useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import AlphaMark from '@/components/app/AlphaMark';
import { Spinner } from '@/components/app/States';
import api from '@/lib/api';
import MessageText from '@/components/app/socrates/MessageText';
import { TableCard, ChartCard, TowerCard, YieldCard, InvestmentReturnCard } from '@/components/app/socrates/cards';
import { useSpeech } from '@/components/app/socrates/useSpeech';
import { answerKind, type ChatMessage, type ChatReply, type Conversation } from '@/components/app/socrates/types';

// AI Socrates on the web (design: PropAlpha-App.dc.html #socrates). Same backend as the mobile app:
// GET /ai/conversations, GET /ai/conversations/:id/messages, POST /ai/chat { message, conversation_id? }.

const PROMPTS = [
  'Show me the tower view for Arina East Residences',
  'Table of the top 5 new launch projects in D15 by units sold, with average psf',
  "How's the resale PSF trending in D15?",
  'What are industrial rents like in Ubi for a 2,000 sqft unit?',
];

const DISCLOSURE = 'As generative AI approaches human-level data intelligence, Socrates can still make mistakes and should not be taken as a replacement for actual human advisory.';
const ACTIVATE = 'AI Socrates is available to agent accounts. Ask Luminaire Proptech to activate.';

type ChatError = { title: string; message: string; retry?: string; activation?: boolean };

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

function errorOf(err: unknown): { status?: number; message?: string; timeout: boolean } {
  const e = err as { response?: { status?: number; data?: { error?: string; message?: string } }; code?: string };
  return { status: e?.response?.status, message: e?.response?.data?.error || e?.response?.data?.message, timeout: e?.code === 'ECONNABORTED' };
}

export default function SocratesPage() {
  return (
    <AppLayout title="AI Socrates" subtitle="URA data to Oct 2026">
      <Suspense fallback={null}>
        <SocratesScreen />
      </Suspense>
    </AppLayout>
  );
}

function SocratesScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const initialQ = params.get('q') || '';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [pendingQ, setPendingQ] = useState<string | null>(null);
  const [error, setError] = useState<ChatError | null>(null);
  const [input, setInput] = useState('');
  const [locked, setLocked] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sentInitial = useRef(false);
  const activeRef = useRef<number | null>(null);
  activeRef.current = activeId;

  const speech = useSpeech((text, final) => {
    setInput(text);
    if (final) inputRef.current?.focus();
  });

  const handleAuth = useCallback((status?: number): boolean => {
    if (status === 401) { router.replace('/login?reason=session'); return true; }
    if (status === 403) { setLocked(true); setError({ title: 'Socrates is not active on this account.', message: ACTIVATE, activation: true }); return true; }
    return false;
  }, [router]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get('/ai/conversations');
      const list = (res.data?.conversations ?? res.data ?? []) as Conversation[];
      setConversations(Array.isArray(list) ? list : []);
    } catch (err) {
      handleAuth(errorOf(err).status);
    }
  }, [handleAuth]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending, error]);

  const send = useCallback(async (raw: string) => {
    const text = raw.trim();
    if (!text || sending || locked) return;
    setInput('');
    setError(null);
    setSending(true);
    setPendingQ(text);
    const optimistic: ChatMessage = { id: `local-${Date.now()}`, role: 'user', content: text, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const res = await api.post('/ai/chat', { message: text, conversation_id: activeRef.current ?? undefined }, { timeout: 120_000 });
      const r = res.data as ChatReply;
      setActiveId(r.conversation_id);
      setMessages((prev) => [...prev, {
        id: `reply-${Date.now()}`, role: 'assistant', content: r.reply,
        table: r.table, chart: r.chart, towerGrid: r.towerGrid, yieldCard: r.yieldCard, investmentReturn: r.investmentReturn,
        created_at: new Date().toISOString(),
      }]);
      setPendingQ(null);
      loadConversations();
    } catch (err) {
      const e = errorOf(err);
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      if (!handleAuth(e.status)) {
        setError({
          title: 'Socrates could not finish that answer.',
          message: e.timeout ? 'The database query timed out. Try again, or narrow the question to one district or project.' : (e.message || 'Try again, or narrow the question to one district or project.'),
          retry: text,
        });
      }
    } finally {
      setSending(false);
    }
  }, [sending, locked, handleAuth, loadConversations]);

  // ?q= from the dashboard or the top bar: send once as the first message.
  useEffect(() => {
    if (!initialQ || sentInitial.current) return;
    sentInitial.current = true;
    send(initialQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ]);

  async function openConversation(id: number) {
    if (sending) return;
    setActiveId(id);
    setError(null);
    setLoadingMsgs(true);
    try {
      const res = await api.get(`/ai/conversations/${id}/messages`);
      const list = (res.data?.messages ?? []) as ChatMessage[];
      setMessages(list);
    } catch (err) {
      if (!handleAuth(errorOf(err).status)) setError({ title: 'Could not load that conversation.', message: 'Try again in a moment.' });
    } finally {
      setLoadingMsgs(false);
    }
  }

  function newChat() {
    if (sending) return;
    setActiveId(null);
    setMessages([]);
    setError(null);
    setInput('');
    inputRef.current?.focus();
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (speech.listening) speech.stop();
    send(input);
  }

  const empty = !loadingMsgs && messages.length === 0 && !sending && !error;
  const disabled = sending || locked;

  const chatBtn: CSSProperties = { height: 34, padding: '0 14px', borderRadius: 8, border: '1px solid var(--pa-border)', background: 'var(--pa-card)', color: 'var(--pa-text)', fontWeight: 600, fontSize: 13, cursor: 'pointer', alignSelf: 'flex-start' };

  return (
    <div className="pa-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) 300px', gap: 20, height: 'calc(100vh - 64px - 56px)', minHeight: 560 }}>
      {/* Conversation */}
      <section style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--pa-border)', borderRadius: 18, background: 'color-mix(in srgb, var(--pa-card) 70%, transparent)', overflow: 'hidden', minHeight: 0, minWidth: 0 }}>
        <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {empty && (
            <div style={{ margin: 'auto', maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
              <AlphaMark size={44} radius={12} fontSize={20} />
              <h2 style={{ fontSize: 24 }}>Ask Socrates anything about Singapore property.</h2>
              <p style={{ fontSize: 14.5, color: 'var(--pa-text-2)' }}>Tables, charts, tower views, yield and IRR cards, built from PropAlpha&apos;s own transaction database.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {PROMPTS.map((q) => (
                  <button key={q} type="button" className="pa-row" onClick={() => send(q)} disabled={locked} style={{ padding: '8px 12px', borderRadius: 999, border: '1px solid var(--pa-border)', background: 'transparent', color: 'var(--pa-text-2)', fontSize: 13, cursor: locked ? 'default' : 'pointer', textAlign: 'left' }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loadingMsgs && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--pa-text-2)' }}><Spinner />Loading conversation…</div>
          )}

          {messages.map((m) => (
            m.role === 'user' ? (
              <div key={m.id} style={{ alignSelf: 'flex-end', maxWidth: '70%', padding: '12px 16px', borderRadius: '16px 16px 4px 16px', background: 'var(--pa-primary)', color: '#fff', fontSize: 15, lineHeight: 1.45, overflowWrap: 'anywhere' }}>
                {m.content}
              </div>
            ) : (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 820, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--pa-text-2)' }}><AlphaMark size={18} radius={5} fontSize={10} />Socrates · {answerKind(m)}</div>
                <MessageText text={m.content} />
                {m.towerGrid?.blocks?.length ? <TowerCard towerGrid={m.towerGrid} /> : null}
                {m.table?.columns?.length ? <TableCard table={m.table} /> : null}
                {m.chart?.labels?.length ? <ChartCard chart={m.chart} /> : null}
                {m.yieldCard?.project_name ? <YieldCard yieldCard={m.yieldCard} /> : null}
                {m.investmentReturn ? <InvestmentReturnCard ir={m.investmentReturn} /> : null}
              </div>
            )
          ))}

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
              <strong style={{ fontSize: 14.5, color: '#F87171' }}>{error.title}</strong>
              <span style={{ fontSize: 13.5, color: 'var(--pa-text-2)' }}>{error.message}</span>
              {error.retry && <button type="button" className="pa-btn" onClick={() => send(error.retry!)} style={chatBtn}>Try again</button>}
              {error.activation && <Link href="/profile" className="pa-btn" style={{ ...chatBtn, display: 'inline-flex', alignItems: 'center' }}>Your plan</Link>}
            </div>
          )}
        </div>

        <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--pa-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 11.5, color: 'var(--pa-text-3)' }}>
            {DISCLOSURE} <Link href="/#trust" className="pa-link" style={{ color: 'var(--pa-text-2)', textDecoration: 'underline', textUnderlineOffset: 2 }}>Learn more</Link>
          </span>
          <form onSubmit={submit} style={{ display: 'flex', alignItems: 'center', gap: 10, height: 50, padding: '0 6px 0 16px', borderRadius: 14, border: '1px solid var(--pa-border)', background: 'var(--pa-bg)', opacity: locked ? 0.6 : 1 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={locked ? ACTIVATE : sending ? (pendingQ ? 'Waiting for Socrates…' : 'Thinking…') : speech.listening ? 'Listening…' : 'Ask in plain English…'}
              disabled={disabled}
              aria-label="Ask Socrates"
              style={{ flex: 1, minWidth: 0, border: 0, background: 'transparent', color: 'var(--pa-text)', fontSize: 15, outline: 'none' }}
            />
            {speech.supported && (
              <button
                type="button"
                aria-label={speech.listening ? 'Stop listening' : 'Speak'}
                aria-pressed={speech.listening}
                onClick={speech.toggle}
                disabled={disabled}
                style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid', borderColor: speech.listening ? 'var(--pa-amber)' : 'var(--pa-border)', background: speech.listening ? 'color-mix(in srgb, var(--pa-amber) 18%, transparent)' : 'transparent', color: speech.listening ? 'var(--pa-amber)' : 'var(--pa-text-2)', cursor: disabled ? 'default' : 'pointer', fontSize: 12, fontWeight: 700, flex: 'none' }}
              >
                Mic
              </button>
            )}
            <button type="submit" className="pa-btn" disabled={disabled || !input.trim()} style={{ height: 38, padding: '0 16px', borderRadius: 10, border: 0, background: 'var(--pa-primary)', color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: disabled || !input.trim() ? 'default' : 'pointer', opacity: disabled || !input.trim() ? 0.55 : 1, flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {sending && <Spinner size={13} light />}Ask
            </button>
          </form>
        </div>
      </section>

      {/* Conversations */}
      <aside className="pa-hide-m" style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--pa-text-3)' }}>Conversations</h3>
          <button type="button" onClick={newChat} style={{ border: 0, background: 'transparent', color: 'var(--pa-text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>New</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflow: 'auto' }}>
          {conversations.length === 0 && (
            <span style={{ fontSize: 12.5, color: 'var(--pa-text-3)', padding: '8px 2px' }}>{locked ? ACTIVATE : 'Your conversations will appear here.'}</span>
          )}
          {conversations.map((c) => {
            const on = c.id === activeId;
            return (
              <button
                key={c.id}
                type="button"
                className="pa-row"
                onClick={() => openConversation(c.id)}
                aria-current={on ? 'true' : undefined}
                style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 12, border: '1px solid', borderColor: on ? 'var(--pa-primary)' : 'var(--pa-border)', background: on ? 'color-mix(in srgb, var(--pa-primary) 12%, var(--pa-card))' : 'var(--pa-card)', color: 'var(--pa-text)', fontSize: 13.5, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4 }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.title || 'Conversation'}</span>
                <span style={{ fontSize: 11.5, color: 'var(--pa-text-3)' }}>{relTime(c.updated_at || c.created_at)}</span>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
