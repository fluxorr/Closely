export type Category = 'deep' | 'fun' | 'memory' | 'game' | 'action' | 'spicy' | 'naughty';

export interface CardInfo {
  id: string;
  category: Category;
  text: string;
}