import { createHash } from 'node:crypto';
import { ALL_CARDS, type Category } from '../cards';
import type { RoomAction } from './actions';
import { canWrite, type DeckCategory } from './catalog';
import { gameView, newMatch, playMatch, type Match, type Seat } from './game';

type Mode = 'talk' | 'reveal';
type CardPhase = 'concealed' | 'revealed' | 'discussing' | 'completed' | 'skipped' | 'exhausted';
type Target = Extract<RoomAction, { type: 'cards' | 'game' | 'return' | 'next' | 'skip' }>;
type Answer = { text: string | null };
export interface Participant { credential: string; name: string; avatar: number; joinedAt: number }
interface CardSession {
  id: string; category: DeckCategory; mode: Mode; cardId: string | null; phase: CardPhase;
  answers: [Answer | null, Answer | null]; round: number;
}
interface Deck {
  cycle: number; used: string[];
}
interface HistoryEntry { id: string; category: Category; cycle: number; outcome: 'completed' | 'skipped'; at: number }
export interface RoomState {
  schema: 1; players: [Participant, Participant | null]; activity: 'hub' | 'cards' | 'game';
  card: CardSession | null; match: Match | null; proposal: { seat: Seat; target: Target } | null;
  decks: Partial<Record<Category, Deck>>; history: HistoryEntry[]; rounds: number;
  messages: { id: string; seat: Seat; text: string; at: number }[];
  reactions: { id: string; seat: Seat; emoji: string; at: number }[];
  lastActions: [Record<string, number>, Record<string, number>];
}
const prompts = new Map(ALL_CARDS.map(card => [card.id, card]));
export const legacyId = /^[A-Z0-9]{6}$/;
export const makeRoom = (p: Participant): RoomState => ({ schema: 1, players: [p,null], activity: 'hub', card: null, match: null, proposal: null, decks: {}, history: [], rounds: 0, messages: [], reactions: [], lastActions: [{},{}] });
export const sessionId = (s: RoomState) => s.activity === 'cards' ? s.card!.id : s.activity === 'game' ? `${s.match!.id}:${s.match!.round}` : 'hub';
const digest = (value: string) => createHash('sha256').update(value).digest('hex');

function eligible(category: DeckCategory, mode: Mode, source: Category) {
  if (category !== 'all') return source === category;
  return mode === 'reveal' ? canWrite(source) : source !== 'spicy' && source !== 'naughty';
}
function deal(s: RoomState, roomId: string, id: string, category: DeckCategory, mode: Mode) {
  const used = new Set(Object.values(s.decks).flatMap(deck => deck.used));
  const next = ALL_CARDS.filter(c => eligible(category, mode, c.category) && !used.has(c.id))
    .map(card => ({ card, rank: digest(`${roomId}:${category}:${s.decks[card.category]?.cycle ?? 0}:${card.id}`) }))
    .sort((a,b) => a.rank.localeCompare(b.rank))[0]?.card;
  if (next) (s.decks[next.category] ??= { cycle: 0, used: [] }).used.push(next.id);
  s.card = { id, cardId: next?.id ?? null, category, mode, phase: next ? 'concealed' : 'exhausted', answers: [null,null], round: ++s.rounds };
  s.activity = 'cards';
  s.match = null;
}
function record(s: RoomState, outcome: HistoryEntry['outcome'], now: number) {
  const card = s.card;
  if (!card?.cardId || card.phase === 'completed' || card.phase === 'skipped') return;
  const category = prompts.get(card.cardId)!.category;
  s.history.push({ id: card.cardId, category, cycle: s.decks[category]!.cycle, outcome, at: now });
  card.phase = outcome;
}
function executeTarget(s: RoomState, target: Target, roomId: string, key: string, now: number) {
  if (target.type === 'next' || target.type === 'skip') {
    const card = s.card!;
    if (target.type === 'skip') record(s, 'skipped', now);
    else if (card.phase === 'concealed' || card.phase === 'revealed' && card.mode === 'reveal') record(s, 'skipped', now);
    else record(s, 'completed', now);
    deal(s, roomId, key, card.category, card.mode);
    return;
  }
  if (s.card) record(s, 'skipped', now);
  if (target.type === 'cards') deal(s, roomId, key, target.category, target.mode);
  if (target.type === 'return') {
    s.activity = 'hub';
    s.card = null;
    s.match = null;
  }
  if (target.type === 'game') {
    s.activity = 'game';
    s.match = newMatch(target.game, key, Number.parseInt(digest(`${roomId}:${key}`).slice(0,8), 16));
    s.card = null;
  }
}
function propose(s: RoomState, seat: Seat, target: Target, id: string, key: string, now: number) {
  if (s.activity === 'hub' || s.match && s.match.phase === 'results' || s.card && ['exhausted','completed','skipped'].includes(s.card.phase) && target.type !== 'next') {
    executeTarget(s, target, id, key, now);
    return true;
  }
  if (s.proposal) return false;
  s.proposal = { seat, target };
  return true;
}
export function applyRoomAction(s: RoomState, seat: Seat, action: RoomAction, roomId: string, key: string, now: number): boolean {
  const card = s.card;
  if (action.type === 'chat') {
    s.messages = [...s.messages.slice(-79), { id: key, seat, text: action.text, at: now }];
    return true;
  }
  if (action.type === 'reaction') {
    s.reactions = [...s.reactions.filter(r => r.at + 4500 > now).slice(-11), { id: key, seat, emoji: action.emoji, at: now }];
    return true;
  }
  if (!s.players[1]) return false;
  switch (action.type) {
    case 'cards':
      if (action.mode === 'reveal' && !canWrite(action.category)) return false;
      if (card?.mode === action.mode && card.category === action.category) return false;
      return propose(s, seat, action, roomId, key, now);
    case 'game':
      if (s.match?.kind === action.game) return false;
      return propose(s, seat, action, roomId, key, now);
    case 'return':
      if (s.activity === 'hub') return false;
      return propose(s, seat, action, roomId, key, now);
    case 'next':
    case 'skip':
      if (!card || card.phase === 'exhausted') return false;
      return propose(s, seat, action, roomId, key, now);
    case 'respond': {
      if (!s.proposal || (s.proposal.seat === seat && action.accept)) return false;
      if (action.accept) executeTarget(s, s.proposal.target, roomId, key, now);
      s.proposal = null;
      return true;
    }
    case 'flip':
      if (card?.phase !== 'concealed') return false;
      card.phase = 'revealed';
      return true;
    case 'discuss':
      if (card?.phase !== 'revealed' || card.mode !== 'talk') return false;
      card.phase = 'discussing';
      return true;
    case 'shuffle':
      if (card?.phase !== 'exhausted') return false;
      for (const source of Object.keys(s.decks) as Category[]) {
        if (eligible(card.category, card.mode, source)) s.decks[source] = { cycle: s.decks[source]!.cycle + 1, used: [] };
      }
      deal(s, roomId, key, card.category, card.mode);
      return true;
    case 'card-answer':
      if (card?.phase !== 'revealed' || card.mode !== 'reveal' || card.answers[seat]) return false;
      if (action.text === null) {
        card.answers = [null,null];
        record(s, 'skipped', now);
        return true;
      }
      card.answers[seat] = { text: action.text };
      if (card.answers.every(Boolean)) record(s, 'completed', now);
      return true;
    case 'play-again':
      if (s.match?.phase !== 'results') return false;
      s.match = newMatch(s.match.kind, key, Number.parseInt(digest(key).slice(0,8),16), 'rematch');
      s.match.ready[seat] = true;
      return true;
    default:
      return !!s.match && playMatch(s.match, seat, action, now);
  }
}

export function roomView(row: { id: string; version: number; state: RoomState }, seat: Seat, now: number, presence: [number, number], invite: string) {
  const { state: s } = row;
  const card = s.card;
  const revealed = card && card.phase !== 'concealed';
  const complete = card && (card.phase === 'completed' || card.phase === 'skipped');
  const cardSkipped = complete && card.phase === 'skipped';
  let answers: [Answer | null, Answer | null] | null = null;
  if (complete && !cardSkipped) answers = card.answers;
  return {
    id: row.id, version: row.version, now, seat, invite,
    sessionId: sessionId(s), activity: s.activity, proposal: s.proposal,
    players: s.players.map((p, i) => p ? { name: p.name, avatar: p.avatar, online: i === seat || presence[i] + 14000 > now } : null),
    card: card ? {
      id: card.id, cardId: card.cardId, category: card.category, phase: card.phase, mode: card.mode,
      sourceCategory: card.cardId ? prompts.get(card.cardId)?.category : undefined,
      text: card.cardId && revealed ? prompts.get(card.cardId)?.text : null,
      round: card.round, ready: card.answers.map(Boolean), answers, skipped: cardSkipped,
    } : null,
    game: s.match ? gameView(s.match, seat) : null,
    messages: s.messages, reactions: s.reactions.filter(r => r.at + 4500 > now), history: s.history,
  };
}
export type RoomView = ReturnType<typeof roomView>;
