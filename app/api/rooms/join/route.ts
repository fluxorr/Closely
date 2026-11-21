import type { NextRequest } from 'next/server';
import { body, guest, hash, json, newGuest, problem, setGuest, validOrigin } from '@/lib/rooms/auth';
import { join } from '@/lib/rooms/actions';
import { dispatchAfter } from '@/lib/rooms/http';
import { joinRoom } from '@/lib/rooms/store';

export async function POST(req: NextRequest) {
  if (!validOrigin(req)) return problem('Open Closely to join a room.', 403);
  const parsed = join.safeParse(await body(req, 2048));
  if (!parsed.success) return problem('Enter a valid name and room invitation.', 400);
  const key = hash(req.headers.get('x-vercel-forwarded-for') ?? 'local');
  const credential = guest(req) ?? newGuest();
  const result = await joinRoom(parsed.data, credential, `${parsed.data.code ? 'join-code' : 'join'}:${key}`);
  if (result.status === 429) return problem('Too many tries. Give it a minute.', 429);
  if (result.status === 404) return problem('That invitation couldn’t be found. Check the code with your partner.', 404);
  if (result.status === 410) return problem('This invitation has expired. Ask your partner to make a new room.', 410);
  if (result.status === 409) return problem('This room already has two people.', 409);
  if (result.status === 503) return problem('The room is busy. Try again in a moment.', 503);
  if (result.changed) dispatchAfter(result.view.id, result.view.version);
  const response = json({ id: result.view.id, view: result.view });
  setGuest(response, req, credential);
  return response;
}
