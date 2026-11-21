import { createHash } from 'node:crypto';
import type { Seat } from './game';

export const auctionRounds = 6;
export const bidWindow = 15000;
export const auctionRevealMs = 2800;
const catalog = [
  ['Midnight waffle bar', 'Two irons, a suspicious amount of maple syrup, and zero bedtime.', 'waffle'],
  ['Backyard planetarium', 'A projector, a pile of blankets, and your own fake constellations.', 'moon'],
  ['The wrong karaoke song', 'You both have to sing the song your partner picks.', 'mic'],
  ['One tiny disco', 'A mirror ball and room for exactly two dancers.', 'disco'],
  ['Mystery picnic basket', 'Open it together. Dessert may have been packed first.', 'basket'],
  ['Blanket fort suite', 'A flashlight, snacks, and an extremely generous checkout time.', 'moon'],
  ['Pizza shape contest', 'Same dough. One winner. The loser gets to eat theirs too.', 'waffle'],
  ['Drive-in double feature', 'One movie you love and one you’ll spend the whole ride home explaining.', 'ticket'],
  ['The dessert trolley', 'Three tiny desserts each. Trading is strongly encouraged.', 'basket'],
  ['Matching thrift fits', 'You shop for each other. The outfits are mandatory for dinner.', 'ticket'],
  ['Living-room lip sync', 'One hairbrush mic, two entrances, and one very serious encore.', 'mic'],
  ['Kitchen slow dance', 'Two fancy drinks and the song you both pretend is yours.', 'disco'],
] as const;
type Lot = { id: number; title: string; copy: string; icon: typeof catalog[number][2] };
type Sale = { lot: number; price: number; winner: Seat };
export interface Auction {
  budget: number;
  lots: number[];
  wishes: [number[], number[]];
  bids: [number | null, number | null];
  sales: Sale[];
}

export function newAuction(seed: number): Auction {
  const order = catalog.map((_, id) => ({
    id, rank: createHash('sha256').update(`${seed}:${id}`).digest('hex'),
  })).sort((a, b) => a.rank.localeCompare(b.rank)).slice(0, auctionRounds).map(({ id }) => id);
  const wishes = order.map(id => ({
    id, rank: createHash('sha256').update(`wish:${seed}:${id}`).digest('hex'),
  })).sort((a, b) => a.rank.localeCompare(b.rank)).map(({ id }) => id);
  return { budget: 12, lots: order, wishes: [wishes.slice(0, 2), wishes.slice(2, 4)], bids: [null, null], sales: [] };
}

export function settleAuction(auction: Auction, round: number, tie: Seat) {
  const [a, b] = auction.bids.map(bid => bid ?? 0);
  auction.bids = [a, b];
  const price = Math.max(a, b);
  if (!price) return 'No sale';
  const winner: Seat = a === b ? tie : a > b ? 0 : 1;
  auction.budget -= price;
  auction.sales.push({ lot: auction.lots[round], price, winner });
  return 'Sold!';
}

function lot(id: number): Lot {
  const [title, copy, icon] = catalog[id];
  return { id, title, copy, icon };
}

export function auctionView(auction: Auction, round: number, seat: Seat, revealed: boolean, finished: boolean) {
  const current = auction.lots[round];
  return {
    budget: auction.budget,
    maxBid: Math.min(4, auction.budget),
    lot: lot(current),
    wishlist: auction.wishes[seat].map(lot),
    locked: auction.bids.map(bid => bid !== null),
    ownBid: auction.bids[seat],
    bids: revealed ? auction.bids : null,
    sale: revealed ? auction.sales.find(sale => sale.lot === current) ?? null : null,
    sales: auction.sales.map(sale => ({ ...sale, item: lot(sale.lot) })),
    wishesHit: finished ? auction.wishes.map(wishes => wishes.filter(id => auction.sales.some(sale => sale.lot === id)).length) : null,
    tieSeat: (round % 2) as Seat,
  };
}
