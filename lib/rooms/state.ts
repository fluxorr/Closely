import { createHash } from 'node:crypto';
import type { RoomAction } from './actions';
import { canWrite, usesPrompts, type CardCategory, type DeckCategory, type GameId } from './catalog';
import { gameView, newMatch, playMatch, roundLimits, type Match, type Seat } from './game';
import { selectionCategories, type CardMode, type CardQuestion, type QuestionBank } from './questions';

type CardPhase = 'concealed' | 'revealed' | 'discussing' | 'completed' | 'skipped' | 'exhausted' | 'empty';
type Target = Extract<RoomAction, { type: 'cards' | 'game' | 'return' | 'next' | 'skip' }>;
type Answer = { text: string | null };
export interface Participant { credential: string; name: string; avatar: number; joinedAt: number }
interface CardSession {
  id: string; category: DeckCategory; mode: CardMode; cardId: string | null; phase: CardPhase;
  answers: [Answer | null, Answer | null]; round: number;
  content?: Pick<CardQuestion, 'category' | 'text'>;
}
interface Deck {
  cycle: number; used: string[];
}
interface HistoryEntry { id: string; category: CardCategory; cycle: number; outcome: 'completed' | 'skipped'; at: number }
export interface RoomState {
  schema: 1; players: [Participant, Participant | null]; activity: 'hub' | 'cards' | 'game';
  card: CardSession | null; match: Match | null; proposal: { seat: Seat; target: Target } | null;
  decks: Partial<Record<CardCategory, Deck>>; history: HistoryEntry[]; rounds: number;
  messages: { id: string; seat: Seat; text: string; at: number }[];
  reactions: { id: string; seat: Seat; emoji: string; at: number }[];
  lastActions: [Record<string, number>, Record<string, number>];
}
export const legacyId = /^[A-Z0-9]{6}$/;
export const makeRoom = (p: Participant): RoomState => ({ schema: 1, players: [p,null], activity: 'hub', card: null, match: null, proposal: null, decks: {}, history: [], rounds: 0, messages: [], reactions: [], lastActions: [{},{}] });
export const sessionId = (s: RoomState) => s.activity === 'cards' ? s.card!.id : s.activity === 'game' ? `${s.match!.id}:${s.match!.round}` : 'hub';
const digest = (value: string) => createHash('sha256').update(value).digest('hex');

type ActionResult = boolean | 'missing-questions';

async function deal(s: RoomState, roomId: string, id: string, category: DeckCategory, mode: CardMode, bank: QuestionBank) {
  const sources = selectionCategories(category, mode);
  const used = sources.flatMap(source => s.decks[source]?.used ?? []);
  const cycles = sources.map(source => s.decks[source]?.cycle ?? 0).join(',');
  const next = await bank.card({ category, mode, used, seed: `${roomId}:${category}:${mode}:${cycles}` });
  let cardId: string | null = null;
  let content: CardSession['content'];
  if (next && next !== 'exhausted') {
    cardId = next.id;
    content = { category: next.category, text: next.text };
    (s.decks[next.category] ??= { cycle: 0, used: [] }).used.push(next.id);
  }
  s.card = { id, cardId, content, category, mode, phase: cardId ? 'concealed' : next === 'exhausted' ? 'exhausted' : 'empty', answers: [null,null], round: cardId ? ++s.rounds : s.rounds };
  s.activity = 'cards';
  s.match = null;
}
function record(s: RoomState, outcome: HistoryEntry['outcome'], now: number) {
  const card = s.card;
  if (!card?.cardId || !card.content || card.phase === 'completed' || card.phase === 'skipped') return;
  const { category } = card.content;
  s.history.push({ id: card.cardId, category, cycle: s.decks[category]?.cycle ?? 0, outcome, at: now });
  card.phase = outcome;
}
async function startMatch(kind: GameId, seed: string, key: string, bank: QuestionBank, phase: 'lobby' | 'rematch') {
  const questions = usesPrompts(kind) ? await bank.game(kind, seed, roundLimits[kind]) : [];
  if (usesPrompts(kind) && !questions.length) return null;
  return newMatch(kind, key, Number.parseInt(digest(seed).slice(0,8), 16), phase, questions);
}
async function executeTarget(s: RoomState, target: Target, roomId: string, key: string, now: number, bank: QuestionBank): Promise<ActionResult> {
  if (target.type === 'next' || target.type === 'skip') {
    const card = s.card!;
    const unfinished = card.phase === 'concealed' || card.phase === 'revealed' && card.mode === 'reveal';
    record(s, target.type === 'skip' || unfinished ? 'skipped' : 'completed', now);
    await deal(s, roomId, key, card.category, card.mode, bank);
    return true;
  }
  if (target.type === 'game') {
    const match = await startMatch(target.game, `${roomId}:${key}`, key, bank, 'lobby');
    if (!match) return 'missing-questions';
    record(s, 'skipped', now);
    s.activity = 'game';
    s.match = match;
    s.card = null;
    return true;
  }
  record(s, 'skipped', now);
  if (target.type === 'cards') await deal(s, roomId, key, target.category, target.mode, bank);
  else {
    s.activity = 'hub';
    s.card = null;
    s.match = null;
  }
  return true;
}
async function propose(s: RoomState, seat: Seat, target: Target, id: string, key: string, now: number, bank: QuestionBank): Promise<ActionResult> {
  if (s.activity === 'hub' || s.match?.phase === 'results' || s.card && ['empty','exhausted','completed','skipped'].includes(s.card.phase) && target.type !== 'next') {
    return executeTarget(s, target, id, key, now, bank);
  }
  if (s.proposal) return false;
  s.proposal = { seat, target };
  return true;
}

export function hasLegacyActivity(s: RoomState) {
  return !!(s.card?.cardId && !s.card.content || s.match && usesPrompts(s.match.kind) && !s.match.questions?.length);
}
export function resetLegacyActivity(s: RoomState) {
  if (!hasLegacyActivity(s)) return false;
  s.activity = 'hub';
  s.card = null;
  s.match = null;
  s.proposal = null;
  return true;
}

export async function applyRoomAction(s: RoomState, seat: Seat, action: RoomAction, roomId: string, key: string, now: number, bank: QuestionBank): Promise<ActionResult> {
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
      return propose(s, seat, action, roomId, key, now, bank);
    case 'game':
      if (s.match?.kind === action.game) return false;
      return propose(s, seat, action, roomId, key, now, bank);
    case 'return':
      if (s.activity === 'hub') return false;
      return propose(s, seat, action, roomId, key, now, bank);
    case 'next':
    case 'skip':
      if (!card?.cardId) return false;
      return propose(s, seat, action, roomId, key, now, bank);
    case 'respond': {
      if (!s.proposal || (s.proposal.seat === seat && action.accept)) return false;
      if (action.accept) {
        const result = await executeTarget(s, s.proposal.target, roomId, key, now, bank);
        if (result !== true) return result;
      }
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
      if (!card || !['exhausted', 'empty'].includes(card.phase)) return false;
      if (card.phase === 'exhausted') {
        for (const source of selectionCategories(card.category, card.mode)) {
          const deck = s.decks[source];
          if (deck) s.decks[source] = { cycle: deck.cycle + 1, used: [] };
        }
      }
      await deal(s, roomId, key, card.category, card.mode, bank);
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
    case 'play-again': {
      if (s.match?.phase !== 'results') return false;
      const match = await startMatch(s.match.kind, `${roomId}:${key}`, key, bank, 'rematch');
      if (!match) return 'missing-questions';
      s.match = match;
      match.ready[seat] = true;
      return true;
    }
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
      sourceCategory: card.content?.category,
      text: revealed ? card.content?.text ?? null : null,
      round: card.round, ready: card.answers.map(Boolean), answers, skipped: cardSkipped,
    } : null,
    game: s.match ? gameView(s.match, seat) : null,
    messages: s.messages, reactions: s.reactions.filter(r => r.at + 4500 > now), history: s.history,
  };
}
export type RoomView = ReturnType<typeof roomView>;
