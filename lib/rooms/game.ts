import type { RoomAction, Stroke } from './actions';
import type { GameId } from './catalog';
import type { GameQuestion } from './questions';

export type Seat = 0 | 1;
type Pair<T> = [T, T];
type Phase = 'lobby' | 'ready' | 'countdown' | 'playing' | 'resolving' | 'results' | 'rematch';
export const roundLimits = { never: 8, same: 5, bluff: 6, draw: 4, ttt: 1, rps: 1, potato: 1 } satisfies Record<GameId, number>;
const times = { same: 15, bluff: 50, draw: 75, ttt: 120, rps: 30, potato: 14 } satisfies Record<Exclude<GameId, 'never'>, number>;
const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
export const other = (seat: Seat): Seat => seat === 0 ? 1 : 0;
const actor = (g: Match): Seat => ((g.round + g.seed) % 2) as Seat;
const instruction = (g: Match): 'truth' | 'invent' => ((Math.floor(g.round / 2) + g.round + Math.floor(g.seed / 2)) % 2 === 0 ? 'truth' : 'invent');
export const normalize = (value: string) => value.trim().normalize('NFKC').replace(/\s+/gu, ' ').toLowerCase();

export interface Match {
  id: string; kind: GameId; seed: number; phase: Phase; round: number; deadline: number | null;
  ready: Pair<boolean>; scores: Pair<number>; streak: number; answers: Pair<string | null>;
  story: string | null; guess: string | null; drawing: Stroke[]; misses: number;
  board: (Seat | null)[]; turn: Seat; winner: Seat | null; winningLine: number[] | null;
  holder: Seat; passAt: number; notice: string; matched: boolean;
  questions?: GameQuestion[];
  afterHours?: Pair<boolean>;
  afterHoursQuestions?: GameQuestion[];
  revealedRounds?: number;
}
export function newMatch(kind: GameId, id: string, seed: number, phase: Phase = 'lobby', questions: GameQuestion[] = []): Match {
  const match: Match = { id, kind, seed, phase, questions, round: 0, deadline: null, ready: [false,false], scores: [0,0], streak: 0, answers: [null,null], story: null, guess: null, drawing: [], misses: 0, board: Array(9).fill(null), turn: 0, winner: null, winningLine: null, holder: (seed % 2) as Seat, passAt: 0, notice: '', matched: false };
  if (kind !== 'never') return match;
  return {
    ...match, questions: questions.filter(question => !question.mature), afterHours: [false, false],
    afterHoursQuestions: questions.filter(question => question.mature), revealedRounds: 0,
  };
}
const totalRounds = (g: Match) => g.questions?.length || roundLimits[g.kind];
const guessWords = (text: string) => normalize(text).replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/gu, ' ').trim();

const neverRevealMs = 3000;

function resolve(g: Match, text: string, deadline: number | null = null) {
  g.phase = 'resolving';
  g.deadline = deadline;
  g.notice = text;
  g.ready = [false,false];
}
function startRound(g: Match, now: number) {
  g.phase = 'playing';
  g.deadline = g.kind === 'never' ? null : now + (times[g.kind] + (g.kind === 'potato' ? g.seed % 8 : 0)) * 1000;
  g.passAt = now + 500;
}
function resetRound(g: Match) {
  g.round++;
  g.answers = [null, null];
  g.story = null;
  g.guess = null;
  g.drawing = [];
  g.misses = 0;
  g.matched = false;
  g.notice = '';
}

export function tickMatch(g: Match, now: number) {
  if (g.kind === 'never' && g.phase === 'resolving') {
    if (g.deadline !== null && now < g.deadline) return false;
    if (g.round + 1 === totalRounds(g)) {
      g.phase = 'results';
      g.deadline = null;
      g.answers = [null, null];
    } else {
      resetRound(g);
      startRound(g, now);
    }
    return true;
  }
  if (g.deadline === null || now < g.deadline) return false;
  if (g.phase === 'countdown') {
    startRound(g, g.deadline);
    tickMatch(g, now);
    return true;
  }
  if (g.phase !== 'playing') return false;
  if (g.kind === 'potato') {
    g.winner = other(g.holder);
    g.scores[g.winner]++;
  }
  if (g.kind === 'same') g.streak = 0;
  resolve(g, g.kind === 'potato' ? 'Pop! The potato went off.' : 'Time’s up.');
  return true;
}

export function playMatch(g: Match, seat: Seat, action: RoomAction, now: number): boolean {
  if (action.type === 'ready' && ['lobby','ready','rematch','resolving'].includes(g.phase)) {
    if (g.ready[seat] || (g.kind === 'never' && g.phase === 'resolving')) return false;
    const choosingDeck = g.kind === 'never';
    if (choosingDeck && g.afterHours) g.afterHours[seat] = action.afterHours === true;
    g.ready[seat] = true;
    if (g.phase === 'lobby') g.phase = 'ready';
    if (!g.ready.every(Boolean)) return true;
    if (g.phase === 'resolving' && g.round + 1 === totalRounds(g)) {
      g.phase = 'results';
      return true;
    }
    if (g.phase === 'resolving') {
      resetRound(g);
    }
    if (g.kind === 'never') {
      if (choosingDeck && g.afterHours?.every(Boolean)) {
        const mature = g.afterHoursQuestions ?? [];
        g.questions = g.questions?.map((question, i) => i % 2 === 1 ? mature[Math.floor(i / 2)] ?? question : question);
      }
      delete g.afterHoursQuestions;
      startRound(g, now);
      return true;
    }
    g.phase = 'countdown';
    g.deadline = now + 2500;
    return true;
  }
  if (g.phase !== 'playing') return false;
  switch (g.kind) {
    case 'never': {
      if (action.type === 'never-pass') {
        g.answers = [null, null];
        resolve(g, 'Prompt passed.', now + neverRevealMs);
        return true;
      }
      if (action.type !== 'never-answer' || g.answers[seat] !== null) return false;
      g.answers[seat] = action.choice;
      if (!g.answers.every(Boolean)) return true;
      g.revealedRounds = (g.revealedRounds ?? 0) + 1;
      g.matched = g.answers[0] === g.answers[1];
      resolve(g, g.matched ? 'We match!' : 'We don’t match.', now + neverRevealMs);
      return true;
    }
    case 'same': {
      if (action.type !== 'answer' || g.answers[seat] !== null) return false;
      g.answers[seat] = action.text;
      if (!g.answers.every(Boolean)) return true;
      g.matched = normalize(g.answers[0]!) === normalize(g.answers[1]!);
      g.streak = g.matched ? g.streak + 1 : 0;
      if (g.matched) g.scores = g.scores.map(s => s + (g.streak >= 2 ? 2 : 1)) as Pair<number>;
      resolve(g, g.matched ? 'Same brain!' : 'Two different thoughts.');
      return true;
    }
    case 'bluff': {
      if (action.type === 'story' && actor(g) === seat && g.story === null) {
        g.story = action.text;
        g.deadline = now + 25000;
        return true;
      }
      if (action.type !== 'guess' || actor(g) === seat || g.story === null) return false;
      g.guess = action.choice;
      g.matched = action.choice === instruction(g);
      g.scores[g.matched ? seat : other(seat)]++;
      resolve(g, g.matched ? 'You saw right through it.' : 'That story fooled you two.');
      return true;
    }
    case 'draw': {
      if (actor(g) === seat) {
        if (action.type === 'stroke' && g.drawing.length < 200) g.drawing.push(action.stroke);
        else if (action.type === 'drawing-undo' && g.drawing.length) {
          const group = g.drawing.at(-1)!.group;
          g.drawing = g.drawing.filter(stroke => stroke.group !== group);
        }
        else if (action.type === 'drawing-clear') g.drawing = [];
        else return false;
        return true;
      }
      if (action.type !== 'drawing-guess') return false;
      const question = g.questions?.[g.round];
      if (!question) return false;
      const words = guessWords(action.text);
      const terms = question.answerTerms.map(guessWords).filter(Boolean);
      g.guess = action.text;
      g.matched = !!words && (words === guessWords(question.text) || terms.length > 0 && terms.every(term => (` ${words} `).includes(` ${term} `)));
      if (g.matched) {
        const bonus = Math.floor(Math.max(0, (g.deadline! - now) / 1000) / 20);
        g.scores[seat] += 2 + bonus;
        g.scores[other(seat)]++;
        resolve(g, 'You got the picture!');
      } else g.misses++;
      return true;
    }
    case 'ttt': {
      if (action.type !== 'move' || g.turn !== seat || g.board[action.cell] !== null) return false;
      g.board[action.cell] = seat;
      g.winningLine = lines.find(line => line.every(cell => g.board[cell] === seat)) ?? null;
      if (g.winningLine) {
        g.winner = seat;
        g.scores[seat]++;
        resolve(g, 'Three in a row!');
      } else if (g.board.every(cell => cell !== null)) resolve(g, 'It’s a tie.');
      else g.turn = other(seat);
      return true;
    }
    case 'rps': {
      if (action.type !== 'choice' || g.answers[seat] !== null) return false;
      g.answers[seat] = action.choice;
      if (!g.answers.every(Boolean)) return true;
      const wins: Record<string, string> = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
      if (g.answers[0] !== g.answers[1]) {
        g.winner = wins[g.answers[0]!] === g.answers[1] ? 0 : 1;
        g.scores[g.winner]++;
      }
      resolve(g, g.winner === null ? 'It’s a tie.' : 'The moves are in.');
      return true;
    }
    case 'potato': {
      if (action.type !== 'pass-potato' || g.holder !== seat || now < g.passAt) return false;
      g.holder = other(seat);
      g.passAt = now + 600;
      return true;
    }
  }
}

export function gameView(g: Match, seat: Seat) {
  const done = g.phase === 'results' || g.phase === 'resolving';
  const visible = done || g.phase === 'playing';
  const myTurn = actor(g) === seat;
  const prompt = g.questions?.[g.round]?.text ?? null;
  return {
    id: g.id, kind: g.kind, phase: g.phase, round: g.round, total: totalRounds(g), deadline: g.deadline,
    ready: g.ready, scores: g.scores, streak: g.streak, locked: g.answers.map(Boolean),
    answers: done && (g.kind !== 'never' || g.phase === 'resolving') ? g.answers : null, ownAnswer: g.kind === 'never' && g.phase === 'results' ? null : g.answers[seat], story: g.story,
    instruction: g.kind === 'bluff' && visible && (myTurn || done) ? instruction(g) : null,
    prompt: visible && (g.kind !== 'draw' || myTurn || done) ? prompt : null,
    guess: g.guess, misses: g.misses, drawing: g.drawing, actor: actor(g),
    board: g.board, turn: g.turn, winner: g.winner, winningLine: g.winningLine, holder: g.holder,
    passAt: g.passAt, notice: g.notice, matched: g.matched,
    never: g.kind === 'never' ? { mature: visible && g.questions?.[g.round]?.mature === true, revealed: g.revealedRounds ?? 0 } : undefined,
  };
}
export type GameView = ReturnType<typeof gameView>;
