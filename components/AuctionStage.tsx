'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { RoomView } from '@/lib/rooms/state';
import type { SendAction } from './ConversationTable';

const marks = {
  waffle: 'M5 8h22v18H5z M12 8v18m8-18v18M5 14h22M5 20h22',
  moon: 'M24 24A12 12 0 0 1 13 5a10 10 0 0 0 11 19z M24 5v6m-3-3h6',
  mic: 'M12 17a6 6 0 1 1 9-9 6 6 0 0 1-9 9z M13 16 5 24l3 3 8-9m-2-8 6 6',
  disco: 'M16 6v3m0 0a10 10 0 1 0 0 20 10 10 0 1 0 0-20z M6 19h20M16 9c-6 7-6 13 0 20m0-20c6 7 6 13 0 20',
  basket: 'M5 13h22l-3 13H8z M10 13l3-7m9 7-3-7m-3 11v5',
  ticket: 'M4 8h24v5a3 3 0 0 0 0 6v5H4v-5a3 3 0 0 0 0-6z M19 9v2m0 3v2m0 3v3',
};

function AuctionClock({ deadline, now }: { deadline: number; now: number }) {
  const [seconds, setSeconds] = useState(() => Math.max(0, Math.ceil((deadline - now) / 1000)));
  useEffect(() => {
    const start = performance.now();
    const update = () => setSeconds(Math.max(0, Math.ceil((deadline - now - (performance.now() - start)) / 1000)));
    const timer = window.setInterval(update, 160);
    return () => window.clearInterval(timer);
  }, [deadline, now]);
  return <span role="timer" className="auction-clock">{seconds}s</span>;
}

export default function AuctionStage({ view, send, disabled }: { view: RoomView; send: SendAction; disabled: boolean }) {
  const game = view.game!;
  const auction = game.auction!;
  const active = game.phase === 'playing';
  const reveal = game.phase === 'resolving';
  const finished = game.phase === 'results';
  const partner = view.players[1 - view.seat]?.name ?? 'Your partner';
  const blocked = disabled || Boolean(view.proposal);

  return <section className="auction-game" aria-labelledby="auction-title">
    <header className="auction-title">
      <h1 id="auction-title">Date Night Auction</h1>
      <span className="auction-purse"><span aria-hidden="true">✦</span> {auction.budget} coins left</span>
    </header>
    <div className="auction-stage">
      <div className="auction-curtain" aria-hidden="true" />
      <div className="auction-stars" aria-hidden="true">✧<span>✦</span>✧</div>
      {active || reveal ? <>
        <div className="auction-ticket" key={view.sessionId}>
          <div className="auction-lot-meta"><span>Lot {game.round + 1} of {game.total}</span>{active && game.deadline !== null && <AuctionClock key={game.deadline} deadline={game.deadline} now={view.now} />}</div>
          <svg className="auction-sticker" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={marks[auction.lot.icon]} /></svg>
          <h2>{auction.lot.title}</h2>
          <p>{auction.lot.copy}</p>
          {auction.wishlist.some(wish => wish.id === auction.lot.id) && <span className="auction-wish-stamp">On your wishlist</span>}
        </div>
        <div className="auction-paddle">
          {active ? <>
            <h2>Place your bid</h2>
            <p role="status">{auction.ownBid === null ? auction.locked[1 - view.seat] ? `${partner} has locked a bid.` : 'Bids stay sealed until the reveal.' : auction.ownBid === 0 ? 'You passed.' : `Your ${auction.ownBid}-coin bid is sealed.`}</p>
            <div className="auction-bids" role="group" aria-label="Bid in coins">
              {Array.from({ length: auction.maxBid }, (_, i) => i + 1).map(coins => <button key={coins} disabled={blocked || auction.ownBid !== null} aria-label={`Bid ${coins} ${coins === 1 ? 'coin' : 'coins'}`} onClick={() => void send({ type: 'auction-bid', coins })}>{coins}</button>)}
            </div>
            <button className="auction-pass" disabled={blocked || auction.ownBid !== null} onClick={() => void send({ type: 'auction-bid', coins: 0 })}>Pass this lot</button>
            <small>Tie goes to {auction.tieSeat === view.seat ? 'you' : partner} this round.</small>
          </> : <div className="auction-reveal" key={view.sessionId}>
            <h2 role="status">{game.notice}</h2>
            <p>{auction.sale ? `${view.players[auction.sale.winner]?.name ?? 'Your team'} won it for ${auction.sale.price} ${auction.sale.price === 1 ? 'coin' : 'coins'}.` : 'The purse stays intact.'}</p>
            <div className="auction-bid-stamps">{auction.bids?.map((bid, i) => <span key={i}>{view.players[i]?.name} <strong>{bid ? bid : 'Pass'}</strong></span>)}</div>
          </div>}
        </div>
      </> : <div className="auction-interlude">
        <Image src="/assets/games/auction.webp" alt="" width={900} height={600} />
        <div>
          <h2>{finished ? 'Your date is booked.' : 'The lots are ready.'}</h2>
          {finished ? <>
            {auction.sales.length ? <ul>{auction.sales.map(({ item, price }) => <li key={item.id}>{item.title} <span>{price} {price === 1 ? 'coin' : 'coins'}</span></li>)}</ul> : <p>You kept every coin. The date is yours to improvise.</p>}
            <p>{auction.wishesHit?.every(Boolean) ? 'Both wishlists made the date.' : 'Try another auction to land a wish from both lists.'}</p>
          </> : <p>Bid from a shared purse. Only the winning bid costs coins. Unplaced bids count as passes, and the next lot opens automatically.</p>}
          <button className="button auction-start" disabled={blocked} onClick={() => void send(finished ? { type: 'play-again' } : { type: 'ready' })}>{finished ? 'New auction' : 'Open the auction'}</button>
        </div>
      </div>}
    </div>
    {!finished && <aside className="auction-wishlist" aria-label="Your private wishlist"><strong>Your secret wishlist</strong>{auction.wishlist.map(wish => <span key={wish.id}>{auction.sales.some(sale => sale.lot === wish.id) ? '✓ ' : '✧ '}{wish.title}</span>)}</aside>}
  </section>;
}
