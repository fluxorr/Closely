'use client';

import Image from 'next/image';
import { ArrowRight, Eye, Layers2, LockKeyhole, RotateCcw, SkipForward, Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { canWrite, categories, reactions, type DeckCategory } from '@/lib/rooms/catalog';
import type { RoomAction } from '@/lib/rooms/actions';
import type { RoomView } from '@/lib/rooms/state';

const names: Record<DeckCategory | 'game', string> = { all:'Random', game:'Game prompt', deep: 'Deep', fun: 'Fun', memory: 'Memory', action: 'Action', spicy: 'Spicy', naughty: 'Naughty' };
export type SendAction = (action: RoomAction) => Promise<boolean>;
export function CategoryPicker({ selected, mode, onSelect, disabled }: { selected?: DeckCategory; mode: 'talk' | 'reveal'; onSelect: (category: DeckCategory) => void; disabled?: boolean }) {
  return <div className="category-list" role="group" aria-label="Card categories">{categories.map(category => <button key={category} className={`category category-${category}`} aria-pressed={category === selected} onClick={() => onSelect(category)} disabled={disabled || mode === 'reveal' && !canWrite(category)}>{names[category]}</button>)}</div>;
}
export function RevealPair({ names, answers }: { names: (string | undefined)[]; answers: (string | null | undefined)[] }) {
  return <div className="reveal-pair" aria-live="polite">{answers.map((answer,i) => <div key={i} className={`answer-paper paper-${i}`}><span>{names[i] ?? 'Partner'}</span><p>{answer ?? 'Passed'}</p></div>)}</div>;
}
function WriteAnswer({ send, disabled }: { send: SendAction; disabled: boolean }) {
  const [draft, setDraft] = useState('');
  const submit = (e: FormEvent) => { e.preventDefault(); if (draft.trim()) void send({ type: 'card-answer', text: draft.trim() }); };
  return <form className="answer-form" onSubmit={submit}>
    <label>Your private answer<textarea name="answer" value={draft} onChange={e => setDraft(e.target.value)} maxLength={600} autoComplete="off" required /></label>
    <div className="actions"><button className="button primary" type="submit" disabled={disabled}><LockKeyhole size={17} aria-hidden /> Lock answer</button><button className="button secondary" type="button" disabled={disabled} onClick={() => void send({ type: 'card-answer', text: null })}>Pass</button></div>
  </form>;
}
export function ConversationTable({ view, send, disabled }: { view: RoomView; send: SendAction; disabled: boolean }) {
  const card = view.card!;
  const readyForAnswer = card.mode === 'reveal' && card.phase === 'revealed';
  const blocked = disabled || !!view.proposal;
  const partner = view.players[view.seat === 0 ? 1 : 0];
  const change = (category: DeckCategory, mode: 'talk' | 'reveal') => void send({ type: 'cards', category, mode });
  return <section className="card-room" aria-labelledby="card-room-title">
    <div className="room-title"><div><p className="eyebrow">Conversation cards</p><h1 id="card-room-title">The card table</h1></div><span className="tag">Card {card.round}</span></div>
    <div className="card-controls">
      <div className="segmented" role="group" aria-label="Card mode"><button aria-pressed={card.mode === 'talk'} disabled={blocked} onClick={() => change(card.category,'talk')}>Talk Together</button><button aria-pressed={card.mode === 'reveal'} disabled={blocked} onClick={() => change(canWrite(card.category) ? card.category : 'fun','reveal')}>Answer &amp; Reveal</button></div>
      <CategoryPicker selected={card.category} mode={card.mode} onSelect={category => change(category, card.mode)} disabled={blocked} />
    </div>
    <div className={`play-table category-${card.category}`}>
      <div key={card.id} className={`table-card${card.phase === 'concealed' ? ' closed' : ' open'}`} data-card-id={card.cardId ?? ''}>
        <div className="table-sheet table-back" aria-hidden={card.phase !== 'concealed'}>
          <Image src="/brand/closely-mark.svg" width={56} height={56} alt="" unoptimized />
          <h2>Ready to turn it over?</h2>
          {card.phase === 'concealed' && <button className="button primary" disabled={blocked} onClick={() => void send({ type: 'flip' })}><Eye size={18} aria-hidden /> Flip card</button>}
        </div>
        <div className="table-sheet table-front" aria-hidden={card.phase === 'concealed'}>
          <span className="tag">{names[card.sourceCategory ?? card.category]}</span><Sparkles size={22} className="table-ornament" aria-hidden />
          <h2 aria-live="polite">{card.phase === 'exhausted' ? 'You reached the end of this deck.' : card.text}</h2>
          {card.phase === 'exhausted' && <button className="button primary" disabled={blocked} onClick={() => void send({ type: 'shuffle' })}><RotateCcw size={16} aria-hidden /> Shuffle again</button>}
        </div>
      </div>
      <div className="table-reactions" aria-live="polite">{view.reactions.map(r => <span className="reaction-float" role="img" key={r.id} aria-label={`${view.players[r.seat]?.name} reacted ${r.emoji}`}>{r.emoji}</span>)}</div>
    </div>
    {readyForAnswer && <div className="answer-area">
      {card.ready[view.seat] ? <p className="status-note" role="status"><LockKeyhole size={16} aria-hidden /> Locked. Waiting for {partner?.name ?? 'your partner'}.</p> : <WriteAnswer key={card.id} send={send} disabled={disabled} />}
    </div>}
    {card.answers && card.mode === 'reveal' && <RevealPair names={view.players.map(p => p?.name)} answers={card.answers.map(a => a?.text)} />}
    {card.skipped && <p className="status-note" role="status">This card was passed.</p>}
    <div className="table-toolbar">
      <div className="reaction-buttons" role="group" aria-label="Reactions">{reactions.map((emoji,i) => <button className="icon-button" key={emoji} aria-label={`React ${['heart','fire','laugh','touched','kiss','sleepy'][i]}`} disabled={disabled} onClick={() => void send({ type: 'reaction', emoji })}>{emoji}</button>)}</div>
      {card.phase !== 'exhausted' && <div className="actions">
        {card.mode === 'talk' && card.phase === 'revealed' && <button className="button secondary" disabled={disabled} onClick={() => void send({ type: 'discuss' })}><Layers2 size={16} aria-hidden /> Discuss</button>}
        {card.phase === 'concealed' || readyForAnswer ? <button className="button secondary" disabled={blocked} onClick={() => void send({ type: 'skip' })}><SkipForward size={16} aria-hidden /> Skip</button> : <button className="button primary" disabled={blocked} onClick={() => void send({ type: 'next' })}>Next card <ArrowRight size={16} aria-hidden /></button>}
      </div>}
    </div>
  </section>;
}
