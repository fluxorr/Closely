import type { NextRequest } from 'next/server';
import { roomIdSchema } from '@/lib/rooms/actions';
import { guest, json, problem, validOrigin } from '@/lib/rooms/auth';
import type { RoomContext } from '@/lib/rooms/http';
import { consume, lookup, seatOf } from '@/lib/rooms/store';
import { seatToken } from '@/lib/rooms/transport';

export async function POST(req: NextRequest, context: RoomContext) {
  if (!validOrigin(req)) return problem('Open Closely to connect.', 403);
  const { id } = await context.params;
  if (!roomIdSchema.safeParse(id).success) return problem('That invitation is invalid.', 404);
  const row = await lookup(id);
  const seat = row ? seatOf(row, guest(req)) : null;
  if (!row || seat === null) return problem('Join this room to connect.', 401);
  if (row.expires <= Date.now()) return problem('This room has expired.', 410);
  if (!process.env.ABLY_API_KEY) return problem('Live notifications aren’t configured.', 503);
  if (!await consume(`token:${id}:${seat}`, 8)) return problem('Too many reconnects. Try again in a minute.', 429);
  return json(await seatToken(id, seat));
}
