import type { NextRequest } from 'next/server';
import { body, guest, hash, json, newGuest, problem, setGuest, validOrigin } from '@/lib/rooms/auth';
import { entry } from '@/lib/rooms/actions';
import { consume, createRoom } from '@/lib/rooms/store';

export async function POST(req: NextRequest) {
  if (!validOrigin(req)) return problem('Open Closely to make a room.', 403);
  const parsed = entry.safeParse(await body(req, 2048));
  if (!parsed.success) return problem('Enter a name with up to 32 characters.', 400);
  const key = hash(req.headers.get('x-vercel-forwarded-for') ?? 'local');
  if (!await consume(`create:${key}`, 20)) return problem('Too many new rooms. Try again in a minute.', 429);
  const credential = guest(req) ?? newGuest();
  const id = await createRoom(parsed.data, credential);
  const response = json({ id }, 201);
  setGuest(response, req, credential);
  return response;
}
