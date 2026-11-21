import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { questionPivot, selectionCategories, type QuestionBank } from '@/lib/rooms/questions';
import { database, queryRows } from '../client';
import { questions } from '../schemas/questions';

type CardRow = Pick<typeof questions.$inferSelect, 'id' | 'category' | 'text'> & { priority: number };
type GameRow = Pick<typeof questions.$inferSelect, 'id' | 'text' | 'answerTerms'>;

export const questionBank: QuestionBank = {
  async card({ category, mode, used, seed }) {
    const available = and(eq(questions.kind, 'card'), questions.enabled,
      inArray(questions.category, selectionCategories(category, mode)),
      mode === 'reveal' ? questions.answerReveal : undefined);
    const unread = and(available, used.length ? sql`not (${JSON.stringify(used)}::jsonb ? id::text)` : undefined);
    const pivot = questionPivot(seed);
    const [next] = await queryRows<CardRow>(sql`
      (select id, category, text, 0 as priority from ${questions} where ${unread} and id >= ${pivot} order by id limit 1)
      union all
      (select id, category, text, 1 as priority from ${questions} where ${unread} and id < ${pivot} order by id limit 1)
      ${used.length ? sql`union all (select id, category, text, 2 as priority from ${questions} where ${available} limit 1)` : sql.empty()}
      order by priority limit 1
    `);
    if (!next?.category) return null;
    if (next.priority === 2) return 'exhausted';
    return { id: next.id, category: next.category, text: next.text };
  },
  async game(kind, seed, limit, avoid = []) {
    const pivot = questionPivot(seed);
    if (kind === 'never') {
      const played = avoid.length ? sql`(${JSON.stringify(avoid)}::jsonb ? id::text),` : sql.empty();
      return queryRows<GameRow & { mature: boolean }>(sql`
        select id, text, answer_terms as "answerTerms", mature
        from (
          select id, text, answer_terms, mature,
            row_number() over (partition by mature order by ${played} id < ${pivot}, id) as position
          from ${questions} where kind = 'never' and enabled
        ) as candidates
        where position <= ${limit}
        order by mature, position
      `);
    }
    if (avoid.length) return queryRows<GameRow>(sql`
      select id, text, answer_terms as "answerTerms"
      from ${questions} where kind = ${kind} and enabled
      order by (${JSON.stringify(avoid)}::jsonb ? id::text), id < ${pivot}, id
      limit ${limit}
    `);
    return queryRows<GameRow>(sql`
      select id, text, answer_terms as "answerTerms"
      from (
        (select id, text, answer_terms, 0 as priority from ${questions}
          where kind = ${kind} and enabled and id >= ${pivot} order by id limit ${limit})
        union all
        (select id, text, answer_terms, 1 as priority from ${questions}
          where kind = ${kind} and enabled and id < ${pivot} order by id limit ${limit})
      ) as candidates
      order by priority, id limit ${limit}
    `);
  },
};

export async function publicQuestion() {
  const [question] = await database().select({ text: questions.text }).from(questions)
    .where(and(questions.enabled, questions.publicPreview)).orderBy(asc(questions.id)).limit(1);
  return question ?? null;
}
