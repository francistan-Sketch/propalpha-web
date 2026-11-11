import axios from 'axios';
import api from '@/lib/api';
import type { FlyerAgent, FlyerCopy, FlyerKind, FlyerOptions, FlyerPack, FlyerTarget, FlyerTemplate } from './types';

// The Flyer Maker endpoints, one function each, mirroring mobile/src/services/api.js so both front ends call
// the backend the same way. Every route is gated by the `flyer` feature (403) and a session (401).

export async function getFlyerTargets(q: string, kind: FlyerKind): Promise<FlyerTarget[]> {
  const res = await api.get('/flyer/targets', { params: { q, kind } });
  return res.data.targets ?? [];
}

export async function getFlyerData(params: { kind: FlyerKind; scope: string; name: string; months: number; rows: number }): Promise<FlyerPack> {
  const res = await api.get('/flyer/data', { params, timeout: 30000 });
  return res.data.pack;
}

export async function getFlyerAgent(): Promise<FlyerAgent> {
  const res = await api.get('/flyer/agent');
  return res.data.agent ?? {};
}

export async function postFlyerCopy(pack: FlyerPack, extra?: { tone?: string; audience?: string }): Promise<FlyerCopy> {
  const res = await api.post('/flyer/copy', { pack, ...(extra || {}) }, { timeout: 60000 });
  return res.data.copy;
}

export async function getFlyerTemplates(): Promise<FlyerTemplate[]> {
  const res = await api.get('/flyer/templates');
  return res.data.templates ?? [];
}

export async function getFlyerTemplate(slug: string): Promise<FlyerTemplate> {
  const res = await api.get(`/flyer/templates/${encodeURIComponent(slug)}`);
  return res.data.template;
}

export async function postFlyerJob(body: {
  template_id: FlyerTemplate['id'] | null;
  target: FlyerPack['target'];
  options: FlyerOptions;
  pack: { target: FlyerPack['target']; summary: FlyerPack['summary'] };
  copy: FlyerCopy;
}): Promise<unknown> {
  const res = await api.post('/flyer/jobs', body);
  return res.data.job;
}

/** HTTP status of a failed call, or 0 when the error is not an HTTP response. */
export function errorStatus(e: unknown): number {
  return axios.isAxiosError(e) ? e.response?.status ?? 0 : 0;
}

/** The backend's `{ error }` message when it sent one, else a fallback. */
export function errorMessage(e: unknown, fallback: string): string {
  if (axios.isAxiosError(e)) {
    const msg = (e.response?.data as { error?: string } | undefined)?.error;
    if (msg) return msg;
  }
  return fallback;
}
