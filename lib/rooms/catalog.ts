const decks = ['deep', 'fun', 'memory', 'action', 'spicy', 'naughty'] as const;
export const categories = ['all', ...decks] as const;
export const cardCategories = [...decks, 'game'] as const;
export type DeckCategory = typeof categories[number];
export type CardCategory = typeof cardCategories[number];
export const writtenCategories = ['deep', 'fun', 'memory'] as const;
export const randomCategories = ['deep', 'fun', 'memory', 'action', 'game'] as const;
export const canWrite = (category: DeckCategory | CardCategory) => category === 'all' || writtenCategories.some(value => value === category);

export const games = {
  auction: { title: 'Date Night Auction', tagline: 'Twelve coins. Two secret wishlists. One wildly overbooked date.', type: 'Blind bids', minutes: '2–3 min', difficulty: 'Easy', art: '/assets/games/auction.webp', instructions: 'Use one shared purse to buy date upgrades. Highest sealed bid wins and is the only bid charged. Ties alternate. Build a date with at least one wish from each list.', status: 'available', action: 'auction-bid' },
  never: { title: 'Never Have I Ever', tagline: 'Two private picks. The good stories come after.', type: 'Confessions', minutes: 'At your pace', difficulty: 'Easy', art: '/assets/games/never.webp', instructions: 'Pick I have or Neverrr. Both choices stay sealed until you’ve both answered. Pass any prompt and take as long as you like.', status: 'available', action: 'never-answer' },
  same: { title: 'Same Brain', tagline: 'Think alike and see where your minds meet.', type: 'Cooperative', minutes: '2–4 min', difficulty: 'Easy', art: '/assets/games/same.webp', instructions: 'Write the first answer that comes to mind. Answers match when the words are the same, ignoring case and extra spaces. Match twice in a row for a bonus.', status: 'available', action: 'answer' },
  bluff: { title: 'Bluff My Love', tagline: 'Tell a good story. Give nothing away.', type: 'Social', minutes: '4–8 min', difficulty: 'Easy', art: '/assets/games/bluff.webp', instructions: 'The storyteller privately gets Truth or Invent. After reading the story, the other person guesses the instruction. Take turns telling stories.', status: 'available', action: 'story / guess' },
  draw: { title: 'Draw Me Wrong', tagline: 'Bad drawing is practically encouraged.', type: 'Creative', minutes: '3–5 min', difficulty: 'Easy', art: '/assets/games/draw.webp', instructions: 'One person sketches a secret prompt. The other types guesses. Guess early for a time bonus. Switch roles each round.', status: 'available', action: 'stroke / drawing-guess' },
  ttt: { title: 'Tic-Tac-Toe', tagline: 'Three in a row takes the board.', type: 'Classic', minutes: '1–2 min', difficulty: 'Easy', art: '/assets/games/ttt.svg', instructions: 'Take turns placing your mark. Make a line of three before your partner does.', status: 'available', action: 'move' },
  rps: { title: 'Rock Paper Scissors', tagline: 'Lock in a move and reveal it together.', type: 'Classic', minutes: '1 min', difficulty: 'Easy', art: '/assets/games/rps.svg', instructions: 'Choose rock, paper or scissors privately. Rock beats scissors, scissors beat paper, and paper beats rock.', status: 'available', action: 'choice' },
  potato: { title: 'Hot Potato', tagline: 'Pass it before the clock runs out.', type: 'Classic', minutes: '1 min', difficulty: 'Easy', art: '/assets/games/potato.svg', instructions: 'Keep passing the potato. Each catch needs a short pause before you can pass. Whoever is holding it when it pops loses.', status: 'available', action: 'pass-potato' },
} as const;
export type GameId = keyof typeof games;
export const gameIds = ['auction', 'never', 'same', 'bluff', 'draw', 'ttt', 'rps', 'potato'] as const satisfies readonly GameId[];
export const promptGames = ['never', 'same', 'bluff', 'draw'] as const;
export const newGames = ['auction', ...promptGames] as const;
export type PromptGame = typeof promptGames[number];
export const usesPrompts = (kind: GameId): kind is PromptGame => promptGames.some(game => game === kind);
export const classicGames = ['ttt', 'rps', 'potato'] as const;
export const reactions = ['❤️', '🔥', '😂', '🥺', '😘', '😴'] as const;
export const inkColors = ['ink', 'rose', 'sage', 'sky'] as const;
