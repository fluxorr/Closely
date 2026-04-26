export interface TicTacToeState {
  board: (string | null)[];
  xPlayer: string | null;
  oPlayer: string | null;
  nextTurn: 'X' | 'O';
  winner: string | null;
  winningLine: number[] | null;
}

export interface RPSState {
  p1: { id: string; choice: string | null; name: string } | null;
  p2: { id: string; choice: string | null; name: string } | null;
  status: 'waiting' | 'reveal' | 'finished';
  winnerId: string | null;
}

export interface TriviaState {
  questionIndex: number;
  p1Answer: string | null;
  p2Answer: string | null;
  revealed: boolean;
}

export interface GameStates {
  ticTacToe: TicTacToeState | null;
  rps: RPSState | null;
  trivia: TriviaState | null;
  hotPotato: unknown;
  tug: unknown;
  memory: unknown;
  cardFlip: unknown;
}

export const DEFAULT_GAMES = (): GameStates => ({
  ticTacToe: {
    board: Array(9).fill(null),
    xPlayer: null,
    oPlayer: null,
    nextTurn: 'X',
    winner: null,
    winningLine: null,
  },
  rps: {
    p1: null,
    p2: null,
    status: 'waiting',
    winnerId: null,
  },
  trivia: {
    questionIndex: 0,
    p1Answer: null,
    p2Answer: null,
    revealed: false,
  },
  hotPotato: null,
  tug: null,
  memory: null,
  cardFlip: null,
});