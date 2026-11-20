import { sql } from 'drizzle-orm';
import { boolean, check, index, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { cardCategories, newGames } from '@/lib/rooms/catalog';

export const questions = pgTable('closely_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  kind: text('kind', { enum: ['card', ...newGames] }).notNull(),
  category: text('category', { enum: cardCategories }),
  text: text('text').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  answerReveal: boolean('answer_reveal').notNull().default(false),
  publicPreview: boolean('public_preview').notNull().default(false),
  answerTerms: text('answer_terms').array().notNull().default(sql`'{}'::text[]`),
}, table => [
  check('closely_questions_kind_check', sql`${table.kind} in ('card', 'same', 'bluff', 'draw')`),
  check('closely_questions_category_check', sql`(${table.kind} = 'card' and ${table.category} is not null and ${table.category} in ('deep', 'fun', 'memory', 'action', 'spicy', 'naughty', 'game')) or (${table.kind} <> 'card' and ${table.category} is null)`),
  check('closely_questions_text_check', sql`${table.text} ~ '[^[:space:]]' and length(${table.text}) <= 800 and (${table.kind} <> 'draw' or length(${table.text}) <= 100)`),
  check('closely_questions_reveal_check', sql`not ${table.answerReveal} or (${table.kind} = 'card' and ${table.category} in ('deep', 'fun', 'memory'))`),
  check('closely_questions_preview_check', sql`not ${table.publicPreview} or (${table.kind} = 'card' and ${table.category} in ('deep', 'fun', 'memory', 'action', 'game'))`),
  check('closely_questions_terms_check', sql`cardinality(${table.answerTerms}) <= 16 and array_position(${table.answerTerms}, null) is null and length(array_to_string(${table.answerTerms}, ' ')) <= 800 and (${table.kind} = 'draw' or cardinality(${table.answerTerms}) = 0)`),
  index('closely_questions_enabled_kind_idx').on(table.kind, table.id).where(sql`${table.enabled}`),
  index('closely_questions_enabled_deck_idx').on(table.category, table.id).where(sql`${table.enabled} and ${table.kind} = 'card'`),
  index('closely_questions_public_preview_idx').on(table.id).where(sql`${table.enabled} and ${table.publicPreview}`),
]);
