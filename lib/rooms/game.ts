import type { RoomAction, Stroke } from './actions';
import type { GameId } from './catalog';

export type Seat = 0 | 1;
type Pair<T> = [T, T];
type Phase = 'lobby' | 'ready' | 'countdown' | 'playing' | 'resolving' | 'results' | 'rematch';
const rounds = { same: 5, bluff: 6, draw: 4, ttt: 1, rps: 1, potato: 1 } satisfies Record<GameId, number>;
const times = { same: 15, bluff: 50, draw: 75, ttt: 120, rps: 30, potato: 14 } satisfies Record<GameId, number>;
const prompts = {
  same: ['Name a snack you would share at midnight.', 'What animal would make the funniest roommate?', 'Where would we go on a rainy afternoon?', 'Name a food that tastes best cold.', 'What color feels most like a Sunday?', 'Pick a movie-night drink.'],
  bluff: ['Tell me about a costume you regretted wearing.', 'What is the strangest thing you have found in your pocket?', 'Describe a time you got completely lost.', 'Tell me about a cooking disaster.', 'What made you laugh at the worst possible moment?', 'Describe a very odd thing you once collected.'],
  draw: ['A duck on roller skates', 'A cat eating spaghetti', 'A cactus in a bathtub', 'A frog riding a bicycle', 'A whale wearing a hat', 'A snail carrying an umbrella'],
};
const drawingAnswers = [ ['duck','roller skates'], ['cat','spaghetti'], ['cactus','bathtub'], ['frog','bicycle'], ['whale','hat'], ['snail','umbrella'] ];
const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
export const other = (seat: Seat): Seat => seat === 0 ? 1 : 0;
const actor = (g: Match): Seat => ((g.round + g.seed) % 2) as Seat;
const promptIndex = (g: Match, length: number) => (g.seed + g.round) % length;
const instruction = (g: Match) => ((Math.floor(g.round / 2) + g.round + Math.floor(g.seed / 2)) % 2 === 0 ? 'truth' : 'invent');
export const normalize = (value: string) => value.trim().normalize('NFKC').replace(/\s+/gu, ' ').toLowerCase();

export interface Match {
  id: string; kind: GameId; seed: number; phase: Phase; round: number; deadline: number | null;
  ready: Pair<boolean>; scores: Pair<number>; streak: number; answers: Pair<string | null>;
  story: string | null; guess: string | null; drawing: Stroke[]; misses: number;
  board: (Seat | null)[]; turn: Seat; winner: Seat | null; winningLine: number[] | null;
  holder: Seat; passAt: number; notice: string; matched: boolean;
}
export function newMatch(kind: GameId, id: string, seed: number, phase: Phase = 'lobby'): Match {
  return { id, kind, seed, phase, round: 0, deadline: null, ready: [false,false], scores: [0,0], streak: 0, answers: [null,null], story: null, guess: null, drawing: [], misses: 0, board: Array(9).fill(null), turn: 0, winner: null, winningLine: null, holder: (seed % 2) as Seat, passAt: 0, notice: '', matched: false };
}
function resolve(g: Match, text: string) {
  g.phase = 'resolving';
  g.deadline = null;
  g.notice = text;
  g.ready = [false,false];
}
function startRound(g: Match, now: number) {
  g.phase = 'playing';
  g.deadline = now + (times[g.kind] + (g.kind === 'potato' ? g.seed % 8 : 0)) * 1000;
  g.passAt = now + 500;
}
export function tickMatch(g: Match, now: number) {
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
    if (g.ready[seat]) return false;
    g.ready[seat] = true;
    if (g.phase === 'lobby') g.phase = 'ready';
    if (!g.ready.every(Boolean)) return true;
    if (g.phase === 'resolving' && g.round + 1 === rounds[g.kind]) {
      g.phase = 'results';
      return true;
    }
    if (g.phase === 'resolving') {
      g.round++;
      g.answers = [null,null];
      g.story = null;
      g.guess = null;
      g.drawing = [];
      g.misses = 0;
      g.matched = false;
      g.notice = '';
    }
    g.phase = 'countdown';
    g.deadline = now + 2500;
    return true;
  }
  if (g.phase !== 'playing') return false;
  switch (g.kind) {
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
      const words = normalize(action.text).replace(/[^\p{L}\s]/gu, '');
      const expected = drawingAnswers[promptIndex(g, drawingAnswers.length)];
      g.guess = action.text;
      g.matched = expected.every(word => (` ${words} `).includes(` ${word} `));
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
  const prompt = g.kind === 'same' || g.kind === 'bluff' || g.kind === 'draw'
    ? prompts[g.kind][promptIndex(g, prompts[g.kind].length)] : null;
  return {
    id: g.id, kind: g.kind, phase: g.phase, round: g.round, total: rounds[g.kind], deadline: g.deadline,
    ready: g.ready, scores: g.scores, streak: g.streak, locked: g.answers.map(Boolean),
    answers: done ? g.answers : null, ownAnswer: g.answers[seat], story: g.story,
    instruction: g.kind === 'bluff' && visible && (myTurn || done) ? instruction(g) : null,
    prompt: visible && (g.kind !== 'draw' || myTurn || done) ? prompt : null,
    guess: g.guess, misses: g.misses, drawing: g.drawing, actor: actor(g),
    board: g.board, turn: g.turn, winner: g.winner, winningLine: g.winningLine, holder: g.holder,
    passAt: g.passAt, notice: g.notice, matched: g.matched,
  };
}
export type GameView = ReturnType<typeof gameView>;
