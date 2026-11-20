import { after, type NextRequest } from 'next/server';
import { envelope, roomIdSchema } from './actions';
import { body, guest, json, problem, validOrigin } from './auth';
import { mutateRoom, readRoom } from './store';
import { dispatch } from './transport';

export type RoomContext = { params: Promise<{ id: string }> };
export const dispatchAfter = (id: string) => after(async () => {
  await dispatch(id).catch(() => console.error('Closely realtime dispatch deferred'));
});
export async function GET(req: NextRequest, context: RoomContext) {
  const { id } = await context.params;
  if (!roomIdSchema.safeParse(id).success) return problem('That invitation is invalid.', 404);
  const result = await readRoom(id, guest(req));
  if (result.status === 410) return problem('This room has expired.', 410);
  if (result.status !== 200) return problem('Join this room to play.', 401);
  if (result.changed) dispatchAfter(id);
  return json(result.view);
}
export async function POST(req: NextRequest, context: RoomContext) {
  if (!validOrigin(req)) return problem('This action needs to come from Closely.', 403);
  const { id } = await context.params;
  if (!roomIdSchema.safeParse(id).success) return problem('That invitation is invalid.', 404);
  const parsed = envelope.safeParse(await body(req));
  if (!parsed.success) return problem('This action is invalid.', 400);
  const result = await mutateRoom(id, guest(req), parsed.data);
  if ('changed' in result && result.changed) dispatchAfter(id);
  if (result.status === 200) return json(result.view);
  if ('view' in result) return json({ error: result.error, view: result.view }, result.status);
  return result.status === 410 ? problem('This room has expired.', 410) : problem('Join this room to play.', 401);
}
