'use client';

import { ArrowDownIcon } from '@phosphor-icons/react/dist/ssr/ArrowDown';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { ChatCircleIcon } from '@phosphor-icons/react/dist/ssr/ChatCircle';
import { CheckIcon } from '@phosphor-icons/react/dist/ssr/Check';
import { CopyIcon } from '@phosphor-icons/react/dist/ssr/Copy';
import { LinkSimpleIcon } from '@phosphor-icons/react/dist/ssr/LinkSimple';
import { PaperPlaneTiltIcon } from '@phosphor-icons/react/dist/ssr/PaperPlaneTilt';
import { XIcon } from '@phosphor-icons/react/dist/ssr/X';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRoom } from '@/hooks/useRoom';
import { classicGames, games, newGames } from '@/lib/rooms/catalog';
import type { RoomView } from '@/lib/rooms/state';
import { Brand } from './Brand';
import { CategoryPicker, ConversationTable, type SendAction } from './ConversationTable';
import { GameCover } from './GameCover';
import { EntryForm } from './RoomEntry';

const GameStage = dynamic(() => import('./GameStage'), { loading: () => <div className="game-paper" role="status">Setting the stage…</div> });

function initial(name: string) { return Array.from(name)[0]?.toLocaleUpperCase() ?? '?'; }
function PlayerSeats({ view }: { view: RoomView }) {
  return <div className="seats" role="group" aria-label="Room seats">
    {view.players.map((p,i) => <div className={`player${p ? '' : ' player-empty'}`} key={i}>
      <span className={`avatar avatar-${p?.avatar ?? 1}`} aria-hidden>{p ? initial(p.name) : '◡'}</span>
      <div><strong>{p ? p.name : 'Open seat'}</strong><small>{p ? i === view.seat ? 'You' : p.online ? 'Here with you' : 'Away for now' : 'Invite partner'}</small></div>
    </div>)}
  </div>;
}
function Invite({ view }: { view: RoomView }) {
  const [copied, setCopied] = useState('');
  const [manual, setManual] = useState('');
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timeout.current) clearTimeout(timeout.current); }, []);
  const copy = async (kind: 'link' | 'code') => {
    const url = `${window.location.origin}/room/${view.id}#invite=${view.invite}`;
    const value = kind === 'link' ? url : view.invite;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setManual('');
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => setCopied(''), 1500);
    } catch { setManual(value); }
  };
  return <div className="invite-actions"><div className="actions">
    <button className="button primary" onClick={() => void copy('link')}>{copied === 'link' ? <CheckIcon size={17} aria-hidden /> : <LinkSimpleIcon size={18} aria-hidden />} {copied === 'link' ? 'Link copied' : 'Copy invite link'}</button>
    <button className="button secondary" onClick={() => void copy('code')}>{copied === 'code' ? <CheckIcon size={16} aria-hidden /> : <CopyIcon size={16} aria-hidden />} {copied === 'code' ? 'Code copied' : 'Copy code'}</button>
  </div><span className="sr-only" aria-live="polite">{copied ? `Invite ${copied} copied.` : ''}</span>{manual && <label className="manual-invite">Select and copy your invitation<input value={manual} readOnly onFocus={e => e.target.select()} /></label>}</div>;
}
function ChatDrawer({ view, send, disabled, dialog }: { view: RoomView; send: SendAction; disabled: boolean; dialog: React.RefObject<HTMLDialogElement | null> }) {
  const [draft, setDraft] = useState('');
  const log = useRef<HTMLDivElement>(null);
  const latest = view.messages.at(-1)?.id;
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight; }, [latest]);
  async function write(e: FormEvent) {
    e.preventDefault();
    if (draft.trim() && await send({ type: 'chat', text: draft.trim() })) setDraft('');
  }
  return <dialog ref={dialog} className="chat-dialog" aria-label="Room chat">
    <div className="chat-frame"><div className="chat-heading"><div><h2>Room chat</h2><p>Just between you two.</p></div><button className="icon-button" aria-label="Close chat" onClick={() => dialog.current?.close()}><XIcon size={20} aria-hidden /></button></div>
      <div className="chat-log" ref={log} role="log" aria-label="Messages">{view.messages.length ? view.messages.map(m => <div key={m.id} className={m.seat === view.seat ? 'chat-bubble own' : 'chat-bubble'}><strong>{m.seat === view.seat ? 'You' : view.players[m.seat]?.name}</strong><p>{m.text}</p></div>) : <p className="muted">Send a little hello.</p>}</div>
      <form className="chat-form" onSubmit={write}><label className="sr-only" htmlFor="chat-message">Message</label><input id="chat-message" name="message" value={draft} onChange={e => setDraft(e.target.value)} maxLength={400} autoComplete="off" /><button className="icon-button" aria-label="Send message" disabled={disabled || !draft.trim()}><PaperPlaneTiltIcon size={19} aria-hidden /></button></form>
    </div>
  </dialog>;
}
function Proposal({ view, disabled, send }: { view: RoomView; disabled: boolean; send: SendAction }) {
  const proposal = view.proposal;
  if (!proposal) return null;
  const mine = proposal.seat === view.seat;
  const target = proposal.target;
  const verb = target.type === 'game' ? `play ${games[target.game].title}` : target.type === 'next' ? 'draw the next card' : target.type === 'skip' ? 'skip this card' : target.type === 'return' ? 'head back to the room' : `switch to ${target.category === 'all' ? 'random' : target.category} cards in ${target.mode === 'talk' ? 'Talk Together' : 'Answer & Reveal'}`;
  return <div className="proposal" role="status"><p>{mine ? `You asked to ${verb}.` : `${view.players[proposal.seat]?.name ?? 'Your partner'} wants to ${verb}.`}</p><div className="actions">
    {!mine && <button className="button small primary" disabled={disabled} onClick={() => void send({ type: 'respond', accept: true })}>Accept</button>}
    <button className="button small secondary" disabled={disabled} onClick={() => void send({ type: 'respond', accept: false })}>{mine ? 'Cancel request' : 'Not now'}</button>
  </div></div>;
}
function Library({ view, send, disabled }: { view: RoomView; send: SendAction; disabled: boolean }) {
  const play = (kind: keyof typeof games) => <button className="button text-button" type="button" disabled={disabled || !view.players[1]} onClick={() => void send({ type: 'game', game: kind })}>Play {games[kind].title} <ArrowRightIcon size={16} aria-hidden /></button>;
  return <section id="games" className="room-library" aria-labelledby="library-title"><div className="section-heading"><div><p className="eyebrow">New games</p><h2 id="library-title">Pick a game</h2></div>{!view.players[1] && <p>Games open when your partner joins.</p>}</div>
    <div className="game-grid">{newGames.map((kind, index) => <GameCover key={kind} kind={kind} variant={index === 0 ? 'featured' : 'standard'} action={play(kind)} />)}</div>
    <h3 className="classic-title">Classics</h3><div className="classics">{classicGames.map(kind => <GameCover key={kind} kind={kind} variant="compact" action={play(kind)} />)}</div>
  </section>;
}
function RoomHub({ view, send, disabled }: { view: RoomView; send: SendAction; disabled: boolean }) {
  const [mode, setMode] = useState<'talk' | 'reveal'>('talk');
  const waiting = !view.players[1];
  return <>
    {waiting ? <section className="waiting-scene" aria-labelledby="waiting-title"><div><p className="eyebrow">Your room is ready</p><h1 id="waiting-title">A seat for your person.</h1><p>Send the invite and pick what you’d like to play while you wait.</p><Invite view={view} /></div><figure><Image src="/assets/illustrations/waiting.webp" fill sizes="(max-width: 760px) 90vw, 450px" alt="" /></figure></section> : <section className="room-welcome"><div><p className="eyebrow">Your room</p><h1>Here together.</h1></div><Invite view={view} /></section>}
    <div className="hub-feature"><div><p className="eyebrow">Conversation cards</p><h2>Take a seat at the card table.</h2><p>Tell a story, get curious, or write your answers and turn them over together.</p>
      <div className="segmented" role="group" aria-label="Card mode"><button aria-pressed={mode === 'talk'} onClick={() => setMode('talk')}>Talk Together</button><button aria-pressed={mode === 'reveal'} onClick={() => setMode('reveal')}>Answer &amp; Reveal</button></div>
      <CategoryPicker mode={mode} disabled={disabled || waiting} onSelect={category => void send({ type: 'cards', category, mode })} />
    </div><div className="hub-art"><Image src="/assets/illustrations/notes.webp" alt="" fill sizes="(max-width: 760px) 90vw, 440px" /></div></div>
    <Library view={view} send={send} disabled={disabled} />
  </>;
}
export function RoomExperience({ id }: { id: string }) {
  const { view, status, error, pending, send, refresh } = useRoom(id);
  const dialog = useRef<HTMLDialogElement>(null);
  const partner = view?.players[view.seat === 0 ? 1 : 0];
  const disabled = pending || status !== 'ready';
  if (!view || ['join','expired','invalid'].includes(status)) return <main className="entry-screen wrap" id="main-content"><Brand />
    <section className="entry-panel"><Image src="/assets/illustrations/notes.webp" alt="" width={520} height={347} preload /><div>
      {status === 'loading' ? <><h1>Opening the room…</h1><div className="loading-line" aria-hidden /></> : status === 'join' ? <><h1>A little room for two.</h1><p>Pick a name your partner will recognize.</p><EntryForm kind="join" roomId={id} onJoined={() => { window.history.replaceState(null, '', window.location.pathname); void refresh(); }} /></> : <>
        <h1>{status === 'expired' ? 'This room has expired.' : status === 'invalid' ? 'That invite looks off.' : 'The room couldn’t connect.'}</h1><p>{status === 'offline' ? 'Check your connection and try the room again.' : 'Ask your person for a fresh invite, or make a room at home.'}</p>
        {status === 'offline' ? <button className="button primary" onClick={() => void refresh()}>Try again</button> : <Link className="button primary" href="/">Back to Closely</Link>}
      </>}
    </div></section></main>;
  return <>
    <header className="room-header wrap"><Brand /><div className="actions">
      {view.activity === 'hub' ? <a className="button small secondary" href="#games">Games <ArrowDownIcon size={13} aria-hidden /></a> : <button className="button small secondary" disabled={disabled || !!view.proposal} onClick={() => void send({ type: 'return' })}><ArrowLeftIcon size={16} aria-hidden /> Room hub</button>}
      <button className="button small secondary" onClick={() => dialog.current?.showModal()}><ChatCircleIcon size={17} aria-hidden /> Chat</button>
    </div></header>
    <main className="room-main wrap" id="main-content"><PlayerSeats view={view} />
      {status === 'offline' && <p className="status-note" role="status">Reconnecting to your room…</p>}
      {status === 'ready' && partner && !partner.online && <p className="status-note" role="status">{partner.name} is away. Their seat is saved.</p>}
      {error && <p className="error-text action-error" role="alert">{error}</p>}
      <Proposal view={view} send={send} disabled={disabled} />
      {view.activity === 'hub' && <RoomHub view={view} send={send} disabled={disabled} />}
      {view.activity === 'cards' && <ConversationTable view={view} send={send} disabled={disabled} />}
      {view.activity === 'game' && <GameStage view={view} send={send} disabled={disabled} />}
    </main>
    <ChatDrawer view={view} send={send} disabled={disabled} dialog={dialog} />
  </>;
}
