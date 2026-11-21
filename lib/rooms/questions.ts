import { createHash } from 'node:crypto';
import { randomCategories, writtenCategories, type CardCategory, type DeckCategory, type PromptGame } from './catalog';

export type CardMode = 'talk' | 'reveal';
export interface CardQuestion { id: string; category: CardCategory; text: string }
export interface GameQuestion { id: string; text: string; answerTerms: string[]; mature?: boolean }
export interface CardSelection {
  category: DeckCategory;
  mode: CardMode;
  used: string[];
  seed: string;
}
export interface QuestionBank {
  card(selection: CardSelection): Promise<CardQuestion | 'exhausted' | null>;
  game(kind: PromptGame, seed: string, limit: number, avoid?: readonly string[]): Promise<GameQuestion[]>;
}

export function selectionCategories(category: DeckCategory, mode: CardMode): readonly CardCategory[] {
  if (category !== 'all') return [category];
  return mode === 'reveal' ? writtenCategories : randomCategories;
}

// Random UUIDs give the ordered index a stable rotation per room and deck cycle.
export function questionPivot(seed: string) {
  const digest = createHash('sha256').update(seed).digest('hex');
  return `${digest.slice(0, 8)}-${digest.slice(8, 12)}-${digest.slice(12, 16)}-${digest.slice(16, 20)}-${digest.slice(20, 32)}`;
}
