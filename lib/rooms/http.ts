import { after, type NextRequest } from 'next/server';
import { envelope, roomIdSchema } from './actions';
import { body, guest, json, problem, validOrigin } from './auth';
import { mutateRoom, readRoom, recordPresence } from './store';
import { publishVersion } from './transport';

export type RoomContext = { params: Promise<{ id: string }> };
export const dispatchAfter = (id: string, version: number) => after(async () => {
  await publishVersion(id, version).catch(() => console.error('Closely realtime dispatch deferred'));
});
export async function GET(req: NextRequest, context: RoomContext) {
  const { id } = await context.params;
  if (!roomIdSchema.safeParse(id).success) return problem('That invitation is invalid.', 404);
  const result = await readRoom(id, guest(req));
  if (result.status === 410) return problem('This room has expired.', 410);
  if (result.status === 503) return problem('The room is busy. Try again in a moment.', 503);
  if (result.status !== 200) return problem('Join this room to play.', 401);
  const { seat, now, version } = result.view;
  if (result.changed) dispatchAfter(id, version);
  else if (result.heartbeat) after(() => recordPresence(id, seat, now));
  return json(result.view);
}
export async function POST(req: NextRequest, context: RoomContext) {
  if (!validOrigin(req)) return problem('This action needs to come from Closely.', 403);
  const { id } = await context.params;
  if (!roomIdSchema.safeParse(id).success) return problem('That invitation is invalid.', 404);
  const parsed = envelope.safeParse(await body(req));
  if (!parsed.success) return problem('This action is invalid.', 400);
  const result = await mutateRoom(id, guest(req), parsed.data);
  if ('changed' in result && result.changed) dispatchAfter(id, result.view.version);
  if (result.status === 200) return json(result.view);
  if ('view' in result) return json({ error: result.error, view: result.view }, result.status);
  if (result.status === 503) return problem('The room is busy. Try again in a moment.', 503);
  return result.status === 410 ? problem('This room has expired.', 410) : problem('Join this room to play.', 401);
}
