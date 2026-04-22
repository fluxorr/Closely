import { NextResponse } from 'next/server';

const defaultGames = () => ({
  ticTacToe: {
    board: Array(9).fill(null),
    xPlayer: null as string | null,
    oPlayer: null as string | null,
    nextTurn: 'X' as 'X' | 'O',
    winner: null as string | null,
    winningLine: null as number[] | null,
  },
  rps: {
    p1: null as { id: string, choice: string | null, name: string } | null,
    p2: null as { id: string, choice: string | null, name: string } | null,
    status: 'waiting' as 'waiting' | 'reveal' | 'finished',
    winnerId: null as string | null,
  },
  tug: {
    p1: null as { id: string, score: number, name: string } | null,
    p2: null as { id: string, score: number, name: string } | null,
    winnerId: null as string | null,
  },
  memory: {
    board: [] as number[],
    flipped: [] as number[],
    matched: [] as number[],
    moves: 0,
    completed: false,
  },
  cardFlip: {
    cards: [] as number[],
    flipped: [] as number[],
    matched: [] as number[],
    moves: 0,
    completed: false,
  }
});

const roomStore: Record<string, {
  cardIndex: number;
  reactions: { id: number, emoji: string, x: number }[];
  chats: { id: string, senderDeviceId: string, senderName: string, text: string, timestamp: number }[];
  games: ReturnType<typeof defaultGames>;
}> = {};

export async function GET(request: Request, context: any) {
  const params = await context.params;
  const id = params.id;
  if (!roomStore[id]) {
    roomStore[id] = { cardIndex: Math.floor(Math.random() * 30), reactions: [], chats: [], games: defaultGames() };
  }
  return NextResponse.json(roomStore[id]);
}

export async function POST(request: Request, context: any) {
  const params = await context.params;
  const id = params.id;
  const body = await request.json();

  if (!roomStore[id]) {
    roomStore[id] = { cardIndex: Math.floor(Math.random() * 30), reactions: [], chats: [], games: defaultGames() };
  }

  if (body.type === 'CARD') {
    roomStore[id].cardIndex = body.cardIndex;
  } else if (body.type === 'REACTION') {
    roomStore[id].reactions.push(body.reaction);
    setTimeout(() => {
      roomStore[id].reactions = roomStore[id].reactions.filter(r => r.id !== body.reaction.id);
    }, 3000);
  } else if (body.type === 'CHAT') {
    roomStore[id].chats.push(body.chat);
  } else if (body.type === 'GAME_TTT') {
    roomStore[id].games.ticTacToe = body.state;
  } else if (body.type === 'GAME_RPS') {
    roomStore[id].games.rps = body.state;
  } else if (body.type === 'GAME_TUG') {
    roomStore[id].games.tug = body.state;
  } else if (body.type === 'GAME_MEMORY') {
    roomStore[id].games.memory = body.state;
  } else if (body.type === 'GAME_CARD_FLIP') {
    roomStore[id].games.cardFlip = body.state;
  }

  return NextResponse.json(roomStore[id]);
}
