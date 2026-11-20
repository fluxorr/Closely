import { publicQuestion } from '@/src/database/queries/questions';
import { json, problem } from '@/lib/rooms/auth';

export async function GET() {
  try {
    return json({ question: await publicQuestion() });
  } catch {
    return problem('The preview couldn’t load.', 503);
  }
}
