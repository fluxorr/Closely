'use client';

import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react/dist/ssr/ArrowCounterClockwise';
import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { CheckIcon } from '@phosphor-icons/react/dist/ssr/Check';
import { CircleIcon } from '@phosphor-icons/react/dist/ssr/Circle';
import { LockKeyIcon } from '@phosphor-icons/react/dist/ssr/LockKey';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { games } from '@/lib/rooms/catalog';
import type { RoomView } from '@/lib/rooms/state';
import type { SendAction } from './ConversationTable';

const label = (choice: string | null) => choice === 'have' ? 'I have' : 'Neverrr';

export default function NeverStage({ view, send, disabled }: { view: RoomView; send: SendAction; disabled: boolean }) {
  const game = view.game!;
  const [afterHours, setAfterHours] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (document.querySelector('dialog[open]')) return;
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  const partnerSeat = view.seat === 0 ? 1 : 0;
  const partner = view.players[partnerSeat];
  const partnerName = partner?.name ?? 'your partner';
  const playing = game.phase === 'playing';
  const revealed = game.phase === 'resolving';
  const finished = game.phase === 'results';
  const ownChoice = game.ownAnswer;
  const locked = game.ready[view.seat];
  const canAct = !disabled && !view.proposal;
  const passed = revealed && !game.answers?.some(Boolean);
  const matched = revealed && !passed && game.answers?.[0] === game.answers?.[1];
  const waiting = !partner?.online
    ? `${partnerName} is away. You can pick up here when they’re back.`
    : ownChoice ? `Waiting for ${partnerName} to choose…`
      : game.locked[partnerSeat] ? `${partnerName} has picked. Your turn.` : `${partnerName} is thinking about it…`;

  return <section className="game-stage never-stage" aria-labelledby="never-title">
    <header className="never-heading">
      <h1 id="never-title" ref={heading} tabIndex={-1}>{games.never.title}</h1>
      {(playing || revealed) && <div className="never-progress">
        <span>Round {game.round + 1} of {game.total}</span>
        <div className="never-track" aria-hidden="true">
          {Array.from({ length: game.total }, (_, round) => <span key={round} data-state={round < game.round || round === game.round && revealed ? 'done' : round === game.round ? 'current' : 'ahead'} />)}
        </div>
      </div>}
    </header>

    {!playing && !revealed && <div className="never-welcome">
      <figure><Image src={games.never.art} alt="" fill sizes="(max-width: 700px) 94vw, 48vw" /></figure>
      <div className="never-intro">
        {finished ? <>
          <h2>That stays between us.</h2>
          <p>{game.never?.revealed ?? 0} of {game.total} prompts answered together.</p>
          <div className="actions">
            <button className="button primary" disabled={!canAct} onClick={() => void send({ type: 'play-again' })}><ArrowCounterClockwiseIcon size={17} aria-hidden /> Play again</button>
            <button className="button secondary" disabled={!canAct} onClick={() => void send({ type: 'return' })}>Back to room</button>
          </div>
        </> : <>
          <h2>{game.phase === 'rematch' ? 'Another round?' : 'Two picks, one reveal.'}</h2>
          <p>Choose in private, then turn both answers over together. Pass any prompt. There’s no timer.</p>
          <label className="never-option">
            <input type="checkbox" checked={afterHours} disabled={!canAct || locked} onChange={event => setAfterHours(event.target.checked)} />
            <span><strong>Include After Hours</strong><small>Mature prompts appear if you both opt in.</small></span>
          </label>
          <button className="button primary" disabled={!canAct || locked} onClick={() => void send({ type: 'ready', afterHours })}>{locked ? `Waiting for ${partnerName}…` : 'I’m ready'} <ArrowRightIcon size={16} aria-hidden /></button>
        </>}
      </div>
    </div>}

    {(playing || revealed) && <div className="never-table" data-outcome={revealed ? passed ? 'pass' : matched ? 'match' : 'split' : undefined}>
      <div className="never-prompt" key={view.sessionId}>
        <p>Never have I ever… {game.never?.mature && <span className="never-mature">After Hours</span>}</p>
        <h2>{game.prompt}</h2>
      </div>
      <div className="never-ballot">
        <div className="never-characters">
          <Image src="/assets/games/never-characters.webp" width={520} height={390} alt="" unoptimized />
        </div>
        {playing ? <>
          <div className="never-status" role="status">
            <p><LockKeyIcon size={16} aria-hidden /> {ownChoice ? 'Your pick is sealed' : 'Your pick stays private'}</p>
            <p>{waiting}</p>
          </div>
          <div className="never-picks" role="group" aria-label="Your choice">
            <button type="button" disabled={!canAct || Boolean(ownChoice)} aria-pressed={ownChoice === 'have'} onClick={() => void send({ type: 'never-answer', choice: 'have' })}><CheckIcon size={24} aria-hidden /> I have</button>
            <button type="button" disabled={!canAct || Boolean(ownChoice)} aria-pressed={ownChoice === 'never'} onClick={() => void send({ type: 'never-answer', choice: 'never' })}><CircleIcon size={22} aria-hidden /> Neverrr</button>
          </div>
          <button className="never-pass" disabled={!canAct} onClick={() => void send({ type: 'never-pass' })}>Pass this prompt</button>
        </> : <div className="never-reveal" key={`${view.sessionId}:reveal`}>
          <h3 role="status">{passed ? 'Prompt passed.' : matched ? 'We match!' : 'We don’t match.'}</h3>
          {passed && <p>Any sealed picks stay private.</p>}
            {!passed && <div className="never-stamps" aria-label="Choice stamps" role="group">
              {game.answers?.map((choice, seat) => <div className="never-stamp" key={seat}>
                <span>{view.players[seat]?.name}</span>
                <strong>{label(choice)}</strong>
              </div>)}
            </div>}
        </div>}
      </div>
    </div>}
  </section>;
}
