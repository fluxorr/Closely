'use client';

import Image from 'next/image';
import { ArrowLeft, ArrowRight, CircleHelp, Clock3, LockKeyhole, RotateCcw, Sparkles } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { games } from '@/lib/rooms/catalog';
import type { GameView } from '@/lib/rooms/game';
import type { RoomView } from '@/lib/rooms/state';
import { RevealPair, type SendAction } from './ConversationTable';
import { DrawingBoard } from './DrawingBoard';
import { StickerAccent } from './StickerAccent';

function useClock(serverNow: number, deadline: number | null) {
  const [estimated, setEstimated] = useState(serverNow);
  useEffect(() => {
    const localStart = performance.now();
    const update = () => setEstimated(serverNow + performance.now() - localStart);
    const timer = setInterval(update, 150);
    return () => clearInterval(timer);
  }, [serverNow]);
  const now = Math.max(serverNow, estimated);
  return { now, seconds: deadline === null ? null : Math.max(0, Math.ceil((deadline - now) / 1000)) };
}
function TextMove({ title, label, max, multiline, disabled, onSubmit }: { title: string; label: string; max: number; multiline?: boolean; disabled: boolean; onSubmit: (value: string) => Promise<boolean> }) {
  const [text, setText] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (text.trim() && await onSubmit(text.trim())) setText('');
  }
  const common = { value: text, id: 'game-response', maxLength: max, name: 'response', autoComplete: 'off', required: true, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setText(event.target.value) };
  return <form className="answer-form" onSubmit={submit}><label htmlFor="game-response">{title}{multiline ? <textarea {...common} /> : <input {...common} />}</label><button className="button primary" type="submit" disabled={disabled}>{label} <ArrowRight size={16} aria-hidden /></button></form>;
}
function ActiveGame({ game, view, send, disabled, now }: { game: GameView; view: RoomView; send: SendAction; disabled: boolean; now: number }) {
  const mine = view.seat === game.actor;
  const player = (seat: number) => view.players[seat]?.name ?? 'Partner';
  const locked = <p className="status-note" role="status"><LockKeyhole size={16} aria-hidden /> Locked. Waiting for {player(1 - view.seat)}.</p>;
  switch (game.kind) {
    case 'same': return <div className="game-paper"><h2>{game.prompt}</h2><div className="ready-pair">{view.players.map((person, i) => <div key={i} className={`answer-paper paper-${i}`}><span>{person?.name}</span><p>{game.locked[i] ? 'Locked in' : 'Thinking…'}</p></div>)}</div>
      {game.locked[view.seat] ? locked : <TextMove title="Your answer" label="Lock answer" max={120} disabled={disabled} onSubmit={text => send({ type: 'answer', text })} />}</div>;
    case 'bluff': return <div className="game-paper">
      <h2>{game.prompt}</h2>
      {mine && <p className="tag secret"><LockKeyhole size={14} aria-hidden /> {game.instruction === 'truth' ? 'Tell a true story' : 'Make one up'}</p>}
      {game.story ? <blockquote className="story-note">{game.story}</blockquote> : mine ? <TextMove title="Your story" label="Send story" max={600} multiline disabled={disabled} onSubmit={text => send({ type: 'story', text })} /> : <p role="status">{player(game.actor)} is writing a story for you…</p>}
      {game.story && (mine ? <p role="status">Waiting for {player(1 - view.seat)} to guess.</p> : <div className="actions"><button className="button primary" onClick={() => void send({ type: 'guess', choice: 'truth' })} disabled={disabled}>Truth</button><button className="button secondary" onClick={() => void send({ type: 'guess', choice: 'invent' })} disabled={disabled}>Invented</button></div>)}
    </div>;
    case 'draw': return <div className="game-paper drawing-stage"><div className="drawing-hud"><h2>{mine ? game.prompt : `Guess ${player(game.actor)}’s drawing`}</h2>{mine && <span className="tag"><LockKeyhole size={14} aria-hidden /> Only you see this</span>}</div>
      <DrawingBoard drawing={game.drawing} editable={mine} send={send} disabled={disabled} />
      {!mine && <TextMove title="Your guess" label="Guess" max={100} disabled={disabled} onSubmit={text => send({ type: 'drawing-guess', text })} />}
      {game.misses > 0 && <p role="status" className="status-note">“{game.guess}” wasn’t it. Keep guessing!</p>}
    </div>;
    case 'ttt': return <div className="game-paper"><h2>{game.turn === view.seat ? 'Your turn' : `${player(game.turn)}’s turn`}</h2><Board game={game} send={send} disabled={disabled || game.turn !== view.seat} /></div>;
    case 'rps': return <div className="game-paper"><h2>Choose your move</h2>{game.locked[view.seat] ? locked : <div className="actions">{(['rock','paper','scissors'] as const).map(choice => <button key={choice} className="button secondary" disabled={disabled} onClick={() => void send({ type: 'choice', choice })}>{choice[0].toUpperCase() + choice.slice(1)}</button>)}</div>}</div>;
    case 'potato': return <div className="game-paper potato-stage"><Image src={games.potato.art} alt="" width={320} height={180} unoptimized /><h2>{game.holder === view.seat ? 'You have the potato!' : `${player(game.holder)} has the potato`}</h2><button className="button primary" disabled={disabled || game.holder !== view.seat || now < game.passAt} onClick={() => void send({ type: 'pass-potato' })}>Pass the potato <ArrowRight size={17} aria-hidden /></button></div>;
  }
}
function Board({ game, send, disabled }: { game: GameView; send: SendAction; disabled: boolean }) {
  return <div className="ttt-board" aria-label="Tic-Tac-Toe board">{game.board.map((cell,i) => <button className={game.winningLine?.includes(i) ? 'winning' : ''} key={i} aria-label={`Cell ${i + 1}${cell === null ? ', empty' : cell === 0 ? ', X' : ', O'}`} disabled={disabled || cell !== null} onClick={() => void send({ type: 'move', cell: i })}>{cell === 0 ? '×' : cell === 1 ? '○' : ''}</button>)}</div>;
}

export default function GameStage({ view, send, disabled }: { view: RoomView; send: SendAction; disabled: boolean }) {
  const game = view.game!;
  const metadata = games[game.kind];
  const person = view.players[view.seat === 0 ? 1 : 0]?.name ?? 'your partner';
  const names = view.players.map(p => p?.name);
  const { seconds, now } = useClock(view.now, game.deadline);
  const active = game.phase === 'playing';
  const resolving = game.phase === 'resolving';
  const results = game.phase === 'results';
  const countdown = game.phase === 'countdown';
  const tied = game.scores[0] === game.scores[1];
  const win = game.scores[view.seat] > game.scores[1-view.seat];
  return <section className="game-stage" aria-labelledby="game-title">
    <div className="room-title"><div><p className="eyebrow">{metadata.type} game</p><h1 id="game-title">{metadata.title}</h1></div><div className="game-hud"><span className="tag">Round {game.round + 1} / {game.total}</span>{seconds !== null && game.kind !== 'potato' && <span className="tag timer" role="timer"><Clock3 size={14} aria-hidden /> {seconds}s</span>}</div></div>
    <details className="game-help"><summary><CircleHelp size={17} aria-hidden /> How to play</summary><p>{metadata.instructions}</p></details>
    {active && <ActiveGame key={view.sessionId} game={game} view={view} send={send} disabled={disabled} now={now} />}
    {countdown && <div className="game-paper countdown" role="status"><p>Get ready</p><h2>{seconds ?? 0}</h2></div>}
    {!active && !countdown && !resolving && !results && <div className="game-paper game-ready">
      <Image src={metadata.art} width={380} height={246} alt="" unoptimized={metadata.art.endsWith('.svg')} />
      <div><h2>{game.phase === 'rematch' ? 'One more?' : 'Ready when you are'}</h2><p>{metadata.instructions}</p>
        <button className="button primary" disabled={disabled || game.ready[view.seat]} onClick={() => void send({ type: 'ready' })}>{game.ready[view.seat] ? `Waiting for ${person}…` : 'I’m ready'} <ArrowRight size={16} aria-hidden /></button>
      </div>
    </div>}
    {resolving && <div className="game-paper round-reveal" key={`${view.sessionId}:reveal`}>
      {game.matched && <StickerAccent className="result-sticker" />}
      <h2 aria-live="polite">{game.notice}</h2>
      {game.kind === 'same' && <><RevealPair names={names} answers={game.answers ?? []} /><p>{game.streak > 1 ? `${game.streak} matches in a row` : `${game.scores[0]} shared ${game.scores[0] === 1 ? 'point' : 'points'}`}</p></>}
      {game.kind === 'bluff' && <><p className="tag secret">{game.instruction === 'truth' ? 'The instruction was Truth' : 'The instruction was Invent'}</p>{game.story && <blockquote className="story-note">{game.story}</blockquote>}</>}
      {game.kind === 'draw' && <><p>The prompt was <strong>{game.prompt}</strong>.</p><DrawingBoard drawing={game.drawing} editable={false} send={send} disabled /></>}
      {game.kind === 'rps' && <RevealPair names={names} answers={game.answers ?? []} />}
      {game.kind === 'ttt' && <Board game={game} send={send} disabled />}
      <button className="button primary" disabled={disabled || game.ready[view.seat]} onClick={() => void send({ type: 'ready' })}>{game.ready[view.seat] ? `Waiting for ${person}…` : game.round + 1 === game.total ? 'See results' : 'Next round'} <ArrowRight size={16} aria-hidden /></button>
    </div>}
    {results && <div className="game-paper results">
      <Image src={metadata.art} width={340} height={220} alt="" unoptimized={metadata.art.endsWith('.svg')} />
      <div><Sparkles size={25} aria-hidden /><h2>{game.kind === 'same' ? 'You did it together.' : tied ? 'It’s a tie.' : win ? 'You won!' : `${person} won!`}</h2>
        <div className="score-pair">{game.kind === 'same' ? <p><strong>{game.scores[0]}</strong> shared points</p> : names.map((name, i) => <p key={i}><strong>{game.scores[i]}</strong> {name}</p>)}</div>
        <div className="actions"><button className="button primary" disabled={disabled} onClick={() => void send({ type: 'play-again' })}><RotateCcw size={16} aria-hidden /> Rematch</button><button className="button secondary" disabled={disabled} onClick={() => void send({ type: 'return' })}><ArrowLeft size={16} aria-hidden /> Back to room</button></div>
      </div>
    </div>}
  </section>;
}
