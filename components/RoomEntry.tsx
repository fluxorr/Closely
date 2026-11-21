'use client';

import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { XIcon } from '@phosphor-icons/react/dist/ssr/X';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { handOffRoom, type RoomSnapshot } from '@/hooks/roomHandoff';
import { playSound } from '@/lib/audio/sound';

export function AvatarChoice({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <fieldset className="avatar-choices"><legend>Choose your color</legend>
    <div>{['Rose','Sage','Stone','Sand','Oat','Clay'].map((name, i) => <label key={name} className={`avatar-option avatar-${i}`} title={name}>
      <input type="radio" name="avatar" value={i} checked={value === i} onChange={() => onChange(i)} aria-label={name} />
    </label>)}</div>
  </fieldset>;
}
function inviteInput(code: string) {
  const text = code.trim();
  if (/^[a-z0-9]{6}$/i.test(text)) return { id: text.toUpperCase() };
  if (/^[A-Za-z0-9_-]{22}$/.test(text)) return { invite: text };
  try {
    const url = new URL(text);
    const id = url.pathname.match(/^\/room\/([^/]+)\/?$/)?.[1];
    if (id) return { id, invite: new URLSearchParams(url.hash.slice(1)).get('invite') ?? undefined };
  } catch { /* The inline error covers invalid invite formats. */ }
  return null;
}
export function EntryForm({ kind, roomId, onJoined }: { kind: 'create' | 'join'; roomId?: string; onJoined?: (view: RoomSnapshot) => void }) {
  const router = useRouter();
  const [avatar, setAvatar] = useState(kind === 'create' ? 0 : 1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function enter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const name = String(fields.get('name') ?? '').trim();
    if (!name) { setError('Enter the name your partner will see.'); return; }
    const invite = roomId ? { id: roomId, invite: new URLSearchParams(window.location.hash.slice(1)).get('invite') ?? undefined } : inviteInput(String(fields.get('invite') ?? ''));
    if (kind === 'join' && !invite) { setError('Enter the invite link or code from your partner.'); return; }
    setError('');
    setPending(true);
    try {
      const res = await fetch(kind === 'create' ? '/api/rooms' : '/api/rooms/join', { method: 'POST', body: JSON.stringify({ name, avatar, ...(kind === 'join' ? invite : {}) }), headers: { 'Content-Type': 'application/json' } });
      const result = await res.json();
      if (!res.ok) { setError(result.error ?? 'The room couldn’t open. Try again.'); return; }
      void playSound('notice');
      if (onJoined) onJoined(result.view);
      else {
        handOffRoom(result.view);
        router.push(`/room/${result.id}`);
      }
    } catch { setError('The room couldn’t open. Check your connection and try again.'); }
    finally { setPending(false); }
  }
  return <form className="entry-form" onSubmit={enter}>
    {kind === 'join' && !roomId && <label>Invite link or code<input name="invite" autoComplete="off" spellCheck={false} maxLength={300} required /></label>}
    <label>Your name<input name="name" autoComplete="nickname" maxLength={32} required /></label>
    <AvatarChoice value={avatar} onChange={setAvatar} />
    {error && <p role="alert" className="error-text">{error}</p>}
    <button className="button primary" type="submit" disabled={pending}>{pending ? 'Opening room…' : kind === 'create' ? 'Create a room' : 'Join room'} <ArrowRightIcon size={17} aria-hidden /></button>
  </form>;
}
export function EntryButton({ kind, children, className = 'button primary' }: { kind: 'create' | 'join'; children?: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  return <>
    <button className={className} onClick={() => ref.current?.showModal()}>{children ?? (kind === 'create' ? 'Create a room' : 'Join with code')}</button>
    <dialog className="entry-dialog" ref={ref} aria-label={kind === 'create' ? 'Create a room' : 'Join with code'}>
      <button className="icon-button dialog-close" aria-label="Close" onClick={() => ref.current?.close()}><XIcon size={20} aria-hidden /></button>
      <h2>{kind === 'create' ? 'Make your room' : 'Join your partner'}</h2>
      <p>{kind === 'create' ? 'Pick a name, then send your partner the invite.' : 'Use the link or code your partner shared.'}</p>
      <EntryForm kind={kind} />
    </dialog>
  </>;
}
