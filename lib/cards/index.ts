import { type CardInfo, type Category } from './types';
import { CARDS } from './data';
import { SPICY_CARDS, NAUGHTY_CARDS } from './spicy';
import { MORE_SPICY_CARDS } from './spicy2';
import { LAST_CARDS } from './last';
import { CARDS as MORE_FUN_CARDS } from './extended';

export const ALL_CARDS: CardInfo[] = [
  ...CARDS,
  ...SPICY_CARDS,
  ...NAUGHTY_CARDS,
  ...MORE_SPICY_CARDS,
  ...LAST_CARDS,
  ...MORE_FUN_CARDS,
];

export function getCardsByCategory(cards: CardInfo[], category: Category | 'all'): CardInfo[] {
  if (category === 'all') return cards;
  return cards.filter(c => c.category === category);
}

export function getCardIndices(cards: CardInfo[], category: Category | 'all'): number[] {
  if (category === 'all') return cards.map((_, i) => i);
  return cards.map((c, i) => c.category === category ? i : -1).filter(i => i !== -1);
}

export type { Category, CardInfo };
export { CARDS, SPICY_CARDS, NAUGHTY_CARDS, MORE_SPICY_CARDS, LAST_CARDS, MORE_FUN_CARDS };