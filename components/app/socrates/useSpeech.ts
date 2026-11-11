'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

// Web Speech API dictation for the Mic button. `supported` is false (button hidden) where
// neither window.SpeechRecognition nor window.webkitSpeechRecognition exists (Firefox, most in-app browsers).

interface RecognitionResultLike { isFinal: boolean; 0: { transcript: string } }
interface RecognitionEventLike { resultIndex: number; results: ArrayLike<RecognitionResultLike> }
interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: RecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => RecognitionLike;

function getCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

// Browser capability never changes during a session: read it through useSyncExternalStore so the
// server render (false) and the client (true where available) reconcile without an effect.
const noop = () => () => {};
const clientHasSpeech = () => !!getCtor();
const serverHasSpeech = () => false;

export function useSpeech(onTranscript: (text: string, final: boolean) => void) {
  const supported = useSyncExternalStore(noop, clientHasSpeech, serverHasSpeech);
  const [listening, setListening] = useState(false);
  const recRef = useRef<RecognitionLike | null>(null);
  const cbRef = useRef(onTranscript);

  // Keep the latest callback without re-creating the recogniser.
  useEffect(() => { cbRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => () => { recRef.current?.abort(); }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    recRef.current?.abort();
    const rec = new Ctor();
    rec.lang = 'en-SG';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      let text = '';
      let final = false;
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        if (e.results[i].isFinal) final = true;
      }
      cbRef.current(text.trim(), final);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, []);

  const toggle = useCallback(() => { if (listening) stop(); else start(); }, [listening, start, stop]);

  return { supported, listening, toggle, stop };
}
