'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RoomAction } from '@/lib/rooms/actions';
import type { RoomView } from '@/lib/rooms/state';

type Snapshot = RoomView & { realtime: boolean };
type Status = 'loading' | 'join' | 'ready' | 'expired' | 'invalid' | 'offline';
const retryable = new Set(['ready', 'answer', 'card-answer', 'choice', 'stroke', 'drawing-guess']);
export function useRoom(id: string) {
  const base = `/api/rooms/${encodeURIComponent(id)}`;
  const [view, setView] = useState<Snapshot | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [live, setLive] = useState(false);
  const current = useRef<Snapshot | null>(null);
  const actionLock = useRef(false);
  const readLock = useRef(false);
  const readAgain = useRef(false);
  const commit = useCallback((snap: Snapshot) => {
    const old = current.current;
    if (!old || snap.version > old.version || snap.version === old.version && snap.now >= old.now) {
      current.current = snap;
      setView(snap);
    }
    setStatus('ready');
  }, []);
  const refresh = useCallback(async () => {
    if (readLock.current) { readAgain.current = true; return; }
    readLock.current = true;
    try {
      do {
        readAgain.current = false;
        const res = await fetch(base, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
        if (res.ok) commit(await res.json());
        else if (res.status === 401) setStatus('join');
        else if (res.status === 410) setStatus('expired');
        else if (res.status === 404) setStatus('invalid');
        else setStatus('offline');
      } while (readAgain.current);
    } catch { setStatus('offline'); }
    finally { readLock.current = false; }
  }, [base, commit]);
  const hasSeat = Boolean(view);
  const usesRealtime = view?.realtime;
  useEffect(() => {
    const kick = () => { if (document.visibilityState === 'visible') void refresh(); };
    const first = window.setTimeout(kick, 0);
    if (!hasSeat && status !== 'loading' && status !== 'offline') return () => clearTimeout(first);
    const timer = window.setInterval(kick, live ? 5500 : 1050);
    window.addEventListener('online', kick);
    document.addEventListener('visibilitychange', kick);
    return () => {
      clearInterval(timer); clearTimeout(first);
      window.removeEventListener('online', kick);
      document.removeEventListener('visibilitychange', kick);
    };
  }, [refresh, hasSeat, live, status]);
  useEffect(() => {
    if (!usesRealtime) return;
    let disposed = false;
    let close: (() => void) | undefined;
    void import('ably').then(async ({ Realtime }) => {
      if (disposed) return;
      const client = new Realtime({ authUrl: `${base}/realtime`, authMethod: 'POST', logLevel: 0 });
      close = () => client.close();
      const channel = client.channels.get(`closely:room:${id}`);
      client.connection.on('connected', () => { setLive(true); void refresh(); });
      client.connection.on(['disconnected','suspended','failed','closed'], () => { if (!disposed) setLive(false); });
      await channel.subscribe('version', () => { if (!disposed) void refresh(); });
      if (!disposed) await channel.presence.enter();
    }).catch(() => { if (!disposed) setLive(false); });
    return () => { disposed = true; close?.(); };
  }, [base, usesRealtime, id, refresh]);
  useEffect(() => {
    if (view?.game?.deadline == null) return;
    const timer = window.setTimeout(() => void refresh(), Math.max(50, view.game.deadline - view.now + 35));
    return () => window.clearTimeout(timer);
  }, [refresh, view?.game?.deadline, view?.now]);
  const send = useCallback(async (action: RoomAction) => {
    const original = current.current;
    if (!original || actionLock.current) return false;
    actionLock.current = true;
    setPending(true);
    setError('');
    const actionId = crypto.randomUUID();
    const transmit = async (version: number) => {
      const res = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actionId, sessionId: original.sessionId, expectedVersion: version, action }), signal: AbortSignal.timeout(8000) });
      return { ok: res.ok, status: res.status, data: await res.json() };
    };
    try {
      let result;
      try { result = await transmit(original.version); }
      catch { result = await transmit(original.version); }
      const newer: Snapshot | undefined = result.data.view;
      if (result.status === 409 && newer && retryable.has(action.type) && newer.sessionId === original.sessionId && (newer.game?.phase === original.game?.phase || action.type === 'ready' && original.game?.phase === 'lobby' && newer.game?.phase === 'ready') && newer.card?.phase === original.card?.phase) {
        commit(newer);
        result = await transmit(newer.version);
      }
      if (result.ok) { commit(result.data); return true; }
      if (result.data.view) commit(result.data.view);
      if (result.status === 410) setStatus('expired');
      setError(result.data.error ?? 'Something interrupted that action. Try again.');
      return false;
    } catch { setError('The connection dropped. Try again once it’s back.'); return false; }
    finally { actionLock.current = false; setPending(false); }
  }, [base, commit]);
  return { view, status, error, send, refresh, pending };
}
