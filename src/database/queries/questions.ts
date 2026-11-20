import { and, asc, eq, gte, inArray, lt, sql, type SQL } from 'drizzle-orm';
import { questionPivot, selectionCategories, type QuestionBank } from '@/lib/rooms/questions';
import { database } from '../client';
import { questions } from '../schemas/questions';

type Database = ReturnType<typeof database>;
type Reader = Pick<Database, 'select'>;
const cardFields = { id: questions.id, category: questions.category, text: questions.text };

export function questionBank(db: Reader): QuestionBank {
  return {
    async card({ category, mode, used, seed }) {
      const available = and(eq(questions.kind, 'card'), questions.enabled,
        inArray(questions.category, selectionCategories(category, mode)),
        mode === 'reveal' ? questions.answerReveal : undefined);
      const unread = used.length ? sql`not (${JSON.stringify(used)}::jsonb ? ${questions.id}::text)` : undefined;
      const pivot = questionPivot(seed);
      const search = (range: SQL) => db.select(cardFields).from(questions)
        .where(and(available, unread, range)).orderBy(asc(questions.id)).limit(1);
      const next = (await search(gte(questions.id, pivot)))[0] ?? (await search(lt(questions.id, pivot)))[0];
      if (next?.category) return { ...next, category: next.category };
      if (!used.length) return null;
      const [any] = await db.select({ id: questions.id }).from(questions).where(available).limit(1);
      return any ? 'exhausted' : null;
    },
    async game(kind, seed, limit) {
      const pivot = questionPivot(seed);
      const search = (range: SQL, count: number) => db.select({ id: questions.id, text: questions.text, answerTerms: questions.answerTerms })
        .from(questions).where(and(eq(questions.kind, kind), questions.enabled, range)).orderBy(asc(questions.id)).limit(count);
      const first = await search(gte(questions.id, pivot), limit);
      return first.length === limit ? first : [...first, ...await search(lt(questions.id, pivot), limit - first.length)];
    },
  };
}

export async function publicQuestion(db: Reader = database()) {
  const [question] = await db.select({ text: questions.text }).from(questions)
    .where(and(questions.enabled, questions.publicPreview)).orderBy(asc(questions.id)).limit(1);
  return question ?? null;
}
